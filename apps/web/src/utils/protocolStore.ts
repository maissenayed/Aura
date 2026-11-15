'use client';

import { useSyncExternalStore } from 'react';
import { BLUEPRINT_PLAN, BLUEPRINT_SPEC } from '../data/blueprintPlan';
import { getAccountState, refreshAccount, signOut, subscribeAccount } from './accountStore';
import { CampaignPlan, PlanSpec, normalizeSpec, resolvePlan } from './campaignPlan';
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
 * The account's plan — its choices from the catalog: routine, lifts, bosses,
 * skill trees and map — is kept the same way but changes far less often, and
 * only when the player presses Save in the plan editor. It is sent whole; if
 * another device saved a different plan in the meantime, the editor asks
 * which one to keep. The full plan every tab reads is built from it here.
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
const PLAN_PREFIX = 'aura_plan_v2:';

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
  /** The plan as chosen and stored. */
  spec: PlanSpec;
  /** The same plan, built out from the catalog, as the game reads it. */
  plan: CampaignPlan;
  gate: Gate;
  sync: SyncStatus;
}

/** How saving the plan went. */
export type PlanSaveResult = 'saved' | 'offline' | 'conflict' | 'invalid';

interface RemoteDoc {
  rev: number;
  value: unknown;
}

/* ------------------------------------------------------------------ */
/* Module state                                                        */
/* ------------------------------------------------------------------ */

const SERVER_SNAPSHOT: CampaignSnapshot = {
  save: createInitialSave(),
  spec: BLUEPRINT_SPEC,
  plan: BLUEPRINT_PLAN,
  gate: 'loading',
  sync: 'connecting',
};

let snapshot: CampaignSnapshot | null = null;
/** Whose save is loaded. Null until an account is known. */
let userId: string | null = null;
/** The last version this device and the backend agreed on, and its revision. */
let base: ProtocolSave | null = null;
let baseRev = 0;
/** The plan revision this device last saw, whether the plan has changes not yet on the server, and a rival plan from another device. */
let planRev = 0;
let planDirty = false;
let planConflict: { spec: PlanSpec; rev: number } | null = null;

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
  return { ...createInitialSave(snapshot?.plan ?? BLUEPRINT_PLAN), startedAt: mondayOf(toIsoDate(new Date())) };
}

const toSpec = (raw: unknown) => normalizeSpec(raw, BLUEPRINT_SPEC);

