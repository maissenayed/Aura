import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnatomyService } from '../services/anatomy.service';

@Controller('api/v1/anatomy')
export class AnatomyController {
  constructor(private readonly anatomyService: AnatomyService) {}

  @Get('muscles')
  async getAllMuscles() {
    const data = await this.anatomyService.getAllMuscles();
    return { success: true, data };
  }

  @Get('muscles/:id')
  async getMuscleById(@Param('id') id: string) {
    const data = await this.anatomyService.getMuscleById(id);
    return { success: true, data };
  }

  @Get('muscles/:id/exercises')
  async getTargetedExercises(
    @Param('id') id: string,
    @Query('minLevel') minLevel?: number,
    @Query('maxLevel') maxLevel?: number
  ) {
    const data = await this.anatomyService.getTargetedExercises(
      id,
      minLevel ? Number(minLevel) : 1,
      maxLevel ? Number(maxLevel) : 20
    );
    return { success: true, data };
  }
}
