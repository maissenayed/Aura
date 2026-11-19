/**
 * The engine as the backend runs it, so every number the crew sees is worked
 * out on the server with the same rules as the phone. The backend bundles this
 * file at build time (apps/backend/scripts/build-engine.mjs); nothing here
 * touches the browser.
 *
 * Witness dates: the server stamps the day it first saw each tick, log, test,
 * session and mastered skill. Anything dated more than two days before it was
 * first seen (the quest board's own late-tick window) counts for the athlete
 * but not for the crew.
 */

import { BLUEPRINT_SPEC } from '../data/blueprintPlan';
import { CampaignPlan, normalizeSpec, resolvePlan } from './campaignPlan';
import type { HistoryPoint } from './campaignV3';
import {
  MISSION_XP,
  REST_XP,
  SESSION_XP,
  WARM_UP_XP,
  addDays,
  boardDate,
  campaignWeekOf,
  daysBetween,
  landedSkills,
  masterySlots,
  missionEvidence,
  mondayOfDate,
  sessionCounts,
  trainingDays,
} from './evidence';
import { LATE_TICK_DAYS, ProtocolSave, createInitialSave, derive } from './protocolEngine';
import { logPassDates } from './skillStandards';
import { skillOf } from './treeIndex';
import type { SkillTreeRef } from './campaignV3';

export type Seen = Record<string, string>;

/* The exercise list: the backend reads it from its database and hands it over before the engine runs. */
export { currentExercises, setExerciseList } from '../data/exercisesData';
/** The list the app ships with: what an empty database is filled with. */
export { rawExercises as BUILT_IN_EXERCISES } from '../data/rawExercisesData';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** A stored save with every field the engine reads, whatever version wrote it. */
export function asSave(raw: unknown): ProtocolSave {
  const base = createInitialSave();
  if (!isRecord(raw)) return base;
  return { ...base, ...(raw as Partial<ProtocolSave>) } as ProtocolSave;
}

/** A stored plan, resolved the way the web app resolves it. */
export function planOf(raw: unknown): CampaignPlan {
  return resolvePlan(raw ? normalizeSpec(raw, BLUEPRINT_SPEC) : BLUEPRINT_SPEC);
}

/* ------------------------------------------------------------------ */
/* Witness stamps                                                      */
/* ------------------------------------------------------------------ */

/** Everything in a save that carries a date, keyed for the stamp map, with the date it claims. */
function datedItems(save: ProtocolSave): Map<string, string> {
  const items = new Map<string, string>();
  for (const [record, points] of Object.entries(save.history ?? {})) {
    for (const point of points as HistoryPoint[]) items.set(`h:${record}:${point[0]}`, point[0]);
  }
  if (save.startedAt) {
    for (const [key, ticked] of Object.entries(save.quests ?? {})) {
      if (!ticked) continue;
      const match = /^w(\d+)_(.+)$/.exec(key);
      if (!match) continue;
      const day = /^(mon|tue|wed|thu|fri|sat|sun)/.exec(match[2])?.[1];
      const week = Number(match[1]);
      // Missions name their day through the plan; the stamp only needs the week's last day as a bound.
      items.set(`q:${key}`, boardDate(save.startedAt, week, day ?? 'sun'));
    }
  }
  for (const [key, entries] of Object.entries(save.tests ?? {})) for (const [date] of entries) items.set(`t:${key}:${date}`, date);
  for (const date of Object.keys(save.sessions ?? {})) items.set(`s:${date}`, date);
  for (const [key, date] of Object.entries(save.skills ?? {})) items.set(`k:${key}`, date);
  return items;
}

/**
 * The stamp map after a save: every item the server has not seen before is
 * stamped today. The first save ever stamped trusts what was already there,
 * on the dates it carries.
 */
export function stampSeen(next: unknown, seen: Seen | null, today: string): Seen {
  const save = asSave(next);
  const stamps: Seen = { ...(seen ?? {}) };
  for (const [key, date] of datedItems(save)) {
    if (stamps[key]) continue;
    stamps[key] = seen === null ? (date < today ? date : today) : today;
  }
  return stamps;
}

/** Seen no later than two days after the date it claims, and never dated in the future. */
const fair = (claimed: string, stamp: string | undefined) =>
  stamp !== undefined && claimed <= addDays(stamp, 1) && daysBetween(claimed, stamp) <= LATE_TICK_DAYS;

