'use client';

import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { FigureSpec, MotionPlay, SkillFigure } from '../skilltree/SkillFigure';
import { FIGURE_ACCENT, FIGURE_TINT } from './figures';
import { CheckIcon, LockIcon } from './icons';

/**
 * The small pieces every game screen is built from. Chalk & Iron: chalk is the
 * action (act), gold is earned, crimson is a boss, steel is armour. Corners are
 * 4 (tags) or 10 (cards); game objects get the notch.
 */

export type Tone = 'act' | 'earned' | 'boss' | 'armour' | 'dim';

/** The same tones as CSS colours, for drawings. */
export const TONE_COLOR: Record<Tone, string> = {
  act: 'var(--color-progress)',
  earned: 'var(--color-earned)',
  boss: 'var(--color-boss)',
  armour: 'var(--color-armour)',
  dim: 'var(--color-ink-500)',
};

/* ------------------------------------------------------------------ */
/* Level badge                                                         */
/* ------------------------------------------------------------------ */

/**
 * The level inside the Ring: the brand mark doubles as the XP meter, gold and
 * open where the next level still has to be earned.
 */
export const HexLevel: React.FC<{ level: number; size?: 'sm' | 'md' | 'lg'; progress?: number; className?: string }> = ({
  level,
  size = 'md',
  progress = 0,
  className = '',
}) => {
  const box = size === 'lg' ? 160 : size === 'sm' ? 38 : 46;
  const stroke = size === 'lg' ? 12 : 4;
  const text = size === 'lg' ? 'text-7xl' : size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <Ring
      value={Math.max(0.02, progress)}
      size={box}
      stroke={stroke}
      tone="earned"
      className={className}
      label={`Level ${level}`}
    >
      <span className={`font-display font-extrabold leading-none ${text}`}>{level}</span>
    </Ring>
  );
};

/* ------------------------------------------------------------------ */
/* Rings and bars                                                      */
/* ------------------------------------------------------------------ */

interface RingProps {
  /** 0–1. */
  value: number;
  size: number;
  stroke?: number;
  tone?: Tone;
  track?: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Ring: React.FC<RingProps> = ({ value, size, stroke = 5, tone = 'act', track = 'var(--color-ink-700)', label, children, className = '' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: track }} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ stroke: TONE_COLOR[tone], transition: 'stroke-dashoffset .7s var(--ease-lift)' }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
};

const BAR_FILL: Record<Tone, string> = {
  act: 'bg-progress',
  earned: 'bg-earned',
  boss: 'bg-boss',
  armour: 'bg-armour',
  dim: 'bg-ink-500',
};

/**
 * Ten square-ended segments, like tally marks or plates on a bar. Height comes
 * from `className`. Built from spans, so it can sit inside a button or link.
 */
