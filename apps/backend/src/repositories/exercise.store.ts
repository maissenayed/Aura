import * as fs from 'fs/promises';
import * as path from 'path';
import type { RawExercise } from '@aura/types';
import { Query, queryFor } from './key-value.store.js';

/**
 * Where the exercise list lives: the `exercise` table in Postgres, or a JSON
 * file when the server runs without a database (local development). Each row
 * is one exercise, kept in the order the list was written in.
 *
 * Beside the rows the store keeps what the owner changed, so a fix to the
 * built-in list can reach the database without undoing their work: which rows
 * are theirs (`edited`: added or edited on the Exercises page), which built-in
 * exercises they deleted, and a hash of the built-in list the rows last
 * followed. The rules for using them are in ExercisesService.
 *
 * Every write is a compare-and-swap on the list's revision: it goes through
 * only if nothing was written since the state it was worked out from. So two
 * server instances, or an instance and the owner, can never half-overwrite
 * each other; the one that loses reads again.
 */
export interface ExerciseList {
  /** Changes with every write, so a client can ask whether its copy is current without downloading it. */
  version: string;
  exercises: RawExercise[];
}

export interface StoredExercise {
  exercise: RawExercise;
  /** The owner's own: added on the Exercises page, or a built-in exercise edited there. */
  edited: boolean;
}

/** What a write sets: the whole list, as it should be afterwards. */
export interface ExerciseContent {
  /** In list order. */
  rows: StoredExercise[];
  /** Built-in exercises the owner deleted, so the built-in list does not bring them back. */
  deleted: string[];
  /** The built-in list the rows follow; null before the first write. */
  builtInHash: string | null;
}

export interface ExerciseState extends ExerciseContent {
  version: string;
  /** Bumped by every write. */
  rev: number;
}

export interface ExerciseStore {
  readonly kind: 'file' | 'postgres';
  /** The version of what is stored, without reading the rows. */
  version(): Promise<string>;
  /**
   * Everything stored, read in one go. A store written before edits were
   * tracked has no built-in hash yet; its `edited` flags are then the store's
   * best guess at what the owner touched, for the first write to settle.
   */
  read(): Promise<ExerciseState>;
  /**
   * Makes the store hold `to`, atomically, if nothing was written since `from`
   * was read. Resolves to false (and changes nothing) if something was.
   */
  commit(from: ExerciseState, to: ExerciseContent): Promise<boolean>;
}

/**
 * The tables, as `npm run db:migrate` creates them; the store also creates
 * them on first use. One statement each: Neon's HTTP driver runs one at a time.
 */
export const EXERCISE_DDL = [
  `CREATE TABLE IF NOT EXISTS exercise (
    id text PRIMARY KEY,
    position integer NOT NULL,
    data jsonb NOT NULL,
    edited boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Tables made before edits were tracked. Checked first, so a warm database is never locked to alter it.
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'exercise'::regclass AND attname = 'edited' AND NOT attisdropped) THEN
      ALTER TABLE exercise ADD COLUMN IF NOT EXISTS edited boolean NOT NULL DEFAULT false;
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS exercise_deleted (
    id text PRIMARY KEY,
    deleted_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS exercise_meta (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    rev bigint NOT NULL DEFAULT 0,
    built_in_hash text,
    changed_at timestamptz NOT NULL DEFAULT now()
  )`,
  `INSERT INTO exercise_meta (id, changed_at)
   SELECT 1, coalesce((SELECT max(updated_at) FROM exercise), now())
   ON CONFLICT (id) DO NOTHING`,
];

/** Same content, whatever order the keys were written in. */
export const sameJson = (a: unknown, b: unknown) => canonical(a) === canonical(b);

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/* ------------------------------------------------------------------ */
/* Postgres                                                            */
/* ------------------------------------------------------------------ */

const versionSql = `rev || '.' || (extract(epoch FROM changed_at) * 1000)::bigint`;

