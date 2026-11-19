'use client';

import React, { useMemo, useState } from 'react';
import { EXERCISE_BY_ID, EXERCISE_CATEGORIES, ExerciseCategory, exerciseCatalog } from '../../data/campaignCatalog';
import { fromExerciseList } from '../../data/exercisesData';
import { Branch, BRANCHES, CampaignPlan, PlanSpec, TRAINABLE_ATTRIBUTES, formatStatValue, recordName } from '../../utils/campaignPlan';
import { Metric, SkillTreeRef } from '../../utils/campaignV3';
import { metricOf, recordKeyOf } from '../../utils/records';
import type { TreeSkill } from '../../utils/skillTree';
import { allSkills, floorsOf, masteredIn, skillOf } from '../../utils/treeIndex';
import { figureForBoss, figureForExercise, figureForLift, heldPose } from '../game/figures';
import { useGame } from '../game/GameProvider';
import { BOULDERING_LANE_THEME, LANE_THEME, YOGA_LANE_THEME } from '../skilltree/laneTheme';
import { SKILL_TREES } from '../skilltree/skillTrees';
import { CardField, PickOption, PickerSheet, ScopeRow } from './CardPicker';

/**
 * What the Forge's pickers choose from, as cards: skills of the real skill
 * trees (bosses, towers, map goals), catalogue exercises (lifts, bosses),
 * and the plan's own bosses, towers and lifts (map goals).
 */

/** The lane a tree skill sits in, as a campaign category. */
export function laneOf(swimlane: string | undefined): Branch {
  const lane = swimlane?.toLowerCase();
  return lane === 'push' || lane === 'pull' || lane === 'legs' ? lane : 'core';
}

const ATTRIBUTE_LABEL = new Map(TRAINABLE_ATTRIBUTES.map((entry) => [entry.id, entry.label]));

/** "Push · Straight-Arm", plus the muscle it focuses on when that says more than its line. */
function trainsOf(id: string, line?: string): string | undefined {
  const exercise = EXERCISE_BY_ID.get(id);
  if (!exercise) return undefined;
  const parts = exercise.trains.map((attribute) => ATTRIBUTE_LABEL.get(attribute) ?? attribute);
  if (exercise.focus && exercise.focus !== line && !parts.includes(exercise.focus)) parts.push(exercise.focus);
  return parts.join(' · ') || undefined;
}

/* ------------------------------------------------------------------ */
/* Tree skills                                                         */
/* ------------------------------------------------------------------ */

/** The lanes of a tree, in the order the tree shows them. */
export const LANES: Record<SkillTreeRef, string[]> = {
  calisthenics: BRANCHES.map((branch) => branch.label).filter((lane) => lane in LANE_THEME),
  bouldering: Object.keys(BOULDERING_LANE_THEME),
  yoga: Object.keys(YOGA_LANE_THEME),
};

const floorCount = new Map<string, number>();
function floorsTo(tree: SkillTreeRef, id: string): number {
  const key = `${tree}:${id}`;
  let count = floorCount.get(key);
  if (count === undefined) {
    count = floorsOf(tree, id).length;
    floorCount.set(key, count);
  }
  return count;
}

export type SkillAside = 'floors' | 'hits' | 'none';

function skillOption(tree: SkillTreeRef, skill: TreeSkill, mastered: Set<string>, aside: SkillAside, tags?: Map<string, string>): PickOption {
  const def = SKILL_TREES[tree];
  const done = mastered.has(skill.id);
  const floors = floorsTo(tree, skill.id);
  const used = tags?.get(`${tree}:${skill.id}`);
  return {
    id: skill.id,
    name: skill.name,
    figure: heldPose(figureForExercise(skill.id, laneOf(skill.swimlane))),
    tone: done ? 'mastered' : 'ready',
    lead: def.levelTag(skill.level),
    line: skill.subCategory,
    level: { label: def.levelName(skill.level), rank: skill.level },
    sub: trainsOf(skill.id, skill.subCategory) ?? skill.musclesTargeted.slice(0, 3).join(', '),
    aside: aside === 'floors' ? `${floors} ${floors === 1 ? 'floor' : 'floors'}` : aside === 'hits' ? `${floors - 1} ${floors - 1 === 1 ? 'hit' : 'hits'}` : undefined,
    tag: done ? { label: 'Mastered', tone: 'earned' } : used ? { label: used, tone: 'muted' } : undefined,
    keywords: `${skill.swimlane} ${skill.musclesTargeted.join(' ')}`,
  };
}

