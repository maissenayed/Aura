'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, KeyRound, Link2, Mail, RefreshCw, Share2, Trash2, UserPlus, Users, X } from 'lucide-react';
import { Header } from '../../components/Header';
import { Field, FormMessage, PasswordField, passwordProblem } from '../../components/account/ui';
import { Panel, PanelHead } from '../../components/protocol/primitives';
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

const STATUS: Record<Invite['status'], { label: string; tone: string }> = {
  pending: { label: 'Waiting', tone: 'text-neon-cyan border-cyan-500/40 bg-cyan-950/40' },
  accepted: { label: 'Joined', tone: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40' },
  revoked: { label: 'Withdrawn', tone: 'text-slate-400 border-slate-700 bg-dark-950' },
  expired: { label: 'Expired', tone: 'text-amber-300 border-amber-500/40 bg-amber-950/30' },
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const BUTTON =
  'flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-wait';

export default function TeamPage() {
  const { status, mode, account } = useAccount();

  let body: React.ReactNode;
  if (status === 'loading') {
    body = <div className="h-96 rounded-2xl border border-slate-800 bg-dark-900/50 animate-pulse" aria-busy="true" />;
  } else if (mode === 'open') {
    body = <Notice title="Accounts are off">This server runs without a database, so there is nobody to invite.</Notice>;
  } else if (!account) {
    body = (
      <Notice title="Sign in first">
        <Link href="/tracker" className="font-bold text-neon-cyan hover:underline">
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6">{body}</main>
    </div>
  );
}

const Notice: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Panel className="max-w-md mx-auto p-6 text-center">
    <h1 className="text-lg font-black text-white">{title}</h1>
    <p className="mt-2 text-sm text-slate-400">{children}</p>
  </Panel>
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
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-black text-white tracking-tight">Team & invitations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Invite people by email address. Each person gets their own private campaign.
        </p>
      </header>

      {loadError && <FormMessage tone="error">{loadError}</FormMessage>}

      <InviteForm emailEnabled={emailEnabled} onIssued={(link) => { setIssued(link); void reload(); }} />

      {issued && <IssuedLinkCard issued={issued} onClose={() => setIssued(null)} />}

      <Panel className="p-4 sm:p-6">
        <PanelHead icon={<Mail className="w-4 h-4" />} title="Invitations" subtitle="Links work once and expire after 14 days." />
        {invites === null ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="text-xs text-slate-400">No invitations yet.</p>
        ) : (
          <ul className="space-y-2">
            {invites.map((invite) => (
              <InviteRow key={invite.id} invite={invite} onIssued={(link) => { setIssued(link); void reload(); }} onChanged={reload} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="p-4 sm:p-6">
        <PanelHead icon={<Users className="w-4 h-4" />} title="Members" subtitle="Everyone who can sign in." />
        {members === null ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} isSelf={member.id === selfId} onChanged={reload} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
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
    <Panel className="p-4 sm:p-6">
      <PanelHead
        icon={<UserPlus className="w-4 h-4" />}
        title="Invite someone"
        subtitle={
          emailEnabled
            ? 'They get an email with a personal link to create their account.'
            : 'You get a personal link to send them — by message, email or however you like. Automatic emails switch on once a sending domain is connected.'
        }
      />
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 sm:items-end" noValidate>
        <div className="flex-1">
          <Field label="Their email" type="email" autoComplete="off" value={email} onChange={setEmail} placeholder="friend@example.com" />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-black bg-neon-cyan text-dark-950 hover:brightness-110 disabled:opacity-60 disabled:cursor-wait transition cursor-pointer"
        >
          <Link2 className="w-4 h-4" />
          {busy ? 'Creating…' : emailEnabled ? 'Send invitation' : 'Create invite link'}
        </button>
      </form>
      {error && (
        <div className="mt-2">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      )}
    </Panel>
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
    <section aria-live="polite" className="p-4 sm:p-5 rounded-2xl border border-cyan-500/40 bg-cyan-950/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-white">Invitation ready for {issued.email}</h2>
          <p className="mt-0.5 text-xs text-slate-300">
            {issued.emailed
              ? 'We emailed them this link. You can also send it yourself.'
              : 'Send them this link. It works once, for 14 days. It is shown only now — make a new one from the list if you lose it.'}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={issued.link}
          onFocus={(event) => event.currentTarget.select()}
          aria-label="Invitation link"
          className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-dark-950 border border-slate-700 text-xs font-mono text-slate-200 outline-none"
        />
        <div className="flex gap-2">
          <button type="button" onClick={copy} className={`${BUTTON} flex-1 sm:flex-none h-10 text-neon-cyan border-cyan-500/50 hover:bg-cyan-900/40`}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={() => void navigator.share({ title: 'Join me on Aura Calisthenics', url: issued.link }).catch(() => undefined)}
              className={`${BUTTON} flex-1 sm:flex-none h-10 text-slate-200 border-slate-600 hover:border-slate-400`}
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
    <li className="p-3 rounded-xl bg-dark-950/60 border border-slate-800">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex-1 min-w-[180px]">
          <p className="text-sm font-bold text-white break-all">{invite.email}</p>
          <p className="text-[11px] text-slate-500">
            {invite.status === 'accepted' && invite.acceptedAt
              ? `Joined ${formatDate(invite.acceptedAt)}`
              : invite.status === 'pending'
                ? `Expires ${formatDate(invite.expiresAt)}`
                : `Invited ${formatDate(invite.createdAt)}`}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${look.tone}`}>{look.label}</span>
        {invite.status !== 'accepted' && (
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={renew} className={`${BUTTON} text-neon-cyan border-cyan-500/40 hover:bg-cyan-950/40`}>
              <RefreshCw className="w-3.5 h-3.5" />
              New link
            </button>
            {invite.status === 'pending' && (
              <button type="button" disabled={busy} onClick={revoke} className={`${BUTTON} text-slate-300 border-slate-700 hover:text-rose-300 hover:border-rose-800`}>
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
    <li className="p-3 rounded-xl bg-dark-950/60 border border-slate-800">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-dark-800 border border-slate-700 text-sm font-black text-white shrink-0">
          {(member.name.trim()[0] ?? '?').toUpperCase()}
        </span>
        <div className="flex-1 min-w-[160px]">
          <p className="text-sm font-bold text-white">
            {member.name}
            {isSelf && <span className="ml-1.5 text-[11px] font-semibold text-slate-500">(you)</span>}
          </p>
          <p className="text-[11px] text-slate-500">
            <span className="break-all">{member.email}</span>
            <span className="whitespace-nowrap"> · joined {formatDate(member.joinedAt)}</span>
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${
            member.role === 'admin' ? 'text-neon-purple border-purple-500/40 bg-purple-950/40' : 'text-slate-300 border-slate-700 bg-dark-950'
          }`}
        >
          {member.role === 'admin' ? 'Owner' : 'Member'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPanel(panel === 'password' ? 'none' : 'password');
              setMessage(null);
            }}
            className={`${BUTTON} text-slate-200 border-slate-700 hover:border-slate-500`}
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
              className={`${BUTTON} text-slate-300 border-slate-700 hover:text-rose-300 hover:border-rose-800`}
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
          <button type="submit" disabled={busy} className={`${BUTTON} h-11 px-4 text-dark-950 bg-neon-cyan border-transparent font-black`}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      {panel === 'remove' && (
        <div className="mt-3 p-3 rounded-xl border border-rose-900/60 bg-rose-950/20">
          <p className="text-xs text-slate-200">
            Remove <strong>{member.name}</strong>? Their account and their whole campaign are deleted for good.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={remove} className={`${BUTTON} text-rose-200 border-rose-700 bg-rose-950/50 hover:bg-rose-900/50`}>
              {busy ? 'Removing…' : 'Yes, remove'}
            </button>
            <button type="button" onClick={() => setPanel('none')} className={`${BUTTON} text-slate-300 border-slate-700`}>
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
