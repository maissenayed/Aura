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
  let cardStyle = 'bg-dark-900/90 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-dark-850';
  let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';

  if (isMastered) {
    cardStyle = 'bg-emerald-950/40 border-emerald-500/70 text-emerald-100 shadow-neon-emerald hover:border-emerald-400';
    badgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  } else if (isPro) {
    cardStyle = 'bg-purple-950/40 border-purple-500/80 text-purple-100 pro-glow-border shadow-neon-purple hover:scale-[1.03]';
    badgeStyle = 'bg-gradient-to-r from-purple-500/30 to-amber-500/30 text-amber-300 border-amber-400/50';
  } else if (!isLocked) {
    cardStyle = 'bg-dark-850 border-cyan-500/50 text-slate-100 shadow-neon-cyan/20 hover:border-cyan-400 hover:scale-[1.02]';
    badgeStyle = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
  } else {
    // Locked node: dimmed but still interactive
    cardStyle = 'bg-dark-950/70 border-slate-850 text-slate-500 opacity-60 hover:opacity-90 hover:border-slate-700';
    badgeStyle = 'bg-slate-900 text-slate-600 border-slate-800';
  }

  if (selected) {
    cardStyle += ' ring-2 ring-neon-cyan ring-offset-2 ring-offset-dark-950';
  }

  return (
    <div
      onClick={() => onClick(exercise)}
      className={`relative group w-48 sm:w-56 p-3 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-md ${cardStyle}`}
    >
      {/* Top badges row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className={`p-1.5 rounded-lg border ${badgeStyle}`}>
            <CategoryIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 truncate max-w-[90px]">
            {exercise.subCategory}
          </span>
        </div>

        {/* Status Indicator Icon */}
        <div>
          {isMastered ? (
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          ) : isLocked ? (
            <div className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-800">
              <Lock className="w-3 h-3" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded-full border border-cyan-500/40">
              <Sparkles className="w-3 h-3 animate-spin-slow" />
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white mb-2 line-clamp-2 min-h-[32px] flex items-center">
        {exercise.name}
      </h3>

      {/* Bottom Level Meter Indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
        <span className="text-slate-400 font-medium">Strength Level</span>
        <span className={`font-mono font-bold px-2 py-0.5 rounded-md border ${
          isPro 
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
            : exercise.level >= 11 
            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' 
            : exercise.level >= 6 
            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' 
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        }`}>
          Lvl {exercise.level}
        </span>
      </div>

      {/* Pro Badge overlay */}
      {isPro && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white p-1 rounded-full shadow-neon-purple border border-amber-300/60">
          <Crown className="w-3.5 h-3.5 text-amber-200" />
        </div>
      )}
    </div>
  );
};
