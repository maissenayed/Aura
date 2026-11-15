/** Tables the app owns next to Better Auth's own (user, session, account, verification). */
export const CAMPAIGN_INVITE_DDL = `CREATE TABLE IF NOT EXISTS campaign_invite (
  id text PRIMARY KEY,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  invited_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_user_id text,
  revoked_at timestamptz
)`;

export const CAMPAIGN_KV_DDL = `CREATE TABLE IF NOT EXISTS campaign_kv (
  key text PRIMARY KEY,
  rev integer NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
)`;
