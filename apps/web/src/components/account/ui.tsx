'use client';

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Form pieces shared by sign-in, setup, joining and the team page. */

const INPUT =
  'w-full h-11 px-3 rounded-xl bg-dark-950 border border-slate-800 text-white outline-none focus:border-cyan-500/60 transition-colors placeholder:text-slate-600';

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
      <label htmlFor={id} className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${INPUT} ${className}`} {...input} />
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
};

export const PasswordField: React.FC<Omit<FieldProps, 'type'>> = ({ label, hint, value, onChange, ...input }) => {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${INPUT} pr-11 font-mono`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setShown((current) => !current)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1 flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-white cursor-pointer"
        >
          {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
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
  <button
    type="submit"
    disabled={busy}
    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-black bg-neon-cyan text-dark-950 hover:brightness-110 disabled:opacity-60 disabled:cursor-wait transition cursor-pointer"
  >
    {icon}
    {busy ? busyLabel : children}
  </button>
);

export const FormMessage: React.FC<{ tone: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({ tone, children }) => (
  <p
    role={tone === 'error' ? 'alert' : 'status'}
    className={`text-xs font-semibold leading-relaxed ${
      tone === 'error' ? 'text-rose-300' : tone === 'success' ? 'text-emerald-300' : 'text-slate-300'
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
  <section className="w-full max-w-md mx-auto bg-dark-900/80 backdrop-blur-sm border border-slate-800/80 rounded-2xl shadow-xl p-6 sm:p-8">
    <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan/20 via-neon-purple/20 to-transparent border border-neon-cyan/40 text-neon-cyan">
      {icon}
    </div>
    <h1 className="text-xl font-black text-white text-center tracking-tight">{title}</h1>
    {intro && <div className="mt-2 mb-6 text-sm text-slate-400 text-center leading-relaxed">{intro}</div>}
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
