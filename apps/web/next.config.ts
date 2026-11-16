import type { NextConfig } from 'next';

/**
 * The browser always calls the backend through this app's own origin
 * (`/api/v1/...`), so there is no CORS and a phone on the same network works
 * without knowing the backend's address.
 *
 * On Vercel the platform routes `/api/*` to the backend service itself (see
 * `vercel.json`), so no rewrite is needed there. Anywhere else — `npm run dev`,
 * `next start` — this app proxies those paths to the NestJS server. Set
 * `BACKEND_ORIGIN` to point at a backend that lives somewhere else.
 */
const backendOrigin = process.env.BACKEND_ORIGIN ?? (process.env.VERCEL ? null : 'http://localhost:3002');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // The service worker that makes Aura installable: never cached, so a fix reaches installed phones on their next visit.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  // The campaign used to live on one tabbed page; each part now has its own route.
  async redirects() {
    return [{ source: '/tracker', destination: '/camp', permanent: true }];
  },
  async rewrites() {
    if (!backendOrigin) return [];
    return [
      { source: '/api/v1/:path*', destination: `${backendOrigin}/api/v1/:path*` },
      // Better Auth's own endpoints (sign-in, sign-out, password reset) live on the backend too.
      { source: '/api/auth/:path*', destination: `${backendOrigin}/api/auth/:path*` },
    ];
  },
};

export default nextConfig;
