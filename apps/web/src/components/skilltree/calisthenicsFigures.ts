import { FigureSpec } from './SkillFigure';
import {
  abWheel,
  archHang,
  archerPushUp,
  backBridge,
  backLever,
  barPullover,
  chestToBar,
  dip,
  dragonFlag,
  elbowLever,
  floorCore,
  freeHeadstandPushUp,
  frogStand,
  frontLever,
  frontRingDip,
  gluteBridge,
  hamstringSlide,
  handstand,
  hangingRaise,
  humanFlag,
  kipPullUp,
  kneelingQuad,
  lPullUp,
  lSit,
  muscleUp,
  nordic,
  oneArmPushUp,
  overheadPress,
  pelicanCurl,
  pikePress,
  pistol,
  plank,
  planche,
  pressToHandstand,
  pullUp,
  pushUp,
  reversePlank,
  reverseHyper,
  ringLPull,
  ringsHandstand,
  ringsHandstandPushUp,
  rotation,
  row,
  shrimp,
  sidePlank,
  sideSquat,
  splitLeg,
  squat,
  straddleLSit,
  support,
  verticalFlag,
  wallHandstand,
  wallHeadstand,
  wallPlank,
  wallPress,
} from './calisthenicsFamilies';

/**
 * Which drawing each calisthenics exercise gets: a movement family from
 * `calisthenicsFamilies.ts` with the options that make it this exercise.
 * Keyed by exercise id from the built-in dataset; an exercise without an
 * entry has no drawing. Covers levels 1–6 (Beginner and Intermediate).
 */

/* ------------------------------------------------------------------ */
/* Levels 1–3                                                          */
/* ------------------------------------------------------------------ */

const BEGINNER: Record<string, () => FigureSpec> = {
  // Push-ups
  ex_7: () => pushUp(),
  ex_429: () => pushUp({ grip: 'diamond' }),
  ex_26: () => pushUp({ grip: 'diamond' }),
  ex_430: () => pushUp({ grip: 'pseudo' }),
  ex_49: () => pushUp({ rings: true }),
  ex_431: () => archerPushUp(),

  // Pike and headstand presses
  ex_427: () => pikePress(),
  ex_428: () => pikePress({ box: true }),
  ex_18: () => pikePress({ box: true, toHead: true }),
  ex_1: () => pikePress({ toHead: true }),

  // Upside down at the wall
  ex_0: () => wallPress(),
  ex_426: () => wallPress(),
  ex_423: () => wallPress('slow-return'),
  ex_40: () => wallPress('slow-return'),
  ex_17: () => wallHandstand(false),
  ex_39: () => wallHandstand(true),
  ex_420: wallHeadstand,
  ex_419: wallPlank,
  ex_48: () => frogStand(),

  // Dips
  ex_8: () => dip({ extra: 'floor' }),
  ex_27: () => dip({ tempo: 'slow-return' }),
  ex_50: () => dip(),
  ex_29: () => dip({ extra: 'band' }),
  ex_52: () => dip({ extra: 'plate' }),
  ex_402: () => dip({ rings: true }),
  ex_51: () => dip({ rings: true, tempo: 'slow-return' }),
  ex_396: () => dip({ rings: true, tempo: 'slow-return' }),
  ex_403: () => dip({ rings: true, depth: 'partial' }),

  // Supports
  ex_9: () => support(),
  ex_28: () => support({ turnedOut: true }),
  ex_395: () => support({ turnedOut: true }),
  ex_385: () => support({ rings: false, press: true }),

  // Pull-ups
  ex_5: () => pullUp({ extra: 'jump' }),
  ex_23: () => pullUp({ tempo: 'slow-return' }),
  ex_381: () => pullUp({ tempo: 'slow-return' }),
  ex_45: () => pullUp(),
  ex_24: () => pullUp({ extra: 'band' }),
  ex_46: () => pullUp({ extra: 'plate' }),
  ex_47: () => pullUp({ kind: 'explosive' }),
  ex_380: () => pullUp({ kind: 'scapular' }),

  // Side-on bar work
  ex_383: archHang,
  ex_384: chestToBar,
  ex_25: () => kipPullUp(),
  ex_382: () => muscleUp(),
  ex_53: () => muscleUp('slow-return'),

  // Hanging leg work
  ex_367: () => hangingRaise('l-hang'),
  ex_37: () => hangingRaise('straight-raise'),
  ex_60: () => hangingRaise('knees-to-bar'),
  ex_375: ringLPull,

  // Rotations on rings
  ex_3: () => rotation('german-hang'),
  ex_21: () => rotation('skin-the-cat'),
  ex_366: () => rotation('full-turn'),
  ex_31: () => rotation('backward-roll'),
  ex_362: () => rotation('tuck-levers'),
  ex_374: () => rotation('cross-to-back-lever'),

  // Levers
  ex_365: () => frontLever('tuck'),
  ex_363: () => frontLever('one-leg'),
  ex_43: () => backLever('tuck'),
  ex_359: () => backLever('one-leg'),

  // Rows
  ex_4: () => row({ tempo: 'slow-return' }),
  ex_22: () => row({ rings: true }),
  ex_44: () => row(),
  ex_368: () => row({ angle: 'upright', rings: true }),
  ex_369: () => row({ angle: 'incline', rings: true }),

  // Squats and single leg
  ex_11: () => squat('parallel'),
  ex_32: () => squat('full'),
  ex_55: sideSquat,
  ex_14: () => splitLeg('lunge'),
  ex_35: () => splitLeg('chair'),
  ex_58: () => shrimp('beginner'),

  // Bridges and slides
  ex_12: () => gluteBridge('two-legs'),
  ex_33: () => gluteBridge('shoulders-raised'),
  ex_56: () => gluteBridge('one-leg'),
  ex_407: () => gluteBridge('hands-under'),
  ex_13: () => hamstringSlide(false),
  ex_34: () => hamstringSlide(true, 'slow-return'),
  ex_57: () => hamstringSlide(true),
  ex_36: () => reverseHyper('tuck'),
  ex_59: () => reverseHyper('right-angle'),

  // Core on the floor
  ex_15: () => floorCore('tuck-raise'),
  ex_16: () => floorCore('post-tuck'),
  ex_38: () => floorCore('post-leg-raise'),
  ex_61: () => floorCore('tuck-lowering'),
  ex_2: () => lSit('tuck'),
  ex_20: () => lSit('one-leg'),
  ex_42: () => lSit('straight'),
  ex_30: () => plank('25s'),
  ex_54: () => plank('60s'),
  ex_386: sidePlank,
  ex_406: () => reversePlank('reverse-plank'),
  ex_408: () => reversePlank('table'),
  ex_404: () => backBridge('head'),
  ex_405: () => backBridge('one-arm'),
  ex_387: verticalFlag,

  // Weighted press
  ex_19: () => overheadPress(5),
  ex_41: () => overheadPress(6.5),
};

