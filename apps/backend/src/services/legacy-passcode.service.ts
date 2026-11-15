import { Inject, Injectable } from '@nestjs/common';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { KEY_VALUE_STORE } from '../repositories/key-value.store.js';
import type { KeyValueStore } from '../repositories/key-value.store.js';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

interface PasscodeRecord {
  salt: string;
  hash: string;
}

/**
 * The campaign passcode from before accounts existed. It no longer opens the
 * campaign, but proves who the owner is during the one-time account setup.
 */
@Injectable()
export class LegacyPasscodeService {
  constructor(@Inject(KEY_VALUE_STORE) private readonly store: KeyValueStore) {}

  async exists(): Promise<boolean> {
    return (await this.store.get<PasscodeRecord>('auth')) !== null;
  }

  async verify(passcode: string): Promise<boolean> {
    const record = await this.store.get<PasscodeRecord>('auth');
    if (!record || !passcode || passcode.length > 128) return false;
    const expected = Buffer.from(record.value.hash, 'hex');
    const actual = await scryptAsync(passcode, Buffer.from(record.value.salt, 'hex'), expected.length);
    return timingSafeEqual(expected, actual);
  }
}
