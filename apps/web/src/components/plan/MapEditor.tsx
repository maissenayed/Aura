'use client';

import React, { useState } from 'react';
import { Act, ActGoal, CampaignPlan, PlanSpec, newId } from '../../utils/campaignPlan';
import {
  AddButton,
  DeleteButton,
  EditCard,
  Group,
  MoveButtons,
  NumberField,
  SelectField,
  TextField,
  moveBy,
  removeAt,
  setAt,
} from './fields';

type GoalKind = ActGoal['kind'];

const GOAL_KINDS: { id: GoalKind; label: string }[] = [
  { id: 'weight', label: 'Bodyweight' },
  { id: 'lift', label: 'Lift number' },
  { id: 'boss', label: 'Boss' },
  { id: 'tier', label: 'Skill-tree tier' },
  { id: 'milestone', label: 'Milestone' },
];

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

interface Props {
  spec: PlanSpec;
  /** The same plan built out from the catalog: what the goals can point at. */
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

export const MapEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const setActs = (acts: Act[]) => onChange({ ...spec, acts });
  const bw = spec.bodyweight;
  const setBw = (patch: Partial<PlanSpec['bodyweight']>) => onChange({ ...spec, bodyweight: { ...bw, ...patch } });

  const add = () => {
    const act: Act = { id: newId('act'), name: 'New act', tagline: '', goals: [] };
    setActs([...plan.acts, act]);
    setOpenId(act.id);
  };

  return (
    <div className="space-y-8">
      <Group
        title="Bodyweight"
        hint="Where you start and where you are heading — up or down. Gates that grow with bodyweight scale between these two numbers. Weigh in on the Campaign tab."
      >
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          <NumberField label="Starting weight" suffix="kg" value={bw.start} onChange={(start) => setBw({ start: start ?? bw.start })} />
          <NumberField label="Goal weight" suffix="kg" value={bw.goal} onChange={(goal) => setBw({ goal: goal ?? bw.goal })} />
          <NumberField
            label="Change per week"
            suffix="kg"
            step={0.05}
            value={bw.weeklyChangeKg}
            onChange={(weeklyChangeKg) => setBw({ weeklyChangeKg: weeklyChangeKg ?? bw.weeklyChangeKg })}
            hint="Sets the weekly pace once the dated weight goals run out."
          />
          <NumberField
            label="Protein a day"
            suffix="g"
            optional
            placeholder="not tracked"
            value={bw.proteinGrams}
            onChange={(proteinGrams) => setBw({ proteinGrams })}
          />
          <TextField
            className="col-span-2"
            label="Calories"
            value={bw.calories}
            maxLength={60}
            placeholder="+300–400 kcal"
            onChange={(calories) => setBw({ calories })}
          />
        </div>
      </Group>

      <Group
        title={`Acts · ${plan.acts.length}`}
        hint="The campaign map, played in order. An act is complete when every goal on it is reached; the first unfinished act is the one shown in the header."
      >
        <ul className="space-y-2">
          {spec.acts.map((act, index) => (
            <ActCard
              key={act.id}
              plan={plan}
              act={act}
              index={index}
              open={openId === act.id}
              onToggle={() => setOpenId(openId === act.id ? null : act.id)}
              count={spec.acts.length}
              onChange={(next) => setActs(setAt(spec.acts, index, next))}
              onMove={(delta) => setActs(moveBy(spec.acts, index, delta))}
              onDelete={() => setActs(removeAt(spec.acts, index))}
            />
          ))}
        </ul>
        <AddButton label="Add an act" onClick={add} disabled={spec.acts.length >= 10} />
      </Group>
    </div>
  );
};

interface ActCardProps {
  plan: CampaignPlan;
  act: Act;
  index: number;
  count: number;
  open: boolean;
  onToggle: () => void;
  onChange: (act: Act) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
}

