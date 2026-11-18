import { rawExercises } from '../data/rawExercisesData';
import { metricOf, recordKeyOf } from './records';
import type { ProtocolSave } from './protocolEngine';

/**
 * Tree skills a logged lift can prove. A gym skill's standard is written as a
 * multiple of bodyweight ("3×10 at 0.4x BW", "1x BW × 8"); once the best log of
 * the lift it is done with reaches that multiple of the athlete's bodyweight,
 * the skill counts as mastered without a trip to the tree. The working weight
 * is logged for the sets and reps the plan asks for, so the reps in the
 * standard are taken as met.
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

export interface SkillStandard {
  skill: string;
  name: string;
  /** The record key of the lift that proves it. */
  record: string;
  /** Multiple of bodyweight the lift has to reach. */
  multiple: number;
}

export const SKILL_STANDARDS: SkillStandard[] = rawExercises.flatMap((exercise) => {
  if (exercise.discipline !== 'gym' || NOT_ONE_LIFT.has(exercise.id) || !exercise.standard) return [];
  // "+0.25x BW" is load on top of bodyweight; only plain multiples of the load are read.
  const match = /(?:^|[^+\d.])(\d+(?:\.\d+)?)x BW/.exec(exercise.standard);
  if (!match) return [];
  const lift = SAME_LIFT_AS[exercise.id] ?? exercise.id;
  if (metricOf(lift) !== 'kg') return [];
  return [{ skill: exercise.id, name: exercise.name, record: recordKeyOf(lift), multiple: Number(match[1]) }];
});

/** The best a record has been: its last log or any day in its history. */
function bestRecord(save: ProtocolSave, key: string): number {
  const points = save.history?.[key] ?? [];
  return points.reduce((best, [, value]) => Math.max(best, value), save.records?.[key] ?? 0);
}

/** Calisthenics-tree skills the save's logs prove but the tree does not show as mastered yet. */
export function skillsProvenByLogs(save: ProtocolSave): SkillStandard[] {
  const bodyWeight = save.bodyWeightKg;
  if (!(bodyWeight > 0)) return [];
  return SKILL_STANDARDS.filter((standard) => {
    if (save.skills?.[`calisthenics:${standard.skill}`]) return false;
    const best = bestRecord(save, standard.record);
    return best > 0 && best >= Math.round(standard.multiple * bodyWeight * 2) / 2;
  });
}
