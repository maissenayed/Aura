import { PlanSpecV2, resolvePlanV2 } from './campaignPlan';
import { PLAN_FORMAT_V3, SaveV3Fields } from './campaignV3';
import { MILESTONE_SKILL, MigrationReport, TIER_GOAL } from './migrateV2';
import { ProtocolSave, evaluateBosses } from './protocolEngine';
import { LIFT_RECORD, recordKeyOf } from './records';
import { floorsOf } from './treeIndex';

/**
 * The save half of the v2 → v3 conversion. Everything logged is kept: the v2
 * fields stay as they are and the v3 fields are added beside them. Safe to
 * run twice: a v3 save comes back as it is.
 */

export type SaveV3 = ProtocolSave & SaveV3Fields;

export const isV3Save = (save: ProtocolSave): boolean => (save.version ?? 0) >= PLAN_FORMAT_V3;

/** Just what the conversion needs from the plan: which exercise each day's entry is, and tiers already owned. */
export interface PlanForSave {
  days: { exercises: { id: string; exercise: string }[] }[];
  trees?: { tree: string; cleared?: string[] }[];
}

/** Marks a skill and everything it needs as mastered, keeping dates already there. */
function master(skills: Record<string, string>, skill: string, date: string): number {
  let added = 0;
  for (const floor of floorsOf('calisthenics', skill)) {
    const key = `calisthenics:${floor.id}`;
    if (!skills[key]) {
      skills[key] = date;
      added += 1;
    }
  }
  return added;
}

/**
 * `v2Plan` is the plan as it was stored before conversion, when there is one:
 * it is how v2 bosses already beaten become badges.
 */
export function migrateSave(save: ProtocolSave, plan: PlanForSave, today: string, v2Plan?: PlanSpecV2): { save: SaveV3; report: MigrationReport } {
  const report: MigrationReport = { mapped: [], unmapped: [] };
  if (isV3Save(save)) return { save: save as SaveV3, report };

  const records: Record<string, number> = {};
  const keep = (key: string, value: number) => {
    if (!(key in records) || value > records[key]) records[key] = value;
  };
  for (const [lift, value] of Object.entries(save.stats)) {
    const to = LIFT_RECORD[lift];
    if (to) {
      keep(to.exercise, value);
      report.mapped.push(`stat ${lift} ${value} → record ${to.exercise}`);
    } else report.unmapped.push(`stat ${lift} ${value}: no exercise (kept in stats)`);
  }
  const exerciseOfInstance = new Map(plan.days.flatMap((day) => day.exercises.map((entry) => [entry.id, entry.exercise] as const)));
  for (const [instance, value] of Object.entries(save.loads)) {
    const exercise = exerciseOfInstance.get(instance);
    if (exercise) {
      keep(recordKeyOf(exercise), value);
      report.mapped.push(`working weight ${instance} ${value} kg → record ${recordKeyOf(exercise)}`);
    } else report.unmapped.push(`working weight ${instance} ${value} kg: its exercise left the plan (kept in loads)`);
  }
  const history = Object.fromEntries(Object.entries(records).map(([key, value]) => [key, [[today, value] as [string, number]]]));

  const skills = { ...save.skills };
  for (const [milestone, claimed] of Object.entries(save.milestones)) {
    if (!claimed) continue;
    const skill = MILESTONE_SKILL[milestone];
    if (skill) report.mapped.push(`milestone ${milestone} → mastered ${skill} (+${master(skills, skill, today)} skills)`);
    else report.unmapped.push(`milestone ${milestone}: no skill proves it (kept in milestones)`);
  }
  for (const entry of plan.trees ?? []) {
    for (const tier of entry.cleared ?? []) {
      const tierGoal = TIER_GOAL[tier];
      if (tierGoal && 'skill' in tierGoal) report.mapped.push(`owned tier ${tier} → mastered ${tierGoal.skill} (+${master(skills, tierGoal.skill, today)} skills)`);
    }
  }

  // Bosses beaten in v2 stay beaten on the badge wall, whatever v3 makes of them.
  const badges: Record<string, string> = {};
  if (v2Plan) {
    for (const status of evaluateBosses(save, resolvePlanV2(v2Plan))) {
      if (status.defeated) badges[`boss:${status.boss.id}`] = today;
    }
  }

  return { save: { ...save, skills, version: PLAN_FORMAT_V3, records, history, badges }, report };
}
