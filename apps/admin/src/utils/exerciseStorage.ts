import { RawExercise, Exercise } from '@aura/types';
import { rawExercises } from '../data/rawExercisesData';
import { enrichExercises } from '../data/exercisesData';

const CUSTOM_EXERCISES_STORAGE_KEY = 'aura_calisthenics_custom_exercises_v3';

// Load raw exercises from localStorage or default
export function getRawExercises(): RawExercise[] {
  if (typeof window === 'undefined') {
    return rawExercises;
  }
  try {
    const saved = localStorage.getItem(CUSTOM_EXERCISES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load custom exercises from localStorage:', e);
  }
  return rawExercises;
}

// Get enriched Exercise[] array
export function getStoredExercises(): Exercise[] {
  const rawList = getRawExercises();
  return enrichExercises(rawList);
}

// Save raw exercises list to localStorage
export function saveRawExercises(exercises: RawExercise[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_EXERCISES_STORAGE_KEY, JSON.stringify(exercises));
  } catch (e) {
    console.error('Failed to save custom exercises to localStorage:', e);
  }
}

// Save or Update a single RawExercise
export function saveExercise(exerciseToSave: RawExercise): RawExercise[] {
  const list = getRawExercises();
  const existingIndex = list.findIndex(ex => ex.id === exerciseToSave.id);

  let updatedList: RawExercise[];
  if (existingIndex >= 0) {
    updatedList = [...list];
    updatedList[existingIndex] = exerciseToSave;
  } else {
    updatedList = [exerciseToSave, ...list];
  }

  saveRawExercises(updatedList);
  return updatedList;
}

// Delete an exercise by ID, also removing it from prerequisites of other exercises
export function deleteExercise(id: string): RawExercise[] {
  const list = getRawExercises();
  const updatedList = list
    .filter(ex => ex.id !== id)
    .map(ex => {
      if (Array.isArray(ex.prerequisites) && ex.prerequisites.includes(id)) {
        return {
          ...ex,
          prerequisites: ex.prerequisites.filter(pId => pId !== id),
        };
      }
      return ex;
    });

  saveRawExercises(updatedList);
  return updatedList;
}

// Bulk import exercises with merge or replace options
export function importExercises(
  importedList: RawExercise[],
  mode: 'merge' | 'replace'
): RawExercise[] {
  if (mode === 'replace') {
    saveRawExercises(importedList);
    return importedList;
  }

  const currentList = getRawExercises();
  const listMap = new Map<string, RawExercise>();

  // Put current list in map
  currentList.forEach(ex => listMap.set(ex.id, ex));

  // Merge imported list (overwrite matching IDs or add new ones)
  importedList.forEach(ex => {
    listMap.set(ex.id, {
      ...listMap.get(ex.id),
      ...ex,
    });
  });

  const updatedList = Array.from(listMap.values());
  saveRawExercises(updatedList);
  return updatedList;
}

// Reset exercises to original rawExercisesData list
export function resetExercisesToDefault(): RawExercise[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CUSTOM_EXERCISES_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear custom exercises in localStorage:', e);
    }
  }
  return rawExercises;
}
