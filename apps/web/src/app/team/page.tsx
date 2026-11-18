'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Flag, KeyRound, Link2, Mail, RefreshCw, Share2, Trash2, UserPlus, Users, X } from 'lucide-react';
import { AccountMenu } from '../../components/account/AccountMenu';
import {
  DANGER_BUTTON,
  Field,
  FormMessage,
  PRIMARY_BUTTON,
  PasswordField,
  SECONDARY_BUTTON,
  passwordProblem,
} from '../../components/account/ui';
import { AppShell, ScreenHeader } from '../../components/game/AppShell';
import { Chip, Tone } from '../../components/game/kit';
import { api, useAccount } from '../../utils/accountStore';

interface Invite {
  id: string;
  email: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  joinedAt: string;
}

interface IssuedLink {
  email: string;
  link: string;
  emailed: boolean;
}

/** Only a joined invitation is gold: it is the one that paid off. */
const STATUS: Record<Invite['status'], { label: string; tone: Tone }> = {
  pending: { label: 'Waiting', tone: 'act' },
  accepted: { label: 'Joined', tone: 'earned' },
  revoked: { label: 'Withdrawn', tone: 'dim' },
  expired: { label: 'Expired', tone: 'dim' },
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/** Row actions: small outlined buttons, and crimson text for the ones that take something away. */
const SMALL = `${SECONDARY_BUTTON} h-9 px-3 text-xs`;
const SMALL_DANGER = `${DANGER_BUTTON} h-9 px-2.5 text-xs`;

export default function TeamPage() {
  const { status, mode, account } = useAccount();

  let body: React.ReactNode;
  if (status === 'loading') {
    body = <div className="h-96 rounded-card bg-ink-900 animate-pulse" aria-busy="true" />;
  } else if (mode === 'open') {
    body = <Notice title="Accounts are off">This server runs without a database, so there is nobody to invite.</Notice>;
  } else if (!account) {
    body = (
      <Notice title="Sign in first">
        <Link href="/camp" className="font-bold text-act hover:underline">
          Sign in
        </Link>{' '}
        to manage your team.
      </Notice>
    );
  } else if (account.role !== 'admin') {
    body = <Notice title="Owner only">Only the owner of this app can invite people and manage accounts.</Notice>;
  } else {
    body = <TeamManager selfId={account.id} />;
  }

  return (
    <AppShell>
      <main className="w-full max-w-4xl mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-5">
        {/* On desktop the account menu sits in the sidebar; on a phone this page keeps it in reach here. */}
        <ScreenHeader
          eyebrow="Account"
          title="Team & invitations"
          right={
            <div className="lg:hidden">
              <AccountMenu />
            </div>
          }
        />
        {body}
      </main>
    </AppShell>
  );
}

const Notice: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="w-full max-w-md mx-auto p-6 rounded-card bg-ink-900 text-center">
    <h2 className="font-display font-extrabold uppercase text-[22px] leading-none text-fg">{title}</h2>
    <p className="mt-2 text-sm text-fg-3">{children}</p>
  </section>
);

