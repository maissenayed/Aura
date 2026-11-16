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

/** A personal record was logged today for this key (`pr_<lift or exercise id>`). */
export function prToday(save: ProtocolSave, key: string, todayIso: string | null): boolean {
  if (!todayIso) return false;
  return save.log.some((entry) => entry.kind === 'pr' && entry.key === `pr_${key}` && entry.date === todayIso);
}

/** "Thursday" → "Thu". */
export const shortDay = (name: string) => name.slice(0, 3);
