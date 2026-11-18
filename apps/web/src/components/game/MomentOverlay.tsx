'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Flag, Hexagon, Trophy } from 'lucide-react';
import { FlameIcon } from './icons';
import { CampaignPlan } from '../../utils/campaignPlan';
import { LevelStatus, XP_RULES } from '../../utils/protocolEngine';
import { figureForBoss } from './figures';
import { Figure, HexLevel } from './kit';
import type { Moment } from './GameProvider';

/**
 * The big moments, full screen and nearly wordless: a level, a boss slain, an
 * act cleared, the campaign finished, a perfect day or week, a new attribute.
 * One at a time; Continue (or Escape) moves on to the next one in the queue.
 */
export const MomentOverlay: React.FC<{
  moment: Moment;
  plan: CampaignPlan;
  level: LevelStatus;
  streak: number;
  onDone: () => void;
}> = ({ moment, plan, level, streak, onDone }) => {
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    button.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDone]);

  const gold = moment.kind !== 'attribute';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={moment.title}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/95 px-6 anim-fade"
    >
      <div className="w-full max-w-md flex flex-col items-center gap-5 text-center">
        <div className="relative w-[300px] h-[260px] flex items-center justify-center">
          {/* One gold ring bursts once: the only flourish. */}
          <div className={`absolute w-[200px] h-[200px] rounded-full border-4 anim-burst ${gold ? 'border-earned' : 'border-armour'}`} aria-hidden />
          <div className="relative anim-pop">
            <MomentArt moment={moment} plan={plan} level={level} streak={streak} />
          </div>
        </div>

        <h2 className={`font-display font-black text-[44px] leading-none uppercase anim-rise ${gold ? 'text-earned' : 'text-armour'}`}>
          {headline(moment)}
        </h2>
        <p className="font-display font-extrabold uppercase text-[24px] leading-tight text-fg anim-rise" style={{ animationDelay: '.15s' }}>
          {moment.kind === 'boss' || moment.kind === 'act' ? moment.detail : moment.kind === 'level' ? level.rank : moment.kind === 'campaign' ? plan.name : moment.title}
        </p>
        <Reward moment={moment} streak={streak} />
        {moment.kind === 'campaign' && (
          <p className="text-sm text-fg-3 max-w-xs anim-rise" style={{ animationDelay: '.3s' }}>
            Every act on the map is cleared. Plan the next one in the Forge: start from a template or add new acts and bosses.
          </p>
        )}

        <button
          ref={button}
          type="button"
          onClick={onDone}
          className="mt-2 w-full h-14 rounded-card bg-earned text-earned-deep font-display font-extrabold uppercase text-[20px] tracking-[0.02em] active:scale-[.97] transition cursor-pointer"
        >
          Continue
        </button>
        {moment.kind === 'campaign' && (
          <Link
            href="/forge"
            onClick={onDone}
            className="-mt-2 w-full h-12 rounded-card border border-earned-line text-earned font-display font-extrabold uppercase text-lg tracking-[0.02em] flex items-center justify-center active:scale-[.97] transition"
          >
            Plan year two
          </Link>
        )}
      </div>
    </div>
  );
};

function headline(moment: Moment): string {
  switch (moment.kind) {
    case 'level':
      return 'Level up';
    case 'boss':
      return 'Slain';
    case 'act':
      return 'Act cleared';
    case 'campaign':
      return 'Campaign complete';
    case 'week':
      return 'Perfect week';
    case 'day':
      return 'Day cleared';
    case 'attribute':
      return 'New power';
    default:
      return moment.title;
  }
}

