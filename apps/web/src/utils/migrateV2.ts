import { BOSS_BY_ID } from '../data/campaignCatalog';
import type { PlanSpecV2 } from './campaignPlan';
import { ArmorSlot, ActV3, BossSpec, GoalV3, PLAN_FORMAT_V3, PlanSpecV3, SpecDayV3, TowerSpec, TrackedLift } from './campaignV3';
import { LIFT_RECORD } from './records';

/**
 * Turns a v2 campaign plan into v3 (the save has its own half in
 * migrateSaveV2.ts). Pure and safe to run twice: a v3 plan comes back as it
 * is. What it cannot map is listed in the report, never dropped silently.
 */

/* ------------------------------------------------------------------ */
/* Mapping tables                                                      */
/* ------------------------------------------------------------------ */

type BossShape =
  | { kind: 'skill'; skill: string }
  | { kind: 'reps'; exercise: string; target: number }
  | { kind: 'bodyweight'; mode: 'multiple'; exercise: string; multiple: number };

/** v2 catalogue boss → what it is in v3. Its id and name stay, so map goals and badges still point at it. */
export const BOSS_V3: Record<string, BossShape> = {
  boss_planche: { kind: 'skill', skill: 'ex_299' },
  boss_frontlever: { kind: 'skill', skill: 'ex_205' },
  boss_hspu: { kind: 'skill', skill: 'ex_92' },
  boss_pullup_engine: { kind: 'reps', exercise: 'ex_45', target: 15 },
  boss_pushup_engine: { kind: 'reps', exercise: 'ex_7', target: 70 },
  boss_nordic: { kind: 'skill', skill: 'ex_158' },
  boss_pistol: { kind: 'skill', skill: 'ex_118' },
  boss_humanflag: { kind: 'skill', skill: 'ex_221' },
  boss_muscleup: { kind: 'skill', skill: 'ex_112' },
  boss_oap: { kind: 'skill', skill: 'ex_379' },
  boss_muscleup_ten: { kind: 'reps', exercise: 'ex_112', target: 10 },
  boss_handstand: { kind: 'reps', exercise: 'ex_62', target: 60 },
  boss_backlever: { kind: 'skill', skill: 'ex_172' },
  boss_oap_pushup: { kind: 'skill', skill: 'ex_215' },
  boss_pistol_bw: { kind: 'reps', exercise: 'ex_81', target: 10 },
  boss_lsit: { kind: 'reps', exercise: 'ex_42', target: 30 },
  boss_front_lever_hold: { kind: 'reps', exercise: 'ex_205', target: 10 },
  boss_deadlift_2x: { kind: 'bodyweight', mode: 'multiple', exercise: 'deadlift', multiple: 2 },
  boss_bw_bench: { kind: 'bodyweight', mode: 'multiple', exercise: 'bench_press', multiple: 1 },
  boss_dead_hang: { kind: 'reps', exercise: 'ex_439', target: 120 },
};

/** v2 catalogue tree → a tower: its summit skill. */
const TREE_TOWER: Record<string, { name: string; summit: string }> = {
  planche: { name: 'The Planche Tower', summit: 'ex_299' },
  frontlever: { name: 'The Front Lever Tower', summit: 'ex_205' },
  handstand: { name: 'The Handstand Push-up Tower', summit: 'ex_92' },
  muscleup: { name: 'The Muscle-up Tower', summit: 'ex_112' },
  pistol: { name: 'The Pistol Tower', summit: 'ex_81' },
  balance: { name: 'The Handstand Tower', summit: 'ex_90' },
};

/** v2 tree tier → the skill it stands for, or a record to reach. */
export const TIER_GOAL: Record<string, { skill: string } | { exercise: string; target: number }> = {
  planche_0: { skill: 'ex_48' },
  planche_1: { skill: 'ex_105' },
  planche_2: { skill: 'ex_142' },
  planche_3: { skill: 'ex_210' },
  planche_final: { skill: 'ex_299' },
  lever_1: { exercise: 'cable_row', target: 75 },
  lever_2: { exercise: 'cable_row', target: 85 },
  lever_3: { exercise: 'cable_row', target: 100 },
  hs_1: { exercise: 'db_press', target: 24 },
  hs_2: { exercise: 'db_press', target: 30 },
  hs_3: { exercise: 'db_press', target: 32 },
  mu_1: { exercise: 'ex_45', target: 10 },
  mu_2: { exercise: 'weighted_chins', target: 15 },
  mu_3: { skill: 'ex_112' },
  mu_4: { exercise: 'ex_112', target: 5 },
  pistol_1: { exercise: 'split_squat', target: 16 },
  pistol_2: { skill: 'ex_81' },
  pistol_3: { exercise: 'ex_81', target: 5 },
  pistol_4: { exercise: 'split_squat', target: 32 },
  balance_1: { skill: 'ex_62' },
  balance_2: { skill: 'ex_90' },
  balance_3: { exercise: 'ex_62', target: 60 },
  engine_1: { exercise: 'ex_45', target: 8 },
  engine_2: { exercise: 'ex_45', target: 12 },
  engine_3: { exercise: 'ex_45', target: 15 },
};

/** Claimed v2 milestones → the skill they prove. */
export const MILESTONE_SKILL: Record<string, string> = {
  ms_dragonflag: 'ex_161',
  ms_backlever: 'ex_172',
  ms_oneArmPushup: 'ex_215',
};

const ARMOR_SLOT: Record<string, ArmorSlot> = {
  armor_elbows: 'elbows',
  armor_wrists: 'wrists',
  armor_shoulders: 'shoulders',
  armor_fingers: 'fingers',
  armor_knees: 'knees',
  armor_ankles: 'ankles',
};

