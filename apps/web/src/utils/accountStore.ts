'use client';

import { useSyncExternalStore } from 'react';
import { authClient } from './authClient';

/** Who is signed in, as the backend sees it. Shared by the header, the campaign and the team page. */

export interface Account {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AccountState {
  /** `offline`: the backend could not be reached. */
  status: 'loading' | 'ready' | 'offline';
  /** `open`: a local run without a database — no accounts, one implicit athlete. */
  mode: 'open' | 'accounts';
  /** No account exists yet; the first visitor must create the owner account. */
  setupRequired: boolean;
  account: Account | null;
  /** Whether the server can send email (password resets, invitations). */
  email: boolean;
  /** Setup can be proven with the campaign passcode from before accounts existed. */
  legacyPasscode: boolean;
}

const INITIAL: AccountState = {
  status: 'loading',
  mode: 'accounts',
  setupRequired: false,
  account: null,
  email: false,
  legacyPasscode: false,
};

let state: AccountState = INITIAL;
let started = false;
let inFlight: Promise<AccountState> | null = null;
const listeners = new Set<() => void>();

function set(next: AccountState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Asks the backend who is signed in. Concurrent callers share one request. */
export function refreshAccount(): Promise<AccountState> {
  inFlight ??= (async () => {
    try {
      const response = await fetch('/api/v1/account', { cache: 'no-store', signal: AbortSignal.timeout(12_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { data } = (await response.json()) as { data: Omit<AccountState, 'status'> };
      set({ ...INITIAL, ...data, legacyPasscode: Boolean(data.legacyPasscode), status: 'ready' });
    } catch {
      set({ ...state, status: 'offline' });
    } finally {
      inFlight = null;
    }
    return state;
  })();
  return inFlight;
}

export function getAccountState(): AccountState {
  return state;
}

export function subscribeAccount(listener: () => void): () => void {
  listeners.add(listener);
  if (!started) {
    started = true;
    void refreshAccount();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useAccount(): AccountState {
  return useSyncExternalStore(subscribeAccount, getAccountState, () => INITIAL);
}

/** Error text from a Better Auth client call, or null on success. */
function authError(result: { error?: { message?: string; status?: number } | null }): string | null {
  if (!result.error) return null;
  if (result.error.status === 401) return 'That email and password do not match.';
  if (result.error.status === 429) return 'Too many attempts. Wait a minute and try again.';
  return result.error.message || 'Something went wrong. Try again.';
}

export async function signIn(email: string, password: string): Promise<string | null> {
  try {
    const failure = authError(await authClient.signIn.email({ email: email.trim(), password, rememberMe: true }));
    if (failure) return failure;
  } catch {
    return 'Could not reach the server. Check your connection and try again.';
  }
  await refreshAccount();
  return null;
}

export async function signOut(): Promise<void> {
  try {
    await authClient.signOut();
  } catch {
    // Signing out locally still matters even if the server is unreachable.
  }
  await refreshAccount();
}

export async function requestPasswordReset(email: string): Promise<string | null> {
  try {
    return authError(
      await authClient.requestPasswordReset({ email: email.trim(), redirectTo: `${window.location.origin}/reset-password` }),
    );
  } catch {
    return 'Could not reach the server. Check your connection and try again.';
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<string | null> {
  try {
    return authError(await authClient.resetPassword({ token, newPassword }));
  } catch {
    return 'Could not reach the server. Check your connection and try again.';
  }
}

/** Calls one of the app's own JSON endpoints and returns its data or an error message. */
export async function api<T>(method: string, path: string, body?: unknown): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const response = await fetch(`/api/v1${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await response.json().catch(() => null)) as { data?: T; message?: string } | null;
    if (!response.ok) return { error: json?.message ?? `The server answered ${response.status}.`, status: response.status };
    return { data: json?.data, status: response.status };
  } catch {
    return { error: 'Could not reach the server. Check your connection and try again.', status: 0 };
  }
}
