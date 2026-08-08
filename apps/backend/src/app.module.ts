import { Module } from '@nestjs/common';
import { ExercisesController } from './controllers/exercises.controller';
import { AnatomyController } from './controllers/anatomy.controller';
import { RpgController } from './controllers/rpg.controller';
import { TrackerController } from './controllers/tracker.controller';
import { AdminController } from './controllers/admin.controller';
import { ExercisesService } from './services/exercises.service';
import { AnatomyService } from './services/anatomy.service';
import { RpgService } from './services/rpg.service';
import { TrackerService } from './services/tracker.service';

@Module({
  imports: [],
  controllers: [
    ExercisesController,
    AnatomyController,
    RpgController,
    TrackerController,
    AdminController,
  ],
  providers: [
    ExercisesService,
    AnatomyService,
    RpgService,
    TrackerService,
  ],
})
export class AppModule {}
