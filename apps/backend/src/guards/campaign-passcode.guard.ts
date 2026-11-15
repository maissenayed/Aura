import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { CampaignAuthService } from '../services/campaign-auth.service.js';

export const PASSCODE_HEADER = 'x-campaign-passcode';

/** The header carries the passcode URI-encoded, so any character survives the trip. */
export function readPasscode(request: Request): string | undefined {
  const raw = request.headers[PASSCODE_HEADER];
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return undefined;
  }
}

@Injectable()
export class CampaignPasscodeGuard implements CanActivate {
  constructor(private readonly auth: CampaignAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.auth.protection === 'none') return true;

    if (!(await this.auth.isClaimed())) {
      throw new ForbiddenException({ success: false, code: 'unclaimed', message: 'Set a passcode first.' });
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (await this.auth.verify(readPasscode(request))) return true;

    throw new UnauthorizedException({ success: false, code: 'locked', message: 'Wrong or missing passcode.' });
  }
}
