'use client';

import { useSyncExternalStore } from 'react';
import { IRON_STATS } from '../data/protocolData';
import { LogEntry, ProtocolSave, createInitialSave, mondayOf, toIsoDate } from './protocolEngine';

/**
 * The campaign save, kept in step with the backend.
 *
 * Every change lands in localStorage first, so the game never waits on the
 * network and keeps working offline. A copy is then pushed to the backend,
 * which only accepts it if this device was looking at the latest revision. If
 * another device got there first, the two versions are merged field by field
 * and pushed again — nothing ticked on one device is lost to the other.
 *
 * It is read through `useSyncExternalStore`, so the server render and the
 * first client render agree and the real save swaps in after hydration.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const CACHE_KEY = 'aura_hybrid_engine_v2';
const LEGACY_KEY = 'aura_hybrid_engine_v1';
const PASSCODE_KEY = 'aura_hybrid_engine_passcode';
const PASSCODE_HEADER = 'x-campaign-passcode';

const PUSH_DEBOUNCE_MS = 700;
const RETRY_MIN_MS = 5_000;
const RETRY_MAX_MS = 60_000;
const REQUEST_TIMEOUT_MS = 12_000;
const LOG_LIMIT = 40;

/** What stands between the player and the board. */
export type Gate = 'loading' | 'claim' | 'locked' | 'ready';
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
/* Local cache                                                         */
/* ------------------------------------------------------------------ */

function readCache(): { save: ProtocolSave; existed: boolean } {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { save?: unknown; base?: unknown; baseRev?: unknown };
      base = parsed.base ? normalizeSave(parsed.base) : null;
      baseRev = typeof parsed.baseRev === 'number' ? parsed.baseRev : 0;
      return { save: normalizeSave(parsed.save), existed: true };
    }

    // A save from before the backend existed: keep it, and let the first sync upload it.
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) return { save: normalizeSave(JSON.parse(legacy)), existed: true };
  } catch (error) {
    console.error('Could not read the campaign save on this device, starting fresh:', error);
  }
  return { save: pristine(), existed: false };
}

function persist(): void {
  if (!snapshot) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ save: snapshot.save, base, baseRev }));
  } catch (error) {
    console.error('Could not write the campaign save on this device:', error);
  }
}

function readPasscode(): string | null {
  try {
    return window.localStorage.getItem(PASSCODE_KEY);
  } catch {
    return null;
  }
}

function storePasscode(passcode: string | null): void {
  try {
    if (passcode === null) window.localStorage.removeItem(PASSCODE_KEY);
    else window.localStorage.setItem(PASSCODE_KEY, passcode);
  } catch (error) {
    console.error('Could not remember the passcode on this device:', error);
  }
}

/* ------------------------------------------------------------------ */
/* Store plumbing                                                      */
/* ------------------------------------------------------------------ */

function getSnapshot(): CampaignSnapshot {
  if (!snapshot) {
    const cached = readCache();
    // A device that has played before shows its board straight away and syncs behind it.
    snapshot = { save: cached.save, gate: cached.existed ? 'ready' : 'loading', sync: 'connecting' };
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
      if (event.key !== CACHE_KEY) return;
      update({ save: readCache().save });
    });
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
async function api(method: string, path: string, body?: unknown): Promise<ApiResult | null> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  const passcode = readPasscode();
  if (passcode) headers[PASSCODE_HEADER] = encodeURIComponent(passcode);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
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

function lock(): void {
  storePasscode(null);
  update({ gate: 'locked' });
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

/** First contact: find out whether the board is open, locked, or still unclaimed. */
async function connect(): Promise<void> {
  const result = await api('GET', '/campaign/status');
  const status = result?.status === 200 ? (result.body?.data as { protection?: string; claimed?: boolean }) : null;

  if (!status) {
    // No backend right now. The campaign is still playable from this device; keep trying.
    update({ gate: 'ready' });
    goOffline();
    return;
  }

  connected = true;
  if (status.protection === 'passcode') {
    if (!status.claimed) return update({ gate: 'claim' });
    if (!readPasscode()) return update({ gate: 'locked' });
  }

  update({ gate: 'ready' });
  await pull();
}

async function pull(): Promise<void> {
  const result = await api('GET', '/campaign');
  if (!result || result.status >= 500) return goOffline();
  if (result.status === 401) return lock();
  if (result.status === 403) return update({ gate: 'claim' });

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
  if (pushing || getSnapshot().gate !== 'ready') return;
  pushing = true;
  update({ sync: 'saving' });

  const sent = getSnapshot().save;
  const result = await api('PUT', '/campaign', { baseRev, save: sent });
  pushing = false;

  if (!result || result.status >= 500) return goOffline();
  if (result.status === 401) return lock();
  if (result.status === 403) return update({ gate: 'claim' });

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

/** Sets the campaign's passcode. Resolves to an error message, or null on success. */
export async function claimCampaign(passcode: string): Promise<string | null> {
  const result = await api('POST', '/campaign/claim', { passcode });
  if (!result) return 'Could not reach the server. Check your connection and try again.';
  if (result.status === 409) {
    update({ gate: 'locked' });
    return 'A passcode was already set from another device. Enter it to continue.';
  }
  if (result.status !== 201) return result.body?.message ?? 'That passcode was not accepted.';

  storePasscode(passcode);
  update({ gate: 'ready' });
  void pull();
  return null;
}

/** Unlocks this device. Resolves to an error message, or null on success. */
export async function unlockCampaign(passcode: string): Promise<string | null> {
  const result = await api('POST', '/campaign/unlock', { passcode });
  if (!result) return 'Could not reach the server. Check your connection and try again.';
  if (result.status !== 200) return result.body?.message ?? 'Wrong passcode.';

  storePasscode(passcode);
  update({ gate: 'ready' });
  void pull();
  return null;
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
