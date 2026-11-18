'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { AppShell, ScreenHeader } from '../../components/game/AppShell';
import { useGame } from '../../components/game/GameProvider';
import { BodyMap, GroupStatus } from '../../components/anatomy/BodyMap';
import { Chip } from '../../components/game/kit';
import { MusclePanel, MusclePick, TodayCard, TodayTargets } from '../../components/anatomy/MusclePanel';
import { BodySide, GROUPS, GROUP_BY_ID, MuscleGroup, groupsOfExercise } from '../../components/anatomy/muscleGroups';
import { questKey } from '../../utils/protocolEngine';

/** Anatomy: the body, lit by what today's quest trains; tap a muscle for what it does and the moves that build it. */
export default function AnatomyPage() {
  const today = useTodayTargets();
  const [side, setSide] = useState<BodySide>('front');
  const [pick, setPick] = useState<MusclePick | null>(null);
  const [hovered, setHovered] = useState<MuscleGroup | null>(null);

  const status = today?.status ?? NO_STATUS;
  const close = useCallback(() => setPick(null), []);

  /** From the body (a path was tapped) or from a chip (turn the body to where the group is). */
  const choose = (group: MuscleGroup, pathId: string | null = null) => {
    if (pick?.group === group && (pathId === null || pathId === pick.pathId)) {
      setPick(null);
      return;
    }
    setPick({ group, pathId });
    if (pathId === null) setSide(GROUP_BY_ID[group].side);
  };

  const label = hovered ?? pick?.group ?? null;

  return (
    <AppShell>
      <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_400px] gap-4 lg:gap-6 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <ScreenHeader eyebrow="Body" title="Anatomy" right={<SideSwitch side={side} onChange={setSide} />} />

          <section
            className="relative rounded-card bg-ink-900 overflow-hidden"
            aria-label="Body map"
          >
            <div className="absolute inset-0 dot-grid pointer-events-none" aria-hidden />
            {today && <Legend status={status} />}
            <BodyMap
              side={side}
              status={status}
              selected={pick?.group ?? null}
              onSelect={(group, pathId) => choose(group, pathId)}
              onHover={setHovered}
              className="relative pt-12 pb-14 px-2"
            />
            <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none" aria-live="polite">
              {label && (
                <Chip key={label} tone={pick?.group === label ? 'armour' : 'act'} className="anim-fade">
                  {GROUP_BY_ID[label].name}
                </Chip>
              )}
            </div>
          </section>

          <GroupChips status={status} selected={pick?.group ?? null} onPick={(group) => choose(group)} />

          <TodayCard className="lg:hidden" today={today} onPick={(group) => choose(group)} />
        </div>

        <MusclePanel pick={pick} today={today} onClose={close} onPick={(group) => choose(group)} />
      </main>
    </AppShell>
  );
}

const NO_STATUS: Partial<Record<MuscleGroup, GroupStatus>> = {};

/** Today's day from the campaign, with the muscle groups each mission trains. */
function useTodayTargets(): TodayTargets | null {
  const { gate, derived, save, currentWeek, todayDayId } = useGame();
  return useMemo(() => {
    if (gate !== 'ready') return null;
    const day = derived.week.days.find((entry) => entry.day.id === todayDayId)?.day;
    if (!day) return null;
    const items =
      day.kind === 'rest'
        ? []
        : day.exercises.map((exercise) => ({
            exercise,
            done: Boolean(save.quests[questKey(currentWeek, exercise.id)]),
            groups: groupsOfExercise(exercise),
          }));
    // A group is done once every mission that trains it is ticked.
    const status: Partial<Record<MuscleGroup, GroupStatus>> = {};
    for (const item of items) {
      for (const group of item.groups) {
        if (!item.done) status[group] = 'todo';
        else if (!status[group]) status[group] = 'done';
      }
    }
    return { day, items, status };
  }, [gate, derived, save.quests, currentWeek, todayDayId]);
}

const SideSwitch: React.FC<{ side: BodySide; onChange: (side: BodySide) => void }> = ({ side, onChange }) => (
  <div className="flex gap-1 p-1 rounded-card bg-ink-900" role="tablist" aria-label="Side">
    {(['front', 'back'] as const).map((value) => (
      <button
        key={value}
        type="button"
        role="tab"
        aria-selected={side === value}
        onClick={() => onChange(value)}
        className={`relative h-9 px-3.5 rounded-card font-display font-bold text-[15px] capitalize transition active:scale-[.97] ${
          side === value ? 'bg-ink-800 text-fg' : 'text-fg-4 hover:text-fg'
        }`}
      >
        {side === value && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[18px] h-[3px] rounded-[2px] bg-act" aria-hidden />
        )}
        {value}
      </button>
    ))}
  </div>
);

const Legend: React.FC<{ status: Partial<Record<MuscleGroup, GroupStatus>> }> = ({ status }) => {
  const values = Object.values(status);
  const todo = values.filter((value) => value === 'todo').length;
  const done = values.filter((value) => value === 'done').length;
  if (!todo && !done) return null;
  return (
    <div className="absolute top-3 left-3 z-10 flex gap-2 pointer-events-none">
      {todo > 0 && (
        <Chip tone="act">
          <span className="w-2 h-2 rounded-[2px] bg-fg-3" aria-hidden />
          Today <span className="num">{todo}</span>
        </Chip>
      )}
      {done > 0 && (
        <Chip tone="earned">
          <span className="w-2 h-2 rounded-[2px] bg-earned" aria-hidden />
          Done <span className="num">{done}</span>
        </Chip>
      )}
    </div>
  );
};

/** Every group as a chip; today's come first, chalk to train and gold once trained, the picked one steel. */
const GroupChips: React.FC<{
  status: Partial<Record<MuscleGroup, GroupStatus>>;
  selected: MuscleGroup | null;
  onPick: (group: MuscleGroup) => void;
}> = ({ status, selected, onPick }) => {
  const rank = (group: MuscleGroup) => (status[group] === 'todo' ? 0 : status[group] === 'done' ? 1 : 2);
  const ordered = [...GROUPS].sort((a, b) => rank(a.id) - rank(b.id));
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap no-scrollbar" aria-label="Muscles">
      {ordered.map((group) => {
        const lit = status[group.id];
        const isSelected = selected === group.id;
        return (
          <button
            key={group.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onPick(group.id)}
            className={`h-9 px-3 shrink-0 rounded-tag font-display font-bold text-[14px] tracking-[0.02em] whitespace-nowrap transition active:scale-[.97] ${
              isSelected
                ? 'bg-armour-deep text-armour'
                : lit === 'todo'
                  ? 'bg-ink-800 text-fg'
                  : lit === 'done'
                    ? 'bg-earned-deep text-earned-soft'
                    : 'bg-ink-900 text-fg-4 hover:text-fg'
            }`}
          >
            {group.name}
          </button>
        );
      })}
    </div>
  );
};
