'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Link2 } from 'lucide-react';
import { SkillGraph, TreeSkill, statusOf } from '../../utils/skillTree';
import { NodeState, SkillNode } from '../game/kit';
import { SkillTreeDef } from './skillTrees';

/**
 * The skill tree as climbs. Every progression line is its own column, easiest
 * at the bottom and its hardest skill — the line's boss — at the top. Lines
 * stand side by side and scroll sideways; edges inside a line glow gold once
 * both ends are mastered and flow cyan where the next step is ready.
 */

export interface ClimbLine {
  id: string;
  name: string;
  lane: string;
  skills: TreeSkill[];
}

/** Groups skills into progression lines, easiest line first. */
export function linesOf(skills: TreeSkill[]): ClimbLine[] {
  const byLine = new Map<string, ClimbLine>();
  for (const skill of skills) {
    const name = skill.subCategory || skill.swimlane;
    const id = `${skill.swimlane}::${name}`;
    let line = byLine.get(id);
    if (!line) {
      line = { id, name, lane: skill.swimlane, skills: [] };
      byLine.set(id, line);
    }
    line.skills.push(skill);
  }
  const lines = [...byLine.values()];
  for (const line of lines) line.skills.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  return lines.sort((a, b) => a.skills[0].level - b.skills[0].level || a.name.localeCompare(b.name));
}

const ROW = 118;
const NODE = 62;
const SLOT = 82;
const BASE = 76;
const TOP = 64;

export interface FocusRequest {
  id: string;
  nonce: number;
}

interface ClimbBoardProps {
  tree: SkillTreeDef;
  graph: SkillGraph;
  lines: ClimbLine[];
  mastered: ReadonlySet<string>;
  selectedId: string | null;
  /** On a path, everything off it is dimmed. */
  pathIds: ReadonlySet<string> | null;
  focusRequest: FocusRequest | null;
  onSelect: (id: string) => void;
}

