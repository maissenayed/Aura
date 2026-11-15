'use client';

import React from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Flame,
  LocateFixed,
  Moon,
  ScrollText,
  ShieldCheck,
  Skull,
  Swords,
} from 'lucide-react';
import { CampaignPlan, DAY_NAMES, PlanDay, PlanExercise, liftOf } from '../../utils/campaignPlan';
import {
  BossStatus,
  Derived,
  Gate,
  ProtocolSave,
  XP_RULES,
  currentOf,
  formatStatValue,
  unitLabel,
  questKey,
  restKey,
  shortBossName,
} from '../../utils/protocolEngine';
import { EVENT_VISUAL } from './Toasts';
import { MeterBar, Panel, PanelHead, Stepper, Tally, themeFor } from './primitives';

interface TodayMissionProps {
  save: ProtocolSave;
  plan: CampaignPlan;
  derived: Derived;
  viewWeek: number;
  currentWeek: number;
  todayDayId: string | null;
  selectedDayId: string;
  onSelectDay: (dayId: string) => void;
  onWeekChange: (week: number) => void;
  onJumpToToday: () => void;
  onToggleQuest: (key: string) => void;
  onLogStat: (id: string, value: number) => void;
  onLogLoad: (exercise: PlanExercise, value: number) => void;
}

