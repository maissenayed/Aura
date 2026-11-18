'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, Users } from 'lucide-react';
import { api, refreshAccount, useAccount } from '../../utils/accountStore';
import { signOutOfCampaign } from '../../utils/protocolStore';
import { CrewSharing } from '../../components/account/CrewSharing';
import { AuthCard, Field, FormMessage, PasswordField, SECONDARY_BUTTON, Submit, Switch, passwordProblem } from '../../components/account/ui';

/** The inviter's name and the crew's size come from newer servers; the screen reads fine without them. */
type Invitation = { email: string; expiresAt: string; invitedBy?: string; crewSize?: number };

export const JoinForm: React.FC = () => {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const { account } = useAccount();
  const [invite, setInvite] = useState<Invitation | null | 'loading'>(token ? 'loading' : null);
  const [lookupError, setLookupError] = useState<string | null>(token ? null : 'This link is missing its invitation code.');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [trainPrivately, setTrainPrivately] = useState(false);
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
    const result = await api('POST', `/join/${encodeURIComponent(token)}`, { name, password, trainPrivately });
    if (result.error) {
      setBusy(false);
      return setError(result.error);
    }
    await refreshAccount();
    router.push('/camp');
  };

  const inviter = invite.invitedBy?.trim() || null;
  // Everyone with an account is in the one crew; the count tells them it is a small, invited group.
  const crewSize = invite.crewSize ?? 0;

  return (
    <AuthCard
      icon={<Users className="w-7 h-7" />}
      title="Join the crew"
      intro={
        <>
          {inviter ? <strong className="text-fg">{inviter}</strong> : 'The owner'} invited you to train with their crew on Aura
          {crewSize > 0 ? `, ${crewSize} ${crewSize === 1 ? 'person' : 'people'} so far` : ''}. You get your own campaign: missions,
          bosses and a character nobody else can change.
        </>
      }
    >
      <section aria-labelledby="crew-what" className="mb-6 flex flex-col gap-3">
        <h2 id="crew-what" className="font-display font-bold text-base text-fg">
          What the crew is
        </h2>
        <p className="text-[13px] leading-snug text-fg-3">
          Everyone {inviter ?? 'the owner'} has invited, on one weekly board of training XP. Chalk each other&apos;s PRs in the feed, take
          someone on in a seven-day duel and bring down the weekly raid together. A second board ranks each of you against your own last
          four weeks, so a beginner can top it.
        </p>
        <CrewSharing />
        <p className="text-[12px] text-fg-4">
          Find it under <strong className="text-fg-2">Crew</strong>: on Camp on a phone, in the sidebar on a computer.
        </p>
      </section>

      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Email" value={invite.email} onChange={() => undefined} readOnly disabled className="opacity-70" />
        <Field label="Your name" hint="The crew sees this name." autoComplete="name" value={name} onChange={setName} maxLength={60} />
        <PasswordField label="Choose a password" hint="At least 8 characters." autoComplete="new-password" value={password} onChange={setPassword} />
        <PasswordField label="Repeat the password" autoComplete="new-password" value={confirm} onChange={setConfirm} />
        <div className="pt-1 pb-1">
          <Switch
            label="Start training privately"
            detail="Off every board and feed until you switch it off on the Crew page."
            on={trainPrivately}
            onChange={setTrainPrivately}
          />
        </div>
        {error && <FormMessage tone="error">{error}</FormMessage>}
        <Submit busy={busy} busyLabel="Creating your account…" icon={<UserPlus className="w-4 h-4" />}>
          Join the crew
        </Submit>
      </form>
      <p className="mt-4 text-[11px] text-fg-5 text-center">
        This invitation works once and expires {new Date(invite.expiresAt).toLocaleDateString()}.
      </p>
    </AuthCard>
  );
};
