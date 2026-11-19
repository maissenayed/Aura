'use client';

import React, { useId, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* List helpers                                                        */
/* ------------------------------------------------------------------ */

export const setAt = <T,>(list: T[], index: number, item: T): T[] => list.map((entry, i) => (i === index ? item : entry));
export const removeAt = <T,>(list: T[], index: number): T[] => list.filter((_, i) => i !== index);
export function moveBy<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

const INPUT =
  'w-full h-11 px-3 rounded-card bg-ink-900 border border-ink-700 text-[15px] text-fg placeholder:text-fg-5 outline-none focus:border-act transition';

const LABEL = 'block mb-1.5 eyebrow text-fg-4';

interface FieldShell {
  label: string;
  hint?: string;
  className?: string;
}

const Hint: React.FC<{ id: string; text?: string }> = ({ id, text }) =>
  text ? (
    <span id={id} className="block mt-1 text-[12px] text-fg-4 leading-snug">
      {text}
    </span>
  ) : null;

export const TextField: React.FC<
  FieldShell & { value: string; onChange: (value: string) => void; placeholder?: string; maxLength?: number }
> = ({ label, hint, className, value, onChange, placeholder, maxLength = 160 }) => {
  const id = useId();
  return (
    <label className={`block ${className ?? ''}`}>
      <span className={LABEL}>{label}</span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT}
      />
      <Hint id={`${id}-hint`} text={hint} />
    </label>
  );
};

/**
 * A number box that lets you type freely ("2.", "") and only reports a value
 * once it is a number. With `optional`, clearing it reports null.
 */
export const NumberField: React.FC<
  FieldShell & {
    value: number | null | undefined;
    onChange: (value: number | null) => void;
    optional?: boolean;
    placeholder?: string;
    suffix?: string;
    min?: number;
    step?: number;
  }
> = ({ label, hint, className, value, onChange, optional, placeholder, suffix, min = 0, step = 0.5 }) => {
  const id = useId();
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const shown = editing ? text : value === null || value === undefined ? '' : String(value);

  return (
    <label className={`block ${className ?? ''}`}>
      <span className={LABEL}>{label}</span>
      <span className="relative block">
        <input
          type="number"
          inputMode="decimal"
          value={shown}
          min={min}
          step={step}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onFocus={() => {
            setText(value === null || value === undefined ? '' : String(value));
            setEditing(true);
          }}
          onBlur={() => setEditing(false)}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            if (raw.trim() === '') {
              if (optional) onChange(null);
              return;
            }
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) onChange(parsed);
          }}
          className={`${INPUT} num font-bold text-[17px] ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-fg-4 pointer-events-none">
            {suffix}
          </span>
        )}
      </span>
      <Hint id={`${id}-hint`} text={hint} />
    </label>
  );
};

/** Read-only facts about a catalog item, as small labelled chips. */
export const Facts: React.FC<{ items: { label: string; value: React.ReactNode }[] }> = ({ items }) => (
  <dl className="flex flex-wrap gap-1.5">
    {items.map((item) => (
      <div key={item.label} className="px-2.5 py-1.5 rounded-tag bg-ink-850">
        <dt className="eyebrow text-fg-5">{item.label}</dt>
        <dd className="text-[12px] font-semibold text-fg-2">{item.value}</dd>
      </div>
    ))}
  </dl>
);

export const Toggle: React.FC<{ label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }> = ({
  label,
  hint,
  checked,
  onChange,
}) => (
  <label className="flex items-start gap-2.5 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-0.5 w-4 h-4 accent-act cursor-pointer shrink-0"
    />
    <span>
      <span className="block text-[13px] font-semibold text-fg-2">{label}</span>
      {hint && <span className="block text-[12px] text-fg-4 leading-snug">{hint}</span>}
    </span>
  </label>
);

/** A row of toggle chips for picking several things. */
export const ChipPicker: React.FC<{
  label: string;
  hint?: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  empty?: string;
}> = ({ label, hint, options, selected, onChange, empty }) => (
  <fieldset>
    <legend className={LABEL}>{label}</legend>
    {options.length === 0 ? (
      <p className="text-[12px] text-fg-4">{empty ?? 'Nothing to choose from yet.'}</p>
    ) : (
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const on = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? selected.filter((id) => id !== option.id) : [...selected, option.id])}
              className={`min-h-9 px-2.5 py-1.5 rounded-tag border text-[12.5px] font-semibold transition cursor-pointer active:scale-[.97] ${
                on ? 'bg-ink-800 raised text-fg border-act' : 'bg-ink-900 text-fg-4 border-ink-700 hover:text-fg hover:border-ink-600'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    )}
    {hint && <span className="block mt-1 text-[12px] text-fg-4 leading-snug">{hint}</span>}
  </fieldset>
);

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

