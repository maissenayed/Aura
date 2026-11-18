'use client';

import React from 'react';
import { GearedFigure } from './GearedFigure';
import { useMyGearLook } from './useGearLook';
import { useSignature } from './useSignature';

/** The athlete's figure in their signature pose, at a size. */
export const AvatarFigure: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => {
  const signature = useSignature();
  const gear = useMyGearLook();
  return (
    <span className={`block rounded-card bg-ink-900 ${className}`} style={{ width: size, height: size }} aria-label={signature.name} role="img">
      <GearedFigure spec={signature.spec} state={signature.earned ? 'mastered' : 'locked'} look={gear} className="w-full h-full" />
    </span>
  );
};
