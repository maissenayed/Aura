/**
 * The Hybrid Calisthenics Engine — campaign data.
 *
 * Every number in this file is transcribed from the Master Workout &
 * Progression Blueprint. Where the blueprint says "log it" instead of giving a
 * number, the value here is left empty rather than guessed. The rules that turn
 * this data plus the player's logged lifts into levels, boss HP and unlocks
 * live in `utils/protocolEngine.ts`.
 */

/* ------------------------------------------------------------------ */
/* Iron stats — the lifts every gate in the campaign is measured in    */
/* ------------------------------------------------------------------ */

export type StatId =
  | 'dips'
  | 'inclineBench'
  | 'dbPress'
  | 'cableRow'
  | 'chinUps'
  | 'pullUpReps'
  | 'pushUpReps'
  | 'splitSquat'
  | 'legCurl';

export type StatUnit = 'added-kg' | 'kg' | 'reps';

export type Branch = 'push' | 'pull' | 'legs' | 'core';

export interface IronStat {
  id: StatId;
  name: string;
  short: string;
  unit: StatUnit;
  branch: Branch;
  /** The blueprint's "Current Saved Progress". 0 when the blueprint says "log it". */
  baseline: number;
  /** False when the blueprint leaves the starting number blank. */
  hasBaseline: boolean;
  /** The hardest numeric gate on this lift. Null when the gate is not a number. */
  endgame: number | null;
  step: number;
  /** What the logged number means, e.g. "per DB". */
  measure: string;
  note: string;
}

export const IRON_STATS: IronStat[] = [
  {
    id: 'dips',
    name: 'Weighted Dips',
    short: 'Dips',
    unit: 'added-kg',
    branch: 'push',
    baseline: 10,
    hasBaseline: true,
    endgame: 60,
    step: 2.5,
    measure: 'added load',
    note: 'Lower chest & triceps — the main planche driver.',
  },
  {
    id: 'inclineBench',
    name: 'Barbell Incline Bench',
    short: 'Incline Bench',
    unit: 'kg',
    branch: 'push',
    baseline: 45,
    hasBaseline: true,
    endgame: 115,
    step: 2.5,
    measure: 'bar load',
    note: 'Upper chest. Carries the planche lean.',
  },
  {
    id: 'dbPress',
    name: 'Seated DB Overhead Press',
    short: 'DB Press',
    unit: 'kg',
    branch: 'push',
    baseline: 14,
    hasBaseline: true,
    endgame: 38,
    step: 2,
    measure: 'per dumbbell',
    note: 'Gates the handstand push-up first, then the planche.',
  },
  {
    id: 'cableRow',
    name: 'Seated Cable Rows',
    short: 'Cable Row',
    unit: 'kg',
    branch: 'pull',
    baseline: 60,
    hasBaseline: true,
    endgame: 100,
    step: 5,
    measure: 'stack load',
    note: '100 kg x 10 equates to 30 bodyweight pull-ups at 75 kg.',
  },
  {
    id: 'chinUps',
    name: 'Weighted Chin-ups',
    short: 'Chin-ups',
    unit: 'added-kg',
    branch: 'pull',
    baseline: 6,
    hasBaseline: true,
    endgame: 55,
    step: 2.5,
    measure: 'added load',
    note: 'Vertical power. The one-arm pull-up sits at the top of this lift.',
  },
  {
    id: 'pullUpReps',
    name: 'Bodyweight Pull-ups',
    short: 'Pull-ups',
    unit: 'reps',
    branch: 'pull',
    baseline: 4,
    hasBaseline: true,
    endgame: 15,
    step: 1,
    measure: 'max strict reps',
    note: 'Overhand, full range. Tested fresh on Tuesday, burned out on Saturday.',
  },
  {
    id: 'pushUpReps',
    name: 'Bodyweight Push-ups',
    short: 'Push-ups',
    unit: 'reps',
    branch: 'push',
    baseline: 0,
    hasBaseline: false,
    endgame: 70,
    step: 1,
    measure: 'max reps (AMRAP)',
    note: 'One burnout set after the heavy push work.',
  },
  {
    id: 'splitSquat',
    name: 'DB Bulgarian Split Squats',
    short: 'Split Squat',
    unit: 'kg',
    branch: 'legs',
    baseline: 0,
    hasBaseline: false,
    endgame: 32,
    step: 2,
    measure: 'per dumbbell',
    note: 'The road to the weighted pistol squat.',
  },
  {
    id: 'legCurl',
    name: 'Seated Leg Curls',
    short: 'Leg Curl',
    unit: 'kg',
    branch: 'legs',
    baseline: 0,
    hasBaseline: false,
    endgame: null,
    step: 5,
    measure: 'stack load',
    note: 'The gate is the full weight stack — claim it on the Nordic boss when you pin the last plate.',
  },
];