export const ClimbBoard: React.FC<ClimbBoardProps> = ({ tree, graph, lines, mastered, selectedId, pathIds, focusRequest, onSelect }) => {
  const board = useRef<HTMLDivElement>(null);

  // Bring the requested skill (or, on a fresh view, the first ready one) into the middle of the board.
  const firstReady = useMemo(() => {
    for (const line of lines) {
      const ready = line.skills.find((skill) => statusOf(skill, mastered) === 'ready');
      if (ready) return ready.id;
    }
    return null;
  }, [lines, mastered]);
  const viewKey = lines.map((line) => line.id).join('|');

  useEffect(() => {
    const id = focusRequest?.id ?? firstReady;
    if (!id || !board.current) return;
    const node = board.current.querySelector<HTMLElement>(`[data-skill="${CSS.escape(id)}"]`);
    node?.scrollIntoView({ block: 'center', inline: 'center', behavior: focusRequest ? 'smooth' : 'auto' });
    // A fresh view (new lane or tree) re-centres; mastering a skill does not move the board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest, viewKey]);

  return (
    <div ref={board} className="flex-1 min-h-0 overflow-auto dot-grid bg-[#080a11]">
      <div className="flex items-end gap-2 px-4 pt-4 pb-6 min-w-max min-h-full">
        {lines.map((line) => (
          <LineColumn
            key={line.id}
            tree={tree}
            graph={graph}
            line={line}
            mastered={mastered}
            selectedId={selectedId}
            pathIds={pathIds}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

const LineColumn: React.FC<{
  tree: SkillTreeDef;
  graph: SkillGraph;
  line: ClimbLine;
  mastered: ReadonlySet<string>;
  selectedId: string | null;
  pathIds: ReadonlySet<string> | null;
  onSelect: (id: string) => void;
}> = ({ tree, graph, line, mastered, selectedId, pathIds, onSelect }) => {
  // Skills at the same level share a row, side by side.
  const rows = useMemo(() => {
    const byLevel = new Map<number, TreeSkill[]>();
    for (const skill of line.skills) byLevel.set(skill.level, [...(byLevel.get(skill.level) ?? []), skill]);
    return [...byLevel.entries()].sort((a, b) => a[0] - b[0]).map(([, skills]) => skills);
  }, [line]);
  const widest = Math.max(...rows.map((row) => row.length));
  const width = Math.max(150, widest * SLOT + 18);
  const height = TOP + (rows.length - 1) * ROW + BASE;
  const top = line.skills[line.skills.length - 1];
  const done = line.skills.filter((skill) => mastered.has(skill.id)).length;
  const inLine = new Set(line.skills.map((skill) => skill.id));
  const lane = tree.lanes[line.lane];

  const pos = new Map<string, { x: number; y: number }>();
  rows.forEach((row, r) => {
    const y = height - BASE - r * ROW + NODE / 2 - 8;
    row.forEach((skill, i) => pos.set(skill.id, { x: width / 2 + (i - (row.length - 1) / 2) * SLOT, y }));
  });

  const edges = { dim: [] as string[], lit: [] as string[], ready: [] as string[] };
  for (const skill of line.skills) {
    const to = pos.get(skill.id)!;
    for (const pre of skill.prerequisites) {
      if (!inLine.has(pre)) continue;
      const from = pos.get(pre);
      if (!from) continue;
      const ym = (from.y + to.y) / 2;
      const d = `M${from.x} ${from.y} C${from.x} ${ym} ${to.x} ${ym} ${to.x} ${to.y}`;
      if (mastered.has(pre) && mastered.has(skill.id)) edges.lit.push(d);
      else if (mastered.has(pre)) edges.ready.push(d);
      else edges.dim.push(d);
    }
  }

  return (
    <section aria-label={`${line.name}, ${done} of ${line.skills.length} mastered`} className="relative shrink-0 flex flex-col" style={{ width }}>
      <div className="relative" style={{ height }}>
        <svg width={width} height={height} className="absolute inset-0" aria-hidden="true">
          <path d={edges.dim.join(' ')} fill="none" stroke="#1c2233" strokeWidth="4" strokeLinecap="round" />
          <path d={edges.lit.join(' ')} fill="none" stroke="#ffc247" strokeOpacity=".2" strokeWidth="12" strokeLinecap="round" />
          <path d={edges.lit.join(' ')} fill="none" stroke="#ffc247" strokeWidth="4" strokeLinecap="round" />
          <path d={edges.ready.join(' ')} fill="none" stroke="#3ee8ff" strokeWidth="3.5" strokeLinecap="round" className="anim-flow" />
        </svg>
        {line.skills.map((skill) => {
          const at = pos.get(skill.id)!;
          const status = statusOf(skill, mastered);
          const isTop = skill === top && line.skills.length > 1;
          const state: NodeState =
            status === 'mastered' ? 'mastered' : isTop ? (status === 'ready' ? 'boss' : 'sealed') : status;
          const outside = skill.prerequisites.filter((pre) => !inLine.has(pre) && graph.byId.has(pre));
          const dimmed = pathIds !== null && !pathIds.has(skill.id);
          const spec = tree.figureFor?.(skill.id);
          return (
            <div
              key={skill.id}
              data-skill={skill.id}
              className={`absolute flex flex-col items-center transition-opacity ${dimmed ? 'opacity-25' : ''}`}
              style={{ left: at.x - SLOT / 2, top: at.y - NODE / 2, width: SLOT }}
            >
              <div className="relative">
                <SkillNode
                  spec={spec}
                  state={state}
                  size={isTop ? NODE + 10 : NODE}
                  boss={isTop}
                  badge={isTop ? 'BOSS' : tree.levelTag(skill.level)}
                  selected={skill.id === selectedId}
                  label={`${skill.name}, ${tree.levelName(skill.level)}, ${status}`}
                  onClick={() => onSelect(skill.id)}
                />
                {outside.length > 0 && (
                  <span
                    className="absolute -left-1.5 -bottom-1 h-5 px-1 rounded-full bg-ink-950 border border-ink-600 text-fg-4 flex items-center gap-0.5 text-[10px] font-bold"
                    title={`Also needs ${outside.map((id) => graph.byId.get(id)?.name).join(', ')}`}
                  >
                    <Link2 className="w-3 h-3" />
                    {outside.length}
                  </span>
                )}
              </div>
              <span
                className={`mt-1.5 w-[80px] text-center text-[11px] font-semibold leading-tight line-clamp-2 ${
                  status === 'mastered' ? 'text-earned-soft' : status === 'ready' ? 'text-fg' : 'text-fg-5'
                }`}
              >
                {skill.name}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex flex-col items-center gap-1.5 px-1">
        <span className={`flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-center leading-tight ${lane?.text ?? 'text-fg-3'}`}>
          {line.name}
        </span>
        <span className="w-[84px] h-1 rounded-full bg-ink-700 overflow-hidden">
          <span className="block h-full bg-earned" style={{ width: `${(done / line.skills.length) * 100}%` }} />
        </span>
      </div>
    </section>
  );
};
