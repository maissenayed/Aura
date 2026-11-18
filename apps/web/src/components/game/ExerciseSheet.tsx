'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, GitBranch, Shield, X } from 'lucide-react';
import { PlanExercise, formatStatValue, liftOf } from '../../utils/campaignPlan';
import { XP_RULES } from '../../utils/protocolEngine';
import { BossHpChip } from './BossHpChip';
import { exerciseInfo, tutorialUrl } from './exerciseInfo';
import { figureForExercise } from './figures';
import { useGame } from './GameProvider';
import { bossesOfExercise, splitTarget } from './helpers';
import { Chip, Figure, Label } from './kit';
import { LiftLogger } from './LiftLogger';

/**
 * One mission up close: the movement, today's dose, the weight it logs, the
 * bosses it hits, and how to do it (from its skill-tree skill). A bottom sheet
 * on phones, a drawer on the right on desktop. Completing it is the button at
 * the bottom, the same as the tick on the card.
 */
export const ExerciseSheet: React.FC<{
  exercise: PlanExercise;
  dayKind: string;
  done: boolean;
  onToggle: () => void;
  onClose: () => void;
  /** The day is closed (more than two days ago, or still ahead): no ticking. */
  locked?: boolean;
}> = ({ exercise, dayKind, done, onToggle, onClose, locked = false }) => {
  const { derived, plan, save } = useGame();
  const lift = liftOf(plan, exercise.lift);
  // The last few logs, newest first: what to beat today.
  const recent = lift ? [...(save.history?.[lift.id] ?? [])].reverse().slice(0, 5) : [];
  const closeRef = useRef<HTMLButtonElement>(null);
  const info = exerciseInfo(exercise.exercise);
  const bosses = bossesOfExercise(derived.bosses, exercise);
  const logs = Boolean(liftOf(plan, exercise.lift));
  const { sets, reps } = splitTarget(exercise.target);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[45] bg-black/60 anim-fade" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={exercise.name}
        className="fixed z-50 inset-x-0 bottom-0 max-h-[90dvh] lg:inset-x-auto lg:right-0 lg:top-0 lg:bottom-0 lg:max-h-none lg:w-[440px] flex flex-col rounded-t-[28px] lg:rounded-none border-t lg:border-t-0 lg:border-l border-ink-700 bg-ink-900 shadow-2xl anim-sheet"
      >
        <div className="lg:hidden flex justify-center pt-2.5" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-ink-600" />
        </div>

        {/* Sections keep their height and the panel scrolls; otherwise the clipped figure box shrinks and cuts the drawing. */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-3 pb-5 lg:px-6 lg:pt-6 flex flex-col gap-5 [&>*]:shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                {done && (
                  <Chip tone="earned">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    Done
                  </Chip>
                )}
                {info?.exact && <Chip>{info.levelName}</Chip>}
                {exercise.armor && (
                  <Chip tone="aura">
                    <Shield className="w-3.5 h-3.5" /> Armor
                  </Chip>
                )}
              </div>
              <h2 className="font-display font-bold text-[26px] leading-tight">{exercise.name}</h2>
              {exercise.focus && <span className="text-[14px] text-fg-4">{exercise.focus}</span>}
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 shrink-0 rounded-xl border border-ink-700 bg-ink-800 text-fg-3 flex items-center justify-center hover:text-fg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative h-[210px] rounded-[22px] border border-ink-700 bg-[linear-gradient(180deg,#0f1322,#0a0d16)] overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 dot-grid pointer-events-none" aria-hidden />
            <Figure
              spec={figureForExercise(exercise.exercise, dayKind)}
              state={done ? 'mastered' : 'ready'}
              animate
              className="relative w-[190px] h-[190px]"
              title={exercise.name}
            />
          </div>

          <section className="flex items-center gap-4 p-4 rounded-[18px] bg-ink-850 border border-ink-700" aria-label="Today's dose">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <Label>Today</Label>
              <span className="font-display font-bold text-[30px] leading-none text-act">
                {sets ? (
                  <>
                    {sets}
                    <span className="text-fg-5 text-xl"> × </span>
                    {reps}
                  </>
                ) : (
                  reps
                )}
              </span>
              {exercise.note && <span className="text-[13px] text-fg-4">{exercise.note}</span>}
            </div>
            {logs && <LiftLogger exercise={exercise} />}
          </section>

          {lift && recent.length > 0 && (
            <section className="flex flex-col gap-2" aria-label="Last logs">
              <Label>Last logs</Label>
              <ol className="flex flex-wrap gap-1.5">
                {recent.map(([date, value], index) => (
                  <li
                    key={date}
                    className={`list-none h-9 px-3 rounded-xl border flex items-center gap-2 text-[13px] ${
                      index === 0 ? 'border-[#17566a] bg-[#08161d] text-act' : 'border-ink-700 bg-ink-850 text-fg-3'
                    }`}
                  >
                    <span className="font-display font-bold">{formatStatValue(value, lift.unit)}</span>
                    <span className="text-[11px] text-fg-5">{date.slice(5).replace('-', '/')}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {bosses.length > 0 && (
            <section className="flex flex-col gap-2" aria-label="Bosses it hits">
              <Label>Hits</Label>
              <div className="flex flex-wrap gap-2">
                {bosses.map((status) => (
                  <BossHpChip key={status.boss.id} status={status} />
                ))}
              </div>
            </section>
          )}

          {info && info.steps.length > 0 && (
            <section className="flex flex-col gap-2" aria-label="How to do it">
              <Label>{info.exact ? 'How to' : `How to · like ${info.skillName}`}</Label>
              <ol className="flex flex-col gap-2">
                {info.steps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-[14px] leading-relaxed text-fg-2">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-ink-800 border border-ink-600 font-display font-bold text-[12px] text-act flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="min-w-0">{step.replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {info?.tip && (
            <div className="pl-3 border-l-2 border-aura/60 flex flex-col gap-1">
              <Label className="text-aura-soft">Tip</Label>
              <p className="text-[14px] text-fg-2 leading-relaxed">{info.tip}</p>
            </div>
          )}

          {info?.standard && info.exact && (
            <div className="flex flex-col gap-1">
              <Label>Mastered when</Label>
              <p className="text-[14px] text-fg-2 leading-relaxed">{info.standard}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {info && (
              <Link
                href={`/?tree=${info.tree}&skill=${info.skillId}`}
                className="h-10 px-3.5 rounded-xl border border-ink-700 bg-ink-850 text-fg-2 flex items-center gap-2 text-[13px] font-semibold hover:border-act/40 hover:text-fg transition"
              >
                <GitBranch className="w-4 h-4 text-act" />
                {info.exact ? 'In the skill tree' : info.skillName}
              </Link>
            )}
            <a
              href={tutorialUrl(exercise.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-3.5 rounded-xl border border-ink-700 bg-ink-850 text-fg-2 flex items-center gap-2 text-[13px] font-semibold hover:border-act/40 hover:text-fg transition"
            >
              <ExternalLink className="w-4 h-4 text-act" />
              Watch a tutorial
            </a>
          </div>
        </div>

        <div className="shrink-0 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] lg:px-6 lg:pb-6 border-t border-ink-750 bg-ink-900">
          <button
            type="button"
            onClick={onToggle}
            disabled={locked}
            aria-pressed={done}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-display font-bold text-lg tracking-[0.04em] active:scale-[.98] transition disabled:opacity-40 disabled:cursor-not-allowed ${
              done
                ? 'bg-earned/15 border border-earned/50 text-earned'
                : 'bg-act text-act-deep shadow-[0_10px_28px_rgba(62,232,255,0.25)]'
            }`}
          >
            <Check className="w-5 h-5" strokeWidth={3} />
            {locked ? (done ? 'DONE · DAY CLOSED' : 'DAY CLOSED') : done ? 'DONE · TAP TO UNDO' : `COMPLETE · +${XP_RULES.mission} XP`}
          </button>
        </div>
      </aside>
    </>
  );
};
