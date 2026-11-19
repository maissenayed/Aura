import { createHash } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { RawExercise, Swimlane } from '@aura/types';
import { BUILT_IN_EXERCISES, setExerciseList } from '../engine/aura-engine.mjs';
import {
  ExerciseContent,
  ExerciseList,
  ExerciseState,
  ExerciseStore,
  StoredExercise,
  createExerciseStore,
  sameJson,
} from '../repositories/exercise.store.js';

/**
 * The exercise list. The `exercise` table is the one copy everybody reads:
 * the web app loads it, the owner edits it on the Exercises page, and the
 * server's engine (crew numbers, cards) runs on it.
 *
 * The table follows the built-in list the app ships with
 * (apps/web/src/data/rawExercisesData.ts), so a fix made there reaches the
 * database on the next deploy, without undoing anything the owner did:
 * - a row the owner never touched takes the new built-in version;
 * - a new built-in exercise is added, unless the owner deleted it;
 * - a built-in exercise dropped from the code goes, unless the owner edited it.
 * The owner's own rows (added or edited on the page) stay as they made them,
 * and one of them can be put back to its built-in version at any time, as can
 * the whole list.
 */

/** The list this server ships with, and what the rules need to know about it. */
export interface BuiltInList {
  list: RawExercise[];
  byId: Map<string, RawExercise>;
  /** A fingerprint of the list: when it changes, the database follows the new list. */
  hash: string;
}

export function builtInListOf(list: RawExercise[]): BuiltInList {
  return {
    list,
    byId: new Map(list.map((exercise) => [exercise.id, exercise])),
    hash: createHash('sha256').update(JSON.stringify(list)).digest('hex').slice(0, 32),
  };
}

const BUILT_IN = builtInListOf(BUILT_IN_EXERCISES);

/** What the Exercises page shows: the list, and which parts of it are the owner's own. */
export interface ExerciseAdminView extends ExerciseList {
  /** Built-in exercises the owner edited. They keep the owner's version whatever the code says. */
  edited: string[];
  /** Exercises the owner added; the built-in list has no version of them. */
  added: string[];
  /** Built-in exercises the owner deleted. The built-in list does not bring them back. */
  deleted: { id: string; name: string; level: number }[];
}

@Injectable()
export class ExercisesService {
  private readonly store: ExerciseStore = createExerciseStore();
  /** The list this server ships with; a field so a test can stand in another. */
  private readonly builtIn: BuiltInList = BUILT_IN;
  /**
   * Whether this server brings the database up to its built-in list. Preview
   * deployments share production's database, so a preview of a change to the
   * list must not apply it before it is merged: only production (and a local
   * server) follows.
   */
  private readonly follows = process.env.VERCEL_ENV !== 'preview';
  private cached: { state: ExerciseState; list: ExerciseList } | null = null;
  private followed: Promise<unknown> | null = null;
  private engineSynced = { version: '', at: 0 };
  private syncing: Promise<void> | null = null;

