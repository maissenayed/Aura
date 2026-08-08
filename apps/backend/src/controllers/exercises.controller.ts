import { Controller, Get, Param, Query } from '@nestjs/common';
import { ExercisesService } from '../services/exercises.service';

@Controller('api/v1/exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  async getExercises(
    @Query('swimlane') swimlane?: string,
    @Query('minLevel') minLevel?: number,
    @Query('maxLevel') maxLevel?: number,
    @Query('search') search?: string
  ) {
    const result = await this.exercisesService.getAllExercises({
      swimlane,
      minLevel,
      maxLevel,
      search,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  async getExerciseById(@Param('id') id: string) {
    const data = await this.exercisesService.getExerciseById(id);
    return { success: true, data };
  }
}
