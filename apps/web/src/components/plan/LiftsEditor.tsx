'use client';

import React, { useMemo, useState } from 'react';
import { CampaignPlan, PlanSpec, usesOf, withoutLift } from '../../utils/campaignPlan';
import { TrackedLift } from '../../utils/campaignV3';
import { currentOf, formatStatValue } from '../../utils/protocolEngine';
import { metricOf } from '../../utils/records';
import { useGame } from '../game/GameProvider';
import { figureForLift, heldPose } from '../game/figures';
import { Figure } from '../game/kit';
import { themeFor } from '../protocol/primitives';
import { DeleteButton, EditCard, Facts, Group, NumberField } from './fields';
import { CatalogueField } from './pickers';

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
  const tracked = useMemo(() => new Set(plan.lifts.map((lift) => lift.id)), [plan.lifts]);

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
      hint="Your week's exercises. Log a number when you finish a mission and it lands here, so you can see where you progressed. Bosses and map goals add the exercises they read. Track another exercise to follow it without a mission; delete one to take it out of the plan with the missions, bosses and goals that use it."
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
                <span className="w-10 h-10 rounded-tag shrink-0 bg-ink-950 flex items-center justify-center" aria-hidden>
                  <Figure spec={heldPose(figureForLift(lift))} className="w-9 h-9" />
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

              <div className="flex justify-end pt-1">
                <DeleteButton
                  label={lift.name}
                  detail={uses.length ? `Also deleted: ${uses.join(', ')}. What you logged for it stays.` : 'What you logged for it stays.'}
                  onDelete={() => {
                    setOpenId(null);
                    onChange(withoutLift(spec, lift.id));
                  }}
                />
              </div>
            </EditCard>
          );
        })}
      </ul>
      <CatalogueField
        label="Track another exercise"
        hideLabel
        placeholder="Track another exercise"
        placeholderNote="Any exercise in the catalogue, followed without a mission"
        tracked={tracked}
        sheetEyebrow="Lifts"
        sheetTitle="Track an exercise"
        onPick={(id) => {
          onChange({ ...spec, lifts: [...spec.lifts, { exercise: id, metric: metricOf(id), baseline: null, endgame: null }] });
          setOpenId(id);
        }}
      />
    </Group>
  );
};
