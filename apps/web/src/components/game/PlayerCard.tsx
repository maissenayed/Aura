'use client';

import React from 'react';
import { calisthenicsFigure } from '../skilltree/calisthenicsFigures';
import { GearedFigure, gearLookOf } from './GearedFigure';

export interface PlayerCardData {
  id?: string;
  name: string;
  level: number;
  rank: string;
  signature: string | null;
  signatureName: string | null;
  gear: Record<string, string>;
  shape: { id: string; short: string; share: number | null }[];
}

/** The six-axis web as a shape only: no numbers, so the crew sees balance, not scores. */
export const MiniWeb: React.FC<{ shape: PlayerCardData['shape']; size?: number }> = ({ shape, size = 72 }) => {
  const n = shape.length || 6;
  const point = (index: number, r: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / n;
    return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
  };
  const ring = (r: number) => Array.from({ length: n }, (_, index) => point(index, r)).join(' ');
  const filled = shape.map((axis, index) => point(index, 40 * Math.max(0.04, axis.share ?? 0))).join(' ');
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Six-axis shape">
      <polygon points={ring(40)} fill="none" style={{ stroke: 'var(--color-ink-600)' }} strokeWidth="1" />
      <polygon points={ring(20)} fill="none" style={{ stroke: 'var(--color-ink-700)' }} strokeWidth="1" />
      <polygon points={filled} style={{ fill: 'var(--color-fg)', fillOpacity: 0.14, stroke: 'var(--color-fg)' }} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
};

/** What the crew sees of an athlete: rank, title, signature pose, gear and the shape of their web. */
export const PlayerCard: React.FC<{ card: PlayerCardData; gearNames?: Record<string, string>; compact?: boolean }> = ({ card, gearNames = {}, compact = false }) => {
  const id = card.signature?.startsWith('calisthenics:') ? card.signature.slice('calisthenics:'.length) : null;
  const spec = (id && calisthenicsFigure(id)) || calisthenicsFigure('ex_11');
  const gear = Object.values(card.gear ?? {})
    .map((itemId) => gearNames[itemId])
    .filter(Boolean);
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'p-3 rounded-card bg-ink-900'}`}>
      <span className="w-14 h-14 shrink-0 rounded-card bg-ink-850 flex items-center justify-center">
        {spec && <GearedFigure spec={spec} state={card.signature ? 'mastered' : 'locked'} look={gearLookOf(card.gear)} className="w-12 h-12" />}
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-fg truncate">{card.name}</span>
        <span className="text-[12px] text-fg-3 truncate">
          Level {card.level} · {card.rank}
          {card.signatureName ? ` · ${card.signatureName}` : ''}
        </span>
        {!compact && gear.length > 0 && <span className="text-[11.5px] text-fg-4 truncate">{gear.join(' · ')}</span>}
      </span>
      <MiniWeb shape={card.shape} size={compact ? 44 : 64} />
    </div>
  );
};
