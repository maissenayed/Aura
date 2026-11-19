import * as fs from 'fs/promises';
import * as path from 'path';
import type { RawExercise } from '@aura/types';
import { Query, queryFor } from './key-value.store.js';

/**
 * Where the exercise list lives: the `exercise` table in Postgres, or a JSON
 * file when the server runs without a database (local development). Each row
 * is one exercise, kept in the order the list was written in.
 *
 * The version changes whenever anything in the list does, so a client that
 * already has the list can ask whether it is still current without
 * downloading it again.
 */
export interface ExerciseList {
  version: string;
  exercises: RawExercise[];
}

export interface ExerciseStore {
  readonly kind: 'file' | 'postgres';
  /** Null while the store is empty. */
  version(): Promise<string | null>;
  list(): Promise<ExerciseList>;
  /** Fills an empty store with these exercises; does nothing if anything is already there. */
  seedIfEmpty(exercises: RawExercise[]): Promise<void>;
  /** Makes the store hold exactly these exercises, in this order. */
  replaceAll(exercises: RawExercise[]): Promise<void>;
  /** Adds an exercise at the end, or replaces the one with the same id where it stands. */
  upsert(exercise: RawExercise): Promise<void>;
  /** Removes an exercise and drops it from every other exercise's prerequisites. */
  remove(id: string): Promise<void>;
}

/** The table, as `npm run db:migrate` creates it; the store also creates it on first use. */
export const EXERCISE_DDL = `CREATE TABLE IF NOT EXISTS exercise (
  id text PRIMARY KEY,
  position integer NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
)`;

/* ------------------------------------------------------------------ */
/* Postgres                                                            */
/* ------------------------------------------------------------------ */

/** The rows of a JSON array of exercises, numbered from 0 in their order. */
const INCOMING = `SELECT e->>'id' AS id, (ord - 1)::int AS position, e AS data
  FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY AS t(e, ord)`;

