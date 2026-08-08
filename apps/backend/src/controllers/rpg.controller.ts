import { Controller, Get, Post, Body } from '@nestjs/common';
import { RpgService } from '../services/rpg.service';

@Controller('api/v1/rpg')
export class RpgController {
  constructor(private readonly rpgService: RpgService) {}

  @Get()
  async getProgress() {
    const data = await this.rpgService.getProgress();
    return { success: true, data };
  }

  @Post('toggle-mastered')
  async toggleMastered(@Body() body: { exerciseId: string }) {
    const data = await this.rpgService.toggleMastered(body.exerciseId);
    return { success: true, data };
  }

  @Post('unlock-demo')
  async unlockDemo() {
    const data = await this.rpgService.unlockDemo();
    return { success: true, data };
  }

  @Post('reset')
  async reset() {
    const data = await this.rpgService.resetProgress();
    return { success: true, data };
  }
}
