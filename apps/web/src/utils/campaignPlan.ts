/**
 * The campaign plan.
 *
 * A player's plan is a set of *choices* from the catalog (`data/campaignCatalog.ts`):
 * which exercises go on which day with how many sets and reps, which lifts to
 * track with their own starting and end-game numbers, which bosses and skill
 * trees to chase (with their own targets), which tendon armor to forge, and the
 * acts of the campaign map. That is the `PlanSpec`, the part that is stored and
 * synced. Nothing in it is invented: every exercise, lift, boss, milestone and
 * tree is a catalog id.
 *
 * `resolvePlan` turns a spec into the full `CampaignPlan` the game engine and
 * every tab read — names, units, requirements and what each exercise logs and
 * builds all come from the catalog.
 *
 * `normalizeSpec` turns anything stored or edited into a spec that can be
 * trusted: unknown ids are dropped, numbers are made safe, and everything a
 * choice depends on comes along with it (an exercise that logs a lift adds the
 * lift; a boss that needs another boss adds that boss).
 */

import {
  ARMOR_BY_ID,
  BOSS_BY_ID,
  DOSE_OPTIONS,
  EXERCISE_BY_ID,
  LIFT_BY_ID,
  MILESTONE_BY_ID,
  TREE_BY_ID,
  formatDose,
} from '../data/campaignCatalog';
import { resolveExerciseId } from '../data/exerciseAliases';
import { ARMOR_SLOTS, ArmorSlot, BossSpec, GoalV3, Metric, PLAN_FORMAT_V3, PlanSpecV3, SkillTreeRef, SpecDayV3, TowerSpec, TrackedLift, WarmUp } from './campaignV3';
import { migrateSpec } from './migrateV2';
import { metricOf, recordKeyOf, stepOf } from './records';
import { floorsOf, skillOf } from './treeIndex';

/** The stored plan format the app reads and writes: v3. */
export type PlanSpec = PlanSpecV3;

/* ------------------------------------------------------------------ */
/* Shared types                                                        */
/* ------------------------------------------------------------------ */

export type StatUnit = 'added-kg' | 'kg' | 'reps' | 'seconds';
export type Branch = 'push' | 'pull' | 'legs' | 'core';
export type DayKind = Branch | 'recovery' | 'rest';
export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Character attributes an exercise builds. */
export type TrainableAttribute =
  | 'push'
  | 'pull'
  | 'legs'
  | 'core'
  | 'endurance'
  | 'straight'
  | 'compression'
  | 'balance'
  | 'grip'
  | 'tendon'
  | 'power';

export interface BodyweightPlan {
  start: number;
  goal: number;
  /** Kilos per week towards the goal, used once the dated weight goals run out. */
  weeklyChangeKg: number;
  proteinGrams: number | null;
  /** Free text, e.g. "+300–400 kcal". */
  calories: string;
}

export type ActGoal =
  | { id: string; kind: 'weight'; label: string; kg: number; week?: number }
  | { id: string; kind: 'lift'; lift: string; target: number; label?: string }
  | { id: string; kind: 'boss'; boss: string }
  | { id: string; kind: 'tier'; tier: string }
  | { id: string; kind: 'milestone'; milestone: string }
  | { id: string; kind: 'skill'; tree: SkillTreeRef; skill: string; label?: string }
  | { id: string; kind: 'tower'; tower: string };

export interface Act {
  id: string;
  name: string;
  tagline: string;
  goals: ActGoal[];
}

/* ------------------------------------------------------------------ */
/* The stored plan: choices from the catalog                           */
/* ------------------------------------------------------------------ */

/** A catalog exercise with the sets and reps picked for it. */
export interface DoseChoice {
  exercise: string;
  sets: number;
  reps: string;
}

/** An exercise on a day. Its id is what the day's ticks are stored under. */
export interface SpecExercise extends DoseChoice {
  id: string;
}

export interface SpecDay {
  id: DayId;
  title: string;
  kind: DayKind;
  purpose?: string;
  warmUps: DoseChoice[];
  exercises: SpecExercise[];
}

/** A tracked catalog lift with the player's own numbers. */
export interface SpecLift {
  lift: string;
  /** Null: no starting number, the first log sets it. */
  baseline: number | null;
  endgame: number | null;
}

/** The player's own number for a catalog target. `atGoal` only applies where the catalog target grows with bodyweight. */
export interface TargetOverride {
  target: number;
  atGoal?: number;
}

export interface SpecBoss {
  boss: string;
  /** Keyed by requirement index. */
  targets?: Record<string, TargetOverride>;
}

export interface SpecTree {
  tree: string;
  /** Tier ids the player already owns. */
  cleared?: string[];
  /** Keyed by `${tierId}:${gateIndex}`. */
  targets?: Record<string, TargetOverride>;
}

/** The v2 stored format, kept so older plans can be read and converted. */
export interface PlanSpecV2 {
  version: 2;
  name: string;
  bodyweight: BodyweightPlan;
  lifts: SpecLift[];
  /** Always seven days, Monday first. */
  days: SpecDay[];
  /** Catalog armor ids. */
  armor: string[];
  bosses: SpecBoss[];
  trees: SpecTree[];
  acts: Act[];
}

/* ------------------------------------------------------------------ */
/* The resolved plan the game reads                                    */
/* ------------------------------------------------------------------ */

export interface Lift {
  id: string;
  name: string;
  short: string;
  unit: StatUnit;
  branch: Branch;
  baseline: number;
  hasBaseline: boolean;
  endgame: number | null;
  step: number;
  measure: string;
  note: string;
}

export interface LiftTarget {
  lift: string;
  target: number;
  atGoal?: number;
}

export interface AccessoryLoad {
  start: number | null;
  step: number;
}

export interface PlanExercise {
  id: string;
  /** The catalog exercise. */
  exercise: string;
  name: string;
  /** "4 x 8–12 reps". */
  target: string;
  focus: string;
  lift?: string;
  load?: AccessoryLoad;
  note?: string;
  bosses?: string[];
  armor?: boolean;
  trains?: TrainableAttribute[];
}

