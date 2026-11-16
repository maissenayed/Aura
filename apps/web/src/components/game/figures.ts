import type { Boss, Lift } from '../../utils/campaignPlan';
import { resolveExerciseId } from '../../data/exerciseAliases';
import { boulderingFigure } from '../skilltree/boulderingFigures';
import { calisthenicsFigure } from '../skilltree/calisthenicsFigures';
import { gymFigure } from '../skilltree/gymFigures';
import type { FigureSpec } from '../skilltree/SkillFigure';

/**
 * Finds a drawing for anything the campaign shows: a catalogue exercise, a
 * tracked lift or a boss. Skill-tree exercises (calisthenics `ex_*`, gym and
 * `bld_*` ids) already have their own figure; the hand-written campaign
 * exercises and the bosses borrow the closest skill's.
 */

/** Campaign exercise or lift → the calisthenics skill that looks like it. */
const CALISTHENICS_LOOKALIKE: Record<string, string> = {
  // Push
  weighted_dips: 'ex_27',
  bw_dips: 'ex_27',
  dips: 'ex_27',
  dipReps: 'ex_27',
  hspu: 'ex_92',
  hspuReps: 'ex_92',
  pike_pushups: 'ex_1',
  diamond_pushups: 'ex_26',
  archer_pushups: 'ex_431',
  pseudo_planche_pushups: 'ex_430',
  planche_leans: 'ex_430',
  pushups_amrap: 'ex_7',
  pushUpReps: 'ex_7',
  // Pull
  bw_pullups: 'ex_23',
  pullups_amrap: 'ex_23',
  pullUpReps: 'ex_23',
  weighted_chins: 'ex_23',
  chinUps: 'ex_23',
  weighted_pullups: 'ex_23',
  weightedPullUps: 'ex_23',
  muscle_ups: 'ex_112',
  muscleUpReps: 'ex_112',
  archer_pullups: 'ex_377',
  australian_rows: 'ex_22',
  front_lever_raises: 'ex_37',
  scap_pullups: 'ex_380',
  dead_hang: 'ex_383',
  hangTime: 'ex_383',
  // Legs
  pistol_squats: 'ex_81',
  pistolReps: 'ex_81',
  nordic_negatives: 'ex_192',
  bw_squats: 'ex_11',
  // Core
  dragon_negatives: 'ex_161',
  toes_to_bar: 'ex_60',
  hanging_leg_raises: 'ex_60',
  v_ups: 'ex_134',
  pike_compression: 'ex_42',
  lsit_holds: 'ex_42',
  lsit_max: 'ex_42',
  lsitHold: 'ex_42',
  hollow_hold: 'ex_441',
  side_plank: 'ex_386',
  // Skills
  tuck_planche: 'ex_105',
  tuck_front_lever: 'ex_67',
  front_lever_holds: 'ex_67',
  frontLeverHold: 'ex_205',
  handstand_practice: 'ex_62',
  handstandHold: 'ex_62',
  wall_handstand: 'ex_17',
};

/** Campaign exercise or lift → a gym-tree drawing. */
const GYM_LOOKALIKE: Record<string, string> = {
  inclineBench: 'incline_bench',
  dbPress: 'db_press',
  benchPress: 'bench_press',
  overheadPress: 'overhead_press',
  cableRow: 'cable_row',
  barbellRow: 'barbell_row',
  latPulldown: 'lat_pulldown',
  splitSquat: 'split_squat',
  legCurl: 'leg_curl',
  backSquat: 'back_squat',
  feeder_curls: 'cable_curl',
  pushdown_flush: 'tricep_pushdown',
  ab_wheel: 'gym_ab_wheel',
};

const BOULDERING_LOOKALIKE: Record<string, string> = {
  bouldering: 'bld_silent_feet',
  easy_routes: 'bld_silent_feet',
  boulder_limit: 'bld_silent_feet',
  boulder_volume: 'bld_edging',
  boulder_flash: 'bld_high_step',
  boulder_technique: 'bld_silent_feet',
  boulder_hangboard: 'bld_hangboard',
  boulder_campus: 'bld_campus_move',
};

/** Each boss is drawn as the skill it guards. */
const BOSS_LOOKALIKE: Record<string, string> = {
  boss_planche: 'ex_299',
  boss_frontlever: 'ex_205',
  boss_front_lever_hold: 'ex_205',
  boss_hspu: 'ex_92',
  boss_pullup_engine: 'ex_23',
  boss_pushup_engine: 'ex_7',
  boss_nordic: 'ex_192',
  boss_pistol: 'ex_81',
  boss_pistol_bw: 'ex_81',
  boss_humanflag: 'ex_221',
  boss_muscleup: 'ex_112',
  boss_muscleup_ten: 'ex_112',
  boss_oap: 'ex_379',
  boss_handstand: 'ex_62',
  boss_handstand_walk: 'ex_62',
  boss_backlever: 'ex_172',
  boss_oap_pushup: 'ex_215',
  boss_lsit: 'ex_42',
  boss_dead_hang: 'ex_383',
};
const BOSS_GYM: Record<string, string> = {
  boss_deadlift_2x: 'gym_deadlift_2x',
  boss_bw_bench: 'gym_bench_bodyweight',
};

/** A plain standing squat — the figure of last resort. */
const FALLBACK = 'ex_11';
const BRANCH_FALLBACK: Record<string, string> = { push: 'ex_7', pull: 'ex_23', legs: 'ex_11', core: 'ex_42' };

const cache = new Map<string, FigureSpec | undefined>();

function lookup(given: string): FigureSpec | undefined {
  const id = resolveExerciseId(given);
  if (cache.has(id)) return cache.get(id);
  const spec =
    calisthenicsFigure(id) ??
    gymFigure(id) ??
    boulderingFigure(id) ??
    (CALISTHENICS_LOOKALIKE[id] ? calisthenicsFigure(CALISTHENICS_LOOKALIKE[id]) : undefined) ??
    (GYM_LOOKALIKE[id] ? gymFigure(GYM_LOOKALIKE[id]) : undefined) ??
    (BOULDERING_LOOKALIKE[id] ? boulderingFigure(BOULDERING_LOOKALIKE[id]) : undefined);
  cache.set(id, spec);
  return spec;
}

/** A drawing for a catalogue exercise id (the `exercise` field of a plan exercise). */
export function figureForExercise(exerciseId: string, branch?: string): FigureSpec {
  return lookup(exerciseId) ?? calisthenicsFigure(BRANCH_FALLBACK[branch ?? ''] ?? FALLBACK)!;
}

export function figureForLift(lift: Pick<Lift, 'id' | 'branch'>): FigureSpec {
  return figureForExercise(lift.id, lift.branch);
}

export function figureForBoss(boss: Pick<Boss, 'id' | 'branch'>): FigureSpec {
  const id = BOSS_LOOKALIKE[boss.id];
  const gym = BOSS_GYM[boss.id];
  return (
    (id ? calisthenicsFigure(id) : undefined) ??
    (gym ? gymFigure(gym) : undefined) ??
    calisthenicsFigure(BRANCH_FALLBACK[boss.branch] ?? FALLBACK)!
  );
}

/** Tints for the three states every node can be in, plus bosses. */
export const FIGURE_TINT = {
  mastered: { body: '#ffd37a', far: '#9b7a35' },
  ready: { body: '#eef2ff', far: '#8a93b0' },
  locked: { body: '#4a5470', far: '#2f364b' },
  boss: { body: '#ff8fa3', far: '#8e3a4b' },
  slain: { body: '#ffd37a', far: '#9b7a35' },
  sealed: { body: '#56607a', far: '#353d54' },
} as const;
