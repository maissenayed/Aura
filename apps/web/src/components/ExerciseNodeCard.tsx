'use client';

import React from 'react';
import { Exercise } from '@aura/types';
import { 
  Lock, 
  CheckCircle2, 
  Zap, 
  Flame, 
  Dumbbell, 
  Target, 
  ShieldAlert, 
  Crown,
  Sparkles
} from 'lucide-react';

interface ExerciseNodeCardProps {
  exercise: Exercise;
  status: 'locked' | 'unlocked' | 'mastered';
  onClick: (exercise: Exercise) => void;
  selected?: boolean;
}

export const ExerciseNodeCard: React.FC<ExerciseNodeCardProps> = ({
  exercise,
  status,
  onClick,
  selected = false,
}) => {
  const isPro = exercise.level >= 15;
  const isLocked = status === 'locked';
  const isMastered = status === 'mastered';

  // Choose icon based on category/swimlane
  let CategoryIcon = Zap;
  if (exercise.swimlane === 'Push') CategoryIcon = Flame;
  else if (exercise.swimlane === 'Pull') CategoryIcon = Dumbbell;
  else if (exercise.swimlane === 'Legs') CategoryIcon = Target;
  else if (exercise.swimlane === 'Core') CategoryIcon = ShieldAlert;

  // Base background & border styling
  let cardStyle = 'bg-ink-900/90 border-ink-700 text-fg-3 hover:border-ink-500 hover:bg-ink-850';
  let badgeStyle = 'bg-ink-700 text-fg-4 border-ink-600';

  if (isMastered) {
    cardStyle = 'bg-earned-deep/40 border-earned-strong/70 text-earned-soft shadow-earned hover:border-earned';
    badgeStyle = 'bg-earned-strong/20 text-earned-soft border-earned-strong/50';
  } else if (isPro) {
    cardStyle = 'bg-armour-deep/40 border-armour-line/80 text-armour pro-glow-border shadow-armour hover:scale-[1.03]';
    badgeStyle = 'bg-gradient-to-r from-armour-line/30 to-earned-strong/30 text-earned-soft border-earned/50';
  } else if (!isLocked) {
    cardStyle = 'bg-ink-850 border-ink-500/50 text-fg shadow-act/20 hover:border-act hover:scale-[1.02]';
    badgeStyle = 'bg-ink-500/20 text-act border-ink-500/40';
  } else {
    // Locked node: dimmed but still interactive
    cardStyle = 'bg-ink-950/70 border-slate-850 text-fg-5 opacity-60 hover:opacity-90 hover:border-ink-600';
    badgeStyle = 'bg-ink-900 text-fg-5 border-ink-700';
  }

  if (selected) {
    cardStyle += ' ring-2 ring-act ring-offset-2 ring-offset-dark-950';
  }

  return (
    <div
      onClick={() => onClick(exercise)}
      className={`relative group w-48 sm:w-56 p-3 rounded-card border transition-all duration-200 cursor-pointer backdrop-blur-md ${cardStyle}`}
    >
      {/* Top badges row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className={`p-1.5 rounded-card border ${badgeStyle}`}>
            <CategoryIcon className="w-3.5 h-3.5" />
          </div>
          <span className="eyebrow text-fg-4 truncate max-w-[90px]">
            {exercise.subCategory}
          </span>
        </div>

        {/* Status Indicator Icon */}
        <div>
          {isMastered ? (
            <div className="flex items-center gap-1 text-earned text-xs font-bold bg-earned-strong/20 px-1.5 py-0.5 rounded-full border border-earned-strong/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1 text-fg-5 text-xs font-bold bg-ink-900 px-1.5 py-0.5 rounded-full border border-ink-700">
              <Lock className="w-3 h-3" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-act text-xs font-bold bg-ink-500/20 px-1.5 py-0.5 rounded-full border border-ink-500/40">
              <Sparkles className="w-3 h-3 animate-spin-slow" />
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xs sm:text-sm font-bold tracking-tight text-fg mb-2 line-clamp-2 min-h-[32px] flex items-center">
        {exercise.name}
      </h3>

      {/* Bottom Level Meter Indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-ink-700/60 text-[11px]">
        <span className="text-fg-4 font-medium">Strength Level</span>
        <span className={`font-mono font-bold px-2 py-0.5 rounded-tag border ${
          isPro 
            ? 'bg-earned-strong/20 text-earned-soft border-earned-strong/40' 
            : exercise.level >= 11 
            ? 'bg-earned-strong/20 text-earned-soft border-earned-strong/40' 
            : exercise.level >= 6 
            ? 'bg-earned-strong/20 text-earned-soft border-earned-strong/40' 
            : 'bg-earned-strong/20 text-earned-soft border-earned-strong/40'
        }`}>
          Lvl {exercise.level}
        </span>
      </div>

      {/* Pro Badge overlay */}
      {isPro && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-armour-line to-earned-strong text-fg p-1 rounded-full shadow-armour border border-earned-soft/60">
          <Crown className="w-3.5 h-3.5 text-earned-soft" />
        </div>
      )}
    </div>
  );
};
