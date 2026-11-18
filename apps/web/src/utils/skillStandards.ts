import { rawExercises } from '../data/rawExercisesData';
import { EXERCISE_BY_ID } from '../data/campaignCatalog';
import { metricOf, recordKeyOf } from './records';
import type { ProtocolSave } from './protocolEngine';

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

export type SkillStandard =
  | {
      kind: 'multiple';
      skill: string;
      name: string;
      /** The record keys whose logs prove it. */
      records: string[];
      /** Multiple of bodyweight the lift has to reach. */
      multiple: number;
    }
  | {
      kind: 'count';
      skill: string;
      name: string;
      records: string[];
      metric: 'reps' | 'seconds';
      /** The reps or seconds one logged set has to reach. */
      value: number;
    };

const GYM_STANDARDS: SkillStandard[] = rawExercises.flatMap((exercise): SkillStandard[] => {
  if (exercise.discipline !== 'gym' || NOT_ONE_LIFT.has(exercise.id) || !exercise.standard) return [];
  // "+0.25x BW" is load on top of bodyweight; only plain multiples of the load are read.
  const match = /(?:^|[^+\d.])(\d+(?:\.\d+)?)x BW/.exec(exercise.standard);
  if (!match) return [];
  const lift = SAME_LIFT_AS[exercise.id] ?? exercise.id;
  if (metricOf(lift) !== 'kg') return [];
  return [{ kind: 'multiple', skill: exercise.id, name: exercise.name, records: [recordKeyOf(lift)], multiple: Number(match[1]) }];
});

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

const CALISTHENICS = rawExercises.filter((exercise) => exercise.discipline !== 'gym' && exercise.discipline !== 'bouldering');

/** Record keys that log an exercise, by its base name: the tree's own ids and the campaign cards with the same name. */
const RECORDS_BY_NAME = (() => {
  const map = new Map<string, Set<string>>();
  const add = (name: string, key: string) => {
    const base = baseName(name);
    if (!map.has(base)) map.set(base, new Set());
    map.get(base)!.add(key);
  };
  for (const exercise of CALISTHENICS) add(exercise.name, exercise.id);
  for (const [id, exercise] of EXERCISE_BY_ID) if (!id.startsWith('ex_')) add(exercise.name, recordKeyOf(id));
  return map;
})();

const COUNT_STANDARDS: SkillStandard[] = CALISTHENICS.flatMap((exercise): SkillStandard[] => {
  const count = exercise.standard ? parseCountStandard(exercise.standard.trim()) : null;
  if (!count) return [];
  const records = [...(RECORDS_BY_NAME.get(baseName(exercise.name)) ?? [])].filter((key) => metricOf(key) === count.metric);
  if (!records.length) return [];
  return [{ kind: 'count', skill: exercise.id, name: exercise.name, records, metric: count.metric, value: count.value }];
});

export const SKILL_STANDARDS: SkillStandard[] = [...GYM_STANDARDS, ...COUNT_STANDARDS];
const STANDARD_OF = new Map(SKILL_STANDARDS.map((standard) => [standard.skill, standard]));

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
  const standard = STANDARD_OF.get(skillId);
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

/**
 * Calisthenics-tree skills the save's logs prove but the tree does not show as
 * mastered yet, or shows as mastered only because they were vouched for.
 */
export function skillsProvenByLogs(save: ProtocolSave): SkillStandard[] {
  return SKILL_STANDARDS.filter((standard) => {
    const key = `calisthenics:${standard.skill}`;
    if (save.skills?.[key] && !save.vouched?.[key]) return false;
    return skillEvidence(save, standard.skill)?.met ?? false;
  });
}
