'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth's browser client. It talks to `/api/auth/*` on this same origin:
 * on Vercel that path is routed to the backend service, and in local
 * development `next.config.ts` proxies it there.
 */
export const authClient = createAuthClient();
