/** Catalog items shaped for the editor's dropdowns. */

import { EXERCISE_BY_ID, SET_OPTIONS, doseOptionLabel } from '../../data/campaignCatalog';
import { repsOptions } from '../../utils/campaignPlan';

export const setOptions = SET_OPTIONS.map((sets) => ({ id: String(sets), label: `${sets} ${sets === 1 ? 'set' : 'sets'}` }));

/** Reps options for an exercise, labelled ("8–12 reps", "15 secs", "60–90 mins"). Empty when it has no dose. */
export function repsChoices(exerciseId: string): { id: string; label: string }[] {
  const exercise = EXERCISE_BY_ID.get(exerciseId);
  if (!exercise) return [];
  return repsOptions(exerciseId).map((option) => ({
    id: option,
    label: `${doseOptionLabel(exercise.dose, option)}${exercise.side && exercise.dose !== 'minutes' ? ` per ${exercise.side}` : ''}`,
  }));
}
