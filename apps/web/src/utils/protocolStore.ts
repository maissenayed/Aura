'use client';

import { useSyncExternalStore } from 'react';
import { IRON_STATS } from '../data/protocolData';
import { getAccountState, refreshAccount, signOut, subscribeAccount } from './accountStore';
import { LogEntry, ProtocolSave, createInitialSave, mondayOf, toIsoDate } from './protocolEngine';

/**
 * The signed-in athlete's campaign save, kept in step with the backend.
 *
 * Every change lands in this device's storage first, so the game never waits
 * on the network and keeps working offline. A copy is then pushed to the
 * backend, which only accepts it if this device was looking at the latest
 * revision. If another device got there first, the two versions are merged
 * field by field and pushed again — nothing ticked on one device is lost.
 *
 * Each account has its own cache on the device, so two people sharing a phone
 * never see each other's campaign. Signing out removes the cache.
 *
 * Read through `useSyncExternalStore`, so the server render and the first
 * client render agree and the real save swaps in after hydration.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const CACHE_PREFIX = 'aura_hybrid_engine_v3:';
/** Caches from before accounts existed. They belong to the owner and are adopted once. */
const LEGACY_CACHES = ['aura_hybrid_engine_v2', 'aura_hybrid_engine_v1'];
const LEGACY_PASSCODE = 'aura_hybrid_engine_passcode';
const LAST_USER = 'aura_hybrid_engine_last_user';

const PUSH_DEBOUNCE_MS = 700;
const RETRY_MIN_MS = 5_000;
const RETRY_MAX_MS = 60_000;
const REQUEST_TIMEOUT_MS = 12_000;
const LOG_LIMIT = 40;

/** What stands between the athlete and the board. */
export type Gate = 'loading' | 'signin' | 'setup' | 'ready';
export type SyncStatus = 'connecting' | 'saving' | 'synced' | 'offline';

export interface CampaignSnapshot {
  save: ProtocolSave;
  gate: Gate;
  sync: SyncStatus;
}

interface RemoteDoc {
  rev: number;
  value: unknown;
}

/* ------------------------------------------------------------------ */
/* Module state                                                        */
/* ------------------------------------------------------------------ */

const SERVER_SNAPSHOT: CampaignSnapshot = { save: createInitialSave(), gate: 'loading', sync: 'connecting' };

let snapshot: CampaignSnapshot | null = null;
/** Whose save is loaded. Null until an account is known. */
let userId: string | null = null;
/** The last version this device and the backend agreed on, and its revision. */
let base: ProtocolSave | null = null;
let baseRev = 0;

let started = false;
let connected = false;
let pushing = false;
let pushTimer: number | undefined;
let retryTimer: number | undefined;
let retryDelay = RETRY_MIN_MS;

const listeners = new Set<() => void>();

/* ------------------------------------------------------------------ */
/* Save helpers                                                        */
/* ------------------------------------------------------------------ */