const ICON_BUTTON =
  'flex items-center justify-center w-10 h-10 rounded-card border border-ink-700 bg-ink-900 text-fg-4 hover:text-fg hover:bg-ink-850 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer';

export const MoveButtons: React.FC<{ label: string; index: number; count: number; onMove: (delta: number) => void }> = ({
  label,
  index,
  count,
  onMove,
}) => (
  <span className="flex items-center gap-1">
    <button type="button" className={ICON_BUTTON} disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${label} up`}>
      <ArrowUp className="w-4 h-4" />
    </button>
    <button
      type="button"
      className={ICON_BUTTON}
      disabled={index === count - 1}
      onClick={() => onMove(1)}
      aria-label={`Move ${label} down`}
    >
      <ArrowDown className="w-4 h-4" />
    </button>
  </span>
);

/** Delete in two steps, saying first what else in the plan uses the thing. */
export const DeleteButton: React.FC<{
  label: string;
  uses?: string[];
  /** Replaces the sentence after "Delete …?" when what goes with it needs other words. */
  detail?: string;
  onDelete: () => void;
  compact?: boolean;
}> = ({ label, uses = [], detail, onDelete, compact }) => {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${label}`}
        className={
          compact
            ? ICON_BUTTON + ' hover:!text-boss'
            : 'flex items-center gap-1.5 h-10 px-3 rounded-card text-[13px] font-semibold text-fg-4 hover:text-boss transition cursor-pointer'
        }
      >
        <Trash2 className="w-3.5 h-3.5" />
        {!compact && 'Delete'}
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2 p-2 rounded-card bg-ink-850">
      <span className="text-[12.5px] text-boss">
        Delete {label}?{detail ? ` ${detail}` : uses.length > 0 && ` It is also removed from ${uses.join(', ')}.`}
      </span>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          onDelete();
        }}
        className="h-9 px-3 rounded-card text-[13px] font-semibold text-boss hover:bg-boss-deep transition cursor-pointer"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="h-9 px-3 rounded-card border border-ink-600 text-[13px] font-semibold text-fg hover:bg-ink-850 transition cursor-pointer"
      >
        Keep
      </button>
    </span>
  );
};

export const AddButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({ label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-1.5 w-full h-11 rounded-card border border-dashed border-ink-600 text-[13px] font-semibold text-fg-3 hover:text-fg hover:border-ink-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
  >
    <Plus className="w-4 h-4" />
    {label}
  </button>
);

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/** A collapsible card: a summary row you can open to edit the item. */
export const EditCard: React.FC<{
  title: string;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, meta, badge, open, onToggle, children }) => (
  <li className={`rounded-card transition-colors ${open ? 'bg-ink-850 raised' : 'bg-ink-900'}`}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex items-center gap-3 w-full p-3 text-left cursor-pointer"
    >
      {badge}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-fg truncate">{title || 'Untitled'}</span>
        {meta && <span className="block text-[12px] text-fg-4 truncate">{meta}</span>}
      </span>
      <ChevronDown className={`w-4 h-4 text-fg-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="px-3 pb-3 space-y-3 border-t border-ink-700 pt-3">{children}</div>}
  </li>
);

/** A titled block inside an editor section. */
export const Group: React.FC<{ title: string; hint?: string; children: React.ReactNode; right?: React.ReactNode }> = ({
  title,
  hint,
  children,
  right,
}) => (
  <section className="space-y-3">
    <div className="flex items-end justify-between gap-3">
      <div>
        <h3 className="eyebrow text-fg-3">{title}</h3>
        {hint && <p className="mt-0.5 text-[12px] text-fg-4 max-w-2xl">{hint}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);
