/**
 * Accounts, via Better Auth.
 *
 * Active whenever a Postgres database is configured (DATABASE_URL). Without
 * one — a quick local run — the campaign falls back to a single open save in a
 * JSON file and every account feature switches off.
 *
 * Sign-up is closed: accounts are only ever created on the server, for the
 * owner during setup and for people who accept an invitation.
 */
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import pg from 'pg';
import { actionEmail, sendEmail } from '../email/mailer.js';

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

/** The address people open in their browser. Links in emails and invitations are built from it. */
export const PUBLIC_URL = (
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/+$/, '');

export const pool = connectionString ? new pg.Pool({ connectionString, max: 4, idleTimeoutMillis: 10_000 }) : null;

export const trustedOrigins = [
  PUBLIC_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
  process.env.VERCEL ? null : 'http://localhost:3000',
].filter((origin): origin is string => Boolean(origin));

function createAuth(database: pg.Pool) {
  return betterAuth({
    appName: 'Aura Calisthenics',
    baseURL: PUBLIC_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const { html, text } = actionEmail(
          'Reset your password',
          'Someone asked to reset the password for your Aura Calisthenics account. If it was you, choose a new one below. The link works for one hour.',
          'Choose a new password',
          url,
        );
        await sendEmail({ to: user.email, subject: 'Reset your Aura Calisthenics password', html, text });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    plugins: [admin()],
  });
}

export const auth = pool ? createAuth(pool) : null;

export type Auth = ReturnType<typeof createAuth>;
