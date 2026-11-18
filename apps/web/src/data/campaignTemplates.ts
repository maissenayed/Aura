import { blankSpec, normalizeSpec, type DayId, type DayKind, type PlanSpec } from '../utils/campaignPlan';
import type { ActV3, ArmorSlot, BossSpec, SpecDayV3, TowerSpec } from '../utils/campaignV3';

/**
 * The campaigns a new athlete can start from: calisthenics, bodybuilding and
 * bouldering. Each is a common weekly split for its sport, ten bosses across
 * push, pull, core and legs, three towers on the real skill trees, and a map
 * of three acts. Everything is a catalogue or skill-tree id, and the Forge can
 * change any of it afterwards.
 */

export type TemplateId = 'calisthenics' | 'bodybuilding' | 'bouldering';

export interface CampaignTemplate {
  id: TemplateId;
  name: string;
  sport: string;
  tagline: string;
  /** The week at a glance, e.g. "Push · Pull · Legs · Upper · Lower". */
  split: string;
  trainingDays: number;
  /** A few of the bosses, to show on the card. */
  bossNames: string[];
  build: (bodyWeightKg: number, goalKg: number) => PlanSpec;
}

type Dose = [exercise: string, sets: number, reps: string];

function day(id: DayId, kind: DayKind, title: string, purpose: string, warmUps: Dose[], exercises: Dose[]): SpecDayV3 {
  return {
    id,
    kind,
    title,
    purpose,
    warmUps: warmUps.map(([exercise, sets, reps]) => ({ id: `${id}_warm_${exercise}`, exercise, sets, reps })),
    exercises: exercises.map(([exercise, sets, reps]) => ({ id: `${id}_${exercise}`, exercise, sets, reps })),
  };
}

const rest = (id: DayId, title = 'Rest', purpose = 'Full rest. Growth happens today.'): SpecDayV3 => day(id, 'rest', title, purpose, [], []);

/** Bosses that are all goals of one act, in order. */
const bossGoals = (ids: string[]) => ids.map((boss) => ({ id: `goal_${boss}`, kind: 'boss' as const, boss }));

function spec(
  name: string,
  bodyWeightKg: number,
  goalKg: number,
  parts: { days: SpecDayV3[]; armor: ArmorSlot[]; bosses: BossSpec[]; trees: TowerSpec[]; acts: ActV3[] },
): PlanSpec {
  const raw: PlanSpec = {
    ...blankSpec(bodyWeightKg),
    name,
    bodyweight: { start: bodyWeightKg, goal: goalKg, weeklyChangeKg: 0.25, proteinGrams: null, calories: '' },
    lifts: [],
    ...parts,
  };
  // The normaliser adds what the choices need (each boss's lift, say) and makes the numbers safe.
  return normalizeSpec(raw, blankSpec(bodyWeightKg));
}

/* ------------------------------------------------------------------ */
/* Calisthenics                                                        */
/* ------------------------------------------------------------------ */

