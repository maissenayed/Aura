import { MUSCLE_MAP } from 'body-muscles';
import type { Exercise } from '@aura/types';
import { MUSCLE_DICTIONARY, MuscleMetadata, getExercisesForMuscle } from '../../data/muscleData';

/**
 * The anatomy page works in muscle groups (chest, lats, quads…) rather than
 * the 70-odd single paths the body map draws. This file says which paths make
 * up a group, which side of the body it is on, and which groups an exercise
 * trains, so today's quest can light the body up.
 */

export type MuscleGroup =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'lats'
  | 'traps'
  | 'lowerback'
  | 'abs'
  | 'obliques'
  | 'serratus'
  | 'hipflexors'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'calves'
  | 'tibialis'
  | 'neck';

export type BodySide = 'front' | 'back';

/** Every group, in the order the chips show them, with the side it is best seen from. */
export const GROUPS: { id: MuscleGroup; name: string; side: BodySide }[] = [
  { id: 'chest', name: 'Chest', side: 'front' },
  { id: 'shoulders', name: 'Shoulders', side: 'front' },
  { id: 'biceps', name: 'Biceps', side: 'front' },
  { id: 'triceps', name: 'Triceps', side: 'back' },
  { id: 'forearms', name: 'Forearms', side: 'front' },
  { id: 'lats', name: 'Lats', side: 'back' },
  { id: 'traps', name: 'Traps', side: 'back' },
  { id: 'lowerback', name: 'Lower back', side: 'back' },
  { id: 'abs', name: 'Abs', side: 'front' },
  { id: 'obliques', name: 'Obliques', side: 'front' },
  { id: 'serratus', name: 'Serratus', side: 'front' },
  { id: 'hipflexors', name: 'Hip flexors', side: 'front' },
  { id: 'glutes', name: 'Glutes', side: 'back' },
  { id: 'quads', name: 'Quads', side: 'front' },
  { id: 'hamstrings', name: 'Hamstrings', side: 'back' },
  { id: 'adductors', name: 'Adductors', side: 'front' },
  { id: 'calves', name: 'Calves', side: 'back' },
  { id: 'tibialis', name: 'Shins', side: 'front' },
  { id: 'neck', name: 'Neck', side: 'front' },
];

export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((group) => [group.id, group])) as Record<
  MuscleGroup,
  (typeof GROUPS)[number]
>;

/** Body-map path id → its group. Heads, hands, knees and feet belong to none. */
const PATH_GROUP: [RegExp, MuscleGroup][] = [
  [/^chest-/, 'chest'],
  [/^(shoulder|deltoid)-/, 'shoulders'],
  [/^biceps-/, 'biceps'],
  [/^triceps-/, 'triceps'],
  [/^forearm-/, 'forearms'],
  [/^lats-/, 'lats'],
  [/^traps-/, 'traps'],
  [/^(lower-back|erector)-/, 'lowerback'],
  [/^abs-/, 'abs'],
  [/^obliques-/, 'obliques'],
  [/^serratus-/, 'serratus'],
  [/^hip-flexor-/, 'hipflexors'],
  [/^gluteus-/, 'glutes'],
  [/^quads-/, 'quads'],
  [/^hamstrings-/, 'hamstrings'],
  [/^adductors-/, 'adductors'],
  [/^calves-/, 'calves'],
  [/^tibialis-/, 'tibialis'],
  [/^(neck-|nape$)/, 'neck'],
];

export function groupOfPath(pathId: string): MuscleGroup | null {
  return PATH_GROUP.find(([pattern]) => pattern.test(pathId))?.[1] ?? null;
}

/** Every path the body map draws, with its group. */
export const BODY_PATHS: { id: string; group: MuscleGroup | null }[] = MUSCLE_MAP.map((muscle) => ({
  id: muscle.id,
  group: groupOfPath(muscle.id),
}));

/** What the page says about a group: the tapped muscle's own entry when there is one, else the group's first. */
export function infoOf(group: MuscleGroup, pathId?: string | null): MuscleMetadata | null {
  const own = pathId ? MUSCLE_DICTIONARY[pathId] : undefined;
  if (own && own.baseGroup === group) return own;
  return Object.values(MUSCLE_DICTIONARY).find((entry) => entry.baseGroup === group) ?? null;
}

