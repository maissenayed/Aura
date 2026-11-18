'use client';

import React from 'react';
import { AppShell } from '../../components/game/AppShell';
import { useGame } from '../../components/game/GameProvider';

/**
 * Every campaign screen shares this frame. Sign-in is handled for the whole
 * app by the SignInWall; the screens only wait for today's date, which exists
 * in the browser alone.
 */
export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const { todayIso } = useGame();

  return (
    <AppShell>
      {todayIso ? (
        children
      ) : (
        <div className="p-4 lg:p-8">
          <div
            className="h-[420px] max-w-[1180px] mx-auto rounded-card border border-ink-700 bg-ink-900 animate-pulse"
            aria-busy="true"
            aria-label="Loading your campaign"
          />
        </div>
      )}
    </AppShell>
  );
}
