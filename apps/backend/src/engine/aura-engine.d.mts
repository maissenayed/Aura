/**
 * Types for dist/engine/aura-engine.mjs, the web app's engine bundled by
 * scripts/build-engine.mjs. The source of truth is apps/web/src/utils/serverEngine.ts.
 */

/** A save or plan as the engine reads it; the backend passes them through untouched. */
export type EngineSave = { startedAt: string | null; [field: string]: unknown };
export type EnginePlan = { [field: string]: unknown };
export type Seen = Record<string, string>;

export function asSave(raw: unknown): EngineSave;
export function planOf(raw: unknown): EnginePlan;
export function stampSeen(next: unknown, seen: Seen | null, today: string): Seen;
export function witnessed(raw: unknown, seen: Seen): EngineSave;

export interface CrewWeek {
  monday: string;
  xp: number;
  prs: number;
  sessions: number;
  completion: number;
  activeDays: number;
}
export function crewWeek(save: EngineSave, plan: EnginePlan, monday: string, today: string): CrewWeek;
export function improvementOf(save: EngineSave, plan: EnginePlan, monday: string, today: string): number | null;
export function duelDay(save: EngineSave, plan: EnginePlan, date: string): number;

export interface PlayerCard {
  level: number;
  rank: string;
  signature: string | null;
  signatureName: string | null;
  gear: Record<string, string>;
  shape: { id: string; short: string; share: number | null }[];
}
export function cardOf(save: EngineSave, plan: EnginePlan, today: string): PlayerCard;

export interface FeedItem {
  id: string;
  date: string;
  kind: string;
  title: string;
  detail: string;
}
export function feedOf(raw: unknown, showNumbers: boolean, since: string): FeedItem[];
export function regularsOf(save: EngineSave, plan: EnginePlan, today: string): Record<string, number>;
export function addDays(iso: string, days: number): string;
export function mondayOfDate(iso: string): string;
