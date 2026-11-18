/**
 * Evidence: what has to be true before the campaign pays for something.
 *
 * Three rungs. A tick says a mission was done. A logged number says it was done
 * at a measured level, and how that compares with the athlete's own past. A
 * result shown on two different days proves a skill. These are pure functions
 * of the save and the plan; the engine reads them for XP, bosses and gates.
 *
 * The engine's own types are imported type-only, so this module and
 * protocolEngine can depend on each other without a runtime cycle.
 */

import type { CampaignPlan, Lift, PlanDay, PlanExercise, StatUnit } from './campaignPlan';
import type { HistoryPoint, SkillTreeRef } from './campaignV3';
import type { ProtocolSave } from './protocolEngine';
import { skillOf } from './treeIndex';

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

function fromIso(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Whole days from `a` to `b` (negative when `b` is earlier). */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  const date = fromIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

/** The Monday on or before a date: the key of its training week. */
export function mondayOfDate(iso: string): string {
  const date = fromIso(iso);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toIso(date);
}

const BOARD_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** The date of a board day: campaign week `week`, day `dayId`. */
export function boardDate(startedAt: string, week: number, dayId: string): string {
  return addDays(startedAt, (week - 1) * 7 + Math.max(0, BOARD_DAYS.indexOf(dayId)));
}

/** Campaign week of a date, from 1. */
export function campaignWeekOf(startedAt: string, iso: string): number {
  return Math.max(1, Math.floor(daysBetween(startedAt, iso) / 7) + 1);
}

/* ------------------------------------------------------------------ */
/* History points                                                      */
/* ------------------------------------------------------------------ */

/** A point written by ticking a mission at the usual number: a session, but not a logged result. */
export const isAssumed = (point: HistoryPoint) => point[2] === 'tick';
/** A point the hold timer measured: the clock is the evidence. */
export const isTimed = (point: HistoryPoint) => point[2] === 'timer';

const byDate = (a: HistoryPoint, b: HistoryPoint) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

/* ------------------------------------------------------------------ */
/* Confirmed numbers                                                   */
/* ------------------------------------------------------------------ */

/** How long a big jump waits for a second showing. */
export const CONFIRM_DAYS = 14;
/** How close the second showing has to come. */
export const CONFIRM_SHARE = 0.95;

/** The most a new number can beat the best before it by and still count at once. */
export function reachOf(best: number, unit: StatUnit): number {
  if (unit === 'reps') return best + Math.max(3, best * 0.2);
  if (unit === 'seconds') return best + Math.max(5, best * 0.5);
  return best + Math.max(5, best * 0.075);
}

export interface Confirmation {
  /** The best number that counts for bosses, gates, checkpoints and strength. */
  best: number;
  /** A higher number still waiting to be shown again, or null. */
  pending: number | null;
  /** The day the pending number was logged. */
  pendingDate: string | null;
}

/**
 * The best a record has been, counting only numbers that are within reach of
 * the best before them, measured by the hold timer, or shown again (at 95% or
 * more) on another day within two weeks. `floor` is what is trusted without a
 * log: the plan's own starting number.
 */
export function confirmPoints(points: HistoryPoint[], floor: number, unit: StatUnit): Confirmation {
  const sorted = [...points].sort(byDate);
  const logged = sorted.filter((point) => !isAssumed(point));
  let best = floor;
  let pending: number | null = null;
  let pendingDate: string | null = null;
  for (const point of logged) {
    const [date, value] = point;
    if (value <= best) continue;
    const shownAgain = logged.some(
      ([other, again]) => other !== date && Math.abs(daysBetween(date, other)) <= CONFIRM_DAYS && again >= value * CONFIRM_SHARE,
    );
    if (value <= reachOf(best, unit) || isTimed(point) || shownAgain) {
      best = value;
      if (pending !== null && pending <= best) {
        pending = null;
        pendingDate = null;
      }
    } else if (pending === null || value > pending) {
      pending = value;
      pendingDate = date;
    }
  }
  return { best, pending, pendingDate };
}

/** A lift's trusted starting number: the plan's own baseline, or a number saved before history existed. */
function floorOf(save: ProtocolSave, lift: Lift): number {
  const points = save.history?.[lift.id] ?? [];
  const legacy = points.length === 0 ? (save.records?.[lift.id] ?? save.stats?.[lift.id] ?? 0) : 0;
  return Math.max(lift.hasBaseline ? lift.baseline : 0, legacy);
}

export function confirmationOf(save: ProtocolSave, lift: Lift): Confirmation {
  return confirmPoints(save.history?.[lift.id] ?? [], floorOf(save, lift), lift.unit);
}

/** The best number of a lift that counts. */
export function confirmedBestOf(save: ProtocolSave, lift: Lift): number {
  return confirmationOf(save, lift).best;
}

/**
 * Where a lift's strength XP is measured from: the higher of the plan's
 * starting number and the athlete's first log, so typing the end-game number
 * on day one pays nothing.
 */
export function startOf(save: ProtocolSave, lift: Lift): number {
  const first = [...(save.history?.[lift.id] ?? [])].sort(byDate).find((point) => !isAssumed(point));
  return Math.max(lift.baseline, first ? first[1] : lift.baseline);
}

/* ------------------------------------------------------------------ */
/* Missions: done, hit, overload, PR                                   */
/* ------------------------------------------------------------------ */

export type MissionGrade = 'done' | 'hit' | 'overload' | 'pr';

export const MISSION_XP: Record<MissionGrade, number> = { done: 10, hit: 20, overload: 35, pr: 45 };
export const WARM_UP_XP = 5;
export const REST_XP = 10;
export const SESSION_XP = 20;
/** Everything one day's training can pay: about eight working exercises at their best. */
export const DAILY_CAP = 300;
/** A session has to run this long on the clock to count as a finished session. */
export const SESSION_MIN_MINUTES = 15;
/** Overload is measured against the best of this many days before. */
export const OVERLOAD_DAYS = 28;

export interface MissionEvidence {
  key: string;
  week: number;
  day: PlanDay;
  date: string;
  exercise: PlanExercise;
  grade: MissionGrade;
  xp: number;
  /** The number logged that day, when there was one. */
  value: number | null;
  /** The best of the 28 days before, when there was one. */
  previous: number | null;
}

/** The reps or seconds a mission's target asks for, or null for a target that is not one number. */
export function targetNumber(target: string): number | null {
  const sets = /^\s*\d+\s*[x×]\s*(.+)$/i.exec(target);
  const reps = (sets ? sets[1] : target).trim();
  const match = /^(\d+(?:\.\d+)?)/.exec(reps);
  return match ? Number(match[1]) : null;
}

/** Where every mission id lives in the plan. */
function missionIndex(plan: CampaignPlan): Map<string, { day: PlanDay; exercise: PlanExercise }> {
  const index = new Map<string, { day: PlanDay; exercise: PlanExercise }>();
  for (const day of plan.days) for (const exercise of day.exercises) index.set(exercise.id, { day, exercise });
  return index;
}

/** How one mission ticked on one day is graded, from the number logged that day. */
function gradeMission(save: ProtocolSave, plan: CampaignPlan, exercise: PlanExercise, date: string): Pick<MissionEvidence, 'grade' | 'value' | 'previous'> {
  const lift = exercise.lift ? plan.lifts.find((entry) => entry.id === exercise.lift) : undefined;
  if (!lift) return { grade: 'done', value: null, previous: null };
  const points = save.history?.[lift.id] ?? [];
  const today = points.find((point) => point[0] === date && !isAssumed(point));
  if (!today) return { grade: 'done', value: null, previous: null };
  const value = today[1];
  const before = points.filter(([day]) => day < date);
  const recent = before.filter((point) => !isAssumed(point) && daysBetween(point[0], date) <= OVERLOAD_DAYS);
  const previous = recent.length ? Math.max(...recent.map(([, v]) => v)) : null;

  // Kilos are the working weight for the sets the plan asks for; reps and seconds have to reach the target.
  const asked = lift.unit === 'reps' || lift.unit === 'seconds' ? targetNumber(exercise.target) : null;
  const hit = asked === null || value >= asked;
  const allTime = before.length ? Math.max(...before.map(([, v]) => v)) : null;
  const confirmed = confirmPoints(points.filter(([day]) => day <= date), floorOf(save, lift), lift.unit).best;
  if (hit && allTime !== null && value > allTime && confirmed >= value) return { grade: 'pr', value, previous };
  if (hit && previous !== null && value > previous) return { grade: 'overload', value, previous };
  return { grade: hit ? 'hit' : 'done', value, previous };
}

/** Every ticked mission with its grade and XP. Missions no longer in the plan count as done. */
export function missionEvidence(save: ProtocolSave, plan: CampaignPlan): MissionEvidence[] {
  if (!save.startedAt) return [];
  const index = missionIndex(plan);
  const out: MissionEvidence[] = [];
  for (const [key, ticked] of Object.entries(save.quests)) {
    if (!ticked) continue;
    const match = /^w(\d+)_(.+)$/.exec(key);
    if (!match) continue;
    const found = index.get(match[2]);
    if (!found) continue;
    const week = Number(match[1]);
    const date = boardDate(save.startedAt, week, found.day.id);
    const graded = gradeMission(save, plan, found.exercise, date);
    out.push({ key, week, day: found.day, date, exercise: found.exercise, ...graded, xp: MISSION_XP[graded.grade] });
  }
  return out;
}

/** The mission graded for one board day, if it was ticked. */
export function evidenceFor(evidence: MissionEvidence[], key: string): MissionEvidence | undefined {
  return evidence.find((entry) => entry.key === key);
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

/** A session on the clock: when it started and when Finish was tapped (null while it runs). */
export type SessionClock = [start: string, end: string | null];

export function sessionMinutes(session: SessionClock | undefined): number {
  if (!session || !session[1]) return 0;
  return Math.max(0, (new Date(session[1]).getTime() - new Date(session[0]).getTime()) / 60_000);
}

/** A session that ran at least 15 minutes and was finished with every mission of the day handled. */
export function sessionCounts(save: ProtocolSave, plan: CampaignPlan, date: string): boolean {
  if (!save.startedAt) return false;
  const session = save.sessions?.[date];
  if (sessionMinutes(session) < SESSION_MIN_MINUTES) return false;
  const week = campaignWeekOf(save.startedAt, date);
  const day = plan.days.find((entry) => boardDate(save.startedAt as string, week, entry.id) === date);
  if (!day || day.kind === 'rest') return false;
  return day.exercises.length > 0 && day.exercises.every((exercise) => save.quests[`w${week}_${exercise.id}`]);
}

/* ------------------------------------------------------------------ */
/* Day by day: the training XP of each date                            */
/* ------------------------------------------------------------------ */

export interface TrainingDay {
  date: string;
  missions: number;
  warmUps: number;
  rest: number;
  session: number;
  /** Before the daily cap. */
  raw: number;
  /** After the daily cap. */
  xp: number;
}

/** Mission, warm-up, rest and session XP, day by day, each day capped at DAILY_CAP. */
export function trainingDays(save: ProtocolSave, plan: CampaignPlan, evidence = missionEvidence(save, plan)): Map<string, TrainingDay> {
  const days = new Map<string, TrainingDay>();
  if (!save.startedAt) return days;
  const dayOf = (date: string) => {
    let entry = days.get(date);
    if (!entry) {
      entry = { date, missions: 0, warmUps: 0, rest: 0, session: 0, raw: 0, xp: 0 };
      days.set(date, entry);
    }
    return entry;
  };
  for (const mission of evidence) dayOf(mission.date).missions += mission.xp;

  const warmUpDay = new Map<string, string>();
  for (const day of plan.days) for (const warmUp of day.warmUps) warmUpDay.set(warmUp.id, day.id);
  for (const [key, ticked] of Object.entries(save.quests)) {
    if (!ticked) continue;
    const match = /^w(\d+)_(.+)$/.exec(key);
    if (!match) continue;
    const week = Number(match[1]);
    const id = match[2];
    const rest = /^(mon|tue|wed|thu|fri|sat|sun)_rest$/.exec(id);
    if (rest) {
      dayOf(boardDate(save.startedAt, week, rest[1])).rest += REST_XP;
    } else if (warmUpDay.has(id)) {
      dayOf(boardDate(save.startedAt, week, warmUpDay.get(id) as string)).warmUps += WARM_UP_XP;
    }
  }
  for (const date of Object.keys(save.sessions ?? {})) {
    if (sessionCounts(save, plan, date)) dayOf(date).session += SESSION_XP;
  }
  for (const entry of days.values()) {
    entry.raw = entry.missions + entry.warmUps + entry.rest + entry.session;
    entry.xp = Math.min(DAILY_CAP, entry.raw);
  }
  return days;
}

/* ------------------------------------------------------------------ */
/* Skills: tests, Landed, Mastered                                     */
/* ------------------------------------------------------------------ */

/** A skill test on a day: passed (1) or not (0). */
export type TestEntry = [date: string, passed: 0 | 1];

/** A second pass has to come at least this many days after the first... */
export const MASTERY_GAP_DAYS = 2;
/** ...and no more than this many. */
export const MASTERY_WINDOW_DAYS = 21;
export const TESTS_PER_DAY = 2;
export const MASTERIES_PER_WEEK = 3;
export const MASTERIES_PER_LINE_WEEK = 1;
/** Placement is open this many days into a campaign... */
export const PLACEMENT_OPEN_DAYS = 14;
/** ...then once per line every this many days. */
export const PLACEMENT_EVERY_DAYS = 56;

/** A skill's level as XP reads it; bouldering grades start at V0. */
export function skillXpLevel(tree: SkillTreeRef, id: string): number {
  const skill = skillOf(tree, id);
  if (!skill) return 0;
  return tree === 'bouldering' ? skill.level + 1 : skill.level;
}

export const landedXp = (level: number) => 10 * level;
export const masteryXp = (level: number) => 40 * level;

/** The days a skill's tests were passed, with the days a log met its standard. Sorted, each day once. */
export function passDatesOf(save: ProtocolSave, key: string, logDays: string[] = []): string[] {
  const tested = (save.tests?.[key] ?? []).filter(([, passed]) => passed === 1).map(([date]) => date);
  return [...new Set([...tested, ...logDays])].sort();
}

/** Two passes, 48 hours to 21 days apart: the skill is proven. */
export function provenByPasses(dates: string[]): boolean {
  for (let i = 0; i < dates.length; i += 1) {
    for (let j = i + 1; j < dates.length; j += 1) {
      const gap = daysBetween(dates[i], dates[j]);
      if (gap >= MASTERY_GAP_DAYS && gap <= MASTERY_WINDOW_DAYS) return true;
    }
  }
  return false;
}

export type SkillProof = 'none' | 'landed' | 'placed' | 'mastered';

export interface SkillState {
  proof: SkillProof;
  /** The passes that count. */
  passes: string[];
  /** For a Landed skill: the first and last day a second pass would prove it. */
  window: { from: string; to: string } | null;
}

/**
 * Where a skill stands. Mastered: in the save's skills and not merely placed.
 * Placed: credited under a passed placement test. Landed: passed once, with the
 * second pass still open. A Landed skill whose window has closed is back to none
 * (its Landed XP stays).
 */
export function skillStateOf(save: ProtocolSave, key: string, today: string | null, logDays: string[] = []): SkillState {
  const passes = passDatesOf(save, key, logDays);
  if (save.skills?.[key]) {
    if (!save.vouched?.[key]) return { proof: 'mastered', passes, window: null };
    if (provenByPasses(passes)) return { proof: 'mastered', passes, window: null };
  }
  const last = passes[passes.length - 1];
  const open = last && (!today || daysBetween(last, today) <= MASTERY_WINDOW_DAYS);
  if (open) {
    return { proof: 'landed', passes, window: { from: addDays(last, MASTERY_GAP_DAYS), to: addDays(last, MASTERY_WINDOW_DAYS) } };
  }
  if (save.skills?.[key]) return { proof: 'placed', passes, window: null };
  return { proof: 'none', passes, window: null };
}

/** Tests taken on a day, across every skill. */
export function testsOn(save: ProtocolSave, date: string): number {
  return Object.values(save.tests ?? {}).reduce((sum, entries) => sum + entries.filter(([day]) => day === date).length, 0);
}

/** Whether a placement test is open for a line today. */
export function placementOpen(save: ProtocolSave, line: string, today: string): boolean {
  if (save.startedAt && daysBetween(save.startedAt, today) < PLACEMENT_OPEN_DAYS) return true;
  const last = save.placements?.[line];
  return !last || daysBetween(last, today) >= PLACEMENT_EVERY_DAYS;
}

export interface SkillXp {
  key: string;
  tree: SkillTreeRef;
  id: string;
  level: number;
  /** The day it was mastered. */
  date: string;
  /** The training week whose mastery slot it took. */
  slotWeek: string;
  xp: number;
}

/**
 * Mastery XP, paced: three masteries a training week and one per line. A
 * mastery past those slots takes the next free week, and its XP arrives then.
 * Placed skills pay nothing.
 */
export function masterySlots(save: ProtocolSave): SkillXp[] {
  const entries = Object.entries(save.skills ?? {})
    .filter(([key]) => !save.vouched?.[key])
    .map(([key, date]) => {
      const [tree, ...rest] = key.split(':');
      const id = rest.join(':');
      const ref = (tree === 'bouldering' ? 'bouldering' : 'calisthenics') as SkillTreeRef;
      const skill = skillOf(ref, id);
      return { key, tree: ref, id, date, level: skillXpLevel(ref, id), line: `${ref}:${skill?.subCategory ?? id}` };
    })
    .filter((entry) => entry.level > 0)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.key.localeCompare(b.key)));

  const perWeek = new Map<string, number>();
  const perLine = new Map<string, number>();
  return entries.map((entry) => {
    let week = mondayOfDate(entry.date);
    for (let guard = 0; guard < 520; guard += 1) {
      const used = perWeek.get(week) ?? 0;
      const lineUsed = perLine.get(`${week}|${entry.line}`) ?? 0;
      if (used < MASTERIES_PER_WEEK && lineUsed < MASTERIES_PER_LINE_WEEK) break;
      week = addDays(week, 7);
    }
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
    perLine.set(`${week}|${entry.line}`, (perLine.get(`${week}|${entry.line}`) ?? 0) + 1);
    return { key: entry.key, tree: entry.tree, id: entry.id, level: entry.level, date: entry.date, slotWeek: week, xp: masteryXp(entry.level) };
  });
}

