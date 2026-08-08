import { WeekPlanBlock, MonthlyCalendarSchedule } from '@aura/types';

export interface TrackerPageContext {
  blocks: WeekPlanBlock[];
  calendar: MonthlyCalendarSchedule;
}

export async function getPageContext(): Promise<TrackerPageContext> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

  let blocks: WeekPlanBlock[] = [
    {
      id: 'block_14kg_hypertrophy',
      name: '14kg Hypertrophy Block',
      description: 'Specialized 14kg weight vest & ring progression block for upper body volume.',
      category: 'Push',
      focusGoal: 'Dip & Push-up Progressive Overload',
      equipmentRequired: [
        '14kg Weight Vest',
        'Gymnastic Rings',
        'Dip Belt & Weights',
        'Parallettes',
      ],
      createdAt: '2026-08-01T00:00:00.000Z',
      days: [
        {
          dayName: 'Monday',
          isRestDay: false,
          routineTitle: 'Weighted Push & Dip Overload',
          exerciseIds: ['ex_2', 'ex_3', 'ex_67'],
          sets: [
            { setNumber: 1, reps: 8, weightKg: 14, rpe: 8, restSeconds: 120, completed: true },
            { setNumber: 2, reps: 8, weightKg: 14, rpe: 8, restSeconds: 120, completed: true },
          ],
          equipmentRequired: ['14kg Weight Vest', 'Dip Belt & Weights'],
        },
        {
          dayName: 'Tuesday',
          isRestDay: false,
          routineTitle: 'Ring Pull & Lats Focus',
          exerciseIds: ['ex_101', 'ex_105'],
          sets: [
            { setNumber: 1, reps: 10, weightKg: 0, rpe: 7, restSeconds: 90, completed: true },
          ],
          equipmentRequired: ['Gymnastic Rings', '14kg Weight Vest'],
        },
        { dayName: 'Wednesday', isRestDay: true, routineTitle: 'Active Recovery', exerciseIds: [], sets: [], equipmentRequired: [] },
        { dayName: 'Thursday', isRestDay: false, routineTitle: 'Legs & Core', exerciseIds: ['ex_301'], sets: [], equipmentRequired: ['14kg Weight Vest'] },
        { dayName: 'Friday', isRestDay: false, routineTitle: 'Skill Holds', exerciseIds: ['ex_0'], sets: [], equipmentRequired: ['Parallettes'] },
        { dayName: 'Saturday', isRestDay: true, routineTitle: 'Rest', exerciseIds: [], sets: [], equipmentRequired: [] },
        { dayName: 'Sunday', isRestDay: true, routineTitle: 'Rest', exerciseIds: [], sets: [], equipmentRequired: [] },
      ],
    },
  ];

  let calendar: MonthlyCalendarSchedule = {
    year: 2026,
    month: 8,
    weeks: [
      { weekIndex: 1, assignedBlockId: 'block_14kg_hypertrophy', assignedBlockName: '14kg Hypertrophy Block', isCompleted: true },
      { weekIndex: 2, assignedBlockId: 'block_14kg_hypertrophy', assignedBlockName: '14kg Hypertrophy Block', isCompleted: false },
      { weekIndex: 3, assignedBlockId: null, isCompleted: false },
      { weekIndex: 4, assignedBlockId: null, isCompleted: false },
    ],
  };

  try {
    const [blocksRes, calRes] = await Promise.all([
      fetch(`${API_BASE}/tracker/blocks`, { cache: 'no-store' }),
      fetch(`${API_BASE}/tracker/calendar`, { cache: 'no-store' }),
    ]);

    if (blocksRes.ok) {
      const json = await blocksRes.json();
      if (json.success && Array.isArray(json.data)) {
        blocks = json.data;
      }
    }

    if (calRes.ok) {
      const json = await calRes.json();
      if (json.success && json.data) {
        calendar = json.data;
      }
    }
  } catch (err) {
    console.warn('Backend API offline during SSR tracker fetch, using initial state', err);
  }

  return {
    blocks,
    calendar,
  };
}
