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
  async rewrites() {
    if (!backendOrigin) return [];
    return [{ source: '/api/v1/:path*', destination: `${backendOrigin}/api/v1/:path*` }];
  },
};

export default nextConfig;
