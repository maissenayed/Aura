'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PlanSpec, liftOf } from '../../utils/campaignPlan';
import {
  BODYWEIGHT_RECORD,
  Derived,
  EventKind,
  GameEvent,
  LogEntry,
  ProtocolSave,
  badgesDue,
  badgesUnbacked,
  bestOf,
  currentOf,
  dayIdOf,
  derive,
  diffEvents,
  milestoneEvents,
  formatStatValue,
  perfectWeeksOf,
  streakOf,
  toIsoDate,
  trimLog,
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
import { HISTORY_LIMIT, HistoryPoint } from '../../utils/campaignV3';
import { V2_LIFT_OF_RECORD } from '../../utils/records';
import { adoptDeviceProgress } from '../../utils/skillProgressStore';
import { proofOf, skillsProvenByLogs } from '../../utils/skillStandards';
import { confirmationOf } from '../../utils/evidence';
import { Toast, ToastStack } from '../protocol/Toasts';
import { MomentOverlay } from './MomentOverlay';

/**
 * The campaign as every screen sees it: the save, the plan, everything derived
 * from them, and the actions that change them. Every change goes through
 * `play`, which compares the world before and after and turns the difference
 * into battle-log entries, toasts and — for the big ones — full-screen moments.
 */

const TOAST_LIMIT = 4;
const TOAST_MS = 5200;

/** Events big enough to stop the screen for. Everything else is a toast. */
const MOMENT_KINDS = new Set<EventKind>(['level', 'boss', 'act', 'campaign', 'week', 'day', 'attribute']);

/** What has been celebrated so far: bosses slain, acts as they stood, the level. */
interface Celebrated {
  bosses: Set<string>;
  acts: Derived['acts'];
  level: number;
}

const celebratedIn = (derived: Derived): Celebrated => ({
  bosses: new Set(derived.bosses.filter((status) => status.defeated).map((status) => status.boss.id)),
  acts: derived.acts,
  level: derived.level.level,
});

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
  /** Ticks or unticks a mission. With `sessionLift`, ticking today's mission also records today's session at that lift's number. */
  toggleQuest: (key: string, sessionLift?: string) => void;
  weighIn: (kg: number) => void;
  resetCampaign: () => void;
  /** Takes back every badge the save's numbers no longer back. */
  recountBadges: () => void;
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

/**
 * A level already in the battle log was celebrated when it was first reached; getting back
 * to it after a dip (a corrected log, an undone skill) is not a new one.
 */
function notReplayed(events: GameEvent[], log: LogEntry[]): GameEvent[] {
  return events.filter((event) => event.kind !== 'level' || !log.some((entry) => entry.kind === 'level' && entry.title === event.title));
}

/** Adds events to the battle log, newest first. Keyed events replace their same-day twin. */
function mergeLog(log: LogEntry[], events: GameEvent[], date: string): LogEntry[] {
  let next = log;
  for (const event of events) {
    if (event.key) next = next.filter((entry) => !(entry.key === event.key && entry.date === date));
    next = [{ ...event, date }, ...next];
  }
  // Day-to-day entries roll off after a while; bosses, acts and level-ups stay for years.
  return trimLog(next);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useCampaign();
  const { save, plan, spec } = snapshot;
  const todayIso = useTodayIso();

  const currentWeek = todayIso ? weekOf(save.startedAt, todayIso) : 1;
  const todayDayId = todayIso ? dayIdOf(todayIso) : null;

  // Once the account's save is in from the server, skills mastered on this device before
  // mastery was synced join it (once per device).
  useEffect(() => {
    if (snapshot.gate === 'ready' && snapshot.sync === 'synced') adoptDeviceProgress();
  }, [snapshot.gate, snapshot.sync]);

  const [weekOverride, setWeekOverride] = useState<number | null>(null);
  const [dayOverride, setDayOverride] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [planDraft, setPlanDraft] = useState<PlanSpec | null>(null);
  const seq = useRef(0);

  const viewWeek = weekOverride ?? currentWeek;
  const selectedDayId = dayOverride ?? todayDayId ?? 'mon';

  const derived = useMemo(() => derive(save, { currentWeek, viewWeek, today: todayIso }, plan), [save, currentWeek, viewWeek, plan, todayIso]);
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

  // Bosses slain, acts cleared and levels reached are celebrated once. `play` keeps this current
  // for its own changes; the watcher below catches the rest.
  const celebrated = useRef<Celebrated | null>(null);

  const play = useCallback(
    (mutate: (current: ProtocolSave) => ProtocolSave, extra: GameEvent[] = []) => {
      const before = peekSave();
      const after = mutate(before);
      const clock = { currentWeek, viewWeek, today: todayIso };
      const afterDerived = derive(after, clock, plan);
      const events = notReplayed([...extra, ...diffEvents(derive(before, clock, plan), afterDerived)], before.log);
      if (celebrated.current) celebrated.current = celebratedIn(afterDerived);
      commitSave(
        events.length ? { ...after, log: mergeLog(after.log, events, todayIso ?? toIsoDate(new Date())) } : after,
      );
      if (events.length) announce(events);
    },
    [announce, currentWeek, plan, todayIso, viewWeek],
  );

  // A boss slain on the tree page, an act cleared by a plan edit, a level reached on another
  // device: changes that never went through `play` still get their moment and their line in
  // the battle log. The first look after loading only takes note, so nothing bursts on open.
  useEffect(() => {
    if (snapshot.gate !== 'ready') {
      celebrated.current = null;
      return;
    }
    if (!celebrated.current) {
      if (snapshot.sync === 'synced') celebrated.current = celebratedIn(derived);
      return;
    }
    const seen = celebrated.current;
    const events: GameEvent[] = [];
    for (const status of derived.bosses) {
      if (status.defeated && !seen.bosses.has(status.boss.id)) {
        events.push({ kind: 'boss', title: `Boss ${status.order} defeated`, detail: status.boss.name });
      }
    }
    events.push(...milestoneEvents({ acts: seen.acts }, derived));
    if (derived.level.level > seen.level) events.push({ kind: 'level', title: `Level ${derived.level.level}`, detail: derived.level.rank });
    celebrated.current = celebratedIn(derived);
    const current = peekSave();
    const fresh = notReplayed(events, current.log);
    if (!fresh.length) return;
    commitSave({ ...current, log: mergeLog(current.log, fresh, todayIso ?? toIsoDate(new Date())) });
    announce(fresh);
  }, [announce, derived, snapshot.gate, snapshot.sync, todayIso]);

  // Badges are handed out whenever the save has earned one, wherever it was earned (the
  // tree page masters skills outside the campaign). The first look after loading hands out
  // what was already earned quietly, so opening the app never sets off a burst of them.
  // A badge earned today that today's numbers no longer back (a log typed wrong, then
  // corrected) is taken back; older badges stay until the Hero's recount.
  const badgesPrimed = useRef(false);
  useEffect(() => {
    if (snapshot.gate !== 'ready' || (!badgesPrimed.current && snapshot.sync !== 'synced')) return;
    const date = todayIso ?? toIsoDate(new Date());
    const due = badgesDue(save, derived, plan);
    const takenBack = badgesUnbacked(save, derived, plan, date).filter((id) => save.badges[id] === date);
    const quiet = !badgesPrimed.current;
    badgesPrimed.current = true;
    if (!due.length && !takenBack.length) return;
    const current = peekSave();
    const badges = { ...current.badges, ...Object.fromEntries(due.map((badge) => [badge.id, date])) };
    for (const id of takenBack) delete badges[id];
    commitSave({ ...current, badges });
    if (quiet) celebrated.current = null;
    // A boss badge comes with the boss's own moment.
    const shown = due.filter((badge) => badge.kind !== 'boss');
    if (!quiet && shown.length) announce(shown.map((badge) => ({ kind: 'badge', key: `badge_${badge.id}`, title: `Badge — ${badge.title}`, detail: badge.detail })));
  }, [announce, derived, plan, save, snapshot.gate, snapshot.sync, todayIso]);

  const recountBadges = useCallback(() => {
    const current = peekSave();
    const unbacked = badgesUnbacked(current, derive(current, { currentWeek, viewWeek, today: todayIso }, plan), plan, todayIso ?? toIsoDate(new Date()));
    if (!unbacked.length) return;
    const badges = { ...current.badges };
    for (const id of unbacked) delete badges[id];
    commitSave({ ...current, badges });
  }, [currentWeek, plan, todayIso, viewWeek]);

  // A skill whose standard a logged number meets ("1x BW × 8" with a bodyweight load, a
  // "30 s hold", "5 per leg") is mastered without a trip to the tree, and one only vouched
  // for as a step before a harder skill becomes proven. Like badges, what the logs already
  // proved before this loaded is settled quietly (the celebration watcher takes its note
  // again after it, so its XP plays no Level Up); afterwards it goes through `play`, so a
  // tower floor or a skill boss it completes gets its moment.
  const skillsPrimed = useRef(false);
  useEffect(() => {
    if (snapshot.gate !== 'ready' || (!skillsPrimed.current && snapshot.sync !== 'synced')) return;
    const proven = skillsProvenByLogs(save);
    const quiet = !skillsPrimed.current;
    skillsPrimed.current = true;
    if (!proven.length) return;
    const date = todayIso ?? toIsoDate(new Date());
    const keys = proven.map((standard) => `calisthenics:${standard.skill}`);
    const master = (current: ProtocolSave): ProtocolSave => ({
      ...current,
      skills: { ...current.skills, ...Object.fromEntries(keys.map((key) => [key, current.skills[key] ?? date])) },
      vouched: Object.fromEntries(Object.entries(current.vouched ?? {}).filter(([key]) => !keys.includes(key))),
    });
    if (quiet) {
      commitSave(master(peekSave()));
      celebrated.current = null;
      return;
    }
    play(
      master,
      proven
        .filter((standard) => !save.skills[`calisthenics:${standard.skill}`])
        .map((standard) => ({
          kind: 'skill',
          key: `skill_${standard.skill}`,
          title: `Skill mastered — ${standard.name}`,
          detail: proofOf(standard),
        })),
    );
  }, [play, save, snapshot.gate, snapshot.sync, todayIso]);

  // A perfect week is banked once it is perfect, against the plan it was played on, so a later
  // edit that adds a mission never takes its XP back. Banking changes no XP, so it plays nothing.
  useEffect(() => {
    if (snapshot.gate !== 'ready') return;
    const banked = new Set(save.perfectWeeks ?? []);
    const fresh = perfectWeeksOf(save, plan).filter((week) => !banked.has(week));
    if (!fresh.length) return;
    const current = peekSave();
    commitSave({ ...current, perfectWeeks: [...new Set([...(current.perfectWeeks ?? []), ...fresh])].sort((a, b) => a - b) });
  }, [plan, save, snapshot.gate]);

  const logStat = useCallback(
    (id: string, value: number) => {
      const stat = liftOf(plan, id);
      if (!stat) return;
      const previous = currentOf(peekSave(), stat);
      const best = bestOf(peekSave(), stat);
      const firstLog = !stat.hasBaseline && previous === 0;
      const date = todayIso ?? toIsoDate(new Date());
      // A big jump is kept, and counts once it is shown again on another day.
      const nextPoints: HistoryPoint[] = [...(peekSave().history[id] ?? []).filter(([day]) => day !== date), [date, value]];
      const waiting = confirmationOf({ ...peekSave(), history: { ...peekSave().history, [id]: nextPoints } }, stat).pending === value;
      // A record is a new best, not just more than last time: climbing back after a bad week is not a PR.
      const extra: GameEvent[] =
        value > best
          ? [
              waiting
                ? {
                    kind: 'log',
                    key: `pr_${id}`,
                    title: `Big jump — ${stat.short}`,
                    detail: `${formatStatValue(value, stat.unit)} · log it again on another day within two weeks and it counts`,
                  }
                : {
                    kind: 'pr',
                    key: `pr_${id}`,
                    title: firstLog ? `First log — ${stat.short}` : `New PR — ${stat.short}`,
                    detail: `${formatStatValue(value, stat.unit)} · ${stat.measure}`,
                  },
            ]
          : [];
      play((current) => {
        // One point per day: logging again the same day replaces it.
        const points: HistoryPoint[] = [...(current.history[id] ?? []).filter(([day]) => day !== date), [date, value]];
        points.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        const v2 = V2_LIFT_OF_RECORD[id];
        return {
          ...current,
          records: { ...current.records, [id]: value },
          history: { ...current.history, [id]: points.slice(-HISTORY_LIMIT) },
          // Older versions of the app still read the v2 stats.
          ...(v2 ? { stats: { ...current.stats, [v2]: value } } : {}),
        };
      }, extra);
      // The same number as last time still counts as a session; say so, since nothing else changes.
      if (value === previous && value > 0) {
        announce([{ kind: 'log', key: `log_${id}`, title: `Logged — ${stat.short}`, detail: `${formatStatValue(value, stat.unit)} · same as last time` }]);
      }
    },
    [announce, plan, play, todayIso],
  );

  const toggleQuest = useCallback(
    (key: string, sessionLift?: string) =>
      play((current) => {
        const ticking = !current.quests[key];
        const next = { ...current, quests: { ...current.quests, [key]: ticking } };
        // Ticking today's mission without logging means it was done at the usual number:
        // the session goes in the history, so a plateau does not look like missed training.
        const lift = ticking && sessionLift ? liftOf(plan, sessionLift) : undefined;
        if (!lift) return next;
        const value = currentOf(current, lift);
        const date = todayIso ?? toIsoDate(new Date());
        const points = current.history[lift.id] ?? [];
        if (!(value > 0) || points.some(([day]) => day === date)) return next;
        // Marked as a tick: it keeps the session in the history, but it is not a logged result.
        const added: HistoryPoint[] = [...points, [date, value, 'tick']];
        added.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        return { ...next, history: { ...next.history, [lift.id]: added.slice(-HISTORY_LIMIT) } };
      }),
    [plan, play, todayIso],
  );

  // Weigh-ins go in the history like a lift, one per day, so bodyweight XP can stand on the best one.
  const weighIn = useCallback(
    (kg: number) => {
      const date = todayIso ?? toIsoDate(new Date());
      play((current) => {
        const points: HistoryPoint[] = [...(current.history[BODYWEIGHT_RECORD] ?? []).filter(([day]) => day !== date), [date, kg]];
        points.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        return { ...current, bodyWeightKg: kg, history: { ...current.history, [BODYWEIGHT_RECORD]: points.slice(-HISTORY_LIMIT) } };
      });
    },
    [play, todayIso],
  );

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
    toggleQuest,
    weighIn,
    resetCampaign,
    recountBadges,
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
