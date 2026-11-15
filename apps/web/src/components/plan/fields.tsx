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
  'w-full h-10 px-3 rounded-xl bg-dark-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 outline-none focus:border-neon-cyan/70 focus:ring-2 focus:ring-neon-cyan/20 transition';

const LABEL = 'block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500';

interface FieldShell {
  label: string;
  hint?: string;
  className?: string;
}

const Hint: React.FC<{ id: string; text?: string }> = ({ id, text }) =>
  text ? (
    <span id={id} className="block mt-1 text-[10px] text-slate-500 leading-snug">
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
          className={`${INPUT} font-mono ${suffix ? 'pr-12' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </span>
      <Hint id={`${id}-hint`} text={hint} />
    </label>
  );
};

export const SelectField = <T extends string>({
  label,
  hint,
  className,
  value,
  options,
  onChange,
  emptyLabel,
}: FieldShell & {
  value: T | '';
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  /** Shown as a disabled first option when nothing is chosen. */
  emptyLabel?: string;
}) => {
  const id = useId();
  return (
    <label className={`block ${className ?? ''}`}>
      <span className={LABEL}>{label}</span>
      <select
        value={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value as T)}
        className={`${INPUT} pr-8 cursor-pointer`}
      >
        {(value === '' || emptyLabel) && (
          <option value="" disabled>
            {emptyLabel ?? 'Choose…'}
          </option>
        )}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <Hint id={`${id}-hint`} text={hint} />
    </label>
  );
};

/** A dropdown with option groups. With `placeholder` and an empty value it works as an "add…" picker. */
export const GroupedSelect: React.FC<
  FieldShell & {
    value: string;
    groups: { label: string; options: { id: string; label: string }[] }[];
    onChange: (value: string) => void;
    placeholder?: string;
    hideLabel?: boolean;
  }
> = ({ label, hint, className, value, groups, onChange, placeholder, hideLabel }) => {
  const id = useId();
  return (
    <label className={`block ${className ?? ''}`}>
      <span className={hideLabel ? 'sr-only' : LABEL}>{label}</span>
      <select
        value={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => event.target.value && onChange(event.target.value)}
        className={`${INPUT} pr-8 cursor-pointer ${value === '' ? 'text-slate-400' : ''}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {groups
          .filter((group) => group.options.length > 0)
          .map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.id} value={option.id} className="text-white">
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
      </select>
      <Hint id={`${id}-hint`} text={hint} />
    </label>
  );
};

/** Read-only facts about a catalog item, as small labelled chips. */
export const Facts: React.FC<{ items: { label: string; value: React.ReactNode }[] }> = ({ items }) => (
  <dl className="flex flex-wrap gap-1.5">
    {items.map((item) => (
      <div key={item.label} className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-dark-950/70">
        <dt className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</dt>
        <dd className="text-[11px] font-semibold text-slate-200">{item.value}</dd>
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
      className="mt-0.5 w-4 h-4 accent-cyan-400 cursor-pointer shrink-0"
    />
    <span>
      <span className="block text-xs font-bold text-slate-200">{label}</span>
      {hint && <span className="block text-[10px] text-slate-500 leading-snug">{hint}</span>}
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
      <p className="text-[11px] text-slate-500">{empty ?? 'Nothing to choose from yet.'}</p>
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
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                on
                  ? 'bg-cyan-950/50 text-neon-cyan border-cyan-500/50'
                  : 'bg-dark-950 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    )}
    {hint && <span className="block mt-1 text-[10px] text-slate-500 leading-snug">{hint}</span>}
  </fieldset>
);

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

const ICON_BUTTON =
  'flex items-center justify-center w-9 h-9 rounded-xl border border-slate-700 bg-dark-950 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer';

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
export const DeleteButton: React.FC<{ label: string; uses?: string[]; onDelete: () => void; compact?: boolean }> = ({
  label,
  uses = [],
  onDelete,
  compact,
}) => {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${label}`}
        className={
          compact
            ? ICON_BUTTON + ' hover:!text-rose-300 hover:!border-rose-800'
            : 'flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-700 bg-dark-950 text-xs font-bold text-slate-400 hover:text-rose-300 hover:border-rose-800 transition cursor-pointer'
        }
      >
        <Trash2 className="w-3.5 h-3.5" />
        {!compact && 'Delete'}
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-rose-800/60 bg-rose-950/30">
      <span className="text-[11px] text-rose-200">
        Delete {label}?{uses.length > 0 && ` It is also removed from ${uses.join(', ')}.`}
      </span>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          onDelete();
        }}
        className="h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider bg-rose-900/60 text-rose-100 border border-rose-700 hover:bg-rose-800/70 transition cursor-pointer"
      >
        Delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider bg-dark-950 text-slate-300 border border-slate-700 hover:border-slate-500 transition cursor-pointer"
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
    className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-neon-cyan hover:border-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
  <li className={`rounded-2xl border transition-colors ${open ? 'border-slate-600 bg-dark-900/80' : 'border-slate-800 bg-dark-950/60'}`}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex items-center gap-3 w-full p-3 text-left cursor-pointer"
    >
      {badge}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white truncate">{title || 'Untitled'}</span>
        {meta && <span className="block text-[11px] text-slate-500 truncate">{meta}</span>}
      </span>
      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="px-3 pb-3 space-y-3 border-t border-slate-800 pt-3">{children}</div>}
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
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">{title}</h3>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500 max-w-2xl">{hint}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);
