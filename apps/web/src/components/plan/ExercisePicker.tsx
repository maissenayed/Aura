'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Search, X } from 'lucide-react';
import {
  CatalogExercise,
  DISCIPLINES,
  Discipline,
  EXERCISE_BY_ID,
  EXERCISE_CATALOG,
  EXERCISE_CATEGORIES,
  LIFT_BY_ID,
} from '../../data/campaignCatalog';

const RESULT_LIMIT = 60;

const CATEGORY_LABEL = new Map(EXERCISE_CATEGORIES.map((category) => [category.id, category.label]));

/** Exercises that log a lift or keep a working weight come first — they feed the campaign's numbers. */
const tracked = (exercise: CatalogExercise) => Boolean(exercise.lift || exercise.load);

function matches(exercise: CatalogExercise, words: string[]): boolean {
  const text = `${exercise.name} ${exercise.focus} ${exercise.note ?? ''}`.toLowerCase();
  return words.every((word) => text.includes(word));
}

/**
 * Pick an exercise from the library: one tab per skill set, a search box, and
 * results grouped by category. Used both to add an exercise and to swap one.
 */
export const ExercisePicker: React.FC<{
  /** "Add an exercise to Monday", "Change exercise". */
  label: string;
  /** The exercise currently picked, when swapping. */
  value?: string;
  /** Tab to open on when nothing is picked yet. */
  startOn?: Discipline;
  onPick: (exerciseId: string) => void;
}> = ({ label, value, startOn = 'calisthenics', onPick }) => {
  const current = value ? EXERCISE_BY_ID.get(value) : undefined;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Discipline>(current?.discipline ?? startOn);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const counts = useMemo(() => {
    const result = new Map<Discipline, number>();
    for (const exercise of EXERCISE_CATALOG) {
      if (words.length && !matches(exercise, words)) continue;
      result.set(exercise.discipline, (result.get(exercise.discipline) ?? 0) + 1);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const groups = useMemo(() => {
    const found = EXERCISE_CATALOG.filter((exercise) => exercise.discipline === tab && (!words.length || matches(exercise, words)))
      .sort((a, b) => Number(tracked(b)) - Number(tracked(a)) || (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name))
      .slice(0, RESULT_LIMIT);
    const byCategory = new Map<string, CatalogExercise[]>();
    for (const exercise of found) {
      const key = tab === 'bouldering' ? 'Bouldering' : (CATEGORY_LABEL.get(exercise.category) ?? 'Other');
      byCategory.set(key, [...(byCategory.get(key) ?? []), exercise]);
    }
    return [...byCategory.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, query]);

  const shown = groups.reduce((sum, [, list]) => sum + list.length, 0);
  const total = counts.get(tab) ?? 0;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  if (!open) {
    return current ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${current.name}`}
        className="flex items-center gap-2 w-full h-10 px-3 rounded-xl bg-dark-950 border border-slate-700 text-left text-sm text-white hover:border-slate-500 transition cursor-pointer"
      >
        <span className="min-w-0 flex-1 truncate">{current.name}</span>
        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-neon-cyan hover:border-cyan-500/50 transition cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        {label}
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl border border-cyan-500/40 bg-dark-900 p-3 space-y-3"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          close();
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-slate-300">{label}</span>
        <button
          type="button"
          onClick={close}
          aria-label="Close the exercise library"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Skill set">
        {DISCIPLINES.map((discipline) => {
          const active = discipline.id === tab;
          return (
            <button
              key={discipline.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(discipline.id)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                active ? 'bg-cyan-950/50 text-neon-cyan border-cyan-500/50' : 'bg-dark-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {discipline.label}
              <span className="font-mono text-[10px] opacity-70">{counts.get(discipline.id) ?? 0}</span>
            </button>
          );
        })}
      </div>

      <label className="relative block">
        <span className="sr-only">Search exercises</span>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, muscle or skill…"
          aria-controls={listId}
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-dark-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 outline-none focus:border-neon-cyan/70 focus:ring-2 focus:ring-neon-cyan/20 transition"
        />
      </label>

      <div id={listId} className="max-h-80 overflow-y-auto pr-1 space-y-3">
        {groups.length === 0 && <p className="text-xs text-slate-500 py-4 text-center">Nothing matches “{query}” in this skill set.</p>}
        {groups.map(([group, list]) => (
          <section key={group}>
            <h4 className="sticky top-0 z-10 bg-dark-900 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{group}</h4>
            <ul className="space-y-1">
              {list.map((exercise) => {
                const lift = exercise.lift ? LIFT_BY_ID.get(exercise.lift) : undefined;
                const chosen = exercise.id === value;
                return (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(exercise.id);
                        close();
                      }}
                      aria-current={chosen ? 'true' : undefined}
                      className={`w-full text-left px-3 py-2 rounded-xl border transition cursor-pointer ${
                        chosen ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-dark-950/70 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">{exercise.name}</span>
                        {exercise.level !== undefined && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 shrink-0">Lv {exercise.level}</span>
                        )}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[10px]">
                        <span className="text-slate-400">{exercise.focus}</span>
                        {lift && (
                          <span className="px-1.5 py-0.5 rounded-md border border-emerald-700/50 bg-emerald-950/40 text-emerald-300 font-bold">
                            logs {lift.short}
                          </span>
                        )}
                        {!lift && exercise.load && (
                          <span className="px-1.5 py-0.5 rounded-md border border-slate-700 bg-dark-900 text-slate-300 font-bold">working weight</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {total > shown && (
          <p className="text-[11px] text-slate-500 text-center py-1">
            Showing {shown} of {total} — search to narrow it down.
          </p>
        )}
      </div>
    </div>
  );
};
