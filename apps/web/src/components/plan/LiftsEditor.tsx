'use client';

import React, { useState } from 'react';
import { LIFT_BY_ID } from '../../data/campaignCatalog';
import { CampaignPlan, PlanSpec, SpecLift, usesOf } from '../../utils/campaignPlan';
import { formatStatValue } from '../../utils/protocolEngine';
import { themeFor } from '../protocol/primitives';
import { liftGroups } from './catalogOptions';
import { DeleteButton, EditCard, Facts, Group, GroupedSelect, MoveButtons, NumberField, moveBy, removeAt, setAt } from './fields';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

const UNIT_NAME = { kg: 'kg (load)', 'added-kg': '+kg on bodyweight', reps: 'reps', seconds: 'seconds' } as const;

export const LiftsEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const setLifts = (lifts: SpecLift[]) => onChange({ ...spec, lifts });
  const tracked = new Set(spec.lifts.map((entry) => entry.lift));

  return (
    <Group
      title={`Lifts · ${spec.lifts.length}`}
      hint="The numbers the game measures, chosen from the lift library. Exercises, bosses and skill trees add the lifts they need by themselves. Set your own starting and end-game numbers; log progress in the Stats tab."
    >
      <ul className="space-y-2">
        {spec.lifts.map((entry, index) => {
          const lift = LIFT_BY_ID.get(entry.lift);
          if (!lift) return null;
          const theme = themeFor(lift.branch);
          const uses = usesOf(plan, 'lift', lift.id);
          const meta = [
            entry.baseline === null ? 'starts on first log' : `starts at ${formatStatValue(entry.baseline, lift.unit)}`,
            entry.endgame === null ? 'no end-game number' : `end-game ${formatStatValue(entry.endgame, lift.unit)}`,
          ].join(' · ');

          return (
            <EditCard
              key={lift.id}
              title={lift.name}
              meta={meta}
              badge={<span className={`w-2.5 h-2.5 rounded-full shrink-0 bg-gradient-to-br ${theme.bar}`} aria-hidden />}
              open={openId === lift.id}
              onToggle={() => setOpenId(openId === lift.id ? null : lift.id)}
            >
              <Facts
                items={[
                  { label: 'Measured in', value: UNIT_NAME[lift.unit] },
                  { label: 'Branch', value: theme.label },
                  { label: 'The number is', value: lift.measure },
                  ...(uses.length ? [{ label: 'Used by', value: uses.join(', ') }] : []),
                ]}
              />
              <p className="text-[11px] text-slate-500">{lift.note}</p>

              <div className="grid gap-3 grid-cols-2">
                <NumberField
                  label="Starting number"
                  optional
                  placeholder="first log"
                  step={lift.step}
                  value={entry.baseline}
                  onChange={(baseline) => setLifts(setAt(spec.lifts, index, { ...entry, baseline }))}
                  hint="Used until you log it. Empty: the first log sets it."
                />
                <NumberField
                  label="End-game number"
                  optional
                  placeholder="none"
                  step={lift.step}
                  value={entry.endgame}
                  onChange={(endgame) => setLifts(setAt(spec.lifts, index, { ...entry, endgame: endgame && endgame > 0 ? endgame : null }))}
                  hint="The number you are chasing. Drives XP and Character."
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <MoveButtons label={lift.name} index={index} count={spec.lifts.length} onMove={(delta) => setLifts(moveBy(spec.lifts, index, delta))} />
                <span className="ml-auto">
                  {uses.length ? (
                    <span className="text-[11px] text-slate-500">In use — remove it from those first.</span>
                  ) : (
                    <DeleteButton label={lift.name} onDelete={() => setLifts(removeAt(spec.lifts, index))} />
                  )}
                </span>
              </div>
            </EditCard>
          );
        })}
      </ul>
      <GroupedSelect
        label="Track another lift"
        hideLabel
        value=""
        placeholder="+ Track another lift…"
        groups={liftGroups(tracked)}
        onChange={(id) => {
          setLifts([...spec.lifts, { lift: id, baseline: null, endgame: LIFT_BY_ID.get(id)?.endgame ?? null }]);
          setOpenId(id);
        }}
      />
    </Group>
  );
};
