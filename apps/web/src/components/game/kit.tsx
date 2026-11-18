'use client';

import React, { useState } from 'react';
import { Check, Lock, Minus, Plus } from 'lucide-react';
import { FigureSpec, SkillFigure } from '../skilltree/SkillFigure';
import { FIGURE_TINT } from './figures';

/**
 * The small pieces every game screen is built from. Colours follow the four
 * meanings: act (cyan), earned (gold), boss (rose), aura (violet).
 */

export type Tone = 'act' | 'earned' | 'boss' | 'aura' | 'dim';

export const TONE_HEX: Record<Tone, string> = {
  act: '#3ee8ff',
  earned: '#ffc247',
  boss: '#ff5470',
  aura: '#a77bff',
  dim: '#3a4258',
};

/* ------------------------------------------------------------------ */
/* Level badge                                                         */
/* ------------------------------------------------------------------ */

export const HexLevel: React.FC<{ level: number; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  level,
  size = 'md',
  className = '',
}) => {
  const box = size === 'lg' ? 'w-[150px] h-[166px] text-7xl' : size === 'sm' ? 'w-10 h-11 text-[17px]' : 'w-[46px] h-[50px] text-xl';
  return (
    <div
      className={`hex-clip shrink-0 flex items-center justify-center bg-gradient-to-br from-[#ffe2a3] to-[#e3a12f] font-display font-bold text-earned-deep ${box} ${className}`}
      aria-label={`Level ${level}`}
    >
      {level}
    </div>
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

export const Ring: React.FC<RingProps> = ({ value, size, stroke = 5, tone = 'act', track = '#1d2435', label, children, className = '' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_HEX[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .7s ease-out' }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
};

const BAR_FILL: Record<Tone, string> = {
  act: 'bg-act',
  earned: 'bg-earned',
  boss: 'bg-boss',
  aura: 'bg-gradient-to-r from-aura to-act',
  dim: 'bg-ink-500',
};
const BAR_TRACK: Record<Tone, string> = {
  act: 'bg-[#13222c]',
  earned: 'bg-ink-700',
  boss: 'bg-[#2a1018]',
  aura: 'bg-ink-750',
  dim: 'bg-ink-700',
};

export const Meter: React.FC<{ value: number; tone?: Tone; className?: string; label?: string }> = ({
  value,
  tone = 'act',
  className = 'h-2',
  label,
}) => {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div
      className={`w-full rounded-full overflow-hidden ${BAR_TRACK[tone]} ${className}`}
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuenow={label ? Math.round(pct) : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
    >
      <div className={`h-full rounded-full ${BAR_FILL[tone]} transition-[width] duration-700 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
};

/** One block per mission: filled gold once done. */
export const SegmentBar: React.FC<{ done: boolean[]; className?: string; label?: string }> = ({ done, className = '', label }) => (
  <div className={`flex gap-1 ${className}`} role="img" aria-label={label ?? `${done.filter(Boolean).length} of ${done.length} done`}>
    {done.map((on, index) => (
      <span key={index} className={`flex-1 h-2.5 rounded-full transition-colors duration-300 ${on ? 'bg-earned' : 'bg-ink-700'}`} />
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export const TickButton: React.FC<{ done: boolean; onClick: () => void; label: string; size?: 'md' | 'lg' }> = ({
  done,
  onClick,
  label,
  size = 'lg',
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={done}
    aria-label={label}
    className={`shrink-0 flex items-center justify-center rounded-full border-2 transition active:scale-90 cursor-pointer ${
      size === 'lg' ? 'w-12 h-12' : 'w-11 h-11'
    } ${done ? 'bg-earned border-earned text-earned-deep' : 'border-act text-act hover:bg-act/10'}`}
  >
    <Check className="w-6 h-6" strokeWidth={3} />
  </button>
);

export const Chip: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'dim', children, className = '' }) => {
  const style: Record<Tone, string> = {
    act: 'bg-[#08161d] border-[#17566a] text-act',
    earned: 'bg-[#14100a] border-[#3a2c12] text-earned',
    boss: 'bg-[#16090d] border-[#4a1a28] text-boss-soft',
    aura: 'bg-[#120c1d] border-[#3d2a63] text-aura-soft',
    dim: 'bg-ink-800 border-ink-600 text-fg-3',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border font-display font-bold text-[13px] whitespace-nowrap ${style[tone]} ${className}`}>
      {children}
    </span>
  );
};

/** Small uppercase label above a group. */
export const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`text-[11px] font-extrabold tracking-[0.14em] uppercase text-fg-4 ${className}`}>{children}</span>
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
    <div className="flex items-center h-11 rounded-[14px] bg-ink-950 border border-ink-700 px-0.5">
      <button
        type="button"
        onClick={() => onCommit(clamp(value - step))}
        aria-label={`${ariaLabel}: decrease by ${step}`}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-fg-3 hover:text-fg active:scale-90 transition cursor-pointer"
      >
        <Minus className="w-4 h-4" strokeWidth={3} />
      </button>
      <label className={`flex items-baseline justify-center gap-0.5 min-w-[74px] font-display font-bold text-lg ${highlight ? 'text-earned' : 'text-fg'}`}>
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
        {unit && <span className="text-[11px] font-sans font-bold text-fg-4">{unit}</span>}
      </label>
      <button
        type="button"
        onClick={() => onCommit(clamp(value + step))}
        aria-label={`${ariaLabel}: increase by ${step}`}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-act hover:bg-act/10 active:scale-90 transition cursor-pointer"
      >
        <Plus className="w-4 h-4" strokeWidth={3} />
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Figures                                                             */
/* ------------------------------------------------------------------ */

export type NodeState = keyof typeof FIGURE_TINT;

const STATE_ACCENT: Record<NodeState, string> = {
  mastered: '#ffc247',
  ready: '#3ee8ff',
  locked: '#4a5470',
  boss: '#ff5470',
  slain: '#ffc247',
  sealed: '#56607a',
};

/** A skill drawing tinted for its state. Size comes from `className`. */
export const Figure: React.FC<{
  spec: FigureSpec;
  state?: NodeState;
  accent?: string;
  animate?: boolean;
  className?: string;
  title?: string;
}> = ({ spec, state = 'ready', accent, animate = false, className = 'w-12 h-12', title }) => (
  <SkillFigure
    spec={spec}
    accent={accent ?? STATE_ACCENT[state]}
    tint={FIGURE_TINT[state]}
    compact={!animate}
    animate={animate}
    className={className}
    title={title}
  />
);

const NODE_RING: Record<NodeState, string> = {
  mastered: 'border-earned bg-[radial-gradient(circle_at_50%_40%,#3b2b0d,#120d05_72%)] shadow-[0_0_20px_rgba(255,194,71,0.28)]',
  ready: 'border-act bg-[radial-gradient(circle_at_50%_40%,#0b2630,#071017_72%)] anim-ready',
  locked: 'border-dashed border-[#2b3247] bg-[#0a0c13]',
  boss: 'border-boss bg-[radial-gradient(circle_at_50%_40%,#3a0f1a,#12070b_72%)] anim-boss',
  slain: 'border-earned bg-[radial-gradient(circle_at_50%_40%,#3b2b0d,#120d05_72%)]',
  sealed: 'border-[#5a2433] bg-[#12080c]',
};

/** A circular skill node: figure inside a ring whose look says mastered / ready / locked. */
export const SkillNode: React.FC<{
  spec?: FigureSpec;
  state: NodeState;
  size?: number;
  boss?: boolean;
  badge?: React.ReactNode;
  selected?: boolean;
  label: string;
  onClick?: () => void;
  className?: string;
}> = ({ spec, state, size = 64, boss = false, badge, selected = false, label, onClick, className = '' }) => {
  const look = `relative shrink-0 flex items-center justify-center border-2 transition ${
    boss ? 'rounded-[28%] border-[3px]' : 'rounded-full'
  } ${NODE_RING[state]} ${selected ? 'outline-2 outline-offset-4 outline-white' : ''} ${className}`;
  const inner = (
    <>
      {spec && (
        <span className="overflow-hidden rounded-full flex items-center justify-center" style={{ width: size * 0.82, height: size * 0.82 }}>
          <Figure spec={spec} state={state} className="w-full h-full" />
        </span>
      )}
      {badge && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 h-[18px] px-1.5 rounded-full bg-ink-950 border border-ink-600 font-display font-bold text-[10px] leading-4 text-fg-3 whitespace-nowrap">
          {badge}
        </span>
      )}
      {state === 'mastered' && (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-earned border-2 border-ink-950 flex items-center justify-center">
          <Check className="w-3 h-3 text-earned-deep" strokeWidth={4} />
        </span>
      )}
      {state === 'locked' && (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-ink-750 border-2 border-ink-950 flex items-center justify-center">
          <Lock className="w-2.5 h-2.5 text-fg-4" strokeWidth={3} />
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
      className={`${look} hover:scale-[1.06] active:scale-95 cursor-pointer`}
    >
      {inner}
    </button>
  );
};
