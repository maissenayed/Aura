'use client';

import React, { useId, useMemo, useState } from 'react';
import { ListChecks, Route, Search, X } from 'lucide-react';
import { Exercise, Swimlane } from '@aura/types';
import { LANES, LEVEL_BANDS, LaneSummary, SkillGraph, SkillStatus, statusOf } from '../../utils/skillTree';
import { LANE_THEME } from './laneTheme';

const STATUS_OPTIONS: { value: SkillStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Any status' },
  { value: 'ready', label: 'Ready to train' },
  { value: 'mastered', label: 'Mastered' },
  { value: 'locked', label: 'Locked' },
];

const STATUS_WORD: Record<SkillStatus, { label: string; tone: string }> = {
  mastered: { label: 'Mastered', tone: 'text-emerald-300' },
  ready: { label: 'Ready', tone: 'text-neon-cyan' },
  locked: { label: 'Locked', tone: 'text-slate-500' },
};

const MAX_RESULTS = 8;

interface SkillToolbarProps {
  graph: SkillGraph;
  mastered: ReadonlySet<string>;
  lanes: LaneSummary[];
  lane: Swimlane | 'All';
  bandId: string;
  status: SkillStatus | 'all';
  /** Set while the canvas shows only the path to one exercise. */
  pathTarget: Exercise | null;
  pathLength: number;
  readyCount: number;
  onLaneChange: (lane: Swimlane | 'All') => void;
  onBandChange: (bandId: string) => void;
  onStatusChange: (status: SkillStatus | 'all') => void;
  onExitPath: () => void;
  onGoTo: (id: string) => void;
  onOpenProgress: () => void;
}

const SELECT =
  'flex-1 min-w-0 sm:flex-none h-10 pl-3 pr-8 rounded-xl bg-dark-950 border border-slate-800 text-xs font-bold text-slate-200 outline-none focus-visible:border-neon-cyan cursor-pointer';

