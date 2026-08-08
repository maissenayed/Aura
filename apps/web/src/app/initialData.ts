import { Exercise, UserProgress } from '@aura/types';
import { EXERCISES } from '../data/exercisesData';

export interface SkillTreePageContext {
  exercises: Exercise[];
  progress: UserProgress;
}

export async function getPageContext(): Promise<SkillTreePageContext> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

  let exercises: Exercise[] = EXERCISES;
  let progress: UserProgress = {
    masteredIds: ['ex_0', 'ex_4', 'ex_7', 'ex_11'],
    currentLevel: 3,
    totalXp: 900,
  };

  try {
    const [exRes, rpgRes] = await Promise.all([
      fetch(`${API_BASE}/exercises`, { cache: 'no-store' }),
      fetch(`${API_BASE}/rpg`, { cache: 'no-store' }),
    ]);

    if (exRes.ok) {
      const exJson = await exRes.json();
      if (exJson.success && Array.isArray(exJson.data)) {
        exercises = exJson.data;
      }
    }

    if (rpgRes.ok) {
      const rpgJson = await rpgRes.json();
      if (rpgJson.success && rpgJson.data) {
        progress = rpgJson.data;
      }
    }
  } catch (err) {
    console.warn('Backend API offline during SSR, falling back to local dataset', err);
  }

  return {
    exercises,
    progress,
  };
}
