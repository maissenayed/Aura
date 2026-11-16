'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PlanExercise, PlanSpec, liftOf } from '../../utils/campaignPlan';
import {
  Derived,
  EventKind,
  GameEvent,
  LogEntry,
  ProtocolSave,
  currentOf,
  dayIdOf,
  derive,
  diffEvents,
  formatStatValue,
  streakOf,
  toIsoDate,
  weekOf,
} from '../../utils/protocolEngine';
import {
  CampaignSnapshot,
  commitSave,
  peekSave,
  resetSave,
  useCampaign,
  useTodayIso,
} from '../../utils/protocolStore';
import { Toast, ToastStack } from '../protocol/Toasts';
import { MomentOverlay } from './MomentOverlay';

/**
 * The campaign as every screen sees it: the save, the plan, everything derived
 * from them, and the actions that change them. Every change goes through
 * `play`, which compares the world before and after and turns the difference
 * into battle-log entries, toasts and — for the big ones — full-screen moments.
 */

const LOG_LIMIT = 40;
const TOAST_LIMIT = 4;
const TOAST_MS = 5200;

/** Events big enough to stop the screen for. Everything else is a toast. */
const MOMENT_KINDS = new Set<EventKind>(['level', 'boss', 'week', 'day', 'attribute']);

export interface Moment extends GameEvent {
  id: number;
}

export interface GameValue extends CampaignSnapshot {
  todayIso: string | null;
  currentWeek: number;
  todayDayId: string | null;
  /** The week the mission board is showing. */
  viewWeek: number;
  /** The day the mission board is showing. */
  selectedDayId: string;
  derived: Derived;
  /** Days in a row with every mission ticked. */
  streak: number;
  setViewWeek: (week: number | null) => void;
  setSelectedDay: (dayId: string | null) => void;
  jumpToToday: () => void;
  logStat: (id: string, value: number) => void;
  logLoad: (exercise: PlanExercise, value: number) => void;
  toggleQuest: (key: string) => void;
  toggleMilestone: (id: string) => void;
  weighIn: (kg: number) => void;
  resetCampaign: () => void;
  /** Plan edits not saved yet; kept here so leaving the Forge does not lose them. */
  planDraft: PlanSpec | null;
  setPlanDraft: (draft: PlanSpec | null) => void;
  planDirty: boolean;
  /** Shows events that happened outside the campaign, e.g. a skill mastered on the tree. */
  announce: (events: GameEvent[]) => void;
}

const GameContext = createContext<GameValue | null>(null);

export function useGame(): GameValue {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside <GameProvider>');
  return value;
}

