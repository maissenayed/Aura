/**
 * Loads `.env` for local development. Imported first by every entrypoint so the
 * variables exist before any module reads them. Deployed environments have no
 * `.env` file and get their variables from the platform instead.
 */
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