export class PostgresExerciseStore implements ExerciseStore {
  readonly kind = 'postgres' as const;
  private readonly query: Query;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.query = queryFor(connectionString);
  }

  async version(): Promise<string | null> {
    await this.ensureTable();
    const [row] = (await this.query(
      `SELECT count(*)::int AS n, (extract(epoch FROM max(updated_at)) * 1000)::bigint AS at FROM exercise`,
    )) as { n: number; at: string | number | null }[];
    return row && row.n > 0 ? `${row.n}.${row.at}` : null;
  }

  async list(): Promise<ExerciseList> {
    await this.ensureTable();
    // One statement, so the version always describes exactly the rows that came with it.
    const [row] = (await this.query(
      `SELECT count(*)::int AS n,
              (extract(epoch FROM max(updated_at)) * 1000)::bigint AS at,
              coalesce(jsonb_agg(data ORDER BY position, id), '[]'::jsonb) AS exercises
         FROM exercise`,
    )) as { n: number; at: string | number | null; exercises: RawExercise[] }[];
    return { version: `${row.n}.${row.at ?? 0}`, exercises: row.exercises };
  }

  async seedIfEmpty(exercises: RawExercise[]): Promise<void> {
    await this.ensureTable();
    await this.query(
      `INSERT INTO exercise (id, position, data)
       SELECT id, position, data FROM (${INCOMING}) incoming
       WHERE NOT EXISTS (SELECT 1 FROM exercise)
       ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(exercises)],
    );
  }

  async replaceAll(exercises: RawExercise[]): Promise<void> {
    await this.ensureTable();
    // Atomic: the rows not in the new list go and the rest are written, in one statement.
    await this.query(
      `WITH incoming AS (${INCOMING}),
            gone AS (DELETE FROM exercise WHERE id NOT IN (SELECT id FROM incoming))
       INSERT INTO exercise (id, position, data, updated_at)
       SELECT id, position, data, now() FROM incoming
       ON CONFLICT (id) DO UPDATE SET position = excluded.position, data = excluded.data, updated_at = now()`,
      [JSON.stringify(exercises)],
    );
  }

  async upsert(exercise: RawExercise): Promise<void> {
    await this.ensureTable();
    await this.query(
      `INSERT INTO exercise (id, position, data)
       VALUES ($1, (SELECT coalesce(max(position) + 1, 0) FROM exercise), $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = now()`,
      [exercise.id, JSON.stringify(exercise)],
    );
  }

  async remove(id: string): Promise<void> {
    await this.ensureTable();
    await this.query(
      `WITH gone AS (DELETE FROM exercise WHERE id = $1::text RETURNING id)
       UPDATE exercise
          SET data = jsonb_set(data, '{prerequisites}', (data->'prerequisites') - $1::text), updated_at = now()
        WHERE data->'prerequisites' ? $1::text AND EXISTS (SELECT 1 FROM gone)`,
      [id],
    );
  }

  /** Creates the table on first use, so a fresh database needs no migration step. */
  private ensureTable(): Promise<void> {
    this.ready ??= this.query(EXERCISE_DDL)
      .then(() => undefined)
      .catch((error) => {
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
  updatedAt: number;
  exercises: RawExercise[];
}

export class FileExerciseStore implements ExerciseStore {
  readonly kind = 'file' as const;
  private readonly filePath: string;
  /** Operations run one at a time so two requests can never interleave a read and a write. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(directory = process.env.CAMPAIGN_DATA_DIR ?? path.join(process.cwd(), '.data')) {
    this.filePath = path.join(directory, 'exercises.json');
  }

  async version(): Promise<string | null> {
    const file = await this.enqueue(() => this.read());
    return file && file.exercises.length ? versionOf(file) : null;
  }

  async list(): Promise<ExerciseList> {
    const file = await this.enqueue(() => this.read());
    return file ? { version: versionOf(file), exercises: file.exercises } : { version: '0.0', exercises: [] };
  }

  seedIfEmpty(exercises: RawExercise[]): Promise<void> {
    return this.enqueue(async () => {
      const file = await this.read();
      if (!file?.exercises.length) await this.write(exercises);
    });
  }

  replaceAll(exercises: RawExercise[]): Promise<void> {
    return this.enqueue(() => this.write(exercises));
  }

  upsert(exercise: RawExercise): Promise<void> {
    return this.enqueue(async () => {
      const list = (await this.read())?.exercises ?? [];
      const at = list.findIndex((entry) => entry.id === exercise.id);
      await this.write(at === -1 ? [...list, exercise] : list.map((entry, index) => (index === at ? exercise : entry)));
    });
  }

  remove(id: string): Promise<void> {
    return this.enqueue(async () => {
      const list = (await this.read())?.exercises ?? [];
      if (!list.some((entry) => entry.id === id)) return;
      await this.write(
        list
          .filter((entry) => entry.id !== id)
          .map((entry) => (entry.prerequisites?.includes(id) ? { ...entry, prerequisites: entry.prerequisites.filter((other) => other !== id) } : entry)),
      );
    });
  }

  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async read(): Promise<FileShape | null> {
    try {
      return JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as FileShape;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  private async write(exercises: RawExercise[]): Promise<void> {
    // The clock can stand still between two quick writes; the version must still move.
    const previous = (await this.read())?.updatedAt ?? 0;
    const file: FileShape = { updatedAt: Math.max(Date.now(), previous + 1), exercises };
    // Write to a temp file and rename, so a crash mid-write cannot leave half a JSON file behind.
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(file, null, 2), 'utf-8');
    await fs.rename(tempPath, this.filePath);
  }
}

const versionOf = (file: FileShape) => `${file.exercises.length}.${file.updatedAt}`;

export function createExerciseStore(): ExerciseStore {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  return connectionString ? new PostgresExerciseStore(connectionString) : new FileExerciseStore();
}
