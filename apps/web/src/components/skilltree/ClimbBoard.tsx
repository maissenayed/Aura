'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { Link2 } from 'lucide-react';
import { SkillGraph, TreeSkill, statusOf } from '../../utils/skillTree';
import { Meter, NodeState, SkillNode } from '../game/kit';
import { SkillTreeDef } from './skillTrees';

/**
 * The skill tree as climbs. A progression line is a track, easiest at the
 * bottom and its hardest skill — the line's boss — at the top. A line that
 * grows out of another (its first skill requires a skill in that line) branches
 * off it inside the same climb: it starts at its own level beside its parent,
 * joined by an edge. Climbs stand side by side and scroll both ways; an edge
 * turns gold once both ends are mastered, is a solid iron line where the next
 * step is ready, and dashed while it is still locked. Only the next thing to
 * climb (the first ready skill shown) pulses.
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

/** A root line and every line growing out of it, root first, each branch right after the line it grows from. */
export interface Climb {
  id: string;
  name: string;
  lane: string;
  tracks: ClimbLine[];
}

/**
 * Joins lines into climbs. A line grows out of the line holding its first
 * skill's first prerequisite, when that line is in the same lane; the rest are
 * roots. Lines keep the order `linesOf` gave them.
 */
export function climbsOf(lines: ClimbLine[]): Climb[] {
  const lineOf = new Map<string, ClimbLine>();
  for (const line of lines) for (const skill of line.skills) lineOf.set(skill.id, line);

  const parent = new Map<ClimbLine, ClimbLine>();
  for (const line of lines) {
    const first = line.skills[0]?.prerequisites[0];
    const host = first ? lineOf.get(first) : undefined;
    if (host && host !== line && host.lane === line.lane) parent.set(line, host);
  }
  // Two lines that each claim the other would hide both: cut the link that closes a loop.
  for (const line of lines) {
    const seen = new Set([line]);
    for (let up = parent.get(line); up; up = parent.get(up)) {
      if (seen.has(up)) {
        parent.delete(line);
        break;
      }
      seen.add(up);
    }
  }

  const children = new Map<ClimbLine, ClimbLine[]>();
  for (const line of lines) {
    const host = parent.get(line);
    if (host) children.set(host, [...(children.get(host) ?? []), line]);
  }
  const skillById = new Map(lines.flatMap((line) => line.skills.map((skill) => [skill.id, skill] as const)));
  const leavesAt = (line: ClimbLine) => skillById.get(line.skills[0].prerequisites[0])?.level ?? 0;
  // Branches leaving higher up sit nearest their parent; lower ones go further out and their
  // edges pass underneath, where those nearer branches have not started yet.
  const collect = (line: ClimbLine): ClimbLine[] => [
    line,
    ...[...(children.get(line) ?? [])]
      .sort((a, b) => leavesAt(b) - leavesAt(a) || a.skills[0].level - b.skills[0].level || a.name.localeCompare(b.name))
      .flatMap(collect),
  ];
  return lines
    .filter((line) => !parent.has(line))
    .map((root) => ({ id: root.id, name: root.name, lane: root.lane, tracks: collect(root) }));
}

/** The first ready skill, climb by climb and track by track; only among `within` when given. */
function firstReadyIn(climbs: Climb[], mastered: ReadonlySet<string>, within?: ReadonlySet<string>): string | null {
  for (const climb of climbs) {
    for (const track of climb.tracks) {
      const ready = track.skills.find((skill) => (!within || within.has(skill.id)) && statusOf(skill, mastered) === 'ready');
      if (ready) return ready.id;
    }
  }
  return null;
}

