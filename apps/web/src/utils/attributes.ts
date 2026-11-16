/**
 * Character attributes — the spider web on the Character tab.
 *
 * Each exercise in the plan can be tagged with the attributes it builds.
 * Strength attributes read the lifts those exercises log (the current number
 * against its end-game target); conditioning attributes count how often those
 * exercises are ticked. Six attributes are visible from day one; the rest stay
 * hidden until a milestone unlocks them.
 *
 * Names follow how calisthenics coaching describes athletic qualities:
 * strength (bent-arm and straight-arm), endurance, core control and
 * compression, balance, explosive power, grip and tendon resilience.
 *
 * Every attribute is scored out of ATTRIBUTE_MAX (999), and each one carries
 * the parts it was built from and the sum that produced it, so the Character
 * tab can show exactly how a number was reached.
 *
 * Pure functions only. Engine types are imported type-only, so this module and
 * protocolEngine can depend on each other without a runtime cycle.
 */

import { formatStatValue } from './campaignPlan';
import type { CampaignPlan, PlanExercise, TrainableAttribute } from './campaignPlan';
import type { BossStatus, LadderStatus, ProtocolSave } from './protocolEngine';

export interface AttributeContext {
  save: ProtocolSave;
  plan: CampaignPlan;
  bosses: BossStatus[];
  ladders: LadderStatus[];
  /** Missions ticked per exercise id, summed over every week. */
  ticks: Map<string, number>;
  /** Weeks in which every tendon armor piece was forged. */
  fullArmorWeeks: number;
}

export type AttributeId = TrainableAttribute | 'mass' | 'aura';

export interface AttributeDef {
  id: AttributeId;
  name: string;
  /** Short label for the web, where space is tight. */
  short: string;
  blurb: string;
  /**
   * strength: read from the lifts its exercises log, falling back to sessions.
   * conditioning: counted in sessions, falling back to lifts.
   */
  kind: 'strength' | 'conditioning' | 'mass' | 'aura';
  /** Absent: visible from the start. */
  unlock?: { label: (ctx: AttributeContext) => string; test: (ctx: AttributeContext) => boolean };
  /** Hidden entirely — not even teased — until unlocked. */
  secret?: boolean;
}

/** Sessions of each tagged exercise that max out a conditioning attribute — about three months of weekly work. */
const SESSIONS_PER_EXERCISE = 12;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* ------------------------------------------------------------------ */
/* Scoring helpers                                                     */
/* ------------------------------------------------------------------ */

/** Exercises in the plan tagged as building this attribute. */
function tagged(ctx: AttributeContext, id: TrainableAttribute): PlanExercise[] {
  return ctx.plan.days.flatMap((day) => day.exercises.filter((exercise) => exercise.trains?.includes(id)));
}

/** The plan lifts these exercises log, each once. */
function liftsOf(ctx: AttributeContext, exercises: PlanExercise[]) {
  const ids = [...new Set(exercises.map((exercise) => exercise.lift).filter((id): id is string => Boolean(id)))];
  return ids.map((id) => ctx.plan.lifts.find((lift) => lift.id === id)).filter((lift) => lift !== undefined);
}

/** The top of every axis on the web. */
export const ATTRIBUTE_MAX = 999;

/** One thing an attribute is built from, as shown in its breakdown. */
export interface AttributePart {
  label: string;
  /** "+10 kg of +60 kg end-game", "4 of 12 sessions". */
  detail: string;
  /** 0–1, or null when it is left out of the score. */
  share: number | null;
}

interface Assessment {
  /** 0–1, or null when nothing it is built from has been measured. */
  score: number | null;
  parts: AttributePart[];
  /** The sum, up to the 0–1 score: "(16.7% + 39.1% + 36.8%) ÷ 3 = 30.9%". */
  sum: string;
}

/** "30.9%", "60%". */
const pct = (n: number) => `${(Math.round(n * 1000) / 10).toString()}%`;

/**
 * Each lift's current number against its end-game target, read straight from
 * the account's stats, averaged. Lifts never logged (or with no target) are
 * left out rather than counted as zero.
 */
