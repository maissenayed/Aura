'use client';

import React, { useState } from 'react';
import { Minus, Plus, Sparkles, Undo2 } from 'lucide-react';
import { useGame } from '../game/GameProvider';
import { HoldTimer } from '../game/HoldTimer';
import { CheckIcon, LockIcon } from '../game/icons';
import { SkillStatus, TreeSkill } from '../../utils/skillTree';
import {
  addDays,
  landedXp,
  masterySlots,
  masteryXp,
  placementOpen,
  PLACEMENT_EVERY_DAYS,
  skillStateOf,
  skillXpLevel,
} from '../../utils/evidence';
import { logPassDates, parseCountStandard } from '../../utils/skillStandards';
import { toIsoDate } from '../../utils/protocolEngine';
import { SkillTreeDef } from './skillTrees';

/** "18 Nov". */
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const ATTEMPTS = 3;

/**
 * Where a skill stands and the one thing to do about it: test it, prove it
 * again, or place yourself on it. A pass lands it; a second pass on another
 * day, 48 hours to 21 days later, masters it.
 */
export const SkillTestCard: React.FC<{
  tree: SkillTreeDef;
  exercise: TreeSkill;
  status: SkillStatus;
  stepsBefore: number;
  locked: React.ReactNode;
  standard: React.ReactNode;
  onUndo: () => void;
}> = ({ tree, exercise, status, stepsBefore, locked, standard, onUndo }) => {
  const { save, todayIso } = useGame();
  const today = todayIso ?? toIsoDate(new Date());
  const key = `${tree.id}:${exercise.id}`;
  const state = skillStateOf(save, key, today, logPassDates(save, key));
  const level = skillXpLevel(tree.id, exercise.id);
  const line = `${tree.id}:${exercise.subCategory}`;

  if (state.proof === 'mastered') {
    const slot = masterySlots(save).find((entry) => entry.key === key);
    const queued = slot && slot.slotWeek > today;
    return (
      <div className="p-4 rounded-card bg-earned-deep space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow flex items-center gap-2 text-earned-soft">
            <CheckIcon className="w-4 h-4" strokeWidth={3} />
            Mastered · {queued ? `+${slot.xp} XP from ${shortDate(slot.slotWeek)}` : `+${masteryXp(level)} XP`}
          </p>
          <button
            type="button"
            onClick={onUndo}
            className="flex items-center gap-1.5 h-9 px-2.5 rounded-card border border-earned-line text-earned-soft text-xs font-bold hover:border-earned-dim active:scale-[.97] transition cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
        </div>
        {standard}
        {state.passes.length > 0 && <p className="text-[12.5px] text-earned-dim">Proven on {state.passes.map(shortDate).join(', ')}.</p>}
      </div>
    );
  }

  if (status === 'locked') {
    const open = placementOpen(save, line, today);
    const last = save.placements?.[line];
    return (
      <div className="p-4 rounded-card bg-ink-850 space-y-3">
        {locked}
        {standard}
        {open ? (
          <TestPanel
            tree={tree}
            exercise={exercise}
            place
            intro={`Already own this? Pass its test once and the ${stepsBefore} ${stepsBefore === 1 ? 'step' : 'steps'} before it are placed: they open what follows and pay no XP. Then prove this skill on a second day to master it.`}
          />
        ) : (
          <p className="text-[13px] text-fg-3">
            Placement for {exercise.subCategory} opens again on {shortDate(addDays(last as string, PLACEMENT_EVERY_DAYS))}. Until then, climb it one step at a time.
          </p>
        )}
      </div>
    );
  }

  const landed = state.proof === 'landed' && state.window;
  const tooEarly = Boolean(landed && state.window && today < state.window.from);
  return (
    <div className="p-4 rounded-card bg-ink-850 space-y-3">
      <p className="eyebrow flex items-center gap-2 text-act">
        <Sparkles className="w-4 h-4" />
        {state.proof === 'placed' ? 'Placed · prove it to earn its XP' : landed ? `Landed ${shortDate(state.passes[0])}` : 'Ready to train'}
      </p>
      {standard}
      {landed && state.window && (
        <p className="text-[13px] text-fg-2">
          {tooEarly
            ? `Rest it. Prove it again from ${shortDate(state.window.from)}, by ${shortDate(state.window.to)}.`
            : `Prove it again by ${shortDate(state.window.to)} to master it: +${masteryXp(level)} XP.`}
        </p>
      )}
      {!tooEarly && (
        <TestPanel
          tree={tree}
          exercise={exercise}
          intro={
            landed
              ? 'Second test: pass it again and the skill is mastered.'
              : `Test it fresh, after your warm-up. A pass lands it (+${landedXp(level)} XP); a second pass on another day masters it (+${masteryXp(level)} XP).`
          }
        />
      )}
    </div>
  );
};