/** A save as it looks before anything is logged, opening on this week's Monday. */
function pristine(): ProtocolSave {
  return { ...createInitialSave(), startedAt: mondayOf(toIsoDate(new Date())) };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Lays whatever was stored over a fresh save, so an older or partial save still loads whole. */
function normalizeSave(raw: unknown): ProtocolSave {
  const fresh = pristine();
  if (!isRecord(raw)) return fresh;

  const stats = { ...fresh.stats };
  if (isRecord(raw.stats)) {
    for (const stat of IRON_STATS) {
      const saved = raw.stats[stat.id];
      if (typeof saved === 'number' && Number.isFinite(saved)) stats[stat.id] = saved;
    }
  }

  return {
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : fresh.startedAt,
    bodyWeightKg:
      typeof raw.bodyWeightKg === 'number' && Number.isFinite(raw.bodyWeightKg) ? raw.bodyWeightKg : fresh.bodyWeightKg,
    stats,
    loads: isRecord(raw.loads) ? (raw.loads as Record<string, number>) : {},
    milestones: isRecord(raw.milestones) ? (raw.milestones as Record<string, boolean>) : {},
    quests: isRecord(raw.quests) ? (raw.quests as Record<string, boolean>) : {},
    log: Array.isArray(raw.log) ? (raw.log as LogEntry[]) : [],
  };
}

/** JSON with keys in a fixed order, so two saves with the same content compare equal. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, inner) =>
    isRecord(inner)
      ? Object.keys(inner)
          .sort()
          .reduce<Record<string, unknown>>((sorted, key) => {
            sorted[key] = inner[key];
            return sorted;
          }, {})
      : inner,
  );
}

const sameSave = (a: ProtocolSave, b: ProtocolSave) => canonical(a) === canonical(b);

function mergeMap<T>(from: Record<string, T>, mine: Record<string, T>, theirs: Record<string, T>): Record<string, T> {
  const merged: Record<string, T> = {};
  for (const key of new Set([...Object.keys(from), ...Object.keys(mine), ...Object.keys(theirs)])) {
    // What this device changed (or removed) since the last agreed version wins; everything else follows the backend.
    const value = Object.is(mine[key], from[key]) ? theirs[key] : mine[key];
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}

/**
 * Three-way merge: `from` is the last version both sides agreed on, `mine` is
 * this device now, `theirs` is the backend now.
 */
function mergeSaves(from: ProtocolSave, mine: ProtocolSave, theirs: ProtocolSave): ProtocolSave {
  const seen = new Set(mine.log.map((entry) => canonical(entry)));
  const log = [...mine.log, ...theirs.log.filter((entry) => !seen.has(canonical(entry)))]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, LOG_LIMIT);

  return {
    startedAt: mine.startedAt !== from.startedAt ? mine.startedAt : theirs.startedAt,
    bodyWeightKg: mine.bodyWeightKg !== from.bodyWeightKg ? mine.bodyWeightKg : theirs.bodyWeightKg,
    stats: mergeMap(from.stats, mine.stats, theirs.stats) as ProtocolSave['stats'],
    loads: mergeMap(from.loads, mine.loads, theirs.loads),
    milestones: mergeMap(from.milestones, mine.milestones, theirs.milestones),
    quests: mergeMap(from.quests, mine.quests, theirs.quests),
    log,
  };
}

/* ------------------------------------------------------------------ */
/* Device storage                                                      */
/* ------------------------------------------------------------------ */

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch (error) {
    console.error('Could not update this device’s storage:', error);
  }
}

/**
 * Loads one account's cached save. The owner (or the single local athlete)
 * also inherits a cache written before accounts existed.
 */
function readCache(id: string, adoptLegacy: boolean): { save: ProtocolSave; existed: boolean } {
  base = null;
  baseRev = 0;
  try {
    const raw = storageGet(CACHE_PREFIX + id);
    if (raw) {
      const parsed = JSON.parse(raw) as { save?: unknown; base?: unknown; baseRev?: unknown };
      base = parsed.base ? normalizeSave(parsed.base) : null;
      baseRev = typeof parsed.baseRev === 'number' ? parsed.baseRev : 0;
      return { save: normalizeSave(parsed.save), existed: true };
    }

    if (adoptLegacy) {
      for (const key of LEGACY_CACHES) {
        const legacy = storageGet(key);
        if (!legacy) continue;
        const parsed = JSON.parse(legacy) as { save?: unknown };
        // v2 wrapped the save with sync bookkeeping; v1 stored the bare save. The old revision is
        // dropped on purpose: the save moved to a new key on the server, so a fresh merge is right.
        return { save: normalizeSave(key === 'aura_hybrid_engine_v2' ? parsed.save : parsed), existed: true };
      }
    }
  } catch (error) {
    console.error('Could not read the campaign save on this device, starting fresh:', error);
  }
  return { save: pristine(), existed: false };
}

function persist(): void {
  if (!snapshot || !userId) return;
  storageSet(CACHE_PREFIX + userId, JSON.stringify({ save: snapshot.save, base, baseRev }));
  // Once the owner's data lives under their account, the pre-account copies have done their job.
  LEGACY_CACHES.forEach((key) => storageSet(key, null));
  storageSet(LEGACY_PASSCODE, null);
}

