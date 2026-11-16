/**
 * Calisthenics exercise ids that were merged into another when the tree was
 * rebuilt. Progress or plans saved under an old id count for the id it maps to.
 */
export const MERGED_EXERCISE_IDS: Readonly<Record<string, string>> = {
  ex_0: 'ex_39',
  ex_4: 'ex_22',
  ex_5: 'ex_23',
  ex_16: 'ex_15',
  ex_29: 'ex_8',
  ex_38: 'ex_37',
  ex_46: 'ex_45',
  ex_116: 'ex_96',
  ex_280: 'ex_271',
  ex_338: 'ex_333',
  ex_359: 'ex_135',
  ex_360: 'ex_266',
  ex_361: 'ex_265',
  ex_363: 'ex_173',
  ex_364: 'ex_136',
  ex_365: 'ex_67',
  ex_369: 'ex_22',
  ex_370: 'ex_100',
  ex_371: 'ex_175',
  ex_373: 'ex_267',
  ex_374: 'ex_298',
  ex_375: 'ex_139',
  ex_381: 'ex_23',
  ex_382: 'ex_150',
  ex_389: 'ex_134',
  ex_390: 'ex_203',
  ex_391: 'ex_236',
  ex_392: 'ex_264',
  ex_393: 'ex_291',
  ex_394: 'ex_312',
  ex_395: 'ex_9',
  ex_396: 'ex_27',
  ex_397: 'ex_77',
  ex_398: 'ex_148',
  ex_399: 'ex_148',
  ex_400: 'ex_182',
  ex_401: 'ex_248',
  ex_402: 'ex_77',
  ex_403: 'ex_217',
  ex_407: 'ex_12',
  ex_415: 'ex_127',
  ex_417: 'ex_259',
  ex_421: 'ex_166',
  ex_422: 'ex_198',
  ex_423: 'ex_40',
  ex_424: 'ex_91',
  ex_425: 'ex_164',
  ex_426: 'ex_63',
  ex_427: 'ex_1',
  ex_429: 'ex_26',
  ex_432: 'ex_145',
  ex_433: 'ex_108',
  ex_434: 'ex_180',
  ex_435: 'ex_215',
  ex_436: 'ex_246',
};

/** Ids that were removed outright: placeholders and legend rows, not exercises. */
export const DROPPED_EXERCISE_IDS: readonly string[] = ['ex_31', 'ex_362', 'ex_418'];

/** The id an exercise lives under now; unchanged when it was never merged. */
export function resolveExerciseId(id: string): string {
  return MERGED_EXERCISE_IDS[id] ?? id;
}