const ActCard: React.FC<ActCardProps> = ({ plan, act, index, count, open, onToggle, onChange, onMove, onDelete }) => {
  const setGoals = (goals: ActGoal[]) => onChange({ ...act, goals });
  const tiers = plan.trees.flatMap((tree) => tree.tiers.map((tier) => ({ id: tier.id, label: `${tree.name} · ${tier.rung} · ${tier.name}` })));

  const blank = (kind: GoalKind, id = newId('goal')): ActGoal | null => {
    switch (kind) {
      case 'weight':
        return { id, kind, label: 'Weight goal', kg: plan.bodyweight.goal };
      case 'lift':
        return plan.lifts[0] ? { id, kind, lift: plan.lifts[0].id, target: plan.lifts[0].endgame ?? 0 } : null;
      case 'boss':
        return plan.bosses[0] ? { id, kind, boss: plan.bosses[0].id } : null;
      case 'tier':
        return tiers[0] ? { id, kind, tier: tiers[0].id } : null;
      case 'milestone':
        return plan.milestones[0] ? { id, kind, milestone: plan.milestones[0].id } : null;
    }
  };

  const available = GOAL_KINDS.filter((kind) => blank(kind.id) !== null);

  return (
    <EditCard
      title={act.name}
      meta={`${act.goals.length} goal${act.goals.length === 1 ? '' : 's'}${act.tagline ? ` · ${act.tagline}` : ''}`}
      badge={
        <span className="flex items-center justify-center w-8 h-8 rounded-lg border border-cyan-500/40 bg-cyan-950/30 text-neon-cyan text-xs font-black font-mono shrink-0">
          {NUMERALS[index] ?? index + 1}
        </span>
      }
      open={open}
      onToggle={onToggle}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Name" value={act.name} maxLength={60} onChange={(name) => onChange({ ...act, name })} />
        <TextField label="Tagline" value={act.tagline} maxLength={200} onChange={(tagline) => onChange({ ...act, tagline })} />
      </div>

      <fieldset className="space-y-2">
        <legend className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Goals</legend>
        {act.goals.length === 0 && <p className="text-[11px] text-slate-500">No goals yet. An act without goals is skipped on the map.</p>}
        {act.goals.map((goal, goalIndex) => (
          <div key={goal.id} className="p-3 rounded-xl border border-slate-800 bg-dark-950/70 space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <SelectField<GoalKind>
                className="flex-1 min-w-[180px]"
                label={`Goal ${goalIndex + 1}`}
                value={goal.kind}
                options={available.some((kind) => kind.id === goal.kind) ? available : [...available, GOAL_KINDS.find((k) => k.id === goal.kind)!]}
                onChange={(kind) => {
                  const next = blank(kind, goal.id);
                  if (next) setGoals(setAt(act.goals, goalIndex, next));
                }}
              />
              <span className="flex items-center gap-1 ml-auto">
                <MoveButtons label={`goal ${goalIndex + 1}`} index={goalIndex} count={act.goals.length} onMove={(delta) => setGoals(moveBy(act.goals, goalIndex, delta))} />
                <DeleteButton compact label={`goal ${goalIndex + 1}`} onDelete={() => setGoals(removeAt(act.goals, goalIndex))} />
              </span>
            </div>

            {goal.kind === 'weight' && (
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                <TextField
                  className="col-span-2 sm:col-span-1"
                  label="Label"
                  value={goal.label}
                  maxLength={40}
                  placeholder="Month 1"
                  onChange={(label) => setGoals(setAt(act.goals, goalIndex, { ...goal, label }))}
                />
                <NumberField label="Weight" suffix="kg" value={goal.kg} onChange={(kg) => setGoals(setAt(act.goals, goalIndex, { ...goal, kg: kg ?? goal.kg }))} />
                <NumberField
                  label="By week"
                  optional
                  step={1}
                  placeholder="any time"
                  value={goal.week}
                  onChange={(week) => {
                    const { week: _week, ...rest } = goal;
                    void _week;
                    setGoals(setAt(act.goals, goalIndex, week === null ? rest : { ...rest, week: Math.max(1, Math.round(week)) }));
                  }}
                />
              </div>
            )}

            {goal.kind === 'lift' && (
              <>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-[2fr_1fr]">
                  <SelectField
                    className="col-span-2 sm:col-span-1"
                    label="Lift"
                    value={goal.lift}
                    options={plan.lifts.map((lift) => ({ id: lift.id, label: lift.name }))}
                    onChange={(lift) => setGoals(setAt(act.goals, goalIndex, { ...goal, lift }))}
                  />
                  <NumberField
                    label="Target"
                    suffix={(() => {
                      const unit = plan.lifts.find((lift) => lift.id === goal.lift)?.unit;
                      return unit === 'reps' ? 'reps' : unit === 'seconds' ? 's' : unit === 'added-kg' ? '+kg' : 'kg';
                    })()}
                    value={goal.target}
                    onChange={(target) => setGoals(setAt(act.goals, goalIndex, { ...goal, target: target ?? 0 }))}
                  />
                </div>
                <TextField
                  label="Label (optional)"
                  value={goal.label ?? ''}
                  maxLength={60}
                  placeholder="Uses the lift name"
                  onChange={(label) => setGoals(setAt(act.goals, goalIndex, { ...goal, label }))}
                />
              </>
            )}

            {goal.kind === 'boss' && (
              <SelectField
                label="Boss"
                value={goal.boss}
                options={plan.bosses.map((boss, i) => ({ id: boss.id, label: `${i + 1} · ${boss.name}` }))}
                onChange={(boss) => setGoals(setAt(act.goals, goalIndex, { ...goal, boss }))}
              />
            )}

            {goal.kind === 'tier' && (
              <SelectField label="Tier" value={goal.tier} options={tiers} onChange={(tier) => setGoals(setAt(act.goals, goalIndex, { ...goal, tier }))} />
            )}

            {goal.kind === 'milestone' && (
              <SelectField
                label="Milestone"
                value={goal.milestone}
                options={plan.milestones.map((milestone) => ({ id: milestone.id, label: milestone.name }))}
                onChange={(milestone) => setGoals(setAt(act.goals, goalIndex, { ...goal, milestone }))}
              />
            )}
          </div>
        ))}
        {act.goals.length < 30 && (
          <div className="flex flex-wrap gap-2">
            {available.map((kind) => (
              <button
                key={kind.id}
                type="button"
                onClick={() => {
                  const next = blank(kind.id);
                  if (next) setGoals([...act.goals, next]);
                }}
                className="h-9 px-3 rounded-xl border border-dashed border-slate-700 text-[11px] font-bold text-slate-400 hover:text-neon-cyan hover:border-cyan-500/50 transition cursor-pointer"
              >
                + {kind.label}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <MoveButtons label={act.name} index={index} count={count} onMove={onMove} />
        <span className="ml-auto">
          <DeleteButton label={act.name || 'this act'} onDelete={onDelete} />
        </span>
      </div>
    </EditCard>
  );
};