  /** The list, after following the built-in one if it changed. */
  async current(): Promise<ExerciseList> {
    await this.ready();
    return this.cached!.list;
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

  /** The list for the Exercises page, with what the owner changed. */
  async adminView(): Promise<ExerciseAdminView> {
    return adminViewOf(await this.ready(), this.builtIn);
  }

  async create(input: unknown): Promise<ExerciseAdminView> {
    return this.change((state) => {
      const exercises = state.rows.map((row) => row.exercise);
      const exercise = cleanExercise(input, exercises, null);
      if (exercises.some((entry) => entry.id === exercise.id)) {
        throw new ConflictException({ success: false, message: `An exercise with the id ${exercise.id} already exists.` });
      }
      return { ...state, rows: [...state.rows, { exercise, edited: true }], deleted: state.deleted.filter((id) => id !== exercise.id) };
    });
  }

  async update(id: string, input: unknown): Promise<ExerciseAdminView> {
    return this.change((state) => {
      const exercises = state.rows.map((row) => row.exercise);
      if (!exercises.some((entry) => entry.id === id)) throw new NotFoundException({ success: false, message: `No exercise has the id ${id}.` });
      const exercise = cleanExercise(input, exercises, id);
      return { ...state, rows: state.rows.map((row) => (row.exercise.id === id ? { exercise, edited: true } : row)) };
    });
  }

  /** Deletes an exercise; every other one stops needing it. A built-in one is remembered as deleted. */
  async remove(id: string): Promise<ExerciseAdminView> {
    return this.change((state) => {
      if (!state.rows.some((row) => row.exercise.id === id)) throw new NotFoundException({ success: false, message: `No exercise has the id ${id}.` });
      return {
        ...state,
        rows: state.rows.filter((row) => row.exercise.id !== id),
        deleted: this.builtIn.byId.has(id) ? [...new Set([...state.deleted, id])] : state.deleted,
      };
    });
  }

  /** Puts one exercise back to its built-in version: undoes the owner's edit, or brings a deleted one back. */
  async restoreOne(id: string): Promise<ExerciseAdminView> {
    const builtIn = this.builtIn.byId.get(id);
    if (!builtIn) throw new NotFoundException({ success: false, message: `The built-in list has no exercise ${id}.` });
    return this.change((state) => {
      const back: StoredExercise = { exercise: builtIn, edited: false };
      const rows = state.rows.some((row) => row.exercise.id === id)
        ? state.rows.map((row) => (row.exercise.id === id ? back : row))
        : inBuiltInOrder([...state.rows, back], this.builtIn);
      return { ...state, rows, deleted: state.deleted.filter((other) => other !== id) };
    });
  }

  /** Puts the built-in list back, replacing every change made since. */
  async restoreBuiltIn(): Promise<ExerciseAdminView> {
    return this.change(() => everythingBuiltIn(this.builtIn));
  }

  /* ---------------- reading and writing ---------------- */

  /**
   * The stored list, current. The first call in a process follows the built-in
   * list if it changed since the database last did (a deploy that changed it),
   * and an empty list is filled from the built-in one.
   *
   * Only the first call: an instance of the previous deploy that is still warm
   * has already followed its list, so it never drags the database back.
   */
  private async ready(): Promise<ExerciseState> {
    this.followed ??= this.write((state) => (!this.follows || state.builtInHash === this.builtIn.hash ? null : followBuiltIn(state, this.builtIn))).catch((error) => {
      this.followed = null;
      throw error;
    });
    await this.followed;
    const state = await this.read();
    return state.rows.length ? state : this.write((latest) => (latest.rows.length ? null : everythingBuiltIn(this.builtIn)));
  }

  /** An owner's change, worked out on the latest list and tidied by the same rules as following. */
  private async change(make: (state: ExerciseState) => ExerciseContent): Promise<ExerciseAdminView> {
    await this.ready();
    const state = await this.write((latest) => settle(make(latest), this.builtIn));
    return adminViewOf(state, this.builtIn);
  }

  /** Reads the store again only when its version moved. */
  private async read(): Promise<ExerciseState> {
    const version = await this.store.version();
    if (this.cached?.state.version !== version) {
      const state = await this.store.read();
      this.cached = { state, list: { version: state.version, exercises: state.rows.map((row) => row.exercise) } };
    }
    return this.cached.state;
  }

  /**
   * Works out the next list from the stored one and writes it in one atomic
   * step. If another writer (another server instance, or the owner) got there
   * first, it works it out again from theirs. `next` returns null when there is
   * nothing to write.
   */
  private async write(next: (state: ExerciseState) => ExerciseContent | null): Promise<ExerciseState> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const state = await this.read();
      const content = next(state);
      if (!content) return state;
      if (await this.store.commit(state, content)) {
        this.engineSynced = { version: '', at: 0 };
        return this.read();
      }
    }
    throw new ConflictException({ success: false, message: 'The list kept changing while saving. Try again.' });
  }
}

/* ------------------------------------------------------------------ */
/* Following the built-in list                                         */
/* ------------------------------------------------------------------ */

/** The whole built-in list, as the store holds it with nothing of the owner's. */
export function everythingBuiltIn(builtIn: BuiltInList): ExerciseContent {
  return settle({ rows: builtIn.list.map((exercise) => ({ exercise, edited: false })), deleted: [], builtInHash: builtIn.hash }, builtIn);
}

/**
 * The stored list brought up to a new built-in list: untouched rows take the
 * new version, new built-in exercises come in unless the owner deleted them,
 * and built-in exercises the code dropped go unless the owner edited them.
 *
 * A list stored before the owner's changes were tracked has no hash yet. Its
 * `edited` flags are the store's best guess, and a built-in exercise missing
 * from it is taken to be one the owner deleted.
 */
export function followBuiltIn(state: ExerciseState, builtIn: BuiltInList): ExerciseContent {
  if (!state.rows.length && !state.deleted.length) return everythingBuiltIn(builtIn);
  const legacy = state.builtInHash === null;
  const have = new Set(state.rows.map((row) => row.exercise.id));
  const deleted = new Set(
    (legacy ? builtIn.list.map((exercise) => exercise.id) : state.deleted).filter((id) => builtIn.byId.has(id) && !have.has(id)),
  );
  const kept = state.rows.filter((row) => row.edited || builtIn.byId.has(row.exercise.id));
  const keptIds = new Set(kept.map((row) => row.exercise.id));
  const added = builtIn.list.filter((exercise) => !keptIds.has(exercise.id) && !deleted.has(exercise.id)).map((exercise) => ({ exercise, edited: false }));
  const rows = inBuiltInOrder([...kept, ...added], builtIn);
  return settle({ rows, deleted: [...deleted].sort(), builtInHash: builtIn.hash }, builtIn);
}

