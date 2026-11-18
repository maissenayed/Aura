'use client';

import React, { useState } from 'react';
import { KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { api, refreshAccount, requestPasswordReset, signIn, useAccount } from '../../utils/accountStore';
import { AuthCard, Field, FormMessage, PasswordField, SECONDARY_BUTTON, Submit, passwordProblem } from './ui';

/** Stands in for the campaign until someone is signed in — or, the very first time, until the owner exists. */
export const AuthGate: React.FC<{ mode: 'signin' | 'setup' }> = ({ mode }) =>
  mode === 'setup' ? <OwnerSetup /> : <SignIn />;

/* ------------------------------------------------------------------ */
/* Sign in                                                             */
/* ------------------------------------------------------------------ */

const SignIn: React.FC = () => {
  const { email: emailEnabled, status } = useAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState<'closed' | 'open' | 'sent'>('closed');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    setError(null);
    const failure = await signIn(email, password);
    setBusy(false);
    if (failure) setError(failure);
  };

  const sendReset = async () => {
    if (!email.trim()) return setError('Type your email above first.');
    setBusy(true);
    const failure = await requestPasswordReset(email);
    setBusy(false);
    if (failure) setError(failure);
    else setForgot('sent');
  };

  return (
    <AuthCard
      icon={<LogIn className="w-7 h-7" />}
      title="Sign in to your campaign"
      intro="Your missions, bosses and character are saved to your account, so they follow you to any device."
    >
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Email" type="email" autoComplete="email" autoFocus value={email} onChange={setEmail} placeholder="you@example.com" />
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={setPassword} />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        {status === 'offline' && <FormMessage tone="error">The server cannot be reached right now.</FormMessage>}
        <Submit busy={busy} busyLabel="Signing in…" icon={<KeyRound className="w-4 h-4" />}>
          Sign in
        </Submit>
      </form>

      <div className="mt-5 pt-4 border-t border-ink-700 text-center">
        {forgot === 'closed' && (
          <button
            type="button"
            onClick={() => setForgot('open')}
            className="text-[13px] font-bold text-fg-3 hover:text-fg underline-offset-2 hover:underline cursor-pointer"
          >
            Forgot your password?
          </button>
        )}
        {forgot === 'open' &&
          (emailEnabled ? (
            <div className="flex flex-col items-center gap-3">
              <FormMessage tone="info">We will email a reset link to the address above.</FormMessage>
              <button type="button" onClick={sendReset} disabled={busy} className={`${SECONDARY_BUTTON} h-11 px-4 text-sm`}>
                Email me a reset link
              </button>
            </div>
          ) : (
            <FormMessage tone="info">
              Ask the person who invited you to set a new password for you from their Team page. You can change it
              after signing in.
            </FormMessage>
          ))}
        {forgot === 'sent' && (
          <FormMessage tone="success">If that address has an account, a reset link is on its way. Check your inbox.</FormMessage>
        )}
        <p className="mt-3 text-[11px] text-fg-5">New here? You need an invitation link from the owner.</p>
      </div>
    </AuthCard>
  );
};

/* ------------------------------------------------------------------ */
/* First-time owner setup                                              */
/* ------------------------------------------------------------------ */

const OwnerSetup: React.FC = () => {
  const { legacyPasscode } = useAccount();
  const [secret, setSecret] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!secret) return setError(legacyPasscode ? 'Enter your campaign passcode or the setup code.' : 'Enter the setup code.');
    if (!name.trim()) return setError('Enter your name.');
    if (!email.trim()) return setError('Enter your email.');
    const problem = passwordProblem(password, confirm);
    if (problem) return setError(problem);

    setBusy(true);
    setError(null);
    const result = await api('POST', '/setup', { secret, name, email, password });
    if (result.error) {
      setBusy(false);
      return setError(result.error);
    }
    await refreshAccount();
    setBusy(false);
  };

  return (
    <AuthCard
      icon={<ShieldCheck className="w-7 h-7" />}
      title="Create the owner account"
      intro={
        <>
          Campaigns now belong to accounts. Create yours first — your existing progress moves into it, and you can then
          invite other people, each with their own campaign.
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3" noValidate>
        <PasswordField
          label={legacyPasscode ? 'Campaign passcode or setup code' : 'Setup code'}
          hint={
            legacyPasscode
              ? 'The passcode you chose when you first claimed this campaign. This proves the campaign is yours.'
              : 'The setup code from the server configuration (OWNER_SETUP_CODE).'
          }
          autoComplete="off"
          autoFocus
          value={secret}
          onChange={setSecret}
        />
        <Field label="Your name" autoComplete="name" value={name} onChange={setName} maxLength={60} />
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <PasswordField label="New password" hint="At least 8 characters." autoComplete="new-password" value={password} onChange={setPassword} />
        <PasswordField label="Repeat the password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <Submit busy={busy} busyLabel="Creating your account…" icon={<ShieldCheck className="w-4 h-4" />}>
          Create owner account
        </Submit>
      </form>
    </AuthCard>
  );
};