function liftAssessment(ctx: AttributeContext, exercises: PlanExercise[]): Assessment | null {
  const lifts = liftsOf(ctx, exercises);
  if (lifts.length === 0) return null;
  const parts: AttributePart[] = lifts.map((lift) => {
    const current = ctx.save.records?.[lift.id] ?? ctx.save.stats[lift.id] ?? lift.baseline;
    if (!lift.endgame) return { label: lift.name, detail: 'No end-game number — not counted', share: null };
    if (!lift.hasBaseline && current === 0) return { label: lift.name, detail: 'Not logged yet — left out until you log it', share: null };
    return {
      label: lift.name,
      detail: `${formatStatValue(current, lift.unit)} of ${formatStatValue(lift.endgame, lift.unit)} end-game`,
      share: clamp01(current / lift.endgame),
    };
  });
  const shares = parts.flatMap((part) => (part.share === null ? [] : [part.share]));
  if (shares.length === 0) return { score: null, parts, sum: '' };
  const score = shares.reduce((sum, share) => sum + share, 0) / shares.length;
  const sum = shares.length === 1 ? `${pct(score)} of the end-game` : `(${shares.map(pct).join(' + ')}) ÷ ${shares.length} = ${pct(score)}`;
  return { score, parts, sum };
}

/** Sessions ticked of each exercise, each counting up to SESSIONS_PER_EXERCISE. */
function sessionAssessment(ctx: AttributeContext, exercises: PlanExercise[]): Assessment | null {
  if (exercises.length === 0) return null;
  const counted = exercises.map((exercise) => Math.min(SESSIONS_PER_EXERCISE, ctx.ticks.get(exercise.id) ?? 0));
  const parts: AttributePart[] = exercises.map((exercise, index) => ({
    label: exercise.name,
    detail: `${ctx.ticks.get(exercise.id) ?? 0} of ${SESSIONS_PER_EXERCISE} sessions`,
    share: counted[index] / SESSIONS_PER_EXERCISE,
  }));
  const done = counted.reduce((sum, n) => sum + n, 0);
  if (done === 0) return { score: null, parts, sum: '' };
  const target = SESSIONS_PER_EXERCISE * exercises.length;
  const score = done / target;
  return { score, parts, sum: `${done} of ${target} sessions (${SESSIONS_PER_EXERCISE} for each of ${exercises.length}) = ${pct(score)}` };
}

const sessionsOf = (ctx: AttributeContext, exercises: PlanExercise[]) =>
  exercises.reduce((sum, exercise) => sum + (ctx.ticks.get(exercise.id) ?? 0), 0);

/** "A, B or C" — at most three names, then a count. */
function orList(names: string[]): string {
  const unique = [...new Set(names)];
  if (unique.length <= 1) return unique[0] ?? '';
  if (unique.length <= 3) return `${unique.slice(0, -1).join(', ')} or ${unique[unique.length - 1]}`;
  return `${unique.slice(0, 3).join(', ')} or ${unique.length - 3} more`;
}

const earnedTiers = (ctx: AttributeContext) =>
  ctx.ladders.reduce((sum, ladder) => sum + ladder.tiers.filter((tier) => tier.cleared && !tier.byBlueprint).length, 0);

function sessionsUnlock(id: TrainableAttribute, name: string, count: number): AttributeDef['unlock'] {
  return {
    label: (ctx) => {
      const names = tagged(ctx, id).map((exercise) => exercise.name);
      return names.length
        ? `Complete ${count} sessions of ${orList(names)}`
        : `Tag an exercise with ${name} in your plan, then complete ${count} sessions`;
    },
    test: (ctx) => sessionsOf(ctx, tagged(ctx, id)) >= count,
  };
}

/* ------------------------------------------------------------------ */
/* The attributes                                                      */
/* ------------------------------------------------------------------ */

