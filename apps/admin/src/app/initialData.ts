import { RawExercise } from '@aura/types';
import { rawExercises } from '../data/rawExercisesData';

export interface AdminPageContext {
  rawExercises: RawExercise[];
}

export async function getPageContext(): Promise<AdminPageContext> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

  let rawList: RawExercise[] = rawExercises;

  try {
    const res = await fetch(`${API_BASE}/admin/exercises`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        rawList = json.data;
      }
    }
  } catch (err) {
    console.warn('Backend API offline during SSR admin fetch, using local raw dataset', err);
  }

  return {
    rawExercises: rawList,
  };
}
