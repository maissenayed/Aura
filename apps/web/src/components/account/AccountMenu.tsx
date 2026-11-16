'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogIn, LogOut, Users } from 'lucide-react';
import { useAccount } from '../../utils/accountStore';
import { signOutOfCampaign } from '../../utils/protocolStore';

/** The signed-in person, in the header: who you are, the team page (owner), and sign out. */
export const AccountMenu: React.FC = () => {
  const { status, mode, account, setupRequired } = useAccount();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Before the owner exists there is nobody to sign in as, so the header stays quiet.
  if (mode === 'open' || status === 'loading' || setupRequired) return null;

  if (!account) {
    return (
      <Link
        href="/camp"
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-700 text-xs font-extrabold text-slate-300 hover:text-white hover:border-slate-500 transition shrink-0"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span className="max-sm:sr-only">Sign in</span>
      </Link>
    );
  }

  const initial = (account.name.trim()[0] ?? '?').toUpperCase();

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${account.name}`}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 border border-purple-400/40 text-sm font-black text-white hover:border-purple-300 transition cursor-pointer"
      >
        {initial}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 p-1.5 rounded-2xl bg-dark-900 border border-slate-700 shadow-2xl z-[60]">
          <div className="px-3 py-2.5 border-b border-slate-800 mb-1">
            <p className="text-sm font-bold text-white truncate">{account.name}</p>
            <p className="text-[11px] text-slate-400 truncate">{account.email}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-neon-purple">
              {account.role === 'admin' ? 'Owner' : 'Member'}
            </p>
          </div>
          {account.role === 'admin' && (
            <Link
              href="/team"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm font-semibold text-slate-200 hover:bg-dark-700"
            >
              <Users className="w-4 h-4 text-neon-cyan" />
              Team & invitations
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await signOutOfCampaign();
              setBusy(false);
              setOpen(false);
            }}
            className="flex items-center gap-2.5 w-full h-10 px-3 rounded-xl text-sm font-semibold text-slate-200 hover:bg-dark-700 disabled:opacity-60 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
};