/** A flat section of the owner's view: a glyph, a title, a line on what it is for. */
const Section: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }> = ({
  icon,
  title,
  subtitle,
  children,
}) => (
  <section className="flex flex-col gap-4 p-4 sm:p-6 rounded-card bg-ink-900">
    <div className="flex items-start gap-3">
      <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-card bg-ink-800 text-fg">{icon}</span>
      <div className="min-w-0">
        <h2 className="font-display font-bold text-base text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-fg-4 leading-relaxed max-w-2xl">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

/* ------------------------------------------------------------------ */
/* The owner's view                                                    */
/* ------------------------------------------------------------------ */

const TeamManager: React.FC<{ selfId: string }> = ({ selfId }) => {
  const { email: emailEnabled } = useAccount();
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedLink | null>(null);

  const reload = useCallback(async () => {
    const [inviteResult, memberResult] = await Promise.all([api<Invite[]>('GET', '/invites'), api<Member[]>('GET', '/members')]);
    setLoadError(inviteResult.error ?? memberResult.error ?? null);
    if (inviteResult.data) setInvites(inviteResult.data);
    if (memberResult.data) setMembers(memberResult.data);
  }, []);

  useEffect(() => {
    // Loading the lists is the point of opening this page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-5">
      <p className="-mt-2 text-sm text-fg-3">Invite people by email address. Each person gets their own private campaign.</p>

      {loadError && <FormMessage tone="error">{loadError}</FormMessage>}

      <InviteForm emailEnabled={emailEnabled} onIssued={(link) => { setIssued(link); void reload(); }} />

      {issued && <IssuedLinkCard issued={issued} onClose={() => setIssued(null)} />}

      <Section icon={<Mail className="w-4 h-4" />} title="Invitations" subtitle="Links work once and expire after 14 days.">
        {invites === null ? (
          <p className="text-xs text-fg-5">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="text-xs text-fg-4">No invitations yet.</p>
        ) : (
          <ul className="flex flex-col">
            {invites.map((invite) => (
              <InviteRow key={invite.id} invite={invite} onIssued={(link) => { setIssued(link); void reload(); }} onChanged={reload} />
            ))}
          </ul>
        )}
      </Section>

      <Section icon={<Users className="w-4 h-4" />} title="Members" subtitle="Everyone who can sign in.">
        {members === null ? (
          <p className="text-xs text-fg-5">Loading…</p>
        ) : (
          <ul className="flex flex-col">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} isSelf={member.id === selfId} onChanged={reload} />
            ))}
          </ul>
        )}
      </Section>

      <FlagReview />
    </div>
  );
};

interface CrewFlag {
  id: string;
  byName: string;
  targetName: string;
  week: string;
  reason: string;
  at: string;
}

