import { Inject, Injectable } from '@nestjs/common';
import { KEY_VALUE_STORE } from '../repositories/key-value.store.js';
import type { KeyValueStore, StoredDoc } from '../repositories/key-value.store.js';

const SAVE_KEY = 'save';
const MAX_SAVE_BYTES = 512 * 1024;

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

export type WriteResult =
  | { ok: true; doc: StoredDoc<CampaignSave> }
  | { ok: false; current: StoredDoc<CampaignSave> | null };

@Injectable()
export class CampaignService {
  constructor(@Inject(KEY_VALUE_STORE) private readonly store: KeyValueStore) {}

  get storage(): KeyValueStore['kind'] {
    return this.store.kind;
  }

  load(): Promise<StoredDoc<CampaignSave> | null> {
    return this.store.get<CampaignSave>(SAVE_KEY);
  }

  /**
   * Writes only if the client was looking at the latest revision. Otherwise it
   * hands back what is stored now, so the client can merge and try again
   * instead of silently overwriting another device.
   */
  async write(save: CampaignSave, baseRev: number): Promise<WriteResult> {
    const doc = await this.store.put(SAVE_KEY, save, baseRev);
    if (doc) return { ok: true, doc };
    return { ok: false, current: await this.load() };
  }
}
