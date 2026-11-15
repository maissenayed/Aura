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
  /** What to log so this attribute can be measured. */
  measure: string;
  /** 0–1, or null while nothing it is built from has been logged. */
  score: (ctx: AttributeContext) => number | null;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * A lift's current number as a share of a target, 0–1 — read straight from
 * the account's stats, so an athlete who already rows 60 kg starts with real
 * pull strength. Null when the lift has never been logged.
 */
function level(save: ProtocolSave, id: StatId, target?: number): number | null {
  const stat = IRON_STATS.find((entry) => entry.id === id);
  if (!stat) return null;
  const goal = target ?? stat.endgame;
  if (!goal) return null;
  const current = save.stats[id] ?? stat.baseline;
  if (!stat.hasBaseline && current === 0) return null;
  return clamp01(current / goal);
}

/** Sessions done for these exercises against a target count, 0–1. Null before the first session. */
function volume(ctx: AttributeContext, ids: string[], target: number): number | null {
  const done = ids.reduce((sum, id) => sum + (ctx.ticks.get(id) ?? 0), 0);
  return done === 0 ? null : clamp01(done / target);
}

const claimed = (flag: boolean | undefined) => (flag ? 1 : null);

/**
 * Weighted average of whatever has been measured. Parts with no data yet are
 * left out rather than counted as zero, so logging one lift never makes an
 * attribute look worse. Null when nothing is measured.
 */
function blend(...parts: [number | null, number][]): number | null {
  const known = parts.filter((part): part is [number, number] => part[0] !== null);
  if (known.length === 0) return null;
  const weight = known.reduce((sum, [, w]) => sum + w, 0);
  return known.reduce((sum, [value, w]) => sum + value * w, 0) / weight;
}

const tierCleared = (ladders: LadderStatus[], tierId: string) =>
  ladders.some((ladder) => ladder.tiers.some((tier) => tier.tier.id === tierId && tier.cleared && !tier.byBlueprint));

