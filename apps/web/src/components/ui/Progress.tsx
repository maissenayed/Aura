'use client';

import React from 'react';

interface ProgressProps {
  level: number; // 1 to 20
  maxLevel?: number;
  showLabel?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({ level, maxLevel = 20, showLabel = true }) => {
  const percentage = Math.min(100, Math.max(5, (level / maxLevel) * 100));

  // Determine color coding based on level range
  let colorGradient = 'from-emerald-500 to-emerald-400 shadow-neon-emerald';
  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let levelTierText = 'Beginner / Foundation';

  if (level >= 16) {
    colorGradient = 'from-purple-600 via-rose-500 to-neon-gold animate-pulse-glow';
    badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    levelTierText = 'PRO / Static Master';
  } else if (level >= 11) {
    colorGradient = 'from-amber-500 to-orange-500 shadow-neon-gold';
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    levelTierText = 'Advanced Practitioner';
  } else if (level >= 6) {
    colorGradient = 'from-yellow-500 to-amber-400';
    badgeColor = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    levelTierText = 'Intermediate Athlete';
  }

  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
          <span className="text-slate-400">Strength Level {level} / {maxLevel}</span>
          <span className={`px-2 py-0.5 rounded-full border ${badgeColor} text-[10px]`}>
            {levelTierText}
          </span>
        </div>
      )}
      <div className="h-3 w-full bg-dark-950/80 rounded-full overflow-hidden p-0.5 border border-slate-800/80 shadow-inner">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colorGradient} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
