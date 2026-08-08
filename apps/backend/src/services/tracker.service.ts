import { Injectable } from '@nestjs/common';
import { WeekPlanBlock, MonthlyCalendarSchedule } from '@aura/types';
import { JsonFileRepository } from '../repositories/json-file.repository';

export interface TrackerStorageData {
  blocks: WeekPlanBlock[];
  calendar: MonthlyCalendarSchedule;
}

@Injectable()
export class TrackerService {
  private repository: JsonFileRepository<TrackerStorageData>;

  constructor() {
    this.repository = new JsonFileRepository<TrackerStorageData>('tracker-schedule.json', {
      blocks: [],
      calendar: {
        year: 2026,
        month: 8,
        weeks: [
          { weekIndex: 1, assignedBlockId: null, isCompleted: false },
          { weekIndex: 2, assignedBlockId: null, isCompleted: false },
          { weekIndex: 3, assignedBlockId: null, isCompleted: false },
          { weekIndex: 4, assignedBlockId: null, isCompleted: false },
        ],
      },
    });
  }

  async getBlocks(): Promise<WeekPlanBlock[]> {
    const data = await this.repository.read();
    return data.blocks;
  }

  async createBlock(blockDto: Omit<WeekPlanBlock, 'id' | 'createdAt'>): Promise<WeekPlanBlock> {
    const data = await this.repository.read();
    const newBlock: WeekPlanBlock = {
      ...blockDto,
      id: `block_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    data.blocks.push(newBlock);
    await this.repository.write(data);
    return newBlock;
  }

  async updateBlock(id: string, blockDto: Partial<WeekPlanBlock>): Promise<WeekPlanBlock> {
    const data = await this.repository.read();
    const index = data.blocks.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Block with ID ${id} not found`);
    }

    data.blocks[index] = { ...data.blocks[index], ...blockDto };
    await this.repository.write(data);
    return data.blocks[index];
  }

  async deleteBlock(id: string): Promise<{ success: boolean }> {
    const data = await this.repository.read();
    data.blocks = data.blocks.filter((b) => b.id !== id);

    // Unassign from calendar weeks
    data.calendar.weeks.forEach((w) => {
      if (w.assignedBlockId === id) {
        w.assignedBlockId = null;
        w.assignedBlockName = undefined;
      }
    });

    await this.repository.write(data);
    return { success: true };
  }

  async getCalendar(): Promise<MonthlyCalendarSchedule> {
    const data = await this.repository.read();
    return data.calendar;
  }

  async scheduleWeekBlock(weekIndex: number, blockId: string | null): Promise<MonthlyCalendarSchedule> {
    const data = await this.repository.read();
    const week = data.calendar.weeks.find((w) => w.weekIndex === weekIndex);

    if (week) {
      week.assignedBlockId = blockId;
      if (blockId) {
        const block = data.blocks.find((b) => b.id === blockId);
        week.assignedBlockName = block ? block.name : undefined;
      } else {
        week.assignedBlockName = undefined;
      }
    }

    await this.repository.write(data);
    return data.calendar;
  }
}
