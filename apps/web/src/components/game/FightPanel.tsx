'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Crosshair } from 'lucide-react';
import { CheckIcon, LockIcon } from './icons';
import { formatStatValue, unitLabel } from '../../utils/campaignPlan';
import { BossStatus, RequirementStatus } from '../../utils/protocolEngine';
import { useGame } from './GameProvider';
import { figureForBoss } from './figures';
import { HP_MAX, bossHp, sealedLine } from './helpers';
import { ClipControl } from '../skilltree/ClipControl';
import { Figure, Label, Ring, Stepper } from './kit';

/**
 * One boss, up close. Its requirements are its weak points: logging a better
 * number on a linked lift is a hit, so the HP bar drops (a ghost segment
 * trails behind), the boss flinches and the damage floats up. Flat and
 * notched, like every game object: no glow, the light is the figure.
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

  return (
    <section
      aria-label={status.boss.name}
      className={`notch flex flex-col gap-4 p-4 lg:p-5 rounded-card ${status.defeated ? 'bg-earned-deep' : status.sealed ? 'bg-ink-900' : 'bg-boss-deep'}`}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <Link
            href="/bosses"
            aria-label="Back to bosses"
            className="lg:hidden w-11 h-11 shrink-0 rounded-card bg-ink-950/50 text-fg-2 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className={`eyebrow ${status.defeated ? 'text-earned' : status.sealed ? 'text-fg-3' : 'text-boss-soft'}`}>
            {status.defeated
              ? 'Slain'
              : status.ready
                ? 'Staggered · falls next week'
                : status.sealed
                  ? `Sealed · ${sealedLine(status.sealedBy)}`
                  : `Boss ${status.order}`}
          </span>
          <h1 className="font-display font-extrabold uppercase text-[28px] lg:text-[32px] leading-[0.95]">{status.boss.name}</h1>
          <span className="text-[13px] text-fg-3">{status.boss.epithet}</span>
        </div>
      </div>

      {/* Arena */}
      <div className="relative h-[250px] flex items-center justify-center rounded-card bg-ink-950/40">
        <div key={hit?.id ?? 'still'} className={hit ? 'anim-shake' : ''}>
          <Figure spec={figureForBoss(status.boss)} state={state} animate={!status.sealed} className="w-[220px] h-[220px]" />
        </div>
        {status.sealed && (
          <>
            <div className="absolute inset-0 rounded-card chains" />
            <span className="absolute w-16 h-16 rounded-card bg-ink-950 border-2 border-ink-500 flex items-center justify-center">
              <LockIcon className="w-7 h-7 text-fg-2" />
            </span>
          </>
        )}
        {status.defeated && (
          <span className="absolute bottom-3 px-4 py-0.5 border-4 border-earned rounded-tag bg-ink-950/80 font-display font-black text-4xl uppercase tracking-[0.08em] text-earned -rotate-[8deg] anim-stamp">
            Slain
          </span>
        )}
        {hit && (
          <>
            <span key={`slash-${hit.id}`} className="absolute w-[220px] h-1 rounded-[2px] bg-fg anim-slash" />
            <span key={`dmg-${hit.id}`} className="absolute left-1/2 top-14 num font-black text-[44px] text-boss anim-dmg">
              −{hit.amount}
            </span>
          </>
        )}
      </div>

      {/* HP */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow text-boss-soft">HP</span>
          <span className="num font-bold">
            <span className="text-[28px] text-boss">{hp}</span>
            <span className="text-sm text-boss-dim"> / {HP_MAX}</span>
          </span>
        </div>
        {/* Ten plates. The ghost (the hit you just landed) drains after the bar. */}
        <div className="relative h-[16px] flex gap-[2px]" role="progressbar" aria-label="Boss HP" aria-valuenow={hp} aria-valuemin={0} aria-valuemax={HP_MAX}>
          {Array.from({ length: 10 }, (_, index) => {
            const fill = Math.min(1, Math.max(0, hp / 100 - index));
            return (
              <span key={index} className="relative flex-1 rounded-[1px] bg-ink-950/60 overflow-hidden">
                <span className="absolute inset-y-0 left-0 bg-boss-ghost transition-[width] duration-700 delay-500" style={{ width: `${fill * 100}%` }} />
                <span className="absolute inset-y-0 left-0 bg-boss transition-[width] duration-200" style={{ width: `${fill * 100}%` }} />
              </span>
            );
          })}
        </div>
      </div>

      {/* Weak points */}
      <div className="flex flex-col gap-2.5">
        <span className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-fg-3" />
          <Label>Weak points</Label>
        </span>
        {status.ready && (
          <p className="text-[13px] text-fg-2 leading-snug">
            Every weak point is broken. One boss falls each campaign week, and one already fell this week: this one falls on
            Monday, as long as the numbers still hold.
          </p>
        )}
        {status.requirements.map((req, index) => (
          <WeakPoint key={index} req={req} locked={status.sealed && !status.defeated} />
        ))}
        {(status.defeated || status.ready) && <ClipControl skillKey={`boss:${status.boss.id}`} />}
      </div>
    </section>
  );
};

