'use client';

import React, { useMemo, useRef, useState } from 'react';
import { BarChart3, Cloud, CloudOff, CloudUpload, GitBranch, Map, Skull, Swords } from 'lucide-react';
import { Header } from '../../components/Header';
import { BossGallery } from '../../components/protocol/BossGallery';
import { CampaignGate } from '../../components/protocol/CampaignGate';
import { CampaignMap } from '../../components/protocol/CampaignMap';
import { Hud } from '../../components/protocol/Hud';
import { SkillTrees } from '../../components/protocol/SkillTrees';
import { StatSheet } from '../../components/protocol/StatSheet';
import { Toast, ToastStack } from '../../components/protocol/Toasts';
import { TodayMission } from '../../components/protocol/TodayMission';
import { QuestExercise, StatId } from '../../data/protocolData';
import {
  GameEvent,
  LogEntry,
  ProtocolSave,
  dayIdOf,
  derive,
  diffEvents,
  formatStatValue,
  statById,
  toIsoDate,
  weekOf,
} from '../../utils/protocolEngine';
import {
  SyncStatus,
  commitSave,
  peekSave,
  resetSave,
  useCampaign,
  useTodayIso,
} from '../../utils/protocolStore';

type TabId = 'today' | 'campaign' | 'bosses' | 'trees' | 'stats';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'Missions', icon: <Swords className="w-4 h-4" /> },
  { id: 'campaign', label: 'Campaign', icon: <Map className="w-4 h-4" /> },
  { id: 'bosses', label: 'Bosses', icon: <Skull className="w-4 h-4" /> },
  { id: 'trees', label: 'Skill Trees', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
];

const SYNC_BADGE: Record<SyncStatus, { label: string; hint: string; icon: React.ReactNode; tone: string }> = {
  connecting: {
    label: 'Connecting',
    hint: 'Reaching the server…',
    icon: <CloudUpload className="w-3.5 h-3.5" />,
    tone: 'text-slate-400 border-slate-700',
  },
  saving: {
    label: 'Saving',
    hint: 'Sending your latest change to the server.',
    icon: <CloudUpload className="w-3.5 h-3.5 animate-pulse" />,
    tone: 'text-neon-cyan border-cyan-500/40',
  },
  synced: {
    label: 'Synced',
    hint: 'Saved on the server. Open the campaign on any device to carry on.',
    icon: <Cloud className="w-3.5 h-3.5" />,
    tone: 'text-emerald-300 border-emerald-600/50',
  },
  offline: {
    label: 'Offline',
    hint: 'Saved on this device. It will sync by itself once the server is reachable.',
    icon: <CloudOff className="w-3.5 h-3.5" />,
    tone: 'text-neon-amber border-amber-500/50',
  },
};

const LOG_LIMIT = 40;
const TOAST_LIMIT = 4;
const TOAST_MS = 5200;

/** Adds events to the battle log, newest first. Keyed events replace their same-day twin. */
function mergeLog(log: LogEntry[], events: GameEvent[], date: string): LogEntry[] {
  let next = log;
  for (const event of events) {
    if (event.key) next = next.filter((entry) => !(entry.key === event.key && entry.date === date));
    next = [{ ...event, date }, ...next];
  }
  return next.slice(0, LOG_LIMIT);
}