export const ATTRIBUTES: AttributeDef[] = [
  /* ---------------- visible from the start ---------------- */
  {
    id: 'push',
    name: 'Push Strength',
    short: 'Push',
    kind: 'strength',
    blurb: 'Bent-arm pressing power through chest, shoulders and triceps — your pressing lifts against their end-game numbers.',
  },
  {
    id: 'pull',
    name: 'Pull Strength',
    short: 'Pull',
    kind: 'strength',
    blurb: 'Bent-arm pulling power through lats, upper back and biceps — your pulling lifts against their end-game numbers.',
  },
  {
    id: 'legs',
    name: 'Leg Strength',
    short: 'Legs',
    kind: 'strength',
    blurb: 'Single-leg strength and hamstring power — the road to pistols and Nordics.',
  },
  {
    id: 'core',
    name: 'Core Control',
    short: 'Core',
    kind: 'conditioning',
    blurb: 'Holding the trunk rigid against gravity and leverage, built session by session.',
  },
  {
    id: 'endurance',
    name: 'Muscular Endurance',
    short: 'Endurance',
    kind: 'strength',
    blurb: 'Reps on reps: how long the engine runs before it stalls.',
  },
  {
    id: 'mass',
    name: 'Lean Mass',
    short: 'Mass',
    kind: 'mass',
    blurb: 'Your bodyweight against the goal weight in your plan.',
  },

  /* ---------------- unlocked by milestones ---------------- */
  {
    id: 'straight',
    name: 'Straight-Arm Strength',
    short: 'Straight-Arm',
    kind: 'strength',
    blurb: 'Force through a locked elbow — what planche and front lever are made of.',
    unlock: { label: () => 'Earn your first skill-tree tier', test: (ctx) => earnedTiers(ctx) >= 1 },
  },
  {
    id: 'compression',
    name: 'Compression',
    short: 'Compression',
    kind: 'conditioning',
    blurb: 'Pulling the legs to the chest — the engine behind L-sits, pikes and the manna.',
    unlock: sessionsUnlock('compression', 'Compression', 6),
  },
  {
    id: 'balance',
    name: 'Balance',
    short: 'Balance',
    kind: 'strength',
    blurb: 'Control while inverted — the pressing strength that holds a handstand up.',
    unlock: { label: () => 'Earn two skill-tree tiers', test: (ctx) => earnedTiers(ctx) >= 2 },
  },
  {
    id: 'grip',
    name: 'Grip',
    short: 'Grip',
    kind: 'conditioning',
    blurb: 'Hands and forearms that hold on when everything else is tired.',
    unlock: sessionsUnlock('grip', 'Grip', 4),
  },
  {
    id: 'tendon',
    name: 'Tendon Resilience',
    short: 'Tendons',
    kind: 'conditioning',
    blurb: 'Connective tissue that keeps up with the muscle — it adapts ten times slower.',
    unlock: {
      label: (ctx) => (ctx.plan.armor.length ? 'Forge every armor piece in one week' : 'Add tendon armor to your plan, then forge it all in one week'),
      test: (ctx) => ctx.fullArmorWeeks >= 1,
    },
  },
  {
    id: 'power',
    name: 'Explosive Power',
    short: 'Power',
    kind: 'strength',
    blurb: 'Speed through the pull — what turns a pull-up into a muscle-up.',
    unlock: {
      label: (ctx) => {
        const names = liftsOf(ctx, tagged(ctx, 'power')).filter((lift) => lift.endgame).map((lift) => lift.short);
        return names.length
          ? `Get ${orList(names)} two-thirds of the way to its end-game number`
          : 'Tag a lift with Power in your plan, then get it two-thirds of the way to its end-game number';
      },
      test: (ctx) =>
        liftsOf(ctx, tagged(ctx, 'power')).some(
          (lift) => lift.endgame !== null && (ctx.save.records?.[lift.id] ?? ctx.save.stats[lift.id] ?? lift.baseline) >= (lift.endgame * 2) / 3,
        ),
    },
  },

  /* ---------------- the one easter egg ---------------- */
  {
    id: 'aura',
    name: 'Aura',
    short: 'Aura',
    kind: 'aura',
    blurb: 'Cannot be measured. Cannot be trained directly. Everyone in the gym can feel it.',
    secret: true,
    unlock: { label: () => 'Defeat a final boss', test: (ctx) => ctx.bosses.some((boss) => boss.defeated) },
  },
];

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export interface AttributeStatus {
  def: AttributeDef;
  unlocked: boolean;
  /** What unlocks it, in words. Empty for attributes visible from the start. */
  unlockLabel: string;
  /** 0–ATTRIBUTE_MAX (999), or null while it cannot be measured yet. */
  value: number | null;
  /** What the score is built from. */
  parts: AttributePart[];
  /** How the parts became the number: "(16.7% + 39.1% + 36.8%) ÷ 3 = 30.9% × 999 = 308". Empty until measured. */
  formula: string;
  /** Shown instead of the score where a real unit reads better, e.g. "66 kg". */
  display: string | null;
  /** A line explaining the number, e.g. "88% of your 75 kg goal". */
  explain: string;
  /** What to log or tick so it can be measured. */
  measure: string;
  /** Names of the exercises that build it. */
  builtBy: string[];
  sessions: number;
}