export class PostgresExerciseStore implements ExerciseStore {
  readonly kind = 'postgres' as const;
  private readonly query: Query;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.query = queryFor(connectionString);
  }

  async version(): Promise<string> {
    await this.ensureTables();
    const [row] = (await this.query(`SELECT ${versionSql} AS version FROM exercise_meta WHERE id = 1`)) as { version: string }[];
    return row.version;
  }

  async read(): Promise<ExerciseState> {
    await this.ensureTables();
    // One statement, so the revision always describes exactly the rows that came with it.
    // Before the first tracked write (no hash yet), a row written after the list was
    // seeded (every seeded row shares one timestamp) is taken to be the owner's.
    const [row] = (await this.query(
      `SELECT m.rev::int AS rev, ${versionSql} AS version, m.built_in_hash,
              coalesce((SELECT jsonb_agg(jsonb_build_object(
                         'exercise', e.data,
                         'edited', e.edited OR (m.built_in_hash IS NULL AND e.updated_at > (SELECT min(updated_at) FROM exercise)))
                       ORDER BY e.position, e.id) FROM exercise e), '[]'::jsonb) AS rows,
              coalesce((SELECT jsonb_agg(d.id ORDER BY d.id) FROM exercise_deleted d), '[]'::jsonb) AS deleted
         FROM exercise_meta m WHERE m.id = 1`,
    )) as { rev: number; version: string; built_in_hash: string | null; rows: StoredExercise[]; deleted: string[] }[];
    return { rev: row.rev, version: row.version, builtInHash: row.built_in_hash, rows: row.rows, deleted: row.deleted };
  }

  async commit(from: ExerciseState, to: ExerciseContent): Promise<boolean> {
    await this.ensureTables();
    // Only what changed is sent: a row whose content, flag or place moved, and the ids that went.
    // The first tracked write sends every row: the flags it read were a guess, not what is stored.
    const before = new Map(from.builtInHash === null ? [] : from.rows.map((row, position) => [row.exercise.id, { row, position }]));
    const put = to.rows.flatMap((row, position) => {
      const was = before.get(row.exercise.id);
      const same = was && was.position === position && was.row.edited === row.edited && sameJson(was.row.exercise, row.exercise);
      return same ? [] : [{ id: row.exercise.id, position, edited: row.edited, data: row.exercise }];
    });
    const kept = new Set(to.rows.map((row) => row.exercise.id));
    const drop = from.rows.map((row) => row.exercise.id).filter((id) => !kept.has(id));

    // Every part waits on `claim`, the compare-and-swap on the revision. A writer that
    // committed first holds the row until it is done; this one then sees a newer
    // revision, claims nothing, and so writes nothing.
    const [result] = (await this.query(
      `WITH claim AS (
          UPDATE exercise_meta SET rev = rev + 1, built_in_hash = $2, changed_at = now()
           WHERE id = 1 AND rev = $1 RETURNING rev
        ),
        incoming AS (
          SELECT e->>'id' AS id, (e->>'position')::int AS position, (e->>'edited')::boolean AS edited, e->'data' AS data
            FROM jsonb_array_elements($3::jsonb) AS t(e)
        ),
        gone AS (
          DELETE FROM exercise WHERE id IN (SELECT jsonb_array_elements_text($4::jsonb)) AND EXISTS (SELECT 1 FROM claim)
        ),
        put AS (
          INSERT INTO exercise (id, position, data, edited, updated_at)
          SELECT id, position, data, edited, now() FROM incoming WHERE EXISTS (SELECT 1 FROM claim)
          ON CONFLICT (id) DO UPDATE SET
            position = excluded.position,
            data = excluded.data,
            edited = excluded.edited,
            updated_at = CASE
              WHEN exercise.data IS DISTINCT FROM excluded.data OR exercise.edited IS DISTINCT FROM excluded.edited THEN now()
              ELSE exercise.updated_at END
        ),
        undeleted AS (
          DELETE FROM exercise_deleted WHERE id NOT IN (SELECT jsonb_array_elements_text($5::jsonb)) AND EXISTS (SELECT 1 FROM claim)
        ),
        deleted AS (
          INSERT INTO exercise_deleted (id)
          SELECT jsonb_array_elements_text($5::jsonb) WHERE EXISTS (SELECT 1 FROM claim)
          ON CONFLICT (id) DO NOTHING
        )
      SELECT count(*)::int AS applied FROM claim`,
      // Lists go as JSON text, which Neon's HTTP driver and pg send the same way.
      [from.rev, to.builtInHash, JSON.stringify(put), JSON.stringify(drop), JSON.stringify(to.deleted)],
    )) as { applied: number }[];
    return result.applied === 1;
  }

  /** Creates the tables on first use, so a fresh database needs no migration step. */
  private ensureTables(): Promise<void> {
    this.ready ??= (async () => {
      for (const statement of EXERCISE_DDL) await this.query(statement);
    })().catch((error) => {
      this.ready = null;
      throw error;
    });
    return this.ready;
  }
}