/** The save as the crew counts it: only what the server saw arrive on time. */
export function witnessed(raw: unknown, seen: Seen): ProtocolSave {
  const save = asSave(raw);
  const history: Record<string, HistoryPoint[]> = {};
  for (const [record, points] of Object.entries(save.history ?? {})) {
    history[record] = (points as HistoryPoint[]).filter((point) => fair(point[0], seen[`h:${record}:${point[0]}`]));
  }
  const quests: Record<string, boolean> = {};
  if (save.startedAt) {
    for (const [key, ticked] of Object.entries(save.quests ?? {})) {
      if (!ticked) continue;
      const stamp = seen[`q:${key}`];
      const match = /^w(\d+)_/.exec(key);
      const weekEnd = match ? boardDate(save.startedAt, Number(match[1]), 'sun') : null;
      // A tick is fair when it arrived by two days after the end of its week at the latest.
      if (stamp && weekEnd && daysBetween(weekEnd, stamp) <= LATE_TICK_DAYS) quests[key] = true;
    }
  }
  const tests: ProtocolSave['tests'] = {};
  for (const [key, entries] of Object.entries(save.tests ?? {})) {
    tests[key] = entries.filter(([date]) => fair(date, seen[`t:${key}:${date}`]));
  }
  const sessions: ProtocolSave['sessions'] = {};
  for (const [date, clock] of Object.entries(save.sessions ?? {})) if (fair(date, seen[`s:${date}`])) sessions[date] = clock;
  const skills: Record<string, string> = {};
  for (const [key, date] of Object.entries(save.skills ?? {})) if (fair(date, seen[`k:${key}`])) skills[key] = date;
  return { ...save, history, quests, tests, sessions, skills };
}

/* ------------------------------------------------------------------ */
/* The crew's numbers                                                  */
/* ------------------------------------------------------------------ */

export interface CrewWeek {
  monday: string;
  /** Training XP of the week: sessions, logs, ticks and skill tests. Bosses and one-off gates are not in it. */
  xp: number;
  prs: number;
  sessions: number;
  /** Missions ticked over missions planned this week, 0–1. */
  completion: number;
  /** Days with anything earned. */
  activeDays: number;
}

/** One training week (Monday to Sunday, up to today) as the crew board counts it. */
export function crewWeek(save: ProtocolSave, plan: CampaignPlan, monday: string, today: string): CrewWeek {
  const sunday = addDays(monday, 6);
  const inWeek = (date: string) => date >= monday && date <= sunday && date <= today;
  const evidence = missionEvidence(save, plan);
  let xp = 0;
  let activeDays = 0;
  for (const day of trainingDays(save, plan, evidence).values()) {
    if (!inWeek(day.date)) continue;
    xp += day.xp;
    if (day.xp > 0) activeDays += 1;
  }
  xp += landedSkills(save, (key) => logPassDates(save, key))
    .filter((entry) => inWeek(entry.date))
    .reduce((sum, entry) => sum + entry.xp, 0);
  xp += masterySlots(save)
    .filter((slot) => slot.slotWeek === monday && slot.slotWeek <= today)
    .reduce((sum, slot) => sum + slot.xp, 0);
  const prs = evidence.filter((mission) => inWeek(mission.date) && mission.grade === 'pr').length;
  const sessions = Object.keys(save.sessions ?? {}).filter((date) => inWeek(date) && sessionCounts(save, plan, date)).length;

  let planned = 0;
  let ticked = 0;
  if (save.startedAt && monday >= mondayOfDate(save.startedAt)) {
    const week = campaignWeekOf(save.startedAt, monday);
    for (const day of plan.days) {
      if (boardDate(save.startedAt, week, day.id) > today) continue;
      const ids = day.kind === 'rest' ? [`${day.id}_rest`] : day.exercises.map((exercise) => exercise.id);
      planned += ids.length;
      ticked += ids.filter((id) => save.quests[`w${week}_${id}`]).length;
    }
  }
  return { monday, xp, prs, sessions, completion: planned ? ticked / planned : 0, activeDays };
}