interface SkillSheetProps {
  tree: SkillTreeRef;
  /** The lane it opens on (a swimlane: "Push", "Movement"). */
  lane?: string;
  lockTree?: boolean;
  lockLane?: boolean;
  value?: string;
  aside?: SkillAside;
  /** `tree:id` → what the skill already is in the plan ("Tower", "Boss"). */
  tags?: Map<string, string>;
  eyebrow?: string;
  title: string;
  note?: string;
  onPick: (tree: SkillTreeRef, id: string) => void;
  onClose: () => void;
}

/** Skills of one tree and lane; a search reaches the whole tree unless the lane is fixed. */
export const SkillSheet: React.FC<SkillSheetProps> = ({ tree: initialTree, lane: initialLane, lockTree, lockLane, value, aside = 'none', tags, eyebrow, title, note, onPick, onClose }) => {
  const { save } = useGame();
  const [tree, setTree] = useState<SkillTreeRef>(initialTree);
  const [lane, setLane] = useState(() => {
    const current = value ? skillOf(initialTree, value)?.swimlane : undefined;
    const lanes = LANES[initialTree];
    return (lockLane ? initialLane : current) ?? (initialLane && lanes.includes(initialLane) ? initialLane : lanes[0]);
  });

  const mastered = useMemo(() => masteredIn(save.skills, tree), [save.skills, tree]);
  const everything = useMemo(() => allSkills(tree).map((skill) => skillOption(tree, skill, mastered, aside, tags)), [tree, mastered, aside, tags]);
  const laneOfId = useMemo(() => new Map(allSkills(tree).map((skill) => [skill.id, skill.swimlane])), [tree]);
  const options = useMemo(() => everything.filter((option) => laneOfId.get(option.id) === lane), [everything, laneOfId, lane]);
  // A fixed lane belongs to the tree it was set on: another tree opens all its lanes.
  const laneLocked = Boolean(lockLane) && tree === initialTree;

  const scopes: ScopeRow[] = [];
  if (!lockTree) {
    scopes.push({
      label: 'Tree',
      value: tree,
      options: (['calisthenics', 'bouldering', 'yoga'] as const).map((id) => ({ id, label: SKILL_TREES[id].label, count: allSkills(id).length })),
      onChange: (next) => {
        setTree(next as SkillTreeRef);
        setLane(next === initialTree && lockLane && initialLane ? initialLane : LANES[next as SkillTreeRef][0]);
      },
    });
  }
  if (!laneLocked) {
    const counts = new Map<string, number>();
    for (const skill of allSkills(tree)) counts.set(skill.swimlane, (counts.get(skill.swimlane) ?? 0) + 1);
    scopes.push({ label: 'Lane', value: lane, options: LANES[tree].map((id) => ({ id, label: id, count: counts.get(id) ?? 0 })), onChange: setLane });
  }

  const word = `${lane.toLowerCase()} ${SKILL_TREES[tree].noun.one === 'exercise' ? 'skill' : SKILL_TREES[tree].noun.one}`;
  return (
    <PickerSheet
      eyebrow={eyebrow}
      title={title}
      note={note}
      options={options}
      searchPool={laneLocked ? undefined : everything}
      searchScope={laneLocked ? undefined : 'across the whole tree'}
      poolNoun={SKILL_TREES[tree].noun.one === 'exercise' ? 'skills' : SKILL_TREES[tree].noun.many}
      noun={{ one: word, many: `${word}s` }}
      value={value}
      scopes={scopes}
      onPick={(option) => onPick(tree, option.id)}
      onClose={onClose}
    />
  );
};

