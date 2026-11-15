/**
 * The catalog every campaign plan is built from.
 *
 * Players do not invent exercises, lifts, bosses or skill trees: they pick
 * them from these lists and set their own numbers (sets and reps, starting and
 * end-game lifts, boss and tier targets, bodyweight). Everything about what an
 * item *is* — its name, what it logs, what it builds, what it requires — lives
 * here, so a correction made here reaches every plan.
 *
 * Ids are permanent: plans and saves refer to them.
 */

import type { Branch, StatUnit, TrainableAttribute } from '../utils/campaignPlan';

/* ------------------------------------------------------------------ */
/* Sets & reps                                                         */
/* ------------------------------------------------------------------ */

/** How an exercise is dosed, which decides the reps dropdown. */
export type DoseKind = 'reps' | 'seconds' | 'minutes' | 'continuous' | 'none';

export const SET_OPTIONS = [1, 2, 3, 4, 5, 6];

export const DOSE_OPTIONS: Record<Exclude<DoseKind, 'none'>, string[]> = {
  reps: ['1', '2', '3', '4–5', '5', '5–8', '6', '6–10', '8', '8–12', '10', '10–15', '12', '12–15', '15', '15–20', '20', '25', '30', 'max'],
  seconds: ['5', '10', '10–15', '15', '20', '30', '45', '60'],
  minutes: ['5', '10', '15', '20', '30', '45', '60', '60–90'],
  continuous: ['50', '100'],
};

/** How one dropdown option reads, e.g. "8–12 reps", "max reps (AMRAP)", "15 secs". */
export function doseOptionLabel(kind: DoseKind, option: string): string {
  if (kind === 'reps') return option === 'max' ? 'max reps (AMRAP)' : `${option} reps`;
  if (kind === 'seconds') return `${option} secs`;
  if (kind === 'minutes') return `${option} mins`;
  if (kind === 'continuous') return `${option} continuous`;
  return '';
}

/**
 * "4 x 8–12 reps", "3 x 8 per leg", "100 continuous", "60–90 mins". Warm-ups
 * use the short form: "2 x 10", "2 x 15s".
 */
export function formatDose(exercise: CatalogExercise, sets: number, reps: string, short = false): string {
  const { dose, side } = exercise;
  if (dose === 'none') return '';
  if (dose === 'minutes') return sets === 1 ? `${reps} mins` : `${sets} x ${reps} mins`;
  if (dose === 'continuous') return sets === 1 ? `${reps} continuous` : `${sets} x ${reps} continuous`;
  if (dose === 'seconds') return `${sets} x ${reps}${short ? 's' : ' secs'}${side ? ` per ${side}` : ''}`;
  if (reps === 'max') return `${sets} x max reps (AMRAP)`;
  if (side) return `${sets} x ${reps} per ${side}`;
  return short ? `${sets} x ${reps}` : `${sets} x ${reps} reps`;
}

/* ------------------------------------------------------------------ */
/* Lifts — the numbers the game measures                               */
/* ------------------------------------------------------------------ */

export interface CatalogLift {
  id: string;
  name: string;
  short: string;
  unit: StatUnit;
  branch: Branch;
  measure: string;
  step: number;
  /** Suggested end-game number; the player can change it. */
  endgame: number | null;
  note: string;
}

