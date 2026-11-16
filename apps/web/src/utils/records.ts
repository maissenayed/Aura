import { EXERCISE_BY_ID, LIFT_BY_ID } from '../data/campaignCatalog';
import { resolveExerciseId } from '../data/exerciseAliases';
import type { Metric } from './campaignV3';

/**
 * Where an exercise's logged numbers are kept. Each exercise has one record
 * (its latest number) and a history; a few campaign exercises share a record
 * with the skill-tree exercise they are, so max pull-ups are max pull-ups
 * whichever card logged them.
 */

/** v2 lift → the exercise its numbers belong to now, and how they are measured. */
export const LIFT_RECORD: Record<string, { exercise: string; metric: Metric }> = {
  dips: { exercise: 'weighted_dips', metric: 'added-kg' },
  inclineBench: { exercise: 'incline_bench', metric: 'kg' },
  dbPress: { exercise: 'db_press', metric: 'kg' },
  benchPress: { exercise: 'bench_press', metric: 'kg' },
  overheadPress: { exercise: 'overhead_press', metric: 'kg' },
  pushUpReps: { exercise: 'ex_7', metric: 'reps' },
  dipReps: { exercise: 'ex_50', metric: 'reps' },
  hspuReps: { exercise: 'ex_92', metric: 'reps' },
  handstandHold: { exercise: 'ex_62', metric: 'seconds' },
  cableRow: { exercise: 'cable_row', metric: 'kg' },
  chinUps: { exercise: 'weighted_chins', metric: 'added-kg' },
  weightedPullUps: { exercise: 'weighted_pullups', metric: 'added-kg' },
  pullUpReps: { exercise: 'ex_45', metric: 'reps' },
  muscleUpReps: { exercise: 'ex_112', metric: 'reps' },
  barbellRow: { exercise: 'barbell_row', metric: 'kg' },
  latPulldown: { exercise: 'lat_pulldown', metric: 'kg' },
  frontLeverHold: { exercise: 'ex_205', metric: 'seconds' },
  hangTime: { exercise: 'ex_439', metric: 'seconds' },
  splitSquat: { exercise: 'split_squat', metric: 'kg' },
  legCurl: { exercise: 'leg_curl', metric: 'kg' },
  backSquat: { exercise: 'back_squat', metric: 'kg' },
  deadlift: { exercise: 'deadlift', metric: 'kg' },
  pistolReps: { exercise: 'ex_81', metric: 'reps' },
  lsitHold: { exercise: 'ex_42', metric: 'seconds' },
};

/** Record key → the v2 lift it replaced, so logs can also land where an older app reads them. */
export const V2_LIFT_OF_RECORD: Record<string, string> = Object.fromEntries(
  Object.entries(LIFT_RECORD).map(([lift, to]) => [to.exercise, lift]),
);

/** Campaign exercises that log the same number as a skill-tree exercise. */
const RECORD_OF: Record<string, string> = {
  bw_pullups: 'ex_45',
  pullups_amrap: 'ex_45',
  pushups_amrap: 'ex_7',
  bw_dips: 'ex_50',
  hspu: 'ex_92',
  muscle_ups: 'ex_112',
  pistol_squats: 'ex_81',
  front_lever_holds: 'ex_205',
  handstand_practice: 'ex_62',
  lsit_max: 'ex_42',
  lsit_holds: 'ex_42',
  dead_hang: 'ex_439',
};

/** The key an exercise's numbers are kept under. */
export function recordKeyOf(exerciseId: string): string {
  const id = resolveExerciseId(exerciseId);
  return RECORD_OF[id] ?? id;
}

/** How an exercise is measured: its lift's unit, kilos when it has a working weight, else seconds or reps. */
export function metricOf(exerciseId: string): Metric {
  const key = recordKeyOf(exerciseId);
  const v2 = V2_LIFT_OF_RECORD[key];
  if (v2) return LIFT_RECORD[v2].metric;
  const exercise = EXERCISE_BY_ID.get(key) ?? EXERCISE_BY_ID.get(resolveExerciseId(exerciseId));
  if (exercise?.lift) return LIFT_BY_ID.get(exercise.lift)?.unit ?? 'reps';
  if (exercise?.load) return 'kg';
  return exercise?.dose === 'seconds' ? 'seconds' : 'reps';
}

/** How much one tap on the stepper moves the number. */
export function stepOf(metric: Metric): number {
  return metric === 'reps' ? 1 : metric === 'seconds' ? 5 : 2.5;
}
