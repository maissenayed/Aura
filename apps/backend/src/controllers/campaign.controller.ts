import { BadRequestException, Body, ConflictException, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SignedInGuard, accountOf } from '../auth/account.js';
import { CampaignService, isCampaignPlan, isCampaignSave } from '../services/campaign.service.js';

/** Each signed-in person has their own campaign save and their own plan. */
@Controller('api/v1/campaign')
@UseGuards(SignedInGuard)
export class CampaignController {
  constructor(private readonly campaign: CampaignService) {}

  @Get()
  async load(@Req() request: Request) {
    return { success: true, data: await this.campaign.load(accountOf(request).id) };
  }

  @Put()
  async save(@Req() request: Request, @Body() body: unknown) {
    const { baseRev, save } = (body ?? {}) as { baseRev?: unknown; save?: unknown };
    if (typeof baseRev !== 'number' || !Number.isInteger(baseRev) || baseRev < 0 || !isCampaignSave(save)) {
      throw new BadRequestException({ success: false, code: 'bad-save', message: 'Expected { baseRev, save }.' });
    }

    const result = await this.campaign.write(accountOf(request).id, save, baseRev);
    if (result.ok === false) {
      throw new ConflictException({ success: false, code: 'conflict', data: result.current });
    }
    return { success: true, data: { rev: result.doc.rev, updatedAt: result.doc.updatedAt } };
  }

  @Get('plan')
  async loadPlan(@Req() request: Request) {
    return { success: true, data: await this.campaign.loadPlan(accountOf(request).id) };
  }

  @Put('plan')
  async savePlan(@Req() request: Request, @Body() body: unknown) {
    const { baseRev, plan } = (body ?? {}) as { baseRev?: unknown; plan?: unknown };
    if (typeof baseRev !== 'number' || !Number.isInteger(baseRev) || baseRev < 0 || !isCampaignPlan(plan)) {
      throw new BadRequestException({ success: false, code: 'bad-plan', message: 'Expected { baseRev, plan }.' });
    }

    const result = await this.campaign.writePlan(accountOf(request).id, plan, baseRev);
    if (result.ok === false) {
      throw new ConflictException({ success: false, code: 'conflict', data: result.current });
    }
    return { success: true, data: { rev: result.doc.rev, updatedAt: result.doc.updatedAt } };
  }
}
