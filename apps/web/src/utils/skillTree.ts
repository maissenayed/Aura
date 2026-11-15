/**
 * The rules of the skill tree: what counts as mastered, ready or locked, which
 * exercises lead to which, and where each one sits on the canvas.
 *
 * Pure functions only — no React, no storage — so the page can ask for a fresh
 * answer on every change and the rules stay in one readable place.
 */

import { Exercise, Swimlane } from '@aura/types';

export type SkillStatus = 'mastered' | 'ready' | 'locked';

export const LANES: Swimlane[] = ['Push', 'Pull', 'Core', 'Legs'];

export interface LevelBand {
  id: string;
  label: string;
  min: number;
  max: number;
}

/** Non-overlapping level ranges, so every exercise belongs to exactly one band. */
export const LEVEL_BANDS: LevelBand[] = [
  { id: 'beginner', label: 'Beginner · 1–3', min: 1, max: 3 },
  { id: 'intermediate', label: 'Intermediate · 4–6', min: 4, max: 6 },
  { id: 'advanced', label: 'Advanced · 7–10', min: 7, max: 10 },
  { id: 'elite', label: 'Elite · 11–16', min: 11, max: 16 },
  { id: 'all', label: 'All levels', min: 1, max: 16 },
];

export function bandForLevel(level: number): LevelBand {
  return LEVEL_BANDS.find((band) => band.id !== 'all' && level >= band.min && level <= band.max) ?? LEVEL_BANDS[4];
}

/* ------------------------------------------------------------------ */
/* Graph                                                               */
/* ------------------------------------------------------------------ */

export interface DroppedLink {
  exercise: string;
  prerequisite: string;
  reason: string;
}

export interface SkillGraph {
  exercises: Exercise[];
  byId: Map<string, Exercise>;
  /** Exercises that list this one as a prerequisite. */
  children: Map<string, string[]>;
  /** Prerequisite links removed because they could never be satisfied. */
  dropped: DroppedLink[];
}

/**
 * Builds the lookup tables and removes prerequisite links that make no sense
 * as a progression: a harder exercise required before an easier one, or a loop
 * where two exercises wait on each other. Left in, those leave exercises that
 * can never unlock.
 */
export function buildGraph(list: Exercise[]): SkillGraph {
  const levelOf = new Map(list.map((exercise) => [exercise.id, exercise.level]));
  const dropped: DroppedLink[] = [];

  const exercises = list.map((exercise) => {
    const prerequisites = exercise.prerequisites.filter((id) => {
      const level = levelOf.get(id);
      if (level === undefined) {
        dropped.push({ exercise: exercise.name, prerequisite: id, reason: 'points at an exercise that does not exist' });
        return false;
      }
      if (level > exercise.level) {
        const name = list.find((other) => other.id === id)?.name ?? id;
        dropped.push({
          exercise: `${exercise.name} (L${exercise.level})`,
          prerequisite: `${name} (L${level})`,
          reason: 'a harder exercise cannot come first',
        });
        return false;
      }
      return true;
    });
    // Always a copy: the loop check below edits prerequisites, and the input list is shared.
    return { ...exercise, prerequisites };
  });

  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  // Break any loop that is left (only possible between exercises of the same level).
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string) => {
    state.set(id, 'open');
    const exercise = byId.get(id);
    if (exercise) {
      for (const prerequisite of [...exercise.prerequisites]) {
        if (state.get(prerequisite) === 'open') {
          exercise.prerequisites = exercise.prerequisites.filter((other) => other !== prerequisite);
          dropped.push({
            exercise: exercise.name,
            prerequisite: byId.get(prerequisite)?.name ?? prerequisite,
            reason: 'the two exercises required each other',
          });
        } else if (!state.has(prerequisite)) {
          visit(prerequisite);
        }
      }
    }
    state.set(id, 'done');
  };
  for (const exercise of exercises) if (!state.has(exercise.id)) visit(exercise.id);

  const children = new Map<string, string[]>();
  for (const exercise of exercises) {
    for (const prerequisite of exercise.prerequisites) {
      const siblings = children.get(prerequisite);
      if (siblings) siblings.push(exercise.id);
      else children.set(prerequisite, [exercise.id]);
    }
  }

  return { exercises, byId, children, dropped };
}

