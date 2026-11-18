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
  let colorGradient = 'from-earned-strong to-earned shadow-earned';
  let badgeColor = 'bg-earned-strong/20 text-earned-soft border-earned-strong/40';
  let levelTierText = 'Beginner / Foundation';

  if (level >= 16) {
    colorGradient = 'from-armour-line via-boss to-earned animate-pulse-glow';
    badgeColor = 'bg-armour-line/20 text-armour border-armour-line/40';
    levelTierText = 'PRO / Static Master';
  } else if (level >= 11) {
    colorGradient = 'from-earned-strong to-earned-strong shadow-earned';
    badgeColor = 'bg-earned-strong/20 text-earned-soft border-earned-strong/40';
    levelTierText = 'Advanced Practitioner';
  } else if (level >= 6) {
    colorGradient = 'from-earned-strong to-earned';
    badgeColor = 'bg-earned-strong/20 text-earned-soft border-earned-strong/40';
    levelTierText = 'Intermediate Athlete';
  }

  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <div className="eyebrow flex items-center justify-between">
          <span className="text-fg-4">Strength Level {level} / {maxLevel}</span>
          <span className={`px-2 py-0.5 rounded-full border ${badgeColor} text-[10px]`}>
            {levelTierText}
          </span>
        </div>
      )}
      <div className="h-3 w-full bg-ink-950/80 rounded-full overflow-hidden p-0.5 border border-ink-700/80 shadow-inner">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colorGradient} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