/* ------------------------------------------------------------------ */
/* Levels 4–6                                                          */
/* ------------------------------------------------------------------ */

const INTERMEDIATE: Record<string, () => FigureSpec> = {
  // Push-ups
  ex_75: () => pushUp({ rings: true }),
  ex_107: () => pushUp({ rings: true, turnedOut: true }),
  ex_432: () => archerPushUp({ rings: true }),
  ex_145: () => archerPushUp({ rings: true, turnedOut: true }),
  ex_433: () => oneArmPushUp('bench'),
  ex_108: () => oneArmPushUp('box'),
  ex_146: () => oneArmPushUp('straddle'),

  // Planche
  ex_73: () => planche({ legs: 'straight-frog' }),
  ex_105: () => planche({ legs: 'tuck' }),
  ex_142: () => planche({ legs: 'advanced-tuck' }),
  ex_144: () => planche({ legs: 'tuck', press: true }),
  ex_74: () => frogStand({ rings: true }),
  ex_106: () => planche({ legs: 'straight-frog', rings: true }),
  ex_143: () => planche({ legs: 'tuck', rings: true }),

  // Dips
  ex_76: () => dip({ legs: 'l-sit' }),
  ex_109: () => dip({ lean: true }),
  ex_147: () => dip({ oneArm: true, legs: 'pike' }),
  ex_89: () => dip({ depth: 'forearms' }),
  ex_77: () => dip({ rings: true }),
  ex_110: () => dip({ rings: true, legs: 'l-sit' }),
  ex_397: () => dip({ rings: true, turnedOut: true }),
  ex_148: () => frontRingDip('wide'),
  ex_398: () => frontRingDip('bulgarian'),
  ex_78: () => dip({ extra: 'plate', plate: 6 }),
  ex_111: () => dip({ extra: 'plate', plate: 7 }),
  ex_149: () => dip({ extra: 'plate', plate: 8 }),

  // Pull-ups
  ex_102: () => pullUp({ rings: true, wide: true }),
  ex_104: () => pullUp({ kind: 'clap' }),
  ex_376: () => pullUp({ kind: 'typewriter' }),
  ex_377: () => pullUp({ kind: 'archer' }),
  ex_378: () => pullUp({ kind: 'one-arm' }),
  ex_71: () => pullUp({ extra: 'plate', plate: 6 }),
  ex_103: () => pullUp({ extra: 'plate', plate: 7 }),
  ex_140: () => pullUp({ extra: 'plate', plate: 8 }),
  ex_69: () => lPullUp(),
  ex_70: () => lPullUp({ rings: true }),
  ex_139: () => lPullUp({ rings: true }),
  ex_141: () => lPullUp({ clap: true }),
  ex_72: () => kipPullUp({ clap: true }),
  ex_101: barPullover,

  // Muscle-ups
  ex_79: () => muscleUp(undefined, true),
  ex_112: () => muscleUp(),
  ex_150: () => muscleUp(),

  // Rings: kips and felges
  ex_155: () => rotation('kip-to-support'),
  ex_117: () => rotation('felge-tuck'),
  ex_156: () => rotation('felge-pike'),

  // Levers
  ex_67: () => frontLever('tuck'),
  ex_98: () => frontLever('advanced-tuck'),
  ex_136: () => frontLever('straddle'),
  ex_364: () => frontLever('straddle'),
  ex_99: () => frontLever('tuck', { rows: true }),
  ex_137: () => frontLever('advanced-tuck', { rows: true }),
  ex_66: () => backLever('advanced-tuck'),
  ex_97: () => backLever('straddle'),
  ex_135: () => backLever('half-lay'),

  // Rows
  ex_68: () => row({ rings: true, arms: 'archer' }),
  ex_100: () => row({ angle: 'incline', rings: true, arms: 'archer' }),
  ex_138: () => row({ rings: true, arms: 'one' }),
  ex_370: () => row({ angle: 'upright', rings: true, arms: 'archer' }),
  ex_371: () => row({ angle: 'upright', rings: true, arms: 'one' }),

  // Arms
  ex_125: () => pelicanCurl(true),
  ex_162: () => pelicanCurl(false),

  // Handstands and presses
  ex_62: () => handstand('kick'),
  ex_90: () => handstand('hold'),
  ex_127: () => handstand('one-arm-prep'),
  ex_424: () => ringsHandstand('shoulder-stand'),
  ex_91: () => ringsHandstand('shoulder-stand'),
  ex_425: () => ringsHandstand('handstand'),
  ex_128: () => ringsHandstand('strap'),
  ex_63: () => wallPress(),
  ex_92: () => wallPress(),
  ex_129: freeHeadstandPushUp,
  ex_421: () => ringsHandstandPushUp('wide'),
  ex_422: () => ringsHandstandPushUp('strap'),
  ex_94: () => pressToHandstand('bent-arm'),
  ex_131: () => pressToHandstand('l-sit'),
  ex_95: () => pressToHandstand('wall-straddle'),
  ex_133: () => pressToHandstand('elevated-straddle'),
  ex_132: () => pressToHandstand('chair'),
  ex_64: () => overheadPress(7),
  ex_93: () => overheadPress(8),
  ex_130: () => overheadPress(9),

  // Core
  ex_87: () => dragonFlag('advanced-tuck'),
  ex_124: () => dragonFlag('one-leg-straddle'),
  ex_161: () => dragonFlag('full'),
  ex_86: () => hangingRaise('straddle-toes'),
  ex_123: () => hangingRaise('wipers'),
  ex_160: () => hangingRaise('toes-to-bar', { ankleWeights: true }),
  ex_65: () => straddleLSit(),
  ex_96: () => lSit('straight', { rings: true, turnedOut: true }),
  ex_116: () => lSit('straight', { rings: true, turnedOut: true }),
  ex_154: () => straddleLSit({ rings: true }),
  ex_134: () => lSit('v-sit'),
  ex_113: () => elbowLever(),
  ex_151: () => elbowLever({ rings: true }),
  ex_388: () => elbowLever({ oneArmToHandstand: true }),
  ex_114: () => humanFlag('tuck'),
  ex_152: () => humanFlag('advanced-tuck'),
  ex_80: () => abWheel('one-arm-leg-plank'),
  ex_115: () => abWheel('knees'),
  ex_153: () => abWheel('ramp'),
  ex_409: () => backBridge('angled'),
  ex_410: () => backBridge('wheel'),

  // Legs
  ex_81: () => pistol(),
  ex_118: () => pistol(4),
  ex_157: () => pistol(5),
  ex_84: () => shrimp('intermediate'),
  ex_121: () => shrimp('advanced'),
  ex_159: () => shrimp('two-hands'),
  ex_82: () => gluteBridge('shoulders-one-leg'),
  ex_119: () => gluteBridge('weighted'),
  ex_83: () => nordic('hinge'),
  ex_120: () => nordic('eccentric'),
  ex_158: () => nordic('full'),
  ex_88: () => kneelingQuad('leg-extension'),
  ex_126: () => kneelingQuad('sissy'),
  ex_163: () => kneelingQuad('matrix'),
  ex_85: () => reverseHyper('straight'),
  ex_122: () => reverseHyper('straight', { weighted: true }),
};

const FIGURES: Record<string, () => FigureSpec> = { ...BEGINNER, ...INTERMEDIATE };

/** Built on first use: over two hundred figures, most of which a visit never shows. */
const built = new Map<string, FigureSpec>();

export function calisthenicsFigure(id: string): FigureSpec | undefined {
  const make = FIGURES[id];
  if (!make) return undefined;
  let spec = built.get(id);
  if (!spec) {
    spec = make();
    built.set(id, spec);
  }
  return spec;
}

export const CALISTHENICS_FIGURE_IDS = Object.keys(FIGURES);
