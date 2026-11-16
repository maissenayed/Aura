'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, ChevronRight, Hand, Moon, Swords, X } from 'lucide-react';
import type { PlanDay, PlanExercise } from '../../utils/campaignPlan';
import { useMasteredIds } from '../../utils/skillProgressStore';
import { figureForExercise } from '../game/figures';
import { splitTarget } from '../game/helpers';
import { Chip, Figure, Label } from '../game/kit';
import type { GroupStatus } from './BodyMap';
import { GROUPS, GROUP_BY_ID, MuscleGroup, infoOf, movesFor } from './muscleGroups';

export interface TodayItem {
  exercise: PlanExercise;
  done: boolean;
  groups: MuscleGroup[];
}

/** Today's quest as the body sees it. Null when there is no campaign to read (signed out, loading). */
export interface TodayTargets {
  day: PlanDay;
  items: TodayItem[];
  status: Partial<Record<MuscleGroup, GroupStatus>>;
}

export interface MusclePick {
  group: MuscleGroup;
  pathId: string | null;
}

const CARD = 'rounded-[22px] border border-ink-700 bg-[linear-gradient(180deg,#0f1322,#0a0d16)]';

/* ------------------------------------------------------------------ */
/* Today                                                               */
/* ------------------------------------------------------------------ */

