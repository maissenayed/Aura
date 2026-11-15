/**
 * Character attributes — the spider web on the Character tab.
 *
 * Each attribute is built by specific exercises from the weekly routine and,
 * where one exists, by a lift the athlete logs. Six are visible from day one;
 * the rest stay hidden until a campaign milestone unlocks them.
 *
 * Names follow how calisthenics coaching describes athletic qualities:
 * strength (bent-arm and straight-arm), endurance, core control and
 * compression, balance, explosive power, grip and tendon resilience.
 *
 * Pure functions only. Types are imported type-only, so this module and
 * protocolEngine can depend on each other without a runtime cycle.
 */

import { BODYWEIGHT_QUEST, IRON_STATS, QUEST_DAYS, StatId } from '../data/protocolData';
import type { BossStatus, LadderStatus, ProtocolSave } from './protocolEngine';

export interface AttributeContext {
  save: ProtocolSave;
  bosses: BossStatus[];
  ladders: LadderStatus[];
  /** Missions ticked per exercise id, summed over every week. */
  ticks: Map<string, number>;
  /** Weeks in which all three tendon armor drills were done. */
  fullArmorWeeks: number;
}

export interface AttributeDef {
  id: string;
  name: string;
  /** Short label for the web, where space is tight. */
  short: string;
  blurb: string;
  /** Quest exercise ids that train this attribute. */
  exercises: string[];
  /** Absent: visible from the start. */
  unlock?: { label: string; test: (ctx: AttributeContext) => boolean };
  /** Hidden entirely — not even teased — until unlocked. */
  secret?: boolean;
  /** 0–1. */
  score: (ctx: AttributeContext) => number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** How far a lift has travelled from where the campaign started it to a target, 0–1. */
function travel(save: ProtocolSave, id: StatId, target?: number): number {
  const stat = IRON_STATS.find((entry) => entry.id === id);
  if (!stat) return 0;
  const goal = target ?? stat.endgame;
  if (goal === null || goal === undefined) return 0;
  const current = save.stats[id] ?? stat.baseline;
  const span = goal - stat.baseline;
  return span <= 0 ? (current >= goal ? 1 : 0) : clamp01((current - stat.baseline) / span);
}

/** Training volume: sessions done for these exercises against a target count, 0–1. */
function volume(ctx: AttributeContext, ids: string[], target: number): number {
  const done = ids.reduce((sum, id) => sum + (ctx.ticks.get(id) ?? 0), 0);
  return clamp01(done / target);
}

const avg = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

function ladderProgress(ladders: LadderStatus[], id: string): number {
  const ladder = ladders.find((entry) => entry.ladder.id === id);
  if (!ladder) return 0;
  // Tiers the blueprint pre-clears are where the athlete started, not something they earned.
  const earnable = ladder.tiers.filter((tier) => !tier.byBlueprint);
  if (earnable.length === 0) return 0;
  const cleared = earnable.filter((tier) => tier.cleared).length;
  const partial = earnable.find((tier) => tier.isCurrent)?.progress ?? 0;
  return clamp01((cleared + partial) / earnable.length);
}

const tierCleared = (ladders: LadderStatus[], tierId: string) =>
  ladders.some((ladder) => ladder.tiers.some((tier) => tier.tier.id === tierId && tier.cleared && !tier.byBlueprint));

export const ATTRIBUTES: AttributeDef[] = [
  /* ---------------- visible from the start ---------------- */
  {
    id: 'push',
    name: 'Push Strength',
    short: 'Push',
    blurb: 'Bent-arm pressing power through chest, shoulders and triceps.',
    exercises: ['thu_dips', 'thu_bench', 'sun_press', 'thu_pushdown', 'sun_lateral', 'sun_overhead'],
    score: (ctx) =>
      0.75 * avg(travel(ctx.save, 'dips'), travel(ctx.save, 'inclineBench'), travel(ctx.save, 'dbPress')) +
      0.25 * volume(ctx, ['thu_dips', 'thu_bench', 'sun_press', 'thu_pushdown', 'sun_lateral', 'sun_overhead'], 72),
  },
  {
    id: 'pull',
    name: 'Pull Strength',
    short: 'Pull',
    blurb: 'Bent-arm pulling power through lats, upper back and biceps.',
    exercises: ['tue_chin', 'tue_row', 'tue_pecdeck', 'tue_curl', 'sun_hammer'],
    score: (ctx) =>
      0.75 * avg(travel(ctx.save, 'chinUps'), travel(ctx.save, 'cableRow')) +
      0.25 * volume(ctx, ['tue_chin', 'tue_row', 'tue_pecdeck', 'tue_curl', 'sun_hammer'], 60),
  },
  {
    id: 'legs',
    name: 'Leg Strength',
    short: 'Legs',
    blurb: 'Single-leg strength and hamstring power — the road to pistols and Nordics.',
    exercises: ['mon_split', 'mon_legcurl'],
    score: (ctx) =>
      0.55 * travel(ctx.save, 'splitSquat') +
      0.15 * (ctx.save.milestones.ms_legcurl_stack ? 1 : 0) +
      0.3 * volume(ctx, ['mon_split', 'mon_legcurl'], 24),
  },
  {
    id: 'core',
    name: 'Core Control',
    short: 'Core',
    blurb: 'Holding the trunk rigid against gravity and leverage.',
    exercises: ['mon_dragon', 'mon_ttb', 'mon_abwheel'],
    score: (ctx) =>
      0.3 * (ctx.save.milestones.ms_dragonflag ? 1 : 0) + 0.7 * volume(ctx, ['mon_dragon', 'mon_ttb', 'mon_abwheel'], 36),
  },
  {
    id: 'endurance',
    name: 'Muscular Endurance',
    short: 'Endurance',
    blurb: 'Reps on reps: how long the engine runs before it stalls.',
    exercises: ['tue_pullups', 'sat_pullups', 'thu_pushups', 'wed_feeder', 'wed_pushdown'],
    score: (ctx) =>
      0.7 * avg(travel(ctx.save, 'pullUpReps'), travel(ctx.save, 'pushUpReps')) +
      0.3 * volume(ctx, ['tue_pullups', 'sat_pullups', 'thu_pushups', 'wed_feeder', 'wed_pushdown'], 50),
  },
  {
    id: 'mass',
    name: 'Lean Mass',
    short: 'Mass',
    blurb: `Bodyweight built toward the ${BODYWEIGHT_QUEST.finalBoss} kg final boss.`,
    exercises: [],
    score: (ctx) =>
      clamp01((ctx.save.bodyWeightKg - BODYWEIGHT_QUEST.start) / (BODYWEIGHT_QUEST.finalBoss - BODYWEIGHT_QUEST.start)),
  },

  /* ---------------- unlocked by milestones ---------------- */
  {
    id: 'straight',
    name: 'Straight-Arm Strength',
    short: 'Straight-Arm',
    blurb: 'Force through a locked elbow — what planche and front lever are made of.',
    exercises: ['tue_row', 'thu_dips', 'thu_bench'],
    unlock: {
      label: 'Clear Front Lever Phase 1 or Advanced Tuck Planche',
      test: (ctx) => tierCleared(ctx.ladders, 'lever_1') || tierCleared(ctx.ladders, 'planche_2'),
    },
    score: (ctx) => avg(ladderProgress(ctx.ladders, 'planche'), ladderProgress(ctx.ladders, 'frontlever')),
  },
  {
    id: 'compression',
    name: 'Compression',
    short: 'Compression',
    blurb: 'Pulling the legs to the chest — the engine behind L-sits, pikes and the manna.',
    exercises: ['sun_lsit', 'mon_ttb'],
    unlock: {
      label: 'Complete 6 L-Sit Hold sessions',
      test: (ctx) => (ctx.ticks.get('sun_lsit') ?? 0) >= 6,
    },
    score: (ctx) => 0.6 * volume(ctx, ['sun_lsit'], 24) + 0.4 * volume(ctx, ['mon_ttb'], 24),
  },
  {
    id: 'balance',
    name: 'Balance',
    short: 'Balance',
    blurb: 'Control while inverted — owning the stack in a handstand.',
    exercises: ['sun_press'],
    unlock: {
      label: 'Clear the Year-One Press on the Handstand Tree',
      test: (ctx) => tierCleared(ctx.ladders, 'hs_1'),
    },
    score: (ctx) => ladderProgress(ctx.ladders, 'handstand'),
  },
  {
    id: 'grip',
    name: 'Grip',
    short: 'Grip',
    blurb: 'Hands and forearms that hold on when everything else is tired.',
    exercises: ['sat_boulder', 'sat_wrist', 'tue_chin'],
    unlock: {
      label: 'Log 4 bouldering sessions',
      test: (ctx) => (ctx.ticks.get('sat_boulder') ?? 0) >= 4,
    },
    score: (ctx) => 0.5 * volume(ctx, ['sat_boulder'], 24) + 0.2 * volume(ctx, ['sat_wrist'], 24) + 0.3 * travel(ctx.save, 'chinUps'),
  },
  {
    id: 'tendon',
    name: 'Tendon Resilience',
    short: 'Tendons',
    blurb: 'Connective tissue that keeps up with the muscle — it adapts ten times slower.',
    exercises: ['wed_feeder', 'wed_pushdown', 'sat_wrist'],
    unlock: {
      label: 'Forge all three armor pieces in one week',
      test: (ctx) => ctx.fullArmorWeeks >= 1,
    },
    score: (ctx) => 0.6 * clamp01(ctx.fullArmorWeeks / 12) + 0.4 * volume(ctx, ['wed_feeder', 'wed_pushdown'], 24),
  },
  {
    id: 'power',
    name: 'Explosive Power',
    short: 'Power',
    blurb: 'Speed through the pull — what turns a pull-up into a muscle-up.',
    exercises: ['tue_pullups', 'sat_pullups', 'tue_chin', 'thu_dips'],
    unlock: {
      label: 'Hit 10 strict pull-ups',
      test: (ctx) => (ctx.save.stats.pullUpReps ?? 0) >= 10,
    },
    score: (ctx) =>
      0.4 * travel(ctx.save, 'pullUpReps') + 0.3 * travel(ctx.save, 'chinUps', 20) + 0.3 * travel(ctx.save, 'dips', 30),
  },

  /* ---------------- the one easter egg ---------------- */
  {
    id: 'aura',
    name: 'Aura',
    short: 'Aura',
    blurb: 'Cannot be measured. Cannot be trained directly. Everyone in the gym can feel it.',
    exercises: [],
    secret: true,
    unlock: {
      label: 'Defeat a final boss',
      test: (ctx) => ctx.bosses.some((boss) => boss.defeated),
    },
    score: (ctx) => clamp01(0.4 + 0.06 * ctx.bosses.filter((boss) => boss.defeated).length),
  },
];

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export interface AttributeStatus {
  def: AttributeDef;
  unlocked: boolean;
  /** 0–100. */
  value: number;
  /** Names of the exercises that build it, from the weekly routine. */
  builtBy: string[];
  sessions: number;
}

const EXERCISE_NAMES = new Map(QUEST_DAYS.flatMap((day) => day.exercises.map((exercise) => [exercise.id, exercise.name] as const)));
const ARMOR_IDS = ['armor_elbows', 'armor_wrists', 'armor_shoulders'];

/** Missions ticked per exercise id, and weeks with every armor drill done. */
export function tally(save: ProtocolSave): { ticks: Map<string, number>; fullArmorWeeks: number } {
  const ticks = new Map<string, number>();
  const armorByWeek = new Map<number, number>();

  for (const [key, done] of Object.entries(save.quests)) {
    if (!done) continue;
    const match = /^w(\d+)_(.+)$/.exec(key);
    if (!match) continue;
    const id = match[2];
    if (ARMOR_IDS.includes(id)) {
      const week = Number(match[1]);
      armorByWeek.set(week, (armorByWeek.get(week) ?? 0) + 1);
    } else {
      ticks.set(id, (ticks.get(id) ?? 0) + 1);
    }
  }

  const fullArmorWeeks = [...armorByWeek.values()].filter((count) => count >= ARMOR_IDS.length).length;
  return { ticks, fullArmorWeeks };
}

export function evaluateAttributes(
  save: ProtocolSave,
  bosses: BossStatus[],
  ladders: LadderStatus[],
): AttributeStatus[] {
  const { ticks, fullArmorWeeks } = tally(save);
  const ctx: AttributeContext = { save, bosses, ladders, ticks, fullArmorWeeks };

  return ATTRIBUTES.map((def) => ({
    def,
    unlocked: !def.unlock || def.unlock.test(ctx),
    value: Math.round(clamp01(def.score(ctx)) * 100),
    builtBy: def.exercises.map((id) => EXERCISE_NAMES.get(id)).filter((name): name is string => Boolean(name)),
    sessions: def.exercises.reduce((sum, id) => sum + (ticks.get(id) ?? 0), 0),
  }));
}
