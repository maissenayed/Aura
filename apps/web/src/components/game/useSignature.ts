'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { calisthenicsFigure } from '../skilltree/calisthenicsFigures';
import type { FigureSpec } from '../skilltree/SkillFigure';
import { useExercises, useMasteredIds } from '../../utils/skillProgressStore';

/**
 * Your avatar strikes the pose of your hardest mastered calisthenics skill.
 * Tapping it cycles through your three hardest; the pick is remembered on
 * this device. Nothing mastered yet: a plain squat, waiting for a first skill.
 */

const KEY = 'aura_signature_v1';
const listeners = new Set<() => void>();
const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};
const read = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export interface Signature {
  spec: FigureSpec;
  name: string;
  /** False until a skill is mastered. */
  earned: boolean;
  /** How many signatures there are to cycle through. */
  choices: number;
  next: () => void;
}

export function useSignature(): Signature {
  const exercises = useExercises();
  const mastered = useMasteredIds('calisthenics');
  const picked = useSyncExternalStore(subscribe, read, () => null);

  const top = useMemo(() => {
    const done = new Set(mastered);
    return exercises
      .filter((exercise) => done.has(exercise.id) && calisthenicsFigure(exercise.id))
      .sort((a, b) => b.level - a.level)
      .slice(0, 3);
  }, [exercises, mastered]);

  const index = Math.max(0, top.findIndex((exercise) => exercise.id === picked));
  const current = top[index];

  const next = () => {
    if (top.length < 2) return;
    const id = top[(index + 1) % top.length].id;
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      /* Private mode: the pick just isn't remembered. */
    }
    listeners.forEach((listener) => listener());
  };

  if (!current) {
    return { spec: calisthenicsFigure('ex_11')!, name: 'Master your first skill', earned: false, choices: 0, next };
  }
  return { spec: calisthenicsFigure(current.id)!, name: current.name, earned: true, choices: top.length, next };
}
