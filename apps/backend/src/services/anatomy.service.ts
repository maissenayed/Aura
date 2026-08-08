import { Injectable } from '@nestjs/common';
import { MuscleMetadata, Exercise } from '@aura/types';
import { MUSCLE_DICTIONARY, getMuscleInfo, getExercisesForMuscle } from '../data/muscleData';

@Injectable()
export class AnatomyService {
  async getAllMuscles(): Promise<MuscleMetadata[]> {
    return Object.values(MUSCLE_DICTIONARY);
  }

  async getMuscleById(id: string): Promise<MuscleMetadata | null> {
    return getMuscleInfo(id);
  }

  async getTargetedExercises(id: string, minLevel: number = 1, maxLevel: number = 20): Promise<Exercise[]> {
    return getExercisesForMuscle(id, minLevel, maxLevel);
  }
}
