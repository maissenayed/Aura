'use client';

import { useEffect } from 'react';

/**
 * Registers `/sw.js` so Chrome treats Aura as an installable app and offers
 * "Install". Production only: in `next dev` a worker would just get in the way.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((error) => console.warn('Aura: service worker registration failed', error));
  }, []);

  return null;
}
