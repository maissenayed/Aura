import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard, SignedInGuard, accountOf } from '../auth/account.js';
import { CrewService } from '../services/crew.service.js';

const text = (body: unknown, key: string): string => {
  const value = (body as Record<string, unknown> | null)?.[key];
  if (typeof value !== 'string' || !value.trim()) throw new BadRequestException({ success: false, message: `Expected ${key}.` });
  return value.trim();
};

/** Leaderboards and social play between the athletes the owner has invited. */
@Controller('api/v1/crew')
@UseGuards(SignedInGuard)
export class CrewController {
  constructor(private readonly crew: CrewService) {}

  @Get('board')
  async board(@Req() request: Request, @Query('week') week?: string) {
    return { success: true, data: await this.crew.board(accountOf(request), week) };
  }

  @Get('feed')
  async feed(@Req() request: Request) {
    return { success: true, data: await this.crew.feed(accountOf(request)) };
  }

  @Post('chalk')
  @HttpCode(200)
  async chalk(@Req() request: Request, @Body() body: unknown) {
    return { success: true, data: await this.crew.chalk(accountOf(request), text(body, 'id')) };
  }

  @Post('witness')
  @HttpCode(200)
  async witness(@Req() request: Request, @Body() body: unknown) {
    return { success: true, data: await this.crew.witness(accountOf(request), text(body, 'id')) };
  }

  @Post('flags')
  @HttpCode(200)
  async flag(@Req() request: Request, @Body() body: unknown) {
    const item = (body as Record<string, unknown> | null)?.item;
    return { success: true, data: await this.crew.flag(accountOf(request), text(body, 'target'), text(body, 'reason'), typeof item === 'string' ? item : null) };
  }

  @Get('flags')
  @UseGuards(AdminGuard)
  async flags() {
    return { success: true, data: await this.crew.flags() };
  }

  /** The owner's view of who is on the board, who trains privately and who has open flags. */
  @Get('roster')
  @UseGuards(AdminGuard)
  async roster() {
    return { success: true, data: await this.crew.roster() };
  }

  @Post('flags/:id/resolve')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async resolve(@Param('id') id: string, @Body() body: unknown) {
    const action = text(body, 'action');
    if (action !== 'clear' && action !== 'uphold') throw new BadRequestException({ success: false, message: 'Expected clear or uphold.' });
    return { success: true, data: await this.crew.resolveFlag(id, action) };
  }

  @Get('duels')
  async duels(@Req() request: Request) {
    return { success: true, data: await this.crew.duels(accountOf(request)) };
  }

  @Post('duels')
  @HttpCode(200)
  async challenge(@Req() request: Request, @Body() body: unknown) {
    return { success: true, data: await this.crew.challenge(accountOf(request), text(body, 'rival')) };
  }

  @Get('spotters')
  async spotters(@Req() request: Request) {
    return { success: true, data: await this.crew.spotters(accountOf(request)) };
  }

  @Put('spotters')
  async setSpotters(@Req() request: Request, @Body() body: unknown) {
    const ids = (body as Record<string, unknown> | null)?.ids;
    if (!Array.isArray(ids)) throw new BadRequestException({ success: false, message: 'Expected ids.' });
    return { success: true, data: await this.crew.setSpotters(accountOf(request), ids as string[]) };
  }

  @Get('regulars')
  async regulars() {
    return { success: true, data: await this.crew.regulars() };
  }

  @Get('settings')
  async settings(@Req() request: Request) {
    return { success: true, data: await this.crew.settings(accountOf(request).id) };
  }

  @Put('settings')
  async saveSettings(@Req() request: Request, @Body() body: unknown) {
    return { success: true, data: await this.crew.saveSettings(accountOf(request).id, (body ?? {}) as Record<string, unknown>) };
  }

  @Get('me')
  async me(@Req() request: Request) {
    return { success: true, data: await this.crew.awards(accountOf(request)) };
  }

  @Get('card/:id')
  async card(@Param('id') id: string) {
    const card = await this.crew.card(id);
    if (!card) throw new NotFoundException({ success: false, message: 'No card to show.' });
    return { success: true, data: card };
  }
}
