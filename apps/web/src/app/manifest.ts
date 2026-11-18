import type { MetadataRoute } from 'next';

/**
 * Makes Aura installable: added to a phone's home screen it opens on Camp in
 * its own window, without the browser around it. Served at /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Aura',
    short_name: 'Aura',
    description: 'Earn your aura. Your training as an RPG: daily quests, bosses to beat and a skill tree to climb.',
    start_url: '/camp',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0e0d0b',
    theme_color: '#0e0d0b',
    categories: ['fitness', 'health', 'sports'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    // Long-press the home-screen icon (Android) to jump straight in.
    shortcuts: [
      { name: "Today's quest", short_name: 'Quest', url: '/quest', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Skill tree', short_name: 'Tree', url: '/', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Bosses', short_name: 'Bosses', url: '/bosses', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