export const TodayMission: React.FC<TodayMissionProps> = ({
  save,
  plan,
  derived,
  viewWeek,
  currentWeek,
  todayDayId,
  selectedDayId,
  onSelectDay,
  onWeekChange,
  onJumpToToday,
  onToggleQuest,
  onLogStat,
  onLogLoad,
}) => {
  const { week, gates } = derived;
  const selected = week.days.find((entry) => entry.day.id === selectedDayId) ?? week.days[0];
  const isLiveWeek = viewWeek === currentWeek;
  const awayFromToday = !isLiveWeek || (todayDayId !== null && selectedDayId !== todayDayId);

  return (
    <div className="space-y-5">
      {/* Week strip */}
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onWeekChange(viewWeek - 1)}
              disabled={viewWeek <= 1}
              aria-label="Previous week"
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-dark-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-center min-w-[96px]">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {isLiveWeek ? 'This week' : viewWeek < currentWeek ? 'Past week' : 'Upcoming'}
              </div>
              <div className="text-lg font-black font-mono text-white leading-none">Week {viewWeek}</div>
            </div>
            <button
              type="button"
              onClick={() => onWeekChange(viewWeek + 1)}
              aria-label="Next week"
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-dark-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {awayFromToday && (
              <button
                type="button"
                onClick={onJumpToToday}
                className="flex items-center gap-1.5 ml-1 px-3 h-8 rounded-xl text-[11px] font-black uppercase tracking-wider bg-cyan-950/40 text-neon-cyan border border-cyan-500/40 hover:bg-cyan-900/40 transition cursor-pointer"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-[220px] max-w-md">
            <Flame className={`w-4 h-4 shrink-0 ${week.perfect ? 'text-neon-gold' : 'text-slate-600'}`} />
            <MeterBar value={week.progress} theme={week.perfect ? 'gold' : 'push'} label="Week progress" />
            <span className="text-xs font-mono font-bold text-slate-300 shrink-0">
              {week.done}
              <span className="text-slate-600"> / {week.total}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {week.days.map((entry) => {
            const theme = themeFor(entry.day.kind);
            const active = entry.day.id === selected.day.id;
            const isToday = isLiveWeek && entry.day.id === todayDayId;

            return (
              <button
                key={entry.day.id}
                type="button"
                onClick={() => onSelectDay(entry.day.id)}
                aria-pressed={active}
                className={`relative text-left p-2.5 rounded-xl border transition cursor-pointer ${
                  active
                    ? `${theme.bg} ${theme.border}`
                    : 'bg-dark-950/60 border-slate-800 hover:border-slate-600'
                } ${isToday && !active ? 'beacon-pulse' : ''}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${active ? theme.text : 'text-slate-400'}`}>
                    {entry.name.slice(0, 3)}
                  </span>
                  {entry.cleared ? (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
                      <Check className="w-2.5 h-2.5" strokeWidth={4} />
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-slate-500">
                      {entry.done}/{entry.total}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-semibold text-slate-300 leading-tight truncate">
                  {entry.day.title.split(' — ')[0]}
                </div>
                {isToday && (
                  <div className="mt-1 text-[8px] font-black uppercase tracking-widest text-neon-cyan">Today</div>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* The mission */}
        <div className="lg:col-span-2">
          <MissionCard
            save={save}
            plan={plan}
            bosses={derived.bosses}
            day={selected.day}
            done={selected.done}
            total={selected.total}
            cleared={selected.cleared}
            week={viewWeek}
            gates={gates}
            onToggleQuest={onToggleQuest}
            onLogStat={onLogStat}
            onLogLoad={onLogLoad}
          />
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <Panel className="p-4 sm:p-5">
            <PanelHead
              icon={<Crosshair className="w-4 h-4" />}
              title="Next Gates"
              subtitle="The closest numbers that unlock something."
            />
            {gates.length === 0 ? (
              <p className="text-xs text-emerald-300 font-semibold">Every gate in the campaign is open.</p>
            ) : (
              <ul className="space-y-3">
                {gates.slice(0, 4).map((gate) => (
                  <li key={gate.stat.id}>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-white truncate">{gate.stat.short}</span>
                      <span className="text-[11px] font-mono font-bold shrink-0">
                        <span className="text-slate-300">{formatStatValue(gate.current, gate.stat.unit)}</span>
                        <span className="text-slate-600"> → </span>
                        <span className="text-neon-gold">{formatStatValue(gate.target, gate.stat.unit)}</span>
                      </span>
                    </div>
                    <MeterBar value={gate.closeness} theme={gate.stat.branch} size="sm" />
                    <p className="text-[10px] text-slate-500 mt-1 truncate" title={gate.unlocks}>
                      Unlocks {gate.unlocks}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {week.armor.length > 0 && (
          <Panel className="p-4 sm:p-5">
            <PanelHead
              icon={<ShieldCheck className="w-4 h-4" />}
              title="Tendon Armor"
              subtitle="Tendons adapt 10x slower than muscle. Re-forge it weekly."
              right={
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {week.armorCount}/{week.armor.length}
                </span>
              }
            />
            <ul className="space-y-2">
              {week.armor.map(({ piece, forged }) => (
                <li key={piece.id}>
                  <button
                    type="button"
                    onClick={() => onToggleQuest(questKey(viewWeek, piece.id))}
                    aria-pressed={forged}
                    className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer active:scale-[0.99] ${
                      forged
                        ? 'bg-purple-950/30 border-purple-500/50'
                        : 'bg-dark-950/60 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="flex items-start gap-2.5">
                      <Tick on={forged} tone="purple" />
                      <span className="min-w-0">
                        <span className={`block text-xs font-bold ${forged ? 'text-purple-200' : 'text-slate-100'}`}>
                          {piece.slot}
                          <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                            +{XP_RULES.armor} XP
                          </span>
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{piece.drill}</span>
                        <span className="block text-[10px] text-slate-600">{piece.when}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          )}

          <Panel className="p-4 sm:p-5">
            <PanelHead icon={<ScrollText className="w-4 h-4" />} title="Battle Log" />
            {save.log.length === 0 ? (
              <p className="text-xs text-slate-500">
                Nothing yet. Log a set or tick a mission and your history starts here.
              </p>
            ) : (
              <ul className="space-y-2">
                {save.log.slice(0, 7).map((entry, index) => {
                  const visual = EVENT_VISUAL[entry.kind];
                  return (
                    <li key={`${entry.date}_${index}`} className="flex items-start gap-2.5">
                      <span className={`p-1.5 rounded-lg bg-dark-950 border ${visual.border} ${visual.text} shrink-0`}>
                        {visual.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-slate-100 leading-tight">{entry.title}</span>
                        <span className="block text-[10px] text-slate-500 truncate">
                          {entry.detail} · {entry.date}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* The selected day's mission                                          */
/* ------------------------------------------------------------------ */

interface MissionCardProps {
  save: ProtocolSave;
  plan: CampaignPlan;
  bosses: BossStatus[];
  day: PlanDay;
  done: number;
  total: number;
  cleared: boolean;
  week: number;
  gates: Gate[];
  onToggleQuest: (key: string) => void;
  onLogStat: (id: string, value: number) => void;
  onLogLoad: (exercise: PlanExercise, value: number) => void;
}

const MissionCard: React.FC<MissionCardProps> = ({
  save,
  plan,
  bosses,
  day,
  done,
  total,
  cleared,
  week,
  gates,
  onToggleQuest,
  onLogStat,
  onLogLoad,
}) => {
  const theme = themeFor(day.kind);
  const rest = restKey(week, day.id);
  const restClaimed = Boolean(save.quests[rest]);

  return (
    <Panel className={`p-4 sm:p-6 ${cleared ? 'border-emerald-500/40' : ''}`}>
      <PanelHead
        icon={day.kind === 'rest' ? <Moon className="w-4 h-4" /> : <Swords className="w-4 h-4" />}
        title={`${DAY_NAMES[day.id]} · ${day.title}`}
        subtitle={day.purpose}
        right={
          <Tally
            icon={<span className={`w-2 h-2 rounded-full ${cleared ? 'bg-emerald-400' : 'bg-slate-600'}`} />}
            value={`${done}/${total}`}
            label={cleared ? 'cleared' : 'missions'}
          />
        }
      />

      {day.warmUps.length > 0 && (
        <div className={`mb-4 p-3 rounded-xl border ${theme.bg} ${theme.border}`}>
          <div className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${theme.text}`}>
            Mandatory warm-up
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {day.warmUps.map((warmUp, index) => (
              <li key={`${index}_${warmUp}`} className="text-xs text-slate-200">
                {warmUp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {day.kind === 'rest' ? (
        <button
          type="button"
          onClick={() => onToggleQuest(rest)}
          aria-pressed={restClaimed}
          className={`w-full text-left p-5 rounded-2xl border transition cursor-pointer active:scale-[0.995] ${
            restClaimed ? 'bg-emerald-950/25 border-emerald-600/50' : 'bg-dark-950/60 border-slate-800 hover:border-slate-600'
          }`}
        >
          <span className="flex items-center gap-4">
            <span
              className={`flex items-center justify-center w-12 h-12 rounded-2xl border shrink-0 ${
                restClaimed
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-dark-900 border-slate-700 text-slate-400'
              }`}
            >
              <Moon className="w-6 h-6" />
            </span>
            <span>
              <span className={`block text-base font-black ${restClaimed ? 'text-emerald-300' : 'text-white'}`}>
                {restClaimed ? 'Rest claimed' : 'Claim your rest'}
              </span>
              <span className="block text-xs text-slate-400 mt-0.5">
                Rest is a mission like any other — the growth phase only counts if you take it.
                <span className="ml-1 font-bold text-slate-300">+{XP_RULES.mission} XP</span>
              </span>
            </span>
          </span>
        </button>
      ) : day.exercises.length === 0 ? (
        <p className="text-xs text-slate-400">No exercises on this day yet. Add them in the Plan tab, under Week.</p>
      ) : (
        <ul className="space-y-2">
          {day.exercises.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              save={save}
              plan={plan}
              bosses={bosses}
              exercise={exercise}
              done={Boolean(save.quests[questKey(week, exercise.id)])}
              gate={exercise.lift ? gates.find((g) => g.stat.id === exercise.lift) : undefined}
              onToggle={() => onToggleQuest(questKey(week, exercise.id))}
              onLogStat={onLogStat}
              onLogLoad={onLogLoad}
            />
          ))}
        </ul>
      )}

      {cleared && day.kind !== 'rest' && (
        <p className="mt-4 text-xs font-bold text-emerald-300">
          Day cleared — {total * XP_RULES.mission} XP banked. Recover, eat, come back heavier.
        </p>
      )}
    </Panel>
  );
};

interface ExerciseRowProps {
  save: ProtocolSave;
  plan: CampaignPlan;
  bosses: BossStatus[];
  exercise: PlanExercise;
  done: boolean;
  gate?: Gate;
  onToggle: () => void;
  onLogStat: (id: string, value: number) => void;
  onLogLoad: (exercise: PlanExercise, value: number) => void;
}

const ExerciseRow: React.FC<ExerciseRowProps> = ({ save, plan, bosses, exercise, done, gate, onToggle, onLogStat, onLogLoad }) => {
  const stat = liftOf(plan, exercise.lift);
  const statTheme = stat ? themeFor(stat.branch) : undefined;

  return (
    <li
      className={`flex flex-wrap items-center gap-x-4 gap-y-3 p-3 rounded-xl border transition-colors ${
        done ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-dark-950/60 border-slate-800/80'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        className="flex items-start gap-3 flex-1 min-w-[220px] text-left cursor-pointer group"
      >
        <Tick on={done} tone="emerald" large />
        <span className="min-w-0">
          <span className={`block text-sm font-bold ${done ? 'text-slate-400 line-through' : 'text-white group-hover:text-neon-cyan'} transition-colors`}>
            {exercise.name}
          </span>
          <span className="block text-[11px] text-slate-400 mt-0.5">
            <span className="font-mono font-bold text-slate-200">{exercise.target}</span>
            <span className="text-slate-600"> · </span>
            {exercise.focus}
          </span>
          {(exercise.bosses?.length || exercise.armor) && (
            <span className="flex flex-wrap gap-1 mt-1.5">
              {exercise.bosses?.map((id) => {
                const status = bosses.find((entry) => entry.boss.id === id);
                if (!status) return null;
                return (
                  <span
                    key={id}
                    title={status.boss.name}
                    className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border font-bold uppercase tracking-wider bg-rose-950/30 text-rose-300/90 border-rose-800/40"
                  >
                    <Skull className="w-2.5 h-2.5" />
                    Boss {status.order} · {shortBossName(status.boss)}
                  </span>
                );
              })}
              {exercise.armor && (
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md border font-bold uppercase tracking-wider bg-purple-950/30 text-purple-300/90 border-purple-800/40">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Tendon armor
                </span>
              )}
            </span>
          )}
        </span>
      </button>

      {stat && statTheme && (
        <div className="shrink-0">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Your best · {stat.measure}
          </div>
          <Stepper
            value={currentOf(save, stat)}
            step={stat.step}
            unit={unitLabel(stat.unit)}
            prefix={stat.unit === 'added-kg' ? '+' : ''}
            accent={statTheme.text}
            size="sm"
            placeholder={stat.hasBaseline ? undefined : 'log it'}
            ariaLabel={stat.name}
            onCommit={(value) => onLogStat(stat.id, value)}
          />
          <div className="text-[10px] mt-1 text-slate-500">
            {gate ? (
              <>
                Next gate{' '}
                <span className="font-mono font-bold text-neon-gold">{formatStatValue(gate.target, stat.unit)}</span>
              </>
            ) : stat.endgame === null ? (
              'No number gate'
            ) : currentOf(save, stat) >= stat.endgame ? (
              <span className="text-emerald-400 font-semibold">End-game reached</span>
            ) : (
              <>
                End-game <span className="font-mono font-bold text-slate-300">{formatStatValue(stat.endgame, stat.unit)}</span>
              </>
            )}
          </div>
        </div>
      )}

      {!stat && exercise.load && (
        <div className="shrink-0">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Working weight</div>
          <Stepper
            value={save.loads[exercise.id] ?? exercise.load.start ?? 0}
            step={exercise.load.step}
            unit="kg"
            accent="text-slate-100"
            size="sm"
            placeholder={exercise.load.start === null ? 'log it' : undefined}
            ariaLabel={exercise.name}
            onCommit={(value) => onLogLoad(exercise, value)}
          />
        </div>
      )}

      {!stat && !exercise.load && exercise.note && (
        <span className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wider bg-dark-900 text-slate-400 border-slate-700">
          {exercise.note}
        </span>
      )}
    </li>
  );
};

const Tick: React.FC<{ on: boolean; tone: 'emerald' | 'purple'; large?: boolean }> = ({ on, tone, large }) => {
  const size = large ? 'w-6 h-6 rounded-lg' : 'w-5 h-5 rounded-md';
  const lit =
    tone === 'emerald'
      ? 'bg-emerald-500/25 border-emerald-500/60 text-emerald-300'
      : 'bg-purple-500/25 border-purple-400/60 text-purple-200';

  return (
    <span
      className={`flex items-center justify-center ${size} border shrink-0 mt-0.5 transition-colors ${
        on ? lit : 'bg-dark-900 border-slate-700 text-transparent'
      }`}
    >
      <Check className={large ? 'w-4 h-4' : 'w-3 h-3'} strokeWidth={3.5} />
    </span>
  );
};
