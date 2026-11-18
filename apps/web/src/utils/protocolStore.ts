'use client';

import { useSyncExternalStore } from 'react';
import { BLUEPRINT_PLAN, BLUEPRINT_SPEC, BLUEPRINT_SPEC_V2 } from '../data/blueprintPlan';
import { getAccountState, refreshAccount, signOut, subscribeAccount } from './accountStore';
import { CampaignPlan, PlanSpec, PlanSpecV2, normalizeSpec, normalizeSpecV2, resolvePlan } from './campaignPlan';
import { HISTORY_LIMIT, HistoryPoint } from './campaignV3';
import { isV3Save, migrateSave } from './migrateSaveV2';
import { LogEntry, ProtocolSave, createInitialSave, mondayOf, toIsoDate } from './protocolEngine';
import { resolveExerciseId } from '../data/exerciseAliases';

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

/** What stands between the athlete and the board. `onboard`: a new account, choosing the campaign it starts with. */
export type Gate = 'loading' | 'signin' | 'setup' | 'onboard' | 'ready';
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
/** `outdated`: the account's plan was saved by a newer version of the app; reload before editing it. */
export type PlanSaveResult = 'saved' | 'offline' | 'conflict' | 'invalid' | 'outdated';

/** The plan format this version of the app reads and writes. */
const PLAN_VERSION = 3;
/** The server holds a plan from a newer app; it is left alone until this tab reloads. */
let planFromNewerApp = false;
/** The plan the account played before v3, while its save still needs converting. */
let v2PlanForSave: PlanSpecV2 | undefined;
/** The account's plan was read on this pull, so a save conversion knows what it was played on. */
let planRead = false;
/** A v2 plan converted on this pull: sent up once the converted save is. */
let convertedPlanPending = false;
/** This device had nothing for the account when it loaded: no save and no plan. */
let freshDevice = false;
/** The last plan read from the server was there (not an account that never saved one). */
let planFound = false;

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

  const skills: Record<string, string> = {};
  if (isRecord(raw.skills)) {
    for (const [stored, date] of Object.entries(raw.skills)) {
      if (typeof date !== 'string') continue;
      // Gym lifts moved into the calisthenics tree, and merged skills count for the one they became.
      const key = currentSkillKey(stored);
      if (!skills[key] || date < skills[key]) skills[key] = date;
    }
  }

  const numbers = (value: unknown): Record<string, number> =>
    isRecord(value)
      ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])))
      : {};
  const history: Record<string, HistoryPoint[]> = {};
  if (isRecord(raw.history)) {
    for (const [key, points] of Object.entries(raw.history)) {
      if (!Array.isArray(points)) continue;
      const kept = points.filter(
        (point): point is HistoryPoint =>
          Array.isArray(point) && typeof point[0] === 'string' && typeof point[1] === 'number' && Number.isFinite(point[1]),
      );
      if (kept.length) history[key] = kept.slice(-HISTORY_LIMIT);
    }
  }
  const badges: Record<string, string> = {};
  if (isRecord(raw.badges)) {
    for (const [id, date] of Object.entries(raw.badges)) if (typeof date === 'string') badges[id] = date;
  }

  return {
    // Fields a newer version of the app added ride along untouched, so this one never strips them.
    ...extrasOf(raw),
    // No version: a save from before v3, converted once the account's plan is known.
    ...(typeof raw.version === 'number' ? { version: raw.version } : {}),
    records: numbers(raw.records),
    history,
    badges,
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : fresh.startedAt,
    bodyWeightKg:
      typeof raw.bodyWeightKg === 'number' && Number.isFinite(raw.bodyWeightKg) ? raw.bodyWeightKg : fresh.bodyWeightKg,
    stats,
    loads: isRecord(raw.loads) ? (raw.loads as Record<string, number>) : {},
    milestones: isRecord(raw.milestones) ? (raw.milestones as Record<string, boolean>) : {},
    quests: isRecord(raw.quests) ? (raw.quests as Record<string, boolean>) : {},
    log: Array.isArray(raw.log) ? (raw.log as LogEntry[]) : [],
    skills,
  };
}