/** Missions ticked per exercise id, and weeks with every armor piece forged. */
export function tally(save: ProtocolSave, plan: CampaignPlan): { ticks: Map<string, number>; fullArmorWeeks: number } {
  const ticks = new Map<string, number>();
  const armorIds = new Set(plan.armor.map((piece) => piece.id));
  const armorByWeek = new Map<number, number>();

  for (const [key, done] of Object.entries(save.quests)) {
    if (!done) continue;
    const match = /^w(\d+)_(.+)$/.exec(key);
    if (!match) continue;
    const id = match[2];
    if (armorIds.has(id)) {
      const week = Number(match[1]);
      armorByWeek.set(week, (armorByWeek.get(week) ?? 0) + 1);
    } else {
      ticks.set(id, (ticks.get(id) ?? 0) + 1);
    }
  }

  const fullArmorWeeks = armorIds.size ? [...armorByWeek.values()].filter((count) => count >= armorIds.size).length : 0;
  return { ticks, fullArmorWeeks };
}

function assess(def: AttributeDef, ctx: AttributeContext, exercises: PlanExercise[]): Assessment {
  const empty: Assessment = { score: null, parts: [], sum: '' };
  switch (def.kind) {
    case 'mass': {
      const { start, goal } = ctx.plan.bodyweight;
      const current = Math.round(ctx.save.bodyWeightKg * 10) / 10;
      const gaining = goal >= start;
      const score = gaining ? clamp01(current / goal) : clamp01(goal / current);
      return {
        score,
        parts: [{ label: 'Bodyweight', detail: `${current} kg against your ${goal} kg goal`, share: score }],
        sum: gaining ? `${current} kg ÷ ${goal} kg = ${pct(score)}` : `${goal} kg goal ÷ ${current} kg = ${pct(score)}`,
      };
    }
    case 'aura': {
      const defeated = ctx.bosses.filter((boss) => boss.defeated).length;
      const score = clamp01(0.4 + 0.06 * defeated);
      return {
        score,
        parts: [{ label: 'Bosses defeated', detail: String(defeated), share: null }],
        sum: `40% + 6% × ${defeated} boss${defeated === 1 ? '' : 'es'} defeated = ${pct(score)}`,
      };
    }
    case 'strength': {
      const lifts = liftAssessment(ctx, exercises);
      const sessions = sessionAssessment(ctx, exercises);
      if (lifts?.score != null) return lifts;
      if (sessions?.score != null) return sessions;
      return lifts ?? sessions ?? empty;
    }
    case 'conditioning': {
      const sessions = sessionAssessment(ctx, exercises);
      const lifts = liftAssessment(ctx, exercises);
      if (def.id !== 'tendon') {
        if (sessions?.score != null) return sessions;
        if (lifts?.score != null) return lifts;
        return sessions ?? lifts ?? empty;
      }
      // Tendons also count whole weeks with every armor piece forged.
      const armor = ctx.plan.armor.length ? clamp01(ctx.fullArmorWeeks / 12) : null;
      const armorPart: AttributePart[] =
        armor === null ? [] : [{ label: 'Full armor weeks', detail: `${ctx.fullArmorWeeks} of 12 weeks`, share: armor }];
      const parts = [...armorPart, ...(sessions?.parts ?? [])];
      const sessionScore = sessions?.score ?? null;
      const armorScore = armor !== null && ctx.fullArmorWeeks > 0 ? armor : null;
      if (armorScore === null && sessionScore === null) return { score: null, parts, sum: '' };
      if (armorScore === null) return { score: sessionScore, parts, sum: sessions!.sum };
      if (sessionScore === null) return { score: armorScore, parts, sum: `${ctx.fullArmorWeeks} of 12 armor weeks = ${pct(armorScore)}` };
      const score = armorScore * 0.6 + sessionScore * 0.4;
      return { score, parts, sum: `armor ${pct(armorScore)} × 60% + sessions ${pct(sessionScore)} × 40% = ${pct(score)}` };
    }
  }
}

