'use client';

import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export type ThemeKey = 'push' | 'pull' | 'legs' | 'core' | 'recovery' | 'rest' | 'gold' | 'hp';

export interface Theme {
  label: string;
  text: string;
  border: string;
  bg: string;
  bar: string;
}

/**
 * Full class strings on purpose — Tailwind scans source literally, so a
 * `bg-${colour}-500` template would compile to nothing.
 */
export const THEME: Record<ThemeKey, Theme> = {
  push: {
    label: 'Push',
    text: 'text-neon-cyan',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-950/40',
    bar: 'from-cyan-600 to-neon-cyan',
  },
  pull: {
    label: 'Pull',
    text: 'text-neon-emerald',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/40',
    bar: 'from-emerald-600 to-neon-emerald',
  },
  legs: {
    label: 'Legs',
    text: 'text-neon-amber',
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/40',
    bar: 'from-amber-600 to-neon-amber',
  },
  core: {
    label: 'Core',
    text: 'text-neon-purple',
    border: 'border-purple-500/40',
    bg: 'bg-purple-950/40',
    bar: 'from-purple-600 to-neon-purple',
  },
  recovery: {
    label: 'Recovery',
    text: 'text-sky-300',
    border: 'border-sky-500/40',
    bg: 'bg-sky-950/40',
    bar: 'from-sky-600 to-sky-300',
  },
  rest: {
    label: 'Rest',
    text: 'text-slate-300',
    border: 'border-slate-600/60',
    bg: 'bg-slate-900/60',
    bar: 'from-slate-600 to-slate-400',
  },
  gold: {
    label: 'Boss',
    text: 'text-neon-gold',
    border: 'border-amber-400/50',
    bg: 'bg-amber-950/40',
    bar: 'from-amber-500 via-neon-gold to-yellow-300',
  },
  hp: {
    label: 'HP',
    text: 'text-neon-rose',
    border: 'border-rose-500/40',
    bg: 'bg-rose-950/40',
    bar: 'from-rose-700 to-neon-rose',
  },
};

export function themeFor(key: string): Theme {
  return THEME[key as ThemeKey] ?? THEME.rest;
}

interface MeterBarProps {
  /** 0–1. */
  value: number;
  theme?: ThemeKey;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const MeterBar: React.FC<MeterBarProps> = ({ value, theme = 'push', size = 'md', label }) => {
  const pct = Math.min(100, Math.max(0, value * 100));
  const height = size === 'lg' ? 'h-3' : size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div
      className={`w-full ${height} rounded-full bg-dark-950 border border-slate-800/80 overflow-hidden`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${THEME[theme].bar} transition-[width] duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <section className={`bg-dark-900/70 backdrop-blur-sm border border-slate-800/80 rounded-2xl shadow-xl ${className}`}>
    {children}
  </section>
);

interface PanelHeadProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export const PanelHead: React.FC<PanelHeadProps> = ({ icon, title, subtitle, right }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
    <div className="flex items-start gap-3 min-w-0">
      <div className="p-2 rounded-xl bg-dark-950 border border-slate-800 text-neon-cyan shrink-0">{icon}</div>
      <div className="min-w-0">
        <h2 className="text-base font-black text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">{subtitle}</p>}
      </div>
    </div>
    {right}
  </div>
);

/** A count pill for panel headers, e.g. "3 / 10 defeated". */
export const Tally: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-950 border border-slate-800 shrink-0">
    {icon}
    <span className="font-mono font-black text-white text-sm">{value}</span>
    <span className="text-[11px] text-slate-500">{label}</span>
  </div>
);

interface StepperProps {
  value: number;
  step: number;
  min?: number;
  max?: number;
  unit: string;
  prefix?: string;
  accent?: string;
  size?: 'sm' | 'md';
  /** Shown instead of the number until something is logged. */
  placeholder?: string;
  ariaLabel: string;
  onCommit: (value: number) => void;
}

/**
 * A number with −/+ buttons. Typed input is held as a draft and committed on
 * blur or Enter, so typing "62.5" logs one lift, not three.
 */
export const Stepper: React.FC<StepperProps> = ({
  value,
  step,
  min = 0,
  max = 999,
  unit,
  prefix = '',
  accent = 'text-white',
  size = 'md',
  placeholder,
  ariaLabel,
  onCommit,
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 10) / 10));

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number.parseFloat(draft);
    setDraft(null);
    if (Number.isFinite(parsed) && clamp(parsed) !== value) onCommit(clamp(parsed));
  };

  const button =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg'
      : 'w-9 h-9 rounded-xl';
  const field = size === 'sm' ? 'h-7 px-2 rounded-lg min-w-[84px]' : 'h-9 px-3 rounded-xl min-w-[112px]';
  const digits = size === 'sm' ? 'text-sm w-[46px]' : 'text-lg w-[58px]';
  const showPlaceholder = placeholder !== undefined && draft === null && value === 0;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onCommit(clamp(value - step))}
        aria-label={`${ariaLabel}: decrease by ${step}`}
        className={`flex items-center justify-center ${button} bg-dark-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 active:scale-90 transition cursor-pointer shrink-0`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <label className={`flex items-baseline justify-center gap-0.5 ${field} bg-dark-950 border border-slate-800 focus-within:border-slate-500 transition-colors cursor-text`}>
        {prefix && !showPlaceholder && <span className={`font-mono font-black ${accent} ${size === 'sm' ? 'text-sm' : 'text-lg'}`}>{prefix}</span>}
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
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          className={`${digits} bg-transparent font-mono font-black text-center outline-none ${accent} placeholder:text-slate-600 placeholder:font-sans placeholder:text-[11px] placeholder:font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <span className="text-[10px] font-bold text-slate-500 uppercase">{unit}</span>
      </label>

      <button
        type="button"
        onClick={() => onCommit(clamp(value + step))}
        aria-label={`${ariaLabel}: increase by ${step}`}
        className={`flex items-center justify-center ${button} bg-dark-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 active:scale-90 transition cursor-pointer shrink-0`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
