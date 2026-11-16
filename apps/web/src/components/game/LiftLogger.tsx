'use client';

import React from 'react';
import { PlanExercise, formatStatValue, liftOf, unitLabel } from '../../utils/campaignPlan';
import { currentOf } from '../../utils/protocolEngine';
import { useGame } from './GameProvider';
import { prToday } from './helpers';
import { Stepper } from './kit';

/** The lift or working weight an exercise logs, with a PR badge on a record day. Nothing when it logs neither. */
export const LiftLogger: React.FC<{ exercise: PlanExercise }> = ({ exercise }) => {
  const { save, plan, todayIso, logStat, logLoad } = useGame();
  const stat = liftOf(plan, exercise.lift);
  if (!stat && !exercise.load) return null;
  const pr = prToday(save, stat ? stat.id : exercise.id, todayIso);

  return (
    <span className="flex items-center gap-2">
      {pr && <span className="h-6 px-2 rounded-full bg-earned text-earned-deep font-display font-bold text-xs leading-6">PR</span>}
      {stat ? (
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
      ) : exercise.load ? (
        <Stepper
          value={save.loads[exercise.id] ?? exercise.load.start ?? 0}
          step={exercise.load.step}
          unit="kg"
          highlight={pr}
          placeholder={exercise.load.start === null ? 'log it' : undefined}
          ariaLabel={`${exercise.name} working weight`}
          onCommit={(value) => logLoad(exercise, value)}
        />
      ) : null}
    </span>
  );
};
