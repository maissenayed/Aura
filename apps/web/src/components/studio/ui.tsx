import React from 'react';

/** The studio's small controls, in Chalk & Iron: chalk for what is on, steel for tool overlays. */

export const Toggle: React.FC<{ on: boolean; onChange: (on: boolean) => void; children: React.ReactNode; title?: string }> = ({ on, onChange, children, title }) => (
  <button
    type="button"
    aria-pressed={on}
    title={title}
    onClick={() => onChange(!on)}
    className={`h-8 pl-2 pr-2.5 inline-flex items-center gap-1.5 rounded-tag border text-[12.5px] font-bold transition cursor-pointer whitespace-nowrap ${
      on ? 'border-ink-500 bg-ink-800 text-fg' : 'border-ink-700 text-fg-4 hover:text-fg-2'
    }`}
  >
    <span aria-hidden="true" className={`w-2 h-2 rounded-full ${on ? 'bg-act' : 'border border-fg-5'}`} />
    {children}
  </button>
);

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: React.ReactNode; disabled?: boolean; title?: string }[]; onChange: (value: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-0.5 rounded-card bg-ink-900 border border-ink-700">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          disabled={option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
          className={`h-8 px-3 rounded-[8px] text-[12.5px] font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
            value === option.value ? 'bg-act text-act-deep' : 'text-fg-3 hover:text-fg'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }> = ({ primary, className = '', ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-card text-[13px] font-bold transition cursor-pointer active:scale-[.97] disabled:opacity-50 disabled:cursor-not-allowed ${
      primary ? 'bg-act text-act-deep' : 'border border-ink-600 text-fg hover:bg-ink-850'
    } ${className}`}
  />
);

export const Panel: React.FC<{ title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, right, children, className = '' }) => (
  <section className={`rounded-card bg-ink-900 border border-ink-700 p-3 flex flex-col gap-2.5 min-w-0 ${className}`}>
    <div className="flex items-center gap-2 min-h-6">
      <h2 className="eyebrow text-fg-3 flex-1">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

export const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  changed?: boolean;
  onReset?: () => void;
  slider?: boolean;
}> = ({ label, value, onChange, min = -20, max = 120, step = 0.1, changed, onReset, slider = true }) => (
  <label className="grid grid-cols-[minmax(0,1fr)_64px_20px] items-center gap-x-2 gap-y-1 text-[12.5px]">
    <span className={`truncate ${changed ? 'text-fg font-bold' : 'text-fg-3'}`}>{label}</span>
    <input
      type="number"
      value={Number.isFinite(value) ? Math.round(value * 1000) / 1000 : ''}
      step={step}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (event.target.value !== '' && Number.isFinite(next)) onChange(next);
      }}
      className="h-7 w-full px-1.5 rounded-tag bg-ink-800 border border-ink-700 text-fg num text-[13px] text-right"
    />
    {changed && onReset ? (
      <button type="button" onClick={onReset} title="Back to the default" aria-label={`Reset ${label}`} className="text-fg-4 hover:text-fg cursor-pointer text-[14px] leading-none">
        ↺
      </button>
    ) : (
      <span />
    )}
    {slider && (
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="col-span-3 accent-[var(--color-act)] h-4"
        aria-label={label}
      />
    )}
  </label>
);

export const LEVEL_STYLE = {
  error: 'text-fg border-fg',
  warn: 'text-fg-2 border-fg-3',
  info: 'text-fg-4 border-ink-500',
} as const;

export const LEVEL_WORD = { error: 'Breaks', warn: 'Check', info: 'Note' } as const;