/* ------------------------------------------------------------------ */
/* The mass quest                                                      */
/* ------------------------------------------------------------------ */

export const BODYWEIGHT_QUEST = {
  start: 66,
  phaseBoss: 70,
  finalBoss: 75,
  weeklyGainKg: 0.3,
  proteinGrams: 140,
  surplusCalories: '+300–400 kcal',
  /** The 12-week roadmap: end-of-week targets. */
  checkpoints: [
    { id: 'bw_m1', label: 'Month 1', week: 4, targetKg: 67.3 },
    { id: 'bw_m2', label: 'Month 2', week: 8, targetKg: 68.6 },
    { id: 'bw_m3', label: 'Month 3', week: 12, targetKg: 70.0 },
  ],
};

/**
 * Strength gates scale with bodyweight — the blueprint gives every planche
 * tier twice, once at 66 kg and once at 75 kg.
 */
export interface ScaledValue {
  at66: number;
  at75: number;
}

/* ------------------------------------------------------------------ */
/* Skill trees                                                         */
/* ------------------------------------------------------------------ */

export interface LadderTier {
  id: string;
  /** The label shown on the rung, e.g. "Level 2" or "Final Boss". */
  rung: string;
  name: string;
  subtitle: string;
  scaled?: Partial<Record<StatId, ScaledValue>>;
  flat?: Partial<Record<StatId, number>>;
  /** Marked CLEARED in the blueprint itself, whatever the logged numbers say. */
  preCleared?: boolean;
}

export interface SkillLadder {
  id: string;
  name: string;
  tagline: string;
  branch: Branch;
  /** How the blueprint names the top of this tree. */
  bossLabel: string;
  tiers: LadderTier[];
}

