import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  GoneException,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { timingSafeEqual } from 'crypto';
import { AdminGuard, accountOf, accountsEnabled, readAccount } from '../auth/account.js';
import { auth, pool } from '../auth/auth.js';
import { signInAndSetCookie } from '../auth/session-cookies.js';
import { actionEmail, emailEnabled, sendEmail } from '../email/mailer.js';
import { KEY_VALUE_STORE } from '../repositories/key-value.store.js';
import type { KeyValueStore } from '../repositories/key-value.store.js';
import { InvitationService, inviteLink } from '../services/invitation.service.js';
import { LegacyPasscodeService } from '../services/legacy-passcode.service.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SETUP_LOCK = 482_113;
const FREE_SETUP_FAILURES = 5;

/* ------------------------------------------------------------------ */
/* Input checks                                                        */
/* ------------------------------------------------------------------ */

function field(body: unknown, key: string): unknown {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[key] : undefined;
}

function cleanEmail(value: unknown): string {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!EMAIL.test(email) || email.length > 254) {
    throw new BadRequestException({ success: false, code: 'bad-email', message: 'Enter a valid email address.' });
  }
  return email;
}

function cleanName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (name.length < 1 || name.length > 60) {
    throw new BadRequestException({ success: false, code: 'bad-name', message: 'Enter your name (up to 60 characters).' });
  }
  return name;
}

function cleanPassword(value: unknown): string {
  const password = typeof value === 'string' ? value : '';
  if (password.length < 8 || password.length > 128) {
    throw new BadRequestException({ success: false, code: 'bad-password', message: 'Use a password of 8 to 128 characters.' });
  }
  return password;
}

function requireAccounts() {
  if (!auth || !pool) {
    throw new ServiceUnavailableException({ success: false, code: 'no-accounts', message: 'Accounts are not set up on this server.' });
  }
  return { auth, pool };
}

/** Better Auth reports a taken address as an error; turn that into a clear 409. */
function isDuplicateUser(error: unknown): boolean {
  const text = `${(error as { message?: string })?.message ?? ''} ${(error as { body?: { code?: string } })?.body?.code ?? ''}`;
  return /already exists|USER_ALREADY_EXISTS/i.test(text);
}

const saveKey = (userId: string) => `save:${userId}`;

@Controller('api/v1')
export class AccountsController {
  private setupFailures = 0;

  constructor(
    private readonly invitations: InvitationService,
    private readonly legacy: LegacyPasscodeService,
    @Inject(KEY_VALUE_STORE) private readonly store: KeyValueStore,
  ) {}

  /* ---------------------------------------------------------------- */
  /* Who am I                                                          */
  /* ---------------------------------------------------------------- */

  /** Public. Tells the app whether to show the board, a sign-in form, or first-time setup. */
  @Get('account')
  async account(@Req() request: Request) {
    if (!accountsEnabled()) {
      return { success: true, data: { mode: 'open', setupRequired: false, account: await readAccount(request), email: false } };
    }
    const { pool: db } = requireAccounts();
    const { rows } = await db.query<{ n: number }>('SELECT count(*)::int AS n FROM "user"');
    const setupRequired = rows[0].n === 0;
    return {
      success: true,
      data: {
        mode: 'accounts',
        setupRequired,
        account: setupRequired ? null : await readAccount(request),
        email: emailEnabled(),
        legacyPasscode: setupRequired ? await this.legacy.exists() : false,
      },
    };
  }

  /* ---------------------------------------------------------------- */
  /* First-time owner setup                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Creates the owner account. Only works while no account exists, and only
   * with the old campaign passcode or the server's OWNER_SETUP_CODE — so the
   * first stranger to find the link cannot take over.
   */
  @Post('setup')
  @HttpCode(201)
  async setup(@Body() body: unknown, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const { auth: api, pool: db } = requireAccounts();
    const secret = typeof field(body, 'secret') === 'string' ? (field(body, 'secret') as string) : '';
    const name = cleanName(field(body, 'name'));
    const email = cleanEmail(field(body, 'email'));
    const password = cleanPassword(field(body, 'password'));

    if (!(await this.secretMatches(secret))) {
      this.setupFailures += 1;
      if (this.setupFailures > FREE_SETUP_FAILURES) await new Promise((resolve) => setTimeout(resolve, 1500));
      throw new ForbiddenException({ success: false, code: 'bad-secret', message: 'That passcode or setup code is not right.' });
    }
    this.setupFailures = 0;

    const client = await db.connect();
    let userId: string;
    try {
      await client.query('SELECT pg_advisory_lock($1)', [SETUP_LOCK]);
      const { rows } = await client.query<{ n: number }>('SELECT count(*)::int AS n FROM "user"');
      if (rows[0].n > 0) {
        throw new ConflictException({ success: false, code: 'already-set-up', message: 'The owner account already exists. Sign in instead.' });
      }
      const created = await api.api.createUser({ body: { email, password, name, role: 'admin' } });
      userId = created.user.id;
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [SETUP_LOCK]).catch(() => undefined);
      client.release();
    }

    // The campaign saved before accounts existed belongs to the owner.
    const legacySave = await this.store.get('save');
    if (legacySave && !(await this.store.get(saveKey(userId)))) {
      await this.store.put(saveKey(userId), legacySave.value, 0);
    }