/** The test itself: a count against the standard (with a hold timer for seconds), or the standard ticked as met. */
const TestPanel: React.FC<{ tree: SkillTreeDef; exercise: TreeSkill; place?: boolean; intro: string }> = ({ tree, exercise, place = false, intro }) => {
  const { testSkill, testsLeft, save, todayIso } = useGame();
  const count = parseCountStandard(exercise.unlockRequirements.trim());
  const [value, setValue] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const key = `${tree.id}:${exercise.id}`;
  const testedToday = (save.tests?.[key] ?? []).some(([day]) => day === todayIso);

  if (testsLeft === 0 && !testedToday) {
    return <p className="text-[13px] text-fg-3">Two tests a day, and both are used. Test fresh tomorrow, after your warm-up.</p>;
  }
  if (attempts >= ATTEMPTS) {
    return <p className="text-[13px] text-fg-3">Three attempts is enough for today. Rest it and test again on another day.</p>;
  }

  const submit = (passed: boolean) => {
    setAttempts((n) => n + 1);
    testSkill(tree.id, exercise.id, passed, place);
  };
  const unit = count?.metric === 'seconds' ? 's' : value === 1 ? 'rep' : 'reps';

  return (
    <div className="space-y-2.5">
      <p className="text-[13px] text-fg-3 leading-relaxed">{intro}</p>
      {count ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center h-11 rounded-card bg-ink-900 border border-ink-700 px-0.5">
              <button
                type="button"
                onClick={() => setValue((n) => Math.max(0, n - (count.metric === 'seconds' ? 5 : 1)))}
                aria-label="Fewer"
                className="w-10 h-10 flex items-center justify-center rounded-card text-fg-3 hover:text-fg cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="num font-bold text-[20px] text-fg min-w-[64px] text-center" aria-live="polite">
                {value} {unit}
              </span>
              <button
                type="button"
                onClick={() => setValue((n) => n + (count.metric === 'seconds' ? 5 : 1))}
                aria-label="More"
                className="w-10 h-10 flex items-center justify-center rounded-card text-fg-3 hover:text-fg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {count.metric === 'seconds' && <HoldTimer compact onDone={(seconds) => setValue(seconds)} />}
          </div>
          <button
            type="button"
            onClick={() => submit(value >= count.value)}
            disabled={value === 0}
            className="w-full h-12 rounded-card bg-fg text-ink-950 font-display font-extrabold uppercase text-lg tracking-[0.02em] active:scale-[.97] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {place ? 'Log placement test' : 'Log test'} · needs {count.value} {count.metric === 'seconds' ? 's' : 'reps'}
          </button>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => submit(true)}
            className="h-12 rounded-card bg-fg text-ink-950 font-display font-extrabold uppercase text-lg tracking-[0.02em] active:scale-[.97] transition cursor-pointer"
          >
            I met it
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            className="h-12 rounded-card border border-ink-600 text-fg text-[14px] font-bold hover:bg-ink-800 active:scale-[.97] transition cursor-pointer"
          >
            Not yet
          </button>
        </div>
      )}
      <p className="text-[12px] text-fg-4">
        {testsLeft} of 2 tests left today{attempts > 0 ? ` · attempt ${attempts + 1} of ${ATTEMPTS}` : ''}
      </p>
    </div>
  );
};

/** The status line for locked skills: the prerequisites still to master. */
export const LockedLine: React.FC<{ missing: number }> = ({ missing }) => (
  <p className="eyebrow flex items-center gap-2 text-fg-3">
    <LockIcon className="w-4 h-4" />
    Locked · master {missing === 1 ? 'this' : `these ${missing}`} first
  </p>
);
