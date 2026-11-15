'use client';

import React from 'react';
import { BodyweightPlan, StatUnit, TargetOverride } from '../../utils/campaignPlan';
import { NumberField } from './fields';

const suffixFor = (unit: StatUnit | undefined) => (unit === 'reps' ? 'reps' : unit === 'seconds' ? 's' : unit === 'added-kg' ? '+kg' : 'kg');

/**
 * The player's own number for a catalog target. Targets that grow with
 * bodyweight take two numbers: one at the starting weight, one at the goal.
 */
export const TargetFields: React.FC<{
  label: string;
  unit: StatUnit | undefined;
  value: TargetOverride;
  scales: boolean;
  bodyweight: BodyweightPlan;
  onChange: (value: TargetOverride) => void;
}> = ({ label, unit, value, scales, bodyweight, onChange }) => {
  const suffix = suffixFor(unit);
  return (
    <div className="p-2.5 rounded-xl border border-slate-800 bg-dark-950/70">
      <span className="block mb-1.5 text-xs font-bold text-slate-200">{label}</span>
      <div className="grid gap-2 grid-cols-2">
        <NumberField
          label={scales ? `At ${bodyweight.start} kg` : 'Target'}
          suffix={suffix}
          value={value.target}
          onChange={(target) => onChange({ ...value, target: target ?? 0 })}
        />
        {scales && (
          <NumberField
            label={`At ${bodyweight.goal} kg`}
            suffix={suffix}
            value={value.atGoal ?? value.target}
            onChange={(atGoal) => onChange({ ...value, atGoal: atGoal ?? value.target })}
          />
        )}
      </div>
      {scales && <span className="block mt-1 text-[10px] text-slate-500">Moves with your bodyweight between the two.</span>}
    </div>
  );
};
