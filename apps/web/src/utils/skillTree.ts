/**
 * The rules of a skill tree: what counts as mastered, ready or locked, which
 * skills lead to which, and where each one sits on the canvas.
 *
 * Pure functions only — no React, no storage — so the page can ask for a fresh
 * answer on every change and the rules stay in one readable place. Every tree
 * (calisthenics, bouldering, yoga) runs on the same rules; what differs between them
 * — branches, level ranges, ranks — comes in as a `TreeRules`.
 */

import { Swimlane } from '@aura/types';

export type SkillStatus = 'mastered' | 'ready' | 'locked';

/**
 * What the tree needs to know about a skill. A calisthenics `Exercise` is one;
 * other trees bring their own skills in the same shape, with their own branch names.
 */
export interface TreeSkill {
  id: string;
  name: string;
  /** A second name it goes by, such as a yoga pose's Sanskrit name. */
  otherName?: string;
  /** The column it sits in: a calisthenics level, or a V-grade for bouldering. */
  level: number;
  /** The progression (row) it belongs to inside its branch. */
  subCategory: string;
  /** The branch (swimlane) it belongs to. */
  swimlane: string;
  prerequisites: string[];
  /** What it takes to call it mastered. */
  unlockRequirements: string;
  /** How to do it, one step per entry. */
  description: string[];
  expertTip?: string;
  /** Who should take care, and how: inversions, deep backbends. */
  caution?: string;
  youtubeQuery?: string;
  videoSearchUrl?: string;
  /** What it trains, shown as tags. */
  musclesTargeted: string[];
  xpReward: number;
  proStatus?: boolean;
}

/**
 * A skill from one of the built-in trees (bouldering, gym, yoga), with the fields
 * other features such as the campaign can rely on.
 */
export interface CatalogSkill extends TreeSkill {
  /** The branch; the same as `swimlane`. */
  lane: string;
  /** One line on what it builds, e.g. "Upper Chest" or "Footwork & Precision". */
  focus: string;
  /** The level as people say it: "V4 · 6B+", "Intermediate". */
  levelLabel: string;
  /** One sentence on what the skill is. */
  summary: string;
}

/** "A", "A & B", "A, B & C". */
export function listOf(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`;
}

export interface LevelBand {
  id: string;
  label: string;
  min: number;
  max: number;
}

export interface Rank {
  /** Skills mastered to reach it. */
  min: number;
  title: string;
}

/** What makes one tree different from another, as far as the rules are concerned. */
export interface TreeRules {
  /** Branch ids, in the order they are drawn and listed. */
  lanes: string[];
  /** Non-overlapping level ranges plus a final `all` band that spans every level. */
  bands: LevelBand[];
  /** Ranks earned by the number of skills mastered, lowest first. */
  ranks: Rank[];
}

export const LANES: Swimlane[] = ['Push', 'Pull', 'Core', 'Legs'];

/** Non-overlapping level ranges, so every exercise belongs to exactly one band. */
export const LEVEL_BANDS: LevelBand[] = [
  { id: 'beginner', label: 'Beginner · 1–3', min: 1, max: 3 },
  { id: 'intermediate', label: 'Intermediate · 4–6', min: 4, max: 6 },
  { id: 'advanced', label: 'Advanced · 7–10', min: 7, max: 10 },
  { id: 'elite', label: 'Elite · 11–16', min: 11, max: 16 },
  { id: 'world', label: 'World class · 17–20', min: 17, max: 20 },
  { id: 'all', label: 'All levels', min: 1, max: 20 },
];

const RANKS: Rank[] = [
  { min: 0, title: 'Novice Athlete' },
  { min: 5, title: 'Intermediate Gymnast' },
  { min: 15, title: 'Advanced Practitioner' },
  { min: 35, title: 'Static Hold Master' },
  { min: 60, title: 'Calisthenics Titan' },
];

export const CALISTHENICS_RULES: TreeRules = { lanes: LANES, bands: LEVEL_BANDS, ranks: RANKS };

/** The band a level belongs to; the `all` band when no narrower one holds it. */
export function bandForLevel(level: number, bands: LevelBand[] = LEVEL_BANDS): LevelBand {
  return (
    bands.find((band) => band.id !== 'all' && level >= band.min && level <= band.max) ??
    bands.find((band) => band.id === 'all') ??
    bands[bands.length - 1]
  );
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
  exercises: TreeSkill[];
  byId: Map<string, TreeSkill>;
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
export function buildGraph(list: TreeSkill[]): SkillGraph {
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

export function statusOf(exercise: TreeSkill, mastered: ReadonlySet<string>): SkillStatus {
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

export interface LaneSummary {
  lane: string;
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
  ready: TreeSkill[];
  highestLevel: number;
}

export function summarize(graph: SkillGraph, mastered: ReadonlySet<string>, rules: TreeRules = CALISTHENICS_RULES): SkillSummary {
  const order = rules.lanes;
  const ranks = rules.ranks;
  const lanes: LaneSummary[] = order.map((lane) => ({ lane, total: 0, mastered: 0, ready: 0 }));
  const ready: TreeSkill[] = [];
  let masteredCount = 0;
  let xp = 0;
  let highestLevel = 0;

  for (const exercise of graph.exercises) {
    // A skill in a branch the tree does not list still counts towards the totals.
    const lane = lanes[order.indexOf(exercise.swimlane)] as LaneSummary | undefined;
    const status = statusOf(exercise, mastered);
    if (lane) lane.total += 1;
    if (status === 'mastered') {
      if (lane) lane.mastered += 1;
      masteredCount += 1;
      xp += exercise.xpReward;
      highestLevel = Math.max(highestLevel, exercise.level);
    } else if (status === 'ready') {
      if (lane) lane.ready += 1;
      ready.push(exercise);
    }
  }

  ready.sort((a, b) => a.level - b.level || order.indexOf(a.swimlane) - order.indexOf(b.swimlane) || a.name.localeCompare(b.name));

  const rankIndex = ranks.reduce((index, rank, i) => (masteredCount >= rank.min ? i : index), 0);
  const next = ranks[rankIndex + 1];

  return {
    total: graph.exercises.length,
    mastered: masteredCount,
    xp,
    rank: ranks[rankIndex].title,
    nextRank: next
      ? {
          title: next.title,
          remaining: next.min - masteredCount,
          progress: (masteredCount - ranks[rankIndex].min) / (next.min - ranks[rankIndex].min),
        }
      : null,
    lanes,
    ready,
    highestLevel,
  };
}

/* ------------------------------------------------------------------ */
/* Content helpers                                                     */
/* ------------------------------------------------------------------ */

/** True when the steps are the auto-generated filler rather than a written guide. */
export function hasWrittenGuide(exercise: TreeSkill): boolean {
  return !(exercise.description[0] ?? '').startsWith('1. Position your body in the starting');
}

/** The YouTube video id when the exercise links a specific video, otherwise null. */
export function videoIdOf(exercise: TreeSkill): string | null {
  const match = (exercise.videoSearchUrl ?? '').match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  return match ? match[1] : null;
}

/** A YouTube search for the skill; `topic` is added to the name when the skill has no query of its own. */
export function tutorialSearchUrl(exercise: TreeSkill, topic = 'calisthenics tutorial'): string {
  const query = exercise.youtubeQuery || `${exercise.name} ${topic}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
