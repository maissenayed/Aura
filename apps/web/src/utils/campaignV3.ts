/**
 * The campaign format v3: the plan and save shapes the rebuilt Forge, bosses,
 * lifts, towers and map use.
 *
 * What changes from v2:
 * - Lifts are the exercises you train, tracked by their own records (with a
 *   history for progressive overload) instead of a fixed list of stats.
 * - Bosses are written inline and come in three kinds: a skill from the tree
 *   (beaten when it is mastered), an exercise and a number of reps or seconds,
 *   or bodyweight (lift a multiple of it, or reach a target weight).
 * - The small catalogue "trees" become towers of the real skill tree: a summit
 *   skill and everything below it.
 * - Warm-ups have ids so they can be ticked; armor is the joints they guard.
 * - The save keeps records, their history and permanent badges.
 */

import type { Act, BodyweightPlan, Branch, DayId, DayKind, DoseChoice, SpecExercise } from './campaignPlan';

export const PLAN_FORMAT_V3 = 3 as const;

/** How an exercise's number is measured. `added-kg` is load on top of bodyweight. */
export type Metric = 'kg' | 'added-kg' | 'reps' | 'seconds';

/** An exercise whose progress is tracked, with the player's own starting and end-game numbers. */
export interface TrackedLift {
  /** Record key: the canonical exercise id (see `recordKeyOf`). */
  exercise: string;
  metric: Metric;
  baseline: number | null;
  endgame: number | null;
}

/** A warm-up on a day, tickable like a mission. */
export interface WarmUp extends DoseChoice {
  id: string;
}

export interface SpecDayV3 {
  id: DayId;
  title: string;
  kind: DayKind;
  purpose?: string;
  warmUps: WarmUp[];
  exercises: SpecExercise[];
}

/** The joints armor protects; a piece is forged by doing the warm-ups that guard it. */
export type ArmorSlot = 'elbows' | 'wrists' | 'shoulders' | 'fingers' | 'knees' | 'ankles';
export const ARMOR_SLOTS: ArmorSlot[] = ['elbows', 'wrists', 'shoulders', 'fingers', 'knees', 'ankles'];

export type SkillTreeRef = 'calisthenics' | 'bouldering';

interface BossBase {
  id: string;
  name: string;
  category: Branch;
  /** Bosses that must fall before this one can be fought. */
  after?: string[];
}

export type BossSpec =
  | (BossBase & { kind: 'skill'; tree: SkillTreeRef; skill: string })
  /** Reach a number in one set: reps, or seconds for holds (the exercise's metric). */
  | (BossBase & { kind: 'reps'; exercise: string; target: number })
  /** Lift `multiple` × bodyweight: the load for `kg` exercises, bodyweight plus added load for `added-kg` ones. */
  | (BossBase & { kind: 'bodyweight'; mode: 'multiple'; exercise: string; multiple: number })
  /** Reach a body weight. */
  | (BossBase & { kind: 'bodyweight'; mode: 'scale'; kg: number });

/** A tower of the skill tree: the summit skill and every skill below it. */
export interface TowerSpec {
  id: string;
  name: string;
  tree: SkillTreeRef;
  summit: string;
}

export type GoalV3 =
  | { id: string; kind: 'weight'; label: string; kg: number; week?: number }
  | { id: string; kind: 'record'; exercise: string; target: number; label?: string }
  | { id: string; kind: 'boss'; boss: string }
  | { id: string; kind: 'skill'; tree: SkillTreeRef; skill: string; label?: string }
  | { id: string; kind: 'tower'; tower: string };

export interface ActV3 extends Omit<Act, 'goals'> {
  goals: GoalV3[];
}

export interface PlanSpecV3 {
  version: typeof PLAN_FORMAT_V3;
  name: string;
  bodyweight: BodyweightPlan;
  lifts: TrackedLift[];
  days: SpecDayV3[];
  armor: ArmorSlot[];
  bosses: BossSpec[];
  /** Towers; still called `trees` so the stored outline is the same as v2's. */
  trees: TowerSpec[];
  acts: ActV3[];
}

/** One logged number on a day: [ISO date, value]. */
export type HistoryPoint = [string, number];

/** The save fields v3 adds. They ride alongside the v2 fields, which stay readable. */
export interface SaveV3Fields {
  version: typeof PLAN_FORMAT_V3;
  /** Latest logged number per record key. */
  records: Record<string, number>;
  /** Logged numbers over time per record key, oldest first, one per day. */
  history: Record<string, HistoryPoint[]>;
  /** Badges earned, with the date first earned. Never removed. */
  badges: Record<string, string>;
}

/** History kept per exercise: about a year of weekly logs. */
export const HISTORY_LIMIT = 60;
