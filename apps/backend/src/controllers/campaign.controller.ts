import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CampaignPasscodeGuard } from '../guards/campaign-passcode.guard';
import {
  CampaignAuthService,
  PASSCODE_MAX_LENGTH,
  PASSCODE_MIN_LENGTH,
} from '../services/campaign-auth.service';
import { CampaignService, isCampaignSave } from '../services/campaign.service';

function requirePasscode(body: unknown): string {
  const passcode = (body as { passcode?: unknown } | null)?.passcode;
  if (typeof passcode !== 'string' || passcode.length < PASSCODE_MIN_LENGTH || passcode.length > PASSCODE_MAX_LENGTH) {
    throw new BadRequestException({
      success: false,
      code: 'bad-passcode',
      message: `Passcode must be ${PASSCODE_MIN_LENGTH}–${PASSCODE_MAX_LENGTH} characters.`,
    });
  }
  return passcode;
}

@Controller('api/v1/campaign')
export class CampaignController {
  constructor(
    private readonly campaign: CampaignService,
    private readonly auth: CampaignAuthService,
  ) {}

  /** Public: tells the client whether to show the board, a lock screen, or the set-passcode screen. */
  @Get('status')
  async status() {
    const protection = this.auth.protection;
    return {
      success: true,
      data: {
        protection,
        claimed: protection === 'passcode' ? await this.auth.isClaimed() : false,
        storage: this.campaign.storage,
      },
    };
  }

  /** First visitor sets the passcode. Refused once one exists. */
  @Post('claim')
  @HttpCode(201)
  async claim(@Body() body: unknown) {
    if (this.auth.protection === 'none') {
      throw new BadRequestException({ success: false, code: 'unprotected', message: 'Passcode protection is off.' });
    }
    const passcode = requirePasscode(body);
    if (!(await this.auth.claim(passcode))) {
      throw new ConflictException({ success: false, code: 'already-claimed', message: 'A passcode is already set.' });
    }
    return { success: true };
  }

  /** Lets a new device check a passcode before it stores it. */
  @Post('unlock')
  @HttpCode(200)
  async unlock(@Body() body: unknown) {
    const passcode = requirePasscode(body);
    if (!(await this.auth.verify(passcode))) {
      throw new UnauthorizedException({ success: false, code: 'locked', message: 'Wrong passcode.' });
    }
    return { success: true };
  }

  @Get()
  @UseGuards(CampaignPasscodeGuard)
  async load() {
    return { success: true, data: await this.campaign.load() };
  }

  @Put()
  @UseGuards(CampaignPasscodeGuard)
  async save(@Body() body: unknown) {
    const { baseRev, save } = (body ?? {}) as { baseRev?: unknown; save?: unknown };
    if (typeof baseRev !== 'number' || !Number.isInteger(baseRev) || baseRev < 0 || !isCampaignSave(save)) {
      throw new BadRequestException({ success: false, code: 'bad-save', message: 'Expected { baseRev, save }.' });
    }

    const result = await this.campaign.write(save, baseRev);
    if (result.ok === false) {
      throw new ConflictException({ success: false, code: 'conflict', data: result.current });
    }
    return { success: true, data: { rev: result.doc.rev, updatedAt: result.doc.updatedAt } };
  }
}