const ROW = 118;
const NODE = 62;
const SLOT = 82;
/** Room under the lowest row: a node and a two-line name, clear of the climb's title. */
const BASE = 92;
const TOP = 64;
/** The narrowest track: one node and its label. */
const TRACK = SLOT + 10;

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
  const climbs = useMemo(() => climbsOf(lines), [lines]);
  const firstReady = useMemo(() => firstReadyIn(climbs, mastered), [climbs, mastered]);
  // The one node that pulses: the next thing to climb, kept on the path when there is one.
  const nextId = useMemo(() => (pathIds ? firstReadyIn(climbs, mastered, pathIds) : firstReady), [climbs, mastered, pathIds, firstReady]);
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
    <div ref={board} className="flex-1 min-h-0 overflow-auto dot-grid bg-ink-900">
      <div className="flex items-end gap-2 px-4 pt-4 pb-6 min-w-max min-h-full">
        {climbs.map((climb) => (
          <ClimbColumn
            key={climb.id}
            tree={tree}
            graph={graph}
            climb={climb}
            mastered={mastered}
            selectedId={selectedId}
            nextId={nextId}
            pathIds={pathIds}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

const ClimbColumn: React.FC<{
  tree: SkillTreeDef;
  graph: SkillGraph;
  climb: Climb;
  mastered: ReadonlySet<string>;
  selectedId: string | null;
  /** The one skill that pulses: the next thing to climb. */
  nextId: string | null;
  pathIds: ReadonlySet<string> | null;
  onSelect: (id: string) => void;
}> = ({ tree, graph, climb, mastered, selectedId, nextId, pathIds, onSelect }) => {
  const layout = useMemo(() => {
    const skills = climb.tracks.flatMap((track) => track.skills);
    // One row per level used anywhere in the climb, so a branch starts beside the level it grows from.
    const levels = [...new Set(skills.map((skill) => skill.level))].sort((a, b) => a - b);
    const rowOf = new Map(levels.map((level, r) => [level, r]));
    const height = TOP + (levels.length - 1) * ROW + BASE;
    const yOf = (level: number) => height - BASE - (rowOf.get(level) ?? 0) * ROW + NODE / 2 - 8;

    // Each line is a track of its own; skills at the same level in one line sit side by side.
    const pos = new Map<string, { x: number; y: number }>();
    const tracks: { line: ClimbLine; x: number; width: number }[] = [];
    let x = 0;
    for (const line of climb.tracks) {
      const byLevel = new Map<number, TreeSkill[]>();
      for (const skill of line.skills) byLevel.set(skill.level, [...(byLevel.get(skill.level) ?? []), skill]);
      const widest = Math.max(...[...byLevel.values()].map((row) => row.length));
      const width = Math.max(TRACK, widest * SLOT + 10);
      for (const row of byLevel.values()) {
        row.forEach((skill, i) => pos.set(skill.id, { x: x + width / 2 + (i - (row.length - 1) / 2) * SLOT, y: yOf(skill.level) }));
      }
      tracks.push({ line, x, width });
      x += width;
    }
    const width = Math.max(150, x + 8);
    // A lone line is centred in its column, as before.
    const shift = (width - x) / 2;
    for (const p of pos.values()) p.x += shift;
    for (const t of tracks) t.x += shift;
    return { skills, height, width, pos, tracks };
  }, [climb]);

  const { skills, height, width, pos, tracks } = layout;
  const inClimb = new Set(skills.map((skill) => skill.id));
  const done = skills.filter((skill) => mastered.has(skill.id)).length;
  const tops = new Set(climb.tracks.filter((line) => line.skills.length > 1).map((line) => line.skills[line.skills.length - 1].id));
  const root = tracks[0];

  const edges = { dim: [] as string[], lit: [] as string[], ready: [] as string[] };
  for (const skill of skills) {
    const to = pos.get(skill.id)!;
    for (const pre of skill.prerequisites) {
      const from = inClimb.has(pre) ? pos.get(pre) : undefined;
      if (!from) continue;
      const ym = (from.y + to.y) / 2;
      const d = `M${from.x} ${from.y} C${from.x} ${ym} ${to.x} ${ym} ${to.x} ${to.y}`;
      if (mastered.has(pre) && mastered.has(skill.id)) edges.lit.push(d);
      else if (mastered.has(pre)) edges.ready.push(d);
      else edges.dim.push(d);
    }
  }

  return (
    <section aria-label={`${climb.name}, ${done} of ${skills.length} mastered`} className="relative shrink-0 flex flex-col" style={{ width }}>
      <div className="relative" style={{ height }}>
        <svg width={width} height={height} className="absolute inset-0" aria-hidden="true">
          <path d={edges.dim.join(' ')} fill="none" strokeWidth="3" strokeDasharray="5 7" style={{ stroke: 'var(--color-ink-600)' }} />
          <path d={edges.ready.join(' ')} fill="none" strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--color-ink-600)' }} />
          <path d={edges.lit.join(' ')} fill="none" strokeWidth="3.5" strokeLinecap="round" style={{ stroke: 'var(--color-earned)' }} />
        </svg>

        {/* A branch is named under its first step, where it leaves the line it grows from. */}
        {tracks.slice(1).map(({ line, x, width: trackWidth }) => {
          const first = pos.get(line.skills[0].id)!;
          return (
            <span
              key={line.id}
              className="eyebrow absolute text-center text-fg-4"
              style={{ left: x + 4, width: trackWidth - 8, top: first.y + NODE / 2 + 40 }}
            >
              {line.name}
            </span>
          );
        })}

        {skills.map((skill) => {
          const at = pos.get(skill.id)!;
          const status = statusOf(skill, mastered);
          const isTop = tops.has(skill.id);
          const state: NodeState =
            status === 'mastered' ? 'mastered' : isTop ? (status === 'ready' ? 'boss' : 'sealed') : status;
          const outside = skill.prerequisites.filter((pre) => !inClimb.has(pre) && graph.byId.has(pre));
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
                  pulse={skill.id === nextId}
                  label={`${skill.name}, ${tree.levelName(skill.level)}, ${status}`}
                  onClick={() => onSelect(skill.id)}
                />
                {outside.length > 0 && (
                  <span
                    className="absolute -left-1.5 -bottom-1 h-5 px-1 rounded-tag bg-ink-950 border border-ink-600 text-fg-4 flex items-center gap-0.5 num font-bold text-[11px]"
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
      <div className="mt-1 flex flex-col items-center gap-1.5 px-1" style={{ marginLeft: root.x, width: root.width }}>
        <span className="eyebrow flex items-center gap-1.5 text-center text-fg-2">{climb.name}</span>
        <div className="w-[84px]">
          <Meter value={done / skills.length} tone="earned" className="h-1" />
        </div>
      </div>
    </section>
  );
};
