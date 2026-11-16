import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/account.js';
import { ExercisesService } from '../services/exercises.service.js';
import { rawExercises } from '../data/rawExercisesData.js';

/** The dataset tools are the owner's alone. */
@Controller('api/v1/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('exercises')
  async getRawDataset() {
    return { success: true, data: rawExercises };
  }

  @Post('save-dataset')
  async saveDataset(@Body() body: { rawExercises: any[] }) {
    const result = await this.exercisesService.saveFullDataset(body.rawExercises || rawExercises);
    return result;
  }
}
