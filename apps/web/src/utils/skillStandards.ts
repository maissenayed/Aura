import type { RawExercise } from '@aura/types';
import { currentRawExercises, fromExerciseList } from '../data/exercisesData';
import { EXERCISE_BY_ID } from '../data/campaignCatalog';
import { YOGA_POSES } from '../data/yogaTree';
import { metricOf, recordKeyOf } from './records';
import type { ProtocolSave } from './protocolEngine';
import { isAssumed, passDatesOf, provenByPasses } from './evidence';

/**
 * Tree skills a logged number can prove, so they count as mastered without a
 * trip to the tree.
 *
 * A gym skill's standard is a multiple of bodyweight ("3×10 at 0.4x BW", "1x BW
 * × 8"): the best log of its lift has to reach that multiple of the athlete's
 * bodyweight. The working weight is logged for the sets and reps the plan asks
 * for, so the reps in the standard are taken as met.
 *
 * A bodyweight skill's standard is a count ("30 s hold", "5 per leg", "3x10",
 * "3 strict reps"): the best log of the same exercise has to reach it, in the
 * same unit. For "3x10" the logged number is one set, so it has to reach 10.
 * Standards written any other way ("4 sets of 8-10 reps with full range of
 * motion") stay on the tree.
 *
 * A yoga pose's standard is a hold ("30 s each side…"): a logged hold of the
 * pose that long is a pass, as it is for a calisthenics hold.
 *
 * A day whose log meets the standard is a pass, like a test passed on the
 * tree. One pass lands the skill; a second on another day, 48 hours to 21 days
 * later, masters it. Numbers written by ticking a mission are not logs.
 */

/** Rungs of a line that are the same lift at a heavier standard. */
const SAME_LIFT_AS: Record<string, string> = {
  machine_chest_press_bw: 'machine_chest_press',
  gym_bench_bodyweight: 'bench_press',
  gym_bench_1_5x: 'bench_press',
  gym_bench_2x: 'bench_press',
  gym_row_bodyweight: 'barbell_row',
  gym_squat_1_5x: 'back_squat',
  gym_squat_2x: 'back_squat',
  gym_squat_2_5x: 'back_squat',
  gym_deadlift_2x: 'deadlift',
  gym_deadlift_2_5x: 'deadlift',
  gym_deadlift_3x: 'deadlift',
  leg_press_2x: 'leg_press',
  leg_press_3x: 'leg_press',
  gym_farmers_bodyweight: 'farmers_carry',
};

/** Totals add three lifts together; no single log proves them. */
const NOT_ONE_LIFT = new Set(['total_4x', 'total_5x', 'total_6x']);

/** The trees whose skills a log can prove. */
export type LoggedTree = 'calisthenics' | 'yoga';

export type SkillStandard =
  | {
      kind: 'multiple';
      tree: 'calisthenics';
      skill: string;
      name: string;
      /** The record keys whose logs prove it. */
      records: string[];
      /** Multiple of bodyweight the lift has to reach. */
      multiple: number;
    }
  | {
      kind: 'count';
      tree: LoggedTree;
      skill: string;
      name: string;
      records: string[];
      metric: 'reps' | 'seconds';
      /** The reps or seconds one logged set has to reach. */
      value: number;
    };

function gymStandards(raw: RawExercise[]): SkillStandard[] {
  return raw.flatMap((exercise): SkillStandard[] => {
    if (exercise.discipline !== 'gym' || NOT_ONE_LIFT.has(exercise.id) || !exercise.standard) return [];
    // "+0.25x BW" is load on top of bodyweight; only plain multiples of the load are read.
    const match = /(?:^|[^+\d.])(\d+(?:\.\d+)?)x BW/.exec(exercise.standard);
    if (!match) return [];
    const lift = SAME_LIFT_AS[exercise.id] ?? exercise.id;
    if (metricOf(lift) !== 'kg') return [];
    return [{ kind: 'multiple', tree: 'calisthenics', skill: exercise.id, name: exercise.name, records: [recordKeyOf(lift)], multiple: Number(match[1]) }];
  });
}

/** A count standard as written at the start of the text, or null when it says something else. */
export function parseCountStandard(text: string): { metric: 'reps' | 'seconds'; value: number } | null {
  const sets = /^(\d+)\s*[x×]\s*(\d+)\s*(s\b|sec)?/i.exec(text);
  if (sets) return { metric: sets[3] ? 'seconds' : 'reps', value: Number(sets[2]) };
  const seconds = /^(\d+)\s*s\b/i.exec(text);
  if (seconds) return { metric: 'seconds', value: Number(seconds[1]) };
  const reps = /^(\d+)\s+(?:strict |slow |clean |full )?(?:reps?|per leg|per side|per arm)\b/i.exec(text);
  if (reps) return { metric: 'reps', value: Number(reps[1]) };
  return null;
}

/** A name as two cards for the same exercise both write it: no plurals, brackets or a timed rung's seconds. */
const baseName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\s\d+\s*s$/, '')
    .replace(/[^a-z0-9 -]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.replace(/s$/, ''))
    .join(' ');

