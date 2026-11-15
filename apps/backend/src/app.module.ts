import { Module } from '@nestjs/common';
import { ExercisesController } from './controllers/exercises.controller.js';
import { AnatomyController } from './controllers/anatomy.controller.js';
import { RpgController } from './controllers/rpg.controller.js';
import { TrackerController } from './controllers/tracker.controller.js';
import { AdminController } from './controllers/admin.controller.js';
import { CampaignController } from './controllers/campaign.controller.js';
import { ExercisesService } from './services/exercises.service.js';
import { AnatomyService } from './services/anatomy.service.js';
import { RpgService } from './services/rpg.service.js';
import { TrackerService } from './services/tracker.service.js';
import { CampaignService } from './services/campaign.service.js';
import { CampaignAuthService } from './services/campaign-auth.service.js';
import { CampaignPasscodeGuard } from './guards/campaign-passcode.guard.js';
import { KEY_VALUE_STORE, createKeyValueStore } from './repositories/key-value.store.js';

@Module({
  imports: [],
  controllers: [
    ExercisesController,
    AnatomyController,
    RpgController,
    TrackerController,
    AdminController,
    CampaignController,
  ],
  providers: [
    ExercisesService,
    AnatomyService,
    RpgService,
    TrackerService,
    CampaignService,
    CampaignAuthService,
    CampaignPasscodeGuard,
    { provide: KEY_VALUE_STORE, useFactory: createKeyValueStore },
  ],
})
export class AppModule {}
