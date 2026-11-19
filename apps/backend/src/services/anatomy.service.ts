import { Injectable } from '@nestjs/common';
import { MuscleMetadata, Exercise } from '@aura/types';
import { MUSCLE_DICTIONARY, getMuscleInfo, getExercisesForMuscle } from '../data/muscleData.js';
import { ExercisesService } from './exercises.service.js';

@Injectable()
export class AnatomyService {
  constructor(private readonly exercises: ExercisesService) {}

  async getAllMuscles(): Promise<MuscleMetadata[]> {
    return Object.values(MUSCLE_DICTIONARY);
  }

  async getMuscleById(id: string): Promise<MuscleMetadata | null> {
    return getMuscleInfo(id);
  }

  async getTargetedExercises(id: string, minLevel: number = 1, maxLevel: number = 20): Promise<Exercise[]> {
    await this.exercises.syncEngine();
    return getExercisesForMuscle(id, minLevel, maxLevel);
  }
}
