import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { RawExercise, Swimlane } from '@aura/types';
import { BUILT_IN_EXERCISES, setExerciseList } from '../engine/aura-engine.mjs';
import { ExerciseList, ExerciseStore, createExerciseStore } from '../repositories/exercise.store.js';

/**
 * The exercise list. The `exercise` table is the one copy everybody reads:
 * the web app loads it, the owner edits it on the Exercises page, and the
 * server's engine (crew numbers, cards) runs on it. When the table is empty —
 * a new database, or one that was wiped — it is filled from the built-in list
 * the app ships with, and the owner can restore that list at any time.
 */
@Injectable()
export class ExercisesService {
  private readonly store: ExerciseStore = createExerciseStore();
  private cached: ExerciseList | null = null;
  private engineSynced = { version: '', at: 0 };
  private syncing: Promise<void> | null = null;

  /** The list, filled from the built-in one first if the store is empty. */
  async current(): Promise<ExerciseList> {
    let version = await this.store.version();
    if (version === null) {
      await this.store.seedIfEmpty(BUILT_IN_EXERCISES);
      version = await this.store.version();
    }
    if (!this.cached || this.cached.version !== version) this.cached = await this.store.list();
    return this.cached;
  }

  /** The list unless the caller's copy is already this version. */
  async since(version: string | undefined): Promise<{ version: string; exercises: RawExercise[] | null }> {
    const list = await this.current();
    return { version: list.version, exercises: list.version === version ? null : list.exercises };
  }

  /**
   * Hands the list to the server's engine before it works anything out. A
   * busy request runs many engine calls; one check every few seconds is plenty.
   */
  syncEngine(): Promise<void> {
    if (Date.now() - this.engineSynced.at < 3_000) return Promise.resolve();
    this.syncing ??= (async () => {
      try {
        const list = await this.current();
        if (list.version !== this.engineSynced.version) setExerciseList(list.exercises, list.version);
        this.engineSynced = { version: list.version, at: Date.now() };
      } finally {
        this.syncing = null;
      }
    })();
    return this.syncing;
  }

  async create(input: unknown): Promise<ExerciseList> {
    const { exercises } = await this.current();
    const exercise = cleanExercise(input, exercises, null);
    if (exercises.some((entry) => entry.id === exercise.id)) {
      throw new ConflictException({ success: false, message: `An exercise with the id ${exercise.id} already exists.` });
    }
    await this.store.upsert(exercise);
    return this.afterWrite();
  }

  async update(id: string, input: unknown): Promise<ExerciseList> {
    const { exercises } = await this.current();
    if (!exercises.some((entry) => entry.id === id)) throw new NotFoundException({ success: false, message: `No exercise has the id ${id}.` });
    await this.store.upsert(cleanExercise(input, exercises, id));
    return this.afterWrite();
  }

  async remove(id: string): Promise<ExerciseList> {
    const { exercises } = await this.current();
    if (!exercises.some((entry) => entry.id === id)) throw new NotFoundException({ success: false, message: `No exercise has the id ${id}.` });
    await this.store.remove(id);
    return this.afterWrite();
  }

  /** Puts the built-in list back, replacing every change made since. */
  async restoreBuiltIn(): Promise<ExerciseList> {
    await this.store.replaceAll(BUILT_IN_EXERCISES);
    return this.afterWrite();
  }

  private async afterWrite(): Promise<ExerciseList> {
    this.engineSynced = { version: '', at: 0 };
    return this.current();
  }
}

/* ------------------------------------------------------------------ */
/* Checking what the admin page sends                                  */
/* ------------------------------------------------------------------ */

const SWIMLANES: Swimlane[] = ['Push', 'Pull', 'Core', 'Legs'];
const ID = /^[a-z0-9][a-z0-9_-]{1,63}$/;

const bad = (message: string) => new BadRequestException({ success: false, message });

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function text(value: unknown, field: string, { required = false, max = 2000 } = {}): string | undefined {
  if (value === undefined || value === null) {
    if (required) throw bad(`${field} is required.`);
    return undefined;
  }
  if (typeof value !== 'string') throw bad(`${field} must be text.`);
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) throw bad(`${field} is required.`);
    return undefined;
  }
  if (trimmed.length > max) throw bad(`${field} is longer than ${max} characters.`);
  return trimmed;
}

