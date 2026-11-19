'use client';

import React from 'react';
import Link from 'next/link';
import { AccountMenu } from '../../../components/account/AccountMenu';
import { ExerciseManager } from '../../../components/admin/ExerciseManager';
import { AppShell, ScreenHeader } from '../../../components/game/AppShell';
import { useAccount } from '../../../utils/accountStore';

/** The owner's page for the exercise list in the database. */
export default function ExercisesAdminPage() {
  const { status, account } = useAccount();

  let body: React.ReactNode;
  if (status === 'loading') {
    body = <div className="h-96 rounded-card bg-ink-900 animate-pulse" aria-busy="true" />;
  } else if (status === 'offline') {
    body = <Notice title="Offline">The exercise list lives on the server. Connect and try again.</Notice>;
  } else if (!account) {
    body = (
      <Notice title="Sign in first">
        <Link href="/camp" className="font-bold text-act hover:underline">
          Sign in
        </Link>{' '}
        to manage the exercises.
      </Notice>
    );
  } else if (account.role !== 'admin') {
    body = <Notice title="Owner only">Only the owner can change the exercise list. Everyone trains on it from the skill tree.</Notice>;
  } else {
    body = <ExerciseManager />;
  }

  return (
    <AppShell>
      <main className="w-full max-w-6xl mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-5">
        {/* On desktop the account menu sits in the sidebar; on a phone this page keeps it in reach here. */}
        <ScreenHeader
          eyebrow="Owner · the exercise list"
          title="Exercises"
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