/** Today's muscles as chips: cyan still to train, gold done. */
export const TodayCard: React.FC<{ today: TodayTargets | null; onPick: (group: MuscleGroup) => void; className?: string }> = ({
  today,
  onPick,
  className = '',
}) => {
  if (!today) {
    return (
      <section className={`${CARD} p-5 flex items-center gap-3 text-fg-3 ${className}`}>
        <Hand className="w-5 h-5 text-act shrink-0" />
        <span className="text-[15px] font-semibold">Tap a muscle</span>
      </section>
    );
  }

  const { day, items, status } = today;
  const lit = GROUPS.filter((group) => status[group.id]);
  const done = items.filter((item) => item.done).length;

  return (
    <section className={`${CARD} p-4 lg:p-5 flex flex-col gap-4 ${className}`} aria-label="Today's muscles">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-act/10 border border-act/35 text-act flex items-center justify-center">
          {day.kind === 'rest' ? <Moon className="w-5 h-5" /> : <Swords className="w-5 h-5" />}
        </span>
        <span className="flex-1 min-w-0 flex flex-col">
          <Label>Today</Label>
          <span className="font-display font-bold text-[21px] truncate">{day.title}</span>
        </span>
        {items.length > 0 && (
          <span className="font-display font-bold text-[22px] text-earned">
            {done}
            <span className="text-fg-5 text-base">/{items.length}</span>
          </span>
        )}
      </div>

      {lit.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {lit.map((group) => (
            <button key={group.id} type="button" onClick={() => onPick(group.id)} className="active:scale-95 transition">
              <Chip tone={status[group.id] === 'done' ? 'earned' : 'act'}>
                {status[group.id] === 'done' && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                {group.name}
              </Chip>
            </button>
          ))}
        </div>
      ) : (
        <span className="text-[14px] text-fg-4">{day.kind === 'rest' ? 'Everything rests.' : 'Nothing planned.'}</span>
      )}

      {items.length > 0 && (
        <Link
          href="/quest"
          className="h-12 rounded-2xl border border-act/40 bg-act/10 text-act flex items-center justify-center gap-2 font-display font-bold tracking-[0.04em] active:scale-[.98] transition"
        >
          QUEST
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* One muscle                                                          */
/* ------------------------------------------------------------------ */

const TIERS = [
  { label: 'I', min: 1, max: 5 },
  { label: 'II', min: 6, max: 10 },
  { label: 'III', min: 11, max: 15 },
  { label: 'IV', min: 16, max: 20 },
];
const SHOWN = 6;

const MuscleDetail: React.FC<{ pick: MusclePick; today: TodayTargets | null; onClose: () => void }> = ({ pick, today, onClose }) => {
  const group = GROUP_BY_ID[pick.group];
  const info = infoOf(pick.group, pick.pathId);
  const status = today?.status[pick.group];
  const hits = today?.items.filter((item) => item.groups.includes(pick.group)) ?? [];

  const mastered = new Set(useMasteredIds('calisthenics'));
  const moves = useMemo(() => movesFor(pick.group), [pick.group]);
  const byTier = TIERS.map((tier) => moves.filter((move) => move.level >= tier.min && move.level <= tier.max));
  // Open on the lowest tier with something left to master.
  const firstOpen = byTier.findIndex((list) => list.some((move) => !mastered.has(move.id)));
  const [tier, setTier] = useState(firstOpen >= 0 ? firstOpen : 0);
  const [showAll, setShowAll] = useState(false);
  const list = byTier[tier] ?? [];
  const visible = showAll ? list : list.slice(0, SHOWN);

  return (
    <div className="flex flex-col gap-5 p-5 lg:p-6">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {status === 'todo' && <Chip tone="act">Today</Chip>}
            {status === 'done' && (
              <Chip tone="earned">
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                Trained
              </Chip>
            )}
            {info && <Chip>{info.category}</Chip>}
          </div>
          <h2 className="font-display font-bold text-[28px] leading-tight">{group.name}</h2>
          {info && <span className="text-[13px] text-fg-4 italic">{info.latinName}</span>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 shrink-0 rounded-xl border border-ink-700 bg-ink-800 text-fg-3 flex items-center justify-center hover:text-fg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {hits.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Today">
          <Label>Today</Label>
          <ul className="flex flex-col gap-1.5">
            {hits.map((item) => {
              const dose = splitTarget(item.exercise.target);
              return (
                <li key={item.exercise.id}>
                  <Link
                    href="/quest"
                    className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl border transition ${
                      item.done ? 'bg-earned/10 border-earned/35' : 'bg-ink-850 border-ink-700 hover:border-act/40'
                    }`}
                  >
                    <span className={`w-11 h-11 shrink-0 rounded-xl bg-ink-950 border flex items-center justify-center ${item.done ? 'border-[#5c4a22]' : 'border-ink-700'}`}>
                      <Figure
                        spec={figureForExercise(item.exercise.exercise, today?.day.kind)}
                        state={item.done ? 'mastered' : 'ready'}
                        className="w-10 h-10"
                      />
                    </span>
                    <span className={`flex-1 min-w-0 text-[14px] font-semibold truncate ${item.done ? 'text-[#d9c38f]' : 'text-fg-2'}`}>
                      {item.exercise.name}
                    </span>
                    <span className={`shrink-0 font-display font-bold text-[15px] ${item.done ? 'text-earned' : 'text-act'}`}>
                      {dose.sets ? `${dose.sets} × ${dose.reps}` : dose.reps}
                    </span>
                    {item.done && (
                      <span className="w-5 h-5 shrink-0 rounded-full bg-earned flex items-center justify-center" aria-label="Done">
                        <Check className="w-3 h-3 text-earned-deep" strokeWidth={4} />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {info && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label>Does</Label>
            <p className="text-[14px] text-fg-2 leading-relaxed">{info.primaryFunction}</p>
          </div>
          <div className="pl-3 border-l-2 border-aura/60 flex flex-col gap-1">
            <Label className="text-aura-soft">Cue</Label>
            <p className="text-[14px] text-fg-2 leading-relaxed">{info.formTip}</p>
          </div>
          <details className="group rounded-2xl border border-ink-700 bg-ink-850">
            <summary className="flex items-center justify-between gap-2 px-4 h-11 cursor-pointer list-none text-[13px] font-bold text-fg-3">
              Origin · Insertion
              <ChevronDown className="w-4 h-4 transition group-open:rotate-180" />
            </summary>
            <dl className="px-4 pb-4 grid gap-2 text-[13px] leading-relaxed">
              <div>
                <dt className="text-fg-5 font-semibold">Origin</dt>
                <dd className="text-fg-3">{info.origin}</dd>
              </div>
              <div>
                <dt className="text-fg-5 font-semibold">Insertion</dt>
                <dd className="text-fg-3">{info.insertion}</dd>
              </div>
            </dl>
          </details>
        </section>
      )}

      {moves.length > 0 && (
        <section className="flex flex-col gap-3" aria-label="Moves">
          <div className="flex items-center justify-between gap-2">
            <Label>Moves</Label>
            <div className="flex p-1 rounded-xl bg-ink-850 border border-ink-700" role="tablist" aria-label="Tier">
              {TIERS.map((entry, index) => (
                <button
                  key={entry.label}
                  type="button"
                  role="tab"
                  aria-selected={tier === index}
                  disabled={byTier[index].length === 0}
                  onClick={() => {
                    setTier(index);
                    setShowAll(false);
                  }}
                  className={`min-w-10 h-8 px-2 rounded-lg font-display font-bold text-[13px] transition disabled:opacity-30 ${
                    tier === index ? 'bg-act text-act-deep' : 'text-fg-3 hover:text-fg'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="flex flex-col gap-1.5">
            {visible.map((move) => {
              const done = mastered.has(move.id);
              return (
                <li key={move.id}>
                  <Link
                    href={`/?tree=calisthenics&skill=${move.id}`}
                    className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl border transition ${
                      done ? 'bg-earned/10 border-earned/35' : 'bg-ink-850 border-ink-700 hover:border-act/40'
                    }`}
                  >
                    <span
                      className={`w-11 h-11 shrink-0 rounded-full border-2 overflow-hidden flex items-center justify-center bg-ink-950 ${
                        done ? 'border-earned' : 'border-ink-600'
                      }`}
                    >
                      <Figure spec={figureForExercise(move.id)} state={done ? 'mastered' : 'ready'} className="w-9 h-9" />
                    </span>
                    <span className={`flex-1 min-w-0 text-[14px] font-semibold truncate ${done ? 'text-[#d9c38f]' : 'text-fg-2'}`}>
                      {move.name}
                    </span>
                    <span className={`shrink-0 font-display font-bold text-[13px] ${done ? 'text-earned' : 'text-fg-4'}`}>Lv {move.level}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-fg-5" />
                  </Link>
                </li>
              );
            })}
          </ul>

          {list.length > SHOWN && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="h-11 rounded-2xl border border-ink-700 bg-ink-850 text-fg-3 font-display font-bold text-[14px] flex items-center justify-center gap-1.5 hover:text-fg transition"
            >
              {showAll ? 'Less' : `+${list.length - SHOWN}`}
              <ChevronDown className={`w-4 h-4 transition ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}
        </section>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* The panel                                                           */
/* ------------------------------------------------------------------ */

/**
 * Desktop: a column beside the body showing the picked muscle, or today's
 * muscles when none is picked. Phones: a bottom sheet, only while a muscle is picked.
 */
export const MusclePanel: React.FC<{
  pick: MusclePick | null;
  today: TodayTargets | null;
  onClose: () => void;
  onPick: (group: MuscleGroup) => void;
}> = ({ pick, today, onClose, onPick }) => {
  useEffect(() => {
    if (!pick) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pick, onClose]);

  return (
    <>
      {pick && <div className="lg:hidden fixed inset-0 z-[45] bg-black/60 anim-fade" onClick={onClose} aria-hidden />}
      <aside
        aria-label={pick ? GROUP_BY_ID[pick.group].name : "Today's muscles"}
        className={`${pick ? 'flex' : 'hidden'} lg:flex flex-col fixed lg:sticky inset-x-0 bottom-0 lg:top-8 z-50 lg:z-auto max-h-[82dvh] lg:max-h-[calc(100dvh-4rem)] rounded-t-[28px] lg:rounded-none border-t lg:border-t-0 border-ink-700 bg-ink-900 lg:bg-transparent shadow-2xl lg:shadow-none anim-sheet lg:animate-none`}
      >
        <div className="lg:hidden flex justify-center pt-2.5" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-ink-600" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {pick ? (
            <div className="lg:rounded-[22px] lg:border lg:border-ink-700 lg:bg-[linear-gradient(180deg,#0f1322,#0a0d16)]">
              <MuscleDetail key={pick.group} pick={pick} today={today} onClose={onClose} />
            </div>
          ) : (
            <TodayCard today={today} onPick={onPick} />
          )}
        </div>
      </aside>
    </>
  );
};
