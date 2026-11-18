'use client';

import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export type ThemeKey = 'push' | 'pull' | 'legs' | 'core' | 'recovery' | 'rest' | 'gold' | 'hp';

export interface Theme {
  label: string;
  text: string;
  border: string;
  bg: string;
  /** A flat fill (a `bg-*` class) for meters and dots. */
  bar: string;
}

/** Lanes and day types get no colour of their own: chalk on iron, told apart by label. */
const NEUTRAL = { text: 'text-fg-2', border: 'border-ink-600', bg: 'bg-ink-800', bar: 'bg-progress' };

/**
 * Full class strings on purpose — Tailwind scans source literally, so a
 * `bg-${colour}-500` template would compile to nothing. Only the accents that
 * mean something keep a hue: steel for recovery (armour work), gold for what
 * is earned, crimson for HP.
 */
export const THEME: Record<ThemeKey, Theme> = {
  push: { label: 'Push', ...NEUTRAL },
  pull: { label: 'Pull', ...NEUTRAL },
  legs: { label: 'Legs', ...NEUTRAL },
  core: { label: 'Core', ...NEUTRAL },
  recovery: {
    label: 'Recovery',
    text: 'text-armour',
    border: 'border-armour-line',
    bg: 'bg-armour-deep',
    bar: 'bg-armour',
  },
  rest: {
    label: 'Rest',
    text: 'text-fg-3',
    border: 'border-ink-600',
    bg: 'bg-ink-900',
    bar: 'bg-ink-500',
  },
  gold: {
    label: 'Boss',
    text: 'text-earned',
    border: 'border-earned-line',
    bg: 'bg-earned-deep',
    bar: 'bg-earned',
  },
  hp: {
    label: 'HP',
    text: 'text-boss',
    border: 'border-boss-line',
    bg: 'bg-boss-deep',
    bar: 'bg-boss',
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
      className={`w-full ${height} rounded-[2px] bg-ink-700 overflow-hidden`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full ${THEME[theme].bar} transition-[width] duration-700 ease-[var(--ease-lift)]`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <section className={`rounded-card bg-ink-900 ${className}`}>
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
      <div className="p-2 rounded-tag bg-ink-800 text-fg-2 shrink-0">{icon}</div>
      <div className="min-w-0">
        <h2 className="font-display font-extrabold uppercase text-[22px] leading-none text-fg">{title}</h2>
        {subtitle && <p className="text-[13px] text-fg-4 mt-1.5 max-w-2xl">{subtitle}</p>}
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
  <div className="flex items-center gap-1.5 h-7 px-2 rounded-tag bg-ink-800 shrink-0">
    {icon}
    <span className="num font-bold text-fg text-[15px]">{value}</span>
    <span className="text-[12px] text-fg-4">{label}</span>
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
  accent = 'text-fg',
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

  // Input rules: an iron well with a hairline edge that turns chalk on focus.
  const button = size === 'sm' ? 'w-8 h-8 rounded-card' : 'w-11 h-11 rounded-card';
  const field = size === 'sm' ? 'h-8 px-2 rounded-card min-w-[84px]' : 'h-11 px-3 rounded-card min-w-[112px]';
  const digits = size === 'sm' ? 'text-sm w-[46px]' : 'text-lg w-[58px]';
  const showPlaceholder = placeholder !== undefined && draft === null && value === 0;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onCommit(clamp(value - step))}
        aria-label={`${ariaLabel}: decrease by ${step}`}
        className={`flex items-center justify-center ${button} bg-ink-900 border border-ink-700 text-fg-3 hover:text-fg hover:bg-ink-850 active:scale-[.97] transition cursor-pointer shrink-0`}
      >
        <Minus className="w-3.5 h-3.5" strokeWidth={2.6} />
      </button>

      <label className={`flex items-center justify-center gap-0.5 ${field} bg-ink-900 border border-ink-700 focus-within:border-act transition-colors cursor-text`}>
        {prefix && !showPlaceholder && <span className={`num font-bold ${accent} ${size === 'sm' ? 'text-sm' : 'text-lg'}`}>{prefix}</span>}
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
          className={`${digits} bg-transparent num font-bold text-center outline-none ${accent} placeholder:text-fg-5 placeholder:font-sans placeholder:text-[11px] placeholder:font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <span className="text-[11px] font-semibold text-fg-4">{unit}</span>
      </label>

      <button
        type="button"
        onClick={() => onCommit(clamp(value + step))}
        aria-label={`${ariaLabel}: increase by ${step}`}
        className={`flex items-center justify-center ${button} bg-ink-900 border border-ink-700 text-fg hover:bg-ink-850 active:scale-[.97] transition cursor-pointer shrink-0`}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
      </button>
    </div>
  );
};