export function statusOf(exercise: Exercise, mastered: ReadonlySet<string>): SkillStatus {
  if (mastered.has(exercise.id)) return 'mastered';
  return exercise.prerequisites.every((id) => mastered.has(id)) ? 'ready' : 'locked';
}

/** Everything that has to be mastered before this exercise, all the way down. */
export function ancestorsOf(graph: SkillGraph, id: string): Set<string> {
  const found = new Set<string>();
  const stack = [id];
  while (stack.length) {
    for (const prerequisite of graph.byId.get(stack.pop() as string)?.prerequisites ?? []) {
      if (!found.has(prerequisite)) {
        found.add(prerequisite);
        stack.push(prerequisite);
      }
    }
  }
  return found;
}

/** Everything this exercise eventually leads to. */
export function descendantsOf(graph: SkillGraph, id: string): Set<string> {
  const found = new Set<string>();
  const stack = [id];
  while (stack.length) {
    for (const child of graph.children.get(stack.pop() as string) ?? []) {
      if (!found.has(child)) {
        found.add(child);
        stack.push(child);
      }
    }
  }
  return found;
}

/* ------------------------------------------------------------------ */
/* Progress summary                                                    */
/* ------------------------------------------------------------------ */

const RANKS = [
  { min: 0, title: 'Novice Athlete' },
  { min: 5, title: 'Intermediate Gymnast' },
  { min: 15, title: 'Advanced Practitioner' },
  { min: 35, title: 'Static Hold Master' },
  { min: 60, title: 'Calisthenics Titan' },
];

export interface LaneSummary {
  lane: Swimlane;
  total: number;
  mastered: number;
  ready: number;
}

export interface SkillSummary {
  total: number;
  mastered: number;
  xp: number;
  rank: string;
  /** Null once the top rank is reached. */
  nextRank: { title: string; remaining: number; progress: number } | null;
  lanes: LaneSummary[];
  /** Unlocked and not yet mastered — easiest first. */
  ready: Exercise[];
  highestLevel: number;
}