export const SKILL_LADDERS: SkillLadder[] = [
  {
    id: 'planche',
    name: 'The Planche Tree',
    tagline: 'Straight-arm pushing. Gates rise with every kilo you gain.',
    branch: 'push',
    bossLabel: 'Final Boss',
    tiers: [
      {
        id: 'planche_0',
        rung: 'Level 0',
        name: 'Pre-Tuck',
        subtitle: 'Frog Stand · Planche Lean · Pseudo Planche Push-ups',
        preCleared: true,
      },
      {
        id: 'planche_1',
        rung: 'Level 1',
        name: 'Tuck Planche',
        subtitle: 'Knees to chest, hips level with shoulders',
        preCleared: true,
        scaled: {
          dips: { at66: 10, at75: 15 },
          inclineBench: { at66: 50, at75: 60 },
          dbPress: { at66: 16, at75: 18 },
        },
      },
      {
        id: 'planche_2',
        rung: 'Level 2',
        name: 'Advanced Tuck',
        subtitle: 'Back flat, hips open',
        scaled: {
          dips: { at66: 25, at75: 30 },
          inclineBench: { at66: 70, at75: 80 },
          dbPress: { at66: 22, at75: 24 },
        },
      },
      {
        id: 'planche_3',
        rung: 'Level 3',
        name: 'Straddle Planche',
        subtitle: 'Legs straight and wide',
        scaled: {
          dips: { at66: 40, at75: 45 },
          inclineBench: { at66: 85, at75: 95 },
          dbPress: { at66: 28, at75: 30 },
        },
      },
      {
        id: 'planche_final',
        rung: 'Final Boss',
        name: 'Full Planche',
        subtitle: 'Legs together, body parallel to the floor',
        scaled: {
          dips: { at66: 55, at75: 60 },
          inclineBench: { at66: 100, at75: 115 },
          dbPress: { at66: 36, at75: 38 },
        },
      },
    ],
  },
  {
    id: 'frontlever',
    name: 'The Front Lever Tree',
    tagline: 'Six months of row periodization, 60 kg to 100 kg.',
    branch: 'pull',
    bossLabel: 'Level 20 Boss',
    tiers: [
      {
        id: 'lever_1',
        rung: 'Phase 1',
        name: 'Hypertrophy Base',
        subtitle: 'Months 1–2 · 4 x 8–12 reps · push 60 → 75 kg',
        flat: { cableRow: 75 },
      },
      {
        id: 'lever_2',
        rung: 'Phase 2',
        name: 'Heavy Tension',
        subtitle: 'Months 3–4 · 4 x 5–8 reps · push 75 → 85 kg',
        flat: { cableRow: 85 },
      },
      {
        id: 'lever_3',
        rung: 'Level 20 Boss',
        name: 'Absolute Strength',
        subtitle: 'Months 5–6 · 3 x 4–6 reps + 1 back-off set · 100 kg for 10',
        flat: { cableRow: 100 },
      },
    ],
  },
  {
    id: 'handstand',
    name: 'The Handstand Tree',
    tagline: 'Press 1.0x bodyweight overhead. The key that unseals the planche.',
    branch: 'push',
    bossLabel: 'Level 30 Boss',
    tiers: [
      {
        id: 'hs_1',
        rung: 'Tier 1',
        name: 'Year-One Press',
        subtitle: 'The November 2027 iron checkpoint, for 8 reps',
        flat: { dbPress: 24 },
      },
      {
        id: 'hs_2',
        rung: 'Level 30 Boss',
        name: 'Handstand Push-up Gate',
        subtitle: 'The lower edge of the 30–32 kg checkpoint, for 8 reps',
        flat: { dbPress: 30 },
      },
      {
        id: 'hs_3',
        rung: 'Mastery',
        name: 'Bodyweight Overhead',
        subtitle: 'The upper edge of the checkpoint — 1.0x bodyweight locked in',
        flat: { dbPress: 32 },
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* The ten final bosses                                                */
/* ------------------------------------------------------------------ */

export type RequirementKind = 'stat' | 'milestone' | 'boss';

export interface BossRequirement {
  kind: RequirementKind;
  /** StatId for 'stat', milestone id for 'milestone', boss id for 'boss'. */
  ref: string;
  label: string;
  target?: number;
  scaledTarget?: ScaledValue;
}

export interface Boss {
  id: string;
  order: number;
  name: string;
  epithet: string;
  branch: Branch;
  requirements: BossRequirement[];
}

export const BOSSES: Boss[] = [
  {
    id: 'boss_planche',
    order: 1,
    name: 'The Full Planche',
    epithet: 'Straight arms, body parallel to the floor',
    branch: 'push',
    requirements: [
      { kind: 'stat', ref: 'dips', label: 'Weighted Dips', scaledTarget: { at66: 55, at75: 60 } },
      { kind: 'stat', ref: 'inclineBench', label: 'Incline Bench', scaledTarget: { at66: 100, at75: 115 } },
      { kind: 'stat', ref: 'dbPress', label: 'Seated DB Press', scaledTarget: { at66: 36, at75: 38 } },
      { kind: 'boss', ref: 'boss_hspu', label: 'Handstand Push-up conquered' },
    ],
  },
  {
    id: 'boss_frontlever',
    order: 2,
    name: 'The Full Front Lever',
    epithet: 'Horizontal hang, rigid from shoulders to toes',
    branch: 'pull',
    requirements: [{ kind: 'stat', ref: 'cableRow', label: 'Seated Cable Row x 10', target: 100 }],
  },
  {
    id: 'boss_hspu',
    order: 3,
    name: 'The Handstand Push-up',
    epithet: 'Press 1.0x bodyweight overhead',
    branch: 'push',
    requirements: [{ kind: 'stat', ref: 'dbPress', label: 'Seated DB Press x 8 (30–32 kg)', target: 30 }],
  },
  {
    id: 'boss_pullup_engine',
    order: 4,
    name: 'The 15-Rep Pull-up Engine',
    epithet: 'Endurance milestone',
    branch: 'pull',
    requirements: [{ kind: 'stat', ref: 'pullUpReps', label: 'Strict Pull-ups', target: 15 }],
  },
  {
    id: 'boss_pushup_engine',
    order: 5,
    name: 'The 70-Rep Push-up Engine',
    epithet: 'Endurance milestone',
    branch: 'push',
    requirements: [{ kind: 'stat', ref: 'pushUpReps', label: 'Push-ups in one set', target: 70 }],
  },
  {
    id: 'boss_nordic',
    order: 6,
    name: 'The Nordic Hamstring Curl',
    epithet: 'Lowered and raised by the hamstrings alone',
    branch: 'legs',
    requirements: [
      { kind: 'milestone', ref: 'ms_legcurl_stack', label: 'Full weight stack on Seated Leg Curls' },
    ],
  },
  {
    id: 'boss_pistol',
    order: 7,
    name: 'The Weighted Pistol Squat',
    epithet: 'One leg, loaded, full depth',
    branch: 'legs',
    requirements: [{ kind: 'stat', ref: 'splitSquat', label: 'Bulgarian Split Squats (per DB)', target: 32 }],
  },
  {
    id: 'boss_humanflag',
    order: 8,
    name: 'The Human Flag',
    epithet: 'A side lever on a vertical pole',
    branch: 'core',
    requirements: [
      { kind: 'milestone', ref: 'ms_dragonflag', label: 'Advanced Dragon Flag holds' },
      { kind: 'stat', ref: 'cableRow', label: 'Seated Cable Row', target: 100 },
    ],
  },
  {
    id: 'boss_muscleup',
    order: 9,
    name: 'The Strict Muscle-Up',
    epithet: 'No kip. Pull, transition, press.',
    branch: 'pull',
    requirements: [
      { kind: 'stat', ref: 'chinUps', label: 'Weighted Chin-ups', target: 20 },
      { kind: 'stat', ref: 'dips', label: 'Weighted Dips', target: 30 },
      { kind: 'boss', ref: 'boss_pullup_engine', label: 'Boss 4 cleared' },
    ],
  },
  {
    id: 'boss_oap',
    order: 10,
    name: 'One Clean One-Arm Pull-Up',
    epithet: 'The last test of vertical pulling',
    branch: 'pull',
    requirements: [{ kind: 'stat', ref: 'chinUps', label: 'Weighted Chin-ups', target: 55 }],
  },
];

export interface Milestone {
  id: string;
  name: string;
  description: string;
}

/** Gates the blueprint states in words rather than kilos. */
export const MILESTONES: Milestone[] = [
  {
    id: 'ms_dragonflag',
    name: 'Advanced Dragon Flag Holds',
    description: 'Monday negatives turned into controlled holds. Claim it when you own it.',
  },
  {
    id: 'ms_legcurl_stack',
    name: 'Full Stack Leg Curls',
    description: 'Every plate on the seated leg curl, for your working reps.',
  },
];

/* ------------------------------------------------------------------ */
/* Year 1 Iron Checkpoints                                             */
/* ------------------------------------------------------------------ */

export const YEAR_ONE = {
  deadline: 'November 2027',
  repTarget: 8,
  checkpoints: [
    { id: 'y1_bench', statId: 'inclineBench' as StatId, label: 'Barbell Incline Bench Press', target: 80 },
    { id: 'y1_dips', statId: 'dips' as StatId, label: 'Weighted Dips', target: 30 },
    { id: 'y1_row', statId: 'cableRow' as StatId, label: 'Seated Cable Rows', target: 80 },
    { id: 'y1_chin', statId: 'chinUps' as StatId, label: 'Weighted Chin-ups', target: 20 },
    { id: 'y1_press', statId: 'dbPress' as StatId, label: 'Seated DB Overhead Press', target: 24 },
  ],
};

/* ------------------------------------------------------------------ */
/* The master weekly routine — the daily mission board                 */
/* ------------------------------------------------------------------ */

export interface AccessoryLoad {
  /** The blueprint's saved number. Null where it says "log it". */
  start: number | null;
  step: number;
}

export interface QuestExercise {
  id: string;
  name: string;
  target: string;
  focus: string;
  /** Logs straight into an Iron Stat. */
  statId?: StatId;
  /** An accessory lift that keeps its own running number. */
  load?: AccessoryLoad;
  /** For work with nothing to load, e.g. "Bodyweight". */
  note?: string;
  bossIds?: string[];
  /** Feeds tendon armor rather than a boss. */
  armor?: boolean;
}

export type DayKind = Branch | 'recovery' | 'rest';

export interface QuestDay {
  id: string;
  day: string;
  title: string;
  kind: DayKind;
  warmUps: string[];
  exercises: QuestExercise[];
  /** The blueprint's "Final Boss & Iron Target" line for days with no single boss. */
  purpose?: string;
}

export const QUEST_DAYS: QuestDay[] = [
  {
    id: 'mon',
    day: 'Monday',
    title: 'Legs & Core',
    kind: 'legs',
    warmUps: ['Bodyweight Squats — 2 x 10', 'Hollow Body Hold — 2 x 15s'],
    exercises: [
      { id: 'mon_split', name: 'DB Bulgarian Split Squats', target: '3 x 8 per leg', focus: 'Quads & Glutes', statId: 'splitSquat', bossIds: ['boss_pistol'] },
      { id: 'mon_legcurl', name: 'Seated Leg Curls', target: '3 x 8–12 reps', focus: 'Hamstrings', statId: 'legCurl', bossIds: ['boss_nordic'] },
      { id: 'mon_dragon', name: 'Dragon Flag Negatives', target: '3 x 5–8 reps', focus: 'Lats & Core', note: 'Bodyweight', bossIds: ['boss_humanflag'] },
      { id: 'mon_ttb', name: 'Hanging Toes-to-Bar', target: '3 x 8–12 reps', focus: 'Lower Abs', note: 'Bodyweight' },
      { id: 'mon_abwheel', name: 'Ab Wheel Rollouts', target: '3 x 10–15 reps', focus: 'Core Anti-Extension', note: 'Bodyweight' },
    ],
  },
  {
    id: 'tue',
    day: 'Tuesday',
    title: 'Pull 1 — Back & Biceps',
    kind: 'pull',
    warmUps: ['Scapular Pull-ups — 2 x 10', 'Tuck Front Lever — 2 x 5s'],
    exercises: [
      { id: 'tue_pullups', name: 'BW Pull-ups (Overhand)', target: '1 x 4–5 reps', focus: 'Skill Preservation', statId: 'pullUpReps', bossIds: ['boss_pullup_engine'] },
      { id: 'tue_chin', name: 'Weighted Chin-ups', target: '4 x 5–8 reps', focus: 'Vertical Power', statId: 'chinUps', bossIds: ['boss_muscleup', 'boss_oap'] },
      { id: 'tue_row', name: 'Seated Cable Rows', target: '4 x 8–12 reps', focus: 'Horizontal Power', statId: 'cableRow', bossIds: ['boss_frontlever', 'boss_humanflag'] },
      { id: 'tue_pecdeck', name: 'Reverse Pec Deck', target: '3 x 12–15 reps', focus: 'Rear Deltoids', load: { start: 30, step: 2.5 } },
      { id: 'tue_curl', name: 'Cable Bicep Curls', target: '4 x 8–12 reps', focus: 'Bicep Peak Isolation', load: { start: 25, step: 2.5 } },
    ],
  },
  {
    id: 'wed',
    day: 'Wednesday',
    title: 'Active Recovery',
    kind: 'recovery',
    warmUps: [],
    purpose: 'All bosses · Tendon armor. Flush the tendons, do zero muscle damage.',
    exercises: [
      { id: 'wed_feeder', name: 'Cable Feeder Curls', target: '100 continuous', focus: 'Tendon flushing', note: 'Lowest weight', armor: true },
      { id: 'wed_pushdown', name: 'Cable Tricep Pushdowns', target: '100 continuous', focus: 'Zero muscle damage', note: 'Lowest weight', armor: true },
    ],
  },
  {
    id: 'thu',
    day: 'Thursday',
    title: 'Push 1 — Chest & Triceps',
    kind: 'push',
    warmUps: ['Scapular Push-ups — 2 x 15', 'Tuck Planche — 2 x 5s'],
    exercises: [
      { id: 'thu_dips', name: 'Weighted Dips', target: '4 x 5–8 reps', focus: 'Lower Chest & Triceps', statId: 'dips', bossIds: ['boss_planche', 'boss_muscleup'] },
      { id: 'thu_bench', name: 'Barbell Incline Bench', target: '4 x 8–12 reps', focus: 'Upper Chest', statId: 'inclineBench', bossIds: ['boss_planche'] },
      { id: 'thu_pushdown', name: 'Cable Tricep Pushdowns', target: '3 x 10–15 reps', focus: 'Tricep Lockout', load: { start: 17.5, step: 2.5 } },
      { id: 'thu_pushups', name: 'Bodyweight Push-ups (AMRAP)', target: '1 x max reps — burnout', focus: 'Lactic Acid Clearance', statId: 'pushUpReps', bossIds: ['boss_pushup_engine'] },
    ],
  },
  {
    id: 'fri',
    day: 'Friday',
    title: 'Total Rest',
    kind: 'rest',
    warmUps: [],
    purpose: 'All bosses · Growth phase. 0 sets, 0 reps — a full central nervous system reset.',
    exercises: [],
  },
  {
    id: 'sat',
    day: 'Saturday',
    title: 'Pull 2 — Dynamic Pull',
    kind: 'pull',
    warmUps: ['Easy V0–V1 routes'],
    exercises: [
      { id: 'sat_pullups', name: 'BW Pull-ups (AMRAP Burnout)', target: '1 x max reps — burnout', focus: 'Lactic Acid Clearance', statId: 'pullUpReps', bossIds: ['boss_pullup_engine'] },
      { id: 'sat_boulder', name: 'Bouldering', target: '60–90 mins', focus: 'Dynamic Pulling & Grip', note: 'V0–V1 routes' },
      { id: 'sat_wrist', name: 'DB Reverse Wrist Curls', target: '3 x 15–20 reps', focus: 'Wrist Tendon Armor', load: { start: null, step: 1 }, armor: true },
    ],
  },
  {
    id: 'sun',
    day: 'Sunday',
    title: 'Push 2 — Shoulders',
    kind: 'push',
    warmUps: ['Cable Face Pulls — 2 x 15'],
    exercises: [
      { id: 'sun_press', name: 'Seated DB Overhead Press', target: '4 x 6–10 reps', focus: 'Front Delts', statId: 'dbPress', bossIds: ['boss_hspu', 'boss_planche'] },
      { id: 'sun_lateral', name: 'Cable Lateral Raises', target: '4 x 12–15 reps', focus: 'Middle Deltoids', load: { start: 5, step: 1 } },
      { id: 'sun_hammer', name: 'DB Hammer Curls', target: '4 x 10–15 reps', focus: 'Brachialis & Forearms', load: { start: 14, step: 2 } },
      { id: 'sun_overhead', name: 'Overhead Cable Extensions', target: '4 x 10–15 reps', focus: 'Triceps Long Head', load: { start: 15, step: 2.5 } },
      { id: 'sun_lsit', name: 'L-Sit Holds', target: '4 x 10–15 secs', focus: 'Core Compression', note: 'Bodyweight' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Connective tissue armor — the 10-to-1 vascularity rule              */
/* ------------------------------------------------------------------ */

export interface ArmorPiece {
  id: string;
  slot: string;
  drill: string;
  when: string;
}

export const ARMOR_PIECES: ArmorPiece[] = [
  {
    id: 'armor_elbows',
    slot: 'Elbows',
    drill: 'Supinated holds on rings & straight-arm cable hold finishes',
    when: 'Finish your pull sessions with them',
  },
  {
    id: 'armor_wrists',
    slot: 'Wrists',
    drill: 'DB Reverse Wrist Curls — 15–20 reps',
    when: 'On bouldering days',
  },
  {
    id: 'armor_shoulders',
    slot: 'Shoulders',
    drill: 'Cable Face Pulls to anchor the rotator cuff',
    when: 'Before you press',
  },
];

export const ARMOR_RULE = 'Tendons adapt 10x slower than muscle. Armor is re-forged every week.';
