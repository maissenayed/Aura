'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'push' | 'pull' | 'core' | 'legs' | 'pro' | 'mastered' | 'locked' | 'outline' | 'clickable';
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  onClick,
  className = '',
  icon,
}) => {
  let styleClasses = 'bg-slate-800 text-slate-200 border-slate-700';

  switch (variant) {
    case 'push':
      styleClasses = 'bg-cyan-950/60 text-neon-cyan border-cyan-500/40 hover:bg-cyan-900/60 hover:border-cyan-400';
      break;
    case 'pull':
      styleClasses = 'bg-emerald-950/60 text-neon-emerald border-emerald-500/40 hover:bg-emerald-900/60 hover:border-emerald-400';
      break;
    case 'core':
      styleClasses = 'bg-purple-950/60 text-neon-purple border-purple-500/40 hover:bg-purple-900/60 hover:border-purple-400';
      break;
    case 'legs':
      styleClasses = 'bg-amber-950/60 text-neon-amber border-amber-500/40 hover:bg-amber-900/60 hover:border-amber-400';
      break;
    case 'pro':
      styleClasses = 'bg-gradient-to-r from-purple-900/80 to-amber-900/80 text-amber-300 border-amber-400/60 shadow-neon-purple font-bold animate-pulse';
      break;
    case 'mastered':
      styleClasses = 'bg-emerald-900/40 text-emerald-400 border-emerald-500/60 font-semibold';
      break;
    case 'locked':
      styleClasses = 'bg-slate-900/60 text-slate-400 border-slate-800 opacity-75';
      break;
    case 'clickable':
      styleClasses = 'bg-dark-900 text-neon-cyan border-cyan-500/50 hover:bg-cyan-950/60 hover:border-cyan-400 font-semibold';
      break;
    case 'outline':
      styleClasses = 'bg-transparent text-slate-300 border-slate-700 hover:border-slate-500';
      break;
  }

  const clickableClasses = onClick
    ? 'cursor-pointer transform hover:scale-105 active:scale-95 transition-all duration-150 shadow-md'
    : '';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-all ${styleClasses} ${clickableClasses} ${className}`}
    >
      {icon && <span className="text-current">{icon}</span>}
      {children}
    </span>
  );
};
