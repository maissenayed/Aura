import React from 'react';
import { Dumbbell, Flame, Flower2, FoldVertical, Footprints, Hand, MoveVertical, PersonStanding, Rainbow, RefreshCw, ShieldHalf, Target, Zap } from 'lucide-react';
import { Swimlane } from '@aura/types';

export interface LaneTheme {
  label: string;
  icon: React.ReactNode;
  text: string;
  /** Solid colour used for accent bars and dots. */
  solid: string;
  border: string;
  tint: string;
  bar: string;
  /** The same colour as a value, for drawings. */
  hex: string;
}

const ICON = 'w-3.5 h-3.5';

/**
 * Lanes have no colour of their own: chalk on iron, told apart by their icon
 * and label. The fields stay so every caller keeps its shape.
 * Full class strings on purpose — Tailwind only sees classes written out literally.
 */
const NEUTRAL = {
  text: 'text-fg',
  solid: 'bg-act',
  border: 'border-ink-600',
  tint: 'bg-ink-850',
  bar: 'bg-progress',
  hex: 'var(--fig-ready-focus)',
};

export const LANE_THEME: Record<Swimlane, LaneTheme> = {
  Push: { label: 'Push', icon: <Flame className={ICON} />, ...NEUTRAL },
  Pull: { label: 'Pull', icon: <Dumbbell className={ICON} />, ...NEUTRAL },
  Core: { label: 'Core', icon: <ShieldHalf className={ICON} />, ...NEUTRAL },
  Legs: { label: 'Legs', icon: <Target className={ICON} />, ...NEUTRAL },
};

export const BOULDERING_LANE_THEME: Record<string, LaneTheme> = {
  Technique: { label: 'Technique', icon: <Footprints className={ICON} />, ...NEUTRAL },
  Body: { label: 'Body', icon: <PersonStanding className={ICON} />, ...NEUTRAL },
  Movement: { label: 'Movement', icon: <Zap className={ICON} />, ...NEUTRAL },
  Strength: { label: 'Strength', icon: <Hand className={ICON} />, ...NEUTRAL },
};

/** Short labels: the phone's lane bar fits four to a row. */
export const YOGA_LANE_THEME: Record<string, LaneTheme> = {
  Standing: { label: 'Standing', icon: <PersonStanding className={ICON} />, ...NEUTRAL },
  Folds: { label: 'Folds', icon: <FoldVertical className={ICON} />, ...NEUTRAL },
  Hips: { label: 'Hips', icon: <Flower2 className={ICON} />, ...NEUTRAL },
  Twists: { label: 'Twists', icon: <RefreshCw className={ICON} />, ...NEUTRAL },
  Backbends: { label: 'Backbends', icon: <Rainbow className={ICON} />, ...NEUTRAL },
  'Arm Balances': { label: 'Arm balances', icon: <Hand className={ICON} />, ...NEUTRAL },
  Inversions: { label: 'Inversions', icon: <MoveVertical className={ICON} />, ...NEUTRAL },
};

/** For a branch a tree does not describe — say, from an edited dataset — rather than failing. */
export const FALLBACK_LANE_THEME: LaneTheme = {
  label: 'Other',
  icon: <Target className={ICON} />,
  ...NEUTRAL,
};
