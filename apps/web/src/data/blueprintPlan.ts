/**
 * The Hybrid Calisthenics Engine — the Master Workout & Progression Blueprint
 * as choices from the catalog. Every account starts on this plan and can change
 * it from the Plan tab.
 *
 * Exercise ids (mon_split, tue_chin, …) are kept from the first version of the
 * campaign so ticks already saved under them still count. Where the blueprint
 * says "log it" instead of giving a starting number, the baseline is left empty.
 */

import { PlanSpec, PlanSpecV2, blankSpec, normalizeSpec, resolvePlan } from '../utils/campaignPlan';

const BOSS_IDS = [
  'boss_planche',
  'boss_frontlever',
  'boss_hspu',
  'boss_pullup_engine',
  'boss_pushup_engine',
  'boss_nordic',
  'boss_pistol',
  'boss_humanflag',
  'boss_muscleup',
  'boss_oap',
];

export const BLUEPRINT_SPEC_V2: PlanSpecV2 = {
  version: 2,
  name: 'The Hybrid Calisthenics Engine',

  bodyweight: { start: 66, goal: 75, weeklyChangeKg: 0.3, proteinGrams: 140, calories: '+300–400 kcal' },

  lifts: [
    { lift: 'dips', baseline: 10, endgame: 60 },
    { lift: 'inclineBench', baseline: 45, endgame: 115 },
    { lift: 'dbPress', baseline: 14, endgame: 38 },
    { lift: 'cableRow', baseline: 60, endgame: 100 },
    { lift: 'chinUps', baseline: 6, endgame: 55 },
    { lift: 'pullUpReps', baseline: 4, endgame: 15 },
    { lift: 'pushUpReps', baseline: null, endgame: 70 },
    { lift: 'splitSquat', baseline: null, endgame: 32 },
    { lift: 'legCurl', baseline: null, endgame: null },
  ],

  days: [
    {
      id: 'mon',
      title: 'Legs & Core',
      kind: 'legs',
      warmUps: [
        { exercise: 'bw_squats', sets: 2, reps: '10' },
        { exercise: 'hollow_hold', sets: 2, reps: '15' },
      ],
      exercises: [
        { id: 'mon_split', exercise: 'split_squat', sets: 3, reps: '8' },
        { id: 'mon_legcurl', exercise: 'leg_curl', sets: 3, reps: '8–12' },
        { id: 'mon_dragon', exercise: 'dragon_negatives', sets: 3, reps: '5–8' },
        { id: 'mon_ttb', exercise: 'toes_to_bar', sets: 3, reps: '8–12' },
        { id: 'mon_abwheel', exercise: 'ab_wheel', sets: 3, reps: '10–15' },
      ],
    },
    {
      id: 'tue',
      title: 'Pull 1 — Back & Biceps',
      kind: 'pull',
      warmUps: [
        { exercise: 'scap_pullups', sets: 2, reps: '10' },
        { exercise: 'tuck_front_lever', sets: 2, reps: '5' },
      ],
      exercises: [
        { id: 'tue_pullups', exercise: 'bw_pullups', sets: 1, reps: '4–5' },
        { id: 'tue_chin', exercise: 'weighted_chins', sets: 4, reps: '5–8' },
        { id: 'tue_row', exercise: 'cable_row', sets: 4, reps: '8–12' },
        { id: 'tue_pecdeck', exercise: 'reverse_pec_deck', sets: 3, reps: '12–15' },
        { id: 'tue_curl', exercise: 'cable_curl', sets: 4, reps: '8–12' },
      ],
    },
    {
      id: 'wed',
      title: 'Active Recovery',
      kind: 'recovery',
      purpose: 'All bosses · Tendon armor. Flush the tendons, do zero muscle damage.',
      warmUps: [],
      exercises: [
        { id: 'wed_feeder', exercise: 'feeder_curls', sets: 1, reps: '100' },
        { id: 'wed_pushdown', exercise: 'pushdown_flush', sets: 1, reps: '100' },
      ],
    },
    {
      id: 'thu',
      title: 'Push 1 — Chest & Triceps',
      kind: 'push',
      warmUps: [
        { exercise: 'scap_pushups', sets: 2, reps: '15' },
        { exercise: 'tuck_planche', sets: 2, reps: '5' },
      ],
      exercises: [
        { id: 'thu_dips', exercise: 'weighted_dips', sets: 4, reps: '5–8' },
        { id: 'thu_bench', exercise: 'incline_bench', sets: 4, reps: '8–12' },
        { id: 'thu_pushdown', exercise: 'tricep_pushdown', sets: 3, reps: '10–15' },
        { id: 'thu_pushups', exercise: 'pushups_amrap', sets: 1, reps: 'max' },
      ],
    },
    {
      id: 'fri',
      title: 'Total Rest',
      kind: 'rest',
      purpose: 'All bosses · Growth phase. 0 sets, 0 reps — a full central nervous system reset.',
      warmUps: [],
      exercises: [],
    },
    {
      id: 'sat',
      title: 'Pull 2 — Dynamic Pull',
      kind: 'pull',
      warmUps: [{ exercise: 'easy_routes', sets: 1, reps: '' }],
      exercises: [
        { id: 'sat_pullups', exercise: 'pullups_amrap', sets: 1, reps: 'max' },
        { id: 'sat_boulder', exercise: 'bouldering', sets: 1, reps: '60–90' },
        { id: 'sat_wrist', exercise: 'wrist_curls', sets: 3, reps: '15–20' },
      ],
    },
    {
      id: 'sun',
      title: 'Push 2 — Shoulders',
      kind: 'push',
      warmUps: [{ exercise: 'face_pulls', sets: 2, reps: '15' }],
      exercises: [
        { id: 'sun_press', exercise: 'db_press', sets: 4, reps: '6–10' },
        { id: 'sun_lateral', exercise: 'lateral_raise', sets: 4, reps: '12–15' },
        { id: 'sun_hammer', exercise: 'hammer_curl', sets: 4, reps: '10–15' },
        { id: 'sun_overhead', exercise: 'overhead_extension', sets: 4, reps: '10–15' },
        { id: 'sun_lsit', exercise: 'lsit_holds', sets: 4, reps: '10–15' },
      ],
    },
  ],

  armor: ['armor_elbows', 'armor_wrists', 'armor_shoulders'],

  bosses: BOSS_IDS.map((boss) => ({ boss })),

  trees: [{ tree: 'planche', cleared: ['planche_0', 'planche_1'] }, { tree: 'frontlever' }, { tree: 'handstand' }],

  acts: [
    {
      id: 'act_1',
      name: 'The Road to 70',
      tagline: 'Twelve weeks of surplus. Phase 1 boss: 70 kg on the scale.',
      goals: [
        { id: 'bw_m1', kind: 'weight', label: 'Month 1', kg: 67.3, week: 4 },
        { id: 'bw_m2', kind: 'weight', label: 'Month 2', kg: 68.6, week: 8 },
        { id: 'bw_m3', kind: 'weight', label: 'Phase 1 Boss', kg: 70, week: 12 },
      ],
    },
    {
      id: 'act_2',
      name: 'Year One Iron',
      tagline: 'November 2027. Five lifts, 8 reps minimum each.',
      goals: [
        { id: 'y1_bench', kind: 'lift', lift: 'inclineBench', label: 'Barbell Incline Bench Press', target: 80 },
        { id: 'y1_dips', kind: 'lift', lift: 'dips', label: 'Weighted Dips', target: 30 },
        { id: 'y1_row', kind: 'lift', lift: 'cableRow', label: 'Seated Cable Rows', target: 80 },
        { id: 'y1_chin', kind: 'lift', lift: 'chinUps', label: 'Weighted Chin-ups', target: 20 },
        { id: 'y1_press', kind: 'lift', lift: 'dbPress', label: 'Seated DB Overhead Press', target: 24 },
      ],
    },
    {
      id: 'act_3',
      name: 'The Final Ascent',
      tagline: '75 kg of lean muscle, and the ten bosses that guard it.',
      goals: [
        { id: 'bw_final', kind: 'weight', label: 'Final Boss', kg: 75 },
        ...BOSS_IDS.map((boss) => ({ id: `goal_${boss}`, kind: 'boss' as const, boss })),
      ],
    },
  ],
};

/** The blueprint in the current format, converted the same way a stored v2 plan is. */
export const BLUEPRINT_SPEC: PlanSpec = normalizeSpec(BLUEPRINT_SPEC_V2, blankSpec(BLUEPRINT_SPEC_V2.bodyweight.start));

/** The blueprint as the game reads it. */
export const BLUEPRINT_PLAN = resolvePlan(BLUEPRINT_SPEC);