export interface PlanDay {
  id: DayId;
  title: string;
  kind: DayKind;
  purpose?: string;
  /** "Scapular Pull-ups — 2 x 10". */
  warmUps: string[];
  exercises: PlanExercise[];
}

export interface ArmorPiece {
  id: string;
  slot: string;
  drill: string;
  when: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
}

export type BossRequirement =
  | ({ kind: 'lift'; label?: string } & LiftTarget)
  | { kind: 'milestone'; milestone: string; label?: string }
  | { kind: 'boss'; boss: string; label?: string }
  /** Master a skill in the tree; the skills leading to it are its weak points. */
  | { kind: 'skill'; tree: SkillTreeRef; skill: string; label?: string }
  /** Lift `multiple` × bodyweight on a lift (bodyweight plus added load for added-kg lifts). */
  | { kind: 'multiple'; lift: string; multiple: number; label?: string }
  /** Reach a body weight. */
  | { kind: 'scale'; kg: number; label?: string };

export interface Boss {
  id: string;
  name: string;
  epithet: string;
  branch: Branch;
  requirements: BossRequirement[];
}

export interface SkillTier {
  id: string;
  rung: string;
  name: string;
  subtitle: string;
  gates: LiftTarget[];
  preCleared?: boolean;
  /** A tower floor: cleared when this skill is mastered. */
  skill?: { tree: SkillTreeRef; id: string };
}

export interface SkillTree {
  id: string;
  name: string;
  tagline: string;
  branch: Branch;
  bossLabel: string;
  /** Bottom rung first. */
  tiers: SkillTier[];
  /** A tower of the skill tree: its floors are the summit and every skill below it. */
  tower?: { tree: SkillTreeRef; summit: string };
}

export interface CampaignPlan {
  name: string;
  bodyweight: BodyweightPlan;
  lifts: Lift[];
  days: PlanDay[];
  armor: ArmorPiece[];
  bosses: Boss[];
  milestones: Milestone[];
  trees: SkillTree[];
  acts: Act[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const DAY_IDS: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_NAMES: Record<DayId, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const BRANCHES: { id: Branch; label: string }[] = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
];

export const DAY_KINDS: { id: DayKind; label: string }[] = [
  ...BRANCHES,
  { id: 'recovery', label: 'Recovery' },
  { id: 'rest', label: 'Rest' },
];

export const TRAINABLE_ATTRIBUTES: { id: TrainableAttribute; label: string }[] = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'straight', label: 'Straight-Arm' },
  { id: 'compression', label: 'Compression' },
  { id: 'balance', label: 'Balance' },
  { id: 'grip', label: 'Grip' },
  { id: 'tendon', label: 'Tendons' },
  { id: 'power', label: 'Power' },
];

const LIMITS = { exercisesPerDay: 20, warmUps: 10, lifts: 40, bosses: 40, trees: 12, acts: 10, goals: 30 };

/* ------------------------------------------------------------------ */
/* Ids                                                                 */
/* ------------------------------------------------------------------ */

