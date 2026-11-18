'use client';

import React, { useState } from 'react';
import { CampaignPlan, PlanSpec, usesOf } from '../../utils/campaignPlan';
import { TrackedLift } from '../../utils/campaignV3';
import { currentOf, formatStatValue } from '../../utils/protocolEngine';
import { metricOf } from '../../utils/records';
import { useGame } from '../game/GameProvider';
import { PlateIcon } from '../game/icons';
import { themeFor } from '../protocol/primitives';
import { DeleteButton, EditCard, Facts, Group, GroupedSelect, NumberField } from './fields';
import { exerciseGroups } from './pickers';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

const UNIT_NAME = { kg: 'kg (load)', 'added-kg': '+kg on bodyweight', reps: 'reps', seconds: 'seconds' } as const;

/**
 * The lifts are the week's exercises: every mission logs its number under
 * its exercise, so progress shows wherever that exercise is trained. Bosses
 * and map goals add the exercises they read. Here each one gets the
 * player's own starting and end-game numbers.
 */
export const LiftsEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const { save } = useGame();
  const [openId, setOpenId] = useState<string | null>(null);
  const own = new Map(spec.lifts.map((entry) => [entry.exercise, entry]));

  /** Writes this lift's own numbers; a lift back on its defaults drops out of the stored list. */
  const setOwn = (id: string, patch: Partial<TrackedLift>) => {
    const current = own.get(id) ?? { exercise: id, metric: metricOf(id), baseline: null, endgame: null };
    const next = { ...current, ...patch };
    const lifts = own.has(id) ? spec.lifts.map((entry) => (entry.exercise === id ? next : entry)) : [...spec.lifts, next];
    onChange({ ...spec, lifts });
  };

  return (
    <Group
      title={`Lifts · ${plan.lifts.length}`}
      hint="Your week's exercises. Log a number when you finish a mission and it lands here, so you can see where you progressed. Bosses and map goals add the exercises they read. Track another exercise to follow it without a mission."
    >
      <ul className="space-y-2">
        {plan.lifts.map((lift) => {
          const theme = themeFor(lift.branch);
          const entry = own.get(lift.id);
          const uses = usesOf(plan, 'lift', lift.id);
          const logged = save.records?.[lift.id] ?? save.stats[lift.id];
          const meta = [
            logged === undefined ? (lift.hasBaseline ? `starts at ${formatStatValue(lift.baseline, lift.unit)}` : 'not logged yet') : `now ${formatStatValue(currentOf(save, lift), lift.unit)}`,
            lift.endgame === null ? 'no end-game number' : `end-game ${formatStatValue(lift.endgame, lift.unit)}`,
          ].join(' · ');
          const history = save.history?.[lift.id] ?? [];

          return (
            <EditCard
              key={lift.id}
              title={lift.name}
              meta={meta}
              badge={
                <span className="w-8 h-8 rounded-tag shrink-0 bg-ink-800 text-fg-3 flex items-center justify-center" aria-hidden>
                  <PlateIcon className="w-4 h-4" />
                </span>
              }
              open={openId === lift.id}
              onToggle={() => setOpenId(openId === lift.id ? null : lift.id)}
            >
              <Facts
                items={[
                  { label: 'Measured in', value: UNIT_NAME[lift.unit] },
                  { label: 'Category', value: theme.label },
                  { label: 'Logged', value: history.length ? `${history.length} day${history.length === 1 ? '' : 's'}` : 'never' },
                  ...(uses.length ? [{ label: 'Used by', value: uses.join(', ') }] : []),
                ]}
              />

              <div className="grid gap-3 grid-cols-2">
                <NumberField
                  label="Starting number"
                  optional
                  placeholder="first log"
                  step={lift.step}
                  value={entry?.baseline ?? null}
                  onChange={(baseline) => setOwn(lift.id, { baseline })}
                  hint="Used until you log it. Empty: the first log sets it."
                />
                <NumberField
                  label="End-game number"
                  optional
                  placeholder="none"
                  step={lift.step}
                  value={entry?.endgame ?? null}
                  onChange={(endgame) => setOwn(lift.id, { endgame: endgame && endgame > 0 ? endgame : null })}
                  hint="The number you are chasing. Reaching it earns a badge."
                />
              </div>

              {entry && !uses.length && (
                <div className="flex justify-end pt-1">
                  <DeleteButton label={`${lift.name} from your lifts`} onDelete={() => onChange({ ...spec, lifts: spec.lifts.filter((other) => other.exercise !== lift.id) })} />
                </div>
              )}
            </EditCard>
          );
        })}
      </ul>
      <GroupedSelect
        label="Track another exercise"
        hideLabel
        value=""
        placeholder="+ Track another exercise…"
        groups={exerciseGroups({ except: new Set(plan.lifts.map((lift) => lift.id)) })}
        onChange={(id) => {
          onChange({ ...spec, lifts: [...spec.lifts, { exercise: id, metric: metricOf(id), baseline: null, endgame: null }] });
          setOpenId(id);
        }}
      />
    </Group>
  );
};
