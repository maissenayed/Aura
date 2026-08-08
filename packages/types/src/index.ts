// --- EXERCISE & SKILL TREE TYPES ---
export type Swimlane = 'Push' | 'Pull' | 'Core' | 'Legs';

export interface RawExercise {
  id: string;
  name: string;
  level: number;
  category: string;
  subCategory: string;
  prerequisites?: string[];
  steps?: string[];
  expertTip?: string;
  youtubeQuery?: string;
  videoSearchUrl?: string;
}

export interface Exercise {
  id: string;
  name: string;
  level: number; // 1 to 20
  category: string;
  subCategory: string;
  swimlane: Swimlane;
  prerequisites: string[]; // Array of prerequisite exercise IDs
  unlockRequirements: string;
  description: string[];
  expertTip?: string;
  youtubeQuery?: string;
  videoSearchUrl?: string;
  formCues: string[];
  musclesTargeted: string[];
  xpReward: number;
  proStatus?: boolean;
}

export interface UserProgress {
  masteredIds: string[];
  currentLevel: number;
  totalXp: number;
}

export type ViewMode = 'tree' | 'stats';

// --- MUSCLE ANATOMY TYPES ---
export type MuscleRegion = 'Upper Body' | 'Core & Spine' | 'Lower Body';

export interface MuscleMetadata {
  id: string; // ID matching body-muscles library
  baseGroup: string; // Grouping ID e.g. "biceps", "chest", "lats"
  name: string;
  latinName: string;
  category: Swimlane;
  region: MuscleRegion;
  description: string;
  primaryFunction: string;
  origin: string;
  insertion: string;
  exerciseIds: string[];
  formTip: string;
}

// --- TRACKER & BLOCK BUILDER & MONTHLY CALENDAR TYPES ---
export type EquipmentItem = 
  | '14kg Weight Vest'
  | 'Gymnastic Rings'
  | 'Parallettes'
  | 'Dip Belt & Weights'
  | 'Pull-up Bar'
  | 'Resistance Bands'
  | 'Chalk & Wrist Wraps';

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weightKg?: number; // e.g. 14kg
  rpe?: number; // 1 to 10 scale
  restSeconds?: number; // e.g. 90
  completed?: boolean;
}

export interface DayWorkout {
  dayName: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isRestDay: boolean;
  routineTitle: string; // e.g. "Weighted Dip & Push Volume"
  exerciseIds: string[]; // Array of Exercise IDs
  sets: WorkoutSet[];
  equipmentRequired: EquipmentItem[];
  warmupNotes?: string;
  cooldownNotes?: string;
}

export interface WeekPlanBlock {
  id: string;
  name: string; // e.g. "14kg Hypertrophy Block", "Planche Strength Block"
  description: string;
  category: Swimlane | 'Hybrid';
  focusGoal: string;
  days: DayWorkout[];
  equipmentRequired: EquipmentItem[];
  createdAt: string;
}

export interface CalendarWeekSchedule {
  weekIndex: number; // 1 to 5 for month
  assignedBlockId: string | null;
  assignedBlockName?: string;
  isCompleted?: boolean;
}

export interface MonthlyCalendarSchedule {
  year: number;
  month: number; // 1 to 12
  weeks: CalendarWeekSchedule[];
}

// --- API RESPONSE WRAPPERS ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