export default function TrackerPage() {
  const { save, gate, sync } = useCampaign();
  const todayIso = useTodayIso();

  const currentWeek = todayIso ? weekOf(save.startedAt, todayIso) : 1;
  const todayDayId = todayIso ? dayIdOf(todayIso) : null;

  const [tab, setTab] = useState<TabId>('today');
  const [weekOverride, setWeekOverride] = useState<number | null>(null);
  const [dayOverride, setDayOverride] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const viewWeek = weekOverride ?? currentWeek;
  const selectedDayId = dayOverride ?? todayDayId ?? 'mon';

  const derived = useMemo(() => derive(save, { currentWeek, viewWeek }), [save, currentWeek, viewWeek]);

  const dismissToast = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));

  const announce = (events: GameEvent[]) => {
    const fresh = events.map((event) => ({ ...event, id: (toastSeq.current += 1) }));
    const keys = new Set(fresh.map((toast) => toast.key).filter(Boolean));
    setToasts((current) =>
      [...current.filter((toast) => !toast.key || !keys.has(toast.key)), ...fresh].slice(-TOAST_LIMIT),
    );
    fresh.forEach((toast) => window.setTimeout(() => dismissToast(toast.id), TOAST_MS));
  };

  /**
   * Every change to the campaign goes through here: apply it, compare the
   * world before and after, and turn the difference into log entries and
   * toasts. Unlocks are never tracked by hand — they fall out of the diff.
   */
  const play = (mutate: (current: ProtocolSave) => ProtocolSave, extra: GameEvent[] = []) => {
    const before = peekSave();
    const after = mutate(before);
    const clock = { currentWeek, viewWeek };
    const events = [...extra, ...diffEvents(derive(before, clock), derive(after, clock))];

    commitSave(
      events.length ? { ...after, log: mergeLog(after.log, events, todayIso ?? toIsoDate(new Date())) } : after,
    );
    if (events.length) announce(events);
  };

  const logStat = (id: StatId, value: number) => {
    const stat = statById(id);
    const previous = peekSave().stats[id] ?? stat.baseline;
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
  };

  const logLoad = (exercise: QuestExercise, value: number) => {
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
  };

  const toggleQuest = (key: string) =>
    play((current) => ({ ...current, quests: { ...current.quests, [key]: !current.quests[key] } }));

  const toggleMilestone = (id: string) =>
    play((current) => ({ ...current, milestones: { ...current.milestones, [id]: !current.milestones[id] } }));

  const weighIn = (kg: number) => play((current) => ({ ...current, bodyWeightKg: kg }));

  const resetCampaign = () => {
    resetSave();
    setWeekOverride(null);
    setDayOverride(null);
    setToasts([]);
    setTab('today');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-5">
        {/* The save and today's date only exist in the browser — hold the board until both are in. */}
        {!todayIso || gate === 'loading' ? (
          <div
            className="h-[420px] rounded-2xl border border-slate-800/80 bg-dark-900/50 animate-pulse"
            aria-busy="true"
            aria-label="Loading your campaign"
          />
        ) : gate === 'claim' || gate === 'locked' ? (
          <CampaignGate mode={gate} />
        ) : (
          <>
            <Hud derived={derived} currentWeek={currentWeek} />

            <nav
              aria-label="Campaign sections"
              className="flex items-center gap-1 p-1 rounded-2xl bg-dark-900/80 border border-slate-800/90 overflow-x-auto"
            >
              {TABS.map((entry) => {
                const active = entry.id === tab;
                const badge =
                  entry.id === 'today'
                    ? `${derived.week.done}/${derived.week.total}`
                    : entry.id === 'bosses'
                      ? `${derived.bosses.filter((b) => b.defeated).length}/${derived.bosses.length}`
                      : null;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setTab(entry.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40'
                        : 'text-slate-400 border border-transparent hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {entry.icon}
                    {entry.label}
                    {badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono ${
                          active ? 'bg-dark-950/70 text-neon-cyan' : 'bg-dark-950 text-slate-500'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <span
                title={SYNC_BADGE[sync].hint}
                className={`flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-xl border bg-dark-950/70 text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${SYNC_BADGE[sync].tone}`}
              >
                {SYNC_BADGE[sync].icon}
                {SYNC_BADGE[sync].label}
              </span>
            </nav>

            {tab === 'today' && (
              <TodayMission
                save={save}
                derived={derived}
                viewWeek={viewWeek}
                currentWeek={currentWeek}
                todayDayId={todayDayId}
                selectedDayId={selectedDayId}
                onSelectDay={setDayOverride}
                onWeekChange={(week) => setWeekOverride(Math.max(1, week))}
                onJumpToToday={() => {
                  setWeekOverride(null);
                  setDayOverride(null);
                }}
                onToggleQuest={toggleQuest}
                onLogStat={logStat}
                onLogLoad={logLoad}
              />
            )}

            {tab === 'campaign' && <CampaignMap derived={derived} currentWeek={currentWeek} onWeighIn={weighIn} />}

            {tab === 'bosses' && (
              <BossGallery bosses={derived.bosses} save={save} onToggleMilestone={toggleMilestone} />
            )}

            {tab === 'trees' && <SkillTrees ladders={derived.ladders} bodyWeightKg={save.bodyWeightKg} />}

            {tab === 'stats' && (
              <StatSheet save={save} derived={derived} onLogStat={logStat} onReset={resetCampaign} />
            )}
          </>
        )}
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
