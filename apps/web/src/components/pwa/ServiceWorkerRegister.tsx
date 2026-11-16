'use client';

import { useEffect } from 'react';

/**
 * Registers `/sw.js`, which keeps Aura on the phone so it opens with no signal
 * and lets Chrome offer "Install". Each deploy registers it under its own
 * `?v=`, so the worker reinstalls and stores that deploy's screens. Production
 * only: in `next dev` a worker would just get in the way.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    const version = encodeURIComponent(process.env.AURA_BUILD_ID ?? 'dev');
    navigator.serviceWorker
      .register(`/sw.js?v=${version}`, { scope: '/', updateViaCache: 'none' })
      .catch((error) => console.warn('Aura: service worker registration failed', error));
  }, []);

  return null;
}
