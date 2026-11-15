/**
 * Creates or updates every table the app needs: Better Auth's, plus the
 * campaign's own. Safe to run repeatedly. Run with `npm run db:migrate`,
 * pointing DATABASE_URL at the database to update.
 */
import '../env.js';
import { getMigrations } from 'better-auth/db/migration';
import { auth, pool } from './auth.js';
import { CAMPAIGN_INVITE_DDL, CAMPAIGN_KV_DDL } from './schema.js';

if (!auth || !pool) {
  console.error('DATABASE_URL is not set — nothing to migrate.');
  process.exit(1);
}

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
console.log(
  `Better Auth: ${toBeCreated.length} table(s) to create, ${toBeAdded.length} to extend` +
    (toBeCreated.length ? ` (${toBeCreated.map((table) => table.table).join(', ')})` : ''),
);
await runMigrations();
await pool.query(CAMPAIGN_KV_DDL);
await pool.query(CAMPAIGN_INVITE_DDL);
console.log('Campaign tables ready.');
await pool.end();