/** Landed XP: once per skill, on the first day it was passed. */
export function landedSkills(save: ProtocolSave, logDaysOf: (key: string) => string[] = () => []): { key: string; date: string; xp: number }[] {
  const keys = new Set([...Object.keys(save.tests ?? {}), ...Object.keys(save.skills ?? {})]);
  const out: { key: string; date: string; xp: number }[] = [];
  for (const key of keys) {
    const passes = passDatesOf(save, key, logDaysOf(key));
    if (!passes.length) continue;
    const [tree, ...rest] = key.split(':');
    const ref = (tree === 'bouldering' ? 'bouldering' : 'calisthenics') as SkillTreeRef;
    const level = skillXpLevel(ref, rest.join(':'));
    if (level > 0) out.push({ key, date: passes[0], xp: landedXp(level) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Levels                                                              */
/* ------------------------------------------------------------------ */

/** XP from one level to the next: 525 from level 1, 750 from level 10, 1,500 from level 40. */
export const xpToNext = (level: number) => 500 + 25 * level;

export function levelOfXp(xp: number): { level: number; into: number; forLevel: number } {
  let level = 1;
  let left = Math.max(0, Math.floor(xp));
  while (left >= xpToNext(level)) {
    left -= xpToNext(level);
    level += 1;
  }
  return { level, into: left, forLevel: xpToNext(level) };
}