export const SkillToolbar: React.FC<SkillToolbarProps> = ({
  graph,
  mastered,
  lanes,
  lane,
  bandId,
  status,
  pathTarget,
  pathLength,
  readyCount,
  onLaneChange,
  onBandChange,
  onStatusChange,
  onExitPath,
  onGoTo,
  onOpenProgress,
}) => (
  <div className="relative z-30 w-full bg-dark-900/95 border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
    <div className="flex flex-wrap items-center gap-2">
      {pathTarget ? (
        <div className="flex items-center gap-3 flex-1 min-w-[240px] h-10 px-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
          <Route className="w-4 h-4 text-neon-cyan shrink-0" />
          <p className="flex-1 min-w-0 text-xs text-slate-200 truncate">
            Path to <strong className="text-white">{pathTarget.name}</strong>
            <span className="text-slate-400">
              {' '}
              · {pathLength} {pathLength === 1 ? 'exercise leads' : 'exercises lead'} here
            </span>
          </p>
          <button
            type="button"
            onClick={onExitPath}
            className="flex items-center gap-1 shrink-0 px-2.5 h-7 rounded-lg text-[11px] font-black uppercase tracking-wider text-neon-cyan border border-cyan-500/40 hover:bg-cyan-900/40 transition cursor-pointer"
          >
            <X className="w-3 h-3" />
            Show whole tree
          </button>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Branch" className="no-scrollbar flex items-center gap-1 p-1 rounded-xl bg-dark-950 border border-slate-800 overflow-x-auto max-w-full">
            <BranchTab label="All" active={lane === 'All'} onClick={() => onLaneChange('All')} />
            {LANES.map((entry) => {
              const theme = LANE_THEME[entry];
              const summary = lanes.find((item) => item.lane === entry);
              return (
                <BranchTab
                  key={entry}
                  label={theme.label}
                  icon={theme.icon}
                  activeTone={theme.text}
                  ready={summary?.ready ?? 0}
                  active={lane === entry}
                  onClick={() => onLaneChange(entry)}
                />
              );
            })}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
          <label className="sr-only" htmlFor="skill-level-band">
            Level range
          </label>
          <select id="skill-level-band" value={bandId} onChange={(event) => onBandChange(event.target.value)} className={SELECT}>
            {LEVEL_BANDS.map((band) => (
              <option key={band.id} value={band.id}>
                {band.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="skill-status">
            Status
          </label>
          <select
            id="skill-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as SkillStatus | 'all')}
            className={SELECT}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          </div>
        </>
      )}

      <GoToSearch graph={graph} mastered={mastered} onGoTo={onGoTo} />

      <button
        type="button"
        onClick={onOpenProgress}
        className="lg:hidden flex items-center gap-2 h-10 px-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs font-black text-neon-cyan cursor-pointer"
      >
        <ListChecks className="w-4 h-4" />
        {readyCount} ready
      </button>
    </div>
  </div>
);

interface BranchTabProps {
  label: string;
  icon?: React.ReactNode;
  activeTone?: string;
  ready?: number;
  active: boolean;
  onClick: () => void;
}

const BranchTab: React.FC<BranchTabProps> = ({ label, icon, activeTone = 'text-white', ready = 0, active, onClick }) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`flex items-center gap-1.5 h-9 sm:h-8 px-3 rounded-lg text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
      active ? `bg-dark-700 ${activeTone}` : 'text-slate-400 hover:text-white'
    }`}
  >
    {icon}
    {label}
    {ready > 0 && (
      <span className="px-1.5 rounded-md bg-cyan-950/60 text-[10px] font-mono text-neon-cyan" title={`${ready} ready to train`}>
        {ready}
      </span>
    )}
  </button>
);

/* ------------------------------------------------------------------ */
/* Search that takes you to the exercise                               */
/* ------------------------------------------------------------------ */

interface GoToSearchProps {
  graph: SkillGraph;
  mastered: ReadonlySet<string>;
  onGoTo: (id: string) => void;
}

/**
 * Searches every exercise regardless of the filters, and jumps to the one
 * picked. Filtering the canvas by text hid results off-screen; a list of
 * results never does.
 */
const GoToSearch: React.FC<GoToSearchProps> = ({ graph, mastered, onGoTo }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return graph.exercises
      .filter((exercise) => exercise.name.toLowerCase().includes(needle) || exercise.subCategory.toLowerCase().includes(needle))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(needle) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(needle) ? 0 : 1;
        return aStarts - bStarts || a.level - b.level || a.name.localeCompare(b.name);
      });
  }, [graph, query]);

  const shown = results.slice(0, MAX_RESULTS);
  const showList = open && query.trim().length >= 2;

  const pick = (id: string) => {
    onGoTo(id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <input
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Find an exercise"
        value={query}
        placeholder="Find an exercise — muscle-up, planche, pistol…"
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => Math.min(shown.length - 1, index + 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(0, index - 1));
          } else if (event.key === 'Enter' && shown[active]) {
            event.preventDefault();
            pick(shown[active].id);
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
        className="w-full h-10 pl-9 pr-3 rounded-xl bg-dark-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus-visible:border-neon-cyan [&::-webkit-search-cancel-button]:appearance-none"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 p-1 rounded-xl bg-dark-900 border border-slate-700 shadow-2xl max-h-[60vh] overflow-y-auto"
        >
          {shown.length === 0 ? (
            <li className="px-3 py-3 text-xs text-slate-400">No exercise matches “{query.trim()}”.</li>
          ) : (
            shown.map((exercise, index) => {
              const state = STATUS_WORD[statusOf(exercise, mastered)];
              return (
                <li key={exercise.id} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    // Keep focus in the input so the list does not close before the click lands.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(exercise.id)}
                    onMouseEnter={() => setActive(index)}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left cursor-pointer ${
                      index === active ? 'bg-dark-700' : ''
                    }`}
                  >
                    <span className={`w-1.5 h-8 rounded-full shrink-0 ${LANE_THEME[exercise.swimlane].solid}`} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-white truncate">{exercise.name}</span>
                      <span className="block text-[11px] text-slate-400 truncate">
                        Level {exercise.level} · {exercise.subCategory}
                      </span>
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 ${state.tone}`}>{state.label}</span>
                  </button>
                </li>
              );
            })
          )}
          {results.length > MAX_RESULTS && (
            <li className="px-3 py-2 text-[11px] text-slate-500">
              {results.length - MAX_RESULTS} more — keep typing to narrow it down.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