const CALISTHENICS: CampaignTemplate = {
  id: 'calisthenics',
  name: 'Bodyweight Foundations',
  sport: 'Calisthenics',
  tagline: 'From your first strict pull-up to the muscle-up, the handstand and the dragon flag.',
  split: 'Push · Pull · Recovery · Legs & Core · Push Skills · Pull Skills',
  trainingDays: 5,
  bossNames: ['The 10-Rep Pull-up Engine', 'The Strict Muscle-Up', 'The Freestanding Handstand'],
  build: (bw, goal) =>
    spec('Bodyweight Foundations', bw, goal, {
      armor: ['wrists', 'shoulders', 'elbows', 'knees'],
      days: [
        day('mon', 'push', 'Push — Strength', 'Dips and push-ups for pressing strength.', [['scap_pushups', 2, '15'], ['wrist_prep', 1, '5']], [
          ['bw_dips', 3, '8–12'],
          ['pike_pushups', 3, '8–12'],
          ['diamond_pushups', 3, '10–15'],
          ['wall_handstand', 3, '30'],
          ['hollow_hold', 3, '30'],
        ]),
        day('tue', 'pull', 'Pull — Strength', 'Pull-ups and rows: the base of every pulling skill.', [['scap_pullups', 2, '10'], ['band_dislocates', 2, '10']], [
          ['pullups_amrap', 1, 'max'],
          ['australian_rows', 3, '10–15'],
          ['tuck_front_lever', 4, '10'],
          ['dead_hang', 3, '30'],
        ]),
        day('wed', 'recovery', 'Mobility & Tendons', 'Easy movement only: no muscle damage today.', [], [
          ['mobility_flow', 1, '15'],
          ['zone2_cardio', 1, '30'],
        ]),
        day('thu', 'legs', 'Legs & Core', 'Single-leg strength, hamstrings and compression.', [['bw_squats', 2, '10'], ['jump_rope', 1, '5']], [
          ['pistol_squats', 3, '5'],
          ['walking_lunges', 3, '10'],
          ['nordic_negatives', 3, '5'],
          ['lsit_holds', 4, '10–15'],
          ['side_plank', 3, '30'],
        ]),
        day('fri', 'push', 'Push — Skills', 'Handstand balance and straight-arm pressing.', [['wrist_prep', 1, '5'], ['scap_pushups', 2, '15']], [
          ['handstand_practice', 1, '10'],
          ['planche_leans', 4, '15'],
          ['archer_pushups', 3, '5'],
          ['pushups_amrap', 1, 'max'],
        ]),
        day('sat', 'pull', 'Pull — Skills', 'Explosive pulls and the core that holds them.', [['scap_pullups', 2, '10'], ['band_dislocates', 2, '10']], [
          ['bw_pullups', 4, '4–5'],
          ['front_lever_raises', 3, '5'],
          ['toes_to_bar', 3, '8–12'],
          ['dragon_negatives', 3, '5–8'],
        ]),
        rest('sun'),
      ],
      bosses: [
        { id: 'cal_pushups', name: 'The 30-Rep Push-up Gauntlet', category: 'push', kind: 'reps', exercise: 'ex_7', target: 30 },
        { id: 'cal_dips', name: 'The 15-Rep Dip Warden', category: 'push', kind: 'reps', exercise: 'ex_50', target: 15 },
        { id: 'cal_handstand', name: 'The Freestanding Handstand', category: 'push', kind: 'skill', tree: 'calisthenics', skill: 'ex_62' },
        { id: 'cal_pullups', name: 'The 10-Rep Pull-up Engine', category: 'pull', kind: 'reps', exercise: 'ex_45', target: 10 },
        { id: 'cal_front_lever', name: 'The Tuck Front Lever', category: 'pull', kind: 'skill', tree: 'calisthenics', skill: 'ex_67' },
        { id: 'cal_muscle_up', name: 'The Strict Muscle-Up', category: 'pull', kind: 'skill', tree: 'calisthenics', skill: 'ex_112', after: ['cal_pullups', 'cal_dips'] },
        { id: 'cal_lsit', name: 'The L-Sit', category: 'core', kind: 'skill', tree: 'calisthenics', skill: 'ex_42' },
        { id: 'cal_dragon_flag', name: 'The Dragon Flag', category: 'core', kind: 'skill', tree: 'calisthenics', skill: 'ex_161', after: ['cal_lsit'] },
        { id: 'cal_pistol', name: 'The Pistol Squat', category: 'legs', kind: 'skill', tree: 'calisthenics', skill: 'ex_81' },
        { id: 'cal_nordic', name: 'The Nordic Curl', category: 'legs', kind: 'skill', tree: 'calisthenics', skill: 'ex_158' },
      ],
      trees: [
        { id: 'cal_tower_handstand', name: 'The Handstand Tower', tree: 'calisthenics', summit: 'ex_90' },
        { id: 'cal_tower_muscle_up', name: 'The Muscle-Up Tower', tree: 'calisthenics', summit: 'ex_112' },
        { id: 'cal_tower_pistol', name: 'The Pistol Tower', tree: 'calisthenics', summit: 'ex_81' },
      ],
      acts: [
        {
          id: 'act_1',
          name: 'Foundations',
          tagline: 'Clean reps on the basics before any skill.',
          goals: [
            { id: 'goal_pushups_20', kind: 'record', exercise: 'ex_7', target: 20, label: '20 push-ups' },
            { id: 'goal_pullups_5', kind: 'record', exercise: 'ex_45', target: 5, label: '5 pull-ups' },
            { id: 'goal_tuck_lsit', kind: 'skill', tree: 'calisthenics', skill: 'ex_2' },
            { id: 'goal_wall_handstand', kind: 'skill', tree: 'calisthenics', skill: 'ex_39' },
          ],
        },
        {
          id: 'act_2',
          name: 'First Skills',
          tagline: 'Strength turns into your first real skills.',
          goals: bossGoals(['cal_pushups', 'cal_dips', 'cal_pullups', 'cal_lsit', 'cal_front_lever', 'cal_pistol']),
        },
        {
          id: 'act_3',
          name: 'The Summit',
          tagline: 'The skills people stop to watch.',
          goals: [...bossGoals(['cal_handstand', 'cal_muscle_up', 'cal_dragon_flag', 'cal_nordic']), { id: 'goal_tower_handstand', kind: 'tower', tower: 'cal_tower_handstand' }],
        },
      ],
    }),
};

