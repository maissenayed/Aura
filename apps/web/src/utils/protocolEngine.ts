/**
 * The rules of the Hybrid Calisthenics Engine.
 *
 * Everything here is a pure function of the player's save plus the static
 * campaign data — no React, no storage. The page asks one question, `derive`,
 * and renders the answer; `diffEvents` compares two answers to find out what
 * the player just unlocked.
 */

import {
  ARMOR_PIECES,
  ArmorPiece,
  BODYWEIGHT_QUEST,
  BOSSES,
  Boss,
  BossRequirement,
  IRON_STATS,
  IronStat,
  LadderTier,
  QUEST_DAYS,
  QuestDay,
  SKILL_LADDERS,
  ScaledValue,
  SkillLadder,
  StatId,
  StatUnit,
  YEAR_ONE,
} from '../data/protocolData';
import { AttributeStatus, evaluateAttributes } from './attributes';

/* ------------------------------------------------------------------ */
/* Save                                                                */
/* ------------------------------------------------------------------ */

export type EventKind = 'pr' | 'tier' | 'boss' | 'level' | 'mass' | 'iron' | 'day' | 'week' | 'skill' | 'attribute';

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
  stats: Record<StatId, number>;
  /** Running numbers for accessory lifts, keyed by exercise id. */
  loads: Record<string, number>;
  milestones: Record<string, boolean>;
  /** Ticked missions and armor upkeep, keyed by `questKey`. */
  quests: Record<string, boolean>;
  log: LogEntry[];
}

