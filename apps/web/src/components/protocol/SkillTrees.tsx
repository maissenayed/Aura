'use client';

import React from 'react';
import { Check, GitBranch, Lock, Star } from 'lucide-react';
import { LadderStatus, TierStatus, formatStatValue } from '../../utils/protocolEngine';
import { MeterBar, Panel, PanelHead, Tally, Theme, themeFor } from './primitives';

interface SkillTreesProps {
  ladders: LadderStatus[];
  bodyWeightKg: number;
}

export const SkillTrees: React.FC<SkillTreesProps> = ({ ladders, bodyWeightKg }) => {
  const cleared = ladders.reduce((sum, ladder) => sum + ladder.clearedCount, 0);
  const total = ladders.reduce((sum, ladder) => sum + ladder.tiers.length, 0);

  return (
    <Panel className="p-4 sm:p-6">
      <PanelHead
        icon={<GitBranch className="w-4 h-4" />}
        title="Skill Trees"
        subtitle={`Climb from the bottom. Gates marked ⇡ are calculated for your ${bodyWeightKg.toFixed(1)} kg bodyweight and move with it.`}
        right={<Tally icon={<Star className="w-4 h-4 text-neon-emerald" />} value={`${cleared} / ${total}`} label="tiers" />}
      />

      {ladders.length === 0 && (
        <p className="text-xs text-slate-400">Your plan has no skill trees yet. Add one in the Plan tab, under Skill trees.</p>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        {ladders.map((status) => {
          const theme = themeFor(status.ladder.branch);
          return (
            <div key={status.ladder.id} className="p-4 rounded-2xl bg-dark-950/60 border border-slate-800/80">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={`text-sm font-black ${theme.text}`}>{status.ladder.name}</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider bg-dark-900 text-slate-400 border-slate-700 shrink-0">
                  {status.ladder.bossLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">{status.ladder.tagline}</p>

              <div className="flex items-center gap-2 mb-4">
                <MeterBar value={status.tiers.length ? status.clearedCount / status.tiers.length : 0} theme={status.ladder.branch} size="sm" />
                <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                  {status.clearedCount}/{status.tiers.length}
                </span>
              </div>

              {/* Top rung first: the boss sits at the top of the climb. */}
              <ol className="space-y-2">
                {[...status.tiers].reverse().map((tier) => (
                  <Rung key={tier.tier.id} tier={tier} theme={theme} branch={status.ladder.branch} />
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

const Rung: React.FC<{ tier: TierStatus; theme: Theme; branch: string }> = ({ tier, theme, branch }) => {
  const { cleared, isCurrent, byBlueprint, gates, progress } = tier;
  const locked = !cleared && !isCurrent;

  const shell = cleared
    ? 'border-emerald-900/70 bg-dark-900/50'
    : isCurrent
      ? `${theme.border} ${theme.bg}`
      : 'border-slate-800 bg-dark-900/40';

  return (
    <li className={`rounded-xl border p-3 ${shell} ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2.5">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${
            cleared
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
              : isCurrent
                ? `bg-dark-950 ${theme.text} ${theme.border} beacon-pulse`
                : 'bg-dark-950 text-slate-600 border-slate-800'
          }`}
        >
          {cleared ? <Check className="w-4 h-4" strokeWidth={3} /> : locked ? <Lock className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] font-black uppercase tracking-widest ${cleared ? 'text-emerald-400' : isCurrent ? theme.text : 'text-slate-500'}`}>
              {tier.tier.rung}
            </span>
            {isCurrent && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-black uppercase tracking-wider bg-dark-950 ${theme.text} ${theme.border}`}>
                You are here
              </span>
            )}
          </div>
          <h4 className="text-xs font-bold text-white">{tier.tier.name}</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">{tier.tier.subtitle}</p>

          {gates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {gates.map((gate, gateIndex) => (
                <span
                  key={`${gate.stat.id}_${gateIndex}`}
                  title={`${gate.stat.name}: you are at ${formatStatValue(gate.current, gate.stat.unit)}${gate.scales ? ' · moves with your bodyweight' : ''}`}
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                    gate.met
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                      : 'bg-dark-950 text-slate-300 border-slate-700'
                  }`}
                >
                  <span className="font-sans font-semibold">{gate.stat.short}</span>{' '}
                  {formatStatValue(gate.target, gate.stat.unit)}
                  {gate.scales && <span aria-label="moves with bodyweight"> ⇡</span>}
                </span>
              ))}
            </div>
          )}

          {isCurrent && gates.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <MeterBar value={progress} theme={branch === 'pull' ? 'pull' : 'push'} size="sm" />
              <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                {Math.round(progress * 100)}%
              </span>
            </div>
          )}

          {byBlueprint && (
            <p className="mt-1.5 text-[10px] text-emerald-400/80 font-semibold">Marked as cleared in your plan.</p>
          )}
        </div>
      </div>
    </li>
  );
};
