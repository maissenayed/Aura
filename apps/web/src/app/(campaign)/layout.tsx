'use client';

import React from 'react';
import { AuthGate } from '../../components/account/AuthGate';
import { AppShell } from '../../components/game/AppShell';
import { useGame } from '../../components/game/GameProvider';

/**
 * Every campaign screen shares this frame. The save and today's date only
 * exist in the browser, so the screens wait for both; a visitor who is not
 * signed in gets the sign-in (or first-owner setup) instead.
 */
export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const { gate, todayIso } = useGame();

  return (
    <AppShell>
      {!todayIso || gate === 'loading' ? (
        <div className="p-4 lg:p-8">
          <div
            className="h-[420px] max-w-[1180px] mx-auto rounded-3xl border border-ink-700 bg-ink-900 animate-pulse"
            aria-busy="true"
            aria-label="Loading your campaign"
          />
        </div>
      ) : gate === 'signin' || gate === 'setup' ? (
        <div className="p-4 lg:p-8 max-w-[1180px] w-full mx-auto">
          <AuthGate mode={gate} />
        </div>
      ) : (
        children
      )}
    </AppShell>
  );
}
