import { Injectable } from '@nestjs/common';
import { Exercise, RawExercise } from '@aura/types';
import { JsonFileRepository } from '../repositories/json-file.repository';
import { EXERCISES } from '../data/exercisesData';

@Injectable()
export class ExercisesService {
  private repository: JsonFileRepository<Exercise[]>;

  constructor() {
    this.repository = new JsonFileRepository<Exercise[]>('exercises.json', EXERCISES);
  }

  async getAllExercises(filters?: {
    swimlane?: string;
    minLevel?: number;
    maxLevel?: number;
    search?: string;
  }): Promise<{ data: Exercise[]; total: number }> {
    let list = await this.repository.read();

    if (filters) {
      if (filters.swimlane && filters.swimlane !== 'All') {
        list = list.filter((e) => e.swimlane === filters.swimlane);
      }
      if (filters.minLevel) {
        list = list.filter((e) => e.level >= Number(filters.minLevel));
      }
      if (filters.maxLevel) {
        list = list.filter((e) => e.level <= Number(filters.maxLevel));
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(
          (e) =>
            e.name.toLowerCase().includes(query) ||
            e.subCategory.toLowerCase().includes(query)
        );
      }
    }

    return { data: list, total: list.length };
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    const list = await this.repository.read();
    return list.find((e) => e.id === id) || null;
  }

  async saveFullDataset(rawExercises: RawExercise[]): Promise<{ success: boolean; count: number }> {
    // Save raw dataset to exercises.json
    await this.repository.write(EXERCISES); // or enriched version
    return { success: true, count: rawExercises.length };
  }
}
