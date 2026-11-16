'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Crosshair, Lock } from 'lucide-react';
import { formatStatValue, unitLabel } from '../../utils/campaignPlan';
import { BossStatus, RequirementStatus } from '../../utils/protocolEngine';
import { useGame } from './GameProvider';
import { figureForBoss } from './figures';
import { HP_MAX, bossHp } from './helpers';
import { Figure, Label, Ring, Stepper } from './kit';

/**
 * One boss, up close. Its requirements are its weak points: logging a better
 * number on a linked lift is a hit, so the HP bar drops (a pale ghost bar
 * trails behind), the boss flinches and the damage floats up.
 */
export const FightPanel: React.FC<{ status: BossStatus; showBack?: boolean }> = ({ status, showBack = false }) => {
  const hp = bossHp(status);
  const previous = useRef(hp);
  const [hit, setHit] = useState<{ amount: number; id: number } | null>(null);
  const state = status.defeated ? 'slain' : status.sealed ? 'sealed' : 'boss';

  useEffect(() => {
    if (hp < previous.current) setHit({ amount: previous.current - hp, id: Date.now() });
    previous.current = hp;
  }, [hp]);
  useEffect(() => {
    if (!hit) return;
    const timer = window.setTimeout(() => setHit(null), 1100);
    return () => window.clearTimeout(timer);
  }, [hit]);

  const glow = status.defeated ? 'rgba(255,194,71,.45)' : status.sealed ? 'rgba(90,100,130,.25)' : 'rgba(255,84,112,.5)';

  return (
    <section
      aria-label={status.boss.name}
      className={`flex flex-col gap-4 p-4 lg:p-5 rounded-[26px] border ${
        status.defeated ? 'border-[#5c4a22]' : status.sealed ? 'border-ink-600' : 'border-[#3a1624]'
      }`}
      style={{ background: `radial-gradient(circle at 50% 22%, ${status.defeated ? '#2a1f0a' : status.sealed ? '#11141d' : '#2a0a14'}, #0a0d16 62%)` }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <Link
            href="/bosses"
            aria-label="Back to bosses"
            className="lg:hidden w-11 h-11 shrink-0 rounded-[14px] border border-[#2a2030] bg-[#0e0b12] text-fg-2 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className={`text-[11px] font-extrabold tracking-[0.16em] uppercase ${status.defeated ? 'text-earned' : status.sealed ? 'text-fg-3' : 'text-boss'}`}>
            {status.defeated ? 'Slain' : status.sealed ? `Sealed · ${status.sealedBy ?? 'another boss first'}` : `Boss ${status.order}`}
          </span>
          <h1 className="font-display font-bold text-[22px] lg:text-2xl leading-tight">{status.boss.name}</h1>
          <span className="text-xs text-fg-4">{status.boss.epithet}</span>
        </div>
      </div>

      {/* Arena */}
      <div className="relative h-[250px] flex items-center justify-center">
        <div className="absolute w-[240px] h-[240px] rounded-full" style={{ background: `radial-gradient(circle, ${glow}, transparent 66%)` }} />
        <div key={hit?.id ?? 'still'} className={hit ? 'anim-shake' : ''}>
          <div className={status.defeated ? '' : 'anim-breathe'} style={{ filter: `drop-shadow(0 0 16px ${glow})` }}>
            <Figure spec={figureForBoss(status.boss)} state={state} animate={!status.sealed} className="w-[220px] h-[220px]" />
          </div>
        </div>
        {status.sealed && (
          <>
            <div className="absolute inset-x-6 inset-y-0 rounded-3xl chains" />
            <span className="absolute w-16 h-16 rounded-full bg-[#0c0f18] border-2 border-ink-500 flex items-center justify-center">
              <Lock className="w-7 h-7 text-fg-2" />
            </span>
          </>
        )}
        {status.defeated && (
          <span className="absolute bottom-3 px-4 py-0.5 border-4 border-boss rounded-[10px] bg-[rgba(10,4,6,.7)] font-display font-bold text-3xl tracking-[0.14em] text-boss -rotate-[8deg]">
            SLAIN
          </span>
        )}
        {hit && (
          <>
            <span
              key={`slash-${hit.id}`}
              className="absolute w-[220px] h-1.5 rounded-full anim-slash"
              style={{ background: 'linear-gradient(90deg, transparent, #fff, transparent)', boxShadow: '0 0 18px #3ee8ff' }}
            />
            <span
              key={`dmg-${hit.id}`}
              className="absolute left-1/2 top-14 font-display font-bold text-[40px] text-white anim-dmg"
              style={{ textShadow: '0 0 18px #ff5470, 0 2px 0 #ff5470' }}
            >
              −{hit.amount}
            </span>
          </>
        )}
      </div>

      {/* HP */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between font-display font-bold">
          <span className="text-[13px] tracking-[0.16em] text-[#a55a6a]">HP</span>
          <span>
            <span className="text-2xl text-boss">{hp}</span>
            <span className="text-sm text-[#6a3a46]"> / {HP_MAX}</span>
          </span>
        </div>
        <div className="relative h-[18px] rounded-md bg-[#1e0b11] border border-[#3a1624] overflow-hidden" role="progressbar" aria-label="Boss HP" aria-valuenow={hp} aria-valuemin={0} aria-valuemax={HP_MAX}>
          <div className="absolute inset-y-0 left-0 bg-[#ffd1da] transition-[width] duration-700 delay-500" style={{ width: `${hp / 10}%` }} />
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#c22a48] to-boss transition-[width] duration-200" style={{ width: `${hp / 10}%` }} />
          <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 calc(10% - 2px), #1e0b11 calc(10% - 2px) 10%)' }} />
        </div>
      </div>

      {/* Weak points */}
      <div className="flex flex-col gap-2.5">
        <span className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-act" />
          <Label>Weak points</Label>
        </span>
        {status.requirements.map((req, index) => (
          <WeakPoint key={index} req={req} locked={status.sealed && !status.defeated} />
        ))}
      </div>
    </section>
  );
};

const WeakPoint: React.FC<{ req: RequirementStatus; locked: boolean }> = ({ req, locked }) => {
  const { save, logStat, toggleMilestone, weighIn, derived } = useGame();
  const done = req.met;
  const kind = req.requirement.kind;

  let action: React.ReactNode = null;
  let value = '';
  if (kind === 'lift' && req.lift) {
    const lift = req.lift;
    value = `${formatStatValue(req.current, lift.unit)} / ${formatStatValue(req.target, lift.unit)}`;
    if (!done && !locked) {
      action = (
        <Stepper
          value={req.current}
          step={lift.step}
          unit={unitLabel(lift.unit)}
          prefix={lift.unit === 'added-kg' ? '+' : ''}
          ariaLabel={`${lift.name}, log a new best`}
          onCommit={(next) => logStat(lift.id, next)}
        />
      );
    }
  } else if (kind === 'multiple' && req.lift) {
    const lift = req.lift;
    value = `${formatStatValue(req.current, lift.unit)} / ${formatStatValue(req.target, lift.unit)} at ${save.bodyWeightKg} kg`;
    if (!done && !locked) {
      action = (
        <Stepper
          value={req.current}
          step={lift.step}
          unit={unitLabel(lift.unit)}
          prefix={lift.unit === 'added-kg' ? '+' : ''}
          ariaLabel={`${lift.name}, log a new best`}
          onCommit={(next) => logStat(lift.id, next)}
        />
      );
    }
  } else if (kind === 'scale') {
    value = `${save.bodyWeightKg} kg / ${req.target} kg`;
    if (!done && !locked) {
      action = <Stepper value={save.bodyWeightKg} step={0.1} min={30} max={250} unit="kg" ariaLabel="Today's bodyweight" onCommit={weighIn} />;
    }
  } else if (kind === 'skill' && req.climb) {
    const climb = req.climb;
    value = `${climb.mastered} / ${climb.floors} skills mastered`;
    if (!done && !locked && climb.next.length) {
      action = (
        <span className="basis-full flex flex-wrap gap-1.5" aria-label="Master next">
          {climb.next.slice(0, 4).map((skill) => (
            <Link
              key={skill.id}
              href={`/?tree=${climb.tree}&skill=${encodeURIComponent(skill.id)}`}
              className="min-h-9 px-3 py-1.5 rounded-[12px] border-[1.5px] border-act/60 text-act text-[12.5px] font-semibold flex items-center"
            >
              L{skill.level} · {skill.name}
            </Link>
          ))}
        </span>
      );
    }
  } else if (req.requirement.kind === 'milestone') {
    const id = req.requirement.milestone;
    const claimed = Boolean(save.milestones[id]);
    value = claimed ? 'Claimed' : 'Milestone';
    if (!locked) {
      action = (
        <button
          type="button"
          onClick={() => toggleMilestone(id)}
          aria-pressed={claimed}
          className={`h-11 px-4 rounded-[14px] font-display font-bold text-sm cursor-pointer transition ${
            claimed ? 'bg-earned text-earned-deep' : 'bg-act text-act-deep'
          }`}
        >
          {claimed ? 'UNDO' : 'CLAIM'}
        </button>
      );
    }
  } else if (req.requirement.kind === 'boss') {
    const other = derived.bosses.find((entry) => entry.boss.id === (req.requirement as { boss: string }).boss);
    value = done ? 'Slain' : 'Boss';
    if (!done && other) {
      action = (
        <Link href={`/bosses/${other.boss.id}`} className="h-11 px-4 rounded-[14px] border-[1.5px] border-boss text-boss-soft font-display font-bold text-sm flex items-center">
          FIGHT
        </Link>
      );
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 p-2.5 pl-3 rounded-[18px] border-[1.5px] ${done ? 'bg-[#100d07] border-[#4a3a18]' : 'bg-ink-850 border-ink-700'}`}>
      <Ring value={req.ratio} size={46} stroke={5} tone={done ? 'earned' : 'act'}>
        <span className={`font-display font-bold text-[11px] ${done ? 'text-earned' : 'text-act'}`}>{Math.round(req.ratio * 100)}%</span>
      </Ring>
      <span className="flex-1 min-w-[120px] flex flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold text-fg-2 leading-tight">{req.label}</span>
        <span className={`font-display font-bold text-base ${done ? 'text-earned' : 'text-fg'}`}>{value}</span>
      </span>
      {done && kind !== 'milestone' ? (
        <span className="w-11 h-11 rounded-[14px] bg-earned flex items-center justify-center" aria-label="Broken">
          <Check className="w-5 h-5 text-earned-deep" strokeWidth={3.2} />
        </span>
      ) : (
        action ??
        (locked && (
          <span className="w-11 h-11 rounded-[14px] bg-ink-800 border border-ink-600 flex items-center justify-center" aria-label="Sealed">
            <Lock className="w-[18px] h-[18px] text-fg-5" />
          </span>
        ))
      )}
    </div>
  );
};
