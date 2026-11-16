/**
 * The rules of the campaign.
 *
 * Everything here is a pure function of the player's save plus their plan —
 * no React, no storage. The page asks one question, `derive`, and renders the
 * answer; `diffEvents` compares two answers to find out what the player just
 * unlocked.
 */

import { BLUEPRINT_PLAN } from '../data/blueprintPlan';
import {
  ArmorPiece,
  Boss,
  BossRequirement,
  CampaignPlan,
  DAY_NAMES,
  DayId,
  Lift,
  Milestone,
  PlanDay,
  SkillTier,
  SkillTree,
  liftOf,
} from './campaignPlan';
import { formatStatValue } from './campaignPlan';
import { forgedIn, lastTickedWeek, slotOfPiece } from './armor';
import { ArmorSlot, HistoryPoint, PLAN_FORMAT_V3, SkillTreeRef } from './campaignV3';
import { floorsOf, masteredIn } from './treeIndex';

export { formatStatValue, unitLabel } from './campaignPlan';
import { AttributeStatus, evaluateAttributes } from './attributes';

/* ------------------------------------------------------------------ */
/* Save                                                                */
/* ------------------------------------------------------------------ */

export type EventKind = 'pr' | 'tier' | 'boss' | 'level' | 'mass' | 'iron' | 'day' | 'week' | 'skill' | 'attribute' | 'badge';

export interface GameEvent {
  kind: EventKind;
  title: string;
  detail: string;
  /** Events sharing a key replace each other, so a run of +/- taps reads as one PR. */
  key?: string;
}

export interface LogEntry extends GameEvent {
  date: string;
}

export interface ProtocolSave {
  /** ISO date of the Monday that opens week 1. Null until first opened in a browser. */
  startedAt: string | null;
  bodyWeightKg: number;
  /** Logged numbers by lift id. A lift that was never logged reads as its starting number. */
  stats: Record<string, number>;
  /** Running numbers for accessory lifts, keyed by exercise id. */
  loads: Record<string, number>;
  milestones: Record<string, boolean>;
  /** Ticked missions and armor upkeep, keyed by `questKey`. */
  quests: Record<string, boolean>;
  log: LogEntry[];
  /**
   * Skill-tree skills mastered, keyed `${tree}:${skillId}`, with the date they
   * were mastered. Kept in the save so mastery follows the account to every device.
   */
  skills: Record<string, string>;
  /** Save format: 3 once converted to the v3 campaign, absent on a save from before it. */
  version?: number;
  /** Latest logged number per record key (the exercise, see `recordKeyOf`). */
  records: Record<string, number>;
  /** Logged numbers over time per record key, one point per day, oldest first. */
  history: Record<string, HistoryPoint[]>;
  /** Badges earned (`boss:<id>`, `tower:<id>`, `record:<exercise>`), with the date first earned. Never removed. */
  badges: Record<string, string>;
}

