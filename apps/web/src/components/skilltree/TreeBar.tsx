'use client';

import React from 'react';
import { Route, Star, X } from 'lucide-react';
import { SkillTreeId, SKILL_TREE_IDS } from '../../utils/skillProgressStore';
import { SkillGraph, SkillSummary, TreeSkill } from '../../utils/skillTree';
import { GoToSearch } from './GoToSearch';
import { SKILL_TREES, SkillTreeDef } from './skillTrees';

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
  <div className="shrink-0 flex flex-col gap-3 px-4 pt-4 pb-3 lg:px-6 border-b border-ink-750 bg-ink-950">
    <div className="flex flex-wrap items-center gap-2.5">
      <div role="tablist" aria-label="Skill tree" className="flex gap-1 p-1 rounded-2xl bg-[#0c0f18] border border-ink-700">
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
              className={`h-10 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 text-[12.5px] font-bold transition cursor-pointer ${
                on ? 'bg-act text-act-deep' : 'text-[#8a94ad] hover:text-fg'
              }`}
            >
              {def.icon}
              <span>{def.label}</span>
            </button>
          );
        })}
      </div>
      <span className="flex items-center gap-1.5 h-10 px-3 rounded-full bg-[#14100a] border border-[#3a2c12] text-earned font-display font-bold" aria-label={`${summary.mastered} of ${summary.total} mastered`}>
        <Star className="w-4 h-4 fill-earned" />
        {summary.mastered}
        <span className="text-[#7d6a3e]">/ {summary.total}</span>
      </span>
      <button
        type="button"
        onClick={onOpenProgress}
        className="flex items-center gap-2 h-10 px-3 rounded-full bg-[#08161d] border border-[#124050] text-act font-display font-bold cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-act shadow-[0_0_8px_#3ee8ff]" />
        {summary.ready.length} ready
      </button>
      <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px] sm:max-w-sm sm:ml-auto">
        <GoToSearch tree={tree} graph={graph} mastered={mastered} onGoTo={onGoTo} />
      </div>
    </div>

    {pathTarget ? (
      <div className="flex items-center gap-3 h-12 px-3.5 rounded-2xl bg-[#08161d] border border-[#17566a]">
        <Route className="w-[18px] h-[18px] text-act" />
        <span className="flex-1 min-w-0 text-sm font-semibold truncate">
          Path to <span className="font-display font-bold text-act">{pathTarget.name}</span>
          <span className="text-fg-4"> · {pathLength} steps</span>
        </span>
        <button type="button" onClick={onExitPath} aria-label="Leave the path" className="w-9 h-9 rounded-xl text-fg-3 hover:text-fg flex items-center justify-center cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${summary.lanes.length}, minmax(0, 1fr))` }}>
        {summary.lanes.map((entry) => {
          const on = entry.lane === lane;
          const theme = tree.lanes[entry.lane];
          return (
            <button
              key={entry.lane}
              type="button"
              aria-pressed={on}
              onClick={() => onLaneChange(entry.lane)}
              className={`relative h-12 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                on ? 'bg-[#121a26] border-act text-fg' : 'bg-ink-850 border-ink-700 text-[#8a94ad] hover:text-fg'
              }`}
            >
              <span className="flex items-center gap-1 text-xs font-bold">
                <span className={on ? theme?.text : ''}>{theme?.icon}</span>
                {theme?.label ?? entry.lane}
              </span>
              <span className="w-full h-[3px] rounded-full bg-ink-700 overflow-hidden">
                <span className="block h-full bg-earned" style={{ width: `${entry.total ? (entry.mastered / entry.total) * 100 : 0}%` }} />
              </span>
              {entry.ready > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-act text-act-deep text-[10px] font-bold flex items-center justify-center">
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
