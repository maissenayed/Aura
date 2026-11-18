import { EXERCISE_BY_ID } from '../data/campaignCatalog';
import { resolveExerciseId } from '../data/exerciseAliases';
import { ARMOR_SLOTS, ArmorSlot } from './campaignV3';

/**
 * Armour is the joints a week's warm-ups have looked after. Each warm-up
 * guards one or more joints; ticking it on the quest board forges those
 * pieces for the week. Only the pieces the plan asks for count.
 */

/** Warm-ups whose joints are known by name. */
const GUARDS: Record<string, ArmorSlot[]> = {
  bw_squats: ['knees', 'ankles'],
  jump_rope: ['ankles', 'knees'],
  scap_pullups: ['shoulders', 'elbows'],
  scap_pushups: ['shoulders', 'wrists'],
  band_dislocates: ['shoulders'],
  wrist_prep: ['wrists'],
  easy_routes: ['fingers', 'elbows'],
  mobility_flow: ['shoulders', 'wrists', 'knees', 'ankles'],
  face_pulls: ['shoulders', 'elbows'],
  wrist_curls: ['wrists'],
  feeder_curls: ['elbows'],
  pushdown_flush: ['elbows'],
  dead_hang: ['shoulders', 'fingers'],
  boulder_hangboard: ['fingers'],
  planche_leans: ['wrists', 'elbows'],
  tuck_planche: ['wrists', 'elbows'],
  tuck_front_lever: ['shoulders', 'elbows'],
  wall_handstand: ['wrists', 'shoulders'],
  hollow_hold: ['shoulders'],
};

/** The joints a warm-up guards: by name, else by what kind of exercise it is. */
export function guardsOf(exerciseId: string): ArmorSlot[] {
  const id = resolveExerciseId(exerciseId);
  if (GUARDS[id]) return GUARDS[id];
  const exercise = EXERCISE_BY_ID.get(id);
  if (!exercise) return [];
  const text = `${exercise.name} ${exercise.focus}`.toLowerCase();
  const named = ARMOR_SLOTS.filter((slot) => text.includes(slot.slice(0, -1)));
  if (named.length) return named;
  switch (exercise.category) {
    case 'push':
      return ['wrists', 'elbows'];
    case 'pull':
      return ['elbows', 'shoulders'];
    case 'legs':
      return ['knees', 'ankles'];
    case 'climb':
      return ['fingers'];
    case 'skill':
      return exercise.trains.includes('straight') ? ['elbows', 'wrists'] : ['shoulders'];
    default:
      return [];
  }
}

/** The slot an armour piece covers (`armor_elbows` → `elbows`). */
export const slotOfPiece = (pieceId: string): ArmorSlot => pieceId.replace(/^armor_/, '') as ArmorSlot;

interface WeekPlan {
  armor: { id: string }[];
  days: { warmUps: { id: string; guards: ArmorSlot[] }[] }[];
}

/**
 * The pieces forged in a week, each with the warm-ups that forged it. A piece
 * ticked by hand before warm-ups forged armour still counts.
 */
export function forgedIn(quests: Record<string, boolean>, plan: WeekPlan, week: number): Map<ArmorSlot, string[]> {
  const forged = new Map<ArmorSlot, string[]>();
  const wanted = new Set(plan.armor.map((piece) => slotOfPiece(piece.id)));
  for (const piece of plan.armor) {
    if (quests[`w${week}_${piece.id}`]) forged.set(slotOfPiece(piece.id), []);
  }
  for (const day of plan.days) {
    for (const warmUp of day.warmUps) {
      if (!quests[`w${week}_${warmUp.id}`]) continue;
      for (const slot of warmUp.guards) {
        if (wanted.has(slot)) forged.set(slot, [...(forged.get(slot) ?? []), warmUp.id]);
      }
    }
  }
  return forged;
}

/** The last week anything was ticked in. */
export function lastTickedWeek(quests: Record<string, boolean>): number {
  let last = 0;
  for (const [key, done] of Object.entries(quests)) {
    const match = /^w(\d+)_/.exec(key);
    if (match && done) last = Math.max(last, Number(match[1]));
  }
  return last;
}

/* ------------------------------------------------------------------ */
/* Tempering: armour that builds up over months                        */
/* ------------------------------------------------------------------ */

export const TEMPER_GRADES = [
  { name: 'Raw', weeks: 0, look: 'Cotton tape' },
  { name: 'Tempered', weeks: 4, look: 'Leather' },
  { name: 'Hardened', weeks: 12, look: 'Steel thread' },
  { name: 'Masterwork', weeks: 26, look: 'Gold stitching' },
] as const;

/** The real gear an athlete wears on each joint. */
export const JOINT_GEAR: Record<ArmorSlot, string> = {
  wrists: 'Wrist wraps',
  elbows: 'Elbow sleeves',
  shoulders: 'Shoulder band',
  fingers: 'Finger tape',
  knees: 'Knee sleeves',
  ankles: 'Ankle straps',
};

/**
 * Weeks each joint's piece was forged, in total (not in a row). Tendons adapt
 * slowly and so does the armour; a grade, once reached, is never lost.
 */
export function temperOf(quests: Record<string, boolean>, plan: WeekPlan): Map<ArmorSlot, number> {
  const weeks = new Map<ArmorSlot, number>();
  for (let week = 1, last = lastTickedWeek(quests); week <= last; week += 1) {
    for (const slot of forgedIn(quests, plan, week).keys()) weeks.set(slot, (weeks.get(slot) ?? 0) + 1);
  }
  return weeks;
}

export function gradeOf(weeks: number): { index: number; name: string; look: string; next: number | null } {
  let index = 0;
  TEMPER_GRADES.forEach((grade, i) => {
    if (weeks >= grade.weeks) index = i;
  });
  const next = TEMPER_GRADES[index + 1]?.weeks ?? null;
  return { index, name: TEMPER_GRADES[index].name, look: TEMPER_GRADES[index].look, next };
}