const WeakPoint: React.FC<{ req: RequirementStatus; locked: boolean }> = ({ req, locked }) => {
  const { save, logStat, weighIn, derived } = useGame();
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
    value = climb.done && !climb.proven ? `Placed · prove ${climb.name} to land the blow` : `${climb.mastered} / ${climb.floors} skills mastered`;
    if (!done && !locked && climb.next.length) {
      action = (
        <span className="basis-full flex flex-wrap gap-1.5" aria-label="Master next">
          {climb.next.slice(0, 4).map((skill) => (
            <Link
              key={skill.id}
              href={`/?tree=${climb.tree}&skill=${encodeURIComponent(skill.id)}`}
              className="min-h-9 px-3 py-1.5 rounded-card border border-ink-600 text-fg text-[13px] font-semibold flex items-center hover:bg-ink-850"
            >
              L{skill.level} · {skill.name}
            </Link>
          ))}
        </span>
      );
    }
  } else if (req.requirement.kind === 'boss') {
    const other = derived.bosses.find((entry) => entry.boss.id === (req.requirement as { boss: string }).boss);
    value = done ? 'Slain' : 'Boss';
    if (!done && other) {
      action = (
        <Link href={`/bosses/${other.boss.id}`} className="h-11 px-4 rounded-card bg-boss text-ink-950 font-display font-extrabold uppercase text-lg tracking-[0.02em] flex items-center active:scale-[.97] transition">
          Fight
        </Link>
      );
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 p-2.5 pl-3 rounded-card ${done ? 'bg-earned-deep' : 'bg-ink-900'}`}>
      <Ring value={req.ratio} size={46} stroke={5} tone={done ? 'earned' : 'act'}>
        <span className={`num font-bold text-[12px] ${done ? 'text-earned' : 'text-fg-2'}`}>{Math.round(req.ratio * 100)}%</span>
      </Ring>
      <span className="flex-1 min-w-[120px] flex flex-col gap-0.5">
        <span className="text-[13.5px] font-medium text-fg-2 leading-tight">{req.label}</span>
        <span className={`num font-bold text-[17px] ${done ? 'text-earned' : 'text-fg'}`}>{value}</span>
        {!done && req.lift && req.pending != null && req.pending > req.current && (
          <span className="text-[12px] text-fg-3 leading-snug">
            {formatStatValue(req.pending, req.lift.unit)} logged · counts when you show it again on another day within two weeks
          </span>
        )}
      </span>
      {done && kind !== 'milestone' ? (
        <span className="w-11 h-11 rounded-card bg-earned flex items-center justify-center" aria-label="Broken">
          <CheckIcon className="w-5 h-5 text-earned-deep" strokeWidth={3.2} />
        </span>
      ) : (
        action ??
        (locked && (
          <span className="w-11 h-11 rounded-card bg-ink-800 flex items-center justify-center" aria-label="Sealed">
            <LockIcon className="w-[18px] h-[18px] text-fg-5" />
          </span>
        ))
      )}
    </div>
  );
};