/** Skill-tree moves that train a group, easiest first. */
export function movesFor(group: MuscleGroup): Exercise[] {
  const seen = new Map<string, Exercise>();
  for (const entry of Object.values(MUSCLE_DICTIONARY)) {
    if (entry.baseGroup !== group) continue;
    for (const exercise of getExercisesForMuscle(entry.id, 1, 20)) seen.set(exercise.id, exercise);
  }
  return [...seen.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ */
/* Exercise → groups                                                   */
/* ------------------------------------------------------------------ */

/** Skill-tree exercise id → groups whose anatomy entry lists it. */
const LISTED = (() => {
  const map = new Map<string, Set<MuscleGroup>>();
  for (const entry of Object.values(MUSCLE_DICTIONARY)) {
    for (const id of entry.exerciseIds) {
      if (!map.has(id)) map.set(id, new Set());
      map.get(id)!.add(entry.baseGroup as MuscleGroup);
    }
  }
  return map;
})();

/** Read from the exercise's name: the first matching rules add their groups. */
const BY_NAME: [RegExp, MuscleGroup[]][] = [
  [/leg curl|nordic/i, ['hamstrings']],
  [/\brdl\b|romanian|good morning|hamstring/i, ['hamstrings', 'glutes', 'lowerback']],
  [/deadlift/i, ['hamstrings', 'glutes', 'lowerback', 'traps', 'forearms']],
  [/hip thrust|bridge/i, ['glutes', 'hamstrings']],
  [/squat|lunge|step-?ups?|step-?downs?|pistol|leg press|shrimp/i, ['quads', 'glutes', 'adductors']],
  [/calf|calves/i, ['calves']],
  [/tibialis/i, ['tibialis']],
  [/jump/i, ['calves', 'quads']],
  [/wrist|grip|farmer|dead hang|hangboard|campus|towel/i, ['forearms']],
  [/boulder|climb|routes?\b/i, ['forearms', 'lats', 'biceps']],
  [/muscle-?ups?/i, ['lats', 'biceps', 'chest', 'triceps']],
  [/pull-?ups?|pullups?|chin|pulldown/i, ['lats', 'biceps', 'traps']],
  [/face pull|reverse pec|rear delt/i, ['shoulders', 'traps']],
  [/\brows?\b/i, ['lats', 'traps', 'biceps']],
  [/front lever|back lever/i, ['lats', 'abs', 'shoulders']],
  [/(?<!(?:leg|wrist|nordic) )curls?\b/i, ['biceps', 'forearms']],
  [/\bdips?\b/i, ['chest', 'triceps', 'shoulders']],
  [/planche/i, ['shoulders', 'chest', 'serratus', 'abs']],
  [/handstand|hspu|pike push|overhead press|db press|shoulder press|military/i, ['shoulders', 'triceps', 'traps']],
  [/lateral raise/i, ['shoulders']],
  [/push-?ups?|pushups?|bench|\bfly|flye/i, ['chest', 'triceps', 'shoulders']],
  [/back extension|superman|hyperextension/i, ['lowerback', 'glutes']],
  [/tricep|pushdown|skull|(?<!back )extensions?/i, ['triceps']],
  [/toes-?to-?bar|leg raise|knee raise|v-?ups?|l-?sit|v-?sit|compression|hollow|dragon flag|crunch|sit-?ups?|manna/i, ['abs', 'hipflexors']],
  [/ab wheel|rollout/i, ['abs', 'lats']],
  [/side plank|oblique|twist|human flag|windshield/i, ['obliques', 'abs']],
  [/plank/i, ['abs']],
  [/scap/i, ['serratus', 'traps']],
  [/shrug/i, ['traps']],
];

/** Groups an exercise trains, from the anatomy data when it lists the move, else from its name. */
export function groupsOfExercise(exercise: { exercise: string; name: string }): MuscleGroup[] {
  const groups = new Set<MuscleGroup>(LISTED.get(exercise.exercise) ?? []);
  const text = `${exercise.name} ${exercise.exercise.replace(/_/g, ' ')}`;
  for (const [pattern, hits] of BY_NAME) {
    if (pattern.test(text)) hits.forEach((group) => groups.add(group));
  }
  return GROUPS.map((group) => group.id).filter((id) => groups.has(id));
}