/* ------------------------------------------------------------------ */
/* Bodybuilding                                                        */
/* ------------------------------------------------------------------ */

const BODYBUILDING: CampaignTemplate = {
  id: 'bodybuilding',
  name: 'Machine to Barbell',
  sport: 'Bodybuilding',
  tagline: 'Start on the machines, build muscle, and earn the big barbell lifts.',
  split: 'Push · Pull · Legs · Rest · Upper · Lower · Rest',
  trainingDays: 5,
  bossNames: ['The Chest Press Golem', 'The Iron Bench', 'The Deadlift Dragon'],
  build: (bw, goal) =>
    spec('Machine to Barbell', bw, goal, {
      armor: ['shoulders', 'elbows', 'knees'],
      days: [
        day('mon', 'push', 'Push — Chest, Shoulders & Triceps', 'Machines first: load the muscle safely while the form settles.', [['band_dislocates', 2, '10'], ['scap_pushups', 2, '15']], [
          ['machine_chest_press', 3, '8–12'],
          ['incline_db_press', 3, '8–12'],
          ['machine_shoulder_press', 3, '8–12'],
          ['lateral_raise', 3, '12–15'],
          ['pec_deck', 3, '12–15'],
          ['tricep_pushdown', 3, '10–15'],
        ]),
        day('tue', 'pull', 'Pull — Back & Biceps', 'A heavy pull from the floor, then the back from every angle.', [['scap_pullups', 2, '10'], ['face_pulls', 2, '15']], [
          ['deadlift', 3, '5'],
          ['lat_pulldown', 3, '8–12'],
          ['machine_row', 3, '8–12'],
          ['db_row', 3, '8–12'],
          ['reverse_pec_deck', 3, '12–15'],
          ['machine_preacher_curl', 3, '8–12'],
        ]),
        day('wed', 'legs', 'Legs — Machines', 'Quads, hamstrings and glutes on the machines.', [['bw_squats', 2, '10'], ['jump_rope', 1, '5']], [
          ['leg_press', 4, '8–12'],
          ['leg_extension', 3, '12–15'],
          ['leg_curl', 3, '8–12'],
          ['hip_abduction', 3, '15'],
          ['calf_raises', 4, '12–15'],
          ['ab_crunch_machine', 3, '15'],
        ]),
        rest('thu'),
        day('fri', 'push', 'Upper — Strength', 'The bench and the row, heavier, plus arms.', [['band_dislocates', 2, '10'], ['scap_pushups', 2, '15']], [
          ['bench_press', 4, '5–8'],
          ['cable_row', 4, '8–12'],
          ['db_press', 3, '8–10'],
          ['barbell_curl', 3, '8–12'],
          ['skull_crusher', 3, '8–12'],
          ['face_pulls', 3, '15'],
        ]),
        day('sat', 'legs', 'Lower — Strength', 'The squat, then single legs and calves.', [['bw_squats', 2, '10'], ['jump_rope', 1, '5']], [
          ['back_squat', 4, '5'],
          ['hack_squat', 3, '8–12'],
          ['walking_lunges', 3, '10'],
          ['seated_calf_raise', 3, '15'],
          ['captains_chair', 3, '12'],
        ]),
        rest('sun'),
      ],
      bosses: [
        { id: 'bb_chest_press', name: 'The Chest Press Golem', category: 'push', kind: 'bodyweight', mode: 'multiple', exercise: 'machine_chest_press', multiple: 1 },
        { id: 'bb_bench', name: 'The Iron Bench', category: 'push', kind: 'bodyweight', mode: 'multiple', exercise: 'bench_press', multiple: 1, after: ['bb_chest_press'] },
        { id: 'bb_overhead', name: 'The Overhead Titan', category: 'push', kind: 'skill', tree: 'calisthenics', skill: 'overhead_press' },
        { id: 'bb_pulldown', name: 'The Pulldown Warden', category: 'pull', kind: 'bodyweight', mode: 'multiple', exercise: 'lat_pulldown', multiple: 1 },
        { id: 'bb_row', name: 'The Row Beast', category: 'pull', kind: 'bodyweight', mode: 'multiple', exercise: 'cable_row', multiple: 1 },
        { id: 'bb_curl', name: 'The Curl Colossus', category: 'pull', kind: 'bodyweight', mode: 'multiple', exercise: 'barbell_curl', multiple: 0.5 },
        { id: 'bb_leg_press', name: 'The Leg Press Giant', category: 'legs', kind: 'bodyweight', mode: 'multiple', exercise: 'leg_press', multiple: 2.5 },
        { id: 'bb_squat', name: 'The Squat King', category: 'legs', kind: 'bodyweight', mode: 'multiple', exercise: 'back_squat', multiple: 1.5, after: ['bb_leg_press'] },
        { id: 'bb_deadlift', name: 'The Deadlift Dragon', category: 'legs', kind: 'bodyweight', mode: 'multiple', exercise: 'deadlift', multiple: 2 },
        { id: 'bb_leg_raise', name: 'The Hanging Leg Raise', category: 'core', kind: 'skill', tree: 'calisthenics', skill: 'gym_hanging_leg_raise' },
      ],
      trees: [
        { id: 'bb_tower_bench', name: 'The Bench Press Tower', tree: 'calisthenics', summit: 'gym_bench_1_5x' },
        { id: 'bb_tower_squat', name: 'The Squat Tower', tree: 'calisthenics', summit: 'gym_squat_2x' },
        { id: 'bb_tower_deadlift', name: 'The Deadlift Tower', tree: 'calisthenics', summit: 'gym_deadlift_2_5x' },
      ],
      acts: [
        {
          id: 'act_1',
          name: 'Machine Foundations',
          tagline: 'Learn every machine and load them with confidence.',
          goals: [
            { id: 'goal_chest_press_bw', kind: 'skill', tree: 'calisthenics', skill: 'machine_chest_press_bw' },
            { id: 'goal_leg_press_2x', kind: 'skill', tree: 'calisthenics', skill: 'leg_press_2x' },
            ...bossGoals(['bb_chest_press', 'bb_pulldown']),
          ],
        },
        {
          id: 'act_2',
          name: 'Free-Weight Strength',
          tagline: 'The barbell and dumbbells take over.',
          goals: bossGoals(['bb_bench', 'bb_row', 'bb_curl', 'bb_leg_press', 'bb_leg_raise']),
        },
        {
          id: 'act_3',
          name: 'The Big Three',
          tagline: 'Squat, deadlift and press like a lifter.',
          // The 1.5× bodyweight bench tower is a second-year climb: it stays on the Towers tab, off the first year's map.
          goals: bossGoals(['bb_squat', 'bb_deadlift', 'bb_overhead']),
        },
      ],
    }),
};

