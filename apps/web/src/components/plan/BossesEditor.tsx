'use client';

import React, { useState } from 'react';
import { Crown, Dumbbell, Repeat, Scale } from 'lucide-react';
import { Branch, CampaignPlan, PlanSpec, newId, normalizeSpec, recordName, usesOf } from '../../utils/campaignPlan';
import { BossSpec } from '../../utils/campaignV3';
import { multipleTarget } from '../../utils/protocolEngine';
import { metricOf } from '../../utils/records';
import { floorsOf, skillOf } from '../../utils/treeIndex';
import { useGame } from '../game/GameProvider';
import { themeFor } from '../protocol/primitives';
import { DeleteButton, EditCard, Group, GroupedSelect, MoveButtons, NumberField, TextField, moveBy, removeAt, setAt } from './fields';
import { CategoryChips, SkillSelect, exerciseGroups } from './pickers';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

type Kind = 'skill' | 'reps' | 'multiple' | 'scale';

const KINDS: { id: Kind; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'skill', label: 'Tree skill', hint: 'Beaten when you master it on the skill tree. Every skill below it is a weak point.', icon: Crown },
  { id: 'reps', label: 'Max reps', hint: 'An exercise and a number to reach in one set — reps, or seconds for holds.', icon: Repeat },
  { id: 'multiple', label: '× Bodyweight', hint: 'Lift a multiple of your bodyweight. The target follows your weigh-ins.', icon: Dumbbell },
  { id: 'scale', label: 'Target weight', hint: 'Reach a body weight on the scale.', icon: Scale },
];

const kindOf = (boss: BossSpec): Kind => (boss.kind === 'bodyweight' ? boss.mode : boss.kind);

/** Adds the current choice to a list of groups when the filter left it out, so a select never shows blank. */
function withCurrent(groups: { label: string; options: { id: string; label: string }[] }[], id: string, label: string) {
  return groups.some((group) => group.options.some((option) => option.id === id)) ? groups : [{ label: 'This boss', options: [{ id, label }] }, ...groups];
}

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
          {shown.length === 0 && <li className="list-none text-[12px] text-fg-4 px-1">No {category} bosses yet.</li>}
          {shown.map(({ boss, index }) => {
            const resolved = plan.bosses.find((entry) => entry.id === boss.id);
            const theme = themeFor(boss.category);
            const kind = kindOf(boss);
            const uses = usesOf(plan, 'boss', boss.id);
            const others = spec.bosses.filter((other) => other.id !== boss.id);

            return (
              <EditCard
                key={boss.id}
                title={boss.name}
                meta={`${KINDS.find((entry) => entry.id === kind)?.label} · ${resolved?.epithet ?? ''}`}
                badge={
                  <span className={`flex items-center justify-center min-w-7 h-7 px-1 rounded-lg border text-[11px] font-black font-mono shrink-0 ${theme.bg} ${theme.text} ${theme.border}`}>
                    {index + 1}
                  </span>
                }
                open={openId === boss.id}
                onToggle={() => setOpenId(openId === boss.id ? null : boss.id)}
              >
                <TextField label="Name" value={boss.name} maxLength={60} onChange={(name) => setBoss(index, { ...boss, name })} />

                {boss.kind === 'skill' && (
                  <>
                    <SkillSelect
                      tree={boss.tree}
                      lane={boss.tree === 'calisthenics' ? boss.category : undefined}
                      label="Skill"
                      value={boss.skill}
                      onChange={(skill) => setBoss(index, { ...boss, skill })}
                    />
                    <p className="text-[11px] text-fg-4">
                      {Math.max(0, floorsOf(boss.tree, boss.skill).length - 1)} skills lead to it. Each one you master is a hit; mastering{' '}
                      {skillOf(boss.tree, boss.skill)?.name ?? 'it'} slays it.
                    </p>
                  </>
                )}

                {boss.kind === 'reps' && (
                  <div className="grid gap-3 grid-cols-[2fr_1fr]">
                    <GroupedSelect
                      label="Exercise"
                      value={boss.exercise}
                      groups={withCurrent(exerciseGroups({ category: boss.category, metrics: ['reps', 'seconds'] }), boss.exercise, recordName(boss.exercise))}
                      onChange={(exercise) => setBoss(index, { ...boss, exercise })}
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
                    <div className="grid gap-3 grid-cols-[2fr_1fr]">
                      <GroupedSelect
                        label="Lift"
                        value={boss.exercise}
                        groups={withCurrent(exerciseGroups({ metrics: ['kg', 'added-kg'] }), boss.exercise, recordName(boss.exercise))}
                        onChange={(exercise) => setBoss(index, { ...boss, exercise })}
                      />
                      <NumberField
                        label="Bodyweight"
                        suffix="×"
                        step={0.25}
                        value={boss.multiple}
                        onChange={(multiple) => setBoss(index, { ...boss, multiple: Math.min(5, Math.max(0.25, multiple ?? boss.multiple)) })}
                      />
                    </div>
                    <p className="text-[11px] text-fg-4">
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
                    <legend className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Fight after</legend>
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
                            className={`h-8 px-3 rounded-full border text-[11.5px] font-semibold cursor-pointer ${
                              on ? 'bg-boss/15 border-boss text-boss-soft' : 'bg-ink-850 border-ink-700 text-fg-3'
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
              onClick={() => (id === 'scale' ? create({ ...base(), kind: 'bodyweight', mode: 'scale', kg: spec.bodyweight.goal }) : setAdding(adding === id ? null : id))}
              className={`h-12 rounded-[14px] border-[1.5px] border-dashed text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer ${
                adding === id ? 'border-act text-act bg-act/5' : 'border-ink-600 text-fg-3 hover:text-fg'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
        {adding === 'skill' && (
          <SkillSelect
            tree="calisthenics"
            lane={category}
            label="Skill"
            value=""
            placeholder="Pick the skill to beat…"
            onChange={(skill) => create({ ...base(), kind: 'skill', tree: 'calisthenics', skill })}
          />
        )}
        {adding === 'reps' && (
          <GroupedSelect
            label="Exercise"
            value=""
            placeholder="Pick the exercise…"
            groups={exerciseGroups({ category, metrics: ['reps', 'seconds'] })}
            onChange={(exercise) => create({ ...base(), kind: 'reps', exercise, target: metricOf(exercise) === 'seconds' ? 30 : 10 })}
          />
        )}
        {adding === 'multiple' && (
          <GroupedSelect
            label="Lift"
            value=""
            placeholder="Pick the lift…"
            groups={exerciseGroups({ metrics: ['kg', 'added-kg'] })}
            onChange={(exercise) => create({ ...base(), kind: 'bodyweight', mode: 'multiple', exercise, multiple: 1 })}
          />
        )}
      </Group>
    </div>
  );
};