/* ------------------------------------------------------------------ */
/* Plan                                                                */
/* ------------------------------------------------------------------ */

export interface MigrationReport {
  /** What became what, in plain words. */
  mapped: string[];
  /** What had no place in v3 and why. */
  unmapped: string[];
}

const isV3Plan = (spec: { version: number }): spec is PlanSpecV3 => spec.version === PLAN_FORMAT_V3;

export function migrateSpec(spec: PlanSpecV2 | PlanSpecV3): { spec: PlanSpecV3; report: MigrationReport } {
  const report: MigrationReport = { mapped: [], unmapped: [] };
  if (isV3Plan(spec)) return { spec, report };

  const lifts: TrackedLift[] = [];
  for (const lift of spec.lifts) {
    const to = LIFT_RECORD[lift.lift];
    if (!to) {
      report.unmapped.push(`lift ${lift.lift}: no exercise to track it under`);
      continue;
    }
    if (lifts.some((tracked) => tracked.exercise === to.exercise)) continue;
    lifts.push({ exercise: to.exercise, metric: to.metric, baseline: lift.baseline, endgame: lift.endgame });
    report.mapped.push(`lift ${lift.lift} → tracked ${to.exercise} (${to.metric})`);
  }

  const days: SpecDayV3[] = spec.days.map((day) => {
    const used = new Set<string>();
    return {
      ...day,
      warmUps: day.warmUps.map((warmUp) => {
        let id = `${day.id}_warm_${warmUp.exercise}`;
        for (let n = 2; used.has(id); n += 1) id = `${day.id}_warm_${warmUp.exercise}_${n}`;
        used.add(id);
        return { id, ...warmUp };
      }),
    };
  });

  const armor = spec.armor.flatMap((id) => {
    const slot = ARMOR_SLOT[id];
    if (!slot) report.unmapped.push(`armor ${id}: unknown piece`);
    return slot ? [slot] : [];
  });

  const kept = new Set(spec.bosses.map((entry) => entry.boss));
  const bosses: BossSpec[] = [];
  for (const entry of spec.bosses) {
    const boss = BOSS_BY_ID.get(entry.boss);
    const shape = BOSS_V3[entry.boss];
    if (!boss || !shape) {
      report.unmapped.push(`boss ${entry.boss}${boss ? ` (${boss.name})` : ''}: nothing in the tree or the lifts matches it`);
      continue;
    }
    const after = boss.requirements.flatMap((req) => (req.kind === 'boss' && kept.has(req.boss) && BOSS_V3[req.boss] ? [req.boss] : []));
    const base = { id: boss.id, name: boss.name, category: boss.branch, ...(after.length ? { after } : {}) };
    bosses.push(shape.kind === 'skill' ? { ...base, kind: 'skill', tree: 'calisthenics', skill: shape.skill } : { ...base, ...shape });
    report.mapped.push(`boss ${boss.name} → ${describeBoss(shape)}`);
  }

  const towers: TowerSpec[] = [];
  for (const entry of spec.trees) {
    const tower = TREE_TOWER[entry.tree];
    if (!tower) {
      report.unmapped.push(`tree ${entry.tree}: no single summit in the skill tree; its tiers live on as record goals`);
      continue;
    }
    towers.push({ id: entry.tree, name: tower.name, tree: 'calisthenics', summit: tower.summit });
    report.mapped.push(`tree ${entry.tree} → tower up to ${tower.summit}`);
  }

  const acts: ActV3[] = spec.acts.map((act) => ({
    ...act,
    goals: act.goals.flatMap((goal): GoalV3[] => {
      switch (goal.kind) {
        case 'weight':
          return [goal];
        case 'boss':
          if (bosses.some((boss) => boss.id === goal.boss)) return [goal];
          report.unmapped.push(`goal ${goal.id}: boss ${goal.boss} did not carry over`);
          return [];
        case 'lift': {
          const to = LIFT_RECORD[goal.lift];
          if (!to) {
            report.unmapped.push(`goal ${goal.id}: lift ${goal.lift} has no exercise`);
            return [];
          }
          return [{ id: goal.id, kind: 'record', exercise: to.exercise, target: goal.target, ...(goal.label ? { label: goal.label } : {}) }];
        }
        case 'tier': {
          const tierGoal = TIER_GOAL[goal.tier];
          if (!tierGoal) {
            report.unmapped.push(`goal ${goal.id}: tier ${goal.tier} has no skill or record`);
            return [];
          }
          return 'skill' in tierGoal
            ? [{ id: goal.id, kind: 'skill', tree: 'calisthenics', skill: tierGoal.skill }]
            : [{ id: goal.id, kind: 'record', exercise: tierGoal.exercise, target: tierGoal.target }];
        }
        case 'milestone': {
          const skill = MILESTONE_SKILL[goal.milestone];
          if (skill) return [{ id: goal.id, kind: 'skill', tree: 'calisthenics', skill }];
          report.unmapped.push(`goal ${goal.id}: milestone ${goal.milestone} has no skill`);
          return [];
        }
      }
    }),
  }));

  return {
    spec: { version: PLAN_FORMAT_V3, name: spec.name, bodyweight: spec.bodyweight, lifts, days, armor, bosses, trees: towers, acts },
    report,
  };
}

function describeBoss(shape: BossShape): string {
  if (shape.kind === 'skill') return `skill ${shape.skill} (beaten when mastered)`;
  if (shape.kind === 'reps') return `${shape.target} on ${shape.exercise}`;
  return `${shape.multiple}× bodyweight on ${shape.exercise}`;
}