/* ------------------------------------------------------------------ */
/* JSON file — local development without a database                    */
/* ------------------------------------------------------------------ */

interface FileShape {
  /** Missing in a file written before edits were tracked. */
  rev?: number;
  updatedAt: number;
  builtInHash?: string | null;
  exercises: RawExercise[];
  /** Ids of the owner's own rows. */
  edited?: string[];
  deleted?: string[];
}

/**
 * Operations on one file run one at a time, so two requests can never interleave a read
 * and a write. Kept per file rather than per store, for every store on it in this process.
 */
const fileQueues = new Map<string, Promise<unknown>>();

export class FileExerciseStore implements ExerciseStore {
  readonly kind = 'file' as const;
  private readonly filePath: string;

  constructor(directory = process.env.CAMPAIGN_DATA_DIR ?? path.join(process.cwd(), '.data')) {
    this.filePath = path.join(directory, 'exercises.json');
  }

  async version(): Promise<string> {
    return versionOf(await this.enqueue(() => this.readFile()));
  }

  async read(): Promise<ExerciseState> {
    return stateOf(await this.enqueue(() => this.readFile()));
  }

  commit(from: ExerciseState, to: ExerciseContent): Promise<boolean> {
    return this.enqueue(async () => {
      const file = await this.readFile();
      if ((file?.rev ?? 0) !== from.rev) return false;
      // The clock can stand still between two quick writes; the version must still move.
      const next: FileShape = {
        rev: from.rev + 1,
        updatedAt: Math.max(Date.now(), (file?.updatedAt ?? 0) + 1),
        builtInHash: to.builtInHash,
        exercises: to.rows.map((row) => row.exercise),
        edited: to.rows.filter((row) => row.edited).map((row) => row.exercise.id),
        deleted: [...to.deleted].sort(),
      };
      // Write to a temp file and rename, so a crash mid-write cannot leave half a JSON file behind.
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tempPath = `${this.filePath}.${process.pid}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(next, null, 2), 'utf-8');
      await fs.rename(tempPath, this.filePath);
      return true;
    });
  }

  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = (fileQueues.get(this.filePath) ?? Promise.resolve()).then(task, task);
    fileQueues.set(this.filePath, run.catch(() => undefined));
    return run;
  }

  private async readFile(): Promise<FileShape | null> {
    try {
      return JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as FileShape;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }
}

const versionOf = (file: FileShape | null) => `${file?.rev ?? 0}.${file?.updatedAt ?? 0}`;

function stateOf(file: FileShape | null): ExerciseState {
  if (!file) return { rev: 0, version: versionOf(null), builtInHash: null, rows: [], deleted: [] };
  // A file from before edits were tracked says nothing about who wrote what, so every
  // row counts as the owner's until the first write compares it with the built-in list.
  const tracked = file.builtInHash !== undefined;
  const edited = new Set(file.edited ?? []);
  return {
    rev: file.rev ?? 0,
    version: versionOf(file),
    builtInHash: file.builtInHash ?? null,
    rows: file.exercises.map((exercise) => ({ exercise, edited: tracked ? edited.has(exercise.id) : true })),
    deleted: file.deleted ?? [],
  };
}

export function createExerciseStore(): ExerciseStore {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  return connectionString ? new PostgresExerciseStore(connectionString) : new FileExerciseStore();
}
