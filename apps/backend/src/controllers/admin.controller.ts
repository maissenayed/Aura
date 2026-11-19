import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/account.js';
import { ExercisesService } from '../services/exercises.service.js';

/**
 * Editing the exercise list is the owner's alone. Every change answers with
 * the whole list and its new version, so the page that made it is current at once.
 */
@Controller('api/v1/admin/exercises')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  async create(@Body() body: unknown) {
    return { success: true, data: await this.exercisesService.create(body) };
  }

  /** Puts the built-in list back. Registered before `:id` so it is never read as an id. */
  @Post('restore')
  async restore() {
    return { success: true, data: await this.exercisesService.restoreBuiltIn() };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    return { success: true, data: await this.exercisesService.update(id, body) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return { success: true, data: await this.exercisesService.remove(id) };
  }
}
