import React from 'react';
import { Dumbbell, Flame, ShieldHalf, Target } from 'lucide-react';
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
}

const ICON = 'w-3.5 h-3.5';

/** Full class strings on purpose — Tailwind only sees classes written out literally. */
export const LANE_THEME: Record<Swimlane, LaneTheme> = {
  Push: {
    label: 'Push',
    icon: <Flame className={ICON} />,
    text: 'text-neon-cyan',
    solid: 'bg-neon-cyan',
    border: 'border-cyan-500/40',
    tint: 'bg-cyan-950/40',
    bar: 'from-cyan-600 to-neon-cyan',
  },
  Pull: {
    label: 'Pull',
    icon: <Dumbbell className={ICON} />,
    text: 'text-neon-emerald',
    solid: 'bg-neon-emerald',
    border: 'border-emerald-500/40',
    tint: 'bg-emerald-950/40',
    bar: 'from-emerald-600 to-neon-emerald',
  },
  Core: {
    label: 'Core',
    icon: <ShieldHalf className={ICON} />,
    text: 'text-neon-purple',
    solid: 'bg-neon-purple',
    border: 'border-purple-500/40',
    tint: 'bg-purple-950/40',
    bar: 'from-purple-600 to-neon-purple',
  },
  Legs: {
    label: 'Legs',
    icon: <Target className={ICON} />,
    text: 'text-neon-amber',
    solid: 'bg-neon-amber',
    border: 'border-amber-500/40',
    tint: 'bg-amber-950/40',
    bar: 'from-amber-600 to-neon-amber',
  },
};