/** Built-in exercises in the built-in order, then the owner's own in the order they were added. */
export function inBuiltInOrder(rows: StoredExercise[], builtIn: BuiltInList): StoredExercise[] {
  const place = new Map(builtIn.list.map((exercise, index) => [exercise.id, index]));
  return rows
    .map((row, index) => ({ row, key: place.get(row.exercise.id) ?? builtIn.list.length + index }))
    .sort((a, b) => a.key - b.key)
    .map(({ row }) => row);
}

/** The built-in version of an exercise, needing only exercises that are in the list. */
function builtInView(builtIn: RawExercise, present: Set<string>): RawExercise {
  if (!builtIn.prerequisites?.some((id) => !present.has(id))) return builtIn;
  return { ...builtIn, prerequisites: builtIn.prerequisites.filter((id) => present.has(id)) };
}

/**
 * The rules every write ends with, so the list always holds together:
 * - a row the owner never touched is its built-in version, needing only what is in the list
 *   (so deleting an exercise drops it from what others need, and bringing it back restores that);
 * - the owner's own rows lose prerequisites that are no longer in the list;
 * - a loop of prerequisites (the owner's edits and the built-in list can make one together) is cut;
 * - an owner's row that matches its built-in version again is no longer theirs, and follows the code.
 * The built-in rules apply only while the store follows this server's built-in
 * list; otherwise (an older instance still running beside a newer deploy) the
 * owner's change is written as it is.
 */
export function settle(content: ExerciseContent, builtIn: BuiltInList): ExerciseContent {
  const following = content.builtInHash === builtIn.hash;
  const present = new Set(content.rows.map((row) => row.exercise.id));
  const tidy = content.rows.map((row): StoredExercise => {
    const base = following ? builtIn.byId.get(row.exercise.id) : undefined;
    if (base && !row.edited) return { exercise: builtInView(base, present), edited: false };
    const needs = row.exercise.prerequisites;
    return needs?.some((id) => !present.has(id)) ? { ...row, exercise: { ...row.exercise, prerequisites: needs.filter((id) => present.has(id)) } } : row;
  });
  const rows = withoutLoops(tidy).map((row) => {
    const base = following ? builtIn.byId.get(row.exercise.id) : undefined;
    return row.edited && base && sameJson(row.exercise, builtInView(base, present)) ? { ...row, edited: false } : row;
  });
  return { ...content, rows, deleted: content.deleted.filter((id) => !present.has(id)) };
}

/** Drops the prerequisite that closes a loop, wherever one formed. */
function withoutLoops(rows: StoredExercise[]): StoredExercise[] {
  const byId = new Map(rows.map((row) => [row.exercise.id, row.exercise]));
  const mark = new Map<string, 'open' | 'done'>();
  const cut = new Map<string, Set<string>>();
  const visit = (id: string) => {
    mark.set(id, 'open');
    for (const need of byId.get(id)?.prerequisites ?? []) {
      if (mark.get(need) === 'open') {
        if (!cut.has(id)) cut.set(id, new Set());
        cut.get(id)!.add(need);
      } else if (!mark.has(need) && byId.has(need)) visit(need);
    }
    mark.set(id, 'done');
  };
  for (const row of rows) if (!mark.has(row.exercise.id)) visit(row.exercise.id);
  if (!cut.size) return rows;
  return rows.map((row) => {
    const drop = cut.get(row.exercise.id);
    return drop ? { ...row, exercise: { ...row.exercise, prerequisites: row.exercise.prerequisites!.filter((id) => !drop.has(id)) } } : row;
  });
}

export function adminViewOf(state: ExerciseState, builtIn: BuiltInList): ExerciseAdminView {
  const own = state.rows.filter((row) => row.edited).map((row) => row.exercise.id);
  return {
    version: state.version,
    exercises: state.rows.map((row) => row.exercise),
    edited: own.filter((id) => builtIn.byId.has(id)),
    added: own.filter((id) => !builtIn.byId.has(id)),
    deleted: state.deleted.flatMap((id) => {
      const exercise = builtIn.byId.get(id);
      return exercise ? [{ id, name: exercise.name, level: exercise.level }] : [];
    }),
  };
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
