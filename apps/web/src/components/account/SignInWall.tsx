'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useGame } from '../game/GameProvider';
import { Wordmark } from '../game/icons';
import { AuthGate } from './AuthGate';
import { Onboarding } from './Onboarding';

/** The only pages open to someone who is not signed in: accepting an invitation, and resetting a password. */
const PUBLIC_PATHS = ['/join', '/reset-password'];

const isPublic = (pathname: string) => PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * Nothing in the app opens until someone is signed in. Accounts only come
 * from the owner's invitations (sign-up is closed on the server), so a
 * visitor without one sees the sign-in form and nothing else — the very
 * first visit sees owner setup instead.
 */
export const SignInWall: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { gate } = useGame();

  if (gate === 'ready' || isPublic(pathname)) return <>{children}</>;

  // A new account picks the campaign it starts with before anything opens.
  if (gate === 'onboard') {
    return (
      <main className="flex-1 min-h-dvh flex flex-col items-center gap-7 px-4 py-10 bg-ink-950 text-fg">
        <Wordmark />
        <Onboarding />
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-dvh flex flex-col items-center justify-center gap-7 px-4 py-10 bg-ink-950 text-fg">
      <Wordmark />
      {gate === 'loading' ? (
        <div className="w-full max-w-md h-80 rounded-card bg-ink-900 animate-pulse" aria-busy="true" aria-label="Loading" />
      ) : (
        <div className="w-full max-w-md">
          <AuthGate mode={gate} />
        </div>
      )}
    </main>
  );
};
