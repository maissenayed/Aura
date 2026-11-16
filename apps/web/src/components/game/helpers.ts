import { PlanDay, PlanExercise } from '../../utils/campaignPlan';
import { BossStatus, ProtocolSave } from '../../utils/protocolEngine';

/** "4 x 8–12 reps" → sets "4", reps "8–12". Anything else is shown whole as the reps. */
export function splitTarget(target: string): { sets: string | null; reps: string } {
  const match = /^\s*(\d+)\s*[x×]\s*(.+?)\s*(reps?)?\s*$/i.exec(target);
  return match ? { sets: match[1], reps: match[2] } : { sets: null, reps: target };
}

/** A boss's hit points out of 1000. */
export const HP_MAX = 1000;
export function bossHp(status: BossStatus): number {
  return status.defeated ? 0 : Math.round((1 - status.damage) * HP_MAX);
}

/** Bosses still standing that this lift chips at. */
export function bossesOfLift(bosses: BossStatus[], liftId: string | undefined): BossStatus[] {
  if (!liftId) return [];
  return bosses.filter(
    (status) => !status.defeated && status.requirements.some((req) => req.requirement.kind === 'lift' && req.lift?.id === liftId),
  );
}

/** The standing, unsealed boss closest to falling. */
export function closestKill(bosses: BossStatus[]): BossStatus | undefined {
  return bosses
    .filter((status) => !status.defeated && !status.sealed)
    .sort((a, b) => b.damage - a.damage)[0];
}

/** Bosses still standing that an exercise works towards: the ones it feeds, plus any its lift chips at. */
export function bossesOfExercise(bosses: BossStatus[], exercise: PlanExercise): BossStatus[] {
  const fed = new Set(exercise.bosses ?? []);
  const byLift = new Set(bossesOfLift(bosses, exercise.lift).map((status) => status.boss.id));
  return bosses.filter((status) => !status.defeated && (fed.has(status.boss.id) || byLift.has(status.boss.id)));
}

/**
 * The boss a day is fighting. First the bosses today's exercises actually hit
 * (in the day's own branch first: a leg day's boss is a leg boss), then any
 * boss of that branch, then — on rest and recovery days — whichever is closest
 * to falling. Unsealed bosses win over sealed ones, and nearer kills over
 * fresher ones.
 */
export function bossForDay(bosses: BossStatus[], day: PlanDay | undefined): BossStatus | undefined {
  const standing = bosses.filter((status) => !status.defeated);
  const rank = (list: BossStatus[]) =>
    [...list].sort(
      (a, b) =>
        Number(a.sealed) - Number(b.sealed) ||
        Number(b.boss.branch === day?.kind) - Number(a.boss.branch === day?.kind) ||
        b.damage - a.damage,
    )[0];

  if (day && day.kind !== 'rest') {
    const hit = new Set(day.exercises.flatMap((exercise) => bossesOfExercise(bosses, exercise).map((status) => status.boss.id)));
    const linked = standing.filter((status) => hit.has(status.boss.id));
    if (linked.length) return rank(linked);
    const branch = standing.filter((status) => status.boss.branch === day.kind);
    if (branch.length) return rank(branch);
  }
  return closestKill(bosses) ?? rank(standing);
}

/** A personal record was logged today for this key (`pr_<lift or exercise id>`). */
export function prToday(save: ProtocolSave, key: string, todayIso: string | null): boolean {
  if (!todayIso) return false;
  return save.log.some((entry) => entry.kind === 'pr' && entry.key === `pr_${key}` && entry.date === todayIso);
}

/** "Thursday" → "Thu". */
export const shortDay = (name: string) => name.slice(0, 3);
