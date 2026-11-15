import type { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';

/**
 * Signs a just-created account in and hands the session cookie to the browser,
 * so finishing setup or accepting an invite lands you straight in the app.
 */
export async function signInAndSetCookie(email: string, password: string, request: Request, response: Response) {
  if (!auth) return;
  const { headers } = await auth.api.signInEmail({
    body: { email, password },
    headers: fromNodeHeaders(request.headers),
    returnHeaders: true,
  });
  const cookies = headers.getSetCookie();
  if (cookies.length > 0) response.append('Set-Cookie', cookies);
}
