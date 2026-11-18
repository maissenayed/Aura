'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, LocateFixed } from 'lucide-react';
import { ChestIcon, CheckIcon, FlameIcon, MoonIcon, ShieldIcon } from '../../../components/game/icons';
import { ScreenHeader } from '../../../components/game/AppShell';
import { useGame } from '../../../components/game/GameProvider';
import { figureForExercise } from '../../../components/game/figures';
import { BossHpChip } from '../../../components/game/BossHpChip';
import { ExerciseSheet } from '../../../components/game/ExerciseSheet';
import { LiftLogger } from '../../../components/game/LiftLogger';
import { bossesOfExercise, shortDay, splitTarget } from '../../../components/game/helpers';
import { Chip, Figure, Label, Ring, SegmentBar, TickButton } from '../../../components/game/kit';
import { EVENT_VISUAL } from '../../../components/protocol/Toasts';
import { DAY_NAMES, DayId, PlanExercise, PlanWarmUp, formatStatValue, liftOf } from '../../../utils/campaignPlan';
import { slotOfPiece } from '../../../utils/armor';
import { LATE_TICK_DAYS, XP_RULES, dateOfDay, isDayOpen, questKey, restKey } from '../../../utils/protocolEngine';
import { MISSION_XP, MissionEvidence, SESSION_MIN_MINUTES, SESSION_XP, missionEvidence } from '../../../utils/evidence';
import { RestTimer, clockText } from '../../../components/game/HoldTimer';
import { SessionCard } from '../../../components/game/SessionCard';

