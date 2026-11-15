import React from 'react';
import { Dumbbell, Flame, Footprints, Hand, PersonStanding, ShieldHalf, Target, Zap } from 'lucide-react';
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

/** Full class strings on purpose — Tailwind only sees classes written out literally. */
const CYAN = {
  text: 'text-neon-cyan',
  solid: 'bg-neon-cyan',
  border: 'border-cyan-500/40',
  tint: 'bg-cyan-950/40',
  bar: 'from-cyan-600 to-neon-cyan',
  hex: '#00f0ff',
};
const EMERALD = {
  text: 'text-neon-emerald',
  solid: 'bg-neon-emerald',
  border: 'border-emerald-500/40',
  tint: 'bg-emerald-950/40',
  bar: 'from-emerald-600 to-neon-emerald',
  hex: '#00ff9d',
};
const PURPLE = {
  text: 'text-neon-purple',
  solid: 'bg-neon-purple',
  border: 'border-purple-500/40',
  tint: 'bg-purple-950/40',
  bar: 'from-purple-600 to-neon-purple',
  hex: '#d946ef',
};
const AMBER = {
  text: 'text-neon-amber',
  solid: 'bg-neon-amber',
  border: 'border-amber-500/40',
  tint: 'bg-amber-950/40',
  bar: 'from-amber-600 to-neon-amber',
  hex: '#ffb700',
};

export const LANE_THEME: Record<Swimlane, LaneTheme> = {
  Push: { label: 'Push', icon: <Flame className={ICON} />, ...CYAN },
  Pull: { label: 'Pull', icon: <Dumbbell className={ICON} />, ...EMERALD },
  Core: { label: 'Core', icon: <ShieldHalf className={ICON} />, ...PURPLE },
  Legs: { label: 'Legs', icon: <Target className={ICON} />, ...AMBER },
};

export const BOULDERING_LANE_THEME: Record<string, LaneTheme> = {
  Technique: { label: 'Technique', icon: <Footprints className={ICON} />, ...CYAN },
  Body: { label: 'Body', icon: <PersonStanding className={ICON} />, ...PURPLE },
  Movement: { label: 'Movement', icon: <Zap className={ICON} />, ...AMBER },
  Strength: { label: 'Strength', icon: <Hand className={ICON} />, ...EMERALD },
};

export const GYM_LANE_THEME: Record<string, LaneTheme> = {
  Push: { label: 'Push', icon: <Flame className={ICON} />, ...CYAN },
  Pull: { label: 'Pull', icon: <Dumbbell className={ICON} />, ...EMERALD },
  Legs: { label: 'Legs', icon: <Target className={ICON} />, ...AMBER },
  Core: { label: 'Core & Grip', icon: <ShieldHalf className={ICON} />, ...PURPLE },
};

/** For a branch a tree does not describe — say, from an edited dataset — rather than failing. */
export const FALLBACK_LANE_THEME: LaneTheme = {
  label: 'Other',
  icon: <Target className={ICON} />,
  text: 'text-slate-300',
  solid: 'bg-slate-400',
  border: 'border-slate-600/40',
  tint: 'bg-slate-900/40',
  bar: 'from-slate-600 to-slate-300',
  hex: '#cbd5e1',
};
