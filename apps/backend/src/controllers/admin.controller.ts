import { Controller, Get, Post, Body } from '@nestjs/common';
import { ExercisesService } from '../services/exercises.service';
import { rawExercises } from '../data/rawExercisesData';

@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('exercises')
  async getRawDataset() {
    return { success: true, data: rawExercises };
  }

  @Post('save-dataset')
  async saveDataset(@Body() body: { rawExercises: any[] }) {
    const result = await this.exercisesService.saveFullDataset(body.rawExercises || rawExercises);
    return { success: true, ...result };
  }
}
