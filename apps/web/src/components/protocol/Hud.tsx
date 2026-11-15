'use client';

import React from 'react';
import { Crown, Scale, Star, Trophy } from 'lucide-react';
import { BODYWEIGHT_QUEST } from '../../data/protocolData';
import { Derived } from '../../utils/protocolEngine';
import { MeterBar, Panel } from './primitives';

interface HudProps {
  derived: Derived;
  currentWeek: number;
}

/** The always-visible status bar: who you are, how far along, what act you are in. */
export const Hud: React.FC<HudProps> = ({ derived, currentWeek }) => {
  const { level, bosses, ladders, mass, acts } = derived;
  const act = acts.find((entry) => entry.current) ?? acts[acts.length - 1];
  const ringPct = (level.xpIntoLevel / level.xpForLevel) * 100;
  const tiersCleared = ladders.reduce((sum, ladder) => sum + ladder.clearedCount, 0);
  const tierTotal = ladders.reduce((sum, ladder) => sum + ladder.tiers.length, 0);

  return (
    <Panel className="relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none" />
      <div
        aria-hidden
        className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-neon-purple/10 blur-3xl pointer-events-none"
      />

      <div className="relative flex flex-wrap items-center gap-5">
        <div
          className="relative w-[88px] h-[88px] rounded-full p-[5px] shrink-0"
          style={{ background: `conic-gradient(#f59e0b ${ringPct}%, #1c2336 0)` }}
          role="img"
          aria-label={`Level ${level.level}, ${level.xpIntoLevel} of ${level.xpForLevel} XP`}
        >
          <div className="flex flex-col items-center justify-center w-full h-full rounded-full bg-dark-950">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Level</span>
            <span className="text-3xl font-black font-mono text-neon-gold leading-none">{level.level}</span>
          </div>
        </div>

        <div className="flex-1 min-w-[250px]">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              The Hybrid <span className="text-neon-cyan">Calisthenics Engine</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-wider bg-purple-950/50 text-purple-300 border-purple-500/40">
              {level.rank}
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-wider bg-cyan-950/40 text-neon-cyan border-cyan-500/40">
              Act {act.numeral} · {act.name}
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider bg-dark-950 text-slate-400 border-slate-700">
              Week {currentWeek}
            </span>
          </div>

          <div className="flex items-center gap-3 max-w-xl">
            <MeterBar value={level.xpIntoLevel / level.xpForLevel} theme="gold" size="lg" label="XP to next level" />
            <span className="text-[11px] font-mono font-bold text-slate-300 shrink-0">
              {level.xpIntoLevel}
              <span className="text-slate-600"> / {level.xpForLevel} XP</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
          <HudTile
            icon={<Scale className="w-4 h-4 text-neon-amber" />}
            value={`${mass.current.toFixed(1)} kg`}
            label={mass.phaseBossDown ? `to ${BODYWEIGHT_QUEST.finalBoss} kg` : `to ${BODYWEIGHT_QUEST.phaseBoss} kg`}
          />
          <HudTile
            icon={<Crown className="w-4 h-4 text-neon-gold" />}
            value={`${bosses.filter((b) => b.defeated).length} / ${bosses.length}`}
            label="bosses down"
          />
          <HudTile
            icon={<Star className="w-4 h-4 text-neon-emerald" />}
            value={`${tiersCleared} / ${tierTotal}`}
            label="skill tiers"
          />
          <HudTile
            icon={<Trophy className="w-4 h-4 text-neon-purple" />}
            value={String(level.perfectWeeks)}
            label="perfect weeks"
          />
        </div>
      </div>
    </Panel>
  );
};

const HudTile: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="px-3 py-2.5 rounded-xl bg-dark-950/80 border border-slate-800 min-w-[104px]">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="font-mono font-black text-white text-sm leading-none">{value}</span>
    </div>
    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
  </div>
);