export const LIFT_CATALOG: CatalogLift[] = [
  { id: 'dips', name: 'Weighted Dips', short: 'Dips', unit: 'added-kg', branch: 'push', measure: 'added load', step: 2.5, endgame: 60, note: 'Lower chest & triceps — the main planche driver.' },
  { id: 'inclineBench', name: 'Barbell Incline Bench', short: 'Incline Bench', unit: 'kg', branch: 'push', measure: 'bar load', step: 2.5, endgame: 115, note: 'Upper chest. Carries the planche lean.' },
  { id: 'dbPress', name: 'Seated DB Overhead Press', short: 'DB Press', unit: 'kg', branch: 'push', measure: 'per dumbbell', step: 2, endgame: 38, note: 'Gates the handstand push-up first, then the planche.' },
  { id: 'benchPress', name: 'Barbell Bench Press', short: 'Bench', unit: 'kg', branch: 'push', measure: 'bar load', step: 2.5, endgame: 100, note: 'Flat pressing strength.' },
  { id: 'overheadPress', name: 'Standing Overhead Press', short: 'OHP', unit: 'kg', branch: 'push', measure: 'bar load', step: 2.5, endgame: 60, note: 'Strict press, no leg drive.' },
  { id: 'pushUpReps', name: 'Bodyweight Push-ups', short: 'Push-ups', unit: 'reps', branch: 'push', measure: 'max reps (AMRAP)', step: 1, endgame: 70, note: 'One unbroken set.' },
  { id: 'dipReps', name: 'Bodyweight Dips', short: 'BW Dips', unit: 'reps', branch: 'push', measure: 'max reps', step: 1, endgame: 30, note: 'Full depth, full lockout.' },
  { id: 'hspuReps', name: 'Handstand Push-ups', short: 'HSPU', unit: 'reps', branch: 'push', measure: 'max strict reps', step: 1, endgame: 10, note: 'Against the wall, head to the floor.' },
  { id: 'handstandHold', name: 'Freestanding Handstand', short: 'Handstand', unit: 'seconds', branch: 'push', measure: 'longest hold', step: 5, endgame: 60, note: 'No wall, no walking.' },
  { id: 'cableRow', name: 'Seated Cable Rows', short: 'Cable Row', unit: 'kg', branch: 'pull', measure: 'stack load', step: 5, endgame: 100, note: '100 kg x 10 equates to 30 bodyweight pull-ups at 75 kg.' },
  { id: 'chinUps', name: 'Weighted Chin-ups', short: 'Chin-ups', unit: 'added-kg', branch: 'pull', measure: 'added load', step: 2.5, endgame: 55, note: 'Vertical power. The one-arm pull-up sits at the top of this lift.' },
  { id: 'weightedPullUps', name: 'Weighted Pull-ups', short: 'W. Pull-ups', unit: 'added-kg', branch: 'pull', measure: 'added load', step: 2.5, endgame: 40, note: 'Overhand, dead hang to chin over bar.' },
  { id: 'pullUpReps', name: 'Bodyweight Pull-ups', short: 'Pull-ups', unit: 'reps', branch: 'pull', measure: 'max strict reps', step: 1, endgame: 15, note: 'Overhand, full range.' },
  { id: 'muscleUpReps', name: 'Strict Muscle-ups', short: 'Muscle-ups', unit: 'reps', branch: 'pull', measure: 'max strict reps', step: 1, endgame: 10, note: 'No kip, false grip allowed.' },
  { id: 'barbellRow', name: 'Barbell Row', short: 'Row', unit: 'kg', branch: 'pull', measure: 'bar load', step: 2.5, endgame: 100, note: 'Torso near parallel.' },
  { id: 'latPulldown', name: 'Lat Pulldown', short: 'Pulldown', unit: 'kg', branch: 'pull', measure: 'stack load', step: 5, endgame: 90, note: 'Full stretch at the top.' },
  { id: 'frontLeverHold', name: 'Front Lever Hold', short: 'Front Lever', unit: 'seconds', branch: 'pull', measure: 'longest full hold', step: 1, endgame: 10, note: 'Body straight and horizontal.' },
  { id: 'hangTime', name: 'Dead Hang', short: 'Dead Hang', unit: 'seconds', branch: 'pull', measure: 'longest hang', step: 5, endgame: 120, note: 'Grip endurance in one number.' },
  { id: 'splitSquat', name: 'DB Bulgarian Split Squats', short: 'Split Squat', unit: 'kg', branch: 'legs', measure: 'per dumbbell', step: 2, endgame: 32, note: 'The road to the weighted pistol squat.' },
  { id: 'legCurl', name: 'Seated Leg Curls', short: 'Leg Curl', unit: 'kg', branch: 'legs', measure: 'stack load', step: 5, endgame: null, note: 'The gate is the full weight stack — claim it on the Nordic boss when you pin the last plate.' },
  { id: 'backSquat', name: 'Barbell Back Squat', short: 'Squat', unit: 'kg', branch: 'legs', measure: 'bar load', step: 2.5, endgame: 140, note: 'Below parallel.' },
  { id: 'deadlift', name: 'Deadlift', short: 'Deadlift', unit: 'kg', branch: 'legs', measure: 'bar load', step: 5, endgame: 180, note: 'Conventional or sumo — pick one and keep it.' },
  { id: 'pistolReps', name: 'Pistol Squats', short: 'Pistols', unit: 'reps', branch: 'legs', measure: 'max reps per leg', step: 1, endgame: 10, note: 'Heel down, full depth.' },
  { id: 'lsitHold', name: 'L-Sit Hold', short: 'L-Sit', unit: 'seconds', branch: 'core', measure: 'longest hold', step: 5, endgame: 30, note: 'Legs straight and level.' },
];

/* ------------------------------------------------------------------ */
/* Exercises                                                           */
/* ------------------------------------------------------------------ */

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core' | 'skill' | 'recovery' | 'warmup';

export const EXERCISE_CATEGORIES: { id: ExerciseCategory; label: string }[] = [
  { id: 'push', label: 'Push' },
  { id: 'pull', label: 'Pull' },
  { id: 'legs', label: 'Legs' },
  { id: 'core', label: 'Core & compression' },
  { id: 'skill', label: 'Skills & holds' },
  { id: 'recovery', label: 'Grip, tendons & recovery' },
  { id: 'warmup', label: 'Warm-up & prep' },
];

export interface CatalogExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  focus: string;
  dose: DoseKind;
  /** Dosed per leg / side / arm. */
  side?: 'leg' | 'side' | 'arm';
  /** Logs straight into this lift. */
  lift?: string;
  /** Keeps its own working weight instead, with a suggested start. */
  load?: { start: number | null; step: number };
  /** Shown when nothing is logged. */
  note?: string;
  /** Bosses it trains towards beyond the ones its lift already feeds. */
  feeds?: string[];
  /** Counts as connective-tissue work. */
  armor?: boolean;
  trains: TrainableAttribute[];
  /** What it starts on when added. */
  sets: number;
  reps: string;
}

const BW = 'Bodyweight';

