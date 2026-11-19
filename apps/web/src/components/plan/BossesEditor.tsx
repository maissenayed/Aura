'use client';

import React, { useMemo, useState } from 'react';
import { Repeat, Scale } from 'lucide-react';
import { BRANCHES, Branch, CampaignPlan, PlanSpec, newId, normalizeSpec, usesOf } from '../../utils/campaignPlan';
import { BossSpec, Metric } from '../../utils/campaignV3';
import { multipleTarget } from '../../utils/protocolEngine';
import { metricOf } from '../../utils/records';
import { floorsOf, skillOf } from '../../utils/treeIndex';
import { useGame } from '../game/GameProvider';
import { PlateIcon, RouteIcon } from '../game/icons';
import { DeleteButton, EditCard, Group, MoveButtons, NumberField, TextField, moveBy, removeAt, setAt } from './fields';
import { CatalogueField, CatalogueSheet, CategoryChips, SkillField, SkillSheet } from './pickers';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

type Kind = 'skill' | 'reps' | 'multiple' | 'scale';

const REPS: Metric[] = ['reps', 'seconds'];
const LOADED: Metric[] = ['kg', 'added-kg'];

const KINDS: { id: Kind; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'skill', label: 'Tree skill', hint: 'Beaten when you master it on the skill tree. Every skill below it is a weak point.', icon: RouteIcon },
  { id: 'reps', label: 'Max reps', hint: 'An exercise and a number to reach in one set — reps, or seconds for holds.', icon: Repeat },
  { id: 'multiple', label: '× Bodyweight', hint: 'Lift a multiple of your bodyweight. The target follows your weigh-ins.', icon: PlateIcon },
  { id: 'scale', label: 'Target weight', hint: 'Reach a body weight on the scale.', icon: Scale },
];

const kindOf = (boss: BossSpec): Kind => (boss.kind === 'bodyweight' ? boss.mode : boss.kind);

/** The tree lane a category's skill bosses come from. */
const laneLabel = (category: Branch) => BRANCHES.find((branch) => branch.id === category)?.label ?? 'Push';

/**
 * Bosses, by category. Each is one of three kinds: a skill from the tree, an
 * exercise and a max, or bodyweight (a multiple of it lifted, or a weight
 * reached). A boss can wait for others to fall first.
 */