/** Flags the crew raised: a flagged week stays off the board until the owner clears it or upholds it. */
const FlagReview: React.FC = () => {
  const [flags, setFlags] = useState<CrewFlag[] | null>(null);
  const load = useCallback(async () => {
    const result = await api<CrewFlag[]>('GET', '/crew/flags');
    setFlags(result.data ?? []);
  }, []);
  useEffect(() => {
    // Loading the flags is the point of this section.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  const resolve = async (id: string, action: 'clear' | 'uphold') => {
    await api('POST', `/crew/flags/${id}/resolve`, { action });
    void load();
  };
  return (
    <Section icon={<Flag className="w-4 h-4" />} title="Crew flags" subtitle="Clear a flag to put that week back on the board; uphold it to count the week as zero.">
      {flags === null ? (
        <p className="text-xs text-fg-5">Loading…</p>
      ) : flags.length === 0 ? (
        <p className="text-xs text-fg-4">No open flags.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {flags.map((flag) => (
            <li key={flag.id} className="flex flex-col gap-2 p-3 rounded-card bg-ink-850">
              <span className="text-sm text-fg">
                <strong>{flag.byName}</strong> flagged <strong>{flag.targetName}</strong>, week of {formatDate(flag.week)}
              </span>
              <span className="text-[13px] text-fg-3">{flag.reason}</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => void resolve(flag.id, 'clear')} className={SMALL}>
                  Clear
                </button>
                <button type="button" onClick={() => void resolve(flag.id, 'uphold')} className={SMALL_DANGER}>
                  Uphold
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};

/* ------------------------------------------------------------------ */
/* Inviting                                                            */
/* ------------------------------------------------------------------ */

interface InviteResponse {
  invite: Invite;
  link: string;
  emailed: boolean;
}

const InviteForm: React.FC<{ emailEnabled: boolean; onIssued: (link: IssuedLink) => void }> = ({ emailEnabled, onIssued }) => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!email.trim()) return setError('Enter the email address of the person to invite.');
    setBusy(true);
    setError(null);
    const result = await api<InviteResponse>('POST', '/invites', { email });
    setBusy(false);
    if (result.error || !result.data) return setError(result.error ?? 'Could not create the invitation.');
    onIssued({ email: result.data.invite.email, link: result.data.link, emailed: result.data.emailed });
    setEmail('');
  };

  return (
    <Section
      icon={<UserPlus className="w-4 h-4" />}
      title="Invite someone"
      subtitle={
        emailEnabled
          ? 'They get an email with a personal link to create their account.'
          : 'You get a personal link to send them — by message, email or however you like. Automatic emails switch on once a sending domain is connected.'
      }
    >
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 sm:items-end" noValidate>
        <div className="flex-1">
          <Field label="Their email" type="email" autoComplete="off" value={email} onChange={setEmail} placeholder="friend@example.com" />
        </div>
        <button type="submit" disabled={busy} className={`${PRIMARY_BUTTON} h-11 px-5`}>
          <Link2 className="w-4 h-4" />
          {busy ? 'Creating…' : emailEnabled ? 'Send invitation' : 'Create invite link'}
        </button>
      </form>
      {error && <FormMessage tone="error">{error}</FormMessage>}
    </Section>
  );
};

const IssuedLinkCard: React.FC<{ issued: IssuedLink; onClose: () => void }> = ({ issued, onClose }) => {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued.link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-live="polite" className="p-4 sm:p-5 rounded-card bg-ink-800 raised">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-base text-fg break-words">Invitation ready for {issued.email}</h2>
          <p className="mt-0.5 text-xs text-fg-3 leading-relaxed">
            {issued.emailed
              ? 'We emailed them this link. You can also send it yourself.'
              : 'Send them this link. It works once, for 14 days. It is shown only now — make a new one from the list if you lose it.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="flex items-center justify-center w-9 h-9 -mt-1.5 -mr-1.5 shrink-0 rounded-card text-fg-4 hover:text-fg hover:bg-ink-750 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={issued.link}
          onFocus={(event) => event.currentTarget.select()}
          aria-label="Invitation link"
          className="flex-1 min-w-0 h-11 px-3 rounded-card bg-ink-900 border border-ink-700 text-xs font-mono text-fg-2 outline-none focus:border-act"
        />
        <div className="flex gap-2">
          <button type="button" onClick={copy} className={`${PRIMARY_BUTTON} flex-1 sm:flex-none h-11 px-4`}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={() => void navigator.share({ title: 'Join me on Aura', url: issued.link }).catch(() => undefined)}
              className={`${SECONDARY_BUTTON} flex-1 sm:flex-none h-11 px-4 text-sm`}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

const InviteRow: React.FC<{ invite: Invite; onIssued: (link: IssuedLink) => void; onChanged: () => void }> = ({
  invite,
  onIssued,
  onChanged,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const look = STATUS[invite.status];

  const renew = async () => {
    setBusy(true);
    setError(null);
    const result = await api<InviteResponse>('POST', `/invites/${invite.id}/renew`);
    setBusy(false);
    if (result.error || !result.data) return setError(result.error ?? 'Could not make a new link.');
    onIssued({ email: invite.email, link: result.data.link, emailed: result.data.emailed });
  };

  const revoke = async () => {
    setBusy(true);
    setError(null);
    const result = await api('DELETE', `/invites/${invite.id}`);
    setBusy(false);
    if (result.error) return setError(result.error);
    onChanged();
  };

  return (
    <li className="py-3 first:pt-0 last:pb-0 border-t border-ink-700 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex-1 min-w-[180px]">
          <p className="text-sm font-bold text-fg break-all">{invite.email}</p>
          <p className="text-xs text-fg-4">
            {invite.status === 'accepted' && invite.acceptedAt
              ? `Joined ${formatDate(invite.acceptedAt)}`
              : invite.status === 'pending'
                ? `Expires ${formatDate(invite.expiresAt)}`
                : `Invited ${formatDate(invite.createdAt)}`}
          </p>
        </div>
        <Chip tone={look.tone}>{look.label}</Chip>
        {invite.status !== 'accepted' && (
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={renew} className={SMALL}>
              <RefreshCw className="w-3.5 h-3.5" />
              New link
            </button>
            {invite.status === 'pending' && (
              <button type="button" disabled={busy} onClick={revoke} className={SMALL_DANGER}>
                <X className="w-3.5 h-3.5" />
                Withdraw
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      )}
    </li>
  );
};

/* ------------------------------------------------------------------ */
/* Members                                                             */
/* ------------------------------------------------------------------ */

const MemberRow: React.FC<{ member: Member; isSelf: boolean; onChanged: () => void }> = ({ member, isSelf, onChanged }) => {
  const [panel, setPanel] = useState<'none' | 'password' | 'remove'>('none');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = passwordProblem(password, confirm);
    if (problem) return setMessage({ tone: 'error', text: problem });
    setBusy(true);
    const result = await api('POST', `/members/${member.id}/password`, { password });
    setBusy(false);
    if (result.error) return setMessage({ tone: 'error', text: result.error });
    setPanel('none');
    setPassword('');
    setConfirm('');
    setMessage({
      tone: 'success',
      text: isSelf ? 'Your password was changed.' : `New password set. ${member.name} was signed out and can sign in with it now.`,
    });
  };

  const remove = async () => {
    setBusy(true);
    const result = await api('DELETE', `/members/${member.id}`);
    setBusy(false);
    if (result.error) return setMessage({ tone: 'error', text: result.error });
    onChanged();
  };

  return (
    <li className="py-3 first:pt-0 last:pb-0 border-t border-ink-700 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-ink-800 font-display font-extrabold text-base text-fg shrink-0">
          {(member.name.trim()[0] ?? '?').toUpperCase()}
        </span>
        <div className="flex-1 min-w-[160px]">
          <p className="text-sm font-bold text-fg">
            {member.name}
            {isSelf && <span className="ml-1.5 text-[11px] font-semibold text-fg-5">(you)</span>}
          </p>
          <p className="text-xs text-fg-4">
            <span className="break-all">{member.email}</span>
            <span className="whitespace-nowrap"> · joined {formatDate(member.joinedAt)}</span>
          </p>
        </div>
        <Chip tone={member.role === 'admin' ? 'act' : 'dim'}>{member.role === 'admin' ? 'Owner' : 'Member'}</Chip>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPanel(panel === 'password' ? 'none' : 'password');
              setMessage(null);
            }}
            className={SMALL}
          >
            <KeyRound className="w-3.5 h-3.5" />
            {isSelf ? 'Change password' : 'Set password'}
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={() => {
                setPanel(panel === 'remove' ? 'none' : 'remove');
                setMessage(null);
              }}
              className={SMALL_DANGER}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      {panel === 'password' && (
        <form onSubmit={savePassword} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
          <PasswordField label="New password" autoComplete="new-password" value={password} onChange={setPassword} />
          <PasswordField label="Repeat it" autoComplete="new-password" value={confirm} onChange={setConfirm} />
          <button type="submit" disabled={busy} className={`${PRIMARY_BUTTON} h-11 px-5`}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      {panel === 'remove' && (
        <div className="mt-3">
          <p className="text-sm text-fg-2">
            Remove <strong className="text-fg">{member.name}</strong>? Their account and their whole campaign are deleted for good.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={remove} className={SMALL_DANGER}>
              <Trash2 className="w-3.5 h-3.5" />
              {busy ? 'Removing…' : 'Yes, remove'}
            </button>
            <button type="button" onClick={() => setPanel('none')} className={SMALL}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="mt-2">
          <FormMessage tone={message.tone}>{message.text}</FormMessage>
        </div>
      )}
    </li>
  );
};
