import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';

/** Who is making the request, as the campaign sees them. */
export interface Account {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

/** With no database there is one implicit athlete who owns everything. */
export const LOCAL_ACCOUNT: Account = { id: 'local', name: 'You', email: '', role: 'admin' };

export const accountsEnabled = () => auth !== null;

export async function readAccount(request: Request): Promise<Account | null> {
  if (!auth) return LOCAL_ACCOUNT;
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) return null;
  const { user } = session;
  return { id: user.id, name: user.name, email: user.email, role: user.role === 'admin' ? 'admin' : 'user' };
}

type RequestWithAccount = Request & { account?: Account };

export function accountOf(request: Request): Account {
  const account = (request as RequestWithAccount).account;
  if (!account) throw new UnauthorizedException({ success: false, code: 'signed-out', message: 'Sign in first.' });
  return account;
}

@Injectable()
export class SignedInGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAccount>();
    const account = await readAccount(request);
    if (!account) throw new UnauthorizedException({ success: false, code: 'signed-out', message: 'Sign in first.' });
    request.account = account;
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAccount>();
    const account = await readAccount(request);
    if (!account) throw new UnauthorizedException({ success: false, code: 'signed-out', message: 'Sign in first.' });
    if (account.role !== 'admin') {
      throw new ForbiddenException({ success: false, code: 'not-admin', message: 'Only the owner can do that.' });
    }
    request.account = account;
    return true;
  }
}
