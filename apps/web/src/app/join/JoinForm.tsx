'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, UserPlus } from 'lucide-react';
import { api, refreshAccount, useAccount } from '../../utils/accountStore';
import { signOutOfCampaign } from '../../utils/protocolStore';
import { AuthCard, Field, FormMessage, PasswordField, SECONDARY_BUTTON, Submit, passwordProblem } from '../../components/account/ui';

type Invitation = { email: string; expiresAt: string };

export const JoinForm: React.FC = () => {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const { account } = useAccount();
  const [invite, setInvite] = useState<Invitation | null | 'loading'>(token ? 'loading' : null);
  const [lookupError, setLookupError] = useState<string | null>(token ? null : 'This link is missing its invitation code.');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let live = true;
    void api<Invitation>('GET', `/join/${encodeURIComponent(token)}`).then((result) => {
      if (!live) return;
      setInvite(result.data ?? null);
      setLookupError(result.error ?? null);
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (invite === 'loading') {
    return <div className="w-full max-w-md mx-auto h-80 rounded-card bg-ink-900 animate-pulse" aria-busy="true" />;
  }

  if (!invite) {
    return (
      <AuthCard icon={<UserPlus className="w-7 h-7" />} title="This invitation can't be used">
        <FormMessage tone="error">{lookupError ?? 'This invitation has expired, been used or been withdrawn.'}</FormMessage>
        <p className="mt-3 text-sm text-fg-3">
          Ask the person who invited you for a new link. If you already have an account,{' '}
          <Link href="/camp" className="font-bold text-act underline-offset-2 hover:underline">
            sign in here
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  if (account && account.email !== invite.email) {
    return (
      <AuthCard icon={<UserPlus className="w-7 h-7" />} title="You're signed in as someone else">
        <p className="text-sm text-fg-3 text-center">
          This invitation is for <strong className="text-fg">{invite.email}</strong>, but this browser is signed in as{' '}
          <strong className="text-fg">{account.email}</strong>.
        </p>
        <button
          type="button"
          onClick={() => void signOutOfCampaign()}
          className={`${SECONDARY_BUTTON} mt-5 w-full h-12 text-sm`}
        >
          Sign out and accept the invitation
        </button>
      </AuthCard>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!name.trim()) return setError('Enter your name.');
    const problem = passwordProblem(password, confirm);
    if (problem) return setError(problem);

    setBusy(true);
    setError(null);
    const result = await api('POST', `/join/${encodeURIComponent(token)}`, { name, password });
    if (result.error) {
      setBusy(false);
      return setError(result.error);
    }
    await refreshAccount();
    router.push('/camp');
  };

  return (
    <AuthCard
      icon={<MailCheck className="w-7 h-7" />}
      title="You're invited"
      intro={
        <>
          Create your account for <strong className="text-fg">{invite.email}</strong>. You will get your own campaign —
          missions, bosses and character that only you can see.
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Email" value={invite.email} onChange={() => undefined} readOnly disabled className="opacity-70" />
        <Field label="Your name" autoComplete="name" autoFocus value={name} onChange={setName} maxLength={60} />
        <PasswordField label="Choose a password" hint="At least 8 characters." autoComplete="new-password" value={password} onChange={setPassword} />
        <PasswordField label="Repeat the password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <Submit busy={busy} busyLabel="Creating your account…" icon={<UserPlus className="w-4 h-4" />}>
          Create account and start
        </Submit>
      </form>
      <p className="mt-4 text-[11px] text-fg-5 text-center">
        This invitation works once and expires {new Date(invite.expiresAt).toLocaleDateString()}.
      </p>
    </AuthCard>
  );
};
