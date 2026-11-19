import type { PropChanges } from '../game/propTuning';
import type { FigurePatch } from '../skilltree/figureOverrides';
import type { FigureSource } from './sources';

/**
 * The studio's unsaved work, kept in this browser so a reload loses nothing,
 * and the calls that write saved work into the repo on a dev server.
 */

export interface Drafts {
  /** Figure id → its edited fix; null takes a saved fix away. */
  figures: Record<string, FigurePatch | null>;
  /** The props tuning being worked on, when it differs from what is saved. */
  props: PropChanges | null;
}

export const NO_DRAFTS: Drafts = { figures: {}, props: null };

const KEY = 'aura.studio.drafts.v1';

export function loadDrafts(): Drafts {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return NO_DRAFTS;
    const parsed = JSON.parse(raw) as Partial<Drafts>;
    return { figures: parsed.figures ?? {}, props: parsed.props ?? null };
  } catch {
    return NO_DRAFTS;
  }
}

export function storeDrafts(drafts: Drafts) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(drafts));
  } catch {
    // A private window: drafts last until the tab closes.
  }
}

export const draftCount = (drafts: Drafts) => Object.keys(drafts.figures).length + (drafts.props ? 1 : 0);

export async function saveToRepo(drafts: Drafts): Promise<{ figures: Record<string, FigurePatch>; props: PropChanges }> {
  const response = await fetch('/studio/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ figures: drafts.figures, ...(drafts.props ? { props: drafts.props } : {}) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Saving failed (${response.status}).`);
  return data;
}

export async function fetchSources(): Promise<Record<string, FigureSource> | null> {
  try {
    const response = await fetch('/studio/source', { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()).sources;
  } catch {
    return null;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