/** A plan as both halves of the snapshot carry it. */
const planState = (spec: PlanSpec) => ({ spec, plan: spec === BLUEPRINT_SPEC ? BLUEPRINT_PLAN : resolvePlan(spec) });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Lays whatever was stored over a fresh save, so an older or partial save still loads whole. */
function normalizeSave(raw: unknown): ProtocolSave {
  const fresh = pristine();
  if (!isRecord(raw)) return fresh;

  // Every logged number is kept, including lifts the current plan no longer has.
  const stats: Record<string, number> = {};
  if (isRecord(raw.stats)) {
    for (const [id, saved] of Object.entries(raw.stats)) {
      if (typeof saved === 'number' && Number.isFinite(saved)) stats[id] = saved;
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

/** Loads one account's cached plan, or the blueprint when it has none yet. */
function readPlanCache(id: string): PlanSpec {
  planRev = 0;
  planDirty = false;
  planConflict = null;
  try {
    const raw = storageGet(PLAN_PREFIX + id);
    if (raw) {
      const parsed = JSON.parse(raw) as { plan?: unknown; rev?: unknown; dirty?: unknown };
      planRev = typeof parsed.rev === 'number' ? parsed.rev : 0;
      planDirty = parsed.dirty === true;
      return toSpec(parsed.plan);
    }
  } catch (error) {
    console.error('Could not read the campaign plan on this device, using the blueprint:', error);
  }
  return BLUEPRINT_SPEC;
}

function persistPlan(): void {
  if (!snapshot || !userId) return;
  storageSet(PLAN_PREFIX + userId, JSON.stringify({ plan: snapshot.spec, rev: planRev, dirty: planDirty }));
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
      const plan = planState(readPlanCache(last));
      const cached = readCache(last, false);
      snapshot = { save: cached.save, ...plan, gate: cached.existed ? 'ready' : 'loading', sync: 'connecting' };
    } else {
      snapshot = { save: pristine(), ...planState(BLUEPRINT_SPEC), gate: 'loading', sync: 'connecting' };
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
      if (!userId) return;
      if (event.key === CACHE_PREFIX + userId) update({ save: readCache(userId, false).save });
      if (event.key === PLAN_PREFIX + userId) update(planState(readPlanCache(userId)));
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
  const plan = planState(readPlanCache(id));
  snapshot = { ...getSnapshot(), ...plan };
  const cached = readCache(id, adoptLegacy);
  update({ save: cached.save, ...plan, gate: 'ready', sync: 'connecting' });
}

/** Forgets the loaded account (signed out, or the session ended). */
function unload(gate: Gate): void {
  window.clearTimeout(pushTimer);
  window.clearTimeout(retryTimer);
  userId = null;
  base = null;
  baseRev = 0;
  planRev = 0;
  planDirty = false;
  planConflict = null;
  connected = false;
  storageSet(LAST_USER, null);
  snapshot = { ...getSnapshot(), ...planState(BLUEPRINT_SPEC) };
  update({ save: pristine(), ...planState(BLUEPRINT_SPEC), gate, sync: 'connecting' });
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
  await pullPlan();
  if (isDirty()) await push();
  else update({ sync: 'synced' });
}

/** Follows the plan saved on the server, or sends this device's unsaved one up. */
async function pullPlan(): Promise<void> {
  if (!userId) return;
  const result = await request('GET', '/campaign/plan');
  // The save sync owns the offline badge; a plan that cannot be fetched just stays as it is.
  if (!result || result.status !== 200) return;

  const doc = result.body?.data as RemoteDoc | null | undefined;
  if (planDirty) {
    // A plan saved here while offline: it was saved on purpose, so it replaces the server's.
    planRev = doc?.rev ?? 0;
    await pushPlan(false);
    return;
  }

  const spec = doc ? toSpec(doc.value) : BLUEPRINT_SPEC;
  planRev = doc?.rev ?? 0;
  if (canonical(spec) !== canonical(getSnapshot().spec)) update(planState(spec));
  persistPlan();
}

async function pushPlan(overwrite: boolean): Promise<PlanSaveResult> {
  if (!userId) return 'offline';
  const sent = getSnapshot().spec;
  const result = await request('PUT', '/campaign/plan', { baseRev: planRev, plan: sent });

  if (!result || result.status >= 500) return 'offline';
  if (result.status === 401) {
    void refreshAccount();
    return 'offline';
  }
  if (result.status === 409) {
    const doc = result.body?.data as RemoteDoc | null | undefined;
    const rev = doc?.rev ?? 0;
    if (overwrite) {
      planRev = rev;
      return pushPlan(false);
    }
    planConflict = { spec: doc ? toSpec(doc.value) : BLUEPRINT_SPEC, rev };
    return 'conflict';
  }
  if (result.status !== 200) return 'invalid';

  planRev = (result.body?.data as { rev: number }).rev;
  planConflict = null;
  // Only clean if nothing newer was saved while that request was in the air.
  if (getSnapshot().spec === sent) planDirty = false;
  persistPlan();
  return 'saved';
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

/**
 * Saves the account's plan: on this device straight away, then on the server.
 * With `overwrite`, a plan saved meanwhile on another device is replaced.
 */
export async function savePlan(next: PlanSpec, options: { overwrite?: boolean } = {}): Promise<PlanSaveResult> {
  planDirty = true;
  planConflict = null;
  update(planState(toSpec(next)));
  persistPlan();
  if (!connected || !userId) return 'offline';
  return pushPlan(Boolean(options.overwrite));
}

/** After a conflict: the plan the other device saved. */
export function conflictingPlan(): PlanSpec | null {
  return planConflict?.spec ?? null;
}

/** After a conflict: drop this device's plan and use the other device's. */
export function takeServerPlan(): void {
  if (!planConflict) return;
  planRev = planConflict.rev;
  planDirty = false;
  update(planState(planConflict.spec));
  planConflict = null;
  persistPlan();
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
  if (userId && connected && planDirty) await pushPlan(true);

  // Sign-out can happen on any page, including ones where this store never loaded the account.
  const id = userId ?? getAccountState().account?.id ?? null;
  if (id) {
    const synced = id === userId ? !isDirty() : cacheIsSynced(id);
    // Unsynced changes are kept, so they reach the server the next time this person signs in here.
    if (synced) storageSet(CACHE_PREFIX + id, null);
    if (!(id === userId ? planDirty : planCacheDirty(id))) storageSet(PLAN_PREFIX + id, null);
  }
  storageSet(LAST_USER, null);
  await signOut();
}

function planCacheDirty(id: string): boolean {
  try {
    const raw = storageGet(PLAN_PREFIX + id);
    return raw ? (JSON.parse(raw) as { dirty?: unknown }).dirty === true : false;
  } catch {
    return false;
  }
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
