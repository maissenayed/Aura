'use client';

import React from 'react';
import { EXERCISE_CATALOG, EXERCISE_CATEGORIES } from '../../data/campaignCatalog';
import { Branch, BRANCHES } from '../../utils/campaignPlan';
import { Metric, SkillTreeRef } from '../../utils/campaignV3';
import { metricOf, recordKeyOf } from '../../utils/records';
import { allSkills } from '../../utils/treeIndex';
import { GroupedSelect } from './fields';

/**
 * Pickers over the real skill tree and the exercise catalogue, for bosses,
 * towers, lifts and map goals. Native dropdowns with groups: long lists stay
 * easy to scroll on a phone.
 */

type Groups = { label: string; options: { id: string; label: string }[] }[];

/** The lane a tree skill sits in, as a campaign category. */
export function laneOf(swimlane: string | undefined): Branch {
  const lane = swimlane?.toLowerCase();
  return lane === 'push' || lane === 'pull' || lane === 'legs' ? lane : 'core';
}

/** A tree's skills, grouped by line; calisthenics can be narrowed to one lane. */
export function skillGroups(tree: SkillTreeRef, lane?: Branch): Groups {
  const lines = new Map<string, { id: string; label: string }[]>();
  for (const skill of allSkills(tree)) {
    if (tree === 'calisthenics' && lane && laneOf(skill.swimlane) !== lane) continue;
    const line = tree === 'calisthenics' ? skill.subCategory : `${skill.swimlane} · ${skill.subCategory}`;
    const options = lines.get(line) ?? [];
    options.push({ id: skill.id, label: `${tree === 'bouldering' ? '' : `L${skill.level} · `}${skill.name}` });
    lines.set(line, options);
  }
  return [...lines.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([label, options]) => ({ label, options }));
}

/**
 * Catalogue exercises by category, each once under the record it logs to. `metrics` keeps
 * only the ones measured that way (a bodyweight-multiple boss needs a loaded lift).
 */
export function exerciseGroups({ category, metrics, except }: { category?: Branch; metrics?: Metric[]; except?: Set<string> } = {}): Groups {
  const seen = new Set<string>();
  return EXERCISE_CATEGORIES.filter((entry) => !category || entry.id === category).map((entry) => ({
    label: entry.label,
    options: EXERCISE_CATALOG.filter((exercise) => exercise.category === entry.id)
      .sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name))
      .flatMap((exercise) => {
        const key = recordKeyOf(exercise.id);
        if (seen.has(key) || except?.has(key) || (metrics && !metrics.includes(metricOf(key)))) return [];
        seen.add(key);
        return [{ id: key, label: `${exercise.name}${exercise.level ? ` · L${exercise.level}` : ''}` }];
      }),
  }));
}

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

export const SkillSelect: React.FC<{ tree: SkillTreeRef; lane?: Branch; value: string; label: string; placeholder?: string; onChange: (id: string) => void; hint?: string }> = ({
  tree,
  lane,
  value,
  label,
  placeholder,
  onChange,
  hint,
}) => <GroupedSelect label={label} value={value} placeholder={placeholder} groups={skillGroups(tree, lane)} onChange={onChange} hint={hint} />;