export function createInitialSave(plan: CampaignPlan = BLUEPRINT_PLAN): ProtocolSave {
  return {
    startedAt: null,
    bodyWeightKg: plan.bodyweight.start,
    stats: {},
    loads: {},
    milestones: {},
    quests: {},
    log: [],
    skills: {},
    version: PLAN_FORMAT_V3,
    records: {},
    history: {},
    badges: {},
  };
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

/** Day ids in `Date.getDay()` order. */
const WEEKDAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The Monday on or before the given date. */
export function mondayOf(iso: string): string {
  const date = fromIsoDate(iso);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toIsoDate(date);
}

export function dayIdOf(iso: string): string {
  return WEEKDAY_IDS[fromIsoDate(iso).getDay()];
}

/** Campaign week for a date, starting at 1. */
export function weekOf(startedAt: string | null, todayIso: string): number {
  if (!startedAt) return 1;
  const elapsed = fromIsoDate(todayIso).getTime() - fromIsoDate(startedAt).getTime();
  return Math.max(1, Math.floor(Math.round(elapsed / 86_400_000) / 7) + 1);
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** A lift's number right now: the last log, or its starting number. */
export function currentOf(save: ProtocolSave, lift: Lift): number {
  return save.records?.[lift.id] ?? save.stats[lift.id] ?? lift.baseline;
}

/** The number a "lift N × bodyweight" boss asks for: the load itself, or the load on top of bodyweight for added-kg lifts. */
export function multipleTarget(lift: Lift | undefined, multiple: number, bodyWeightKg: number): number {
  const total = multiple * bodyWeightKg;
  return Math.round((lift?.unit === 'added-kg' ? Math.max(0, total - bodyWeightKg) : total) * 2) / 2;
}

/** How far up a skill's climb the player is: the skill and everything it needs. */
export interface SkillClimb {
  tree: SkillTreeRef;
  skill: string;
  name: string;
  floors: number;
  mastered: number;
  /** The summit itself is mastered. */
  done: boolean;
  /** The skills to master next: not mastered, with every skill they need mastered. Easiest first. */
  next: { id: string; name: string; level: number }[];
}

export function climbOf(save: ProtocolSave, tree: SkillTreeRef, skill: string): SkillClimb | null {
  const floors = floorsOf(tree, skill);
  if (!floors.length) return null;
  const owned = masteredIn(save.skills, tree);
  const inClimb = new Set(floors.map((floor) => floor.id));
  const next = floors
    .filter((floor) => !owned.has(floor.id) && floor.prerequisites.every((id) => !inClimb.has(id) || owned.has(id)))
    .map((floor) => ({ id: floor.id, name: floor.name, level: floor.level }));
  // Every other floor needs the summit's level or less, strictly, so the summit sorts last.
  const summit = floors[floors.length - 1];
  return {
    tree,
    skill: summit.id,
    name: summit.name,
    floors: floors.length,
    mastered: floors.filter((floor) => owned.has(floor.id)).length,
    done: owned.has(summit.id),
    next,
  };
}

/** How far a lift has travelled from its starting number to a gate, 0–1. */
function travel(lift: Lift, current: number, target: number): number {
  const span = target - lift.baseline;
  if (span <= 0) return current >= target ? 1 : 0;
  return clamp01((current - lift.baseline) / span);
}

/** Progress from `from` to `to`, 0–1, whichever way the number has to move. */
export function towards(current: number, from: number, to: number): number {
  if (to === from) return current === to ? 1 : 0;
  return clamp01((current - from) / (to - from));
}

/** True once the number has reached `to`, coming from `from`. */
export function reached(current: number, from: number, to: number): boolean {
  return to >= from ? current >= to : current <= to;
}

/**
 * Some gates grow with bodyweight: a planche at 75 kg asks more than the same
 * planche at 66 kg. Between the plan's starting and goal weight the target is
 * interpolated; outside that window the nearest end is used.
 */
export function scaledTarget(target: number, atGoal: number | undefined, bodyWeightKg: number, plan: CampaignPlan): number {
  if (atGoal === undefined) return target;
  const t = towards(bodyWeightKg, plan.bodyweight.start, plan.bodyweight.goal);
  return Math.round((target + (atGoal - target) * t) * 2) / 2;
}

/** "Boss 3 · Handstand Push-up" — how a boss is named on chips and map nodes. */
export function shortBossName(boss: Boss): string {
  return boss.name.replace(/^(The|One Clean) /, '');
}

/* ------------------------------------------------------------------ */
/* Bosses                                                              */
/* ------------------------------------------------------------------ */

export interface RequirementStatus {
  requirement: BossRequirement;
  label: string;
  /** Set for lift requirements. */
  lift?: Lift;
  /** Set for milestone requirements. */
  milestone?: Milestone;
  /** Set for skill requirements: the climb to the skill. */
  climb?: SkillClimb;
  target: number;
  current: number;
  met: boolean;
  ratio: number;
  /** The target grows with bodyweight. */
  scales: boolean;
}

export interface BossStatus {
  boss: Boss;
  /** 1-based position in the plan. */
  order: number;
  requirements: RequirementStatus[];
  /** 0–1. Every PR on a linked lift chips at this. */
  damage: number;
  defeated: boolean;
  /** A prerequisite boss is still standing. */
  sealed: boolean;
  sealedBy?: string;
}

function evaluateRequirement(
  req: BossRequirement,
  save: ProtocolSave,
  plan: CampaignPlan,
  defeated: Set<string>,
): RequirementStatus {
  if (req.kind === 'lift') {
    const lift = liftOf(plan, req.lift);
    if (!lift) return { requirement: req, label: req.label ?? 'Missing lift', target: 1, current: 0, met: false, ratio: 0, scales: false };
    const current = currentOf(save, lift);
    const target = scaledTarget(req.target, req.atGoal, save.bodyWeightKg, plan);
    return {
      requirement: req,
      label: req.label ?? lift.name,
      lift,
      target,
      current,
      met: current >= target,
      ratio: travel(lift, current, target),
      scales: req.atGoal !== undefined,
    };
  }

  if (req.kind === 'multiple') {
    const lift = liftOf(plan, req.lift);
    if (!lift) return { requirement: req, label: req.label ?? 'Missing lift', target: 1, current: 0, met: false, ratio: 0, scales: false };
    const current = currentOf(save, lift);
    const target = multipleTarget(lift, req.multiple, save.bodyWeightKg);
    return {
      requirement: req,
      label: req.label ?? `${lift.name} · ${req.multiple}× bodyweight`,
      lift,
      target,
      current,
      met: current >= target,
      ratio: travel(lift, current, target),
      scales: true,
    };
  }

  if (req.kind === 'scale') {
    const { start } = plan.bodyweight;
    const current = save.bodyWeightKg;
    return {
      requirement: req,
      label: req.label ?? `${req.kg} kg on the scale`,
      target: req.kg,
      current,
      met: reached(current, start, req.kg),
      ratio: towards(current, start, req.kg),
      scales: false,
    };
  }

  if (req.kind === 'skill') {
    const climb = climbOf(save, req.tree, req.skill);
    const met = Boolean(climb?.done);
    return {
      requirement: req,
      label: req.label ?? `Master ${climb?.name ?? 'the skill'}`,
      climb: climb ?? undefined,
      target: climb?.floors ?? 1,
      current: climb?.mastered ?? 0,
      met,
      // The summit itself is the last blow: the skills below it take the boss down to one hit.
      ratio: met ? 1 : climb ? Math.min(climb.mastered, climb.floors - 1) / climb.floors : 0,
      scales: false,
    };
  }

  if (req.kind === 'milestone') {
    const milestone = plan.milestones.find((entry) => entry.id === req.milestone);
    const met = Boolean(save.milestones[req.milestone]);
    return {
      requirement: req,
      label: req.label ?? milestone?.name ?? 'Milestone',
      milestone,
      target: 1,
      current: met ? 1 : 0,
      met,
      ratio: met ? 1 : 0,
      scales: false,
    };
  }

  const other = plan.bosses.find((boss) => boss.id === req.boss);
  const met = defeated.has(req.boss);
  return {
    requirement: req,
    label: req.label ?? `${other ? other.name : 'Another boss'} defeated`,
    target: 1,
    current: met ? 1 : 0,
    met,
    ratio: met ? 1 : 0,
    scales: false,
  };
}

/**
 * Bosses can chain (the planche needs the handstand push-up down first), so
 * the defeated set is grown pass by pass until it stops changing. A boss with
 * no requirements can never be defeated.
 */
export function evaluateBosses(save: ProtocolSave, plan: CampaignPlan): BossStatus[] {
  let defeated = new Set<string>();
  for (let pass = 0; pass <= plan.bosses.length; pass += 1) {
    const next = new Set<string>();
    for (const boss of plan.bosses) {
      if (boss.requirements.length > 0 && boss.requirements.every((r) => evaluateRequirement(r, save, plan, defeated).met)) {
        next.add(boss.id);
      }
    }
    const changed = next.size !== defeated.size;
    defeated = next;
    if (!changed) break;
  }

  return plan.bosses.map((boss, index) => {
    const requirements = boss.requirements.map((r) => evaluateRequirement(r, save, plan, defeated));
    const seal = requirements.find((r) => r.requirement.kind === 'boss' && !r.met);
    return {
      boss,
      order: index + 1,
      requirements,
      damage: requirements.length ? requirements.reduce((sum, r) => sum + r.ratio, 0) / requirements.length : 0,
      defeated: defeated.has(boss.id),
      sealed: Boolean(seal),
      sealedBy: seal?.label,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Skill trees                                                         */
/* ------------------------------------------------------------------ */

export interface TierGate {
  stat: Lift;
  target: number;
  current: number;
  met: boolean;
  scales: boolean;
}

export interface TierStatus {
  tier: SkillTier;
  gates: TierGate[];
  cleared: boolean;
  /** Cleared because the plan says so, not because the numbers do. */
  byBlueprint: boolean;
  progress: number;
  /** The rung the player is fighting for right now. */
  isCurrent: boolean;
}

export interface LadderStatus {
  ladder: SkillTree;
  tiers: TierStatus[];
  clearedCount: number;
}

function evaluateLadder(ladder: SkillTree, save: ProtocolSave, plan: CampaignPlan): LadderStatus {
  const owned = ladder.tower ? masteredIn(save.skills, ladder.tower.tree) : null;
  const tiers: TierStatus[] = ladder.tiers.map((tier) => {
    // A tower floor is cleared by mastering its skill on the tree.
    if (tier.skill && owned) {
      const cleared = owned.has(tier.skill.id);
      return { tier, gates: [], cleared, byBlueprint: false, progress: cleared ? 1 : 0, isCurrent: false };
    }
    const gates: TierGate[] = [];
    for (const gate of tier.gates) {
      const lift = liftOf(plan, gate.lift);
      if (!lift) continue;
      const target = scaledTarget(gate.target, gate.atGoal, save.bodyWeightKg, plan);
      const current = currentOf(save, lift);
      gates.push({ stat: lift, target, current, met: current >= target, scales: gate.atGoal !== undefined });
    }

    const earned = gates.length > 0 && gates.every((gate) => gate.met);
    const cleared = earned || Boolean(tier.preCleared);
    const progress = cleared
      ? 1
      : gates.length
        ? gates.reduce((sum, gate) => sum + travel(gate.stat, gate.current, gate.target), 0) / gates.length
        : 0;

    return { tier, gates, cleared, byBlueprint: cleared && !earned, progress, isCurrent: false };
  });

  const current = tiers.find((tier) => !tier.cleared);
  if (current) current.isCurrent = true;

  return { ladder, tiers, clearedCount: tiers.filter((tier) => tier.cleared).length };
}

/* ------------------------------------------------------------------ */
/* Bodyweight                                                          */
/* ------------------------------------------------------------------ */

export interface WeightGoalStatus {
  id: string;
  label: string;
  kg: number;
  week?: number;
  act: string;
  cleared: boolean;
}

/** The weight goals on the map, in the order they will be reached. */
function weightGoals(plan: CampaignPlan): Omit<WeightGoalStatus, 'cleared'>[] {
  const { start, goal } = plan.bodyweight;
  const sign = goal >= start ? 1 : -1;
  return plan.acts
    .flatMap((act) =>
      act.goals.flatMap((entry) =>
        entry.kind === 'weight' ? [{ id: entry.id, label: entry.label, kg: entry.kg, week: entry.week, act: act.name }] : [],
      ),
    )
    .sort((a, b) => sign * (a.kg - b.kg));
}

/**
 * Where the scale should be at the end of a week: the dated weight goals on
 * the map joined by straight lines, then the weekly change until the goal.
 */
export function massTargetForWeek(week: number, plan: CampaignPlan): number {
  const { start, goal, weeklyChangeKg } = plan.bodyweight;
  const sign = goal >= start ? 1 : -1;
  const dated = weightGoals(plan)
    .filter((entry) => entry.week !== undefined)
    .map((entry) => ({ week: entry.week as number, kg: entry.kg }))
    .sort((a, b) => a.week - b.week);
  const points = [{ week: 0, kg: start }, ...dated];
  const last = points[points.length - 1];

  let kg: number;
  if (week >= last.week) {
    const moved = last.kg + sign * (week - last.week) * weeklyChangeKg;
    kg = sign > 0 ? Math.min(goal, moved) : Math.max(goal, moved);
    if (sign > 0 ? last.kg > goal : last.kg < goal) kg = last.kg;
  } else {
    const upper = points.findIndex((point) => point.week >= week);
    const a = points[Math.max(0, upper - 1)];
    const b = points[upper];
    kg = b.week === a.week ? b.kg : a.kg + ((b.kg - a.kg) * (week - a.week)) / (b.week - a.week);
  }
  return round1(kg);
}

export interface MassStatus {
  current: number;
  start: number;
  goal: number;
  /** Signed change since the start. */
  gained: number;
  /** True when the plan is to gain weight, false when it is to lose it. */
  gaining: boolean;
  /** 0–1 towards the goal weight. */
  finalProgress: number;
  finalBossDown: boolean;
  /** The next weight goal on the map that is not reached yet. */
  next: WeightGoalStatus | null;
  nextProgress: number;
  checkpoints: WeightGoalStatus[];
  /** Where the plan wants the scale by the end of this week. */
  weekTargetKg: number;
  /** Kilos still to go to this week's target. 0 when on or ahead of it. */
  shortKg: number;
  onPace: boolean;
  weeksToFinal: number;
}

function evaluateMass(save: ProtocolSave, week: number, plan: CampaignPlan): MassStatus {
  const { start, goal, weeklyChangeKg } = plan.bodyweight;
  const current = save.bodyWeightKg;
  const gaining = goal >= start;
  const weekTargetKg = massTargetForWeek(week, plan);
  const checkpoints = weightGoals(plan).map((entry) => ({ ...entry, cleared: reached(current, start, entry.kg) }));
  const next = checkpoints.find((entry) => !entry.cleared) ?? null;
  const lastWeekTarget = massTargetForWeek(week - 1, plan);

  return {
    current,
    start,
    goal,
    gained: round1(current - start),
    gaining,
    finalProgress: towards(current, start, goal),
    finalBossDown: reached(current, start, goal),
    next,
    nextProgress: next ? towards(current, start, next.kg) : 1,
    checkpoints,
    weekTargetKg,
    shortKg: Math.max(0, round1(gaining ? weekTargetKg - current : current - weekTargetKg)),
    onPace: reached(current, start, lastWeekTarget),
    weeksToFinal: reached(current, start, goal) ? 0 : Math.ceil(Math.abs(goal - current) / weeklyChangeKg - 1e-9),
  };
}

/* ------------------------------------------------------------------ */
/* Lift checkpoints — lift goals on the map                            */
/* ------------------------------------------------------------------ */

export interface IronCheckpointStatus {
  id: string;
  label: string;
  act: string;
  stat: Lift;
  target: number;
  current: number;
  met: boolean;
  ratio: number;
}

function evaluateCheckpoints(save: ProtocolSave, plan: CampaignPlan): IronCheckpointStatus[] {
  return plan.acts.flatMap((act) =>
    act.goals.flatMap((goal) => {
      if (goal.kind !== 'lift') return [];
      const lift = liftOf(plan, goal.lift);
      if (!lift) return [];
      const current = currentOf(save, lift);
      return [
        {
          id: goal.id,
          label: goal.label ?? lift.name,
          act: act.name,
          stat: lift,
          target: goal.target,
          current,
          met: current >= goal.target,
          ratio: travel(lift, current, goal.target),
        },
      ];
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Weekly missions                                                     */
/* ------------------------------------------------------------------ */

export function questKey(week: number, id: string): string {
  return `w${week}_${id}`;
}

export function restKey(week: number, dayId: string): string {
  return questKey(week, `${dayId}_rest`);
}

/** Every key a perfect day needs ticked. */
function missionIds(day: PlanDay): string[] {
  return day.kind === 'rest' ? [`${day.id}_rest`] : day.exercises.map((exercise) => exercise.id);
}

const allMissionIds = (plan: CampaignPlan) => plan.days.flatMap(missionIds);

export interface DayStatus {
  day: PlanDay;
  /** "Monday". */
  name: string;
  done: number;
  total: number;
  cleared: boolean;
}

export interface WeekStatus {
  week: number;
  days: DayStatus[];
  done: number;
  total: number;
  progress: number;
  perfect: boolean;
  armor: ArmorStatus[];
  armorCount: number;
  /** Warm-up ticks this week, by warm-up id. */
  warmUpsDone: Set<string>;
}

export interface ArmorStatus {
  piece: ArmorPiece;
  slot: ArmorSlot;
  forged: boolean;
  /** Names of the warm-ups ticked this week that forged it. */
  forgedBy: string[];
  /** Names of the plan's warm-ups that guard it, and their days. */
  guardedBy: { name: string; day: DayId }[];
}

function evaluateWeek(save: ProtocolSave, week: number, plan: CampaignPlan): WeekStatus {
  const days = plan.days.map((day) => {
    const ids = missionIds(day);
    const done = ids.filter((id) => save.quests[questKey(week, id)]).length;
    return { day, name: DAY_NAMES[day.id], done, total: ids.length, cleared: ids.length > 0 && done === ids.length };
  });

  const done = days.reduce((sum, day) => sum + day.done, 0);
  const total = days.reduce((sum, day) => sum + day.total, 0);
  const forged = forgedIn(save.quests, plan, week);
  const warmUps = plan.days.flatMap((day) => day.warmUps.map((warmUp) => ({ ...warmUp, day: day.id })));
  const armor = plan.armor.map((piece): ArmorStatus => {
    const slot = slotOfPiece(piece.id);
    const by = forged.get(slot);
    return {
      piece,
      slot,
      forged: by !== undefined,
      forgedBy: [...new Set((by ?? []).map((id) => warmUps.find((warmUp) => warmUp.id === id)?.name ?? ''))].filter(Boolean),
      guardedBy: warmUps.filter((warmUp) => warmUp.guards.includes(slot)).map((warmUp) => ({ name: warmUp.name, day: warmUp.day })),
    };
  });
  const warmUpsDone = new Set(warmUps.filter((warmUp) => save.quests[questKey(week, warmUp.id)]).map((warmUp) => warmUp.id));

  return {
    week,
    days,
    done,
    total,
    progress: total ? done / total : 0,
    perfect: total > 0 && done === total,
    armor,
    armorCount: armor.filter((entry) => entry.forged).length,
    warmUpsDone,
  };
}

function countPerfectWeeks(save: ProtocolSave, plan: CampaignPlan): number {
  const ids = allMissionIds(plan);
  if (ids.length === 0) return 0;

  let lastWeek = 0;
  for (const key of Object.keys(save.quests)) {
    const match = /^w(\d+)_/.exec(key);
    if (match && save.quests[key]) lastWeek = Math.max(lastWeek, Number(match[1]));
  }

  let perfect = 0;
  for (let week = 1; week <= lastWeek; week += 1) {
    if (ids.every((id) => save.quests[questKey(week, id)])) perfect += 1;
  }
  return perfect;
}

/**
 * Days in a row with every mission of the day ticked — a rest day counts once
 * its rest is claimed. Worked out from the ticks already saved, so nothing new
 * is stored. Today only adds to the streak once it is cleared; leaving it open
 * does not break the run, and the count never reaches back before week 1.
 */
export function streakOf(save: ProtocolSave, plan: CampaignPlan, todayIso: string): number {
  if (!save.startedAt || plan.days.length === 0) return 0;

  const weeks = new Map<number, WeekStatus>();
  const clearedOn = (iso: string): boolean | null => {
    const week = weekOf(save.startedAt, iso);
    let status = weeks.get(week);
    if (!status) {
      status = evaluateWeek(save, week, plan);
      weeks.set(week, status);
    }
    const day = status.days.find((entry) => entry.day.id === dayIdOf(iso));
    return day ? day.cleared : null;
  };

  const start = fromIsoDate(save.startedAt);
  const cursor = fromIsoDate(todayIso);
  let streak = clearedOn(todayIso) ? 1 : 0;

  cursor.setDate(cursor.getDate() - 1);
  // Ten years is far beyond any campaign; the bound only guards the loop.
  for (let guard = 0; guard < 3660 && cursor >= start; guard += 1) {
    const cleared = clearedOn(toIsoDate(cursor));
    if (cleared === false) break;
    if (cleared) streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/* Level & XP                                                          */
/* ------------------------------------------------------------------ */

export const XP_RULES = {
  perLevel: 500,
  statMax: 300,
  tier: 400,
  /** A tower climbed to its summit. Its floors are skills, which earn on the tree. */
  tower: 400,
  /** Each skill mastered on the way up a tower or a skill boss. */
  floor: 50,
  boss: 1500,
  ironCheckpoint: 300,
  massMax: 1500,
  mission: 10,
  warmUp: 5,
  /** Each armour piece forged in a week. */
  armor: 15,
  perfectWeek: 150,
};

export interface LevelStatus {
  level: number;
  rank: string;
  xp: number;
  xpIntoLevel: number;
  xpForLevel: number;
  perfectWeeks: number;
  breakdown: { label: string; xp: number }[];
}

export function rankForLevel(level: number): string {
  if (level >= 45) return 'Calisthenics Titan';
  if (level >= 36) return 'Static Hold Master';
  if (level >= 27) return 'Planche Squire';
  if (level >= 19) return 'Lever Knight';
  if (level >= 12) return 'Tension Adept';
  if (level >= 6) return 'Iron Initiate';
  return 'Novice Athlete';
}

function evaluateLevel(
  save: ProtocolSave,
  plan: CampaignPlan,
  bosses: BossStatus[],
  ladders: LadderStatus[],
  mass: MassStatus,
  checkpoints: IronCheckpointStatus[],
): LevelStatus {
  const strength = plan.lifts.reduce((sum, lift) => {
    if (lift.endgame === null) return sum;
    return sum + travel(lift, currentOf(save, lift), lift.endgame) * XP_RULES.statMax;
  }, 0);

  const earnedTiers = ladders.reduce(
    (sum, ladder) => (ladder.ladder.tower ? sum : sum + ladder.tiers.filter((tier) => tier.cleared && !tier.byBlueprint).length),
    0,
  );
  const towersClimbed = ladders.filter((ladder) => ladder.ladder.tower && ladder.tiers.length > 0 && ladder.clearedCount === ladder.tiers.length).length;
  // Skills that are floors of a tower or weak points of a skill boss, counted once each.
  const climbed = new Set<string>();
  for (const ladder of ladders) {
    for (const tier of ladder.tiers) {
      if (tier.cleared && tier.tier.skill) climbed.add(`${tier.tier.skill.tree}:${tier.tier.skill.id}`);
    }
  }
  for (const status of bosses) {
    for (const { climb } of status.requirements) {
      if (!climb) continue;
      const owned = masteredIn(save.skills, climb.tree);
      for (const floor of floorsOf(climb.tree, climb.skill)) {
        if (owned.has(floor.id)) climbed.add(`${climb.tree}:${floor.id}`);
      }
    }
  }

  // Warm-ups and hand-ticked armour are not missions; armour counts once per piece per week.
  let missions = 0;
  let warmUps = 0;
  for (const [key, ticked] of Object.entries(save.quests)) {
    if (!ticked || key.includes('_armor_')) continue;
    if (key.includes('_warm_')) warmUps += 1;
    else missions += 1;
  }
  let armor = 0;
  for (let week = 1, last = lastTickedWeek(save.quests); week <= last; week += 1) armor += forgedIn(save.quests, plan, week).size;
  const perfectWeeks = countPerfectWeeks(save, plan);

  const breakdown = [
    { label: 'Iron strength', xp: Math.round(strength) },
    ...(earnedTiers ? [{ label: 'Skill tiers', xp: earnedTiers * XP_RULES.tier }] : []),
    { label: 'Skills climbed', xp: climbed.size * XP_RULES.floor },
    { label: 'Towers', xp: towersClimbed * XP_RULES.tower },
    { label: 'Bosses', xp: bosses.filter((b) => b.defeated).length * XP_RULES.boss },
    { label: 'Lift checkpoints', xp: checkpoints.filter((c) => c.met).length * XP_RULES.ironCheckpoint },
    { label: 'Bodyweight', xp: Math.round(mass.finalProgress * XP_RULES.massMax) },
    { label: 'Missions', xp: missions * XP_RULES.mission + warmUps * XP_RULES.warmUp + armor * XP_RULES.armor },
    { label: 'Perfect weeks', xp: perfectWeeks * XP_RULES.perfectWeek },
  ];

  const xp = breakdown.reduce((sum, entry) => sum + entry.xp, 0);
  const level = 1 + Math.floor(xp / XP_RULES.perLevel);

  return {
    level,
    rank: rankForLevel(level),
    xp,
    xpIntoLevel: xp % XP_RULES.perLevel,
    xpForLevel: XP_RULES.perLevel,
    perfectWeeks,
    breakdown,
  };
}

/* ------------------------------------------------------------------ */
/* Acts — the campaign map                                             */
/* ------------------------------------------------------------------ */

export interface ActNode {
  id: string;
  label: string;
  detail: string;
  done: boolean;
}

export interface ActStatus {
  id: string;
  numeral: string;
  name: string;
  tagline: string;
  nodes: ActNode[];
  progress: number;
  complete: boolean;
  current: boolean;
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function evaluateActs(
  save: ProtocolSave,
  plan: CampaignPlan,
  bosses: BossStatus[],
  ladders: LadderStatus[],
  mass: MassStatus,
  checkpoints: IronCheckpointStatus[],
): ActStatus[] {
  const acts: ActStatus[] = plan.acts.map((act, index) => {
    const scored = act.goals.flatMap((goal): { node: ActNode; progress: number }[] => {
      switch (goal.kind) {
        case 'weight': {
          const done = reached(mass.current, mass.start, goal.kg);
          return [
            {
              node: { id: goal.id, label: goal.label, detail: `${goal.kg.toFixed(1)} kg${goal.week ? ` · week ${goal.week}` : ''}`, done },
              progress: towards(mass.current, mass.start, goal.kg),
            },
          ];
        }
        case 'lift': {
          const checkpoint = checkpoints.find((entry) => entry.id === goal.id);
          if (!checkpoint) return [];
          return [
            {
              node: { id: goal.id, label: checkpoint.stat.short, detail: formatStatValue(checkpoint.target, checkpoint.stat.unit), done: checkpoint.met },
              progress: checkpoint.ratio,
            },
          ];
        }
        case 'boss': {
          const status = bosses.find((entry) => entry.boss.id === goal.boss);
          if (!status) return [];
          return [
            {
              node: { id: goal.id, label: `Boss ${status.order}`, detail: shortBossName(status.boss), done: status.defeated },
              progress: status.defeated ? 1 : status.damage,
            },
          ];
        }
        case 'tier': {
          for (const ladder of ladders) {
            const tier = ladder.tiers.find((entry) => entry.tier.id === goal.tier);
            if (tier) {
              return [{ node: { id: goal.id, label: tier.tier.rung, detail: tier.tier.name, done: tier.cleared }, progress: tier.progress }];
            }
          }
          return [];
        }
        case 'skill': {
          const climb = climbOf(save, goal.tree, goal.skill);
          if (!climb) return [];
          return [
            {
              node: { id: goal.id, label: goal.label ?? 'Skill', detail: climb.name, done: climb.done },
              progress: climb.done ? 1 : climb.mastered / climb.floors,
            },
          ];
        }
        case 'tower': {
          const tower = ladders.find((entry) => entry.ladder.id === goal.tower);
          if (!tower) return [];
          const total = tower.tiers.length;
          const done = total > 0 && tower.clearedCount === total;
          return [
            {
              node: { id: goal.id, label: 'Tower', detail: tower.ladder.name, done },
              progress: total ? tower.clearedCount / total : 0,
            },
          ];
        }
        case 'milestone': {
          const milestone = plan.milestones.find((entry) => entry.id === goal.milestone);
          if (!milestone) return [];
          const done = Boolean(save.milestones[milestone.id]);
          return [{ node: { id: goal.id, label: 'Milestone', detail: milestone.name, done }, progress: done ? 1 : 0 }];
        }
      }
    });

    return {
      id: act.id,
      numeral: NUMERALS[index] ?? String(index + 1),
      name: act.name,
      tagline: act.tagline,
      nodes: scored.map((entry) => entry.node),
      progress: scored.length ? scored.reduce((sum, entry) => sum + entry.progress, 0) / scored.length : 0,
      complete: scored.length > 0 && scored.every((entry) => entry.node.done),
      current: false,
    };
  });

  // An act with nothing on it is a placeholder: it is never the one being played.
  const current = acts.find((act) => !act.complete && act.nodes.length > 0);
  if (current) current.current = true;
  return acts;
}

/* ------------------------------------------------------------------ */
/* Next gates — "what do I chase?"                                     */
/* ------------------------------------------------------------------ */

export interface Gate {
  stat: Lift;
  target: number;
  current: number;
  /** What clearing this number unlocks. */
  unlocks: string;
  remaining: number;
  /** 0–1, how close the lift is to this gate. */
  closeness: number;
}

/** For each lift, the nearest number that would unlock something. Closest first. */
function evaluateGates(
  save: ProtocolSave,
  plan: CampaignPlan,
  bosses: BossStatus[],
  ladders: LadderStatus[],
  checkpoints: IronCheckpointStatus[],
): Gate[] {
  const best = new Map<string, { lift: Lift; target: number; unlocks: string }>();

  const consider = (lift: Lift, target: number, unlocks: string) => {
    if (currentOf(save, lift) >= target) return;
    const existing = best.get(lift.id);
    if (!existing || target < existing.target) best.set(lift.id, { lift, target, unlocks });
  };

  for (const ladder of ladders) {
    for (const tier of ladder.tiers) {
      if (tier.cleared) continue;
      for (const gate of tier.gates) consider(gate.stat, gate.target, `${tier.tier.name} · ${ladder.ladder.name}`);
    }
  }
  for (const checkpoint of checkpoints) {
    consider(checkpoint.stat, checkpoint.target, `${checkpoint.act} checkpoint`);
  }
  for (const status of bosses) {
    for (const req of status.requirements) {
      if (req.lift) consider(req.lift, req.target, `Boss ${status.order} · ${status.boss.name}`);
    }
  }

  return [...best.values()]
    .map(({ lift, target, unlocks }) => {
      const current = currentOf(save, lift);
      return {
        stat: lift,
        target,
        current,
        unlocks,
        remaining: round1(target - current),
        closeness: travel(lift, current, target),
      };
    })
    .sort((a, b) => b.closeness - a.closeness);
}

/* ------------------------------------------------------------------ */
/* derive — the one question the page asks                             */
/* ------------------------------------------------------------------ */

export interface Derived {
  bosses: BossStatus[];
  ladders: LadderStatus[];
  mass: MassStatus;
  checkpoints: IronCheckpointStatus[];
  acts: ActStatus[];
  level: LevelStatus;
  week: WeekStatus;
  gates: Gate[];
  attributes: AttributeStatus[];
}

export interface Clock {
  /** The campaign week the calendar says it is. */
  currentWeek: number;
  /** The week the player is looking at on the mission board. */
  viewWeek: number;
}

export function derive(save: ProtocolSave, clock: Clock, plan: CampaignPlan): Derived {
  const bosses = evaluateBosses(save, plan);
  const ladders = plan.trees.map((tree) => evaluateLadder(tree, save, plan));
  const mass = evaluateMass(save, clock.currentWeek, plan);
  const checkpoints = evaluateCheckpoints(save, plan);

  return {
    bosses,
    ladders,
    mass,
    checkpoints,
    acts: evaluateActs(save, plan, bosses, ladders, mass, checkpoints),
    level: evaluateLevel(save, plan, bosses, ladders, mass, checkpoints),
    week: evaluateWeek(save, clock.viewWeek, plan),
    gates: evaluateGates(save, plan, bosses, ladders, checkpoints),
    attributes: evaluateAttributes(save, plan, bosses, ladders),
  };
}

/* ------------------------------------------------------------------ */
/* Badges — kept for good, whatever the plan becomes                   */
/* ------------------------------------------------------------------ */

export interface BadgeAward {
  id: string;
  kind: 'boss' | 'tower' | 'record';
  title: string;
  detail: string;
}

/** Badges the save has earned but not been given yet: bosses down, towers climbed, lifts at their end-game number. */
export function badgesDue(save: ProtocolSave, derived: Derived, plan: CampaignPlan): BadgeAward[] {
  const due: BadgeAward[] = [];
  const add = (award: BadgeAward) => {
    if (!save.badges[award.id]) due.push(award);
  };
  for (const status of derived.bosses) {
    if (status.defeated) add({ id: `boss:${status.boss.id}`, kind: 'boss', title: status.boss.name, detail: 'Boss defeated' });
  }
  for (const ladder of derived.ladders) {
    if (ladder.ladder.tower && ladder.tiers.length > 0 && ladder.clearedCount === ladder.tiers.length) {
      add({ id: `tower:${ladder.ladder.id}`, kind: 'tower', title: ladder.ladder.name, detail: 'Climbed to the summit' });
    }
  }
  for (const lift of plan.lifts) {
    if (lift.endgame !== null && currentOf(save, lift) >= lift.endgame) {
      add({ id: `record:${lift.id}`, kind: 'record', title: lift.name, detail: `End-game number · ${formatStatValue(lift.endgame, lift.unit)}` });
    }
  }
  return due;
}

/* ------------------------------------------------------------------ */
/* diffEvents — what did that last action unlock?                      */
/* ------------------------------------------------------------------ */

/** Both answers must come from the same plan. */
export function diffEvents(before: Derived, after: Derived): GameEvent[] {
  const events: GameEvent[] = [];

  after.ladders.forEach((ladder, l) => {
    ladder.tiers.forEach((tier, t) => {
      if (tier.cleared && !before.ladders[l]?.tiers[t]?.cleared) {
        events.push({
          kind: 'tier',
          title: `${tier.tier.rung} cleared — ${tier.tier.name}`,
          detail: ladder.ladder.name,
        });
      }
    });
  });

  after.checkpoints.forEach((checkpoint, i) => {
    if (checkpoint.met && !before.checkpoints[i]?.met) {
      events.push({
        kind: 'iron',
        title: `Checkpoint — ${checkpoint.stat.short}`,
        detail: `${formatStatValue(checkpoint.target, checkpoint.stat.unit)} · ${checkpoint.act}`,
      });
    }
  });

  after.mass.checkpoints.forEach((checkpoint, i) => {
    if (checkpoint.cleared && !before.mass.checkpoints[i]?.cleared) {
      events.push({
        kind: 'mass',
        title: `${checkpoint.label} — ${checkpoint.kg.toFixed(1)} kg`,
        detail: `${checkpoint.kg.toFixed(1)} kg on the scale · ${checkpoint.act}`,
      });
    }
  });
  const goalOnMap = after.mass.checkpoints.some((checkpoint) => checkpoint.kg === after.mass.goal);
  if (after.mass.finalBossDown && !before.mass.finalBossDown && !goalOnMap && after.mass.goal !== after.mass.start) {
    events.push({ kind: 'mass', title: `Goal weight reached — ${after.mass.goal} kg`, detail: 'As planned' });
  }

  after.bosses.forEach((status, i) => {
    if (status.defeated && !before.bosses[i]?.defeated) {
      events.push({
        kind: 'boss',
        title: `Boss ${status.order} defeated`,
        detail: status.boss.name,
      });
    }
  });

  if (after.week.week === before.week.week) {
    after.week.days.forEach((day, i) => {
      if (day.cleared && !before.week.days[i]?.cleared) {
        events.push({
          kind: 'day',
          title: `${day.name} cleared`,
          detail: `${day.day.title} · week ${after.week.week}`,
        });
      }
    });
    if (after.week.perfect && !before.week.perfect) {
      events.push({
        kind: 'week',
        title: `Perfect week ${after.week.week}`,
        detail: `Every mission ticked · +${XP_RULES.perfectWeek} XP`,
      });
    }
  }

  after.attributes.forEach((attribute, i) => {
    if (attribute.unlocked && !before.attributes[i]?.unlocked) {
      events.push({
        kind: 'attribute',
        title: attribute.def.secret ? `Secret attribute — ${attribute.def.name}` : `New attribute — ${attribute.def.name}`,
        detail: attribute.def.secret ? attribute.def.blurb : 'Now on your character web',
      });
    }
  });

  if (after.level.level > before.level.level) {
    events.push({
      kind: 'level',
      title: `Level ${after.level.level}`,
      detail: after.level.rank,
    });
  }

  return events;
}
