'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { resetPassword } from '../../utils/accountStore';
import { AuthCard, FormMessage, PasswordField, Submit, passwordProblem } from '../../components/account/ui';

export const ResetForm: React.FC = () => {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const linkError = params.get('error');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token || linkError) {
    return (
      <AuthCard icon={<KeyRound className="w-7 h-7" />} title="This reset link can't be used">
        <FormMessage tone="error">It has expired or was already used. Reset links work once, for one hour.</FormMessage>
        <p className="mt-3 text-sm text-slate-400">
          <Link href="/tracker" className="font-bold text-neon-cyan hover:underline">
            Go to sign in
          </Link>{' '}
          and ask for a new one.
        </p>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard icon={<KeyRound className="w-7 h-7" />} title="Password changed">
        <FormMessage tone="success">Your new password is set. You were signed out everywhere else.</FormMessage>
        <Link
          href="/tracker"
          className="mt-5 flex items-center justify-center w-full h-11 rounded-xl text-sm font-black bg-neon-cyan text-dark-950 hover:brightness-110 transition"
        >
          Sign in
        </Link>
      </AuthCard>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problem = passwordProblem(password, confirm);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    const failure = await resetPassword(token, password);
    setBusy(false);
    if (failure) setError(failure);
    else setDone(true);
  };

  return (
    <AuthCard icon={<KeyRound className="w-7 h-7" />} title="Choose a new password">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <PasswordField label="New password" hint="At least 8 characters." autoComplete="new-password" autoFocus value={password} onChange={setPassword} />
        <PasswordField label="Repeat the password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <Submit busy={busy} busyLabel="Saving…">
          Save new password
        </Submit>
      </form>
    </AuthCard>
  );
};
