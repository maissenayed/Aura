'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { AppShell, ScreenHeader } from '../../components/game/AppShell';
import { useGame } from '../../components/game/GameProvider';
import { BodyMap, GroupStatus } from '../../components/anatomy/BodyMap';
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
            className="relative rounded-[22px] border border-ink-700 bg-[linear-gradient(180deg,#0f1322,#0a0d16)] overflow-hidden"
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
                <span
                  key={label}
                  className={`anim-fade h-8 px-3.5 rounded-full border bg-ink-950/90 font-display font-bold text-[14px] flex items-center ${
                    pick?.group === label ? 'border-aura/60 text-aura-soft' : 'border-ink-600 text-fg-2'
                  }`}
                >
                  {GROUP_BY_ID[label].name}
                </span>
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
  <div className="flex p-1 rounded-[14px] bg-ink-850 border border-ink-700" role="tablist" aria-label="Side">
    {(['front', 'back'] as const).map((value) => (
      <button
        key={value}
        type="button"
        role="tab"
        aria-selected={side === value}
        onClick={() => onChange(value)}
        className={`h-9 px-3.5 rounded-[10px] font-display font-bold text-[14px] capitalize transition ${
          side === value ? 'bg-act text-act-deep' : 'text-fg-3 hover:text-fg'
        }`}
      >
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
        <span className="h-7 px-2.5 rounded-full border border-[#17566a] bg-ink-950/80 text-act font-display font-bold text-[13px] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-act" />
          Today {todo}
        </span>
      )}
      {done > 0 && (
        <span className="h-7 px-2.5 rounded-full border border-[#3a2c12] bg-ink-950/80 text-earned font-display font-bold text-[13px] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-earned" />
          Done {done}
        </span>
      )}
    </div>
  );
};

/** Every group as a chip; today's are coloured and come first. */
const GroupChips: React.FC<{
  status: Partial<Record<MuscleGroup, GroupStatus>>;
  selected: MuscleGroup | null;
  onPick: (group: MuscleGroup) => void;
}> = ({ status, selected, onPick }) => {
  const rank = (group: MuscleGroup) => (status[group] === 'todo' ? 0 : status[group] === 'done' ? 1 : 2);
  const ordered = [...GROUPS].sort((a, b) => rank(a.id) - rank(b.id));
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap scrollbar-none" aria-label="Muscles">
      {ordered.map((group) => {
        const lit = status[group.id];
        const isSelected = selected === group.id;
        return (
          <button
            key={group.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onPick(group.id)}
            className={`h-9 px-3.5 shrink-0 rounded-full border font-display font-bold text-[14px] whitespace-nowrap transition active:scale-95 ${
              isSelected
                ? 'border-aura bg-aura/15 text-aura-soft'
                : lit === 'todo'
                  ? 'border-[#17566a] bg-[#08161d] text-act'
                  : lit === 'done'
                    ? 'border-[#3a2c12] bg-[#14100a] text-earned'
                    : 'border-ink-700 bg-ink-850 text-fg-3 hover:text-fg'
            }`}
          >
            {group.name}
          </button>
        );
      })}
    </div>
  );
};
