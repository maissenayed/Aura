'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Flame, LocateFixed, Moon, Shield } from 'lucide-react';
import { ScreenHeader } from '../../../components/game/AppShell';
import { useGame } from '../../../components/game/GameProvider';
import { figureForExercise } from '../../../components/game/figures';
import { BossHpChip } from '../../../components/game/BossHpChip';
import { ExerciseSheet } from '../../../components/game/ExerciseSheet';
import { LiftLogger } from '../../../components/game/LiftLogger';
import { bossesOfExercise, shortDay, splitTarget } from '../../../components/game/helpers';
import { Chip, Figure, Label, Ring, SegmentBar, TickButton } from '../../../components/game/kit';
import { EVENT_VISUAL } from '../../../components/protocol/Toasts';
import { DAY_NAMES, DayId, PlanExercise, formatStatValue, liftOf } from '../../../utils/campaignPlan';
import { XP_RULES, questKey, restKey } from '../../../utils/protocolEngine';

/** Today's quest: the day's missions, ticked and logged, filling a bar towards the day's chest. */
export default function QuestPage() {
  const game = useGame();
  const { derived, save, viewWeek, currentWeek, todayDayId, selectedDayId, streak, todayIso } = game;
  const { week } = derived;
  const selected = week.days.find((entry) => entry.day.id === selectedDayId) ?? week.days[0];
  const day = selected.day;
  const isLiveWeek = viewWeek === currentWeek;
  const awayFromToday = !isLiveWeek || (todayDayId !== null && selectedDayId !== todayDayId);
  const isRest = day.kind === 'rest';
  const rest = restKey(viewWeek, day.id);
  const missionDone = isRest
    ? [Boolean(save.quests[rest])]
    : day.exercises.map((exercise) => Boolean(save.quests[questKey(viewWeek, exercise.id)]));
  const [openId, setOpenId] = useState<string | null>(null);
  const closeSheet = useCallback(() => setOpenId(null), []);
  // The panel belongs to a mission of the day on screen; switching day closes it.
  const opened = isRest ? undefined : day.exercises.find((exercise) => exercise.id === openId);

  return (
    <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-5">
      <ScreenHeader
        eyebrow={`${shortDay(DAY_NAMES[day.id as DayId])} · Week ${viewWeek}`}
        title={day.title}
        right={
          <Chip tone="earned" className="h-9 px-3 text-[15px]">
            <Flame className="w-4 h-4" />
            {streak}
          </Chip>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="flex flex-col gap-4 min-w-0">
          {/* Week strip */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => game.setViewWeek(viewWeek - 1)}
              disabled={viewWeek <= 1}
              aria-label="Previous week"
              className="w-9 h-9 shrink-0 rounded-xl border border-ink-700 bg-ink-850 text-fg-3 flex items-center justify-center disabled:opacity-30 hover:text-fg transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 grid grid-cols-7 gap-1.5">
              {week.days.map((entry) => {
                const active = entry.day.id === day.id;
                const isToday = isLiveWeek && entry.day.id === todayDayId;
                const restDay = entry.day.kind === 'rest';
                return (
                  <button
                    key={entry.day.id}
                    type="button"
                    onClick={() => game.setSelectedDay(entry.day.id)}
                    aria-pressed={active}
                    aria-label={`${entry.name}${isToday ? ', today' : ''}, ${entry.done} of ${entry.total}`}
                    className={`h-[58px] rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      active
                        ? 'bg-[#08161d] border-act'
                        : entry.cleared
                          ? 'bg-[#120e07] border-[#4a3a18]'
                          : 'bg-ink-850 border-ink-750 hover:border-ink-600'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${active ? 'text-act' : entry.cleared ? 'text-earned' : 'text-fg-5'}`}>
                      {entry.name.slice(0, 1)}
                    </span>
                    {entry.cleared ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffc247" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : restDay ? (
                      <Moon className="w-[15px] h-[15px] text-fg-5" />
                    ) : isToday || active ? (
                      <span className={`font-display font-bold text-[12px] ${active ? 'text-act' : 'text-fg-3'}`}>
                        {entry.done}/{entry.total}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-600" />
                    )}
                    {isToday && !active && <span className="sr-only">today</span>}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => game.setViewWeek(viewWeek + 1)}
              aria-label="Next week"
              className="w-9 h-9 shrink-0 rounded-xl border border-ink-700 bg-ink-850 text-fg-3 flex items-center justify-center hover:text-fg transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {awayFromToday && (
            <button
              type="button"
              onClick={game.jumpToToday}
              className="self-start flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#08161d] border border-[#17566a] text-act text-xs font-bold cursor-pointer"
            >
              <LocateFixed className="w-3.5 h-3.5" /> Back to today
            </button>
          )}

          {/* Progress to the chest */}
          <div className="flex items-center gap-3">
            <SegmentBar done={missionDone} className="flex-1" />
            <Chest open={selected.cleared} />
          </div>

          {day.warmUps.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Label className="mr-1">Warm-up</Label>
              {day.warmUps.map((warmUp, index) => (
                <span key={`${index}_${warmUp}`} className="h-7 px-2.5 rounded-full bg-ink-800 border border-ink-700 text-xs text-fg-3 flex items-center">
                  {warmUp}
                </span>
              ))}
            </div>
          )}

          {isRest ? (
            <button
              type="button"
              onClick={() => game.toggleQuest(rest)}
              aria-pressed={missionDone[0]}
              className={`flex items-center gap-4 p-5 rounded-[22px] border-[1.5px] text-left transition cursor-pointer ${
                missionDone[0] ? 'bg-[#100d07] border-[#4a3a18]' : 'bg-ink-850 border-ink-700 hover:border-ink-600'
              }`}
            >
              <span className={`w-14 h-14 rounded-2xl flex items-center justify-center ${missionDone[0] ? 'bg-earned text-earned-deep' : 'bg-ink-800 text-fg-3'}`}>
                <Moon className="w-7 h-7" />
              </span>
              <span className="flex flex-col gap-1">
                <span className={`font-display font-bold text-xl ${missionDone[0] ? 'text-earned' : 'text-fg'}`}>
                  {missionDone[0] ? 'Rest claimed' : 'Claim your rest'}
                </span>
                <span className="text-sm text-fg-4">+{XP_RULES.mission} XP</span>
              </span>
            </button>
          ) : day.exercises.length === 0 ? (
            <Link href="/forge" className="p-5 rounded-[22px] border-[1.5px] border-dashed border-[#17566a] text-act font-display font-bold text-center">
              No missions yet — add some in the Forge
            </Link>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {day.exercises.map((exercise) => (
                <MissionCard
                  key={exercise.id}
                  exercise={exercise}
                  dayKind={day.kind}
                  done={Boolean(save.quests[questKey(viewWeek, exercise.id)])}
                  onToggle={() => game.toggleQuest(questKey(viewWeek, exercise.id))}
                  onOpen={() => setOpenId(exercise.id)}
                />
              ))}
            </ul>
          )}
          <span className="sr-only" aria-live="polite">
            {todayIso && selected.cleared ? `${selected.name} cleared` : ''}
          </span>
        </div>

        <aside className="flex flex-col gap-4 min-w-0">
          <ArmorCard />
          <GatesCard />
          <BattleLog />
        </aside>
      </div>

      {opened && (
        <ExerciseSheet
          exercise={opened}
          dayKind={day.kind}
          done={Boolean(save.quests[questKey(viewWeek, opened.id)])}
          onToggle={() => game.toggleQuest(questKey(viewWeek, opened.id))}
          onClose={closeSheet}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */

const Chest: React.FC<{ open: boolean }> = ({ open }) => (
  <span
    role="img"
    aria-label={open ? 'Chest open — day cleared' : 'Chest, opens when every mission is done'}
    className={`w-11 h-11 shrink-0 rounded-[14px] border-[1.5px] flex items-center justify-center transition ${
      open ? 'bg-[#1a1208] border-earned shadow-[0_0_18px_rgba(255,194,71,0.5)]' : 'bg-ink-850 border-ink-600'
    }`}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={open ? '#ffc247' : '#4a5470'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="10" width="18" height="10" rx="1.5" />
      <path d="M3 10c0-3.5 3-5.5 9-5.5s9 2 9 5.5" />
      <path d="M3 13.5h18" />
      <rect x="10.5" y="12" width="3" height="4" rx=".6" />
    </svg>
  </span>
);

const MissionCard: React.FC<{ exercise: PlanExercise; dayKind: string; done: boolean; onToggle: () => void; onOpen: () => void }> = ({
  exercise,
  dayKind,
  done,
  onToggle,
  onOpen,
}) => {
  const { plan, derived } = useGame();
  const [xpFloat, setXpFloat] = useState(0);
  const logs = Boolean(liftOf(plan, exercise.lift) || exercise.load);
  const { sets, reps } = splitTarget(exercise.target);
  const bosses = bossesOfExercise(derived.bosses, exercise);

  useEffect(() => {
    if (!xpFloat) return;
    const timer = window.setTimeout(() => setXpFloat(0), 1300);
    return () => window.clearTimeout(timer);
  }, [xpFloat]);

  const toggle = () => {
    if (!done) setXpFloat(Date.now());
    onToggle();
  };

  return (
    <li
      className={`flex flex-col gap-2.5 p-3 rounded-[20px] border-[1.5px] transition-colors ${
        done ? 'bg-[#100d07] border-[#4a3a18]' : 'bg-ink-850 border-ink-700 hover:border-ink-600'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* The mission itself opens its panel; the tick beside it completes it. */}
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={`${exercise.name}: how to do it`}
          className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-2xl -m-1 p-1 active:scale-[.99] transition cursor-pointer focus-visible:outline-2 focus-visible:outline-act"
        >
          <span className={`w-[54px] h-[54px] shrink-0 rounded-2xl bg-ink-950 border flex items-center justify-center ${done ? 'border-[#5c4a22]' : 'border-ink-700'}`}>
            <Figure spec={figureForExercise(exercise.exercise, dayKind)} state={done ? 'mastered' : 'ready'} className="w-12 h-12" />
          </span>
          <span className="flex-1 min-w-0 flex flex-col gap-1">
            <span className={`text-[14.5px] font-semibold truncate ${done ? 'text-[#d9c38f]' : 'text-fg-2'}`}>{exercise.name}</span>
            <span className={`font-display font-bold text-[22px] leading-none ${done ? 'text-earned' : 'text-fg'}`}>
              {sets ? (
                <>
                  {sets}
                  <span className="text-fg-5 text-base"> × </span>
                  {reps}
                </>
              ) : (
                reps
              )}
            </span>
          </span>
          <ChevronRight className="w-4 h-4 shrink-0 text-fg-5" aria-hidden />
        </button>
        <span className="relative">
          {xpFloat > 0 && (
            <span key={xpFloat} className="absolute right-0 -top-6 font-display font-bold text-[15px] text-earned whitespace-nowrap anim-float">
              +{XP_RULES.mission} XP
            </span>
          )}
          <TickButton done={done} onClick={toggle} label={`${done ? 'Undo' : 'Complete'} ${exercise.name}`} />
        </span>
      </div>

      {(logs || bosses.length > 0 || exercise.armor) && (
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-ink-750">
          {bosses.map((status) => (
            <BossHpChip key={status.boss.id} status={status} />
          ))}
          {exercise.armor && (
            <Chip tone="aura">
              <Shield className="w-3.5 h-3.5" /> Armor
            </Chip>
          )}
          <span className="flex-1" />
          <LiftLogger exercise={exercise} />
        </div>
      )}
    </li>
  );
};

const ArmorCard: React.FC = () => {
  const { derived, viewWeek, toggleQuest } = useGame();
  const { armor, armorCount } = derived.week;
  if (armor.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 p-4 rounded-[20px] bg-ink-900 border border-ink-700" aria-label="Tendon armor this week">
      <div className="flex items-center gap-2">
        <Shield className="w-[18px] h-[18px] text-act" />
        <h2 className="flex-1 font-display font-bold text-base">Armor</h2>
        <span className="font-display font-bold text-sm text-earned">
          {armorCount}
          <span className="text-fg-5">/{armor.length}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-2">
        {armor.map(({ piece, forged }) => (
          <button
            key={piece.id}
            type="button"
            onClick={() => toggleQuest(questKey(viewWeek, piece.id))}
            aria-pressed={forged}
            title={`${piece.drill} — ${piece.when}`}
            aria-label={`${piece.slot}: ${piece.drill}${forged ? ', forged' : ''}`}
            className="h-[70px] flex flex-col items-center justify-center gap-1.5 rounded-2xl hover:bg-ink-800 transition cursor-pointer"
          >
            <svg width="30" height="34" viewBox="0 0 24 26" aria-hidden="true">
              <path
                d="M20 14c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 21.5 4 19 4 14V7a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 4.81 17 6 19 6a1 1 0 0 1 1 1z"
                fill={forged ? '#ffc247' : 'rgba(62,232,255,.08)'}
                stroke={forged ? '#ffc247' : '#3ee8ff'}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              {forged && <path d="M8.5 13.5l2.5 2.5 4.5-5" fill="none" stroke="#1a1204" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
            <span className={`text-[10.5px] font-semibold ${forged ? 'text-earned' : 'text-act'}`}>{piece.slot}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

const GatesCard: React.FC = () => {
  const { derived } = useGame();
  const gates = derived.gates.slice(0, 4);
  if (gates.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 p-4 rounded-[20px] bg-ink-900 border border-ink-700" aria-label="Next gates">
      <h2 className="font-display font-bold text-base">Next gates</h2>
      {gates.map((gate) => (
        <div key={gate.stat.id} className="flex items-center gap-3" title={gate.unlocks}>
          <Ring value={gate.closeness} size={40} stroke={4} tone="act">
            <span className="font-display font-bold text-[10px] text-act">{Math.round(gate.closeness * 100)}</span>
          </Ring>
          <span className="flex-1 min-w-0 flex flex-col">
            <span className="text-[13px] font-semibold text-fg-2 truncate">{gate.stat.short}</span>
            <span className="text-[11px] text-fg-4 truncate">{gate.unlocks}</span>
          </span>
          <span className="font-display font-bold text-sm text-fg">
            {formatStatValue(gate.current, gate.stat.unit)}
            <span className="text-fg-5"> → </span>
            <span className="text-earned">{formatStatValue(gate.target, gate.stat.unit)}</span>
          </span>
        </div>
      ))}
    </section>
  );
};

const BattleLog: React.FC = () => {
  const { save } = useGame();
  const entries = save.log.slice(0, 6);
  if (entries.length === 0) return null;
  return (
    <section className="flex flex-col gap-2.5 p-4 rounded-[20px] bg-ink-900 border border-ink-700" aria-label="Battle log">
      <h2 className="font-display font-bold text-base">Battle log</h2>
      {entries.map((entry, index) => {
        const visual = EVENT_VISUAL[entry.kind];
        return (
          <div key={`${entry.date}_${index}`} className="flex items-center gap-2.5">
            <span className={`w-8 h-8 shrink-0 rounded-[10px] bg-ink-800 border border-ink-700 flex items-center justify-center ${visual.text}`}>
              {visual.icon}
            </span>
            <span className="flex-1 min-w-0 text-[13px] font-semibold text-fg-2 truncate">{entry.title}</span>
          </div>
        );
      })}
    </section>
  );
};