/** A stored mastery key as it reads today: `gym:x` and merged calisthenics ids become the calisthenics skill they are now. */
function currentSkillKey(stored: string): string {
  const [tree, ...rest] = stored.split(':');
  const id = rest.join(':');
  if (tree === 'gym' || tree === 'calisthenics') return `calisthenics:${resolveExerciseId(id)}`;
  return stored;
}

/** The save fields this version of the app knows how to read. */
const KNOWN_SAVE_FIELDS = new Set([
  'startedAt',
  'bodyWeightKg',
  'stats',
  'loads',
  'milestones',
  'quests',
  'log',
  'skills',
  'version',
  'records',
  'history',
  'badges',
]);

/** Everything in a stored save that this version does not read. */
function extrasOf(raw: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(raw).filter(([key]) => !KNOWN_SAVE_FIELDS.has(key)));
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

/** Logged numbers over time: every day either side logged, this device's number winning where it changed that day's. */
function mergeHistory(
  from: Record<string, HistoryPoint[]>,
  mine: Record<string, HistoryPoint[]>,
  theirs: Record<string, HistoryPoint[]>,
): Record<string, HistoryPoint[]> {
  const merged: Record<string, HistoryPoint[]> = {};
  for (const key of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    const before = new Map(from[key] ?? []);
    const mineDays = new Map(mine[key] ?? []);
    const days = new Map(theirs[key] ?? []);
    for (const [date, value] of mineDays) {
      if (!days.has(date) || !Object.is(value, before.get(date))) days.set(date, value);
    }
    merged[key] = [...days.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).slice(-HISTORY_LIMIT);
  }
  return merged;
}

const versionOf = (version: number | undefined) => (version === undefined ? {} : { version });

/**
 * Every badge either side has, with the earliest date — except one a side took
 * back (a corrected log, a recount) while the other side left it as it was.
 */
