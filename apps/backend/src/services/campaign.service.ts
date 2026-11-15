import { Inject, Injectable } from '@nestjs/common';
import { KEY_VALUE_STORE } from '../repositories/key-value.store.js';
import type { KeyValueStore, StoredDoc } from '../repositories/key-value.store.js';

const MAX_SAVE_BYTES = 512 * 1024;
const MAX_PLAN_BYTES = 256 * 1024;

/**
 * The campaign save as the web app writes it. The backend stores it whole and
 * only checks its outline — the game rules live in the client.
 */
export interface CampaignSave {
  startedAt: string | null;
  bodyWeightKg: number;
  stats: Record<string, number>;
  loads: Record<string, number>;
  milestones: Record<string, boolean>;
  quests: Record<string, boolean>;
  log: unknown[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function isCampaignSave(value: unknown): value is CampaignSave {
  if (!isRecord(value)) return false;
  return (
    (value.startedAt === null || typeof value.startedAt === 'string') &&
    typeof value.bodyWeightKg === 'number' &&
    Number.isFinite(value.bodyWeightKg) &&
    isRecord(value.stats) &&
    isRecord(value.loads) &&
    isRecord(value.milestones) &&
    isRecord(value.quests) &&
    Array.isArray(value.log) &&
    JSON.stringify(value).length <= MAX_SAVE_BYTES
  );
}

/**
 * The player's plan: their choices from the web app's catalog — weekly
 * routine, lifts, bosses, skill trees, armor and campaign map. Like the save,
 * it is stored whole and only its outline is checked here; the web app checks
 * every id against the catalog when it loads one.
 */
export interface CampaignPlan {
  version: 2;
  name: string;
  bodyweight: Record<string, unknown>;
  lifts: unknown[];
  days: unknown[];
  armor: unknown[];
  bosses: unknown[];
  trees: unknown[];
  acts: unknown[];
}

export function isCampaignPlan(value: unknown): value is CampaignPlan {
  if (!isRecord(value)) return false;
  return (
    value.version === 2 &&
    typeof value.name === 'string' &&
    isRecord(value.bodyweight) &&
    ['lifts', 'days', 'armor', 'bosses', 'trees', 'acts'].every((key) => Array.isArray(value[key])) &&
    (value.days as unknown[]).length === 7 &&
    JSON.stringify(value).length <= MAX_PLAN_BYTES
  );
}

export type WriteResult<T = CampaignSave> =
  | { ok: true; doc: StoredDoc<T> }
  | { ok: false; current: StoredDoc<T> | null };

/** The single save from before accounts existed; also the save of the one local athlete. */
const LEGACY_KEY = 'save';
const keyFor = (userId: string) => (userId === 'local' ? LEGACY_KEY : `save:${userId}`);
export const planKeyFor = (userId: string) => (userId === 'local' ? 'plan' : `plan:${userId}`);

@Injectable()
export class CampaignService {
  constructor(@Inject(KEY_VALUE_STORE) private readonly store: KeyValueStore) {}

  get storage(): KeyValueStore['kind'] {
    return this.store.kind;
  }

  load(userId: string): Promise<StoredDoc<CampaignSave> | null> {
    return this.store.get<CampaignSave>(keyFor(userId));
  }

  /**
   * Writes only if the client was looking at the latest revision. Otherwise it
   * hands back what is stored now, so the client can merge and try again
   * instead of silently overwriting another device.
   */
  async write(userId: string, save: CampaignSave, baseRev: number): Promise<WriteResult> {
    const doc = await this.store.put(keyFor(userId), save, baseRev);
    if (doc) return { ok: true, doc };
    return { ok: false, current: await this.load(userId) };
  }

  loadPlan(userId: string): Promise<StoredDoc<CampaignPlan> | null> {
    return this.store.get<CampaignPlan>(planKeyFor(userId));
  }

  /** Same compare-and-swap as the save: a stale device gets the current plan back instead of overwriting it. */
  async writePlan(userId: string, plan: CampaignPlan, baseRev: number): Promise<WriteResult<CampaignPlan>> {
    const doc = await this.store.put(planKeyFor(userId), plan, baseRev);
    if (doc) return { ok: true, doc };
    return { ok: false, current: await this.loadPlan(userId) };
  }
}
