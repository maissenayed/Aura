'use client';

import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { claimCampaign, unlockCampaign } from '../../utils/protocolStore';
import { Panel } from './primitives';

const MIN_LENGTH = 6;

interface CampaignGateProps {
  /** `claim`: nobody has set a passcode yet. `locked`: one exists and this device has not entered it. */
  mode: 'claim' | 'locked';
}

/** Stands in for the board until this device proves it belongs to the campaign's owner. */
export const CampaignGate: React.FC<CampaignGateProps> = ({ mode }) => {
  const [passcode, setPasscode] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const claiming = mode === 'claim';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    if (passcode.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (claiming && passcode !== confirm) return setError('The two passcodes do not match.');

    setBusy(true);
    setError(null);
    const failure = claiming ? await claimCampaign(passcode) : await unlockCampaign(passcode);
    setBusy(false);
    if (failure) setError(failure);
  };

  const field =
    'w-full h-11 px-3 rounded-xl bg-dark-950 border border-slate-800 text-white font-mono outline-none focus:border-cyan-500/60 transition-colors placeholder:text-slate-600 placeholder:font-sans';

  return (
    <Panel className="max-w-md mx-auto p-6 sm:p-8">
      <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan/20 via-neon-purple/20 to-transparent border border-neon-cyan/40 text-neon-cyan">
        {claiming ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
      </div>

      <h1 className="text-xl font-black text-white text-center tracking-tight">
        {claiming ? 'Claim your campaign' : 'Campaign locked'}
      </h1>
      <p className="mt-2 mb-6 text-sm text-slate-400 text-center">
        {claiming
          ? 'This link is public, so the campaign needs an owner. Choose a passcode — every other device will have to enter it before it can see or change your progress.'
          : 'Enter the passcode you set when you claimed this campaign. This device will remember it.'}
      </p>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Passcode</span>
          <input
            type="password"
            autoComplete={claiming ? 'new-password' : 'current-password'}
            autoFocus
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder={claiming ? `At least ${MIN_LENGTH} characters` : 'Your passcode'}
            className={field}
          />
        </label>

        {claiming && (
          <label className="block">
            <span className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Repeat it
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={field}
            />
          </label>
        )}

        {error && (
          <p role="alert" className="text-xs font-semibold text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-black uppercase tracking-wider bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 hover:bg-neon-cyan/25 disabled:opacity-50 disabled:cursor-wait transition cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          {busy ? 'Checking…' : claiming ? 'Set passcode and start' : 'Unlock'}
        </button>
      </form>

      {claiming && (
        <p className="mt-4 text-[11px] text-slate-500 text-center">
          Only a scrambled fingerprint of the passcode is stored, so it cannot be shown to you again. Pick one you will
          remember.
        </p>
      )}
    </Panel>
  );
};