export function createInitialSave(): ProtocolSave {
  const stats = {} as Record<StatId, number>;
  for (const stat of IRON_STATS) stats[stat.id] = stat.baseline;

  return {
    startedAt: null,
    bodyWeightKg: BODYWEIGHT_QUEST.start,
    stats,
    loads: {},
    milestones: {},
    quests: {},
    log: [],
  };
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

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
  return DAY_IDS[fromIsoDate(iso).getDay()];
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

const STAT_BY_ID = new Map<StatId, IronStat>(IRON_STATS.map((stat) => [stat.id, stat]));

export function statById(id: StatId): IronStat {
  return STAT_BY_ID.get(id) as IronStat;
}

/** How far a lift has travelled from its starting number to a gate, 0–1. */
function travel(stat: IronStat, current: number, target: number): number {
  const span = target - stat.baseline;
  if (span <= 0) return current >= target ? 1 : 0;
  return clamp01((current - stat.baseline) / span);
}

export function formatStatValue(value: number, unit: StatUnit): string {
  const rounded = Math.round(value * 10) / 10;
  if (unit === 'reps') return `${rounded} reps`;
  if (unit === 'added-kg') return `+${rounded} kg`;
  return `${rounded} kg`;
}

/**
 * A planche at 75 kg asks more than the same planche at 66 kg, so gates are
 * interpolated between the blueprint's two columns. Outside that window the
 * nearest column is used — the blueprint makes no claim beyond it.
 */
export function scaleValue(value: ScaledValue, bodyWeightKg: number): number {
  const { start, finalBoss } = BODYWEIGHT_QUEST;
  const t = clamp01((bodyWeightKg - start) / (finalBoss - start));
  return Math.round((value.at66 + (value.at75 - value.at66) * t) * 2) / 2;
}

/* ------------------------------------------------------------------ */
/* Bosses                                                              */
/* ------------------------------------------------------------------ */

export interface RequirementStatus {
  requirement: BossRequirement;
  target: number;
  current: number;
  met: boolean;
  ratio: number;
}

export interface BossStatus {
  boss: Boss;
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
  defeated: Set<string>,
): RequirementStatus {
  if (req.kind === 'stat') {
    const stat = statById(req.ref as StatId);
    const current = save.stats[stat.id] ?? stat.baseline;
    const target = req.scaledTarget ? scaleValue(req.scaledTarget, save.bodyWeightKg) : req.target ?? 0;
    return { requirement: req, target, current, met: current >= target, ratio: travel(stat, current, target) };
  }

  const met = req.kind === 'milestone' ? Boolean(save.milestones[req.ref]) : defeated.has(req.ref);
  return { requirement: req, target: 1, current: met ? 1 : 0, met, ratio: met ? 1 : 0 };
}

/**
 * Bosses can chain (the planche needs the handstand push-up down first), so
 * the defeated set is grown pass by pass until it stops changing.
 */
export function evaluateBosses(save: ProtocolSave): BossStatus[] {
  let defeated = new Set<string>();
  for (let pass = 0; pass < BOSSES.length; pass += 1) {
    const next = new Set<string>();
    for (const boss of BOSSES) {
      if (boss.requirements.every((r) => evaluateRequirement(r, save, defeated).met)) next.add(boss.id);
    }
    if (next.size === defeated.size) break;
    defeated = next;
  }

  return BOSSES.map((boss) => {
    const requirements = boss.requirements.map((r) => evaluateRequirement(r, save, defeated));
    const seal = requirements.find((r) => r.requirement.kind === 'boss' && !r.met);
    return {
      boss,
      requirements,
      damage: requirements.reduce((sum, r) => sum + r.ratio, 0) / requirements.length,
      defeated: defeated.has(boss.id),
      sealed: Boolean(seal),
      sealedBy: seal?.requirement.label,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Skill trees                                                         */
/* ------------------------------------------------------------------ */

export interface TierGate {
  stat: IronStat;
  target: number;
  current: number;
  met: boolean;
}

export interface TierStatus {
  tier: LadderTier;
  gates: TierGate[];
  cleared: boolean;
  /** Cleared because the blueprint says so, not because the numbers do. */
  byBlueprint: boolean;
  progress: number;
  /** The rung the player is fighting for right now. */
  isCurrent: boolean;
}

export interface LadderStatus {
  ladder: SkillLadder;
  tiers: TierStatus[];
  clearedCount: number;
}

function evaluateLadder(ladder: SkillLadder, save: ProtocolSave): LadderStatus {
  const tiers: TierStatus[] = ladder.tiers.map((tier) => {
    const gates: TierGate[] = [];

    for (const [id, value] of Object.entries(tier.scaled ?? {})) {
      const stat = statById(id as StatId);
      const target = scaleValue(value as ScaledValue, save.bodyWeightKg);
      const current = save.stats[stat.id] ?? stat.baseline;
      gates.push({ stat, target, current, met: current >= target });
    }
    for (const [id, value] of Object.entries(tier.flat ?? {})) {
      const stat = statById(id as StatId);
      const current = save.stats[stat.id] ?? stat.baseline;
      gates.push({ stat, target: value as number, current, met: current >= (value as number) });
    }

    const earned = gates.length > 0 && gates.every((gate) => gate.met);
    const cleared = earned || Boolean(tier.preCleared);
    const progress = cleared
      ? 1
      : gates.reduce((sum, gate) => sum + travel(gate.stat, gate.current, gate.target), 0) / gates.length;

    return { tier, gates, cleared, byBlueprint: cleared && !earned, progress, isCurrent: false };
  });

  const current = tiers.find((tier) => !tier.cleared);
  if (current) current.isCurrent = true;

  return { ladder, tiers, clearedCount: tiers.filter((tier) => tier.cleared).length };
}

/* ------------------------------------------------------------------ */
/* The mass quest                                                      */
/* ------------------------------------------------------------------ */

/** The roadmap's end-of-week bodyweight: the three month marks, then +0.3 kg a week to 75. */
export function massTargetForWeek(week: number): number {
  const { start, finalBoss, weeklyGainKg, checkpoints } = BODYWEIGHT_QUEST;
  const points = [{ week: 0, kg: start }, ...checkpoints.map((c) => ({ week: c.week, kg: c.targetKg }))];
  const last = points[points.length - 1];

  let kg: number;
  if (week >= last.week) {
    kg = Math.min(finalBoss, last.kg + (week - last.week) * weeklyGainKg);
  } else {
    const upper = points.findIndex((point) => point.week >= week);
    const a = points[Math.max(0, upper - 1)];
    const b = points[upper];
    kg = b.week === a.week ? b.kg : a.kg + ((b.kg - a.kg) * (week - a.week)) / (b.week - a.week);
  }
  return Math.round(kg * 10) / 10;
}

export interface MassStatus {
  current: number;
  gained: number;
  phaseProgress: number;
  finalProgress: number;
  checkpoints: { id: string; label: string; week: number; targetKg: number; cleared: boolean }[];
  phaseBossDown: boolean;
  finalBossDown: boolean;
  /** Where the roadmap wants the scale by the end of this week. */
  weekTargetKg: number;
  /** Kilos short of this week's target. 0 when on or ahead of it. */
  shortKg: number;
  onPace: boolean;
  weeksToFinal: number;
}

function evaluateMass(save: ProtocolSave, week: number): MassStatus {
  const { start, phaseBoss, finalBoss, weeklyGainKg, checkpoints } = BODYWEIGHT_QUEST;
  const current = save.bodyWeightKg;
  const weekTargetKg = massTargetForWeek(week);

  return {
    current,
    gained: Math.round((current - start) * 10) / 10,
    phaseProgress: clamp01((current - start) / (phaseBoss - start)),
    finalProgress: clamp01((current - start) / (finalBoss - start)),
    checkpoints: checkpoints.map((c) => ({ ...c, cleared: current >= c.targetKg })),
    phaseBossDown: current >= phaseBoss,
    finalBossDown: current >= finalBoss,
    weekTargetKg,
    shortKg: Math.max(0, Math.round((weekTargetKg - current) * 10) / 10),
    onPace: current >= massTargetForWeek(week - 1),
    weeksToFinal: Math.max(0, Math.ceil((finalBoss - current) / weeklyGainKg - 1e-9)),
  };
}

/* ------------------------------------------------------------------ */
/* Year 1 Iron Checkpoints                                             */
/* ------------------------------------------------------------------ */

export interface IronCheckpointStatus {
  id: string;
  label: string;
  stat: IronStat;
  target: number;
  current: number;
  met: boolean;
  ratio: number;
}

function evaluateYearOne(save: ProtocolSave): IronCheckpointStatus[] {
  return YEAR_ONE.checkpoints.map((checkpoint) => {
    const stat = statById(checkpoint.statId);
    const current = save.stats[stat.id] ?? stat.baseline;
    return {
      id: checkpoint.id,
      label: checkpoint.label,
      stat,
      target: checkpoint.target,
      current,
      met: current >= checkpoint.target,
      ratio: travel(stat, current, checkpoint.target),
    };
  });
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

/** Every key a perfect week needs ticked. */
function missionIds(day: QuestDay): string[] {
  return day.kind === 'rest' ? [`${day.id}_rest`] : day.exercises.map((exercise) => exercise.id);
}

const ALL_MISSION_IDS = QUEST_DAYS.flatMap(missionIds);

export interface DayStatus {
  day: QuestDay;
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
  armor: { piece: ArmorPiece; forged: boolean }[];
  armorCount: number;
}

function evaluateWeek(save: ProtocolSave, week: number): WeekStatus {
  const days = QUEST_DAYS.map((day) => {
    const ids = missionIds(day);
    const done = ids.filter((id) => save.quests[questKey(week, id)]).length;
    return { day, done, total: ids.length, cleared: done === ids.length };
  });

  const done = days.reduce((sum, day) => sum + day.done, 0);
  const armor = ARMOR_PIECES.map((piece) => ({
    piece,
    forged: Boolean(save.quests[questKey(week, piece.id)]),
  }));

  return {
    week,
    days,
    done,
    total: ALL_MISSION_IDS.length,
    progress: done / ALL_MISSION_IDS.length,
    perfect: done === ALL_MISSION_IDS.length,
    armor,
    armorCount: armor.filter((entry) => entry.forged).length,
  };
}

function countPerfectWeeks(save: ProtocolSave): number {
  let lastWeek = 0;
  for (const key of Object.keys(save.quests)) {
    const match = /^w(\d+)_/.exec(key);
    if (match && save.quests[key]) lastWeek = Math.max(lastWeek, Number(match[1]));
  }

  let perfect = 0;
  for (let week = 1; week <= lastWeek; week += 1) {
    if (ALL_MISSION_IDS.every((id) => save.quests[questKey(week, id)])) perfect += 1;
  }
  return perfect;
}

/* ------------------------------------------------------------------ */
/* Level & XP                                                          */
/* ------------------------------------------------------------------ */

export const XP_RULES = {
  perLevel: 500,
  statMax: 300,
  tier: 400,
  boss: 1500,
  ironCheckpoint: 300,
  massMax: 1500,
  mission: 10,
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
  bosses: BossStatus[],
  ladders: LadderStatus[],
  mass: MassStatus,
  yearOne: IronCheckpointStatus[],
): LevelStatus {
  const strength = IRON_STATS.reduce((sum, stat) => {
    if (stat.endgame === null) return sum;
    return sum + travel(stat, save.stats[stat.id] ?? stat.baseline, stat.endgame) * XP_RULES.statMax;
  }, 0);

  const earnedTiers = ladders.reduce(
    (sum, ladder) => sum + ladder.tiers.filter((tier) => tier.cleared && !tier.byBlueprint).length,
    0,
  );

  let missions = 0;
  let armor = 0;
  for (const [key, ticked] of Object.entries(save.quests)) {
    if (!ticked) continue;
    if (key.includes('_armor_')) armor += 1;
    else missions += 1;
  }
  const perfectWeeks = countPerfectWeeks(save);

  const breakdown = [
    { label: 'Iron strength', xp: Math.round(strength) },
    { label: 'Skill tiers', xp: earnedTiers * XP_RULES.tier },
    { label: 'Bosses', xp: bosses.filter((b) => b.defeated).length * XP_RULES.boss },
    { label: 'Year-1 checkpoints', xp: yearOne.filter((c) => c.met).length * XP_RULES.ironCheckpoint },
    { label: 'Mass gained', xp: Math.round(mass.finalProgress * XP_RULES.massMax) },
    { label: 'Missions', xp: missions * XP_RULES.mission + armor * XP_RULES.armor },
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
/* Acts — the three phases of the campaign                             */
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

function evaluateActs(
  bosses: BossStatus[],
  mass: MassStatus,
  yearOne: IronCheckpointStatus[],
): ActStatus[] {
  const acts: ActStatus[] = [
    {
      id: 'act_1',
      numeral: 'I',
      name: 'The Road to 70',
      tagline: 'Twelve weeks of surplus. Phase 1 boss: 70 kg on the scale.',
      nodes: mass.checkpoints.map((c, index, all) => ({
        id: c.id,
        label: index === all.length - 1 ? 'Phase 1 Boss' : c.label,
        detail: `${c.targetKg.toFixed(1)} kg · week ${c.week}`,
        done: c.cleared,
      })),
      progress: mass.phaseProgress,
      complete: mass.phaseBossDown,
      current: false,
    },
    {
      id: 'act_2',
      numeral: 'II',
      name: 'Year One Iron',
      tagline: `${YEAR_ONE.deadline}. Five lifts, ${YEAR_ONE.repTarget} reps minimum each.`,
      nodes: yearOne.map((c) => ({
        id: c.id,
        label: c.stat.short,
        detail: formatStatValue(c.target, c.stat.unit),
        done: c.met,
      })),
      progress: yearOne.reduce((sum, c) => sum + c.ratio, 0) / yearOne.length,
      complete: yearOne.every((c) => c.met),
      current: false,
    },
    {
      id: 'act_3',
      numeral: 'III',
      name: 'The Final Ascent',
      tagline: '75 kg of lean muscle, and the ten bosses that guard it.',
      nodes: [
        {
          id: 'bw_final',
          label: 'Final Boss',
          detail: `${BODYWEIGHT_QUEST.finalBoss} kg lean`,
          done: mass.finalBossDown,
        },
        ...bosses.map((status) => ({
          id: status.boss.id,
          label: `Boss ${status.boss.order}`,
          detail: status.boss.name.replace(/^(The|One Clean) /, ''),
          done: status.defeated,
        })),
      ],
      progress:
        (mass.finalProgress + bosses.reduce((sum, b) => sum + (b.defeated ? 1 : b.damage), 0)) /
        (bosses.length + 1),
      complete: mass.finalBossDown && bosses.every((b) => b.defeated),
      current: false,
    },
  ];

  const current = acts.find((act) => !act.complete);
  if (current) current.current = true;
  return acts;
}

/* ------------------------------------------------------------------ */
/* Next gates — "what do I chase?"                                     */
/* ------------------------------------------------------------------ */

export interface Gate {
  stat: IronStat;
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
  bosses: BossStatus[],
  ladders: LadderStatus[],
  yearOne: IronCheckpointStatus[],
): Gate[] {
  const best = new Map<StatId, { target: number; unlocks: string }>();

  const consider = (stat: IronStat, target: number, unlocks: string) => {
    if ((save.stats[stat.id] ?? stat.baseline) >= target) return;
    const existing = best.get(stat.id);
    if (!existing || target < existing.target) best.set(stat.id, { target, unlocks });
  };

  for (const ladder of ladders) {
    for (const tier of ladder.tiers) {
      if (tier.cleared) continue;
      for (const gate of tier.gates) consider(gate.stat, gate.target, `${tier.tier.name} · ${ladder.ladder.name}`);
    }
  }
  for (const checkpoint of yearOne) {
    consider(checkpoint.stat, checkpoint.target, 'Year-1 Iron Checkpoint');
  }
  for (const status of bosses) {
    for (const req of status.requirements) {
      if (req.requirement.kind !== 'stat') continue;
      consider(statById(req.requirement.ref as StatId), req.target, `Boss ${status.boss.order} · ${status.boss.name}`);
    }
  }

  return [...best.entries()]
    .map(([id, gate]) => {
      const stat = statById(id);
      const current = save.stats[id] ?? stat.baseline;
      return {
        stat,
        target: gate.target,
        current,
        unlocks: gate.unlocks,
        remaining: Math.round((gate.target - current) * 10) / 10,
        closeness: travel(stat, current, gate.target),
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
  yearOne: IronCheckpointStatus[];
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

export function derive(save: ProtocolSave, clock: Clock): Derived {
  const bosses = evaluateBosses(save);
  const ladders = SKILL_LADDERS.map((ladder) => evaluateLadder(ladder, save));
  const mass = evaluateMass(save, clock.currentWeek);
  const yearOne = evaluateYearOne(save);

  return {
    bosses,
    ladders,
    mass,
    yearOne,
    acts: evaluateActs(bosses, mass, yearOne),
    level: evaluateLevel(save, bosses, ladders, mass, yearOne),
    week: evaluateWeek(save, clock.viewWeek),
    gates: evaluateGates(save, bosses, ladders, yearOne),
    attributes: evaluateAttributes(save, bosses, ladders),
  };
}

/* ------------------------------------------------------------------ */
/* diffEvents — what did that last action unlock?                      */
/* ------------------------------------------------------------------ */

export function diffEvents(before: Derived, after: Derived): GameEvent[] {
  const events: GameEvent[] = [];

  after.ladders.forEach((ladder, l) => {
    ladder.tiers.forEach((tier, t) => {
      if (tier.cleared && !before.ladders[l].tiers[t].cleared) {
        events.push({
          kind: 'tier',
          title: `${tier.tier.rung} cleared — ${tier.tier.name}`,
          detail: ladder.ladder.name,
        });
      }
    });
  });

  after.yearOne.forEach((checkpoint, i) => {
    if (checkpoint.met && !before.yearOne[i].met) {
      events.push({
        kind: 'iron',
        title: `Iron checkpoint — ${checkpoint.stat.short}`,
        detail: `${formatStatValue(checkpoint.target, checkpoint.stat.unit)} · the ${YEAR_ONE.deadline} mark`,
      });
    }
  });

  after.mass.checkpoints.forEach((checkpoint, i) => {
    if (checkpoint.cleared && !before.mass.checkpoints[i].cleared) {
      const isPhaseBoss = checkpoint.targetKg >= BODYWEIGHT_QUEST.phaseBoss;
      events.push({
        kind: 'mass',
        title: isPhaseBoss ? 'Phase 1 Boss down — 70 kg' : `${checkpoint.label} mass checkpoint`,
        detail: `${checkpoint.targetKg.toFixed(1)} kg on the scale`,
      });
    }
  });
  if (after.mass.finalBossDown && !before.mass.finalBossDown) {
    events.push({ kind: 'mass', title: 'Final mass boss down — 75 kg', detail: 'Lean muscle, as planned' });
  }

  after.bosses.forEach((status, i) => {
    if (status.defeated && !before.bosses[i].defeated) {
      events.push({
        kind: 'boss',
        title: `Boss ${status.boss.order} defeated`,
        detail: status.boss.name,
      });
    }
  });

  if (after.week.week === before.week.week) {
    after.week.days.forEach((day, i) => {
      if (day.cleared && !before.week.days[i].cleared) {
        events.push({
          kind: 'day',
          title: `${day.day.day} cleared`,
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
