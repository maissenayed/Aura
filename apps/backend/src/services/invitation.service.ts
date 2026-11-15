import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PUBLIC_URL, pool } from '../auth/auth.js';
import { CAMPAIGN_INVITE_DDL } from '../auth/schema.js';

const INVITE_DAYS = 14;

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Invite {
  id: string;
  email: string;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  status: InviteStatus;
}

interface InviteRow {
  id: string;
  email: string;
  invited_by: string;
  created_at: Date;
  expires_at: Date;
  accepted_at: Date | null;
  revoked_at: Date | null;
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

function toInvite(row: InviteRow): Invite {
  const status: InviteStatus = row.accepted_at
    ? 'accepted'
    : row.revoked_at
      ? 'revoked'
      : row.expires_at.getTime() <= Date.now()
        ? 'expired'
        : 'pending';
  return {
    id: row.id,
    email: row.email,
    invitedBy: row.invited_by,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    acceptedAt: row.accepted_at?.toISOString() ?? null,
    status,
  };
}

export const inviteLink = (token: string) => `${PUBLIC_URL}/join?token=${encodeURIComponent(token)}`;

/**
 * Invitations. Only a hash of each token is stored, so a link cannot be shown
 * twice — "renew" issues a fresh one and the old link stops working.
 */
@Injectable()
export class InvitationService {
  private ready: Promise<void> | null = null;

  private db() {
    if (!pool) throw new ServiceUnavailableException({ success: false, message: 'Accounts are not set up on this server.' });
    return pool;
  }

  private async ensureTable() {
    const db = this.db();
    this.ready ??= db
      .query(CAMPAIGN_INVITE_DDL)
      .then(() => undefined)
      .catch((error) => {
        this.ready = null;
        throw error;
      });
    await this.ready;
    return db;
  }

  async userExists(email: string): Promise<boolean> {
    const db = this.db();
    const { rowCount } = await db.query('SELECT 1 FROM "user" WHERE lower(email) = lower($1)', [email]);
    return (rowCount ?? 0) > 0;
  }

  /** Creates an invitation, replacing any still-pending one for the same address. */
  async create(email: string, invitedBy: string): Promise<{ invite: Invite; token: string }> {
    const db = await this.ensureTable();
    await db.query(
      `UPDATE campaign_invite SET revoked_at = now()
       WHERE lower(email) = lower($1) AND accepted_at IS NULL AND revoked_at IS NULL`,
      [email],
    );
    const token = randomBytes(32).toString('base64url');
    const { rows } = await db.query<InviteRow>(
      `INSERT INTO campaign_invite (id, email, token_hash, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, now() + make_interval(days => $5))
       RETURNING *`,
      [randomUUID(), email, hashToken(token), invitedBy, INVITE_DAYS],
    );
    return { invite: toInvite(rows[0]), token };
  }

  async list(): Promise<Invite[]> {
    const db = await this.ensureTable();
    const { rows } = await db.query<InviteRow>('SELECT * FROM campaign_invite ORDER BY created_at DESC LIMIT 200');
    return rows.map(toInvite);
  }

  /** A fresh link and expiry for an invitation nobody has used yet. */
  async renew(id: string): Promise<{ invite: Invite; token: string } | null> {
    const db = await this.ensureTable();
    const token = randomBytes(32).toString('base64url');
    const { rows } = await db.query<InviteRow>(
      `UPDATE campaign_invite
       SET token_hash = $2, expires_at = now() + make_interval(days => $3), revoked_at = NULL
       WHERE id = $1 AND accepted_at IS NULL
       RETURNING *`,
      [id, hashToken(token), INVITE_DAYS],
    );
    return rows[0] ? { invite: toInvite(rows[0]), token } : null;
  }

  async revoke(id: string): Promise<boolean> {
    const db = await this.ensureTable();
    const { rowCount } = await db.query(
      'UPDATE campaign_invite SET revoked_at = now() WHERE id = $1 AND accepted_at IS NULL AND revoked_at IS NULL',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  /** The invitation behind a link, if it can still be used. */
  async lookup(token: string): Promise<Invite | null> {
    const db = await this.ensureTable();
    const { rows } = await db.query<InviteRow>('SELECT * FROM campaign_invite WHERE token_hash = $1', [hashToken(token)]);
    const invite = rows[0] ? toInvite(rows[0]) : null;
    return invite?.status === 'pending' ? invite : null;
  }

  /** Marks an invitation used — atomically, so one link can never create two accounts. */
  async claim(token: string): Promise<Invite | null> {
    const db = await this.ensureTable();
    const { rows } = await db.query<InviteRow>(
      `UPDATE campaign_invite SET accepted_at = now()
       WHERE token_hash = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
       RETURNING *`,
      [hashToken(token)],
    );
    return rows[0] ? toInvite(rows[0]) : null;
  }

  /** Undo a claim when the account could not be created, so the link still works. */
  async release(id: string): Promise<void> {
    const db = await this.ensureTable();
    await db.query('UPDATE campaign_invite SET accepted_at = NULL WHERE id = $1', [id]);
  }

  async attachUser(id: string, userId: string): Promise<void> {
    const db = await this.ensureTable();
    await db.query('UPDATE campaign_invite SET accepted_user_id = $2 WHERE id = $1', [id, userId]);
  }
}