/* ------------------------------------------------------------------ */
/* Store plumbing                                                      */
/* ------------------------------------------------------------------ */

function getSnapshot(): CampaignSnapshot {
  if (!snapshot) {
    // Whoever was signed in last on this device gets their board straight away; the
    // session is confirmed behind it and the board is swapped out if it is not theirs.
    const last = storageGet(LAST_USER);
    if (last) {
      userId = last;
      const cached = readCache(last, false);
      snapshot = { save: cached.save, gate: cached.existed ? 'ready' : 'loading', sync: 'connecting' };
    } else {
      snapshot = { save: pristine(), gate: 'loading', sync: 'connecting' };
    }
  }
  return snapshot;
}

function getServerSnapshot(): CampaignSnapshot {
  return SERVER_SNAPSHOT;
}

function update(patch: Partial<CampaignSnapshot>): void {
  snapshot = { ...getSnapshot(), ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!started) {
    started = true;
    window.addEventListener('online', () => void sync());
    document.addEventListener('visibilitychange', () => {
      // Coming back to the tab: pick up anything another device saved meanwhile.
      if (document.visibilityState === 'visible' && connected && !pushing && getSnapshot().gate === 'ready') void pull();
    });
    window.addEventListener('storage', (event) => {
      // Another tab on this device saved: follow it.
      if (!userId || event.key !== CACHE_PREFIX + userId) return;
      update({ save: readCache(userId, false).save });
    });
    // Signing in or out anywhere on the page (the header menu, the sign-in form) re-routes the campaign.
    subscribeAccount(() => void follow());
    void connect();
  }
  return () => {
    listeners.delete(listener);
  };
}

/* ------------------------------------------------------------------ */
/* Backend sync                                                        */
/* ------------------------------------------------------------------ */

interface ApiResult {
  status: number;
  body: { data?: unknown; message?: string } | null;
}

/** Resolves to null when the backend could not be reached at all. */
async function request(method: string, path: string, body?: unknown): Promise<ApiResult | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const parsed = (await response.json().catch(() => null)) as ApiResult['body'];
    return { status: response.status, body: parsed };
  } catch {
    return null;
  }
}

function goOffline(): void {
  update({ sync: 'offline' });
  window.clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => void sync(), retryDelay);
  retryDelay = Math.min(RETRY_MAX_MS, retryDelay * 2);
}

const isDirty = () => base === null || !sameSave(getSnapshot().save, base);

/** Folds the backend's version into this device's, and remembers it as the new agreed version. */
function absorb(doc: RemoteDoc): void {
  const theirs = normalizeSave(doc.value);
  const mine = getSnapshot().save;
  const merged = mergeSaves(base ?? pristine(), mine, theirs);

  base = theirs;
  baseRev = doc.rev;
  if (!sameSave(merged, mine)) update({ save: merged });
  persist();
}

/** Points the store at an account: loads its cache and shows its board. */
function load(id: string, adoptLegacy: boolean): void {
  if (userId === id && snapshot?.gate === 'ready') return;
  userId = id;
  storageSet(LAST_USER, id);
  const cached = readCache(id, adoptLegacy);
  update({ save: cached.save, gate: 'ready', sync: 'connecting' });
}

/** Forgets the loaded account (signed out, or the session ended). */
function unload(gate: Gate): void {
  window.clearTimeout(pushTimer);
  window.clearTimeout(retryTimer);
  userId = null;
  base = null;
  baseRev = 0;
  connected = false;
  storageSet(LAST_USER, null);
  update({ save: pristine(), gate, sync: 'connecting' });
}

/** Reacts to whatever the account store now says. */
async function follow(): Promise<void> {
  const account = getAccountState();
  if (account.status === 'loading') return;

  if (account.status === 'offline') {
    // No server: keep playing on whatever this device already has.
    if (userId) update({ gate: 'ready' });
    else update({ gate: 'signin' });
    goOffline();
    return;
  }

  if (account.mode === 'open') {
    load('local', true);
  } else if (account.setupRequired) {
    unload('setup');
    return;
  } else if (!account.account) {
    unload('signin');
    return;
  } else {
    load(account.account.id, account.account.role === 'admin');
  }

  connected = true;
  await pull();
}