/** A tree skill as a card field. */
export const SkillField: React.FC<
  Omit<SkillSheetProps, 'onClose' | 'eyebrow' | 'title'> & {
    label: string;
    hideLabel?: boolean;
    hint?: string;
    placeholder?: string;
    placeholderNote?: string;
    sheetEyebrow?: string;
    sheetTitle: string;
  }
> = ({ label, hideLabel, hint, placeholder = 'Pick a skill', placeholderNote, sheetEyebrow, sheetTitle, ...sheet }) => {
  const { save } = useGame();
  const [open, setOpen] = useState(false);
  const skill = sheet.value ? skillOf(sheet.tree, sheet.value) : undefined;
  const option = skill ? skillOption(sheet.tree, skill, masteredIn(save.skills, sheet.tree), sheet.aside ?? 'none') : undefined;
  return (
    <>
      <CardField label={label} hideLabel={hideLabel} hint={hint} option={option} placeholder={placeholder} placeholderNote={placeholderNote} onOpen={() => setOpen(true)} />
      {open && (
        <SkillSheet
          {...sheet}
          value={skill?.id}
          eyebrow={sheetEyebrow}
          title={sheetTitle}
          onPick={(tree, id) => {
            setOpen(false);
            sheet.onPick(tree, id);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Catalogue exercises                                                 */
/* ------------------------------------------------------------------ */

const SHORT_CATEGORY: Record<ExerciseCategory, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  skill: 'Skills',
  climb: 'Climbing',
  yoga: 'Yoga',
  recovery: 'Recovery',
  warmup: 'Warm-up',
};
const DISCIPLINE_LABEL = { calisthenics: 'Calisthenics', gym: 'Gym', bouldering: 'Bouldering', yoga: 'Yoga', prep: 'Warm-up & recovery' } as const;
const UNIT_TAG: Record<Metric, string> = { kg: 'kg', 'added-kg': '+kg', reps: 'reps', seconds: 'secs' };

type CatalogueOption = PickOption & { category: ExerciseCategory; metric: Metric };

/** A record's card: the exercise it logs to, drawn and levelled as that exercise. */
function catalogueOption(key: string): CatalogueOption | undefined {
  const exercise = EXERCISE_BY_ID.get(key) ?? exerciseCatalog().find((entry) => recordKeyOf(entry.id) === key);
  if (!exercise) return undefined;
  const treeSkill = skillOf('calisthenics', key) ?? skillOf('bouldering', key) ?? skillOf('yoga', key);
  const tree = exercise.discipline === 'bouldering' || exercise.discipline === 'yoga' ? exercise.discipline : 'calisthenics';
  const def = SKILL_TREES[tree];
  const line = treeSkill?.subCategory ?? exercise.group ?? 'Campaign lifts';
  const metric = metricOf(key);
  return {
    id: key,
    name: recordName(key),
    figure: heldPose(figureForExercise(key, exercise.category)),
    lead: exercise.level !== undefined ? def.levelTag(exercise.level) : undefined,
    meta: DISCIPLINE_LABEL[exercise.discipline],
    line,
    // Each tree's levels sort apart: bouldering grades after calisthenics levels, yoga levels after both.
    level: exercise.level !== undefined ? { label: def.levelName(exercise.level), rank: exercise.level + (tree === 'bouldering' ? 100 : tree === 'yoga' ? 200 : 0) } : undefined,
    sub: trainsOf(exercise.id, line),
    unit: UNIT_TAG[metric],
    keywords: `${exercise.name} ${exercise.focus} ${SHORT_CATEGORY[exercise.category]}`,
    category: exercise.category,
    metric,
  };
}

/** Every record the catalogue can log to, once, easiest first. */
const allCatalogue = fromExerciseList((): CatalogueOption[] => {
  const seen = new Set<string>();
  return [...exerciseCatalog()]
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name))
    .flatMap((exercise) => {
      const key = recordKeyOf(exercise.id);
      if (seen.has(key)) return [];
      seen.add(key);
      const option = catalogueOption(key);
      return option ? [option] : [];
    });
});

interface CatalogueSheetProps {
  /** Fixed to one category: no category chips. */
  category?: ExerciseCategory;
  /** Only exercises measured this way (a bodyweight-multiple boss needs a loaded lift). */
  metrics?: Metric[];
  /** Records already tracked: shown dimmed, not pickable. */
  tracked?: Set<string>;
  value?: string;
  eyebrow?: string;
  title: string;
  note?: string;
  onPick: (id: string) => void;
  onClose: () => void;
}

export const CatalogueSheet: React.FC<CatalogueSheetProps> = ({ category: fixed, metrics, tracked, value, eyebrow, title, note, onPick, onClose }) => {
  const pool = useMemo(
    () =>
      allCatalogue()
        .filter((option) => (!fixed || option.category === fixed) && (!metrics || metrics.includes(option.metric)))
        .map((option) => (tracked?.has(option.id) ? { ...option, disabled: true, tag: { label: 'Tracked', tone: 'muted' as const } } : option)),
    [fixed, metrics, tracked],
  );
  const counts = useMemo(() => {
    const map = new Map<ExerciseCategory, number>();
    for (const option of pool) map.set(option.category, (map.get(option.category) ?? 0) + 1);
    return map;
  }, [pool]);
  const categories = EXERCISE_CATEGORIES.filter((entry) => counts.has(entry.id));
  const [chosen, setChosen] = useState<ExerciseCategory>(() => {
    const current = value ? pool.find((option) => option.id === value)?.category : undefined;
    return fixed ?? current ?? categories[0]?.id ?? 'push';
  });
  const options = useMemo(() => pool.filter((option) => option.category === chosen), [pool, chosen]);
  const scopes: ScopeRow[] =
    fixed || categories.length < 2
      ? []
      : [{ label: 'Category', value: chosen, options: categories.map((entry) => ({ id: entry.id, label: SHORT_CATEGORY[entry.id], count: counts.get(entry.id) })), onChange: (id) => setChosen(id as ExerciseCategory) }];

  const word = fixed ? `${SHORT_CATEGORY[fixed].toLowerCase()} exercise` : 'exercise';
  return (
    <PickerSheet
      eyebrow={eyebrow}
      title={title}
      note={note}
      options={options}
      searchPool={scopes.length ? pool : undefined}
      searchScope={scopes.length ? 'across every category' : undefined}
      poolNoun="exercises"
      noun={{ one: word, many: `${word}s` }}
      value={value}
      scopes={scopes}
      onPick={(option) => onPick(option.id)}
      onClose={onClose}
    />
  );
};

/** A catalogue exercise as a card field. The current one shows even when the filter would leave it out. */
export const CatalogueField: React.FC<
  Omit<CatalogueSheetProps, 'onClose' | 'eyebrow' | 'title'> & {
    label: string;
    hideLabel?: boolean;
    hint?: string;
    placeholder?: string;
    placeholderNote?: string;
    sheetEyebrow?: string;
    sheetTitle: string;
  }
> = ({ label, hideLabel, hint, placeholder = 'Pick an exercise', placeholderNote, sheetEyebrow, sheetTitle, ...sheet }) => {
  const [open, setOpen] = useState(false);
  const option = sheet.value ? catalogueOption(sheet.value) : undefined;
  return (
    <>
      <CardField label={label} hideLabel={hideLabel} hint={hint} option={option} placeholder={placeholder} placeholderNote={placeholderNote} onOpen={() => setOpen(true)} />
      {open && (
        <CatalogueSheet
          {...sheet}
          eyebrow={sheetEyebrow}
          title={sheetTitle}
          onPick={(id) => {
            setOpen(false);
            sheet.onPick(id);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* The plan's own bosses, towers and lifts                             */
/* ------------------------------------------------------------------ */

const BRANCH_LABEL = new Map(BRANCHES.map((branch) => [branch.id, branch.label]));

/** "Tree skill", "Max reps", "× Bodyweight", "Target weight". */
export function bossKindLabel(spec: PlanSpec, id: string): string | undefined {
  const boss = spec.bosses.find((entry) => entry.id === id);
  if (!boss) return undefined;
  if (boss.kind === 'skill') return 'Tree skill';
  if (boss.kind === 'reps') return 'Max reps';
  return boss.mode === 'multiple' ? '× Bodyweight' : 'Target weight';
}

/** The plan's bosses in fighting order: drawn in crimson, gold once slain. */
export function bossOptions(plan: CampaignPlan, spec: PlanSpec, slain: Set<string>): PickOption[] {
  return plan.bosses.map((boss, index) => {
    const down = slain.has(boss.id);
    const kind = bossKindLabel(spec, boss.id);
    return {
      id: boss.id,
      name: boss.name,
      figure: heldPose(figureForBoss(boss)),
      tone: down ? 'slain' : 'boss',
      lead: `Boss ${index + 1}`,
      leadTone: down ? 'earned' : 'boss',
      meta: [BRANCH_LABEL.get(boss.branch), kind].filter(Boolean).join(' · '),
      sub: boss.epithet,
      tag: down ? { label: 'Slain', tone: 'earned' } : undefined,
    };
  });
}

/** The plan's towers, with how far up each is climbed. */
export function towerOptions(plan: CampaignPlan, skills: Record<string, string> | undefined): PickOption[] {
  return plan.trees.map((entry) => {
    const tower = entry.tower;
    if (!tower) return { id: entry.id, name: entry.name, figure: heldPose(figureForExercise('', entry.branch)), meta: entry.tagline, line: BRANCH_LABEL.get(entry.branch) };
    const floors = floorsOf(tower.tree, tower.summit);
    const owned = masteredIn(skills, tower.tree);
    const climbed = floors.filter((floor) => owned.has(floor.id)).length;
    const topped = floors.length > 0 && climbed === floors.length;
    return {
      id: entry.id,
      name: entry.name,
      figure: heldPose(figureForExercise(tower.summit, entry.branch)),
      tone: topped ? 'mastered' : 'ready',
      lead: `${climbed}/${floors.length} floors`,
      meta: SKILL_TREES[tower.tree].label,
      sub: `Summit ${skillOf(tower.tree, tower.summit)?.name ?? '?'}`,
      tag: topped ? { label: 'Topped', tone: 'earned' } : undefined,
    };
  });
}

/** The plan's lifts, by category, with what each logs. */
export function liftOptions(plan: CampaignPlan): PickOption[] {
  return plan.lifts.map((lift) => ({
    id: lift.id,
    name: lift.name,
    figure: heldPose(figureForLift(lift)),
    meta: lift.endgame === null ? 'no end-game number' : `end-game ${formatStatValue(lift.endgame, lift.unit)}`,
    line: BRANCH_LABEL.get(lift.branch),
    lineRank: BRANCHES.findIndex((branch) => branch.id === lift.branch),
    sub: trainsOf(lift.id) ?? BRANCH_LABEL.get(lift.branch),
    unit: UNIT_TAG[lift.unit],
  }));
}

/* ------------------------------------------------------------------ */
/* Category chips                                                      */
/* ------------------------------------------------------------------ */

/** Push / Pull / Legs / Core as a row of chips. */
export const CategoryChips: React.FC<{ value: Branch; onChange: (value: Branch) => void; label: string; counts?: Partial<Record<Branch, number>> }> = ({
  value,
  onChange,
  label,
  counts,
}) => (
  <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-1.5">
    {BRANCHES.map((branch) => {
      const on = branch.id === value;
      return (
        <button
          key={branch.id}
          type="button"
          role="radio"
          aria-checked={on}
          onClick={() => onChange(branch.id)}
          className={`h-11 rounded-card border-[1.5px] text-[14px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-[.97] cursor-pointer ${
            on ? 'bg-ink-800 border-act text-fg' : 'bg-ink-850 border-transparent text-fg-3 hover:bg-ink-800 hover:text-fg'
          }`}
        >
          {branch.label}
          {counts && <span className={`num font-bold text-[13px] ${on ? 'text-fg-3' : 'text-fg-5'}`}>{counts[branch.id] ?? 0}</span>}
        </button>
      );
    })}
  </div>
);