export const EXERCISE_CATALOG: CatalogExercise[] = [
  /* Push */
  { id: 'weighted_dips', name: 'Weighted Dips', category: 'push', focus: 'Lower Chest & Triceps', dose: 'reps', lift: 'dips', trains: ['push', 'straight', 'power'], sets: 4, reps: '5–8' },
  { id: 'incline_bench', name: 'Barbell Incline Bench', category: 'push', focus: 'Upper Chest', dose: 'reps', lift: 'inclineBench', trains: ['push', 'straight'], sets: 4, reps: '8–12' },
  { id: 'db_press', name: 'Seated DB Overhead Press', category: 'push', focus: 'Front Delts', dose: 'reps', lift: 'dbPress', trains: ['push', 'straight', 'balance'], sets: 4, reps: '6–10' },
  { id: 'bench_press', name: 'Barbell Bench Press', category: 'push', focus: 'Chest', dose: 'reps', lift: 'benchPress', trains: ['push'], sets: 4, reps: '5–8' },
  { id: 'overhead_press', name: 'Standing Overhead Press', category: 'push', focus: 'Shoulders', dose: 'reps', lift: 'overheadPress', trains: ['push', 'balance'], sets: 4, reps: '5–8' },
  { id: 'pushups_amrap', name: 'Bodyweight Push-ups (AMRAP)', category: 'push', focus: 'Lactic Acid Clearance', dose: 'reps', lift: 'pushUpReps', trains: ['endurance'], sets: 1, reps: 'max' },
  { id: 'bw_dips', name: 'Bodyweight Dips', category: 'push', focus: 'Chest & Triceps', dose: 'reps', lift: 'dipReps', trains: ['push', 'endurance'], sets: 3, reps: '8–12' },
  { id: 'hspu', name: 'Wall Handstand Push-ups', category: 'push', focus: 'Overhead Strength', dose: 'reps', lift: 'hspuReps', trains: ['push', 'balance', 'power'], sets: 4, reps: '3' },
  { id: 'pike_pushups', name: 'Pike Push-ups', category: 'push', focus: 'Shoulders', dose: 'reps', note: BW, trains: ['push', 'balance'], sets: 3, reps: '8–12' },
  { id: 'diamond_pushups', name: 'Diamond Push-ups', category: 'push', focus: 'Triceps', dose: 'reps', note: BW, trains: ['push', 'endurance'], sets: 3, reps: '10–15' },
  { id: 'archer_pushups', name: 'Archer Push-ups', category: 'push', focus: 'Unilateral Push', dose: 'reps', side: 'side', note: BW, trains: ['push', 'power'], sets: 3, reps: '5' },
  { id: 'pseudo_planche_pushups', name: 'Pseudo Planche Push-ups', category: 'push', focus: 'Straight-arm Lean', dose: 'reps', note: BW, trains: ['push', 'straight'], sets: 3, reps: '6–10' },
  { id: 'tricep_pushdown', name: 'Cable Tricep Pushdowns', category: 'push', focus: 'Tricep Lockout', dose: 'reps', load: { start: 17.5, step: 2.5 }, trains: ['push'], sets: 3, reps: '10–15' },
  { id: 'lateral_raise', name: 'Cable Lateral Raises', category: 'push', focus: 'Middle Deltoids', dose: 'reps', load: { start: 5, step: 1 }, trains: ['push'], sets: 4, reps: '12–15' },
  { id: 'overhead_extension', name: 'Overhead Cable Extensions', category: 'push', focus: 'Triceps Long Head', dose: 'reps', load: { start: 15, step: 2.5 }, trains: ['push'], sets: 4, reps: '10–15' },

  /* Pull */
  { id: 'bw_pullups', name: 'BW Pull-ups (Overhand)', category: 'pull', focus: 'Skill Preservation', dose: 'reps', lift: 'pullUpReps', trains: ['endurance', 'power'], sets: 1, reps: '4–5' },
  { id: 'pullups_amrap', name: 'BW Pull-ups (AMRAP Burnout)', category: 'pull', focus: 'Lactic Acid Clearance', dose: 'reps', lift: 'pullUpReps', trains: ['endurance', 'power'], sets: 1, reps: 'max' },
  { id: 'weighted_chins', name: 'Weighted Chin-ups', category: 'pull', focus: 'Vertical Power', dose: 'reps', lift: 'chinUps', trains: ['pull', 'power'], sets: 4, reps: '5–8' },
  { id: 'weighted_pullups', name: 'Weighted Pull-ups', category: 'pull', focus: 'Vertical Power', dose: 'reps', lift: 'weightedPullUps', trains: ['pull', 'power'], sets: 4, reps: '5–8' },
  { id: 'cable_row', name: 'Seated Cable Rows', category: 'pull', focus: 'Horizontal Power', dose: 'reps', lift: 'cableRow', trains: ['pull', 'straight'], sets: 4, reps: '8–12' },
  { id: 'barbell_row', name: 'Barbell Rows', category: 'pull', focus: 'Upper Back', dose: 'reps', lift: 'barbellRow', trains: ['pull', 'straight'], sets: 4, reps: '6–10' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'pull', focus: 'Lats', dose: 'reps', lift: 'latPulldown', trains: ['pull'], sets: 3, reps: '8–12' },
  { id: 'muscle_ups', name: 'Strict Muscle-ups', category: 'pull', focus: 'Transition Power', dose: 'reps', lift: 'muscleUpReps', trains: ['pull', 'power'], sets: 5, reps: '2' },
  { id: 'archer_pullups', name: 'Archer Pull-ups', category: 'pull', focus: 'Unilateral Pull', dose: 'reps', side: 'side', note: BW, trains: ['pull', 'power'], sets: 3, reps: '3' },
  { id: 'australian_rows', name: 'Australian Rows', category: 'pull', focus: 'Horizontal Pull', dose: 'reps', note: BW, trains: ['pull', 'endurance'], sets: 3, reps: '10–15' },
  { id: 'front_lever_raises', name: 'Front Lever Raises', category: 'pull', focus: 'Lats & Core', dose: 'reps', note: BW, trains: ['straight', 'pull', 'core'], sets: 3, reps: '5' },
  { id: 'reverse_pec_deck', name: 'Reverse Pec Deck', category: 'pull', focus: 'Rear Deltoids', dose: 'reps', load: { start: 30, step: 2.5 }, trains: ['pull'], sets: 3, reps: '12–15' },
  { id: 'cable_curl', name: 'Cable Bicep Curls', category: 'pull', focus: 'Bicep Peak Isolation', dose: 'reps', load: { start: 25, step: 2.5 }, trains: ['pull'], sets: 4, reps: '8–12' },
  { id: 'hammer_curl', name: 'DB Hammer Curls', category: 'pull', focus: 'Brachialis & Forearms', dose: 'reps', load: { start: 14, step: 2 }, trains: ['pull'], sets: 4, reps: '10–15' },
  { id: 'face_pulls', name: 'Cable Face Pulls', category: 'pull', focus: 'Rear Delts & Rotator Cuff', dose: 'reps', load: { start: null, step: 2.5 }, armor: true, trains: ['pull', 'tendon'], sets: 3, reps: '15' },

  /* Legs */
  { id: 'split_squat', name: 'DB Bulgarian Split Squats', category: 'legs', focus: 'Quads & Glutes', dose: 'reps', side: 'leg', lift: 'splitSquat', trains: ['legs'], sets: 3, reps: '8' },
  { id: 'leg_curl', name: 'Seated Leg Curls', category: 'legs', focus: 'Hamstrings', dose: 'reps', lift: 'legCurl', feeds: ['boss_nordic'], trains: ['legs'], sets: 3, reps: '8–12' },
  { id: 'back_squat', name: 'Barbell Back Squat', category: 'legs', focus: 'Quads & Glutes', dose: 'reps', lift: 'backSquat', trains: ['legs'], sets: 4, reps: '5' },
  { id: 'deadlift', name: 'Deadlift', category: 'legs', focus: 'Posterior Chain', dose: 'reps', lift: 'deadlift', trains: ['legs', 'grip'], sets: 3, reps: '5' },
  { id: 'pistol_squats', name: 'Pistol Squats', category: 'legs', focus: 'Single-leg Strength', dose: 'reps', side: 'leg', lift: 'pistolReps', trains: ['legs', 'balance'], sets: 3, reps: '5' },
  { id: 'nordic_negatives', name: 'Nordic Curl Negatives', category: 'legs', focus: 'Hamstrings', dose: 'reps', note: BW, feeds: ['boss_nordic'], trains: ['legs'], sets: 3, reps: '5' },
  { id: 'walking_lunges', name: 'Walking Lunges', category: 'legs', focus: 'Quads & Glutes', dose: 'reps', side: 'leg', load: { start: null, step: 2 }, trains: ['legs', 'endurance'], sets: 3, reps: '10' },
  { id: 'calf_raises', name: 'Standing Calf Raises', category: 'legs', focus: 'Calves', dose: 'reps', load: { start: null, step: 5 }, trains: ['legs', 'tendon'], sets: 3, reps: '12–15' },

  /* Core & compression */
  { id: 'dragon_negatives', name: 'Dragon Flag Negatives', category: 'core', focus: 'Lats & Core', dose: 'reps', note: BW, feeds: ['boss_humanflag'], trains: ['core'], sets: 3, reps: '5–8' },
  { id: 'toes_to_bar', name: 'Hanging Toes-to-Bar', category: 'core', focus: 'Lower Abs', dose: 'reps', note: BW, trains: ['core', 'compression'], sets: 3, reps: '8–12' },
  { id: 'ab_wheel', name: 'Ab Wheel Rollouts', category: 'core', focus: 'Core Anti-Extension', dose: 'reps', note: BW, trains: ['core'], sets: 3, reps: '10–15' },
  { id: 'hanging_leg_raises', name: 'Hanging Leg Raises', category: 'core', focus: 'Lower Abs', dose: 'reps', note: BW, trains: ['core', 'compression'], sets: 3, reps: '10–15' },
  { id: 'v_ups', name: 'V-Ups', category: 'core', focus: 'Compression', dose: 'reps', note: BW, trains: ['core', 'compression'], sets: 3, reps: '12–15' },
  { id: 'pike_compression', name: 'Pike Compression Lifts', category: 'core', focus: 'Active Flexibility', dose: 'reps', note: BW, trains: ['compression'], sets: 3, reps: '10' },
  { id: 'lsit_holds', name: 'L-Sit Holds', category: 'core', focus: 'Core Compression', dose: 'seconds', note: BW, trains: ['compression'], sets: 4, reps: '10–15' },
  { id: 'hollow_hold', name: 'Hollow Body Hold', category: 'core', focus: 'Core Tension', dose: 'seconds', note: BW, trains: ['core'], sets: 3, reps: '30' },
  { id: 'side_plank', name: 'Side Plank', category: 'core', focus: 'Obliques', dose: 'seconds', side: 'side', note: BW, trains: ['core'], sets: 3, reps: '30' },

  /* Skills & holds */
  { id: 'tuck_planche', name: 'Tuck Planche', category: 'skill', focus: 'Planche Skill', dose: 'seconds', note: BW, trains: ['straight', 'balance'], sets: 4, reps: '10' },
  { id: 'planche_leans', name: 'Planche Leans', category: 'skill', focus: 'Straight-arm Push', dose: 'seconds', note: BW, trains: ['straight', 'push'], sets: 4, reps: '15' },
  { id: 'tuck_front_lever', name: 'Tuck Front Lever', category: 'skill', focus: 'Front Lever Skill', dose: 'seconds', note: BW, trains: ['straight', 'core'], sets: 4, reps: '10' },
  { id: 'front_lever_holds', name: 'Front Lever Holds', category: 'skill', focus: 'Front Lever', dose: 'seconds', lift: 'frontLeverHold', trains: ['straight', 'pull'], sets: 4, reps: '5' },
  { id: 'handstand_practice', name: 'Freestanding Handstand Practice', category: 'skill', focus: 'Balance', dose: 'minutes', lift: 'handstandHold', trains: ['balance'], sets: 1, reps: '10' },
  { id: 'wall_handstand', name: 'Chest-to-Wall Handstand', category: 'skill', focus: 'Line & Shoulders', dose: 'seconds', note: BW, trains: ['balance', 'push'], sets: 3, reps: '30' },
  { id: 'lsit_max', name: 'L-Sit Max Hold', category: 'skill', focus: 'Compression Test', dose: 'seconds', lift: 'lsitHold', trains: ['compression', 'core'], sets: 1, reps: '30' },

  /* Grip, tendons & recovery */
  { id: 'feeder_curls', name: 'Cable Feeder Curls', category: 'recovery', focus: 'Tendon flushing', dose: 'continuous', note: 'Lowest weight', armor: true, trains: ['endurance', 'tendon'], sets: 1, reps: '100' },
  { id: 'pushdown_flush', name: 'Cable Tricep Pushdowns (Tendon Flush)', category: 'recovery', focus: 'Zero muscle damage', dose: 'continuous', note: 'Lowest weight', armor: true, trains: ['endurance', 'tendon'], sets: 1, reps: '100' },
  { id: 'bouldering', name: 'Bouldering', category: 'recovery', focus: 'Dynamic Pulling & Grip', dose: 'minutes', note: 'V0–V1 routes', trains: ['grip'], sets: 1, reps: '60–90' },
  { id: 'wrist_curls', name: 'DB Reverse Wrist Curls', category: 'recovery', focus: 'Wrist Tendon Armor', dose: 'reps', load: { start: null, step: 1 }, armor: true, trains: ['grip', 'tendon'], sets: 3, reps: '15–20' },
  { id: 'dead_hang', name: 'Dead Hangs', category: 'recovery', focus: 'Grip & Shoulders', dose: 'seconds', lift: 'hangTime', trains: ['grip', 'tendon'], sets: 3, reps: '30' },
  { id: 'farmers_carry', name: "Farmer's Carry", category: 'recovery', focus: 'Grip & Trunk', dose: 'seconds', load: { start: null, step: 2 }, trains: ['grip', 'core'], sets: 3, reps: '30' },
  { id: 'zone2_cardio', name: 'Zone-2 Cardio', category: 'recovery', focus: 'Aerobic Base', dose: 'minutes', note: 'Easy pace', trains: ['endurance'], sets: 1, reps: '30' },
  { id: 'mobility_flow', name: 'Mobility Flow', category: 'recovery', focus: 'Joints & Range', dose: 'minutes', note: BW, trains: ['tendon'], sets: 1, reps: '15' },

  /* Warm-up & prep */
  { id: 'bw_squats', name: 'Bodyweight Squats', category: 'warmup', focus: 'Warm-up', dose: 'reps', note: BW, trains: [], sets: 2, reps: '10' },
  { id: 'scap_pullups', name: 'Scapular Pull-ups', category: 'warmup', focus: 'Scapula Control', dose: 'reps', note: BW, trains: [], sets: 2, reps: '10' },
  { id: 'scap_pushups', name: 'Scapular Push-ups', category: 'warmup', focus: 'Scapula Control', dose: 'reps', note: BW, trains: [], sets: 2, reps: '15' },
  { id: 'band_dislocates', name: 'Band Shoulder Dislocates', category: 'warmup', focus: 'Shoulder Mobility', dose: 'reps', note: 'Band', trains: [], sets: 2, reps: '10' },
  { id: 'wrist_prep', name: 'Wrist Prep', category: 'warmup', focus: 'Wrist Mobility', dose: 'minutes', note: BW, trains: [], sets: 1, reps: '5' },
  { id: 'easy_routes', name: 'Easy V0–V1 Routes', category: 'warmup', focus: 'Warm-up climbing', dose: 'none', note: 'V0–V1', trains: [], sets: 1, reps: '' },
  { id: 'jump_rope', name: 'Jump Rope', category: 'warmup', focus: 'Heart Rate Up', dose: 'minutes', note: BW, trains: [], sets: 1, reps: '5' },
];

