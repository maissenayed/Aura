'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Skull } from 'lucide-react';
import { BossStatus } from '../../utils/protocolEngine';
import { bossHp } from './helpers';
import { Chip } from './kit';

/** HP of a boss a lift hits; shakes and floats the damage when a log knocks some off. */
export const BossHpChip: React.FC<{ status: BossStatus }> = ({ status }) => {
  const hp = bossHp(status);
  const previous = useRef(hp);
  const [hit, setHit] = useState<{ amount: number; id: number } | null>(null);

  useEffect(() => {
    if (hp < previous.current) setHit({ amount: previous.current - hp, id: Date.now() });
    previous.current = hp;
  }, [hp]);
  useEffect(() => {
    if (!hit) return;
    const timer = window.setTimeout(() => setHit(null), 1200);
    return () => window.clearTimeout(timer);
  }, [hit]);

  return (
    <Link href={`/bosses/${status.boss.id}`} className="relative" aria-label={`${status.boss.name}, ${hp} HP`}>
      <Chip tone="boss" className={hit ? 'anim-shake' : ''}>
        <Skull className="w-3.5 h-3.5" />
        <span className="font-sans text-xs truncate max-w-[110px]">{status.boss.name.replace(/^The /, '')}</span>
        <span>{hp}</span>
      </Chip>
      {hit && (
        <span key={hit.id} className="absolute right-1 -top-5 font-display font-bold text-sm text-boss anim-float">
          −{hit.amount} HP
        </span>
      )}
    </Link>
  );
};