function measureOf(def: AttributeDef, ctx: AttributeContext, exercises: PlanExercise[]): string {
  if (def.kind === 'aura') return '';
  if (def.kind === 'mass') return 'Weigh in on the Campaign tab.';

  const lifts = liftsOf(ctx, exercises).filter((lift) => lift.endgame);
  const liftHint = lifts.length ? `Log your ${orList(lifts.map((lift) => lift.name))}.` : '';
  const sessionHint = exercises.length ? `Tick ${orList(exercises.map((exercise) => exercise.name))}.` : '';
  const hint = def.kind === 'strength' ? liftHint || sessionHint : sessionHint || liftHint;
  return hint || `Tag exercises with ${def.short} in the Plan tab.`;
}

/** Lean Mass is scored like the rest, but reads as kilos on the sheet. */
function massReadout(def: AttributeDef, ctx: AttributeContext, score: number | null): { display: string | null; explain: string } {
  if (def.kind !== 'mass') return { display: null, explain: '' };
  const { start, goal } = ctx.plan.bodyweight;
  const current = ctx.save.bodyWeightKg;
  const kg = `${Math.round(current * 10) / 10} kg`;
  if (goal === start) return { display: kg, explain: `Your bodyweight. Set a goal weight in the Plan tab to score it.` };
  if (goal > start) {
    return { display: kg, explain: current >= goal ? `Goal weight of ${goal} kg reached.` : `${Math.round((score ?? 0) * 100)}% of your ${goal} kg goal.` };
  }
  return {
    display: kg,
    explain: current <= goal ? `Goal weight of ${goal} kg reached.` : `${Math.round((current - goal) * 10) / 10} kg above your ${goal} kg goal.`,
  };
}

export function evaluateAttributes(
  save: ProtocolSave,
  plan: CampaignPlan,
  bosses: BossStatus[],
  ladders: LadderStatus[],
): AttributeStatus[] {
  const { ticks, fullArmorWeeks } = tally(save, plan);
  const ctx: AttributeContext = { save, plan, bosses, ladders, ticks, fullArmorWeeks };

  return ATTRIBUTES.map((def) => {
    const exercises = def.kind === 'strength' || def.kind === 'conditioning' ? tagged(ctx, def.id as TrainableAttribute) : [];
    const { score, parts, sum } = assess(def, ctx, exercises);
    const value = score === null ? null : Math.round(clamp01(score) * ATTRIBUTE_MAX);
    return {
      def,
      ...massReadout(def, ctx, score),
      unlocked: !def.unlock || def.unlock.test(ctx),
      unlockLabel: def.unlock ? def.unlock.label(ctx) : '',
      value,
      parts,
      formula: value === null ? '' : `${sum} × ${ATTRIBUTE_MAX} = ${value}`,
      measure: measureOf(def, ctx, exercises),
      builtBy: [...new Set(exercises.map((exercise) => exercise.name))],
      sessions: sessionsOf(ctx, exercises),
    };
  });
}
