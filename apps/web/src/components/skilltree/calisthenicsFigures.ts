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
  hefesto,
  hamstringSlide,
  handstand,
  hangingRaise,
  humanFlag,
  ironCross,
  kipPullUp,
  kneelingQuad,
  leverToPlanche,
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
  ringsToSupport,
  ropeClimb,
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
  victorian,
  vSit,
  wallHandstand,
  wallHeadstand,
  wallPlank,
  wallPress,
} from './calisthenicsFamilies';

/**
 * Which drawing each calisthenics exercise gets: a movement family from
 * `calisthenicsFamilies.ts` with the options that make it this exercise.
 * Keyed by exercise id from the built-in dataset; an exercise without an
 * entry has no drawing. Covers levels 1–10 (Beginner, Intermediate and Advanced).
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
  ex_109: () => dip({ lean: 45 }),
  ex_147: () => dip({ oneArm: true, legs: 'pike' }),
  ex_89: () => dip({ depth: 'forearms', shoulders: 'front-of-wrist' }),
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
  ex_378: () => pullUp({ kind: 'one-arm', tempo: 'slow-return' }),
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
  ex_132: () => pressToHandstand('chair', { rings: true }),
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

/* ------------------------------------------------------------------ */
/* Levels 7–10                                                         */
/* ------------------------------------------------------------------ */

