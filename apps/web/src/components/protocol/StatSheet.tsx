'use client';

import React, { useState } from 'react';
import { Dumbbell, RotateCcw, Sparkles, Target } from 'lucide-react';
import { IRON_STATS, StatId } from '../../data/protocolData';
import { Derived, ProtocolSave, XP_RULES, formatStatValue } from '../../utils/protocolEngine';
import { MeterBar, Panel, PanelHead, Stepper, themeFor } from './primitives';

interface StatSheetProps {
  save: ProtocolSave;
  derived: Derived;
  onLogStat: (id: StatId, value: number) => void;
  onReset: () => void;
}

/** The character sheet: every Iron Stat in one place, plus where the XP came from. */
export const StatSheet: React.FC<StatSheetProps> = ({ save, derived, onLogStat, onReset }) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const { level, gates } = derived;

  return (
    <div className="space-y-5">
      <Panel className="p-4 sm:p-6">
        <PanelHead
          icon={<Dumbbell className="w-4 h-4" />}
          title="Iron Stats"
          subtitle="Your best working numbers. Log them here or straight from the day's mission — bosses, tiers and level all read from these."
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {IRON_STATS.map((stat) => {
            const theme = themeFor(stat.branch);
            const current = save.stats[stat.id] ?? stat.baseline;
            const gate = gates.find((entry) => entry.stat.id === stat.id);
            const mastery =
              stat.endgame === null ? null : Math.min(1, Math.max(0, (current - stat.baseline) / (stat.endgame - stat.baseline)));

            return (
              <div key={stat.id} className="p-4 rounded-2xl bg-dark-950/60 border border-slate-800/80">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-white">{stat.name}</h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider shrink-0 ${theme.bg} ${theme.text} ${theme.border}`}>
                    {theme.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 min-h-[32px]">{stat.note}</p>

                <Stepper
                  value={current}
                  step={stat.step}
                  unit={stat.unit === 'reps' ? 'reps' : 'kg'}
                  prefix={stat.unit === 'added-kg' ? '+' : ''}
                  accent={theme.text}
                  placeholder={stat.hasBaseline ? undefined : 'log it'}
                  ariaLabel={stat.name}
                  onCommit={(value) => onLogStat(stat.id, value)}
                />
                <div className="text-[10px] text-slate-600 mt-1 font-semibold uppercase tracking-wider">{stat.measure}</div>

                {mastery !== null && stat.endgame !== null && (
                  <div className="mt-3">
                    <MeterBar value={mastery} theme={stat.branch} size="sm" label={`${stat.name} mastery`} />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>{stat.hasBaseline ? `Start ${formatStatValue(stat.baseline, stat.unit)}` : 'Start: first log'}</span>
                      <span>Endgame {formatStatValue(stat.endgame, stat.unit)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-start gap-2 text-[11px] p-2 rounded-xl bg-dark-900/80 border border-slate-800">
                  <Target className="w-3.5 h-3.5 text-neon-gold shrink-0 mt-px" />
                  {gate ? (
                    <span className="text-slate-300 min-w-0">
                      <strong className="text-neon-gold font-mono">{formatStatValue(gate.target, stat.unit)}</strong>
                      <span className="text-slate-500"> — {gate.unlocks}</span>
                    </span>
                  ) : stat.endgame === null ? (
                    <span className="text-slate-400">Pin the full stack, then claim it on Boss 6.</span>
                  ) : (
                    <span className="text-emerald-300 font-semibold">Every gate on this lift is open.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="p-4 sm:p-6 lg:col-span-2">
          <PanelHead
            icon={<Sparkles className="w-4 h-4" />}
            title="XP Ledger"
            subtitle={`${XP_RULES.perLevel} XP per level. A boss is worth ${XP_RULES.boss}, a skill tier ${XP_RULES.tier}, a ticked mission ${XP_RULES.mission}, a perfect week ${XP_RULES.perfectWeek} on top.`}
            right={
              <span className="font-mono font-black text-neon-gold text-lg">
                {level.xp.toLocaleString()} <span className="text-xs text-slate-500">XP</span>
              </span>
            }
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {level.breakdown.map((entry) => (
              <li
                key={entry.label}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-dark-950/60 border border-slate-800 text-xs"
              >
                <span className="text-slate-300 font-semibold">{entry.label}</span>
                <span className={`font-mono font-black ${entry.xp > 0 ? 'text-white' : 'text-slate-600'}`}>
                  {entry.xp.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-4 sm:p-6">
          <PanelHead
            icon={<RotateCcw className="w-4 h-4" />}
            title="New Game"
            subtitle="Wipes every logged lift, mission and weigh-in — on the server and on every device — and restarts at week 1."
          />
          {confirmReset ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onReset();
                }}
                className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-950/50 text-rose-300 border border-rose-700/60 hover:bg-rose-900/50 transition cursor-pointer"
              >
                Yes, erase my campaign
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-dark-950 text-slate-300 border border-slate-700 hover:border-slate-500 transition cursor-pointer"
              >
                Keep it
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-dark-950 text-slate-400 border border-slate-800 hover:text-rose-300 hover:border-rose-800 transition cursor-pointer"
            >
              Reset campaign
            </button>
          )}
        </Panel>
      </div>
    </div>
  );
};