const MomentArt: React.FC<{ moment: Moment; plan: CampaignPlan; level: LevelStatus; streak: number }> = ({
  moment,
  plan,
  level,
  streak,
}) => {
  if (moment.kind === 'level') {
    const shown = Number(/Level (\d+)/.exec(moment.title)?.[1] ?? level.level);
    return <HexLevel level={shown} size="lg" />;
  }
  if (moment.kind === 'boss') {
    const boss = plan.bosses.find((entry) => entry.name === moment.detail);
    return (
      <div className="relative flex items-center justify-center">
        {boss && <Figure spec={figureForBoss(boss)} state="slain" className="w-[190px] h-[190px]" />}
        <span className="absolute -bottom-4 px-4 py-1 border-4 border-earned rounded-tag bg-ink-950/80 font-display font-black uppercase text-5xl tracking-[0.06em] text-earned anim-stamp">
          Slain
        </span>
      </div>
    );
  }
  if (moment.kind === 'week' || moment.kind === 'campaign') return <Trophy className="w-36 h-36 text-earned" strokeWidth={1.4} />;
  if (moment.kind === 'act') return <Flag className="w-32 h-32 text-earned" strokeWidth={1.4} />;
  if (moment.kind === 'attribute') return <Hexagon className="w-36 h-36 text-armour" strokeWidth={1.4} />;
  return (
    <div className="relative">
      <Chest />
      {streak > 0 && (
        <span className="absolute -top-2 -right-6 flex items-center gap-1 h-9 px-3 rounded-card bg-earned-deep text-earned num font-bold text-lg">
          <FlameIcon className="w-4 h-4" lit /> {streak}
        </span>
      )}
    </div>
  );
};

/** A loot chest with its lid swinging open. */
const Chest: React.FC = () => (
  <svg width="170" height="150" viewBox="0 0 150 130" aria-hidden="true">
    <rect x="18" y="58" width="114" height="62" rx="6" strokeWidth="4" style={{ fill: 'var(--color-earned-deep)', stroke: 'var(--color-earned)' }} />
    <rect x="18" y="76" width="114" height="8" style={{ fill: 'var(--color-earned)' }} />
    <rect x="66" y="70" width="18" height="22" rx="3" strokeWidth="2" style={{ fill: 'var(--color-earned-soft)', stroke: 'var(--color-earned-deep)' }} />
    <g style={{ transformBox: 'fill-box', transformOrigin: '0% 100%', transform: 'rotate(-28deg) translate(-4px,-8px)', transition: 'transform .8s' }}>
      <path d="M18 58 C18 30 40 20 75 20 C110 20 132 30 132 58 Z" strokeWidth="4" strokeLinejoin="round" style={{ fill: 'var(--color-earned-deep)', stroke: 'var(--color-earned)' }} />
      <path d="M40 26 L40 58 M110 26 L110 58" strokeWidth="3" style={{ stroke: 'var(--color-earned)' }} />
    </g>
  </svg>
);

const Reward: React.FC<{ moment: Moment; streak: number }> = ({ moment, streak }) => {
  const xp = moment.kind === 'boss' ? XP_RULES.boss : moment.kind === 'week' ? XP_RULES.perfectWeek : null;
  // An act's name is already the big line; under it goes "Act IV cleared". The campaign has its own text.
  if (moment.kind === 'act') return <p className="text-sm text-fg-3 max-w-xs">{moment.title}</p>;
  if (moment.kind === 'campaign') return null;
  if (xp === null && moment.kind !== 'day') return <p className="text-sm text-fg-3 max-w-xs">{moment.detail}</p>;
  return (
    <div className="flex gap-3 anim-rise" style={{ animationDelay: '.3s' }}>
      {xp !== null && (
        <span className="notch flex flex-col items-center justify-center w-28 h-20 rounded-card bg-earned-deep">
          <span className="num font-bold text-[28px] leading-none text-earned">+{xp}</span>
          <span className="eyebrow text-earned-dim">XP</span>
        </span>
      )}
      {moment.kind === 'day' && (
        <span className="notch flex flex-col items-center justify-center w-28 h-20 rounded-card bg-earned-deep text-earned">
          <FlameIcon className="w-6 h-6" lit />
          <span className="font-display font-bold">
            {streak} day{streak === 1 ? '' : 's'}
          </span>
        </span>
      )}
    </div>
  );
};
