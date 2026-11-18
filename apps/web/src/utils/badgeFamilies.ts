/**
 * Badge families: one count each, four tiers (Chalk, Iron, Steel, Gold) at
 * widely spaced thresholds, so each one is rare. Counts read evidence only:
 * finished sessions, logged overloads and PRs, proven skills, weeks with the
 * full armour set. The crew's families (spotter weeks, duels, raids) are counted
 * by the server and passed in.
 *
 * Engine types are imported type-only, so this module and protocolEngine can
 * depend on each other without a runtime cycle.
 */

import type { CampaignPlan } from './campaignPlan';
import type { ProtocolSave } from './protocolEngine';
import { masterySlots, missionEvidence, sessionCounts } from './evidence';
import { forgedIn, lastTickedWeek } from './armor';

export const TIER_NAMES = ['Chalk', 'Iron', 'Steel', 'Gold'] as const;
export type TierName = (typeof TIER_NAMES)[number];

export type FamilyId = 'sessions' | 'perfect' | 'overload' | 'records' | 'skills' | 'unbroken' | 'spotter' | 'duels' | 'raids';

export interface FamilyDef {
  id: FamilyId;
  name: string;
  /** What is counted, in a few words. */
  counts: string;
  /** Chalk, Iron, Steel, Gold. */
  thresholds: [number, number, number, number];
  /** Counted by the server from the crew, not from the save. */
  crew?: boolean;
}

export const FAMILIES: FamilyDef[] = [
  { id: 'sessions', name: 'Sessions', counts: 'Sessions finished on the clock', thresholds: [10, 50, 150, 365] },
  { id: 'perfect', name: 'Perfect weeks', counts: 'Weeks with every mission', thresholds: [1, 4, 12, 26] },
  { id: 'overload', name: 'Overload', counts: 'Beats of your 28-day best', thresholds: [10, 50, 150, 400] },
  { id: 'records', name: 'Records', counts: 'Confirmed all-time PRs', thresholds: [5, 25, 75, 200] },
  { id: 'skills', name: 'Skills', counts: 'Skills mastered (not placed)', thresholds: [5, 25, 75, 150] },
  { id: 'unbroken', name: 'Unbroken', counts: 'Weeks with the full armour set', thresholds: [4, 12, 26, 52] },
  { id: 'spotter', name: 'Spotter', counts: 'Weeks in a spotter streak', thresholds: [4, 12, 26, 52], crew: true },
  { id: 'duels', name: 'Duels', counts: 'Duels won', thresholds: [1, 5, 15, 40], crew: true },
  { id: 'raids', name: 'Raids', counts: 'Crew raids you landed a hit in', thresholds: [1, 5, 15, 40], crew: true },
];

/** What the crew has given an athlete, as the server counts it. */
export interface CrewAwards {
  duelsWon: number;
  raids: number;
  spotterWeeks: number;
}

/** Each family's count from the save (and the crew's, when known). */
export function familyCounts(save: ProtocolSave, plan: CampaignPlan, perfectWeeks: number, crew?: CrewAwards | null): Record<FamilyId, number> {
  const evidence = missionEvidence(save, plan);
  const sessions = Object.keys(save.sessions ?? {}).filter((date) => sessionCounts(save, plan, date)).length;
  let unbroken = 0;
  if (plan.armor.length) {
    for (let week = 1, last = lastTickedWeek(save.quests); week <= last; week += 1) {
      if (forgedIn(save.quests, plan, week).size >= plan.armor.length) unbroken += 1;
    }
  }
  return {
    sessions,
    perfect: perfectWeeks,
    overload: evidence.filter((mission) => mission.grade === 'overload' || mission.grade === 'pr').length,
    records: evidence.filter((mission) => mission.grade === 'pr').length,
    skills: masterySlots(save).length,
    unbroken,
    spotter: crew?.spotterWeeks ?? 0,
    duels: crew?.duelsWon ?? 0,
    raids: crew?.raids ?? 0,
  };
}

/** The tier a count has reached: 0 for none, 1–4 for Chalk to Gold. */
export function tierOf(def: FamilyDef, count: number): number {
  return def.thresholds.filter((threshold) => count >= threshold).length;
}

export interface FamilyStatus {
  def: FamilyDef;
  count: number;
  tier: number;
  /** The next threshold, or null at Gold. */
  next: number | null;
}

export function familiesOf(save: ProtocolSave, plan: CampaignPlan, perfectWeeks: number, crew?: CrewAwards | null): FamilyStatus[] {
  const counts = familyCounts(save, plan, perfectWeeks, crew);
  return FAMILIES.map((def) => {
    const count = counts[def.id];
    const tier = tierOf(def, count);
    return { def, count, tier, next: tier < 4 ? def.thresholds[tier] : null };
  });
}

/** The badge id of a family tier, as it is kept in the save: `family:sessions:2`. */
export const familyBadgeId = (id: FamilyId, tier: number) => `family:${id}:${tier}`;
