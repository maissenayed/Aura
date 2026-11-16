'use client';

import React from 'react';
import { PlanExercise, formatStatValue, liftOf, unitLabel } from '../../utils/campaignPlan';
import { currentOf } from '../../utils/protocolEngine';
import { useGame } from './GameProvider';
import { prToday } from './helpers';
import { Stepper } from './kit';

/** The number an exercise logs, with a PR badge on a record day. Nothing when it is ticked, not measured. */
export const LiftLogger: React.FC<{ exercise: PlanExercise }> = ({ exercise }) => {
  const { save, plan, todayIso, logStat } = useGame();
  const stat = liftOf(plan, exercise.lift);
  if (!stat) return null;
  const pr = prToday(save, stat.id, todayIso);

  return (
    <span className="flex items-center gap-2">
      {pr && <span className="h-6 px-2 rounded-full bg-earned text-earned-deep font-display font-bold text-xs leading-6">PR</span>}
      <Stepper
        value={currentOf(save, stat)}
        step={stat.step}
        unit={unitLabel(stat.unit)}
        prefix={stat.unit === 'added-kg' ? '+' : ''}
        highlight={pr}
        placeholder={stat.hasBaseline ? undefined : 'log it'}
        ariaLabel={`${stat.name}, best ${formatStatValue(currentOf(save, stat), stat.unit)}`}
        onCommit={(value) => logStat(stat.id, value)}
      />
    </span>
  );
};
