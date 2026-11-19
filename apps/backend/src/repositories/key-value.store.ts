import * as fs from 'fs/promises';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';
import pg from 'pg';

/** Injection token for the campaign's storage backend. */
export const KEY_VALUE_STORE = 'KEY_VALUE_STORE';

export interface StoredDoc<T> {
  /** Bumped on every write. The client sends it back to prove it saw the latest version. */
  rev: number;
  value: T;
  updatedAt: string;
}

/**
 * A tiny versioned document store. Two implementations sit behind it: a JSON
 * file for local development and Postgres for anywhere the filesystem does not
 * survive between requests (Vercel).
 */
export interface KeyValueStore {
  readonly kind: 'file' | 'postgres';
  get<T>(key: string): Promise<StoredDoc<T> | null>;
  /**
   * Compare-and-swap. `expectedRev` must match what is stored (0 = "create it,
   * fail if it already exists"). Resolves to the new document, or null when
   * another writer got there first.
   */
  put<T>(key: string, value: T, expectedRev: number): Promise<StoredDoc<T> | null>;
  delete(key: string): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* JSON file — local development                                       */
/* ------------------------------------------------------------------ */

type FileShape = Record<string, StoredDoc<unknown>>;

export class FileKeyValueStore implements KeyValueStore {
  readonly kind = 'file' as const;
  private readonly filePath: string;
  /** Operations run one at a time so two requests can never interleave a read and a write. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(directory = process.env.CAMPAIGN_DATA_DIR ?? path.join(process.cwd(), '.data')) {
    this.filePath = path.join(directory, 'campaign-store.json');
  }

  get<T>(key: string): Promise<StoredDoc<T> | null> {
    return this.enqueue(async () => ((await this.readAll())[key] as StoredDoc<T> | undefined) ?? null);
  }

  put<T>(key: string, value: T, expectedRev: number): Promise<StoredDoc<T> | null> {
    return this.enqueue(async () => {
      const all = await this.readAll();
      const currentRev = all[key]?.rev ?? 0;
      if (currentRev !== expectedRev) return null;

      const doc: StoredDoc<T> = { rev: currentRev + 1, value, updatedAt: new Date().toISOString() };
      all[key] = doc;

      // Write to a temp file and rename, so a crash mid-write cannot leave half a JSON file behind.
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tempPath = `${this.filePath}.${process.pid}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(all, null, 2), 'utf-8');
      await fs.rename(tempPath, this.filePath);
      return doc;
    });
  }

  delete(key: string): Promise<void> {
    return this.enqueue(async () => {
      const all = await this.readAll();
      if (!(key in all)) return;
      delete all[key];
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tempPath = `${this.filePath}.${process.pid}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(all, null, 2), 'utf-8');
      await fs.rename(tempPath, this.filePath);
    });
  }

  private enqueue<R>(task: () => Promise<R>): Promise<R> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async readAll(): Promise<FileShape> {
    try {
      return JSON.parse(await fs.readFile(this.filePath, 'utf-8')) as FileShape;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw error;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Postgres — Neon over HTTP when deployed, a plain pg pool on localhost */
/* ------------------------------------------------------------------ */

/** Runs one parameterised statement and resolves to its rows. */
export type Query = (text: string, params?: unknown[]) => Promise<unknown[]>;

/** A Postgres running on this machine (a local test database), which Neon's HTTP driver cannot reach. */
const isLocalDatabase = (connectionString: string) => {
  try {
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(new URL(connectionString).hostname);
  } catch {
    return false;
  }
};

export function queryFor(connectionString: string): Query {
  if (isLocalDatabase(connectionString)) {
    const pool = new pg.Pool({ connectionString, max: 4, idleTimeoutMillis: 10_000 });
    return async (text, params) => (await pool.query(text, params)).rows;
  }
  const sql = neon(connectionString);
  return async (text, params) => (await sql.query(text, params)) as unknown[];
}

interface KvRow {
  rev: number;
  value: unknown;
  updated_at: Date | string;
}

export class PostgresKeyValueStore implements KeyValueStore {
  readonly kind = 'postgres' as const;
  private readonly sql: { query: Query };
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.sql = { query: queryFor(connectionString) };
  }

  async get<T>(key: string): Promise<StoredDoc<T> | null> {
    await this.ensureTable();
    const rows = (await this.sql.query('SELECT rev, value, updated_at FROM campaign_kv WHERE key = $1', [
      key,
    ])) as KvRow[];
    return rows.length ? toDoc<T>(rows[0]) : null;
  }

  async put<T>(key: string, value: T, expectedRev: number): Promise<StoredDoc<T> | null> {
    await this.ensureTable();
    const json = JSON.stringify(value);

    // Both statements are atomic on their own, so the revision check and the write cannot be split.
    const rows = (
      expectedRev === 0
        ? await this.sql.query(
            `INSERT INTO campaign_kv (key, rev, value) VALUES ($1, 1, $2::jsonb)
             ON CONFLICT (key) DO NOTHING
             RETURNING rev, value, updated_at`,
            [key, json],
          )
        : await this.sql.query(
            `UPDATE campaign_kv SET value = $2::jsonb, rev = rev + 1, updated_at = now()
             WHERE key = $1 AND rev = $3
             RETURNING rev, value, updated_at`,
            [key, json, expectedRev],
          )
    ) as KvRow[];

    return rows.length ? toDoc<T>(rows[0]) : null;
  }

  async delete(key: string): Promise<void> {
    await this.ensureTable();
    await this.sql.query('DELETE FROM campaign_kv WHERE key = $1', [key]);
  }

  /** Creates the table on first use, so a fresh database needs no migration step. */
  private ensureTable(): Promise<void> {
    this.ready ??= this.sql
      .query(
        `CREATE TABLE IF NOT EXISTS campaign_kv (
           key text PRIMARY KEY,
           rev integer NOT NULL,
           value jsonb NOT NULL,
           updated_at timestamptz NOT NULL DEFAULT now()
         )`,
      )
      .then(() => undefined)
      .catch((error) => {
        this.ready = null;
        throw error;
      });
    return this.ready;
  }
}

function toDoc<T>(row: KvRow): StoredDoc<T> {
  return {
    rev: row.rev,
    value: row.value as T,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export function createKeyValueStore(): KeyValueStore {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  return connectionString ? new PostgresKeyValueStore(connectionString) : new FileKeyValueStore();
}
