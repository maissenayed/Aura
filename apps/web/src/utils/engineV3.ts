import type { BossSpec, PlanSpecV3, TowerSpec } from './campaignV3';
import type { SaveV3 } from './migrateV2';
import { recordKeyOf } from './migrateV2';
import { floorsOf, masteredIn, skillOf } from './treeIndex';
import type { TreeSkill } from './skillTree';

/**
 * How v3 bosses and towers stand, from the plan and save. Kept apart from the
 * v2 engine until v3 is switched on.
 */

export interface BossStatusV3 {
  boss: BossSpec;
  /** 0–1, how much of the boss is gone. */
  damage: number;
  defeated: boolean;
  /** An `after` boss still stands. */
  sealed: boolean;
  sealedBy?: string;
  /** What is left to do, in plain words: "3 skills to master", "7 more reps". */
  remaining: string;
}

export interface TowerStatus {
  tower: TowerSpec;
  floors: TreeSkill[];
  mastered: number;
  progress: number;
  /** The lowest floor not yet mastered. */
  next?: TreeSkill;
  complete: boolean;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/** The number a boss reads for an exercise: its record, else the player's baseline, else 0. */
function currentFor(save: SaveV3, spec: PlanSpecV3, exercise: string): number {
  const key = recordKeyOf(exercise);
  return save.records?.[key] ?? spec.lifts.find((lift) => lift.exercise === key)?.baseline ?? 0;
}

function rawBoss(boss: BossSpec, spec: PlanSpecV3, save: SaveV3): Omit<BossStatusV3, 'sealed' | 'sealedBy'> {
  switch (boss.kind) {
    case 'skill': {
      const floors = floorsOf(boss.tree, boss.skill);
      const mastered = masteredIn(save.skills, boss.tree);
      const done = floors.filter((floor) => mastered.has(floor.id)).length;
      const defeated = mastered.has(skillOf(boss.tree, boss.skill)?.id ?? boss.skill);
      const left = floors.length - done;
      return {
        boss,
        damage: defeated ? 1 : floors.length ? done / floors.length : 0,
        defeated,
        remaining: defeated ? 'Mastered' : `${left} skill${left === 1 ? '' : 's'} to master`,
      };
    }
    case 'reps': {
      const current = currentFor(save, spec, boss.exercise);
      const defeated = current >= boss.target;
      return { boss, damage: clamp01(current / boss.target), defeated, remaining: defeated ? 'Done' : `${boss.target - current} to go` };
    }
    case 'bodyweight': {
      if (boss.mode === 'scale') {
        const start = spec.bodyweight.start;
        const now = save.bodyWeightKg;
        const span = boss.kg - start;
        const defeated = span >= 0 ? now >= boss.kg : now <= boss.kg;
        const damage = span === 0 ? (defeated ? 1 : 0) : clamp01((now - start) / span);
        return { boss, damage, defeated, remaining: defeated ? 'Reached' : `${Math.abs(boss.kg - now).toFixed(1)} kg to go` };
      }
      // Added-load exercises carry bodyweight already: 1.5× bodyweight is +0.5× added.
      const added = spec.lifts.find((lift) => lift.exercise === recordKeyOf(boss.exercise))?.metric === 'added-kg';
      const target = Math.max(0.5, Math.round((added ? boss.multiple - 1 : boss.multiple) * save.bodyWeightKg * 2) / 2);
      const current = currentFor(save, spec, boss.exercise);
      const defeated = current >= target;
      return { boss, damage: clamp01(current / target), defeated, remaining: defeated ? 'Lifted' : `${(target - current).toFixed(1)} kg to go` };
    }
  }
}

export function evaluateBossesV3(spec: PlanSpecV3, save: SaveV3): BossStatusV3[] {
  const raw = spec.bosses.map((boss) => rawBoss(boss, spec, save));
  const byId = new Map(raw.map((status) => [status.boss.id, status]));
  return raw.map((status) => {
    const blocker = (status.boss.after ?? []).map((id) => byId.get(id)).find((other) => other && !other.defeated);
    return { ...status, sealed: Boolean(blocker), ...(blocker ? { sealedBy: blocker.boss.name } : {}) };
  });
}

export function evaluateTowers(spec: PlanSpecV3, save: SaveV3): TowerStatus[] {
  return spec.trees.map((tower) => {
    const floors = floorsOf(tower.tree, tower.summit);
    const mastered = masteredIn(save.skills, tower.tree);
    const done = floors.filter((floor) => mastered.has(floor.id)).length;
    return {
      tower,
      floors,
      mastered: done,
      progress: floors.length ? done / floors.length : 0,
      next: floors.find((floor) => !mastered.has(floor.id)),
      complete: floors.length > 0 && done === floors.length,
    };
  });
}