/** Adds events to the battle log, newest first. Keyed events replace their same-day twin. */
function mergeLog(log: LogEntry[], events: GameEvent[], date: string): LogEntry[] {
  let next = log;
  for (const event of events) {
    if (event.key) next = next.filter((entry) => !(entry.key === event.key && entry.date === date));
    next = [{ ...event, date }, ...next];
  }
  return next.slice(0, LOG_LIMIT);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useCampaign();
  const { save, plan, spec } = snapshot;
  const todayIso = useTodayIso();

  const currentWeek = todayIso ? weekOf(save.startedAt, todayIso) : 1;
  const todayDayId = todayIso ? dayIdOf(todayIso) : null;

  const [weekOverride, setWeekOverride] = useState<number | null>(null);
  const [dayOverride, setDayOverride] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [planDraft, setPlanDraft] = useState<PlanSpec | null>(null);
  const seq = useRef(0);

  const viewWeek = weekOverride ?? currentWeek;
  const selectedDayId = dayOverride ?? todayDayId ?? 'mon';

  const derived = useMemo(() => derive(save, { currentWeek, viewWeek }, plan), [save, currentWeek, viewWeek, plan]);
  const streak = useMemo(() => (todayIso ? streakOf(save, plan, todayIso) : 0), [save, plan, todayIso]);
  const planDirty = useMemo(
    () => planDraft !== null && JSON.stringify(planDraft) !== JSON.stringify(spec),
    [planDraft, spec],
  );

  // Leaving the page with plan edits still unsaved asks first.
  useEffect(() => {
    if (!planDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [planDirty]);

  const dismissToast = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  const announce = useCallback(
    (events: GameEvent[]) => {
      const fresh = events.map((event) => ({ ...event, id: (seq.current += 1) }));
      const big = fresh.filter((event) => MOMENT_KINDS.has(event.kind));
      const small = fresh.filter((event) => !MOMENT_KINDS.has(event.kind));
      if (big.length) setMoments((current) => [...current, ...big]);
      if (small.length) {
        const keys = new Set(small.map((toast) => toast.key).filter(Boolean));
        setToasts((current) =>
          [...current.filter((toast) => !toast.key || !keys.has(toast.key)), ...small].slice(-TOAST_LIMIT),
        );
        small.forEach((toast) => window.setTimeout(() => dismissToast(toast.id), TOAST_MS));
      }
    },
    [dismissToast],
  );

  const play = useCallback(
    (mutate: (current: ProtocolSave) => ProtocolSave, extra: GameEvent[] = []) => {
      const before = peekSave();
      const after = mutate(before);
      const clock = { currentWeek, viewWeek };
      const events = [...extra, ...diffEvents(derive(before, clock, plan), derive(after, clock, plan))];
      commitSave(
        events.length ? { ...after, log: mergeLog(after.log, events, todayIso ?? toIsoDate(new Date())) } : after,
      );
      if (events.length) announce(events);
    },
    [announce, currentWeek, plan, todayIso, viewWeek],
  );

  const logStat = useCallback(
    (id: string, value: number) => {
      const stat = liftOf(plan, id);
      if (!stat) return;
      const previous = currentOf(peekSave(), stat);
      const firstLog = !stat.hasBaseline && previous === 0;
      const extra: GameEvent[] =
        value > previous
          ? [
              {
                kind: 'pr',
                key: `pr_${id}`,
                title: firstLog ? `First log — ${stat.short}` : `New PR — ${stat.short}`,
                detail: `${formatStatValue(value, stat.unit)} · ${stat.measure}`,
              },
            ]
          : [];
      play((current) => ({ ...current, stats: { ...current.stats, [id]: value } }), extra);
    },
    [plan, play],
  );

  const logLoad = useCallback(
    (exercise: PlanExercise, value: number) => {
      const previous = peekSave().loads[exercise.id] ?? exercise.load?.start ?? 0;
      const extra: GameEvent[] =
        value > previous
          ? [
              {
                kind: 'pr',
                key: `pr_${exercise.id}`,
                title: previous === 0 ? `First log — ${exercise.name}` : `New PR — ${exercise.name}`,
                detail: `${formatStatValue(value, 'kg')} working weight`,
              },
            ]
          : [];
      play((current) => ({ ...current, loads: { ...current.loads, [exercise.id]: value } }), extra);
    },
    [play],
  );

  const toggleQuest = useCallback(
    (key: string) => play((current) => ({ ...current, quests: { ...current.quests, [key]: !current.quests[key] } })),
    [play],
  );

  const toggleMilestone = useCallback(
    (id: string) =>
      play((current) => ({ ...current, milestones: { ...current.milestones, [id]: !current.milestones[id] } })),
    [play],
  );

  const weighIn = useCallback((kg: number) => play((current) => ({ ...current, bodyWeightKg: kg })), [play]);

  const resetCampaign = useCallback(() => {
    resetSave();
    setWeekOverride(null);
    setDayOverride(null);
    setToasts([]);
    setMoments([]);
  }, []);

  const value: GameValue = {
    ...snapshot,
    todayIso,
    currentWeek,
    todayDayId,
    viewWeek,
    selectedDayId,
    derived,
    streak,
    setViewWeek: (week) => setWeekOverride(week === null ? null : Math.max(1, week)),
    setSelectedDay: setDayOverride,
    jumpToToday: () => {
      setWeekOverride(null);
      setDayOverride(null);
    },
    logStat,
    logLoad,
    toggleQuest,
    toggleMilestone,
    weighIn,
    resetCampaign,
    planDraft,
    setPlanDraft,
    planDirty,
    announce,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {moments.length > 0 && (
        <MomentOverlay
          key={moments[0].id}
          moment={moments[0]}
          plan={plan}
          level={derived.level}
          streak={streak}
          onDone={() => setMoments((current) => current.slice(1))}
        />
      )}
    </GameContext.Provider>
  );
}
