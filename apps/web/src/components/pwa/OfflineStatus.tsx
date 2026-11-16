'use client';

import { useEffect } from 'react';
import { CloudOff } from 'lucide-react';
import { useGame } from '../game/GameProvider';

/**
 * The offline parts that need the campaign:
 * - asks the service worker to keep this plan's boss pages, so a fight can be
 *   opened and logged with no signal like every other screen;
 * - on phones, says when there is no connection and that progress is being
 *   kept on the device until it syncs. Desktop shows this in the sidebar.
 */
export function OfflineStatus() {
  const { gate, sync, derived } = useGame();
  // One string, so the effect only runs again when the bosses themselves change.
  const bossPaths = derived.bosses.map((entry) => `/bosses/${encodeURIComponent(entry.boss.id)}`).join('\n');

  useEffect(() => {
    if (gate !== 'ready' || !bossPaths || !('serviceWorker' in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.ready.then((registration) => {
      if (!cancelled) registration.active?.postMessage({ type: 'aura:keep-pages', paths: bossPaths.split('\n') });
    });
    return () => {
      cancelled = true;
    };
  }, [gate, bossPaths]);

  if (gate !== 'ready' || sync !== 'offline') return null;

  return (
    <div
      role="status"
      className="lg:hidden fixed z-[55] left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+90px)] flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#1a1208]/95 border border-[#4a3410] text-earned text-xs font-semibold whitespace-nowrap shadow-[0_6px_20px_rgba(0,0,0,0.5)] pointer-events-none"
    >
      <CloudOff className="w-4 h-4" />
      Offline · saved on this device
    </div>
  );
}