function lines(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw bad(`${field} must be a list.`);
  const list = value.map((entry) => text(entry, field, { max: 600 })).filter((entry): entry is string => Boolean(entry));
  return list.length ? list : undefined;
}

/** Would `id` needing `prerequisites` make a loop (something that, through its own needs, needs `id`)? */
function makesLoop(id: string, prerequisites: string[], byId: Map<string, RawExercise>): boolean {
  const seen = new Set<string>();
  const stack = [...prerequisites];
  while (stack.length) {
    const next = stack.pop()!;
    if (next === id) return true;
    if (seen.has(next)) continue;
    seen.add(next);
    stack.push(...(byId.get(next)?.prerequisites ?? []));
  }
  return false;
}

/**
 * An exercise as it may be stored: known fields only, text trimmed, empty
 * fields left out, and prerequisites that exist and don't loop. `existingId`
 * is the exercise being edited (its id can't change: saves and plans point
 * at it), or null for a new one.
 */
function cleanExercise(input: unknown, list: RawExercise[], existingId: string | null): RawExercise {
  if (!isRecord(input)) throw bad('Send the exercise as an object.');
  const id = existingId ?? text(input.id, 'Id', { required: true, max: 64 })!;
  if (!existingId && !ID.test(id)) throw bad('An id is 2–64 lowercase letters, digits, - or _, starting with a letter or digit.');

  const level = Number(input.level);
  if (!Number.isInteger(level) || level < 1 || level > 20) throw bad('Level is a whole number from 1 to 20.');

  const byId = new Map(list.map((entry) => [entry.id, entry]));
  const prerequisites = input.prerequisites === undefined ? [] : input.prerequisites;
  if (!Array.isArray(prerequisites) || prerequisites.some((entry) => typeof entry !== 'string')) throw bad('Prerequisites must be a list of exercise ids.');
  const needs = [...new Set(prerequisites as string[])];
  for (const need of needs) {
    if (need === id) throw bad('An exercise cannot need itself.');
    if (!byId.has(need)) throw bad(`Prerequisite ${need} is not in the list.`);
  }
  if (makesLoop(id, needs, byId)) throw bad('Those prerequisites make a loop: one of them already needs this exercise.');

  const swimlane = input.swimlane === undefined || input.swimlane === null || input.swimlane === '' ? undefined : input.swimlane;
  if (swimlane !== undefined && !SWIMLANES.includes(swimlane as Swimlane)) throw bad('Lane is Push, Pull, Core or Legs.');
  const discipline = input.discipline === 'gym' ? 'gym' : undefined;

  const videoSearchUrl = text(input.videoSearchUrl, 'Video link', { max: 500 });
  if (videoSearchUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(videoSearchUrl)) throw bad('The video link must be a YouTube address.');

  const muscles = lines(input.muscles, 'Muscles');
  const exercise: RawExercise = {
    id,
    name: text(input.name, 'Name', { required: true, max: 120 })!,
    level,
    category: text(input.category, 'Category', { required: true, max: 80 })!,
    subCategory: text(input.subCategory, 'Branch', { required: true, max: 80 })!,
    prerequisites: needs,
  };
  const optional: Partial<RawExercise> = {
    swimlane: swimlane as Swimlane | undefined,
    standard: text(input.standard, 'Standard', { max: 200 }),
    steps: lines(input.steps, 'Steps'),
    expertTip: text(input.expertTip, 'Tip'),
    youtubeQuery: text(input.youtubeQuery, 'Video search', { max: 200 }),
    videoSearchUrl,
    discipline,
    focus: text(input.focus, 'Focus', { max: 120 }),
    summary: text(input.summary, 'Summary', { max: 400 }),
    muscles,
  };
  for (const [key, value] of Object.entries(optional)) if (value !== undefined) (exercise as unknown as Record<string, unknown>)[key] = value;
  return exercise;
}