const ADVANCED: Record<string, () => FigureSpec> = {
  // Push-ups
  ex_435: () => oneArmPushUp('floor'),
  ex_215: () => oneArmPushUp('floor'),
  ex_436: () => oneArmPushUp('floor', { rings: true }),
  ex_246: () => oneArmPushUp('floor', { rings: true }),
  ex_434: () => oneArmPushUp('straddle', { rings: true }),
  ex_180: () => oneArmPushUp('straddle', { rings: true }),
  ex_179: () => pushUp({ grip: 'pseudo', lean: 0.4, rings: true, turnedOut: true }),
  ex_214: () => pushUp({ grip: 'pseudo', lean: 0.65, rings: true, turnedOut: true }),
  ex_245: () => pushUp({ grip: 'pseudo', lean: 1, rings: true, turnedOut: true }),
  ex_275: () => pushUp({ grip: 'pseudo', lean: 0.5, feetUp: true }),

  // Planche
  ex_210: () => planche({ legs: 'straddle' }),
  ex_244: () => planche({ legs: 'half-lay' }),
  ex_212: () => planche({ legs: 'advanced-tuck', press: true }),
  ex_273: () => planche({ legs: 'straddle', press: true }),
  ex_211: () => planche({ legs: 'advanced-tuck', rings: true }),
  ex_272: () => planche({ legs: 'straddle', rings: true }),
  ex_213: () => planche({ legs: 'tuck', rings: true, press: true }),
  ex_274: () => planche({ legs: 'advanced-tuck', rings: true, press: true }),

  // Dips
  ex_181: () => dip({ oneArm: true, legs: 'pike' }),
  ex_216: () => dip({ oneArm: true, legs: 'straight' }),
  ex_247: () => dip({ oneArm: true, legs: 'straight' }),
  ex_197: () => dip({ depth: 'forearms', shoulders: 'behind-wrist' }),
  ex_230: () => dip({ depth: 'forearms', shoulders: 'above-elbow' }),
  ex_287: () => dip({ depth: 'forearms', shoulders: 'behind-elbow' }),
  ex_182: () => dip({ rings: true, turnedOut: true, lean: 45 }),
  ex_400: () => dip({ rings: true, turnedOut: true, lean: 45 }),
  ex_217: () => dip({ rings: true, turnedOut: true, lean: 75 }),
  ex_248: () => dip({ rings: true, turnedOut: true, lean: 90 }),
  ex_401: () => dip({ rings: true, turnedOut: true, lean: 90 }),
  ex_276: () => dip({ rings: true, turnedOut: true, lean: 120 }),
  ex_399: () => frontRingDip('wide'),
  ex_183: () => dip({ extra: 'plate', plate: 9 }),
  ex_218: () => dip({ extra: 'plate', plate: 10 }),
  ex_249: () => dip({ extra: 'plate', plate: 11 }),
  ex_277: () => dip({ extra: 'plate', plate: 12 }),

  // Pull-ups
  ex_379: () => pullUp({ kind: 'one-arm' }),
  ex_240: () => pullUp({ kind: 'one-arm' }),
  ex_207: () => pullUp({ kind: 'one-arm', tempo: 'slow-return' }),
  ex_268: () => pullUp({ kind: 'one-arm', extra: 'plate', plate: 4.5 }),
  ex_176: () => pullUp({ kind: 'archer', rings: true }),
  ex_270: () => pullUp({ kind: 'slap' }),
  ex_177: () => pullUp({ extra: 'plate', plate: 9 }),
  ex_208: () => pullUp({ extra: 'plate', plate: 10 }),
  ex_241: () => pullUp({ extra: 'plate', plate: 11 }),
  ex_269: () => pullUp({ extra: 'plate', plate: 12 }),
  ex_178: () => kipPullUp({ behindBack: true }),
  ex_209: () => lPullUp({ slap: 'abs' }),
  ex_242: () => lPullUp({ slap: 'thighs' }),
  ex_175: () => row({ rings: true, arms: 'one' }),
  ex_174: ropeClimb,

  // Muscle-ups and ring transitions
  ex_184: () => muscleUp(),
  ex_250: () => muscleUp(undefined, false, true),
  ex_219: leverToPlanche,
  ex_278: () => ringsToSupport({ start: 'inverted-straight', direction: 'backward' }),
  ex_190: () => ringsToSupport({ start: 'inverted-pike', end: 'l', direction: 'backward' }),
  ex_282: () => ringsToSupport({ start: 'inverted-straight' }),
  ex_189: () => ringsToSupport({ start: 'german', direction: 'backward' }),
  ex_281: () => ringsToSupport({ start: 'german', end: 'l', direction: 'backward' }),
  ex_253: () => ringsToSupport({ start: 'inverted-pike', end: 'l' }),
  ex_227: () => hefesto({ tempo: 'slow-return' }),
  ex_256: () => hefesto(),
  ex_284: () => hefesto({ from: 'back-lever' }),
  ex_195: () => pelicanCurl(false, { feetUp: true }),

  // Levers
  ex_173: () => frontLever('one-leg'),
  ex_205: () => frontLever('full'),
  ex_223: () => frontLever('full', { rings: true }),
  ex_238: () => frontLever('full', { toInverted: 'from-lever' }),
  ex_266: () => frontLever('full', { toInverted: 'from-hang' }),
  ex_360: () => frontLever('full', { toInverted: 'from-hang' }),
  ex_206: () => frontLever('straddle', { rows: true }),
  ex_239: () => frontLever('straddle', { rows: true }),
  ex_267: () => frontLever('full', { rows: true }),
  ex_372: () => frontLever('tuck', { rows: true, rings: true }),
  ex_172: () => backLever('full'),
  ex_188: () => backLever('full', { rings: true }),
  ex_229: () => backLever('full', { oneArm: true }),
  ex_204: () => backLever('full', { from: 'pullout' }),
  ex_237: () => backLever('full', { from: 'german-pullout' }),
  ex_265: () => backLever('full', { from: 'pull-up' }),
  ex_361: () => backLever('tuck', { from: 'pull-up' }),

  // Rings statics
  ex_243: () => ironCross({ partial: true }),
  ex_271: () => ironCross(),
  ex_280: () => ironCross(),
  ex_257: () => victorian('hold'),
  ex_285: () => victorian('press'),

  // Handstands and presses
  ex_165: () => freeHeadstandPushUp({ fromTop: true }),
  ex_259: () => handstand('one-arm'),
  ex_414: () => handstand('tuck'),
  ex_164: () => ringsHandstand('hold'),
  ex_166: () => ringsHandstandPushUp('wide'),
  ex_231: () => ringsHandstandPushUp('wide'),
  ex_198: () => ringsHandstandPushUp('strap'),
  ex_168: () => pressToHandstand('bent-arm'),
  ex_200: () => pressToHandstand('straight-body'),
  ex_233: () => pressToHandstand('elbow-lever'),
  ex_261: () => pressToHandstand('bars-dip'),
  ex_170: () => pressToHandstand('straddle-stand'),
  ex_202: () => pressToHandstand('l-sit'),
  ex_235: () => pressToHandstand('l-sit'),
  ex_169: () => pressToHandstand('chair', { rings: true }),
  ex_201: () => pressToHandstand('bent-arm', { rings: true }),
  ex_234: () => pressToHandstand('bars-dip', { rings: true }),
  ex_262: () => pressToHandstand('straight-body', { rings: true }),
  ex_263: () => pressToHandstand('l-sit', { rings: true }),
  ex_167: () => overheadPress(10),
  ex_199: () => overheadPress(10.5),
  ex_232: () => overheadPress(11),
  ex_260: () => overheadPress(11.5),

  // Core
  ex_187: () => abWheel('standing', { tempo: 'slow-return' }),
  ex_222: () => abWheel('standing'),
  ex_251: () => abWheel('standing', { weighted: true }),
  ex_279: () => abWheel('standing', { oneArm: true }),
  ex_194: () => dragonFlag('full', { weighted: true }),
  ex_185: () => elbowLever({ oneArm: true }),
  ex_220: () => elbowLever({ oneArm: true }),
  ex_186: () => humanFlag('straddle'),
  ex_221: () => humanFlag('full'),
  ex_389: () => vSit(45),
  ex_171: () => vSit(75),
  ex_390: () => vSit(90),
  ex_252: () => vSit(90, { rings: true }),
  ex_203: () => vSit(100),
  ex_236: () => vSit(120),
  ex_264: () => vSit(140),
  ex_411: () => backBridge('decline'),
  ex_412: () => backBridge('one-leg'),
  ex_413: () => backBridge('decline-one-leg'),

  // Legs
  ex_191: () => pistol(6),
  ex_224: () => pistol(7),
  ex_254: () => pistol(8),
  ex_283: () => pistol(9),
  ex_193: () => shrimp('advanced', { deficit: true }),
  ex_226: () => shrimp('two-hands', { deficit: true }),
  ex_255: () => shrimp('advanced', { deficit: true, load: 5 }),
  ex_192: () => nordic('full', { armsOverhead: true }),
  ex_225: () => nordic('full', { weighted: true }),
  ex_196: () => kneelingQuad('matrix', { elevated: true }),
  ex_228: () => kneelingQuad('matrix', { oneLeg: true }),
  ex_258: () => kneelingQuad('leg-extension', { oneLeg: true }),
  ex_286: () => kneelingQuad('sissy', { oneLeg: true }),
};

const FIGURES: Record<string, () => FigureSpec> = { ...BEGINNER, ...INTERMEDIATE, ...ADVANCED };

/** Built on first use: over three hundred figures, most of which a visit never shows. */
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