function mergeBadges(
  from: Record<string, string>,
  mine: Record<string, string>,
  theirs: Record<string, string>,
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const id of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    const [m, t, f] = [mine[id], theirs[id], from[id]];
    if (m === undefined && f !== undefined && t === f) continue;
    if (t === undefined && f !== undefined && m === f) continue;
    merged[id] = m === undefined ? t : t === undefined || m < t ? m : t;
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

  // A field this version cannot read: this device's copy wins only if this device changed it.
  const extras: Record<string, unknown> = {};
  const fromExtras = extrasOf(from as unknown as Record<string, unknown>);
  const mineExtras = extrasOf(mine as unknown as Record<string, unknown>);
  const theirExtras = extrasOf(theirs as unknown as Record<string, unknown>);
  for (const key of new Set([...Object.keys(mineExtras), ...Object.keys(theirExtras)])) {
    const value = canonical(mineExtras[key]) === canonical(fromExtras[key]) ? theirExtras[key] : mineExtras[key];
    if (value !== undefined) extras[key] = value;
  }

  return {
    ...extras,
    startedAt: mine.startedAt !== from.startedAt ? mine.startedAt : theirs.startedAt,
    bodyWeightKg: mine.bodyWeightKg !== from.bodyWeightKg ? mine.bodyWeightKg : theirs.bodyWeightKg,
    stats: mergeMap(from.stats, mine.stats, theirs.stats) as ProtocolSave['stats'],
    loads: mergeMap(from.loads, mine.loads, theirs.loads),
    milestones: mergeMap(from.milestones, mine.milestones, theirs.milestones),
    quests: mergeMap(from.quests, mine.quests, theirs.quests),
    log,
    skills: mergeMap(from.skills, mine.skills, theirs.skills),
    // A save converted on either side stays converted; a fresh one here does not hide an unconverted one there.
    ...versionOf(mine.version !== from.version ? mine.version : theirs.version),
    records: mergeMap(from.records, mine.records, theirs.records),
    history: mergeHistory(from.history, mine.history, theirs.history),
    badges: mergeBadges(from.badges, mine.badges, theirs.badges),
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
  const planCached = storageGet(PLAN_PREFIX + id) !== null;
  const plan = planState(readPlanCache(id));
  snapshot = { ...getSnapshot(), ...plan };
  const cached = readCache(id, adoptLegacy);
  freshDevice = !cached.existed && !planCached;
  // Nothing on this device yet: wait for the server rather than flash someone else's plan.
  update({ save: cached.save, ...plan, gate: freshDevice ? 'loading' : 'ready', sync: 'connecting' });
}

/** A board that was waiting for the server shows what this device has once the server cannot say more. */
function settleGate(): void {
  if (userId && getSnapshot().gate === 'loading') update({ gate: 'ready' });
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
  if (!result || result.status >= 500) {
    settleGate();
    return goOffline();
  }
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
  // A new account: no save and no plan anywhere. It picks a template before anything is saved.
  if (freshDevice && !doc && planRead && !planFound && !planDirty) {
    update({ gate: 'onboard', sync: 'synced' });
    return;
  }
  freshDevice = false;
  settleGate();
  upgradeSave();
  if (isDirty()) await push();
  else update({ sync: 'synced' });
  // The converted plan goes up after the converted save, which carries a copy of the old one.
  if (convertedPlanPending) {
    convertedPlanPending = false;
    await pushPlan(false);
  }
}

/** Follows the plan saved on the server, or sends this device's unsaved one up. */
async function pullPlan(): Promise<void> {
  if (!userId) return;
  planRead = false;
  const result = await request('GET', '/campaign/plan');
  // The save sync owns the offline badge; a plan that cannot be fetched just stays as it is.
  if (!result || result.status !== 200) return;
  planRead = true;

  const doc = result.body?.data as RemoteDoc | null | undefined;
  planFound = Boolean(doc);
  if (planDirty) {
    // A plan saved here while offline: it was saved on purpose, so it replaces the server's.
    planRev = doc?.rev ?? 0;
    await pushPlan(false);
    return;
  }

  planRev = doc?.rev ?? 0;
  // A plan written by a newer version of the app: this one cannot read it, so it keeps
  // showing what it has and never saves over it. Reloading picks up the newer app.
  planFromNewerApp = isRecord(doc?.value) && typeof doc.value.version === 'number' && doc.value.version > PLAN_VERSION;
  if (planFromNewerApp) return;

  // A plan from before v3 is converted here, once, and saved back so every device reads the same one.
  const fromV2 = isRecord(doc?.value) && doc.value.version === 2;
  v2PlanForSave = !doc ? BLUEPRINT_SPEC_V2 : fromV2 ? normalizeSpecV2(doc.value, BLUEPRINT_SPEC_V2) : undefined;
  const spec = doc ? toSpec(doc.value) : BLUEPRINT_SPEC;
  if (canonical(spec) !== canonical(getSnapshot().spec)) update(planState(spec));
  if (fromV2) {
    planDirty = true;
    convertedPlanPending = true;
  }
  persistPlan();
}

/**
 * A save from before v3 gains its records, history and badges, once, from
 * the plan it was played on. The v2 fields stay as they were.
 */
function upgradeSave(): void {
  const current = getSnapshot().save;
  if (!planRead || planFromNewerApp || isV3Save(current)) return;
  const { save } = migrateSave(current, { days: getSnapshot().plan.days, trees: v2PlanForSave?.trees }, toIsoDate(new Date()), v2PlanForSave);
  // A copy of the account's own v2 plan rides in the save (as a field this app never reads), so it can be restored.
  const own = v2PlanForSave && v2PlanForSave !== BLUEPRINT_SPEC_V2 ? { planBeforeV3: v2PlanForSave } : {};
  update({ save: { ...save, ...own } });
  persist();
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

/* ------------------------------------------------------------------ */
/* Skill-tree mastery, kept in the save so it follows the account      */
/* ------------------------------------------------------------------ */

/** The save's key for a skill. Calisthenics ids merged in the rebuild count for the skill they became. */
const skillKey = (tree: string, id: string) => `${tree}:${tree === 'calisthenics' ? resolveExerciseId(id) : id}`;

const skillsCache = new Map<string, { save: ProtocolSave; ids: readonly string[] }>();

/** An account's save is in hand (cached or fetched), so mastery reads and writes go to it. */
const accountLoaded = () => Boolean(userId) && getSnapshot().gate === 'ready';

/** One tree's mastered skills from the account's save; null while no account is loaded. Stable between changes. */
export function syncedSkills(tree: string): readonly string[] | null {
  if (!accountLoaded()) return null;
  const { save } = getSnapshot();
  const hit = skillsCache.get(tree);
  if (hit && hit.save === save) return hit.ids;
  const prefix = `${tree}:`;
  const ids = Object.freeze(Object.keys(save.skills ?? {}).filter((key) => key.startsWith(prefix)).map((key) => key.slice(prefix.length)));
  skillsCache.set(tree, { save, ids });
  return ids;
}

/**
 * Sets one tree's mastered skills in the account's save, keeping the date each
 * skill was first mastered. False when no account is loaded.
 */
export function setSyncedSkills(tree: string, ids: readonly string[]): boolean {
  if (!accountLoaded()) return false;
  const save = getSnapshot().save;
  const today = toIsoDate(new Date());
  const prefix = `${tree}:`;
  const next: Record<string, string> = {};
  for (const [key, date] of Object.entries(save.skills ?? {})) if (!key.startsWith(prefix)) next[key] = date;
  for (const id of ids) {
    const key = skillKey(tree, id);
    next[key] = save.skills?.[key] ?? today;
  }
  commitSave({ ...save, skills: next });
  return true;
}

/**
 * Brings skills mastered on this device before mastery was synced into the
 * account's save. Adds only; returns how many were added.
 */
export function adoptDeviceSkills(tree: string, deviceIds: readonly string[]): number {
  if (!accountLoaded() || deviceIds.length === 0) return 0;
  const save = getSnapshot().save;
  const today = toIsoDate(new Date());
  const next = { ...(save.skills ?? {}) };
  let added = 0;
  for (const id of deviceIds) {
    const key = skillKey(tree, id);
    if (!next[key]) {
      next[key] = today;
      added += 1;
    }
  }
  if (added) commitSave({ ...save, skills: next });
  return added;
}

/** Whose campaign is loaded, once it is; null before. */
export function campaignUserId(): string | null {
  return accountLoaded() ? userId : null;
}

/** Calls the listener whenever the campaign (save, plan or sign-in) changes. */
export const subscribeToCampaign = (listener: () => void): (() => void) => subscribe(listener);

/**
 * Saves the account's plan: on this device straight away, then on the server.
 * With `overwrite`, a plan saved meanwhile on another device is replaced.
 */
export async function savePlan(next: PlanSpec, options: { overwrite?: boolean } = {}): Promise<PlanSaveResult> {
  if (planFromNewerApp) return 'outdated';
  planDirty = true;
  planConflict = null;
  update(planState(toSpec(next)));
  persistPlan();
  if (!connected || !userId) return 'offline';
  return pushPlan(Boolean(options.overwrite));
}

/**
 * A new account starts its campaign: the plan it picked (a template, or a
 * blank one to build in the Forge) and a fresh save at week 1, saved on this
 * device and then on the server.
 */
export async function startCampaign(next: PlanSpec, bodyWeightKg: number): Promise<void> {
  if (!userId) return;
  freshDevice = false;
  planDirty = true;
  planConflict = null;
  const plan = planState(toSpec(next));
  snapshot = { ...getSnapshot(), ...plan };
  const save: ProtocolSave = { ...createInitialSave(plan.plan), startedAt: mondayOf(toIsoDate(new Date())), bodyWeightKg };
  update({ ...plan, save, gate: 'ready', sync: connected ? 'saving' : getSnapshot().sync });
  persist();
  persistPlan();
  if (!connected) return;
  await pushPlan(false);
  await push();
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
