import { MuscleMetadata, Exercise } from '@aura/types';
import { MUSCLE_DICTIONARY } from '../../data/muscleData';
import { EXERCISES } from '../../data/exercisesData';

export interface AnatomyPageContext {
  muscles: MuscleMetadata[];
  initialExercises: Exercise[];
}

export async function getPageContext(): Promise<AnatomyPageContext> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

  let muscles: MuscleMetadata[] = Object.values(MUSCLE_DICTIONARY);
  let initialExercises: Exercise[] = EXERCISES.filter((e) => e.level <= 5);

  try {
    const [musclesRes, exRes] = await Promise.all([
      fetch(`${API_BASE}/anatomy/muscles`, { cache: 'no-store' }),
      fetch(`${API_BASE}/exercises?minLevel=1&maxLevel=5`, { cache: 'no-store' }),
    ]);

    if (musclesRes.ok) {
      const json = await musclesRes.json();
      if (json.success && Array.isArray(json.data)) {
        muscles = json.data;
      }
    }

    if (exRes.ok) {
      const json = await exRes.json();
      if (json.success && Array.isArray(json.data)) {
        initialExercises = json.data;
      }
    }
  } catch (err) {
    console.warn('Backend API offline during SSR anatomy fetch, using local dataset', err);
  }

  return {
    muscles,
    initialExercises,
  };
}
