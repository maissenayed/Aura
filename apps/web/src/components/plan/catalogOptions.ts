/** Catalog items shaped for the editor's dropdowns. */

import {
  ARMOR_CATALOG,
  BOSS_CATALOG,
  EXERCISE_BY_ID,
  EXERCISE_CATALOG,
  EXERCISE_CATEGORIES,
  LIFT_CATALOG,
  SET_OPTIONS,
  TREE_CATALOG,
  doseOptionLabel,
} from '../../data/campaignCatalog';
import { BRANCHES, repsOptions } from '../../utils/campaignPlan';

type Group = { label: string; options: { id: string; label: string }[] };

/** Every catalog exercise, grouped by category. `except` hides ids already used where that matters. */
export function exerciseGroups(except: Set<string> = new Set()): Group[] {
  return EXERCISE_CATEGORIES.map((category) => ({
    label: category.label,
    options: EXERCISE_CATALOG.filter((exercise) => exercise.category === category.id && !except.has(exercise.id)).map((exercise) => ({
      id: exercise.id,
      label: `${exercise.name} — ${exercise.focus}`,
    })),
  }));
}

export function liftGroups(except: Set<string>): Group[] {
  return BRANCHES.map((branch) => ({
    label: branch.label,
    options: LIFT_CATALOG.filter((lift) => lift.branch === branch.id && !except.has(lift.id)).map((lift) => ({ id: lift.id, label: lift.name })),
  }));
}

export function bossGroups(except: Set<string>): Group[] {
  return BRANCHES.map((branch) => ({
    label: branch.label,
    options: BOSS_CATALOG.filter((boss) => boss.branch === branch.id && !except.has(boss.id)).map((boss) => ({
      id: boss.id,
      label: `${boss.name} — ${boss.epithet}`,
    })),
  }));
}

export function treeGroups(except: Set<string>): Group[] {
  return BRANCHES.map((branch) => ({
    label: branch.label,
    options: TREE_CATALOG.filter((tree) => tree.branch === branch.id && !except.has(tree.id)).map((tree) => ({
      id: tree.id,
      label: `${tree.name} — ${tree.tiers.length} tiers`,
    })),
  }));
}

export function armorGroups(except: Set<string>): Group[] {
  return [
    {
      label: 'Tendon armor',
      options: ARMOR_CATALOG.filter((piece) => !except.has(piece.id)).map((piece) => ({ id: piece.id, label: `${piece.slot} — ${piece.drill}` })),
    },
  ];
}

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
