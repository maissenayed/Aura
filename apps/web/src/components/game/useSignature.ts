'use client';

import { useMemo } from 'react';
import { calisthenicsFigure } from '../skilltree/calisthenicsFigures';
import type { FigureSpec } from '../skilltree/SkillFigure';
import { useExercises } from '../../utils/skillProgressStore';
import { useGame } from './GameProvider';

/**
 * Your avatar strikes the pose of a skill you have proven: the pick saved on
 * the account, else your hardest. Tapping it cycles through your three
 * hardest. Placed skills never lend a pose; nothing proven yet: a plain squat,
 * waiting for a first skill.
 */

export interface Signature {
  spec: FigureSpec;
  name: string;
  /** False until a skill is proven. */
  earned: boolean;
  /** How many signatures there are to cycle through. */
  choices: number;
  next: () => void;
}

export function useSignature(): Signature {
  const exercises = useExercises();
  const { save, setSignature } = useGame();

  const top = useMemo(() => {
    const proven = (id: string) => Boolean(save.skills?.[`calisthenics:${id}`]) && !save.vouched?.[`calisthenics:${id}`];
    return exercises
      .filter((exercise) => proven(exercise.id) && calisthenicsFigure(exercise.id))
      .sort((a, b) => b.level - a.level)
      .slice(0, 3);
  }, [exercises, save.skills, save.vouched]);

  const picked = save.signature?.startsWith('calisthenics:') ? save.signature.slice('calisthenics:'.length) : null;
  const index = Math.max(0, top.findIndex((exercise) => exercise.id === picked));
  const current = top[index];

  const next = () => {
    if (top.length < 2) return;
    setSignature(`calisthenics:${top[(index + 1) % top.length].id}`);
  };

  if (!current) {
    return { spec: calisthenicsFigure('ex_11')!, name: 'Master your first skill', earned: false, choices: 0, next };
  }
  return { spec: calisthenicsFigure(current.id)!, name: current.name, earned: true, choices: top.length, next };
}