export const ATTRIBUTES: AttributeDef[] = [
  /* ---------------- visible from the start ---------------- */
  {
    id: 'push',
    name: 'Push Strength',
    short: 'Push',
    blurb: 'Bent-arm pressing power through chest, shoulders and triceps — measured against the full-planche numbers.',
    measure: 'Log your weighted dips, incline bench or DB press.',
    exercises: ['thu_dips', 'thu_bench', 'sun_press', 'thu_pushdown', 'sun_lateral', 'sun_overhead'],
    score: (ctx) => blend([level(ctx.save, 'dips'), 1], [level(ctx.save, 'inclineBench'), 1], [level(ctx.save, 'dbPress'), 1]),
  },
  {
    id: 'pull',
    name: 'Pull Strength',
    short: 'Pull',
    blurb: 'Bent-arm pulling power through lats, upper back and biceps — measured against the one-arm pull-up and 100 kg row.',
    measure: 'Log your weighted chin-ups or cable row.',
    exercises: ['tue_chin', 'tue_row', 'tue_pecdeck', 'tue_curl', 'sun_hammer'],
    score: (ctx) => blend([level(ctx.save, 'chinUps'), 1], [level(ctx.save, 'cableRow'), 1]),
  },
  {
    id: 'legs',
    name: 'Leg Strength',
    short: 'Legs',
    blurb: 'Single-leg strength and hamstring power — the road to pistols and Nordics.',
    measure: 'Log your Bulgarian split squat weight.',
    exercises: ['mon_split', 'mon_legcurl'],
    score: (ctx) => blend([level(ctx.save, 'splitSquat'), 0.85], [claimed(ctx.save.milestones.ms_legcurl_stack), 0.15]),
  },
  {
    id: 'core',
    name: 'Core Control',
    short: 'Core',
    blurb: 'Holding the trunk rigid against gravity and leverage.',
    measure: 'Tick your Monday core missions.',
    exercises: ['mon_dragon', 'mon_ttb', 'mon_abwheel'],
    score: (ctx) =>
      blend([volume(ctx, ['mon_dragon', 'mon_ttb', 'mon_abwheel'], 36), 0.7], [claimed(ctx.save.milestones.ms_dragonflag), 0.3]),
  },
  {
    id: 'endurance',
    name: 'Muscular Endurance',
    short: 'Endurance',
    blurb: 'Reps on reps: how long the engine runs before it stalls — against 15 pull-ups and 70 push-ups.',
    measure: 'Log your max pull-ups or push-ups.',
    exercises: ['tue_pullups', 'sat_pullups', 'thu_pushups', 'wed_feeder', 'wed_pushdown'],
    score: (ctx) => blend([level(ctx.save, 'pullUpReps'), 1], [level(ctx.save, 'pushUpReps'), 1]),
  },
  {
    id: 'mass',
    name: 'Lean Mass',
    short: 'Mass',
    blurb: `Your bodyweight as a share of the ${BODYWEIGHT_QUEST.finalBoss} kg final boss.`,
    measure: 'Weigh in on the Campaign tab.',
    exercises: [],
    score: (ctx) => clamp01(ctx.save.bodyWeightKg / BODYWEIGHT_QUEST.finalBoss),
  },

  /* ---------------- unlocked by milestones ---------------- */
  {
    id: 'straight',
    name: 'Straight-Arm Strength',
    short: 'Straight-Arm',
    blurb: 'Force through a locked elbow — what planche and front lever are made of.',
    measure: 'Log your dips, incline bench, DB press and cable row.',
    exercises: ['tue_row', 'thu_dips', 'thu_bench'],
    unlock: {
      label: 'Clear Front Lever Phase 1 or Advanced Tuck Planche',
      test: (ctx) => tierCleared(ctx.ladders, 'lever_1') || tierCleared(ctx.ladders, 'planche_2'),
    },
    score: (ctx) =>
      blend(
        [level(ctx.save, 'dips'), 1],
        [level(ctx.save, 'inclineBench'), 1],
        [level(ctx.save, 'dbPress'), 1],
        [level(ctx.save, 'cableRow'), 1.5],
      ),
  },
  {
    id: 'compression',
    name: 'Compression',
    short: 'Compression',
    blurb: 'Pulling the legs to the chest — the engine behind L-sits, pikes and the manna.',
    measure: 'Tick your L-sit holds and toes-to-bar.',
    exercises: ['sun_lsit', 'mon_ttb'],
    unlock: {
      label: 'Complete 6 L-Sit Hold sessions',
      test: (ctx) => (ctx.ticks.get('sun_lsit') ?? 0) >= 6,
    },
    score: (ctx) => blend([volume(ctx, ['sun_lsit'], 24), 0.6], [volume(ctx, ['mon_ttb'], 24), 0.4]),
  },
  {
    id: 'balance',
    name: 'Balance',
    short: 'Balance',
    blurb: 'Control while inverted — measured by how close your press is to 1.0x bodyweight overhead.',
    measure: 'Log your seated DB press.',
    exercises: ['sun_press'],
    unlock: {
      label: 'Clear the Year-One Press on the Handstand Tree',
      test: (ctx) => tierCleared(ctx.ladders, 'hs_1'),
    },
    score: (ctx) => level(ctx.save, 'dbPress', 32),
  },
  {
    id: 'grip',
    name: 'Grip',
    short: 'Grip',
    blurb: 'Hands and forearms that hold on when everything else is tired.',
    measure: 'Tick bouldering and wrist curls, or log your chin-ups.',
    exercises: ['sat_boulder', 'sat_wrist', 'tue_chin'],
    unlock: {
      label: 'Log 4 bouldering sessions',
      test: (ctx) => (ctx.ticks.get('sat_boulder') ?? 0) >= 4,
    },
    score: (ctx) =>
      blend([volume(ctx, ['sat_boulder'], 24), 0.5], [volume(ctx, ['sat_wrist'], 24), 0.2], [level(ctx.save, 'chinUps'), 0.3]),
  },
  {
    id: 'tendon',
    name: 'Tendon Resilience',
    short: 'Tendons',
    blurb: 'Connective tissue that keeps up with the muscle — it adapts ten times slower.',
    measure: 'Forge your weekly armor and do the recovery missions.',
    exercises: ['wed_feeder', 'wed_pushdown', 'sat_wrist'],
    unlock: {
      label: 'Forge all three armor pieces in one week',
      test: (ctx) => ctx.fullArmorWeeks >= 1,
    },
    score: (ctx) =>
      blend(
        [ctx.fullArmorWeeks > 0 ? clamp01(ctx.fullArmorWeeks / 12) : null, 0.6],
        [volume(ctx, ['wed_feeder', 'wed_pushdown'], 24), 0.4],
      ),
  },
  {
    id: 'power',
    name: 'Explosive Power',
    short: 'Power',
    blurb: 'Speed through the pull — what turns a pull-up into a muscle-up.',
    measure: 'Log your pull-ups, chin-ups and dips.',
    exercises: ['tue_pullups', 'sat_pullups', 'tue_chin', 'thu_dips'],
    unlock: {
      label: 'Hit 10 strict pull-ups',
      test: (ctx) => (ctx.save.stats.pullUpReps ?? 0) >= 10,
    },
    score: (ctx) =>
      blend([level(ctx.save, 'pullUpReps'), 0.4], [level(ctx.save, 'chinUps', 20), 0.3], [level(ctx.save, 'dips', 30), 0.3]),
  },

  /* ---------------- the one easter egg ---------------- */
  {
    id: 'aura',
    name: 'Aura',
    short: 'Aura',
    blurb: 'Cannot be measured. Cannot be trained directly. Everyone in the gym can feel it.',
    measure: '',
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
  /** 0–100, or null while it cannot be measured yet. */
  value: number | null;
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

  return ATTRIBUTES.map((def) => {
    const score = def.score(ctx);
    return {
      def,
      unlocked: !def.unlock || def.unlock.test(ctx),
      value: score === null ? null : Math.round(clamp01(score) * 100),
      builtBy: def.exercises.map((id) => EXERCISE_NAMES.get(id)).filter((name): name is string => Boolean(name)),
      sessions: def.exercises.reduce((sum, id) => sum + (ticks.get(id) ?? 0), 0),
    };
  });
}
