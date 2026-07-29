import { Exercise, RawExercise, Swimlane } from '../types/exercise';
import { rawExercises } from './rawExercisesData';

export { rawExercises };

// Helper to determine Swimlane from category and subCategory
export function getSwimlane(category: string, subCategory: string): Swimlane {
  const cat = category.toLowerCase();
  const sub = subCategory.toLowerCase();

  // 1. Check Legs FIRST
  if (
    cat.includes('leg') || 
    cat.includes('lower') || 
    cat.includes('squat') ||
    sub.includes('leg') ||
    sub.includes('squat') || 
    sub.includes('glute') || 
    sub.includes('ham') || 
    sub.includes('shrimp') || 
    sub.includes('quad') ||
    sub.includes('curl') ||
    sub.includes('nordic') ||
    sub.includes('pistol') ||
    sub.includes('lunge') ||
    sub.includes('calf') ||
    sub.includes('calves')
  ) {
    return 'Legs';
  }

  // 2. Check Push
  if (
    cat.includes('pushing') || 
    sub.includes('pushups') || 
    sub.includes('pushup') || 
    sub.includes('dips') || 
    sub.includes('dip') || 
    sub.includes('planche') || 
    sub.includes('handstand')
  ) {
    return 'Push';
  }

  // 3. Check Pull
  if (
    cat.includes('pulling') || 
    sub.includes('pull-up') || 
    sub.includes('pullup') || 
    sub.includes('rows') || 
    sub.includes('row') || 
    sub.includes('lever') || 
    sub.includes('cross') || 
    sub.includes('chin-up')
  ) {
    return 'Pull';
  }

  // 4. Default to Core
  return 'Core';
}

// Generate enriched exercises with prerequisite chains
export function enrichExercises(rawList: RawExercise[]): Exercise[] {
  const subCategoryGroups: Record<string, RawExercise[]> = {};
  
  rawList.forEach(ex => {
    if (!subCategoryGroups[ex.subCategory]) {
      subCategoryGroups[ex.subCategory] = [];
    }
    subCategoryGroups[ex.subCategory].push(ex);
  });

  const prereqMap: Record<string, string[]> = {};

  Object.values(subCategoryGroups).forEach(group => {
    group.sort((a, b) => a.level - b.level);

    for (let i = 0; i < group.length; i++) {
      const current = group[i];
      const prereqs: string[] = [];

      if (i > 0) {
        const prev = group[i - 1];
        if (prev.level < current.level) {
          prereqs.push(prev.id);
        } else if (i > 1 && group[i - 2].level < current.level) {
          prereqs.push(group[i - 2].id);
        }
      }

      prereqMap[current.id] = prereqs;
    }
  });

  const crossBranchLinks: Record<string, string[]> = {
    'ex_48': ['ex_7'],
    'ex_79': ['ex_45', 'ex_50'],
    'ex_112': ['ex_45', 'ex_50'],
    'ex_67': ['ex_44'],
    'ex_43': ['ex_3'],
    'ex_210': ['ex_105'],
    'ex_205': ['ex_67'],
    'ex_323': ['ex_2'],
    'ex_240': ['ex_45'],
    'ex_348': ['ex_205'],
  };

  return rawList.map(raw => {
    const swimlane = getSwimlane(raw.category, raw.subCategory);
    
    // Use explicit prerequisites if provided, otherwise compute default prerequisites
    let allPrereqs: string[];
    if (Array.isArray(raw.prerequisites)) {
      allPrereqs = raw.prerequisites;
    } else {
      const subCategoryPrereqs = prereqMap[raw.id] || [];
      const extraPrereqs = crossBranchLinks[raw.id] || [];
      allPrereqs = Array.from(new Set([...subCategoryPrereqs, ...extraPrereqs]));
    }

    let muscles: string[] = [];
    if (swimlane === 'Push') muscles = ['Chest', 'Front Delts', 'Triceps', 'Core'];
    else if (swimlane === 'Pull') muscles = ['Lats', 'Rhomboids', 'Biceps', 'Grip', 'Rear Delts'];
    else if (swimlane === 'Legs') muscles = ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'];
    else muscles = ['Abs', 'Obliques', 'Lower Back', 'Shoulders'];

    let req = `Master level ${Math.max(1, raw.level - 1)} prerequisites with strict execution.`;
    if (raw.level <= 3) {
      req = "Perform 3 sets of 12-15 clean repetitions or 20s hold.";
    } else if (raw.level <= 7) {
      req = "Perform 4 sets of 8-10 reps with full range of motion or 15s hold.";
    } else if (raw.level <= 12) {
      req = "Execute 5 sets of 5 controlled reps or 10s isometric hold.";
    } else {
      req = "Pro Level: Execute 5 sets of max effort holds/reps with pristine alignment.";
    }

    const defaultSteps = [
      `1. Position your body in the starting ${raw.name} setup with active tension.`,
      `2. Engage your core, keep your spine aligned, and maintain steady breathing.`,
      `3. Complete the movement under full control with zero momentum.`,
      `4. Return steadily to the starting position.`
    ];

    const youtubeQuery = raw.youtubeQuery || `${raw.name} calisthenics form tutorial`;
    const videoSearchUrl = raw.videoSearchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`;

    return {
      id: raw.id,
      name: raw.name,
      level: Math.min(20, Math.max(1, raw.level)),
      category: raw.category,
      subCategory: raw.subCategory,
      swimlane,
      prerequisites: allPrereqs,
      unlockRequirements: req,
      description: raw.steps || defaultSteps,
      expertTip: raw.expertTip,
      youtubeQuery,
      videoSearchUrl,
      formCues: [
        `Lock out joints fully at completion where applicable.`,
        `Keep shoulders depressed and controlled.`,
        `Maintain total body tension from head to toes.`
      ],
      musclesTargeted: muscles,
      xpReward: raw.level * 150,
      proStatus: raw.level >= 15
    };
  });
}

// Default export of enriched EXERCISES
export const EXERCISES: Exercise[] = enrichExercises(rawExercises);
