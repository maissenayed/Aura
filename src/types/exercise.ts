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
  level: number; // 1 to 16+ (Strength Level indicator 1-20 scale)
  category: string;
  subCategory: string;
  swimlane: Swimlane;
  prerequisites: string[]; // Array of exercise IDs required to unlock
  unlockRequirements: string;
  description: string[]; // Step-by-step instructions (steps)
  expertTip?: string; // Pro tip / form cue from coach
  youtubeQuery?: string; // YouTube search query for video embed
  videoSearchUrl?: string; // Direct YouTube search URL
  formCues: string[];
  musclesTargeted: string[];
  xpReward: number;
  proStatus?: boolean; // True if level >= 15
}

export interface UserProgress {
  masteredIds: string[];
  currentLevel: number;
  totalXp: number;
}

export type ViewMode = 'tree' | 'stats';
