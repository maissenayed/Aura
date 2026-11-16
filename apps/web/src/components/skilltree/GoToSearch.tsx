'use client';

import React, { useId, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { SkillGraph, SkillStatus, statusOf } from '../../utils/skillTree';
import { SkillTreeDef, laneThemeOf } from './skillTrees';

const STATUS_WORD: Record<SkillStatus, { label: string; tone: string }> = {
  mastered: { label: 'Mastered', tone: 'text-emerald-300' },
  ready: { label: 'Ready', tone: 'text-neon-cyan' },
  locked: { label: 'Locked', tone: 'text-slate-500' },
};

const MAX_RESULTS = 8;

/* ------------------------------------------------------------------ */
/* Search that takes you to the skill                                  */
/* ------------------------------------------------------------------ */

interface GoToSearchProps {
  tree: SkillTreeDef;
  graph: SkillGraph;
  mastered: ReadonlySet<string>;
  onGoTo: (id: string) => void;
}

/**
 * Searches every exercise regardless of the filters, and jumps to the one
 * picked. Filtering the canvas by text hid results off-screen; a list of
 * results never does.
 */
export const GoToSearch: React.FC<GoToSearchProps> = ({ tree, graph, mastered, onGoTo }) => {
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
        aria-label={`Find ${tree.noun.one === 'exercise' ? 'an' : 'a'} ${tree.noun.one}`}
        value={query}
        placeholder={tree.searchPlaceholder}
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
            <li className="px-3 py-3 text-xs text-slate-400">
              No {tree.noun.one} matches “{query.trim()}”.
            </li>
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
                    <span className={`w-1.5 h-8 rounded-full shrink-0 ${laneThemeOf(tree, exercise.swimlane).solid}`} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-white truncate">{exercise.name}</span>
                      <span className="block text-[11px] text-slate-400 truncate">
                        {tree.levelName(exercise.level)} · {exercise.subCategory}
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