/** Every standard the logs can prove, worked out from the exercise list in use. */
const standards = fromExerciseList(() => {
  const raw = currentRawExercises();
  const calisthenics = raw.filter((exercise) => exercise.discipline !== 'gym' && exercise.discipline !== 'bouldering');

  // Record keys that log an exercise, by its base name: the tree's own ids and the campaign cards with the same name.
  const recordsByName = new Map<string, Set<string>>();
  const add = (name: string, key: string) => {
    const base = baseName(name);
    if (!recordsByName.has(base)) recordsByName.set(base, new Set());
    recordsByName.get(base)!.add(key);
  };
  for (const exercise of calisthenics) add(exercise.name, exercise.id);
  for (const [id, exercise] of EXERCISE_BY_ID) if (!id.startsWith('ex_')) add(exercise.name, recordKeyOf(id));

  const counts = calisthenics.flatMap((exercise): SkillStandard[] => {
    const count = exercise.standard ? parseCountStandard(exercise.standard.trim()) : null;
    if (!count) return [];
    const records = [...(recordsByName.get(baseName(exercise.name)) ?? [])].filter((key) => metricOf(key) === count.metric);
    if (!records.length) return [];
    return [{ kind: 'count', tree: 'calisthenics', skill: exercise.id, name: exercise.name, records, metric: count.metric, value: count.value }];
  });

  // Each yoga pose logs under its own id, in seconds.
  const holds = YOGA_POSES.flatMap((pose): SkillStandard[] =>
    metricOf(pose.id) === 'seconds' ? [{ kind: 'count', tree: 'yoga', skill: pose.id, name: pose.name, records: [recordKeyOf(pose.id)], metric: 'seconds', value: pose.seconds }] : [],
  );

  const all = [...gymStandards(raw), ...counts, ...holds];
  return { all, byId: new Map(all.map((standard) => [standard.skill, standard])) };
});

/** Every standard a log can meet. */
export const skillStandards = (): SkillStandard[] => standards().all;

/** The best a record has been: its last log or any day in its history. */
function bestRecord(save: ProtocolSave, key: string): number {
  const points = save.history?.[key] ?? [];
  return points.reduce((best, [, value]) => Math.max(best, value), save.records?.[key] ?? 0);
}

/** What a skill's standard asks for and the best log against it. Null for a skill no log can prove. */
export function skillEvidence(
  save: ProtocolSave,
  skillId: string,
): { best: number; target: number; unit: 'kg' | 'reps' | 'seconds'; met: boolean } | null {
  const standard = standards().byId.get(skillId);
  if (!standard) return null;
  const best = Math.max(0, ...standard.records.map((key) => bestRecord(save, key)));
  if (standard.kind === 'multiple') {
    if (!(save.bodyWeightKg > 0)) return null;
    const target = Math.round(standard.multiple * save.bodyWeightKg * 2) / 2;
    return { best, target, unit: 'kg', met: best > 0 && best >= target };
  }
  return { best, target: standard.value, unit: standard.metric, met: best > 0 && best >= standard.value };
}

/** What the log met, in a few words, for the moment the skill is mastered. */
export function proofOf(standard: SkillStandard): string {
  return standard.kind === 'multiple'
    ? `Your log meets ${standard.multiple}× bodyweight`
    : `Your log meets ${standard.value} ${standard.metric === 'seconds' ? 's' : standard.value === 1 ? 'rep' : 'reps'}`;
}

/** The days a log met a skill's standard, for a key like `calisthenics:ex_7` or `yoga:yoga_tree`. Sorted, each day once. */
export function logPassDates(save: ProtocolSave, key: string): string[] {
  const [tree, ...rest] = key.split(':');
  const standard = standards().byId.get(rest.join(':'));
  if (!standard || standard.tree !== tree) return [];
  const target =
    standard.kind === 'multiple' ? (save.bodyWeightKg > 0 ? Math.round(standard.multiple * save.bodyWeightKg * 2) / 2 : Infinity) : standard.value;
  const days = new Set<string>();
  for (const record of standard.records) {
    for (const point of save.history?.[record] ?? []) if (!isAssumed(point) && point[1] > 0 && point[1] >= target) days.add(point[0]);
  }
  return [...days].sort();
}

/** The standard a skill's logs are measured against, if it has one. */
export const standardOf = (skillId: string): SkillStandard | undefined => standards().byId.get(skillId);

/** A standard's skill as the save keys it: `calisthenics:ex_7`, `yoga:yoga_tree`. */
export const standardKey = (standard: SkillStandard) => `${standard.tree}:${standard.skill}`;

/**
 * Calisthenics and yoga skills their passes now prove (logs that met the
 * standard and tests passed on the tree, two days 48 hours to 21 days apart)
 * but the tree does not show as mastered yet, or shows only as placed.
 */
export function skillsProvenByLogs(save: ProtocolSave): SkillStandard[] {
  return standards().all.filter((standard) => {
    const key = standardKey(standard);
    if (save.skills?.[key] && !save.vouched?.[key]) return false;
    return provenByPasses(passDatesOf(save, key, logPassDates(save, key)));
  });
}