export const BossesEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const { save } = useGame();
  const [category, setCategory] = useState<Branch>('push');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState<Kind | null>(null);

  const counts: Partial<Record<Branch, number>> = {};
  for (const boss of spec.bosses) counts[boss.category] = (counts[boss.category] ?? 0) + 1;
  const shown = spec.bosses.map((boss, index) => ({ boss, index })).filter((entry) => entry.boss.category === category);
  /** Skills that are already a boss, tagged in the picker. */
  const bossSkills = useMemo(
    () => new Map(spec.bosses.flatMap((boss) => (boss.kind === 'skill' ? [[`${boss.tree}:${boss.skill}`, 'Boss'] as [string, string]] : []))),
    [spec.bosses],
  );

  const setBoss = (index: number, next: BossSpec) => onChange({ ...spec, bosses: setAt(spec.bosses, index, next) });
  /** Adds go through the normaliser, which names the boss after what it asks for. */
  const create = (boss: BossSpec) => {
    onChange(normalizeSpec({ ...spec, bosses: [...spec.bosses, boss] }, spec));
    setAdding(null);
    setOpenId(boss.id);
  };
  const base = () => ({ id: newId('boss'), name: '', category });

  return (
    <div className="space-y-6">
      <Group
        title={`Bosses · ${spec.bosses.length}`}
        hint="Pick a category, then a boss: a skill from the tree, an exercise and a max, or your bodyweight. Every step towards it chips at its HP."
      >
        <CategoryChips label="Boss category" value={category} onChange={setCategory} counts={counts} />

        <ul className="space-y-2">
          {shown.length === 0 && <li className="list-none text-[13px] text-fg-4 px-1">No {category} bosses yet.</li>}
          {shown.map(({ boss, index }) => {
            const resolved = plan.bosses.find((entry) => entry.id === boss.id);
            const kind = kindOf(boss);
            const uses = usesOf(plan, 'boss', boss.id);
            const others = spec.bosses.filter((other) => other.id !== boss.id);

            return (
              <EditCard
                key={boss.id}
                title={boss.name}
                meta={`${KINDS.find((entry) => entry.id === kind)?.label} · ${resolved?.epithet ?? ''}`}
                badge={
                  <span className="flex items-center justify-center min-w-8 h-8 px-1 rounded-tag bg-boss-deep text-boss-soft font-display font-extrabold text-[16px] leading-none shrink-0">
                    {index + 1}
                  </span>
                }
                open={openId === boss.id}
                onToggle={() => setOpenId(openId === boss.id ? null : boss.id)}
              >
                <TextField label="Name" value={boss.name} maxLength={60} onChange={(name) => setBoss(index, { ...boss, name })} />

                {boss.kind === 'skill' && (
                  <>
                    <SkillField
                      label="Skill"
                      tree={boss.tree}
                      lane={boss.tree === 'calisthenics' ? laneLabel(boss.category) : undefined}
                      lockTree
                      lockLane={boss.tree === 'calisthenics'}
                      value={boss.skill}
                      aside="hits"
                      tags={bossSkills}
                      sheetEyebrow={boss.name}
                      sheetTitle="Pick the skill to beat"
                      onPick={(_tree, skill) => setBoss(index, { ...boss, skill })}
                    />
                    <p className="text-[12px] text-fg-4">
                      {Math.max(0, floorsOf(boss.tree, boss.skill).length - 1)} skills lead to it. Each one you master is a hit; mastering{' '}
                      {skillOf(boss.tree, boss.skill)?.name ?? 'it'} slays it.
                    </p>
                  </>
                )}

                {boss.kind === 'reps' && (
                  <div className="grid gap-3 sm:grid-cols-[2fr_1fr] sm:items-end">
                    <CatalogueField
                      label="Exercise"
                      category={boss.category}
                      metrics={REPS}
                      value={boss.exercise}
                      sheetEyebrow={boss.name}
                      sheetTitle="Pick the exercise"
                      onPick={(exercise) => setBoss(index, { ...boss, exercise })}
                    />
                    <NumberField
                      label="In one set"
                      suffix={metricOf(boss.exercise) === 'seconds' ? 's' : 'reps'}
                      step={1}
                      value={boss.target}
                      onChange={(target) => setBoss(index, { ...boss, target: Math.max(1, Math.round(target ?? boss.target)) })}
                    />
                  </div>
                )}

                {boss.kind === 'bodyweight' && boss.mode === 'multiple' && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-[2fr_1fr] sm:items-end">
                      <CatalogueField
                        label="Lift"
                        metrics={LOADED}
                        value={boss.exercise}
                        sheetEyebrow={boss.name}
                        sheetTitle="Pick the lift"
                        onPick={(exercise) => setBoss(index, { ...boss, exercise })}
                      />
                      <NumberField
                        label="Bodyweight"
                        suffix="×"
                        step={0.25}
                        value={boss.multiple}
                        onChange={(multiple) => setBoss(index, { ...boss, multiple: Math.min(5, Math.max(0.25, multiple ?? boss.multiple)) })}
                      />
                    </div>
                    <p className="text-[12px] text-fg-4">
                      At {save.bodyWeightKg} kg that is{' '}
                      {(() => {
                        const lift = plan.lifts.find((entry) => entry.id === boss.exercise);
                        const target = multipleTarget(lift, boss.multiple, save.bodyWeightKg);
                        return lift?.unit === 'added-kg' ? `+${target} kg on top of you` : `${target} kg`;
                      })()}
                      .
                    </p>
                  </>
                )}

                {boss.kind === 'bodyweight' && boss.mode === 'scale' && (
                  <NumberField label="Body weight" suffix="kg" step={0.5} value={boss.kg} onChange={(kg) => setBoss(index, { ...boss, kg: kg ?? boss.kg })} />
                )}

                {others.length > 0 && (
                  <fieldset>
                    <legend className="eyebrow block mb-1 text-fg-4">Fight after</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {others.map((other) => {
                        const on = Boolean(boss.after?.includes(other.id));
                        return (
                          <button
                            key={other.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => {
                              const after = on ? (boss.after ?? []).filter((id) => id !== other.id) : [...(boss.after ?? []), other.id];
                              const { after: _after, ...rest } = boss;
                              void _after;
                              setBoss(index, (after.length ? { ...rest, after } : rest) as BossSpec);
                            }}
                            className={`h-8 px-2.5 rounded-tag text-[13px] font-semibold transition active:scale-[.97] cursor-pointer ${
                              on ? 'bg-act text-act-deep' : 'bg-ink-850 text-fg-3 hover:bg-ink-800 hover:text-fg'
                            }`}
                          >
                            {other.name}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <MoveButtons label={boss.name} index={index} count={spec.bosses.length} onMove={(delta) => onChange({ ...spec, bosses: moveBy(spec.bosses, index, delta) })} />
                  <span className="ml-auto">
                    <DeleteButton
                      label={boss.name}
                      uses={uses}
                      onDelete={() => onChange(normalizeSpec({ ...spec, bosses: removeAt(spec.bosses, index) }, spec))}
                    />
                  </span>
                </div>
              </EditCard>
            );
          })}
        </ul>
      </Group>

      <Group title={`New ${category} boss`} hint={adding ? KINDS.find((entry) => entry.id === adding)?.hint : 'Choose what kind of fight it is.'}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {KINDS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={adding === id}
              onClick={() => (id === 'scale' ? create({ ...base(), kind: 'bodyweight', mode: 'scale', kg: spec.bodyweight.goal }) : setAdding(id))}
              className={`h-12 rounded-card border-[1.5px] text-[14px] font-semibold flex items-center justify-center gap-2 transition active:scale-[.97] cursor-pointer ${
                adding === id ? 'bg-ink-800 border-act text-fg' : 'border-dashed border-ink-600 text-fg-2 hover:bg-ink-850 hover:text-fg'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
        {adding === 'skill' && (
          <SkillSheet
            tree="calisthenics"
            lane={laneLabel(category)}
            lockLane
            aside="hits"
            tags={bossSkills}
            eyebrow={`New ${category} boss · Tree skill`}
            title="Pick the skill to beat"
            note="Every skill below it is a weak point: each one you master is a hit."
            onPick={(tree, skill) => create({ ...base(), kind: 'skill', tree, skill })}
            onClose={() => setAdding(null)}
          />
        )}
        {adding === 'reps' && (
          <CatalogueSheet
            category={category}
            metrics={REPS}
            eyebrow={`New ${category} boss · Max reps`}
            title="Pick the exercise"
            note="Measured in reps, or seconds for holds."
            onPick={(exercise) => create({ ...base(), kind: 'reps', exercise, target: metricOf(exercise) === 'seconds' ? 30 : 10 })}
            onClose={() => setAdding(null)}
          />
        )}
        {adding === 'multiple' && (
          <CatalogueSheet
            metrics={LOADED}
            eyebrow={`New ${category} boss · × Bodyweight`}
            title="Pick the lift"
            note="Lifts logged in kg, or kg added on top of you."
            onPick={(exercise) => create({ ...base(), kind: 'bodyweight', mode: 'multiple', exercise, multiple: 1 })}
            onClose={() => setAdding(null)}
          />
        )}
      </Group>
    </div>
  );
};