export const Meter: React.FC<{ value: number; tone?: Tone; className?: string; label?: string }> = ({
  value,
  tone = 'act',
  className = 'h-2',
  label,
}) => {
  const tenths = Math.min(10, Math.max(0, value * 10));
  return (
    <span
      className={`w-full flex gap-[2px] ${className}`}
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuenow={label ? Math.round(tenths * 10) : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
    >
      {Array.from({ length: 10 }, (_, index) => (
        <span key={index} className="relative flex-1 rounded-[1px] bg-ink-700 overflow-hidden">
          <span
            className={`absolute inset-y-0 left-0 ${BAR_FILL[tone]} transition-[width] duration-700 ease-[var(--ease-lift)]`}
            style={{ width: `${Math.min(1, Math.max(0, tenths - index)) * 100}%` }}
          />
        </span>
      ))}
    </span>
  );
};

/** One block per mission: gold once done. */
export const SegmentBar: React.FC<{ done: boolean[]; className?: string; label?: string }> = ({ done, className = '', label }) => (
  <div className={`flex gap-1 ${className}`} role="img" aria-label={label ?? `${done.filter(Boolean).length} of ${done.length} done`}>
    {done.map((on, index) => (
      <span key={index} className={`flex-1 h-2.5 rounded-[2px] transition-colors duration-300 ${on ? 'bg-earned' : 'bg-ink-700'}`} />
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

/** The square key that completes a mission; gold once done. */
export const TickButton: React.FC<{ done: boolean; onClick: () => void; label: string; size?: 'md' | 'lg'; disabled?: boolean }> = ({
  done,
  onClick,
  label,
  size = 'lg',
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={done}
    aria-label={label}
    className={`shrink-0 flex items-center justify-center rounded-card border-2 transition active:scale-[.97] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 ${
      size === 'lg' ? 'w-12 h-12' : 'w-11 h-11'
    } ${done ? 'bg-earned border-earned text-earned-deep' : 'border-fg-3 text-act hover:border-act hover:bg-ink-800'}`}
  >
    <CheckIcon className="w-6 h-6" strokeWidth={2.6} />
  </button>
);

const CHIP: Record<Tone, string> = {
  act: 'bg-ink-800 text-fg',
  earned: 'bg-earned-deep text-earned-soft',
  boss: 'bg-boss-deep text-boss-soft',
  armour: 'bg-armour-deep text-armour',
  dim: 'bg-ink-800 text-fg-3',
};

export const Chip: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'dim', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 h-7 px-2 rounded-tag font-display font-bold text-[14px] tracking-[0.02em] whitespace-nowrap ${CHIP[tone]} ${className}`}>
    {children}
  </span>
);

/** Small uppercase label above a group: one per group. */
export const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`eyebrow text-fg-4 ${className}`}>{children}</span>
);

/* ------------------------------------------------------------------ */
/* Number stepper                                                      */
/* ------------------------------------------------------------------ */

interface StepperProps {
  value: number;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
  prefix?: string;
  /** Gold when the value is a new best. */
  highlight?: boolean;
  placeholder?: string;
  ariaLabel: string;
  onCommit: (value: number) => void;
  /** Commit the number even when it is unchanged: typed again, or Enter on the shown value. For logging sessions. */
  commitSame?: boolean;
}

/**
 * −/+ with a typeable number between. Typed input is a draft committed on
 * blur or Enter, so typing "62.5" logs one lift, not three.
 */
export const Stepper: React.FC<StepperProps> = ({
  value,
  step,
  min = 0,
  max = 999,
  unit = '',
  prefix = '',
  highlight = false,
  placeholder,
  ariaLabel,
  onCommit,
  commitSame = false,
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 10) / 10));
  const showPlaceholder = placeholder !== undefined && draft === null && value === 0;
  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number.parseFloat(draft);
    setDraft(null);
    if (Number.isFinite(parsed) && (clamp(parsed) !== value || commitSame)) onCommit(clamp(parsed));
  };

  return (
    <div className="flex items-center h-11 rounded-card bg-ink-900 border border-ink-700 px-0.5">
      <button
        type="button"
        onClick={() => onCommit(clamp(value - step))}
        aria-label={`${ariaLabel}: decrease by ${step}`}
        className="w-10 h-10 flex items-center justify-center rounded-card text-fg-3 hover:text-fg active:scale-[.97] transition cursor-pointer"
      >
        <Minus className="w-4 h-4" strokeWidth={2.6} />
      </button>
      <label className={`flex items-baseline justify-center gap-0.5 min-w-[74px] num font-bold text-lg ${highlight ? 'text-earned' : 'text-fg'}`}>
        {prefix && !showPlaceholder && <span>{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          aria-label={ariaLabel}
          value={draft ?? (showPlaceholder ? '' : value)}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            // Enter on the number already shown logs it again: the same weight as last time.
            if (draft === null && commitSame && value > 0) onCommit(value);
            event.currentTarget.blur();
          }}
          className="w-[52px] bg-transparent text-center outline-none placeholder:text-fg-5 placeholder:font-sans placeholder:text-[11px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {unit && <span className="text-[11px] font-sans font-semibold text-fg-4">{unit}</span>}
      </label>
      <button
        type="button"
        onClick={() => onCommit(clamp(value + step))}
        aria-label={`${ariaLabel}: increase by ${step}`}
        className="w-10 h-10 flex items-center justify-center rounded-card text-fg hover:bg-ink-800 active:scale-[.97] transition cursor-pointer"
      >
        <Plus className="w-4 h-4" strokeWidth={2.6} />
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Figures                                                             */
/* ------------------------------------------------------------------ */

export type NodeState = keyof typeof FIGURE_TINT;

/** A skill drawing tinted for its state. Size comes from `className`. */
export const Figure: React.FC<{
  spec: FigureSpec;
  state?: NodeState;
  accent?: string;
  animate?: boolean;
  className?: string;
  title?: string;
  underlay?: React.ReactNode;
  overlay?: (play: MotionPlay | null) => React.ReactNode;
  /** Thumbnail drawing (heavier lines, no labels); by default, whenever it is still. */
  compact?: boolean;
  alwaysAnimate?: boolean;
}> = ({ spec, state = 'ready', accent, animate = false, className = 'w-12 h-12', title, underlay, overlay, compact, alwaysAnimate }) => (
  <SkillFigure
    spec={spec}
    accent={accent ?? FIGURE_ACCENT[state]}
    tint={FIGURE_TINT[state]}
    compact={compact ?? !animate}
    alwaysAnimate={alwaysAnimate}
    animate={animate}
    className={className}
    title={title}
    underlay={underlay}
    overlay={overlay}
  />
);

const NODE_RING: Record<NodeState, string> = {
  mastered: 'border-earned bg-earned-deep',
  ready: 'border-act bg-ink-900',
  locked: 'border-dashed border-ink-500 bg-ink-950',
  boss: 'border-boss bg-boss-deep',
  slain: 'border-earned bg-earned-deep',
  sealed: 'border-ink-600 bg-ink-900 chains',
};

/** A circular skill node: figure inside a ring whose look says mastered / ready / locked. */
export const SkillNode: React.FC<{
  spec?: FigureSpec;
  state: NodeState;
  size?: number;
  boss?: boolean;
  badge?: React.ReactNode;
  selected?: boolean;
  /** The one next thing to do: a slow pulse. Only ever on one node. */
  pulse?: boolean;
  label: string;
  onClick?: () => void;
  className?: string;
}> = ({ spec, state, size = 64, boss = false, badge, selected = false, pulse = false, label, onClick, className = '' }) => {
  const look = `relative shrink-0 flex items-center justify-center border-2 transition ${
    boss ? 'rounded-[28%] border-[3px]' : 'rounded-full'
  } ${NODE_RING[state]} ${pulse ? (boss ? 'anim-boss' : 'anim-ready') : ''} ${selected ? 'outline-2 outline-offset-4 outline-act' : ''} ${className}`;
  const inner = (
    <>
      {spec && (
        <span className="overflow-hidden rounded-full flex items-center justify-center" style={{ width: size * 0.82, height: size * 0.82 }}>
          <Figure spec={spec} state={state} className="w-full h-full" />
        </span>
      )}
      {badge && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-[18px] px-1.5 rounded-tag bg-ink-950 border border-ink-600 num font-bold text-[11px] leading-4 text-fg-3 whitespace-nowrap">
          {badge}
        </span>
      )}
      {(state === 'mastered' || state === 'slain') && (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-tag bg-earned border-2 border-ink-950 flex items-center justify-center">
          <CheckIcon className="w-3 h-3 text-earned-deep" strokeWidth={3.6} />
        </span>
      )}
      {(state === 'locked' || state === 'sealed') && (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-tag bg-ink-800 border-2 border-ink-950 flex items-center justify-center">
          <LockIcon className="w-2.5 h-2.5 text-fg-4" strokeWidth={3} />
        </span>
      )}
    </>
  );
  // Without a click handler it is a picture, so it can sit inside a link.
  if (!onClick) {
    return (
      <span role="img" aria-label={label} style={{ width: size, height: size }} className={look}>
        {inner}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      style={{ width: size, height: size }}
      className={`${look} hover:scale-[1.04] active:scale-[.97] cursor-pointer`}
    >
      {inner}
    </button>
  );
};
