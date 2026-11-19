'use client';

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ChevronRight, Download, Plus, RotateCcw, Search, Video } from 'lucide-react';
import type { RawExercise, Swimlane } from '@aura/types';
import { DANGER_BUTTON, FormMessage, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../account/ui';
import { Figure } from '../game/kit';
import { SKILL_TREES } from '../skilltree/skillTrees';
import { currentRawExercises, exerciseListSource, getSwimlane, rawExercises, subscribeExerciseList } from '../../data/exercisesData';
import { adoptExerciseList, refreshExerciseList } from '../../utils/exerciseListStore';
import { api } from '../../utils/accountStore';
import { ExerciseEditor, Ownership, SavedList } from './ExerciseEditor';

/**
 * The exercise list as the database holds it: every exercise in one table,
 * to search, add, edit and delete. A change reaches the whole app (and the
 * server's engine) as soon as it is saved.
 *
 * The list follows the built-in one the app ships with: a fix there reaches
 * every exercise the owner has not changed when the app is deployed. The
 * owner's own rows are marked, and each can be put back to its built-in version.
 */

const LANES: Swimlane[] = ['Push', 'Pull', 'Core', 'Legs'];
const PAGE = 120;

const laneOf = (exercise: RawExercise) => exercise.swimlane ?? getSwimlane(exercise.category, exercise.subCategory);
const BUILT_IN = new Map(rawExercises.map((exercise) => [exercise.id, exercise]));

interface Changes {
  edited: Set<string>;
  added: Set<string>;
  deleted: SavedList['deleted'];
}
const figureOf = (id: string) => SKILL_TREES.calisthenics.figureFor?.(id);

/** "461.1795083407413" → when the list last changed. */
function changedAt(source: string): string | null {
  const at = Number(source.split('.')[1]);
  if (!at) return null;
  return new Date(at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function download(exercises: RawExercise[]) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(exercises, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `aura-exercises-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export const ExerciseManager: React.FC = () => {
  const exercises = useSyncExternalStore(subscribeExerciseList, currentRawExercises, currentRawExercises);
  const source = useSyncExternalStore(subscribeExerciseList, exerciseListSource, () => 'built-in');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [lane, setLane] = useState<Swimlane | 'All'>('All');
  const [kind, setKind] = useState<'all' | 'bodyweight' | 'gym'>('all');
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState<RawExercise | 'new' | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [changes, setChanges] = useState<Changes | null>(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [bringing, setBringing] = useState<string | null>(null);

  /** Puts a list from the server in use, with what the owner changed in it. */
  const take = (list: SavedList) => {
    adoptExerciseList(list.version, list.exercises);
    setChanges({ edited: new Set(list.edited), added: new Set(list.added), deleted: list.deleted });
  };

  // The page edits the database, so it starts from the database's latest list.
  useEffect(() => {
    void (async () => {
      const result = await api<SavedList>('GET', '/admin/exercises');
      if (result.data) take(result.data);
      else await refreshExerciseList();
      setLoading(false);
    })();
  }, []);

  const ownershipOf = (id: string): Ownership => (changes?.edited.has(id) ? 'edited' : changes?.added.has(id) ? 'added' : 'built-in');
  const mineCount = (changes?.edited.size ?? 0) + (changes?.added.size ?? 0);

  const fromDatabase = source !== 'built-in';
  const laneCounts = useMemo(() => {
    const counts = new Map<Swimlane, number>();
    for (const exercise of exercises) counts.set(laneOf(exercise), (counts.get(laneOf(exercise)) ?? 0) + 1);
    return counts;
  }, [exercises]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exercises
      .filter(
        (exercise) =>
          (lane === 'All' || laneOf(exercise) === lane) &&
          (kind === 'all' || (kind === 'gym') === (exercise.discipline === 'gym')) &&
          (!mineOnly || Boolean(changes?.edited.has(exercise.id) || changes?.added.has(exercise.id))) &&
          (!needle ||
            exercise.name.toLowerCase().includes(needle) ||
            exercise.id.toLowerCase().includes(needle) ||
            exercise.subCategory.toLowerCase().includes(needle)),
      )
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [exercises, query, lane, kind, mineOnly, changes]);
  const byId = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);

  const saved = (list: SavedList, message: string) => {
    take(list);
    setEditing(null);
    setNotice({ tone: 'success', text: message });
  };

  const bringBack = async (id: string, name: string) => {
    setBringing(id);
    const result = await api<SavedList>('POST', `/admin/exercises/${encodeURIComponent(id)}/restore`);
    setBringing(null);
    if (result.data) {
      take(result.data);
      setNotice({ tone: 'success', text: `${name} is back in the list.` });
    } else setNotice({ tone: 'error', text: result.error ?? `${name} was not brought back.` });
  };

  const restore = async () => {
    setRestoring(true);
    const result = await api<SavedList>('POST', '/admin/exercises/restore');
    setRestoring(false);
    setConfirmRestore(false);
    if (result.data) {
      take(result.data);
      setNotice({ tone: 'success', text: `The built-in list is back: ${result.data.exercises.length} exercises.` });
    } else setNotice({ tone: 'error', text: result.error ?? 'The list was not restored.' });
  };

  const changed = fromDatabase ? changedAt(source) : null;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 p-4 rounded-card bg-ink-900">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="flex-1 min-w-[220px] text-sm text-fg-3">
            {loading && !fromDatabase ? (
              'Loading the list from the database…'
            ) : fromDatabase ? (
              <>
                <b className="num text-fg">{exercises.length}</b> exercises in the database{changed ? ` · last changed ${changed}` : ''}. The app, the crew and the server all run on this list.
              </>
            ) : (
              'The server did not answer, so this is the built-in list. Changes need the server.'
            )}
          </p>
          <button type="button" onClick={() => setEditing('new')} disabled={!fromDatabase} className={`${PRIMARY_BUTTON} h-11 px-4 disabled:cursor-not-allowed`}>
            <Plus className="w-5 h-5" strokeWidth={2.6} />
            Add exercise
          </button>
        </div>
        {notice && (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FormMessage tone={notice.tone}>{notice.text}</FormMessage>
            </div>
            <button type="button" onClick={() => setNotice(null)} className="text-[12px] font-semibold text-fg-4 hover:text-fg cursor-pointer">
              Dismiss
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-label="Find exercises">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-fg-4" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search by name, id or branch"
            aria-label="Search exercises"
            className="w-full h-11 pl-9 pr-3 rounded-card bg-ink-900 border border-ink-700 text-fg placeholder:text-fg-5 focus:border-act outline-none transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', ...LANES] as const).map((option) => (
            <Toggle key={option} on={lane === option} onClick={() => (setLane(option), setLimit(PAGE))}>
              {option} <span className="num text-fg-4">{option === 'All' ? exercises.length : (laneCounts.get(option) ?? 0)}</span>
            </Toggle>
          ))}
          <span className="w-px h-6 bg-ink-700 mx-1" aria-hidden="true" />
          {(
            [
              ['all', 'Any kind'],
              ['bodyweight', 'Bodyweight'],
              ['gym', 'Gym'],
            ] as const
          ).map(([value, label]) => (
            <Toggle key={value} on={kind === value} onClick={() => (setKind(value), setLimit(PAGE))}>
              {label}
            </Toggle>
          ))}
          {changes && (
            <>
              <span className="w-px h-6 bg-ink-700 mx-1" aria-hidden="true" />
              <Toggle on={mineOnly} onClick={() => (setMineOnly(!mineOnly), setLimit(PAGE))}>
                Yours <span className="num text-fg-4">{mineCount}</span>
              </Toggle>
            </>
          )}
        </div>
      </section>

      <section aria-label="Exercises" className="rounded-card bg-ink-900 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[48px_minmax(0,1.6fr)_56px_minmax(0,1.3fr)_minmax(0,1fr)_72px_minmax(0,1.2fr)_24px] gap-3 items-center px-4 h-10 border-b border-ink-800 eyebrow text-fg-4">
          <span />
          <span>Exercise</span>
          <span className="text-center">Level</span>
          <span>Lane · branch</span>
          <span>Standard</span>
          <span>Video</span>
          <span>Needs first</span>
          <span />
        </div>
        {shown.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-fg-4">
            {mineOnly && !mineCount ? 'Nothing is yours yet: every exercise is the built-in version.' : 'No exercise matches. Try another search or lane.'}
          </p>
        ) : (
          <ul>
            {shown.slice(0, limit).map((exercise) => (
              <Row
                key={exercise.id}
                exercise={exercise}
                byId={byId}
                ownership={ownershipOf(exercise.id)}
                disabled={!fromDatabase}
                onOpen={() => setEditing(exercise)}
              />
            ))}
          </ul>
        )}
        {shown.length > limit && (
          <div className="p-3 border-t border-ink-800">
            <button type="button" onClick={() => setLimit(shown.length)} className={`${SECONDARY_BUTTON} w-full h-11 text-sm`}>
              Show all {shown.length}
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 p-4 rounded-card bg-ink-900" aria-label="The whole list">
        <h2 className="font-display font-extrabold uppercase text-lg leading-none text-fg-2">The whole list</h2>
        <p className="text-sm text-fg-3">
          The list follows the built-in one the app ships with: when the app is deployed with a fix to it, every exercise you have not changed takes the fix.
          What you edited, added or deleted here stays as you made it.
          {changes && (
            <>
              {' '}
              Yours now: <b className="num text-fg">{changes.edited.size}</b> edited, <b className="num text-fg">{changes.added.size}</b> added,{' '}
              <b className="num text-fg">{changes.deleted.length}</b> deleted.
            </>
          )}
        </p>
        {changes && changes.deleted.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <h3 className="eyebrow text-fg-4">Built-in exercises you deleted</h3>
            <ul className="rounded-card border border-ink-800 overflow-hidden">
              {[...changes.deleted]
                .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                .map((entry) => (
                  <li key={entry.id} className="list-none flex items-center gap-3 px-3 py-2 border-b border-ink-800 last:border-b-0">
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-fg-2 truncate">{entry.name}</span>
                      <span className="block font-mono text-[11px] text-fg-4">
                        {entry.id} · <span className="num">L{entry.level}</span>
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={bringing !== null}
                      onClick={() => bringBack(entry.id, entry.name)}
                      className={`${SECONDARY_BUTTON} h-10 px-3 text-sm shrink-0`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      {bringing === entry.id ? 'Bringing back…' : 'Bring back'}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
        <p className="text-sm text-fg-3">
          A copy as JSON keeps a backup. Restoring the built-in list puts back the exercises the app ships with, and is also what fills an empty database.
        </p>
        {confirmRestore ? (
          <div className="flex flex-col gap-3 p-3 rounded-card border border-boss/40">
            <p className="text-sm text-fg-2">
              Replace all {exercises.length} exercises with the built-in list? Every exercise added, edited or deleted here goes back to how the app ships it
              {changes && mineCount + changes.deleted.length > 0
                ? `: your ${changes.edited.size} edited, ${changes.added.size} added and ${changes.deleted.length} deleted.`
                : '.'}{' '}
              To undo just one, open it and use its built-in version instead.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={restoring} onClick={restore} className={`${DANGER_BUTTON} h-11 px-4 text-sm border border-boss/50`}>
                {restoring ? 'Restoring…' : 'Restore the built-in list'}
              </button>
              <button type="button" onClick={() => setConfirmRestore(false)} className={`${SECONDARY_BUTTON} h-11 px-4 text-sm`}>
                Keep my list
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => download(exercises)} className={`${SECONDARY_BUTTON} h-11 px-4 text-sm`}>
              <Download className="w-4 h-4" />
              Download as JSON
            </button>
            <button type="button" disabled={!fromDatabase} onClick={() => setConfirmRestore(true)} className={`${DANGER_BUTTON} h-11 px-4 text-sm disabled:cursor-not-allowed`}>
              <RotateCcw className="w-4 h-4" />
              Restore built-in list
            </button>
          </div>
        )}
      </section>

      {editing && (
        <ExerciseEditor
          exercise={editing === 'new' ? null : editing}
          builtIn={editing === 'new' ? null : (BUILT_IN.get(editing.id) ?? null)}
          ownership={editing === 'new' ? 'added' : ownershipOf(editing.id)}
          all={exercises}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
    </div>
  );
};

const Toggle: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={onClick}
    className={`h-9 px-3 rounded-tag text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition ${
      on ? 'bg-ink-800 text-fg ring-1 ring-fg-3' : 'bg-ink-900 text-fg-3 hover:bg-ink-850 hover:text-fg'
    }`}
  >
    {children}
  </button>
);

const Row: React.FC<{ exercise: RawExercise; byId: Map<string, RawExercise>; ownership: Ownership; disabled: boolean; onOpen: () => void }> = ({
  exercise,
  byId,
  ownership,
  disabled,
  onOpen,
}) => {
  const figure = figureOf(exercise.id);
  const needs = exercise.prerequisites ?? [];
  const video = exercise.videoSearchUrl ? 'Video' : exercise.youtubeQuery ? 'Search' : '—';
  return (
    <li className="list-none border-b border-ink-800 last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        aria-label={`Edit ${exercise.name}`}
        className="w-full text-left grid grid-cols-[48px_minmax(0,1fr)_24px] lg:grid-cols-[48px_minmax(0,1.6fr)_56px_minmax(0,1.3fr)_minmax(0,1fr)_72px_minmax(0,1.2fr)_24px] gap-3 items-center px-4 py-2.5 hover:bg-ink-850 transition cursor-pointer disabled:cursor-default"
      >
        <span className="w-12 h-12 rounded-card bg-ink-950 flex items-center justify-center">
          {figure ? <Figure spec={figure} className="w-11 h-11" /> : <span className="text-[10px] font-semibold text-fg-5 text-center leading-tight">No drawing</span>}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-fg truncate">{exercise.name}</span>
            {ownership !== 'built-in' && (
              <span
                className="shrink-0 px-1.5 rounded-tag border border-ink-600 text-[10px] leading-[16px] font-bold uppercase tracking-wide text-fg-2"
                title={ownership === 'edited' ? 'You edited this built-in exercise; fixes to the built-in list do not reach it.' : 'You added this exercise.'}
              >
                {ownership === 'edited' ? 'Edited' : 'Yours'}
              </span>
            )}
          </span>
          <span className="block font-mono text-[11px] text-fg-4 truncate">
            {exercise.id}
            {exercise.discipline === 'gym' ? ' · gym' : ''}
          </span>
          {/* On a phone the other columns fold into this line. */}
          <span className="lg:hidden block text-[12px] text-fg-3 truncate mt-0.5">
            <span className="num">L{exercise.level}</span> · {laneOf(exercise)} · {exercise.subCategory}
          </span>
        </span>
        <span className="hidden lg:block num text-center text-fg font-bold">{exercise.level}</span>
        <span className="hidden lg:block min-w-0 text-[13px] text-fg-2 truncate">
          {laneOf(exercise)} · <span className="text-fg-3">{exercise.subCategory}</span>
        </span>
        <span className="hidden lg:block min-w-0 text-[13px] text-fg-3 truncate">{exercise.standard ?? '—'}</span>
        <span className={`hidden lg:flex items-center gap-1 text-[12.5px] ${exercise.videoSearchUrl ? 'text-fg-2' : 'text-fg-5'}`}>
          {exercise.videoSearchUrl && <Video className="w-3.5 h-3.5" />}
          {video}
        </span>
        <span className="hidden lg:block min-w-0 text-[12.5px] text-fg-3 truncate">
          {needs.length ? needs.map((id) => byId.get(id)?.name ?? id).join(', ') : <span className="text-fg-5">Starts a line</span>}
        </span>
        <ChevronRight className="w-4 h-4 text-fg-4" aria-hidden="true" />
      </button>
    </li>
  );
};
