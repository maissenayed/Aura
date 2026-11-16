'use client';

import React, { useEffect, useRef } from 'react';
import { Flame, Hexagon, Trophy } from 'lucide-react';
import { CampaignPlan } from '../../utils/campaignPlan';
import { LevelStatus, XP_RULES } from '../../utils/protocolEngine';
import { figureForBoss } from './figures';
import { Figure, HexLevel } from './kit';
import type { Moment } from './GameProvider';

/**
 * The big moments, full screen and nearly wordless: a level, a boss slain, a
 * perfect day or week, a new attribute. One at a time; Continue (or Escape)
 * moves on to the next one in the queue.
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
  const rays = gold ? 'rgba(255,194,71,.14)' : 'rgba(167,123,255,.16)';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={moment.title}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(4,3,2,.92)] px-6 anim-fade"
    >
      <div className="w-full max-w-md flex flex-col items-center gap-5 text-center">
        <div className="relative w-[300px] h-[260px] flex items-center justify-center">
          <div
            className="absolute w-[340px] h-[340px] rounded-full anim-rays"
            style={{ background: `repeating-conic-gradient(from 0deg, ${rays} 0deg 8deg, transparent 8deg 22deg)` }}
          />
          <div
            className="absolute w-[220px] h-[220px] rounded-full"
            style={{ background: `radial-gradient(circle, ${gold ? 'rgba(255,194,71,.4)' : 'rgba(167,123,255,.4)'}, transparent 70%)` }}
          />
          <div className="relative anim-pop">
            <MomentArt moment={moment} plan={plan} level={level} streak={streak} />
          </div>
        </div>

        <h2 className={`font-display font-bold text-3xl tracking-[0.08em] uppercase anim-rise ${gold ? 'text-earned' : 'text-aura-soft'}`}>
          {headline(moment)}
        </h2>
        <p className="font-display font-bold text-xl text-fg anim-rise" style={{ animationDelay: '.15s' }}>
          {moment.kind === 'boss' ? moment.detail : moment.kind === 'level' ? level.rank : moment.title}
        </p>
        <Reward moment={moment} streak={streak} />

        <button
          ref={button}
          type="button"
          onClick={onDone}
          className="mt-2 w-full h-14 rounded-[18px] bg-earned text-earned-deep font-display font-bold text-lg tracking-[0.06em] active:scale-[.98] transition cursor-pointer"
        >
          CONTINUE
        </button>
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
        <span className="absolute -bottom-4 px-4 py-1 border-4 border-boss rounded-[10px] bg-[rgba(10,4,6,.75)] font-display font-bold text-4xl tracking-[0.14em] text-boss anim-stamp">
          SLAIN
        </span>
      </div>
    );
  }
  if (moment.kind === 'week') return <Trophy className="w-36 h-36 text-earned" strokeWidth={1.4} />;
  if (moment.kind === 'attribute') return <Hexagon className="w-36 h-36 text-aura" strokeWidth={1.4} />;
  return (
    <div className="relative">
      <Chest />
      {streak > 0 && (
        <span className="absolute -top-2 -right-6 flex items-center gap-1 h-9 px-3 rounded-full bg-[#1a1208] border border-[#4a3410] text-earned font-display font-bold">
          <Flame className="w-4 h-4" /> {streak}
        </span>
      )}
    </div>
  );
};

/** A loot chest with its lid swinging open. */
const Chest: React.FC = () => (
  <svg width="170" height="150" viewBox="0 0 150 130" aria-hidden="true">
    <rect x="18" y="58" width="114" height="62" rx="8" fill="#2a1d08" stroke="#ffc247" strokeWidth="4" />
    <rect x="18" y="76" width="114" height="8" fill="#ffc247" />
    <rect x="66" y="70" width="18" height="22" rx="3" fill="#ffe2a3" stroke="#1a1204" strokeWidth="2" />
    <g style={{ transformBox: 'fill-box', transformOrigin: '0% 100%', transform: 'rotate(-28deg) translate(-4px,-8px)', transition: 'transform .8s' }}>
      <path d="M18 58 C18 30 40 20 75 20 C110 20 132 30 132 58 Z" fill="#3a2a0c" stroke="#ffc247" strokeWidth="4" strokeLinejoin="round" />
      <path d="M40 26 L40 58 M110 26 L110 58" stroke="#ffc247" strokeWidth="3" />
    </g>
  </svg>
);

const Reward: React.FC<{ moment: Moment; streak: number }> = ({ moment, streak }) => {
  const xp = moment.kind === 'boss' ? XP_RULES.boss : moment.kind === 'week' ? XP_RULES.perfectWeek : null;
  if (xp === null && moment.kind !== 'day') return <p className="text-sm text-fg-3 max-w-xs">{moment.detail}</p>;
  return (
    <div className="flex gap-3 anim-rise" style={{ animationDelay: '.3s' }}>
      {xp !== null && (
        <span className="flex flex-col items-center justify-center w-28 h-20 rounded-[18px] bg-[#14100a] border border-[#5c4a22]">
          <span className="font-display font-bold text-2xl text-earned">+{xp}</span>
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#b4975b]">XP</span>
        </span>
      )}
      {moment.kind === 'day' && (
        <span className="flex flex-col items-center justify-center w-28 h-20 rounded-[18px] bg-[#1a1208] border border-[#4a3410] text-earned">
          <Flame className="w-6 h-6" />
          <span className="font-display font-bold">
            {streak} day{streak === 1 ? '' : 's'}
          </span>
        </span>
      )}
    </div>
  );
};
