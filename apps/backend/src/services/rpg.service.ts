import { Injectable } from '@nestjs/common';
import { UserProgress } from '@aura/types';
import { JsonFileRepository } from '../repositories/json-file.repository';

@Injectable()
export class RpgService {
  private repository: JsonFileRepository<UserProgress>;

  constructor() {
    this.repository = new JsonFileRepository<UserProgress>('user-rpg.json', {
      masteredIds: ['ex_0', 'ex_4', 'ex_7', 'ex_11'],
      currentLevel: 3,
      totalXp: 900,
    });
  }

  async getProgress(): Promise<UserProgress> {
    return this.repository.read();
  }

  async toggleMastered(exerciseId: string): Promise<UserProgress> {
    const current = await this.repository.read();
    const isAlreadyMastered = current.masteredIds.includes(exerciseId);

    let updatedMasteredIds: string[];
    if (isAlreadyMastered) {
      updatedMasteredIds = current.masteredIds.filter((id) => id !== exerciseId);
    } else {
      updatedMasteredIds = [...current.masteredIds, exerciseId];
    }

    const totalXp = updatedMasteredIds.length * 150;
    const currentLevel = Math.max(1, Math.floor(updatedMasteredIds.length / 3) + 1);

    const updated: UserProgress = {
      masteredIds: updatedMasteredIds,
      currentLevel,
      totalXp,
    };

    await this.repository.write(updated);
    return updated;
  }

  async unlockDemo(): Promise<UserProgress> {
    const demoIds = ['ex_0', 'ex_1', 'ex_2', 'ex_3', 'ex_4', 'ex_7', 'ex_11', 'ex_20'];
    const current = await this.repository.read();
    const unique = Array.from(new Set([...current.masteredIds, ...demoIds]));

    const updated: UserProgress = {
      masteredIds: unique,
      currentLevel: 4,
      totalXp: unique.length * 150,
    };

    await this.repository.write(updated);
    return updated;
  }

  async resetProgress(): Promise<UserProgress> {
    const reset: UserProgress = {
      masteredIds: [],
      currentLevel: 1,
      totalXp: 0,
    };

    await this.repository.write(reset);
    return reset;
  }
}
