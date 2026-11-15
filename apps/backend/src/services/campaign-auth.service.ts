import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { KEY_VALUE_STORE, KeyValueStore } from '../repositories/key-value.store';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const AUTH_KEY = 'auth';
const KEY_LENGTH = 64;
export const PASSCODE_MIN_LENGTH = 6;
export const PASSCODE_MAX_LENGTH = 128;

/** After this many wrong guesses in a row, every further wrong guess is answered slowly. */
const FREE_FAILURES = 5;
const FAILURE_DELAY_MS = 1500;

export type Protection = 'passcode' | 'none';

interface AuthRecord {
  salt: string;
  hash: string;
  createdAt: string;
}

/**
 * Open on a developer machine, passcode-gated once deployed. `CAMPAIGN_AUTH`
 * overrides either way.
 */
function resolveProtection(): Protection {
  const explicit = process.env.CAMPAIGN_AUTH;
  if (explicit === 'passcode' || explicit === 'none') return explicit;
  return process.env.VERCEL ? 'passcode' : 'none';
}

/**
 * The campaign belongs to whoever sets the passcode first. Only a salted
 * scrypt hash is stored; the passcode itself never is.
 */
@Injectable()
export class CampaignAuthService {
  readonly protection: Protection = resolveProtection();
  private consecutiveFailures = 0;

  constructor(@Inject(KEY_VALUE_STORE) private readonly store: KeyValueStore) {}

  async isClaimed(): Promise<boolean> {
    return (await this.store.get<AuthRecord>(AUTH_KEY)) !== null;
  }

  /** Sets the passcode. Resolves to false if someone already has. */
  async claim(passcode: string): Promise<boolean> {
    const salt = randomBytes(16);
    const hash = await scryptAsync(passcode, salt, KEY_LENGTH);
    const record: AuthRecord = {
      salt: salt.toString('hex'),
      hash: hash.toString('hex'),
      createdAt: new Date().toISOString(),
    };
    return (await this.store.put(AUTH_KEY, record, 0)) !== null;
  }

  async verify(passcode: string | undefined): Promise<boolean> {
    const record = await this.store.get<AuthRecord>(AUTH_KEY);
    if (!record || !passcode || passcode.length > PASSCODE_MAX_LENGTH) return this.fail();

    const expected = Buffer.from(record.value.hash, 'hex');
    const actual = await scryptAsync(passcode, Buffer.from(record.value.salt, 'hex'), expected.length);
    if (!timingSafeEqual(expected, actual)) return this.fail();

    this.consecutiveFailures = 0;
    return true;
  }

  private async fail(): Promise<false> {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures > FREE_FAILURES) {
      await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    }
    return false;
  }
}
