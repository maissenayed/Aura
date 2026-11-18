'use client';

import { useMemo } from 'react';
import { calisthenicsFigure } from '../skilltree/calisthenicsFigures';
import type { FigureSpec } from '../skilltree/SkillFigure';
import { useExercises } from '../../utils/skillProgressStore';
import { useGame } from './GameProvider';

/**
 * The move your avatar does: one you have proven, picked from the list of
 * them (saved on the account), else your hardest. Placed skills never lend a
 * pose. Nothing proven yet: a plain squat, waiting for a first skill.
 */

export interface PoseOption {
  /** Save key, `calisthenics:<id>`. */
  key: string;
  name: string;
  level: number;
  spec: FigureSpec;
}

export interface Signature {
  spec: FigureSpec;
  name: string;
  /** The picked move's save key; null until a skill is proven. */
  key: string | null;
  /** False until a skill is proven. */
  earned: boolean;
  /** Every proven move with a drawing, hardest first. */
  options: PoseOption[];
  pick: (key: string) => void;
}

export function useSignature(): Signature {
  const exercises = useExercises();
  const { save, setSignature } = useGame();

  const options = useMemo(() => {
    const proven = (id: string) => Boolean(save.skills?.[`calisthenics:${id}`]) && !save.vouched?.[`calisthenics:${id}`];
    return exercises
      .filter((exercise) => proven(exercise.id))
      .flatMap((exercise) => {
        const spec = calisthenicsFigure(exercise.id);
        return spec ? [{ key: `calisthenics:${exercise.id}`, name: exercise.name, level: exercise.level, spec }] : [];
      })
      .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
  }, [exercises, save.skills, save.vouched]);

  const current = options.find((option) => option.key === save.signature) ?? options[0];
  const pick = (key: string) => setSignature(key);

  if (!current) return { spec: calisthenicsFigure('ex_11')!, name: 'Master your first skill', key: null, earned: false, options, pick };
  return { spec: current.spec, name: current.name, key: current.key, earned: true, options, pick };
}