/** Today's quest: the day's missions, ticked and logged, filling a bar towards the day's chest. */
export default function QuestPage() {
  const game = useGame();
  const { derived, save, plan, viewWeek, currentWeek, todayDayId, selectedDayId, streak, todayIso } = game;
  const evidence = useMemo(() => new Map(missionEvidence(save, plan).map((mission) => [mission.key, mission])), [save, plan]);
  const [cardDate, setCardDate] = useState<string | null>(null);
  const { week } = derived;
  const selected = week.days.find((entry) => entry.day.id === selectedDayId) ?? week.days[0];
  const day = selected.day;
  const isLiveWeek = viewWeek === currentWeek;
  const awayFromToday = !isLiveWeek || (todayDayId !== null && selectedDayId !== todayDayId);
  // Today and the two days before it can be ticked; older days are closed, later ones not open yet.
  const locked = !isDayOpen(save.startedAt, viewWeek, selectedDayId, todayIso);
  const boardDate = dateOfDay(save.startedAt, viewWeek, selectedDayId);
  const ahead = Boolean(todayIso && boardDate && boardDate > todayIso);
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
          <Chip tone="earned" className="h-10 px-3 rounded-card text-[17px]">
            <FlameIcon className="w-4 h-4" lit={streak > 0} />
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
              className="w-9 h-[60px] shrink-0 rounded-card bg-ink-900 text-fg-3 flex items-center justify-center disabled:opacity-30 hover:text-fg transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 grid grid-cols-7 gap-0.5 p-1 rounded-card bg-ink-900">
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
                    className={`relative h-[52px] rounded-tag flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                      active ? 'bg-ink-800 raised' : 'hover:bg-ink-850'
                    }`}
                  >
                    {/* Today carries a chalk tally mark. */}
                    {isToday && <span className="absolute top-0 inset-x-3 h-[3px] rounded-b-[2px] bg-act" aria-hidden="true" />}
                    <span className={`eyebrow ${active ? 'text-fg' : entry.cleared ? 'text-earned' : 'text-fg-5'}`}>
                      {entry.name.slice(0, 1)}
                    </span>
                    {entry.cleared ? (
                      <CheckIcon className="w-[15px] h-[15px] text-earned" strokeWidth={3} />
                    ) : restDay ? (
                      <MoonIcon className="w-[15px] h-[15px] text-fg-5" />
                    ) : isToday || active ? (
                      <span className={`num font-bold text-[13px] leading-none ${active ? 'text-fg' : 'text-fg-3'}`}>
                        {entry.done}/{entry.total}
                      </span>
                    ) : (
                      <span className="w-2.5 h-[2px] rounded-[1px] bg-ink-500" />
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
              className="w-9 h-[60px] shrink-0 rounded-card bg-ink-900 text-fg-3 flex items-center justify-center hover:text-fg transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {awayFromToday && (
            <button
              type="button"
              onClick={game.jumpToToday}
              className="self-start flex items-center gap-1.5 h-9 px-3 rounded-card border border-ink-600 text-fg text-[13px] font-semibold cursor-pointer hover:bg-ink-850"
            >
              <LocateFixed className="w-3.5 h-3.5" /> Back to today
            </button>
          )}

          {/* Progress to the chest: with a session on the clock, it opens on Finish */}
          <div className="flex items-center gap-3">
            <SegmentBar done={missionDone} className="flex-1" />
            <Chest open={selected.cleared && (!boardDate || !save.sessions?.[boardDate] || Boolean(save.sessions[boardDate][1]))} />
          </div>
          {!isRest && !awayFromToday && !locked && day.exercises.length > 0 && boardDate && (
            <SessionBar date={boardDate} onOpenCard={() => setCardDate(boardDate)} />
          )}

          {locked && (
            <p className="text-xs text-fg-4 -mb-1">
              {ahead
                ? 'This day is still ahead: its missions open on the day.'
                : `This day is closed: days can be ticked until ${LATE_TICK_DAYS} days after. Anything logged goes on today.`}
            </p>
          )}
          {day.warmUps.length > 0 && <WarmUpBoard warmUps={day.warmUps} dayKind={day.kind} locked={locked} />}

          {isRest ? (
            <button
              type="button"
              onClick={() => game.toggleQuest(rest)}
              disabled={locked}
              aria-pressed={missionDone[0]}
              className={`flex items-center gap-4 p-5 rounded-card text-left transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                missionDone[0] ? 'bg-earned-deep' : 'bg-ink-900 hover:bg-ink-850'
              }`}
            >
              <span className={`w-14 h-14 rounded-card flex items-center justify-center ${missionDone[0] ? 'bg-earned text-earned-deep' : 'bg-ink-800 text-fg-3'}`}>
                <MoonIcon className="w-7 h-7" />
              </span>
              <span className="flex flex-col gap-1">
                <span className={`font-display font-extrabold uppercase text-[24px] leading-none ${missionDone[0] ? 'text-earned' : 'text-fg'}`}>
                  {missionDone[0] ? 'Rest claimed' : 'Claim your rest'}
                </span>
                <span className="text-sm text-fg-4">+{XP_RULES.mission} XP</span>
              </span>
            </button>
          ) : day.exercises.length === 0 ? (
            <Link href="/forge" className="p-5 rounded-card border-[1.5px] border-dashed border-ink-500 text-fg-2 font-semibold text-center hover:bg-ink-900">
              Nothing planned today. Plan it in the Forge.
            </Link>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {day.exercises.map((exercise) => (
                <MissionCard
                  key={exercise.id}
                  exercise={exercise}
                  dayKind={day.kind}
                  done={Boolean(save.quests[questKey(viewWeek, exercise.id)])}
                  evidence={evidence.get(questKey(viewWeek, exercise.id))}
                  locked={locked}
                  onToday={!awayFromToday}
                  onToggle={() => game.toggleQuest(questKey(viewWeek, exercise.id), awayFromToday ? undefined : exercise.lift)}
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

      {cardDate && <SessionCard date={cardDate} onClose={() => setCardDate(null)} />}
      {opened && (
        <ExerciseSheet
          exercise={opened}
          dayKind={day.kind}
          done={Boolean(save.quests[questKey(viewWeek, opened.id)])}
          onToggle={() => game.toggleQuest(questKey(viewWeek, opened.id), awayFromToday ? undefined : opened.lift)}
          onClose={closeSheet}
          locked={locked}
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
    className={`notch w-11 h-11 shrink-0 rounded-card flex items-center justify-center transition ${open ? 'bg-earned text-earned-deep anim-pop' : 'bg-ink-900 text-fg-5'}`}
  >
    <ChestIcon className="w-6 h-6" strokeWidth={1.9} lit={open} />
  </span>
);

const GRADE_TEXT: Record<MissionEvidence['grade'], string> = { done: 'Done', hit: 'Hit', overload: 'Overload', pr: 'PR' };

/** The session clock: Start, a running clock with a rest timer, Finish, and the card afterwards. */
const SessionBar: React.FC<{ date: string; onOpenCard: () => void }> = ({ date, onOpenCard }) => {
  const { save, startSession, finishSession } = useGame();
  const session = save.sessions?.[date] ?? null;
  const [now, setNow] = useState(() => Date.now());
  const running = Boolean(session && !session[1]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  if (!session) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-card bg-ink-900">
        <span className="flex-1 text-[13px] text-fg-3 leading-snug">
          Train on the clock: finish after {SESSION_MIN_MINUTES} minutes with every mission handled for +{SESSION_XP} XP and the session card.
        </span>
        <button type="button" onClick={startSession} className="h-11 px-4 rounded-card bg-fg text-ink-950 font-display font-extrabold uppercase text-lg tracking-[0.02em] active:scale-[.97] transition cursor-pointer">
          Start
        </button>
      </div>
    );
  }
  if (running) {
    const seconds = Math.max(0, (now - new Date(session[0]).getTime()) / 1000);
    return (
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-card bg-ink-900" aria-live="off">
        <span className="eyebrow text-act">On the clock</span>
        <span className="num font-bold text-[22px] text-fg flex-1">{clockText(seconds)}</span>
        <RestTimer />
        <button
          type="button"
          onClick={() => {
            finishSession();
            onOpenCard();
          }}
          className="h-11 px-4 rounded-card bg-fg text-ink-950 font-display font-extrabold uppercase text-lg tracking-[0.02em] active:scale-[.97] transition cursor-pointer"
        >
          Finish
        </button>
      </div>
    );
  }
  const minutes = Math.round((new Date(session[1] as string).getTime() - new Date(session[0]).getTime()) / 60_000);
  return (
    <button type="button" onClick={onOpenCard} className="flex items-center gap-3 p-3 rounded-card bg-ink-900 text-left hover:bg-ink-850 cursor-pointer">
      <span className="eyebrow text-earned">Session finished</span>
      <span className="flex-1 num font-bold text-fg">{minutes} min</span>
      <span className="text-[13px] font-semibold text-fg-2">Open the card</span>
    </button>
  );
};

const MissionCard: React.FC<{
  exercise: PlanExercise;
  dayKind: string;
  done: boolean;
  /** How the mission was graded from that day's log, once it is ticked. */
  evidence?: MissionEvidence;
  locked: boolean;
  /** The card is on today's board, so logging its number also completes it. */
  onToday: boolean;
  onToggle: () => void;
  onOpen: () => void;
}> = ({ exercise, dayKind, done, evidence, locked, onToday, onToggle, onOpen }) => {
  const { plan, derived } = useGame();
  const [xpFloat, setXpFloat] = useState(0);
  const logs = Boolean(liftOf(plan, exercise.lift));
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
      className={`flex flex-col gap-2.5 p-3 rounded-card transition-colors ${done ? 'bg-earned-deep' : 'bg-ink-900'}`}
    >
      <div className="flex items-center gap-3">
        {/* The mission itself opens its panel; the tick beside it completes it. */}
        <button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={`${exercise.name}: how to do it`}
          className="flex-1 min-w-0 flex items-center gap-3 text-left rounded-card -m-1 p-1 active:scale-[.99] transition cursor-pointer focus-visible:outline-2 focus-visible:outline-act"
        >
          <span className={`w-[54px] h-[54px] shrink-0 rounded-tag flex items-center justify-center ${done ? 'bg-ink-950/40' : 'bg-ink-850'}`}>
            <Figure spec={figureForExercise(exercise.exercise, dayKind)} state={done ? 'mastered' : 'ready'} className="w-12 h-12" />
          </span>
          <span className="flex-1 min-w-0 flex flex-col gap-1">
            <span className={`text-[14.5px] font-medium truncate ${done ? 'text-earned-soft' : 'text-fg-2'}`}>{exercise.name}</span>
            <span className={`num font-bold text-[26px] leading-none ${done ? 'text-earned' : 'text-fg'}`}>
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
            <span key={xpFloat} className="absolute right-0 -top-6 num font-bold text-[15px] text-earned whitespace-nowrap anim-float">
              +{evidence?.xp ?? MISSION_XP.done} XP
            </span>
          )}
          <TickButton done={done} onClick={toggle} disabled={locked} label={`${done ? 'Undo' : 'Complete'} ${exercise.name}`} />
        </span>
      </div>

      {(logs || bosses.length > 0 || exercise.armor) && (
        <div className={`flex flex-wrap items-center gap-2 pt-2.5 border-t ${done ? 'border-earned-line' : 'border-ink-700'}`}>
          {bosses.map((status) => (
            <BossHpChip key={status.boss.id} status={status} />
          ))}
          {exercise.armor && (
            <Chip tone="armour">
              <ShieldIcon className="w-3.5 h-3.5" /> Armour
            </Chip>
          )}
          {done && evidence && (
            <Chip tone={evidence.grade === 'pr' || evidence.grade === 'overload' ? 'earned' : 'dim'}>
              {GRADE_TEXT[evidence.grade]} +{evidence.xp}
            </Chip>
          )}
          <span className="flex-1" />
          <LiftLogger exercise={exercise} onLogged={onToday && !done && !locked ? toggle : undefined} />
        </div>
      )}
    </li>
  );
};

/** The day's warm-up: each one ticked forges the armour of the joints it guards, for the week. */
const WarmUpBoard: React.FC<{ warmUps: PlanWarmUp[]; dayKind: string; locked: boolean }> = ({ warmUps, dayKind, locked }) => {
  const { save, viewWeek, toggleQuest, plan } = useGame();
  const wanted = new Set(plan.armor.map((piece) => slotOfPiece(piece.id)));
  const done = warmUps.filter((warmUp) => save.quests[questKey(viewWeek, warmUp.id)]).length;
  return (
    <section aria-label="Warm-up" className="flex flex-col gap-2 p-3 rounded-card bg-armour-deep">
      <div className="flex items-center gap-2">
        <ShieldIcon className="w-4 h-4 text-armour" />
        <Label className="flex-1 text-armour">Warm-up</Label>
        <span className={`num font-bold text-sm ${done === warmUps.length ? 'text-earned' : 'text-fg-2'}`}>
          {done}
          <span className="text-fg-5">/{warmUps.length}</span>
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {warmUps.map((warmUp) => {
          const ticked = Boolean(save.quests[questKey(viewWeek, warmUp.id)]);
          const guards = warmUp.guards.filter((slot) => wanted.has(slot));
          return (
            <li key={warmUp.id} className="list-none flex items-center gap-2.5 p-1.5 pl-2 rounded-card bg-ink-950/40">
              <span className="w-10 h-10 shrink-0 rounded-tag bg-ink-850 flex items-center justify-center">
                <Figure spec={figureForExercise(warmUp.exercise, dayKind)} state={ticked ? 'mastered' : 'ready'} className="w-9 h-9" />
              </span>
              <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className={`text-[13px] font-semibold truncate ${ticked ? 'text-earned-soft' : 'text-fg-2'}`}>
                  {warmUp.name}
                  {warmUp.target && <span className="text-fg-4 num"> · {warmUp.target}</span>}
                </span>
                {guards.length > 0 && (
                  <span className="flex flex-wrap gap-1" aria-label={`Forges ${guards.join(', ')} armour`}>
                    {guards.map((slot) => (
                      <span key={slot} className={`h-5 px-1.5 rounded-tag text-[11px] font-semibold flex items-center gap-1 ${ticked ? 'bg-armour text-armour-deep' : 'bg-ink-850 text-armour'}`}>
                        <ShieldIcon className="w-3 h-3" lit={ticked} /> {slot[0].toUpperCase() + slot.slice(1)}
                      </span>
                    ))}
                  </span>
                )}
              </span>
              <TickButton done={ticked} onClick={() => toggleQuest(questKey(viewWeek, warmUp.id))} disabled={locked} label={`${ticked ? 'Undo' : 'Complete'} ${warmUp.name}`} />
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/** This week's armour: forged by the warm-ups, never by hand. */
const ArmorCard: React.FC = () => {
  const { derived } = useGame();
  const { armor, armorCount } = derived.week;
  if (armor.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 p-4 rounded-card bg-armour-deep" aria-label="Armour this week">
      <div className="flex items-center gap-2">
        <ShieldIcon className="w-[18px] h-[18px] text-armour" />
        <h2 className="flex-1 eyebrow text-armour">Armour · this week</h2>
        <span className={`num font-bold text-[15px] ${armorCount === armor.length ? 'text-earned' : 'text-fg-2'}`}>
          {armorCount}
          <span className="text-fg-5">/{armor.length}</span>
        </span>
      </div>
      <p className="text-[12px] text-fg-3 -mt-1">Tick a warm-up to forge the joints it guards. Every piece in one week earns Tendons.</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-2">
        {armor.map(({ piece, forged, forgedBy, guardedBy }) => {
          const how = forged
            ? `Forged by ${forgedBy.join(', ') || 'hand'}`
            : guardedBy.length
              ? `Warm up with ${[...new Set(guardedBy.map((entry) => entry.name))].slice(0, 2).join(' or ')}`
              : 'No warm-up guards it yet — add one in the Forge';
          return (
            <span key={piece.id} title={how} aria-label={`${piece.slot}: ${how}`} className="h-[70px] flex flex-col items-center justify-center gap-1.5 rounded-card">
              <svg width="30" height="34" viewBox="0 0 24 26" aria-hidden="true">
                <path
                  d="M12 3l7 2.8v5.4c0 4.8-3 8.3-7 9.8-4-1.5-7-5-7-9.8V5.8z"
                  strokeWidth="1.8"
                  strokeDasharray={forged || guardedBy.length ? undefined : '3 3'}
                  strokeLinejoin="round"
                  style={{
                    fill: forged ? 'var(--color-armour)' : 'none',
                    stroke: forged || guardedBy.length ? 'var(--color-armour)' : 'var(--color-ink-500)',
                  }}
                />
                {forged && <path d="M8.5 12l2.5 2.5 4.5-5" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--color-armour-deep)' }} />}
              </svg>
              <span className={`text-[11px] font-semibold ${forged || guardedBy.length ? 'text-armour' : 'text-fg-5'}`}>{piece.slot}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
};

const GatesCard: React.FC = () => {
  const { derived } = useGame();
  const gates = derived.gates.slice(0, 4);
  if (gates.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 p-4 rounded-card bg-ink-900" aria-label="Next gates">
      <h2 className="eyebrow text-fg-4">Next gates</h2>
      {gates.map((gate) => (
        <div key={gate.stat.id} className="flex items-center gap-3" title={gate.unlocks}>
          <Ring value={gate.closeness} size={40} stroke={4} tone="act">
            <span className="num font-bold text-[12px] text-fg-2">{Math.round(gate.closeness * 100)}</span>
          </Ring>
          <span className="flex-1 min-w-0 flex flex-col">
            <span className="text-[13px] font-semibold text-fg-2 truncate">{gate.stat.short}</span>
            <span className="text-[11px] text-fg-4 truncate">{gate.unlocks}</span>
          </span>
          <span className="num font-bold text-[15px] text-fg whitespace-nowrap">
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
    <section className="flex flex-col gap-2.5 p-4 rounded-card bg-ink-900" aria-label="Battle log">
      <h2 className="eyebrow text-fg-4">Battle log</h2>
      {entries.map((entry, index) => {
        const visual = EVENT_VISUAL[entry.kind];
        return (
          <div key={`${entry.date}_${index}`} className="flex items-center gap-2.5">
            <span className={`w-8 h-8 shrink-0 rounded-tag bg-ink-850 flex items-center justify-center ${visual.text}`}>
              {visual.icon}
            </span>
            <span className="flex-1 min-w-0 text-[13px] font-semibold text-fg-2 truncate">{entry.title}</span>
          </div>
        );
      })}
    </section>
  );
};
