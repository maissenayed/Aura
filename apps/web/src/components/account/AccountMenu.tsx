'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ListTree, LogIn, LogOut, PenTool, Users } from 'lucide-react';
import { useAccount } from '../../utils/accountStore';
import { signOutOfCampaign } from '../../utils/protocolStore';

/** The panel's width (w-64), to keep it on screen. */
const MENU_WIDTH = 256;

/** The signed-in person, in the header: who you are, the team page (owner), and sign out. */
/** `large` matches the 44 px buttons of the phone header beside it. */
export const AccountMenu: React.FC<{ large?: boolean }> = ({ large = false }) => {
  const { status, mode, account, setupRequired } = useAccount();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [place, setPlace] = useState<{ up: boolean; left: number }>({ up: false, left: 0 });
  const root = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!open && root.current) {
      // Open towards the free side: up from the foot of the sidebar, down from a top bar, never past the screen's edge.
      const box = root.current.getBoundingClientRect();
      const start = Math.min(Math.max(8, box.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
      setPlace({ up: box.top > window.innerHeight / 2, left: start - box.left });
    }
    setOpen((current) => !current);
  };

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

  // Before the owner exists there is nobody to sign in as, so the header stays quiet. Offline, before
  // the server said who is signed in, nobody is known yet either: no "Sign in" over a board that is playing.
  if (mode === 'open' || status === 'loading' || setupRequired || (status === 'offline' && !account)) return null;

  if (!account) {
    return (
      <Link
        href="/camp"
        className="flex items-center gap-1.5 h-9 px-3 rounded-card border border-ink-600 text-xs font-bold text-fg hover:bg-ink-850 active:scale-[.97] transition shrink-0"
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
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${account.name}`}
        className={`flex items-center justify-center ${large ? 'w-11 h-11 text-lg' : 'w-9 h-9 text-base'} rounded-full bg-ink-800 text-fg font-display font-extrabold hover:bg-ink-750 active:scale-[.97] transition cursor-pointer`}
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          style={{ left: place.left }}
          className={`absolute ${place.up ? 'bottom-full mb-2' : 'top-full mt-2'} w-64 p-1.5 bg-ink-900 rounded-card lift-shadow border border-ink-700 z-[60]`}
        >
          <div className="px-3 py-2.5 border-b border-ink-700 mb-1">
            <p className="text-sm font-bold text-fg truncate">{account.name}</p>
            <p className="text-[11px] text-fg-4 truncate">{account.email}</p>
            <p className="eyebrow mt-1.5 text-fg-4">
              {account.role === 'admin' ? 'Owner' : 'Member'}
            </p>
          </div>
          {account.role === 'admin' && (
            <Link
              href="/team"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 h-10 px-3 rounded-card text-sm font-semibold text-fg-2 hover:bg-ink-800 hover:text-fg"
            >
              <Users className="w-4 h-4 text-fg-4" />
              Team & invitations
            </Link>
          )}
          {account.role === 'admin' && (
            <Link
              href="/admin/exercises"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 h-10 px-3 rounded-card text-sm font-semibold text-fg-2 hover:bg-ink-800 hover:text-fg"
            >
              <ListTree className="w-4 h-4 text-fg-4" />
              Exercises
            </Link>
          )}
          {account.role === 'admin' && (
            <Link
              href="/studio"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 h-10 px-3 rounded-card text-sm font-semibold text-fg-2 hover:bg-ink-800 hover:text-fg"
            >
              <PenTool className="w-4 h-4 text-fg-4" />
              Figure studio
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
            className="flex items-center gap-2.5 w-full h-10 px-3 rounded-card text-sm font-semibold text-fg-2 hover:bg-ink-800 hover:text-fg disabled:opacity-60 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-fg-4" />
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
};
