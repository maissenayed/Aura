import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SignedInGuard } from '../auth/account.js';
import { ExercisesService } from '../services/exercises.service.js';

/** Only for signed-in players, like everything else on the server. */
@Controller('api/v1/exercises')
@UseGuards(SignedInGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  /**
   * The exercise list. Send the version you already have as `version`: if it
   * is still current, `exercises` comes back null and nothing is downloaded.
   */
  @Get()
  async list(@Query('version') version?: string) {
    return { success: true, data: await this.exercisesService.since(version) };
  }
}
