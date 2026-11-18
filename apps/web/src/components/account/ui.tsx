'use client';

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Form pieces shared by sign-in, setup, joining and the team page. */

const INPUT =
  'w-full h-11 px-3 rounded-card bg-ink-900 border border-ink-700 text-fg placeholder:text-fg-5 focus:border-act outline-none transition-colors';

const PRESS = 'active:scale-[.97] transition cursor-pointer disabled:opacity-60 disabled:cursor-wait';

/** The chalk key: the one thing to do on a screen. Add a height (h-12, or h-11 beside an input). */
export const PRIMARY_BUTTON = `flex items-center justify-center gap-2 rounded-card bg-act text-act-deep font-display font-extrabold uppercase text-lg tracking-[0.02em] ${PRESS}`;

/** An outlined button for everything else. Add a height and a text size. */
export const SECONDARY_BUTTON = `flex items-center justify-center gap-1.5 rounded-card border border-ink-600 text-fg font-bold hover:bg-ink-850 ${PRESS}`;

/** Something that deletes or withdraws: crimson text, no slab. Add a height and a text size. */
export const DANGER_BUTTON = `flex items-center justify-center gap-1.5 rounded-card text-boss font-bold hover:text-boss-soft ${PRESS}`;

interface FieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}

export const Field: React.FC<FieldProps> = ({ label, hint, value, onChange, className = '', ...input }) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="eyebrow block mb-1.5 text-fg-4">
        {label}
      </label>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${INPUT} ${className}`} {...input} />
      {hint && <p className="mt-1.5 text-[11px] text-fg-5">{hint}</p>}
    </div>
  );
};

export const PasswordField: React.FC<Omit<FieldProps, 'type'>> = ({ label, hint, value, onChange, ...input }) => {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="eyebrow block mb-1.5 text-fg-4">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${INPUT} pr-11`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setShown((current) => !current)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1 flex items-center justify-center w-9 h-9 rounded-card text-fg-5 hover:text-fg cursor-pointer"
        >
          {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-fg-5">{hint}</p>}
    </div>
  );
};

interface SubmitProps {
  busy: boolean;
  children: React.ReactNode;
  busyLabel?: string;
  icon?: React.ReactNode;
}

export const Submit: React.FC<SubmitProps> = ({ busy, children, busyLabel = 'One moment…', icon }) => (
  <button type="submit" disabled={busy} className={`${PRIMARY_BUTTON} w-full h-12`}>
    {icon}
    {busy ? busyLabel : children}
  </button>
);

/** An on/off switch with a line on what it does. Chalk when on, iron when off. */
export const Switch: React.FC<{ label: string; detail: string; on: boolean; onChange: (on: boolean) => void }> = ({ label, detail, on, onChange }) => (
  <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="w-full flex items-center gap-3 text-left cursor-pointer">
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-semibold text-fg">{label}</span>
      <span className="block text-[12px] text-fg-4">{detail}</span>
    </span>
    <span className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition ${on ? 'bg-fg' : 'bg-ink-700'}`}>
      <span className={`block w-5 h-5 rounded-full transition ${on ? 'translate-x-5 bg-ink-950' : 'bg-fg-3'}`} />
    </span>
  </button>
);

export const FormMessage: React.FC<{ tone: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({ tone, children }) => (
  <p
    role={tone === 'error' ? 'alert' : 'status'}
    className={`text-xs font-semibold leading-relaxed ${
      tone === 'error' ? 'text-boss' : tone === 'success' ? 'text-earned-soft' : 'text-fg-3'
    }`}
  >
    {children}
  </p>
);

/** A centred card used by every account screen. */
export const AuthCard: React.FC<{ icon: React.ReactNode; title: string; intro?: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  title,
  intro,
  children,
}) => (
  <section className="w-full max-w-md mx-auto bg-ink-900 rounded-card p-6 sm:p-8">
    <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-card bg-ink-800 text-fg">{icon}</div>
    <h1 className="font-display font-extrabold uppercase text-[26px] leading-[0.95] text-fg text-center text-balance">{title}</h1>
    {intro && <div className="mt-3 mb-6 text-sm text-fg-3 text-center leading-relaxed">{intro}</div>}
    {!intro && <div className="mb-6" />}
    {children}
  </section>
);

export const PASSWORD_MIN = 8;

/** Returns a message when a new password (and its confirmation) is not acceptable. */
export function passwordProblem(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > 128) return 'Use at most 128 characters.';
  if (password !== confirm) return 'The two passwords do not match.';
  return null;
}
