import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SignedInGuard } from '../auth/account.js';
import { TrackerService } from '../services/tracker.service.js';

/** Only for signed-in players, like everything else on the server. */
@Controller('api/v1/tracker')
@UseGuards(SignedInGuard)
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}

  @Get('blocks')
  async getBlocks() {
    const data = await this.trackerService.getBlocks();
    return { success: true, data };
  }

  @Post('blocks')
  async createBlock(@Body() body: any) {
    const data = await this.trackerService.createBlock(body);
    return { success: true, data };
  }

  @Put('blocks/:id')
  async updateBlock(@Param('id') id: string, @Body() body: any) {
    const data = await this.trackerService.updateBlock(id, body);
    return { success: true, data };
  }

  @Delete('blocks/:id')
  async deleteBlock(@Param('id') id: string) {
    const result = await this.trackerService.deleteBlock(id);
    return result;
  }

  @Get('calendar')
  async getCalendar() {
    const data = await this.trackerService.getCalendar();
    return { success: true, data };
  }

  @Post('calendar/schedule')
  async scheduleWeekBlock(@Body() body: { weekIndex: number; blockId: string | null }) {
    const data = await this.trackerService.scheduleWeekBlock(body.weekIndex, body.blockId);
    return { success: true, data };
  }
}
