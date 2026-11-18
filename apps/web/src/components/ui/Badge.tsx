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
  let styleClasses = 'bg-ink-700 text-fg-2 border-ink-600';

  switch (variant) {
    case 'push':
      styleClasses = 'bg-ink-800/60 text-act border-ink-500/40 hover:bg-ink-800/60 hover:border-act';
      break;
    case 'pull':
      styleClasses = 'bg-earned-deep/60 text-earned border-earned-strong/40 hover:bg-earned-deep/60 hover:border-earned';
      break;
    case 'core':
      styleClasses = 'bg-armour-deep/60 text-armour border-armour-line/40 hover:bg-armour-deep/60 hover:border-armour';
      break;
    case 'legs':
      styleClasses = 'bg-earned-deep/60 text-earned border-earned-strong/40 hover:bg-earned-deep/60 hover:border-earned';
      break;
    case 'pro':
      styleClasses = 'bg-gradient-to-r from-armour-deep/80 to-earned-deep/80 text-earned-soft border-earned/60 shadow-armour font-bold animate-pulse';
      break;
    case 'mastered':
      styleClasses = 'bg-earned-deep/40 text-earned border-earned-strong/60 font-semibold';
      break;
    case 'locked':
      styleClasses = 'bg-ink-900/60 text-fg-4 border-ink-700 opacity-75';
      break;
    case 'clickable':
      styleClasses = 'bg-ink-900 text-act border-ink-500/50 hover:bg-ink-800/60 hover:border-act font-semibold';
      break;
    case 'outline':
      styleClasses = 'bg-transparent text-fg-3 border-ink-600 hover:border-fg-5';
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