async function connect(): Promise<void> {
  await refreshAccount();
  await follow();
}

async function pull(): Promise<void> {
  if (!userId) return;
  const result = await request('GET', '/campaign');
  if (!result || result.status >= 500) return goOffline();
  if (result.status === 401) return void refreshAccount();

  const doc = result.body?.data as RemoteDoc | null | undefined;
  if (doc) {
    absorb(doc);
  } else {
    base = null;
    baseRev = 0;
  }

  retryDelay = RETRY_MIN_MS;
  if (isDirty()) await push();
  else update({ sync: 'synced' });
}

async function push(): Promise<void> {
  if (pushing || !userId || getSnapshot().gate !== 'ready') return;
  pushing = true;
  update({ sync: 'saving' });

  const sent = getSnapshot().save;
  const result = await request('PUT', '/campaign', { baseRev, save: sent });
  pushing = false;

  if (!result || result.status >= 500) return goOffline();
  if (result.status === 401) return void refreshAccount();

  if (result.status === 409) {
    // Another device saved first. Merge with what it wrote, then try again from there.
    const doc = result.body?.data as RemoteDoc | null | undefined;
    if (doc) {
      absorb(doc);
    } else {
      base = null;
      baseRev = 0;
    }
    return isDirty() ? push() : update({ sync: 'synced' });
  }

  if (result.status !== 200) return goOffline();

  base = sent;
  baseRev = (result.body?.data as { rev: number }).rev;
  retryDelay = RETRY_MIN_MS;
  persist();

  // Something changed while that request was in the air: send the newer version too.
  if (!sameSave(getSnapshot().save, sent)) return push();
  update({ sync: 'synced' });
}

async function sync(): Promise<void> {
  window.clearTimeout(retryTimer);
  if (!connected) return connect();
  if (getSnapshot().gate === 'ready') await pull();
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** The save as it stands right now, for use inside event handlers. */
export function peekSave(): ProtocolSave {
  return getSnapshot().save;
}

export function commitSave(next: ProtocolSave): void {
  update({ save: next, sync: connected ? 'saving' : getSnapshot().sync });
  persist();
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => void (connected ? push() : sync()), PUSH_DEBOUNCE_MS);
}

/** Starts a new campaign at week 1, on this device and on the backend. */
export function resetSave(): void {
  commitSave(pristine());
}

/**
 * Signs out after making sure the latest change reached the server, then
 * removes this account's copy from the device.
 */
export async function signOutOfCampaign(): Promise<void> {
  window.clearTimeout(pushTimer);
  if (userId && connected && isDirty()) await push();

  // Sign-out can happen on any page, including ones where this store never loaded the account.
  const id = userId ?? getAccountState().account?.id ?? null;
  if (id) {
    const synced = id === userId ? !isDirty() : cacheIsSynced(id);
    // Unsynced changes are kept, so they reach the server the next time this person signs in here.
    if (synced) storageSet(CACHE_PREFIX + id, null);
  }
  storageSet(LAST_USER, null);
  await signOut();
}

/** True when an account's cached save matches what the server last confirmed. */
function cacheIsSynced(id: string): boolean {
  try {
    const raw = storageGet(CACHE_PREFIX + id);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { save?: unknown; base?: unknown };
    return Boolean(parsed.base) && sameSave(normalizeSave(parsed.save), normalizeSave(parsed.base));
  } catch {
    return true;
  }
}

export function useCampaign(): CampaignSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const subscribeNever = () => () => {};
const getTodayIso = () => toIsoDate(new Date());
const getServerToday = () => null;

/** Today's local date, or null on the server and during hydration. */
export function useTodayIso(): string | null {
  return useSyncExternalStore(subscribeNever, getTodayIso, getServerToday);
}