/* ------------------------------------------------------------------ */
/* Bouldering                                                          */
/* ------------------------------------------------------------------ */

const BOULDERING: CampaignTemplate = {
  id: 'bouldering',
  name: 'Send Season',
  sport: 'Bouldering',
  tagline: 'Footwork, body position and finger strength, from your first V2 to the campus board.',
  split: 'Technique · Strength · Antagonists · Power · Rest · Project · Recovery',
  trainingDays: 5,
  bossNames: ['The Heel Hook', 'The Dyno', 'The Campus Board'],
  build: (bw, goal) =>
    spec('Send Season', bw, goal, {
      armor: ['fingers', 'elbows', 'shoulders', 'wrists'],
      days: [
        day('mon', 'pull', 'Climb — Technique', 'Quiet feet and good body position on easy problems.', [['easy_routes', 1, ''], ['wrist_prep', 1, '5']], [
          ['boulder_technique', 1, '15'],
          ['boulder_volume', 1, '15'],
          ['hanging_leg_raises', 3, '10–15'],
        ]),
        day('tue', 'pull', 'Strength — Fingers & Pull', 'Fingers and pulling strength, fresh and short.', [['scap_pullups', 2, '10'], ['easy_routes', 1, '']], [
          ['boulder_hangboard', 6, '10'],
          ['pullups_amrap', 1, 'max'],
          ['front_lever_raises', 3, '5'],
          ['wrist_curls', 3, '15–20'],
        ]),
        day('wed', 'recovery', 'Antagonists & Mobility', 'Push the other way to keep the shoulders and elbows healthy.', [['band_dislocates', 2, '10']], [
          ['pushups_amrap', 1, 'max'],
          ['face_pulls', 3, '15'],
          ['mobility_flow', 1, '15'],
        ]),
        day('thu', 'pull', 'Climb — Power', 'Hard moves at your limit, with full rest between tries.', [['easy_routes', 1, ''], ['scap_pullups', 2, '10']], [
          ['boulder_limit', 1, '45'],
          ['boulder_flash', 1, '5'],
          ['lsit_holds', 3, '10–15'],
        ]),
        rest('fri', 'Rest', 'Skin and tendons recover today.'),
        day('sat', 'pull', 'Climb — Project Day', 'Your project, then volume to finish.', [['easy_routes', 1, ''], ['wrist_prep', 1, '5']], [
          ['bld_projecting', 1, '30'],
          ['boulder_flash', 1, '5'],
          ['boulder_volume', 1, '15'],
        ]),
        day('sun', 'recovery', 'Recovery', 'Easy cardio and mobility only.', [], [
          ['zone2_cardio', 1, '30'],
          ['mobility_flow', 1, '15'],
        ]),
      ],
      bosses: [
        { id: 'bld_boss_heel_hook', name: 'The Heel Hook', category: 'legs', kind: 'skill', tree: 'bouldering', skill: 'bld_heel_hook' },
        { id: 'bld_boss_dyno', name: 'The Dyno', category: 'legs', kind: 'skill', tree: 'bouldering', skill: 'bld_dyno' },
        { id: 'bld_boss_drop_knee', name: 'The Drop Knee', category: 'core', kind: 'skill', tree: 'bouldering', skill: 'bld_drop_knee' },
        { id: 'bld_boss_tension', name: 'Body Tension', category: 'core', kind: 'skill', tree: 'bouldering', skill: 'bld_body_tension' },
        { id: 'bld_boss_mantle', name: 'The Mantle', category: 'push', kind: 'skill', tree: 'bouldering', skill: 'bld_mantle' },
        { id: 'bld_boss_pushups', name: 'The 25-Rep Push-up Antagonist', category: 'push', kind: 'reps', exercise: 'ex_7', target: 25 },
        { id: 'bld_boss_gaston', name: 'The Gaston', category: 'pull', kind: 'skill', tree: 'bouldering', skill: 'bld_gaston' },
        { id: 'bld_boss_hangboard', name: 'The Hangboard', category: 'pull', kind: 'skill', tree: 'bouldering', skill: 'bld_hangboard' },
        { id: 'bld_boss_campus', name: 'The Campus Board', category: 'pull', kind: 'skill', tree: 'bouldering', skill: 'bld_campus_move', after: ['bld_boss_hangboard'] },
        { id: 'bld_boss_pullups', name: 'The 10-Rep Pull-up Engine', category: 'pull', kind: 'reps', exercise: 'ex_45', target: 10 },
      ],
      trees: [
        { id: 'bld_tower_hooks', name: 'The Hook Tower', tree: 'bouldering', summit: 'bld_heel_toe_cam' },
        { id: 'bld_tower_dyno', name: 'The Dyno Tower', tree: 'bouldering', summit: 'bld_double_dyno' },
        { id: 'bld_tower_crimp', name: 'The Crimp Tower', tree: 'bouldering', summit: 'bld_full_crimp' },
      ],
      acts: [
        {
          id: 'act_1',
          name: 'First Sends',
          tagline: 'Climb with your feet, not your arms.',
          goals: [
            { id: 'goal_silent_feet', kind: 'skill', tree: 'bouldering', skill: 'bld_silent_feet' },
            { id: 'goal_flag', kind: 'skill', tree: 'bouldering', skill: 'bld_flagging' },
            { id: 'goal_hip_turn', kind: 'skill', tree: 'bouldering', skill: 'bld_hip_turn' },
            ...bossGoals(['bld_boss_heel_hook', 'bld_boss_mantle']),
          ],
        },
        {
          id: 'act_2',
          name: 'Moving Up',
          tagline: 'Turns, tension and the first big moves.',
          goals: bossGoals(['bld_boss_drop_knee', 'bld_boss_gaston', 'bld_boss_tension', 'bld_boss_dyno', 'bld_boss_pushups']),
        },
        {
          id: 'act_3',
          name: 'Strong Fingers',
          tagline: 'Board strength for the hardest problems in the gym.',
          goals: [...bossGoals(['bld_boss_hangboard', 'bld_boss_campus', 'bld_boss_pullups']), { id: 'goal_tower_crimp', kind: 'tower', tower: 'bld_tower_crimp' }],
        },
      ],
    }),
};

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [CALISTHENICS, BODYBUILDING, BOULDERING];