/** A short id that will not collide with anything in a plan. */
export function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${random}`;
}

/* ------------------------------------------------------------------ */
/* Building blocks for the editor                                      */
/* ------------------------------------------------------------------ */

/** An exercise picked from the catalog, on its suggested sets and reps. */
export function choiceFor(exerciseId: string): DoseChoice {
  const exercise = EXERCISE_BY_ID.get(exerciseId);
  return { exercise: exerciseId, sets: exercise?.sets ?? 3, reps: exercise?.reps ?? '' };
}

/** The reps options for a catalog exercise. */
export function repsOptions(exerciseId: string): string[] {
  const exercise = EXERCISE_BY_ID.get(exerciseId);
  return !exercise || exercise.dose === 'none' ? [] : DOSE_OPTIONS[exercise.dose];
}

/** Seven rest days and nothing else — for building a plan from scratch. */
export function blankSpec(bodyWeightKg = 70): PlanSpec {
  return { ...blankSpecV2(bodyWeightKg), version: PLAN_FORMAT_V3, lifts: [], armor: [], bosses: [], trees: [], acts: [], days: blankSpecV2(bodyWeightKg).days.map((day) => ({ ...day, warmUps: [] })) };
}

function blankSpecV2(bodyWeightKg = 70): PlanSpecV2 {
  return {
    version: 2,
    name: 'My Campaign',
    bodyweight: { start: bodyWeightKg, goal: bodyWeightKg, weeklyChangeKg: 0.25, proteinGrams: null, calories: '' },
    lifts: [],
    days: DAY_IDS.map((id) => ({ id, title: 'Rest', kind: 'rest' as DayKind, warmUps: [], exercises: [] })),
    armor: [],
    bosses: [],
    trees: [],
    acts: [],
  };
}

/* ------------------------------------------------------------------ */
/* Normalising                                                         */
/* ------------------------------------------------------------------ */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const list = (value: unknown, max: number): unknown[] => (Array.isArray(value) ? value.slice(0, max) : []);

function text(value: unknown, fallback = '', max = 160): string {
  return typeof value === 'string' ? value.trim().slice(0, max) || fallback : fallback;
}

function optionalText(value: unknown, max = 160): string | undefined {
  return text(value, '', max) || undefined;
}

function num(value: unknown, fallback: number, min = -1e6, max = 1e6): number {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function optionalNum(value: unknown, min = -1e6, max = 1e6): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const result = num(value, Number.NaN, min, max);
  return Number.isNaN(result) ? undefined : result;
}

function oneOf<T extends string>(value: unknown, options: readonly { id: T }[], fallback: T): T {
  return options.some((option) => option.id === value) ? (value as T) : fallback;
}

const unique = <T,>(items: T[], key: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

function dose(raw: unknown): DoseChoice | null {
  if (!isRecord(raw) || typeof raw.exercise !== 'string') return null;
  // A plan saved before the calisthenics tree was rebuilt may name a skill that was merged into another.
  const exercise = EXERCISE_BY_ID.get(resolveExerciseId(raw.exercise));
  if (!exercise) return null;
  const options = exercise.dose === 'none' ? [''] : DOSE_OPTIONS[exercise.dose];
  return {
    exercise: exercise.id,
    sets: Math.round(num(raw.sets, exercise.sets, 1, 6)),
    reps: typeof raw.reps === 'string' && options.includes(raw.reps) ? raw.reps : exercise.reps,
  };
}

function overrides(raw: unknown, valid: (key: string) => boolean): Record<string, TargetOverride> | undefined {
  if (!isRecord(raw)) return undefined;
  const result: Record<string, TargetOverride> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!valid(key) || !isRecord(value)) continue;
    const target = optionalNum(value.target, 0);
    if (target === undefined) continue;
    const atGoal = optionalNum(value.atGoal, 0);
    result[key] = atGoal === undefined ? { target } : { target, atGoal };
  }
  return Object.keys(result).length ? result : undefined;
}

/**
 * Turns anything stored or edited into a spec that can be trusted. The
 * fallback is used when the input is not a plan at all.
 */
export function normalizeSpecV2(raw: unknown, fallback: PlanSpecV2): PlanSpecV2 {
  if (!isRecord(raw) || raw.version !== 2) return fallback;

  const bw = isRecord(raw.bodyweight) ? raw.bodyweight : {};
  const start = num(bw.start, fallback.bodyweight.start, 20, 400);
  const bodyweight: BodyweightPlan = {
    start,
    goal: num(bw.goal, start, 20, 400),
    weeklyChangeKg: Math.abs(num(bw.weeklyChangeKg, fallback.bodyweight.weeklyChangeKg, 0.01, 5)),
    proteinGrams: optionalNum(bw.proteinGrams, 0, 1000) ?? null,
    calories: text(bw.calories, '', 60),
  };

  /* Days: catalog exercises only, each with a unique id. */
  const usedIds = new Set<string>();
  const exerciseId = (value: unknown) => {
    let id = typeof value === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(value) ? value : newId('ex');
    while (usedIds.has(id)) id = newId('ex');
    usedIds.add(id);
    return id;
  };
  const rawDays = list(raw.days, 7).filter(isRecord);
  const days: SpecDay[] = DAY_IDS.map((dayId, index) => {
    const day = rawDays.find((entry) => entry.id === dayId) ?? rawDays[index] ?? {};
    const kind = oneOf(day.kind, DAY_KINDS, 'rest');
    const purpose = optionalText(day.purpose, 200);
    return {
      id: dayId,
      title: text(day.title, kind === 'rest' ? 'Rest' : 'Training', 60),
      kind,
      ...(purpose ? { purpose } : {}),
      warmUps: list(day.warmUps, LIMITS.warmUps)
        .map(dose)
        .filter((choice): choice is DoseChoice => choice !== null),
      exercises: list(day.exercises, LIMITS.exercisesPerDay).flatMap((entry) => {
        const choice = dose(entry);
        return choice && isRecord(entry) ? [{ id: exerciseId(entry.id), ...choice }] : [];
      }),
    };
  });

  const armor = unique(
    list(raw.armor, 20).filter((id): id is string => typeof id === 'string' && ARMOR_BY_ID.has(id)),
    (id) => id,
  );

  /* Bosses, plus any boss they require. */
  const bossIds = unique(
    list(raw.bosses, LIMITS.bosses).flatMap((entry) =>
      isRecord(entry) && typeof entry.boss === 'string' && BOSS_BY_ID.has(entry.boss) ? [entry] : [],
    ),
    (entry) => entry.boss as string,
  );
  const bosses: SpecBoss[] = bossIds.map((entry) => {
    const boss = BOSS_BY_ID.get(entry.boss as string)!;
    const targets = overrides(entry.targets, (key) => boss.requirements[Number(key)]?.kind === 'lift');
    return { boss: boss.id, ...(targets ? { targets } : {}) };
  });
  for (let i = 0; i < bosses.length && bosses.length < LIMITS.bosses; i += 1) {
    for (const req of BOSS_BY_ID.get(bosses[i].boss)!.requirements) {
      if (req.kind === 'boss' && !bosses.some((entry) => entry.boss === req.boss)) bosses.push({ boss: req.boss });
    }
  }

  const trees: SpecTree[] = unique(
    list(raw.trees, LIMITS.trees).flatMap((entry) =>
      isRecord(entry) && typeof entry.tree === 'string' && TREE_BY_ID.has(entry.tree) ? [entry] : [],
    ),
    (entry) => entry.tree as string,
  ).map((entry) => {
    const tree = TREE_BY_ID.get(entry.tree as string)!;
    const tierIds = new Set(tree.tiers.map((tier) => tier.id));
    const cleared = list(entry.cleared, tree.tiers.length).filter((id): id is string => typeof id === 'string' && tierIds.has(id));
    const targets = overrides(entry.targets, (key) => {
      const [tierId, gate] = key.split(':');
      return Boolean(tree.tiers.find((tier) => tier.id === tierId)?.gates[Number(gate)]);
    });
    return { tree: tree.id, ...(cleared.length ? { cleared: [...new Set(cleared)] } : {}), ...(targets ? { targets } : {}) };
  });

  /* Lifts the player chose, then every lift something else in the plan needs. */
  const lifts: SpecLift[] = unique(
    list(raw.lifts, LIMITS.lifts).flatMap((entry) =>
      isRecord(entry) && typeof entry.lift === 'string' && LIFT_BY_ID.has(entry.lift) ? [entry] : [],
    ),
    (entry) => entry.lift as string,
  ).map((entry) => {
    const endgame = entry.endgame === null ? null : optionalNum(entry.endgame, 0);
    return {
      lift: entry.lift as string,
      baseline: optionalNum(entry.baseline, 0) ?? null,
      endgame: endgame === undefined ? (LIFT_BY_ID.get(entry.lift as string)!.endgame ?? null) : endgame && endgame > 0 ? endgame : null,
    };
  });

  const rawActs = list(raw.acts, LIMITS.acts).filter(isRecord);
  const needed = new Set<string>();
  days.forEach((day) => day.exercises.forEach((entry) => {
    const lift = EXERCISE_BY_ID.get(entry.exercise)?.lift;
    if (lift) needed.add(lift);
  }));
  bosses.forEach((entry) =>
    BOSS_BY_ID.get(entry.boss)!.requirements.forEach((req) => req.kind === 'lift' && needed.add(req.lift)),
  );
  trees.forEach((entry) => TREE_BY_ID.get(entry.tree)!.tiers.forEach((tier) => tier.gates.forEach((gate) => needed.add(gate.lift))));
  rawActs.forEach((act) =>
    list(act.goals, LIMITS.goals).forEach((goal) => {
      if (isRecord(goal) && goal.kind === 'lift' && typeof goal.lift === 'string' && LIFT_BY_ID.has(goal.lift)) needed.add(goal.lift);
    }),
  );
  for (const id of needed) {
    if (!lifts.some((entry) => entry.lift === id)) lifts.push({ lift: id, baseline: null, endgame: LIFT_BY_ID.get(id)!.endgame });
  }

  /* The map can only point at what the plan has. */
  const liftIds = new Set(lifts.map((entry) => entry.lift));
  const planBossIds = new Set(bosses.map((entry) => entry.boss));
  const tierIds = new Set(trees.flatMap((entry) => TREE_BY_ID.get(entry.tree)!.tiers.map((tier) => tier.id)));
  const milestoneIds = new Set(milestonesOf(bosses).map((milestone) => milestone.id));
  const goalIds = new Set<string>();
  const goalId = (value: unknown) => {
    let id = typeof value === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(value) ? value : newId('goal');
    while (goalIds.has(id)) id = newId('goal');
    goalIds.add(id);
    return id;
  };
  const actIds = new Set<string>();

  const acts: Act[] = rawActs.map((act) => {
    let id = typeof act.id === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(act.id) ? act.id : newId('act');
    while (actIds.has(id)) id = newId('act');
    actIds.add(id);
    return {
      id,
      name: text(act.name, 'Untitled act', 60),
      tagline: text(act.tagline, '', 200),
      goals: list(act.goals, LIMITS.goals)
        .filter(isRecord)
        .map((goal): ActGoal | null => {
          switch (goal.kind) {
            case 'weight': {
              const week = optionalNum(goal.week, 1, 520);
              return {
                id: goalId(goal.id),
                kind: 'weight',
                label: text(goal.label, 'Weight goal', 40),
                kg: num(goal.kg, bodyweight.goal, 20, 400),
                ...(week === undefined ? {} : { week: Math.round(week) }),
              };
            }
            case 'lift': {
              if (typeof goal.lift !== 'string' || !liftIds.has(goal.lift)) return null;
              const label = optionalText(goal.label, 60);
              return { id: goalId(goal.id), kind: 'lift', lift: goal.lift, target: num(goal.target, 0, 0), ...(label ? { label } : {}) };
            }
            case 'boss':
              return typeof goal.boss === 'string' && planBossIds.has(goal.boss) ? { id: goalId(goal.id), kind: 'boss', boss: goal.boss } : null;
            case 'tier':
              return typeof goal.tier === 'string' && tierIds.has(goal.tier) ? { id: goalId(goal.id), kind: 'tier', tier: goal.tier } : null;
            case 'milestone':
              return typeof goal.milestone === 'string' && milestoneIds.has(goal.milestone)
                ? { id: goalId(goal.id), kind: 'milestone', milestone: goal.milestone }
                : null;
            default:
              return null;
          }
        })
        .filter((goal): goal is ActGoal => goal !== null),
    };
  });

  return { version: 2, name: text(raw.name, fallback.name, 60), bodyweight, lifts, days, armor, bosses, trees, acts };
}

/** The milestones the chosen bosses ask for, in catalog order. */
function milestonesOf(bosses: SpecBoss[]): Milestone[] {
  const ids = new Set(
    bosses.flatMap((entry) =>
      (BOSS_BY_ID.get(entry.boss)?.requirements ?? []).flatMap((req) => (req.kind === 'milestone' ? [req.milestone] : [])),
    ),
  );
  return [...MILESTONE_BY_ID.values()].filter((milestone) => ids.has(milestone.id));
}

/* ------------------------------------------------------------------ */
/* Resolving                                                           */
/* ------------------------------------------------------------------ */

function applyOverride(base: LiftTarget, override: TargetOverride | undefined): LiftTarget {
  const target = override?.target ?? base.target;
  if (base.atGoal === undefined) return { lift: base.lift, target };
  return { lift: base.lift, target, atGoal: override?.atGoal ?? base.atGoal };
}

/** A v2 plan resolved the v2 way (used to read and convert old plans). Expects a normalized v2 spec. */
export function resolvePlanV2(spec: PlanSpecV2): CampaignPlan {
  const lifts: Lift[] = spec.lifts.flatMap((entry) => {
    const lift = LIFT_BY_ID.get(entry.lift);
    if (!lift) return [];
    return [
      {
        id: lift.id,
        name: lift.name,
        short: lift.short,
        unit: lift.unit,
        branch: lift.branch,
        baseline: entry.baseline ?? 0,
        hasBaseline: entry.baseline !== null,
        endgame: entry.endgame,
        step: lift.step,
        measure: lift.measure,
        note: lift.note,
      },
    ];
  });
  const liftIds = new Set(lifts.map((lift) => lift.id));
  const bossIds = new Set(spec.bosses.map((entry) => entry.boss));

  const bosses: Boss[] = spec.bosses.flatMap((entry) => {
    const boss = BOSS_BY_ID.get(entry.boss);
    if (!boss) return [];
    const requirements = boss.requirements.flatMap((req, index): BossRequirement[] => {
      if (req.kind === 'lift') {
        return liftIds.has(req.lift) ? [{ kind: 'lift', label: req.label, ...applyOverride(req, entry.targets?.[index]) }] : [];
      }
      if (req.kind === 'boss') return bossIds.has(req.boss) ? [{ kind: 'boss', boss: req.boss, label: req.label }] : [];
      return [{ kind: 'milestone', milestone: req.milestone, label: req.label }];
    });
    return [{ id: boss.id, name: boss.name, epithet: boss.epithet, branch: boss.branch, requirements }];
  });

  const trees: SkillTree[] = spec.trees.flatMap((entry) => {
    const tree = TREE_BY_ID.get(entry.tree);
    if (!tree) return [];
    return [
      {
        id: tree.id,
        name: tree.name,
        tagline: tree.tagline,
        branch: tree.branch,
        bossLabel: tree.bossLabel,
        tiers: tree.tiers.map((tier) => ({
          id: tier.id,
          rung: tier.rung,
          name: tier.name,
          subtitle: tier.subtitle,
          gates: tier.gates
            .map((gate, index) => applyOverride(gate, entry.targets?.[`${tier.id}:${index}`]))
            .filter((gate) => liftIds.has(gate.lift)),
          ...(entry.cleared?.includes(tier.id) ? { preCleared: true } : {}),
        })),
      },
    ];
  });

  const days: PlanDay[] = spec.days.map((day) => ({
    id: day.id,
    title: day.title,
    kind: day.kind,
    ...(day.purpose ? { purpose: day.purpose } : {}),
    warmUps: day.warmUps.flatMap((choice) => {
      const exercise = EXERCISE_BY_ID.get(choice.exercise);
      if (!exercise) return [];
      const dosed = formatDose(exercise, choice.sets, choice.reps, true);
      return [dosed ? `${exercise.name} — ${dosed}` : exercise.name];
    }),
    exercises: day.exercises.flatMap((choice): PlanExercise[] => {
      const exercise = EXERCISE_BY_ID.get(choice.exercise);
      if (!exercise) return [];
      const lift = exercise.lift && liftIds.has(exercise.lift) ? exercise.lift : undefined;
      // An exercise feeds every boss that asks for the lift it logs, plus any the catalog names.
      const fed = bosses
        .filter(
          (boss) =>
            exercise.feeds?.includes(boss.id) || (lift && boss.requirements.some((req) => req.kind === 'lift' && req.lift === lift)),
        )
        .map((boss) => boss.id);
      return [
        {
          id: choice.id,
          exercise: exercise.id,
          name: exercise.name,
          target: formatDose(exercise, choice.sets, choice.reps),
          focus: exercise.focus,
          ...(lift ? { lift } : {}),
          ...(!lift && exercise.load ? { load: { ...exercise.load } } : {}),
          ...(exercise.note ? { note: exercise.note } : {}),
          ...(fed.length ? { bosses: fed } : {}),
          ...(exercise.armor ? { armor: true } : {}),
          ...(exercise.trains.length ? { trains: [...exercise.trains] } : {}),
        },
      ];
    }),
  }));

  return {
    name: spec.name,
    bodyweight: { ...spec.bodyweight },
    lifts,
    days,
    armor: spec.armor.flatMap((id) => {
      const piece = ARMOR_BY_ID.get(id);
      return piece ? [{ ...piece }] : [];
    }),
    bosses,
    milestones: milestonesOf(spec.bosses).map((milestone) => ({ ...milestone })),
    trees,
    acts: spec.acts.map((act) => ({ ...act, goals: act.goals.map((goal) => ({ ...goal })) })),
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** The short unit shown next to a lift's number box. */
export function unitLabel(unit: StatUnit): string {
  return unit === 'reps' ? 'reps' : unit === 'seconds' ? 's' : 'kg';
}

/** "+10 kg", "45 kg", "12 reps", "30 s". */
export function formatStatValue(value: number, unit: StatUnit): string {
  const rounded = Math.round(value * 10) / 10;
  if (unit === 'reps') return `${rounded} reps`;
  if (unit === 'added-kg') return `+${rounded} kg`;
  if (unit === 'seconds') return `${rounded} s`;
  return `${rounded} kg`;
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export function liftOf(plan: CampaignPlan, id: string | undefined): Lift | undefined {
  return id ? plan.lifts.find((lift) => lift.id === id) : undefined;
}

export function allExercises(plan: CampaignPlan): (PlanExercise & { day: DayId })[] {
  return plan.days.flatMap((day) => day.exercises.map((exercise) => ({ ...exercise, day: day.id })));
}

/** Where else in the plan something is used, in words — shown before removing it. */
export function usesOf(plan: CampaignPlan, kind: 'lift' | 'boss' | 'tower', id: string): string[] {
  const uses: string[] = [];
  const count = (n: number, one: string, many: string) => n > 0 && uses.push(`${n} ${n === 1 ? one : many}`);
  const goals = plan.acts.flatMap((act) => act.goals);

  if (kind === 'lift') {
    count(allExercises(plan).filter((exercise) => exercise.lift === id).length, 'mission', 'missions');
    count(
      plan.bosses.filter((boss) => boss.requirements.some((req) => (req.kind === 'lift' || req.kind === 'multiple') && req.lift === id)).length,
      'boss',
      'bosses',
    );
    count(goals.filter((goal) => goal.kind === 'lift' && goal.lift === id).length, 'map goal', 'map goals');
  }
  if (kind === 'boss') {
    count(plan.bosses.filter((boss) => boss.requirements.some((req) => req.kind === 'boss' && req.boss === id)).length, 'other boss', 'other bosses');
    count(goals.filter((goal) => goal.kind === 'boss' && goal.boss === id).length, 'map goal', 'map goals');
  }
  if (kind === 'tower') {
    count(goals.filter((goal) => goal.kind === 'tower' && goal.tower === id).length, 'map goal', 'map goals');
  }
  return uses;
}

/* ------------------------------------------------------------------ */
/* v3: normalising and resolving                                       */
/* ------------------------------------------------------------------ */

const METRICS: { id: Metric }[] = [{ id: 'kg' }, { id: 'added-kg' }, { id: 'reps' }, { id: 'seconds' }];
const TREES: { id: SkillTreeRef }[] = [{ id: 'calisthenics' }, { id: 'bouldering' }];
const SAFE_ID = /^[A-Za-z0-9_:-]{1,60}$/;

/** An exercise the campaign can track: in the catalogue or the skill tree. */
export function isKnownExercise(id: string): boolean {
  return EXERCISE_BY_ID.has(resolveExerciseId(id)) || EXERCISE_BY_ID.has(recordKeyOf(id)) || Boolean(skillOf('calisthenics', id));
}

/** The name a record is shown under: the catalogue's, else the skill tree's. */
export function recordName(key: string): string {
  return EXERCISE_BY_ID.get(key)?.name ?? skillOf('calisthenics', key)?.name ?? key;
}

function branchOfRecord(key: string): Branch {
  const category = EXERCISE_BY_ID.get(key)?.category;
  if (category === 'push' || category === 'pull' || category === 'legs' || category === 'core') return category;
  const lane = skillOf('calisthenics', key)?.swimlane?.toLowerCase();
  return lane === 'push' || lane === 'pull' || lane === 'legs' ? lane : 'core';
}

/** A short id unique within `used`, kept from the stored value when it is safe. */
function idIn(used: Set<string>, value: unknown, prefix: string): string {
  let id = typeof value === 'string' && SAFE_ID.test(value) ? value : newId(prefix);
  while (used.has(id)) id = newId(prefix);
  used.add(id);
  return id;
}

/**
 * Turns anything stored or edited into a v3 spec that can be trusted. A v2
 * plan is converted on the way in; anything else gives the fallback.
 */
export function normalizeSpec(raw: unknown, fallback: PlanSpec): PlanSpec {
  if (!isRecord(raw)) return fallback;
  if (raw.version === 2) return normalizeV3(migrateSpec(normalizeSpecV2(raw, blankSpecV2(fallback.bodyweight.start))).spec, fallback);
  if (raw.version !== PLAN_FORMAT_V3) return fallback;
  return normalizeV3(raw, fallback);
}

function normalizeV3(source: unknown, fallback: PlanSpec): PlanSpec {
  const raw = source as Record<string, unknown>;
  const bw = isRecord(raw.bodyweight) ? raw.bodyweight : {};
  const start = num(bw.start, fallback.bodyweight.start, 20, 400);
  const bodyweight: BodyweightPlan = {
    start,
    goal: num(bw.goal, start, 20, 400),
    weeklyChangeKg: Math.abs(num(bw.weeklyChangeKg, fallback.bodyweight.weeklyChangeKg, 0.01, 5)),
    proteinGrams: optionalNum(bw.proteinGrams, 0, 1000) ?? null,
    calories: text(bw.calories, '', 60),
  };

  /* Days: catalogue exercises only; every mission and warm-up with a unique id. */
  const usedIds = new Set<string>();
  const rawDays = list(raw.days, 7).filter(isRecord);
  const days: SpecDayV3[] = DAY_IDS.map((dayId, index) => {
    const day = rawDays.find((entry) => entry.id === dayId) ?? rawDays[index] ?? {};
    const kind = oneOf(day.kind, DAY_KINDS, 'rest');
    const purpose = optionalText(day.purpose, 200);
    return {
      id: dayId,
      title: text(day.title, kind === 'rest' ? 'Rest' : 'Training', 60),
      kind,
      ...(purpose ? { purpose } : {}),
      warmUps: list(day.warmUps, LIMITS.warmUps).flatMap((entry): WarmUp[] => {
        const choice = dose(entry);
        return choice && isRecord(entry) ? [{ id: idIn(usedIds, entry.id ?? `${dayId}_warm_${choice.exercise}`, `${dayId}_warm`), ...choice }] : [];
      }),
      exercises: list(day.exercises, LIMITS.exercisesPerDay).flatMap((entry) => {
        const choice = dose(entry);
        return choice && isRecord(entry) ? [{ id: idIn(usedIds, entry.id, 'ex'), ...choice }] : [];
      }),
    };
  });

  const lifts: TrackedLift[] = unique(
    list(raw.lifts, LIMITS.lifts).flatMap((entry): TrackedLift[] => {
      if (!isRecord(entry) || typeof entry.exercise !== 'string' || !isKnownExercise(entry.exercise)) return [];
      const exercise = recordKeyOf(entry.exercise);
      const endgame = entry.endgame === null ? null : optionalNum(entry.endgame, 0);
      return [
        {
          exercise,
          metric: oneOf(entry.metric, METRICS, metricOf(exercise)),
          baseline: optionalNum(entry.baseline, 0) ?? null,
          endgame: endgame && endgame > 0 ? endgame : null,
        },
      ];
    }),
    (lift) => lift.exercise,
  );

  const armor = unique(
    list(raw.armor, ARMOR_SLOTS.length).filter((slot): slot is ArmorSlot => ARMOR_SLOTS.includes(slot as ArmorSlot)),
    (slot) => slot,
  );

  /* Bosses, each of one kind; `after` may only name another boss of the plan. */
  const bossIdsUsed = new Set<string>();
  const bosses: BossSpec[] = list(raw.bosses, LIMITS.bosses).flatMap((entry): BossSpec[] => {
    if (!isRecord(entry)) return [];
    const base = {
      id: idIn(bossIdsUsed, entry.id, 'boss'),
      name: text(entry.name, '', 60),
      category: oneOf(entry.category, BRANCHES, 'push'),
      ...(Array.isArray(entry.after) ? { after: entry.after.filter((id): id is string => typeof id === 'string') } : {}),
    };
    if (entry.kind === 'skill') {
      const tree = oneOf(entry.tree, TREES, 'calisthenics');
      const skill = typeof entry.skill === 'string' ? skillOf(tree, entry.skill) : undefined;
      return skill ? [{ ...base, name: base.name || `The ${skill.name}`, kind: 'skill', tree, skill: skill.id }] : [];
    }
    if (entry.kind === 'reps') {
      if (typeof entry.exercise !== 'string' || !isKnownExercise(entry.exercise)) return [];
      const exercise = recordKeyOf(entry.exercise);
      const target = num(entry.target, 0, 0, 100_000);
      return target > 0 ? [{ ...base, name: base.name || `${target} ${recordName(exercise)}`, kind: 'reps', exercise, target }] : [];
    }
    if (entry.kind === 'bodyweight' && entry.mode === 'scale') {
      const kg = num(entry.kg, bodyweight.goal, 20, 400);
      return [{ ...base, name: base.name || `Reach ${kg} kg`, kind: 'bodyweight', mode: 'scale', kg }];
    }
    if (entry.kind === 'bodyweight') {
      if (typeof entry.exercise !== 'string' || !isKnownExercise(entry.exercise)) return [];
      const exercise = recordKeyOf(entry.exercise);
      const multiple = Math.round(num(entry.multiple, 1, 0.1, 5) * 100) / 100;
      return [{ ...base, name: base.name || `${recordName(exercise)} ${multiple}× bodyweight`, kind: 'bodyweight', mode: 'multiple', exercise, multiple }];
    }
    return [];
  });
  const bossIds = new Set(bosses.map((boss) => boss.id));
  for (const boss of bosses) {
    if (boss.after) {
      const after = [...new Set(boss.after.filter((id) => id !== boss.id && bossIds.has(id)))];
      if (after.length) boss.after = after;
      else delete boss.after;
    }
  }

  const towerIdsUsed = new Set<string>();
  const towers: TowerSpec[] = list(raw.trees, LIMITS.trees).flatMap((entry): TowerSpec[] => {
    if (!isRecord(entry) || typeof entry.summit !== 'string') return [];
    const tree = oneOf(entry.tree, TREES, 'calisthenics');
    const summit = skillOf(tree, entry.summit);
    if (!summit) return [];
    return [{ id: idIn(towerIdsUsed, entry.id, 'tower'), name: text(entry.name, `The ${summit.name} Tower`, 60), tree, summit: summit.id }];
  });
  const towerIds = new Set(towers.map((tower) => tower.id));

  const goalIds = new Set<string>();
  const actIds = new Set<string>();
  const acts = list(raw.acts, LIMITS.acts)
    .filter(isRecord)
    .map((act) => ({
      id: idIn(actIds, act.id, 'act'),
      name: text(act.name, 'Untitled act', 60),
      tagline: text(act.tagline, '', 200),
      goals: list(act.goals, LIMITS.goals)
        .filter(isRecord)
        .flatMap((goal): GoalV3[] => {
          switch (goal.kind) {
            case 'weight': {
              const week = optionalNum(goal.week, 1, 520);
              return [
                {
                  id: idIn(goalIds, goal.id, 'goal'),
                  kind: 'weight',
                  label: text(goal.label, 'Weight goal', 40),
                  kg: num(goal.kg, bodyweight.goal, 20, 400),
                  ...(week === undefined ? {} : { week: Math.round(week) }),
                },
              ];
            }
            case 'record': {
              if (typeof goal.exercise !== 'string' || !isKnownExercise(goal.exercise)) return [];
              const label = optionalText(goal.label, 60);
              return [{ id: idIn(goalIds, goal.id, 'goal'), kind: 'record', exercise: recordKeyOf(goal.exercise), target: num(goal.target, 0, 0), ...(label ? { label } : {}) }];
            }
            case 'boss':
              return typeof goal.boss === 'string' && bossIds.has(goal.boss) ? [{ id: idIn(goalIds, goal.id, 'goal'), kind: 'boss', boss: goal.boss }] : [];
            case 'skill': {
              const tree = oneOf(goal.tree, TREES, 'calisthenics');
              const skill = typeof goal.skill === 'string' ? skillOf(tree, goal.skill) : undefined;
              const label = optionalText(goal.label, 60);
              return skill ? [{ id: idIn(goalIds, goal.id, 'goal'), kind: 'skill', tree, skill: skill.id, ...(label ? { label } : {}) }] : [];
            }
            case 'tower':
              return typeof goal.tower === 'string' && towerIds.has(goal.tower) ? [{ id: idIn(goalIds, goal.id, 'goal'), kind: 'tower', tower: goal.tower }] : [];
            default:
              return [];
          }
        }),
    }));

  return { version: PLAN_FORMAT_V3, name: text(raw.name, fallback.name, 60), bodyweight, lifts, days, armor, bosses, trees: towers, acts };
}

function epithetOf(boss: BossSpec): string {
  if (boss.kind === 'skill') return `Master ${skillOf(boss.tree, boss.skill)?.name ?? 'the skill'} in the skill tree`;
  if (boss.kind === 'reps') {
    const metric = metricOf(boss.exercise);
    return `${boss.target}${metric === 'seconds' ? ' s' : ' reps'} of ${recordName(boss.exercise)} in one go`;
  }
  if (boss.mode === 'scale') return `Reach ${boss.kg} kg on the scale`;
  return `${recordName(boss.exercise)} at ${boss.multiple}× your bodyweight`;
}

/**
 * A mission whose number is worth tracking: reps, a hold, or a load. Mobility
 * minutes, climbing volume and recovery are ticked, not measured.
 */
function measuresProgress(exerciseId: string): boolean {
  const exercise = EXERCISE_BY_ID.get(exerciseId);
  if (!exercise || exercise.category === 'recovery' || exercise.category === 'warmup') return false;
  return Boolean(exercise.lift || exercise.load) || exercise.dose === 'reps' || exercise.dose === 'seconds';
}

/** The full plan the game reads, built from a normalized v3 spec and the catalogue. */
export function resolvePlan(spec: PlanSpec): CampaignPlan {
  /* Every exercise the plan logs is a lift: the ones with the player's own numbers first, then the rest. */
  const explicit = new Map(spec.lifts.map((lift) => [lift.exercise, lift]));
  const order: string[] = [...explicit.keys()];
  const want = (key: string) => {
    if (!order.includes(key)) order.push(key);
  };
  spec.days.forEach((day) =>
    day.exercises.forEach((entry) => {
      if (measuresProgress(entry.exercise)) want(recordKeyOf(entry.exercise));
    }),
  );
  spec.bosses.forEach((boss) => {
    if (boss.kind === 'reps' || (boss.kind === 'bodyweight' && boss.mode === 'multiple')) want(boss.exercise);
  });
  spec.acts.forEach((act) => act.goals.forEach((goal) => goal.kind === 'record' && want(goal.exercise)));
  const lifts: Lift[] = order.map((key) => {
    const own = explicit.get(key);
    const unit = own?.metric ?? metricOf(key);
    const name = recordName(key);
    return {
      id: key,
      name,
      short: name,
      unit,
      branch: branchOfRecord(key),
      baseline: own?.baseline ?? 0,
      hasBaseline: own?.baseline != null,
      endgame: own?.endgame ?? null,
      step: stepOf(unit),
      measure: unit === 'reps' ? 'max reps' : unit === 'seconds' ? 'longest hold' : unit === 'added-kg' ? 'added load' : 'working weight',
      note: '',
    };
  });

  const liftIds = new Set(lifts.map((lift) => lift.id));

  const bosses: Boss[] = spec.bosses.map((boss) => {
    const requirements: BossRequirement[] = (boss.after ?? []).map((id) => ({
      kind: 'boss' as const,
      boss: id,
      label: `${spec.bosses.find((other) => other.id === id)?.name ?? 'Another boss'} defeated`,
    }));
    if (boss.kind === 'skill') requirements.push({ kind: 'skill', tree: boss.tree, skill: boss.skill, label: `Master ${skillOf(boss.tree, boss.skill)?.name ?? 'the skill'}` });
    else if (boss.kind === 'reps') requirements.push({ kind: 'lift', lift: boss.exercise, target: boss.target, label: recordName(boss.exercise) });
    else if (boss.mode === 'multiple') requirements.push({ kind: 'multiple', lift: boss.exercise, multiple: boss.multiple, label: `${recordName(boss.exercise)} · ${boss.multiple}× bodyweight` });
    else requirements.push({ kind: 'scale', kg: boss.kg, label: `${boss.kg} kg on the scale` });
    return { id: boss.id, name: boss.name, epithet: epithetOf(boss), branch: boss.category, requirements };
  });

  const towerBranch = (tree: SkillTreeRef, summit: string): Branch => {
    const lane = skillOf(tree, summit)?.swimlane?.toLowerCase();
    return lane === 'push' || lane === 'pull' || lane === 'legs' ? lane : 'core';
  };
  const trees: SkillTree[] = spec.trees.map((tower) => {
    const summit = skillOf(tower.tree, tower.summit);
    return {
      id: tower.id,
      name: tower.name,
      tagline: `Every skill up to ${summit?.name ?? 'the summit'}`,
      branch: towerBranch(tower.tree, tower.summit),
      bossLabel: summit?.name ?? 'Summit',
      tower: { tree: tower.tree, summit: tower.summit },
      tiers: floorsOf(tower.tree, tower.summit).map((floor) => ({
        id: floor.id,
        rung: `${tower.tree === 'bouldering' ? 'V' : 'L'}${floor.level}`,
        name: floor.name,
        subtitle: floor.subCategory,
        gates: [],
        skill: { tree: tower.tree, id: floor.id },
      })),
    };
  });

  const days: PlanDay[] = spec.days.map((day) => ({
    id: day.id,
    title: day.title,
    kind: day.kind,
    ...(day.purpose ? { purpose: day.purpose } : {}),
    warmUps: day.warmUps.flatMap((choice) => {
      const exercise = EXERCISE_BY_ID.get(choice.exercise);
      if (!exercise) return [];
      const dosed = formatDose(exercise, choice.sets, choice.reps, true);
      return [dosed ? `${exercise.name} — ${dosed}` : exercise.name];
    }),
    exercises: day.exercises.flatMap((choice): PlanExercise[] => {
      const exercise = EXERCISE_BY_ID.get(choice.exercise);
      if (!exercise) return [];
      const lift = recordKeyOf(exercise.id);
      // An exercise feeds every boss that reads its record, and every skill boss it is a step towards.
      const fed = spec.bosses
        .filter((boss) =>
          boss.kind === 'skill'
            ? floorsOf(boss.tree, boss.skill).some((floor) => floor.id === lift)
            : boss.kind === 'reps' || (boss.kind === 'bodyweight' && boss.mode === 'multiple')
              ? boss.exercise === lift
              : false,
        )
        .map((boss) => boss.id);
      return [
        {
          id: choice.id,
          exercise: exercise.id,
          name: exercise.name,
          target: formatDose(exercise, choice.sets, choice.reps),
          focus: exercise.focus,
          ...(liftIds.has(lift) ? { lift } : {}),
          ...(exercise.note ? { note: exercise.note } : {}),
          ...(fed.length ? { bosses: fed } : {}),
          ...(exercise.armor ? { armor: true } : {}),
          ...(exercise.trains.length ? { trains: [...exercise.trains] } : {}),
        },
      ];
    }),
  }));

  return {
    name: spec.name,
    bodyweight: { ...spec.bodyweight },
    lifts,
    days,
    armor: spec.armor.flatMap((slot) => {
      const piece = ARMOR_BY_ID.get(`armor_${slot}`);
      return piece ? [{ ...piece }] : [];
    }),
    bosses,
    milestones: [],
    trees,
    acts: spec.acts.map((act) => ({
      ...act,
      goals: act.goals.map((goal): ActGoal =>
        goal.kind === 'record'
          ? { id: goal.id, kind: 'lift', lift: goal.exercise, target: goal.target, ...(goal.label ? { label: goal.label } : {}) }
          : { ...goal },
      ),
    })),
  };
}