/* ------------------------------------------------------------------ */
/* Milestones — gates judged by the player, claimed on the Bosses tab  */
/* ------------------------------------------------------------------ */

export interface CatalogMilestone {
  id: string;
  name: string;
  description: string;
}

export const MILESTONE_CATALOG: CatalogMilestone[] = [
  { id: 'ms_dragonflag', name: 'Advanced Dragon Flag Holds', description: 'Monday negatives turned into controlled holds. Claim it when you own it.' },
  { id: 'ms_legcurl_stack', name: 'Full Stack Leg Curls', description: 'Every plate on the seated leg curl, for your working reps.' },
  { id: 'ms_backlever', name: 'Back Lever — 5 seconds', description: 'Face-down on the rings or bar, body straight, held for five seconds.' },
  { id: 'ms_oneArmPushup', name: 'One-Arm Push-up — each side', description: 'Chest to fist, feet no wider than shoulders, both arms.' },
  { id: 'ms_handstandWalk', name: 'Handstand Walk — 10 metres', description: 'Ten metres on your hands without coming down.' },
];

/* ------------------------------------------------------------------ */
/* Bosses                                                              */
/* ------------------------------------------------------------------ */

export type CatalogRequirement =
  | { kind: 'lift'; lift: string; label: string; target: number; atGoal?: number }
  | { kind: 'milestone'; milestone: string; label: string }
  | { kind: 'boss'; boss: string; label: string };