export function summarize(graph: SkillGraph, mastered: ReadonlySet<string>): SkillSummary {
  const lanes: LaneSummary[] = LANES.map((lane) => ({ lane, total: 0, mastered: 0, ready: 0 }));
  const ready: Exercise[] = [];
  let masteredCount = 0;
  let xp = 0;
  let highestLevel = 0;

  for (const exercise of graph.exercises) {
    const lane = lanes[LANES.indexOf(exercise.swimlane)];
    const status = statusOf(exercise, mastered);
    lane.total += 1;
    if (status === 'mastered') {
      lane.mastered += 1;
      masteredCount += 1;
      xp += exercise.xpReward;
      highestLevel = Math.max(highestLevel, exercise.level);
    } else if (status === 'ready') {
      lane.ready += 1;
      ready.push(exercise);
    }
  }

  ready.sort((a, b) => a.level - b.level || LANES.indexOf(a.swimlane) - LANES.indexOf(b.swimlane) || a.name.localeCompare(b.name));

  const rankIndex = RANKS.reduce((index, rank, i) => (masteredCount >= rank.min ? i : index), 0);
  const next = RANKS[rankIndex + 1];

  return {
    total: graph.exercises.length,
    mastered: masteredCount,
    xp,
    rank: RANKS[rankIndex].title,
    nextRank: next
      ? {
          title: next.title,
          remaining: next.min - masteredCount,
          progress: (masteredCount - RANKS[rankIndex].min) / (next.min - RANKS[rankIndex].min),
        }
      : null,
    lanes,
    ready,
    highestLevel,
  };
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export const LAYOUT = {
  cardWidth: 232,
  cardHeight: 80,
  /** Left edge of one level column to the next. */
  columnPitch: 300,
  /** Top edge of one stacked card to the next. */
  slotPitch: 94,
  /** Width reserved on the left for the progression names. */
  gutter: 196,
  laneHeaderHeight: 46,
  laneGap: 44,
  lineGap: 14,
  levelHeaderHeight: 44,
};

export interface PlacedCard {
  id: string;
  x: number;
  y: number;
}

export interface PlacedLine {
  key: string;
  label: string;
  lane: Swimlane;
  y: number;
  height: number;
  mastered: number;
  total: number;
}

export interface PlacedLane {
  lane: Swimlane;
  y: number;
}

export interface TreeLayout {
  cards: PlacedCard[];
  lines: PlacedLine[];
  lanes: PlacedLane[];
  levels: { level: number; x: number }[];
  width: number;
  height: number;
}

/**
 * Lays the visible exercises out as a grid: one column per level, one row per
 * progression (push-ups, dips, front lever…), grouped by branch. A progression
 * then reads left to right as a line instead of a tangle.
 *
 * `levels` lists the columns to draw, in order. Passing only the levels that
 * are in use (as the path view does) closes the gaps between them.
 */
export function layoutTree(
  visible: Exercise[],
  graph: SkillGraph,
  mastered: ReadonlySet<string>,
  levels: number[],
): TreeLayout {
  const cards: PlacedCard[] = [];
  const lines: PlacedLine[] = [];
  const lanes: PlacedLane[] = [];
  const columnOf = new Map(levels.map((level, index) => [level, index]));
  const xOf = (level: number) => LAYOUT.gutter + (columnOf.get(level) ?? 0) * LAYOUT.columnPitch;

  // How far along each progression is, counted over the whole dataset rather than the visible slice.
  const lineTotals = new Map<string, { mastered: number; total: number }>();
  for (const exercise of graph.exercises) {
    const key = `${exercise.swimlane}/${exercise.subCategory}`;
    const totals = lineTotals.get(key) ?? { mastered: 0, total: 0 };
    totals.total += 1;
    if (mastered.has(exercise.id)) totals.mastered += 1;
    lineTotals.set(key, totals);
  }

  let y = 0;
  for (const lane of LANES) {
    const inLane = visible.filter((exercise) => exercise.swimlane === lane);
    if (inLane.length === 0) continue;

    lanes.push({ lane, y });
    y += LAYOUT.laneHeaderHeight;

    const byLine = new Map<string, Exercise[]>();
    for (const exercise of inLane) {
      const group = byLine.get(exercise.subCategory);
      if (group) group.push(exercise);
      else byLine.set(exercise.subCategory, [exercise]);
    }

    const ordered = [...byLine.entries()].sort(
      ([nameA, a], [nameB, b]) =>
        Math.min(...a.map((e) => e.level)) - Math.min(...b.map((e) => e.level)) || nameA.localeCompare(nameB),
    );

    for (const [name, group] of ordered) {
      const slotByLevel = new Map<number, number>();
      let tallest = 1;

      for (const exercise of [...group].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))) {
        const slot = slotByLevel.get(exercise.level) ?? 0;
        slotByLevel.set(exercise.level, slot + 1);
        tallest = Math.max(tallest, slot + 1);
        cards.push({ id: exercise.id, x: xOf(exercise.level), y: y + slot * LAYOUT.slotPitch });
      }

      const height = (tallest - 1) * LAYOUT.slotPitch + LAYOUT.cardHeight;
      const key = `${lane}/${name}`;
      lines.push({ key, label: name, lane, y, height, ...(lineTotals.get(key) ?? { mastered: 0, total: group.length }) });
      y += height + LAYOUT.lineGap;
    }

    y += LAYOUT.laneGap - LAYOUT.lineGap;
  }

  return {
    cards,
    lines,
    lanes,
    levels: levels.map((level) => ({ level, x: xOf(level) })),
    width: LAYOUT.gutter + Math.max(0, levels.length - 1) * LAYOUT.columnPitch + LAYOUT.cardWidth,
    height: Math.max(0, y - LAYOUT.laneGap),
  };
}

/* ------------------------------------------------------------------ */
/* Content helpers                                                     */
/* ------------------------------------------------------------------ */

/** True when the steps are the auto-generated filler rather than a written guide. */
export function hasWrittenGuide(exercise: Exercise): boolean {
  return !(exercise.description[0] ?? '').startsWith('1. Position your body in the starting');
}

/** The YouTube video id when the exercise links a specific video, otherwise null. */
export function videoIdOf(exercise: Exercise): string | null {
  const match = (exercise.videoSearchUrl ?? '').match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

export function tutorialSearchUrl(exercise: Exercise): string {
  const query = exercise.youtubeQuery || `${exercise.name} calisthenics tutorial`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
