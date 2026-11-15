import { Module } from '@nestjs/common';
import { ExercisesController } from './controllers/exercises.controller';
import { AnatomyController } from './controllers/anatomy.controller';
import { RpgController } from './controllers/rpg.controller';
import { TrackerController } from './controllers/tracker.controller';
import { AdminController } from './controllers/admin.controller';
import { CampaignController } from './controllers/campaign.controller';
import { ExercisesService } from './services/exercises.service';
import { AnatomyService } from './services/anatomy.service';
import { RpgService } from './services/rpg.service';
import { TrackerService } from './services/tracker.service';
import { CampaignService } from './services/campaign.service';
import { CampaignAuthService } from './services/campaign-auth.service';
import { CampaignPasscodeGuard } from './guards/campaign-passcode.guard';
import { KEY_VALUE_STORE, createKeyValueStore } from './repositories/key-value.store';

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
