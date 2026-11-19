'use client';

import React from 'react';
import { Star, X } from 'lucide-react';
import { SkillTreeId, SKILL_TREE_IDS } from '../../utils/skillProgressStore';
import { SkillGraph, SkillSummary, TreeSkill } from '../../utils/skillTree';
import { RouteIcon } from '../game/icons';
import { GoToSearch } from './GoToSearch';
import { SKILL_TREES, SkillTreeDef } from './skillTrees';

/** The chalk mark the selected tab carries. */
const Tally: React.FC = () => (
  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[18px] h-[3px] rounded-[2px] bg-act" aria-hidden />
);

/**
 * Above the climbs: which tree, which lane, a search that jumps to any skill,
 * and how many skills are ready. On a path, a banner says where it leads.
 */
export const TreeBar: React.FC<{
  tree: SkillTreeDef;
  graph: SkillGraph;
  mastered: ReadonlySet<string>;
  summary: SkillSummary;
  lane: string;
  pathTarget: TreeSkill | null;
  pathLength: number;
  onTreeChange: (tree: SkillTreeId) => void;
  onLaneChange: (lane: string) => void;
  onGoTo: (id: string) => void;
  onOpenProgress: () => void;
  onExitPath: () => void;
}> = ({ tree, graph, mastered, summary, lane, pathTarget, pathLength, onTreeChange, onLaneChange, onGoTo, onOpenProgress, onExitPath }) => (
  <div className="shrink-0 flex flex-col gap-3 px-4 pt-4 pb-3 lg:px-6 border-b border-ink-700 bg-ink-950">
    <div className="flex flex-wrap items-center gap-2.5">
      <div role="tablist" aria-label="Skill tree" className="flex gap-1 p-1 rounded-card bg-ink-900">
        {SKILL_TREE_IDS.map((id) => {
          const on = id === tree.id;
          const def = SKILL_TREES[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onTreeChange(id)}
              className={`relative h-9 px-3 sm:px-4 rounded-card flex items-center gap-1.5 text-[13px] font-bold transition active:scale-[.97] cursor-pointer ${
                on ? 'bg-ink-800 text-fg' : 'text-fg-4 hover:text-fg'
              }`}
            >
              {on && <Tally />}
              {def.icon}
              <span>{def.label}</span>
            </button>
          );
        })}
      </div>
      <span
        className="flex items-center gap-1.5 h-11 px-3 rounded-tag bg-earned-deep text-earned-soft"
        aria-label={`${summary.mastered} of ${summary.total} mastered`}
      >
        <Star className="w-4 h-4 text-earned fill-earned" />
        <span className="num font-bold text-[17px]">{summary.mastered}</span>
        <span className="num font-bold text-[17px] text-earned-dim">/ {summary.total}</span>
      </span>
      <button
        type="button"
        onClick={onOpenProgress}
        className="flex items-center gap-2 h-11 px-3 rounded-tag bg-ink-800 text-fg hover:bg-ink-750 active:scale-[.97] transition cursor-pointer"
      >
        <span className="w-2 h-2 rounded-[2px] bg-act" aria-hidden />
        <span className="num font-bold text-[17px]">{summary.ready.length}</span>{' '}
        <span className="text-[13px] font-semibold text-fg-3">ready</span>
      </button>
      <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px] sm:max-w-sm sm:ml-auto">
        <GoToSearch tree={tree} graph={graph} mastered={mastered} onGoTo={onGoTo} />
      </div>
    </div>

    {pathTarget ? (
      <div className="flex items-center gap-3 h-12 px-3.5 rounded-card bg-ink-900">
        <RouteIcon className="w-[18px] h-[18px] text-act shrink-0" />
        <span className="flex-1 min-w-0 text-sm font-semibold text-fg-2 truncate">
          Path to <span className="font-display font-bold text-[16px] text-fg">{pathTarget.name}</span>
          <span className="text-fg-4">
            {' '}
            · <span className="num font-bold">{pathLength}</span> steps
          </span>
        </span>
        <button
          type="button"
          onClick={onExitPath}
          aria-label="Leave the path"
          className="w-9 h-9 rounded-card text-fg-3 hover:text-fg hover:bg-ink-800 flex items-center justify-center active:scale-[.97] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      // Up to four lanes to a row on a phone, all in one row on a wide screen; a short last row stretches to fill it.
      <div className="flex flex-wrap gap-1.5">
        {summary.lanes.map((entry) => {
          const on = entry.lane === lane;
          const theme = tree.lanes[entry.lane];
          return (
            <button
              key={entry.lane}
              type="button"
              aria-pressed={on}
              onClick={() => onLaneChange(entry.lane)}
              className={`relative flex-1 basis-[calc(25%_-_0.375rem)] lg:basis-0 min-w-0 h-12 px-2 rounded-card flex flex-col items-center justify-center gap-1.5 transition active:scale-[.97] cursor-pointer ${
                on ? 'bg-ink-800 text-fg' : 'bg-ink-900 text-fg-4 hover:bg-ink-850 hover:text-fg'
              }`}
            >
              {on && <Tally />}
              <span className="flex items-center gap-1 max-w-full text-xs font-bold">
                <span className="shrink-0">{theme?.icon}</span>
                <span className="truncate">{theme?.label ?? entry.lane}</span>
              </span>
              <span className="w-full h-[3px] rounded-[1px] bg-ink-700 overflow-hidden">
                <span className="block h-full bg-earned" style={{ width: `${entry.total ? (entry.mastered / entry.total) * 100 : 0}%` }} />
              </span>
              {entry.ready > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-tag bg-act text-act-deep num font-bold text-[11px] leading-none flex items-center justify-center">
                  {entry.ready}
                </span>
              )}
            </button>
          );
        })}
      </div>
    )}
  </div>
);