export interface CatalogBoss {
  id: string;
  name: string;
  epithet: string;
  branch: Branch;
  requirements: CatalogRequirement[];
}

export const BOSS_CATALOG: CatalogBoss[] = [
  {
    id: 'boss_planche',
    name: 'The Full Planche',
    epithet: 'Straight arms, body parallel to the floor',
    branch: 'push',
    requirements: [
      { kind: 'lift', lift: 'dips', label: 'Weighted Dips', target: 55, atGoal: 60 },
      { kind: 'lift', lift: 'inclineBench', label: 'Incline Bench', target: 100, atGoal: 115 },
      { kind: 'lift', lift: 'dbPress', label: 'Seated DB Press', target: 36, atGoal: 38 },
      { kind: 'boss', boss: 'boss_hspu', label: 'Handstand Push-up conquered' },
    ],
  },
  { id: 'boss_frontlever', name: 'The Full Front Lever', epithet: 'Horizontal hang, rigid from shoulders to toes', branch: 'pull', requirements: [{ kind: 'lift', lift: 'cableRow', label: 'Seated Cable Row x 10', target: 100 }] },
  { id: 'boss_hspu', name: 'The Handstand Push-up', epithet: 'Press 1.0x bodyweight overhead', branch: 'push', requirements: [{ kind: 'lift', lift: 'dbPress', label: 'Seated DB Press x 8 (30–32 kg)', target: 30 }] },
  { id: 'boss_pullup_engine', name: 'The 15-Rep Pull-up Engine', epithet: 'Endurance milestone', branch: 'pull', requirements: [{ kind: 'lift', lift: 'pullUpReps', label: 'Strict Pull-ups', target: 15 }] },
  { id: 'boss_pushup_engine', name: 'The 70-Rep Push-up Engine', epithet: 'Endurance milestone', branch: 'push', requirements: [{ kind: 'lift', lift: 'pushUpReps', label: 'Push-ups in one set', target: 70 }] },
  { id: 'boss_nordic', name: 'The Nordic Hamstring Curl', epithet: 'Lowered and raised by the hamstrings alone', branch: 'legs', requirements: [{ kind: 'milestone', milestone: 'ms_legcurl_stack', label: 'Full weight stack on Seated Leg Curls' }] },
  { id: 'boss_pistol', name: 'The Weighted Pistol Squat', epithet: 'One leg, loaded, full depth', branch: 'legs', requirements: [{ kind: 'lift', lift: 'splitSquat', label: 'Bulgarian Split Squats (per DB)', target: 32 }] },
  {
    id: 'boss_humanflag',
    name: 'The Human Flag',
    epithet: 'A side lever on a vertical pole',
    branch: 'core',
    requirements: [
      { kind: 'milestone', milestone: 'ms_dragonflag', label: 'Advanced Dragon Flag holds' },
      { kind: 'lift', lift: 'cableRow', label: 'Seated Cable Row', target: 100 },
    ],
  },
  {
    id: 'boss_muscleup',
    name: 'The Strict Muscle-Up',
    epithet: 'No kip. Pull, transition, press.',
    branch: 'pull',
    requirements: [
      { kind: 'lift', lift: 'chinUps', label: 'Weighted Chin-ups', target: 20 },
      { kind: 'lift', lift: 'dips', label: 'Weighted Dips', target: 30 },
      { kind: 'boss', boss: 'boss_pullup_engine', label: 'The 15-Rep Pull-up Engine cleared' },
    ],
  },
  { id: 'boss_oap', name: 'One Clean One-Arm Pull-Up', epithet: 'The last test of vertical pulling', branch: 'pull', requirements: [{ kind: 'lift', lift: 'chinUps', label: 'Weighted Chin-ups', target: 55 }] },
  { id: 'boss_muscleup_ten', name: 'The Muscle-up Ten', epithet: 'Ten strict muscle-ups in one set', branch: 'pull', requirements: [{ kind: 'lift', lift: 'muscleUpReps', label: 'Strict Muscle-ups', target: 10 }] },
  { id: 'boss_handstand', name: 'The Freestanding Handstand', epithet: 'One full minute, no wall', branch: 'push', requirements: [{ kind: 'lift', lift: 'handstandHold', label: 'Freestanding Handstand', target: 60 }] },
  {
    id: 'boss_backlever',
    name: 'The Back Lever',
    epithet: 'Face-down horizontal hang',
    branch: 'pull',
    requirements: [
      { kind: 'milestone', milestone: 'ms_backlever', label: 'Back Lever held for 5 seconds' },
      { kind: 'lift', lift: 'chinUps', label: 'Weighted Chin-ups', target: 15 },
    ],
  },
  {
    id: 'boss_oap_pushup',
    name: 'The One-Arm Push-up',
    epithet: 'Chest to fist, one hand, both sides',
    branch: 'push',
    requirements: [
      { kind: 'milestone', milestone: 'ms_oneArmPushup', label: 'One-arm push-up on each side' },
      { kind: 'lift', lift: 'pushUpReps', label: 'Push-ups in one set', target: 40 },
    ],
  },
  { id: 'boss_pistol_bw', name: 'The Bodyweight Pistol Ten', epithet: 'Ten pistols on each leg', branch: 'legs', requirements: [{ kind: 'lift', lift: 'pistolReps', label: 'Pistol Squats per leg', target: 10 }] },
  { id: 'boss_lsit', name: 'The 30-Second L-Sit', epithet: 'Legs straight, hips locked', branch: 'core', requirements: [{ kind: 'lift', lift: 'lsitHold', label: 'L-Sit Hold', target: 30 }] },
  { id: 'boss_front_lever_hold', name: 'The 10-Second Front Lever', epithet: 'Full lever, held', branch: 'pull', requirements: [{ kind: 'lift', lift: 'frontLeverHold', label: 'Front Lever Hold', target: 10 }] },
  { id: 'boss_deadlift_2x', name: 'The Double-Bodyweight Deadlift', epithet: 'Twice your bodyweight off the floor', branch: 'legs', requirements: [{ kind: 'lift', lift: 'deadlift', label: 'Deadlift', target: 132, atGoal: 150 }] },
  { id: 'boss_bw_bench', name: 'The Bodyweight Bench', epithet: 'Your own weight on the bar', branch: 'push', requirements: [{ kind: 'lift', lift: 'benchPress', label: 'Barbell Bench Press', target: 66, atGoal: 75 }] },
  { id: 'boss_dead_hang', name: 'The Two-Minute Hang', epithet: 'Grip that will not let go', branch: 'pull', requirements: [{ kind: 'lift', lift: 'hangTime', label: 'Dead Hang', target: 120 }] },
  {
    id: 'boss_handstand_walk',
    name: 'The Handstand Walk',
    epithet: 'Ten metres upside down',
    branch: 'push',
    requirements: [
      { kind: 'milestone', milestone: 'ms_handstandWalk', label: 'Ten metres walked on your hands' },
      { kind: 'boss', boss: 'boss_handstand', label: 'The Freestanding Handstand cleared' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Skill trees                                                         */
/* ------------------------------------------------------------------ */

export interface CatalogTier {
  id: string;
  rung: string;
  name: string;
  subtitle: string;
  gates: { lift: string; target: number; atGoal?: number }[];
}

export interface CatalogTree {
  id: string;
  name: string;
  tagline: string;
  branch: Branch;
  bossLabel: string;
  tiers: CatalogTier[];
}

export const TREE_CATALOG: CatalogTree[] = [
  {
    id: 'planche',
    name: 'The Planche Tree',
    tagline: 'Straight-arm pushing. Gates rise with every kilo you gain.',
    branch: 'push',
    bossLabel: 'Final Boss',
    tiers: [
      { id: 'planche_0', rung: 'Level 0', name: 'Pre-Tuck', subtitle: 'Frog Stand · Planche Lean · Pseudo Planche Push-ups', gates: [] },
      { id: 'planche_1', rung: 'Level 1', name: 'Tuck Planche', subtitle: 'Knees to chest, hips level with shoulders', gates: [{ lift: 'dips', target: 10, atGoal: 15 }, { lift: 'inclineBench', target: 50, atGoal: 60 }, { lift: 'dbPress', target: 16, atGoal: 18 }] },
      { id: 'planche_2', rung: 'Level 2', name: 'Advanced Tuck', subtitle: 'Back flat, hips open', gates: [{ lift: 'dips', target: 25, atGoal: 30 }, { lift: 'inclineBench', target: 70, atGoal: 80 }, { lift: 'dbPress', target: 22, atGoal: 24 }] },
      { id: 'planche_3', rung: 'Level 3', name: 'Straddle Planche', subtitle: 'Legs straight and wide', gates: [{ lift: 'dips', target: 40, atGoal: 45 }, { lift: 'inclineBench', target: 85, atGoal: 95 }, { lift: 'dbPress', target: 28, atGoal: 30 }] },
      { id: 'planche_final', rung: 'Final Boss', name: 'Full Planche', subtitle: 'Legs together, body parallel to the floor', gates: [{ lift: 'dips', target: 55, atGoal: 60 }, { lift: 'inclineBench', target: 100, atGoal: 115 }, { lift: 'dbPress', target: 36, atGoal: 38 }] },
    ],
  },
  {
    id: 'frontlever',
    name: 'The Front Lever Tree',
    tagline: 'Six months of row periodization, 60 kg to 100 kg.',
    branch: 'pull',
    bossLabel: 'Level 20 Boss',
    tiers: [
      { id: 'lever_1', rung: 'Phase 1', name: 'Hypertrophy Base', subtitle: 'Months 1–2 · 4 x 8–12 reps · push 60 → 75 kg', gates: [{ lift: 'cableRow', target: 75 }] },
      { id: 'lever_2', rung: 'Phase 2', name: 'Heavy Tension', subtitle: 'Months 3–4 · 4 x 5–8 reps · push 75 → 85 kg', gates: [{ lift: 'cableRow', target: 85 }] },
      { id: 'lever_3', rung: 'Level 20 Boss', name: 'Absolute Strength', subtitle: 'Months 5–6 · 3 x 4–6 reps + 1 back-off set · 100 kg for 10', gates: [{ lift: 'cableRow', target: 100 }] },
    ],
  },
  {
    id: 'handstand',
    name: 'The Handstand Tree',
    tagline: 'Press 1.0x bodyweight overhead. The key that unseals the planche.',
    branch: 'push',
    bossLabel: 'Level 30 Boss',
    tiers: [
      { id: 'hs_1', rung: 'Tier 1', name: 'Year-One Press', subtitle: 'The year-one iron checkpoint, for 8 reps', gates: [{ lift: 'dbPress', target: 24 }] },
      { id: 'hs_2', rung: 'Level 30 Boss', name: 'Handstand Push-up Gate', subtitle: 'The lower edge of the 30–32 kg checkpoint, for 8 reps', gates: [{ lift: 'dbPress', target: 30 }] },
      { id: 'hs_3', rung: 'Mastery', name: 'Bodyweight Overhead', subtitle: 'The upper edge of the checkpoint — 1.0x bodyweight locked in', gates: [{ lift: 'dbPress', target: 32 }] },
    ],
  },
  {
    id: 'muscleup',
    name: 'The Muscle-up Tree',
    tagline: 'From pull-ups to clean, strict muscle-ups.',
    branch: 'pull',
    bossLabel: 'Final Boss',
    tiers: [
      { id: 'mu_1', rung: 'Level 1', name: 'Ten Strict Pull-ups', subtitle: 'The base every muscle-up stands on', gates: [{ lift: 'pullUpReps', target: 10 }] },
      { id: 'mu_2', rung: 'Level 2', name: 'Loaded Chin-ups', subtitle: '+15 kg for reps', gates: [{ lift: 'chinUps', target: 15 }] },
      { id: 'mu_3', rung: 'Level 3', name: 'The First Muscle-up', subtitle: 'One clean rep, no kip', gates: [{ lift: 'muscleUpReps', target: 1 }] },
      { id: 'mu_4', rung: 'Final Boss', name: 'Five in a Row', subtitle: 'Five strict muscle-ups in one set', gates: [{ lift: 'muscleUpReps', target: 5 }] },
    ],
  },
  {
    id: 'pistol',
    name: 'The Pistol Tree',
    tagline: 'Single-leg strength, then load on top of it.',
    branch: 'legs',
    bossLabel: 'Final Boss',
    tiers: [
      { id: 'pistol_1', rung: 'Level 1', name: 'Loaded Split Squats', subtitle: '16 kg dumbbells for 8 per leg', gates: [{ lift: 'splitSquat', target: 16 }] },
      { id: 'pistol_2', rung: 'Level 2', name: 'The First Pistol', subtitle: 'One rep each leg, heel down', gates: [{ lift: 'pistolReps', target: 1 }] },
      { id: 'pistol_3', rung: 'Level 3', name: 'Pistol Five', subtitle: 'Five reps each leg', gates: [{ lift: 'pistolReps', target: 5 }] },
      { id: 'pistol_4', rung: 'Final Boss', name: 'Heavy Split Squats', subtitle: '32 kg dumbbells — ready for a loaded pistol', gates: [{ lift: 'splitSquat', target: 32 }] },
    ],
  },
  {
    id: 'balance',
    name: 'The Balance Tree',
    tagline: 'From the wall to a minute in the middle of the room.',
    branch: 'push',
    bossLabel: 'Final Boss',
    tiers: [
      { id: 'balance_1', rung: 'Level 1', name: 'Ten Seconds Free', subtitle: 'Ten seconds without the wall', gates: [{ lift: 'handstandHold', target: 10 }] },
      { id: 'balance_2', rung: 'Level 2', name: 'Thirty Seconds', subtitle: 'Half a minute, stacked', gates: [{ lift: 'handstandHold', target: 30 }] },
      { id: 'balance_3', rung: 'Final Boss', name: 'The Minute', subtitle: 'Sixty seconds, freestanding', gates: [{ lift: 'handstandHold', target: 60 }] },
    ],
  },
  {
    id: 'engine',
    name: 'The Engine Tree',
    tagline: 'Reps on reps — pull-ups and push-ups for volume.',
    branch: 'pull',
    bossLabel: 'Final Boss',
    tiers: [
      { id: 'engine_1', rung: 'Level 1', name: 'Warming Up', subtitle: '8 pull-ups · 30 push-ups', gates: [{ lift: 'pullUpReps', target: 8 }, { lift: 'pushUpReps', target: 30 }] },
      { id: 'engine_2', rung: 'Level 2', name: 'Running Hot', subtitle: '12 pull-ups · 50 push-ups', gates: [{ lift: 'pullUpReps', target: 12 }, { lift: 'pushUpReps', target: 50 }] },
      { id: 'engine_3', rung: 'Final Boss', name: 'Redline', subtitle: '15 pull-ups · 70 push-ups', gates: [{ lift: 'pullUpReps', target: 15 }, { lift: 'pushUpReps', target: 70 }] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Tendon armor                                                        */
/* ------------------------------------------------------------------ */

export interface CatalogArmor {
  id: string;
  slot: string;
  drill: string;
  when: string;
}

export const ARMOR_CATALOG: CatalogArmor[] = [
  { id: 'armor_elbows', slot: 'Elbows', drill: 'Supinated holds on rings & straight-arm cable hold finishes', when: 'Finish your pull sessions with them' },
  { id: 'armor_wrists', slot: 'Wrists', drill: 'DB Reverse Wrist Curls — 15–20 reps', when: 'On bouldering days' },
  { id: 'armor_shoulders', slot: 'Shoulders', drill: 'Cable Face Pulls to anchor the rotator cuff', when: 'Before you press' },
  { id: 'armor_fingers', slot: 'Fingers', drill: 'Finger extensions with a band, 3 x 20', when: 'After bouldering or hangs' },
  { id: 'armor_knees', slot: 'Knees', drill: 'Slow tempo step-downs and tibialis raises', when: 'After leg day' },
  { id: 'armor_ankles', slot: 'Ankles', drill: 'Calf raises off a step, slow on the way down', when: 'Before squats and pistols' },
];

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((item) => [item.id, item]));

export const LIFT_BY_ID = byId(LIFT_CATALOG);
export const EXERCISE_BY_ID = byId(EXERCISE_CATALOG);
export const MILESTONE_BY_ID = byId(MILESTONE_CATALOG);
export const BOSS_BY_ID = byId(BOSS_CATALOG);
export const TREE_BY_ID = byId(TREE_CATALOG);
export const ARMOR_BY_ID = byId(ARMOR_CATALOG);