/** This week against the athlete's own average of the four before it: 1.25 is 25% up. */
export function improvementOf(save: ProtocolSave, plan: CampaignPlan, monday: string, today: string): number | null {
  const previous = [1, 2, 3, 4].map((back) => crewWeek(save, plan, addDays(monday, -7 * back), today).xp);
  const average = previous.reduce((sum, xp) => sum + xp, 0) / previous.length;
  if (average <= 0) return null;
  return crewWeek(save, plan, monday, today).xp / average;
}

/** One day of a duel: the share of that day's own plan earned, 0–100. */
export function duelDay(save: ProtocolSave, plan: CampaignPlan, date: string): number {
  if (!save.startedAt || date < save.startedAt) return 0;
  const week = campaignWeekOf(save.startedAt, date);
  const day = plan.days.find((entry) => boardDate(save.startedAt as string, week, entry.id) === date);
  if (!day) return 0;
  const goal =
    day.kind === 'rest'
      ? REST_XP
      : day.exercises.length * MISSION_XP.hit + day.warmUps.length * WARM_UP_XP + (day.exercises.length ? SESSION_XP : 0);
  if (goal <= 0) return 0;
  const earned = trainingDays(save, plan).get(date)?.xp ?? 0;
  return Math.min(100, Math.round((earned / goal) * 100));
}

/* ------------------------------------------------------------------ */
/* What others see                                                     */
/* ------------------------------------------------------------------ */

export interface PlayerCard {
  level: number;
  rank: string;
  /** The skill whose pose the avatar strikes, when one is proven. */
  signature: string | null;
  signatureName: string | null;
  gear: Record<string, string>;
  /** The six-axis web as shapes only, 0–1, in its drawing order. */
  shape: { id: string; short: string; share: number | null }[];
}

export const SHAPE_ORDER = ['push', 'straight', 'core', 'pull', 'legs', 'endurance'];

export function cardOf(save: ProtocolSave, plan: CampaignPlan, today: string): PlayerCard {
  const currentWeek = save.startedAt ? campaignWeekOf(save.startedAt, today) : 1;
  const derived = derive(save, { currentWeek, viewWeek: currentWeek, today }, plan);
  const byId = new Map(derived.attributes.map((attribute) => [attribute.def.id as string, attribute]));
  const proven = (key: string) => Boolean(save.skills?.[key]) && !save.vouched?.[key];
  const signature = save.signature && proven(save.signature) ? save.signature : null;
  const [tree, ...rest] = (signature ?? '').split(':');
  return {
    level: derived.level.level,
    rank: derived.level.rank,
    signature,
    signatureName: signature ? (skillOf(tree as SkillTreeRef, rest.join(':'))?.name ?? null) : null,
    gear: { ...(save.gear ?? {}) },
    shape: SHAPE_ORDER.map((id) => {
      const attribute = byId.get(id);
      return { id, short: attribute?.def.short ?? id, share: attribute?.unlocked && attribute.value !== null ? attribute.value / 999 : null };
    }),
  };
}

export interface FeedItem {
  id: string;
  date: string;
  kind: string;
  title: string;
  detail: string;
}

const FEED_KINDS = new Set(['pr', 'skill', 'boss', 'act', 'campaign', 'level', 'badge', 'week']);

/** The battle-log entries worth sharing. Bodyweight never; the numbers behind PRs only when the athlete says so. */
export function feedOf(raw: unknown, showNumbers: boolean, since: string): FeedItem[] {
  const save = asSave(raw);
  return (save.log ?? [])
    .filter((entry) => FEED_KINDS.has(entry.kind) && entry.date >= since)
    .map((entry) => ({
      id: `${entry.date}|${entry.kind}|${entry.title}`,
      date: entry.date,
      kind: entry.kind,
      title: entry.title,
      detail: entry.kind === 'pr' && !showNumbers ? 'A new best' : entry.detail,
    }));
}

/** Finished sessions per exercise in the last 90 days, for the crew's regulars. */
export function regularsOf(save: ProtocolSave, plan: CampaignPlan, today: string): Record<string, number> {
  const since = addDays(today, -90);
  const counts: Record<string, number> = {};
  for (const mission of missionEvidence(save, plan)) {
    if (mission.date < since || mission.date > today || mission.value === null) continue;
    counts[mission.exercise.name] = (counts[mission.exercise.name] ?? 0) + 1;
  }
  return counts;
}

export { addDays, mondayOfDate };