    await signInAndSetCookie(email, password, request, response);
    return { success: true, data: { name, email } };
  }

  private async secretMatches(secret: string): Promise<boolean> {
    if (!secret) return false;
    const code = process.env.OWNER_SETUP_CODE;
    if (code) {
      const a = Buffer.from(secret);
      const b = Buffer.from(code);
      if (a.length === b.length && timingSafeEqual(a, b)) return true;
    }
    return this.legacy.verify(secret);
  }

  /* ---------------------------------------------------------------- */
  /* Joining through an invitation                                     */
  /* ---------------------------------------------------------------- */

  @Get('join/:token')
  async invitation(@Param('token') token: string) {
    requireAccounts();
    const invite = await this.invitations.lookup(token);
    if (!invite) {
      throw new GoneException({ success: false, code: 'invite-invalid', message: 'This invitation has expired, been used or been withdrawn.' });
    }
    return { success: true, data: { email: invite.email, expiresAt: invite.expiresAt } };
  }

  @Post('join/:token')
  @HttpCode(201)
  async join(
    @Param('token') token: string,
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { auth: api } = requireAccounts();
    const name = cleanName(field(body, 'name'));
    const password = cleanPassword(field(body, 'password'));

    const invite = await this.invitations.claim(token);
    if (!invite) {
      throw new GoneException({ success: false, code: 'invite-invalid', message: 'This invitation has expired, been used or been withdrawn.' });
    }

    try {
      const created = await api.api.createUser({ body: { email: invite.email, password, name, role: 'user' } });
      await this.invitations.attachUser(invite.id, created.user.id);
    } catch (error) {
      await this.invitations.release(invite.id);
      if (isDuplicateUser(error)) {
        throw new ConflictException({ success: false, code: 'already-member', message: 'An account with this email already exists. Sign in instead.' });
      }
      throw error;
    }

    await signInAndSetCookie(invite.email, password, request, response);
    return { success: true, data: { name, email: invite.email } };
  }

  /* ---------------------------------------------------------------- */
  /* Invitations (owner only)                                          */
  /* ---------------------------------------------------------------- */

  @Get('invites')
  @UseGuards(AdminGuard)
  async listInvites() {
    return { success: true, data: await this.invitations.list() };
  }

  @Post('invites')
  @UseGuards(AdminGuard)
  @HttpCode(201)
  async invite(@Body() body: unknown, @Req() request: Request) {
    requireAccounts();
    const email = cleanEmail(field(body, 'email'));
    if (await this.invitations.userExists(email)) {
      throw new ConflictException({ success: false, code: 'already-member', message: 'That person already has an account.' });
    }
    const inviter = accountOf(request);
    const { invite, token } = await this.invitations.create(email, inviter.name);
    const link = inviteLink(token);
    const mail = await this.sendInvite(email, inviter.name, link);
    return { success: true, data: { invite, link, emailed: mail.sent, emailError: mail.error ?? null } };
  }

  @Post('invites/:id/renew')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async renewInvite(@Param('id') id: string, @Req() request: Request) {
    const renewed = await this.invitations.renew(id);
    if (!renewed) throw new NotFoundException({ success: false, message: 'That invitation was already used or does not exist.' });
    const link = inviteLink(renewed.token);
    const mail = await this.sendInvite(renewed.invite.email, accountOf(request).name, link);
    return { success: true, data: { invite: renewed.invite, link, emailed: mail.sent, emailError: mail.error ?? null } };
  }

  @Delete('invites/:id')
  @UseGuards(AdminGuard)
  async revokeInvite(@Param('id') id: string) {
    if (!(await this.invitations.revoke(id))) {
      throw new NotFoundException({ success: false, message: 'That invitation was already used or withdrawn.' });
    }
    return { success: true };
  }

  private sendInvite(email: string, inviter: string, link: string) {
    const { html, text } = actionEmail(
      `${inviter} invited you to Aura Calisthenics`,
      'Set a password to create your account. Your campaign, missions and character are your own — nobody else can see or change them.',
      'Accept the invitation',
      link,
    );
    return sendEmail({ to: email, subject: `${inviter} invited you to Aura Calisthenics`, html, text });
  }

  /* ---------------------------------------------------------------- */
  /* Members (owner only)                                              */
  /* ---------------------------------------------------------------- */

  @Get('members')
  @UseGuards(AdminGuard)
  async members() {
    const { pool: db } = requireAccounts();
    const { rows } = await db.query<{ id: string; name: string; email: string; role: string | null; createdAt: Date }>(
      'SELECT id, name, email, role, "createdAt" FROM "user" ORDER BY "createdAt" ASC',
    );
    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role === 'admin' ? 'admin' : 'user',
        joinedAt: new Date(row.createdAt).toISOString(),
      })),
    };
  }

  /** Lets the owner unlock someone who forgot their password while email is off. */
  @Post('members/:id/password')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async setPassword(@Param('id') id: string, @Body() body: unknown, @Req() request: Request) {
    const { auth: api } = requireAccounts();
    const newPassword = cleanPassword(field(body, 'password'));
    const headers = fromNodeHeaders(request.headers);
    await api.api.setUserPassword({ body: { userId: id, newPassword }, headers });
    if (id !== accountOf(request).id) await api.api.revokeUserSessions({ body: { userId: id }, headers });
    return { success: true };
  }

  @Delete('members/:id')
  @UseGuards(AdminGuard)
  async removeMember(@Param('id') id: string, @Req() request: Request) {
    const { auth: api } = requireAccounts();
    if (id === accountOf(request).id) {
      throw new BadRequestException({ success: false, message: 'You cannot remove your own account.' });
    }
    await api.api.removeUser({ body: { userId: id }, headers: fromNodeHeaders(request.headers) });
    await this.store.delete(saveKey(id));
    await this.store.delete(`plan:${id}`);
    return { success: true };
  }
}
