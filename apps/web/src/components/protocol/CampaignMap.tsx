'use client';

import React from 'react';
import { Beef, CalendarDays, Check, ChevronRight, Flag, Map, Scale, Trophy, Utensils } from 'lucide-react';
import { BodyweightPlan } from '../../utils/campaignPlan';
import { ActStatus, Derived, formatStatValue } from '../../utils/protocolEngine';
import { MeterBar, Panel, PanelHead, Stepper, Tally } from './primitives';

interface CampaignMapProps {
  derived: Derived;
  bodyweight: BodyweightPlan;
  currentWeek: number;
  onWeighIn: (kg: number) => void;
}

export const CampaignMap: React.FC<CampaignMapProps> = ({ derived, bodyweight, currentWeek, onWeighIn }) => {
  const { acts, mass, checkpoints } = derived;
  const signed = (kg: number) => `${kg >= 0 ? '+' : ''}${kg.toFixed(1)}`;
  const direction = mass.gaining ? 'gain' : 'loss';

  return (
    <div className="space-y-5">
      {/* The acts */}
      <Panel className="p-4 sm:p-6">
        <PanelHead
          icon={<Map className="w-4 h-4" />}
          title="Campaign Map"
          subtitle={
            acts.length
              ? `${acts.length === 1 ? 'One act' : `${acts.length} acts`}, played in order of what unlocks first — but every lift you log moves all of them.`
              : 'Your plan has no acts yet. Build the map in the Plan tab, under Map.'
          }
        />

        <div
          className={`grid gap-3 ${
            acts.length === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : acts.length >= 3 ? 'lg:grid-cols-3' : acts.length === 2 ? 'lg:grid-cols-2' : ''
          }`}
        >
          {acts.map((act, index) => (
            // The arrow between cards only reads right when every act sits on one row.
            <ActCard key={act.id} act={act} isLast={index === acts.length - 1 || acts.length > 3} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Bodyweight */}
        <Panel className="p-4 sm:p-6">
          <PanelHead
            icon={<Scale className="w-4 h-4" />}
            title="The Mass Quest"
            subtitle="Weigh in whenever you step on the scale. Gates that grow with bodyweight re-scale to this number."
          />

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Stepper
              value={mass.current}
              step={0.1}
              min={30}
              max={250}
              unit="kg"
              accent="text-neon-amber"
              ariaLabel="Bodyweight"
              onCommit={onWeighIn}
            />
            <div className="text-xs">
              <div className="font-bold text-white">
                {signed(mass.gained)} kg since {mass.start} kg
              </div>
              <div className={mass.onPace ? 'text-emerald-400 font-semibold' : 'text-neon-amber font-semibold'}>
                {mass.finalBossDown
                  ? 'Goal weight reached.'
                  : mass.shortKg === 0
                    ? `Ahead of week ${currentWeek}'s target (${mass.weekTargetKg.toFixed(1)} kg).`
                    : mass.onPace
                      ? `On pace — ${mass.shortKg.toFixed(1)} kg to this week's ${mass.weekTargetKg.toFixed(1)} kg.`
                      : `Behind pace — ${mass.shortKg.toFixed(1)} kg off week ${currentWeek}'s ${mass.weekTargetKg.toFixed(1)} kg.`}
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {mass.next && mass.next.kg !== mass.goal && (
              <LabeledBar label={`Next · ${mass.next.label} · ${mass.next.kg} kg`} value={mass.nextProgress} />
            )}
            <LabeledBar label={`Goal · ${mass.goal} kg`} value={mass.finalProgress} />
          </div>

          {mass.checkpoints.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {mass.checkpoints.map((checkpoint) => (
                <div
                  key={checkpoint.id}
                  className={`px-3 py-2 rounded-xl border ${
                    checkpoint.cleared ? 'bg-emerald-950/25 border-emerald-700/50' : 'bg-dark-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider truncate ${checkpoint.cleared ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {checkpoint.label}
                    </span>
                    {checkpoint.cleared && <Check className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={4} />}
                  </div>
                  <div className="font-mono font-black text-white text-sm">{checkpoint.kg.toFixed(1)} kg</div>
                  <div className="text-[9px] text-slate-500 font-semibold">
                    {checkpoint.week ? `by week ${checkpoint.week}` : checkpoint.act}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {bodyweight.proteinGrams !== null && (
              <FuelTile icon={<Beef className="w-4 h-4" />} value={`${bodyweight.proteinGrams} g`} label="protein, daily" />
            )}
            {bodyweight.calories && (
              <FuelTile icon={<Utensils className="w-4 h-4" />} value={bodyweight.calories} label="daily calories" />
            )}
            {mass.goal !== mass.start && (
              <FuelTile
                icon={<CalendarDays className="w-4 h-4" />}
                value={`${mass.weeksToFinal} wk`}
                label={`to ${mass.goal} kg at ${bodyweight.weeklyChangeKg} kg/wk ${direction}`}
              />
            )}
          </div>
        </Panel>

        {/* Lift checkpoints */}
        <Panel className="p-4 sm:p-6">
          <PanelHead
            icon={<Flag className="w-4 h-4" />}
            title="Lift Checkpoints"
            subtitle="The lift targets on your campaign map."
            right={
              checkpoints.length > 0 && (
                <Tally
                  icon={<Trophy className="w-4 h-4 text-neon-gold" />}
                  value={`${checkpoints.filter((c) => c.met).length} / ${checkpoints.length}`}
                  label="cleared"
                />
              )
            }
          />

          {checkpoints.length === 0 && (
            <p className="text-xs text-slate-400">No lift goals on the map yet. Add them to an act in the Plan tab, under Map.</p>
          )}

          <ul className="space-y-2.5">
            {checkpoints.map((checkpoint) => (
              <li
                key={checkpoint.id}
                className={`p-3 rounded-xl border ${
                  checkpoint.met ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-dark-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">{checkpoint.label}</span>
                    <span className="block text-[10px] text-slate-500 truncate">{checkpoint.act}</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold shrink-0">
                    <span className={checkpoint.met ? 'text-emerald-400' : 'text-white'}>
                      {formatStatValue(checkpoint.current, checkpoint.stat.unit)}
                    </span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-slate-400">{formatStatValue(checkpoint.target, checkpoint.stat.unit)}</span>
                  </span>
                </div>
                <MeterBar value={checkpoint.ratio} theme={checkpoint.met ? 'gold' : checkpoint.stat.branch} size="sm" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
};

const ActCard: React.FC<{ act: ActStatus; isLast: boolean }> = ({ act, isLast }) => {
  const shell = act.complete
    ? 'border-emerald-500/40 bg-emerald-950/15'
    : act.current
      ? 'border-cyan-500/50 bg-cyan-950/20'
      : 'border-slate-800 bg-dark-950/50';

  return (
    <div className={`relative p-4 rounded-2xl border ${shell}`}>
      {!isLast && (
        <ChevronRight
          aria-hidden
          className="hidden lg:block absolute -right-[18px] top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700 z-10"
        />
      )}

      <div className="flex items-start gap-3 mb-3">
        <span
          className={`flex items-center justify-center w-10 h-10 rounded-xl border font-black font-mono shrink-0 ${
            act.complete
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : act.current
                ? 'bg-cyan-500/15 border-cyan-500/50 text-neon-cyan beacon-pulse'
                : 'bg-dark-900 border-slate-700 text-slate-500'
          }`}
        >
          {act.complete ? <Check className="w-5 h-5" strokeWidth={3} /> : act.numeral}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-white">{act.name}</h3>
            {act.current && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-black uppercase tracking-wider bg-cyan-950/50 text-neon-cyan border-cyan-500/40">
                Current act
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{act.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <MeterBar value={act.progress} theme={act.complete ? 'pull' : 'push'} size="sm" />
        <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0 w-8 text-right">
          {Math.round(act.progress * 100)}%
        </span>
      </div>

      {act.nodes.length === 0 && <p className="text-[11px] text-slate-500">No goals in this act yet.</p>}

      <ul className="flex flex-wrap gap-1.5">
        {act.nodes.map((node) => (
          <li
            key={node.id}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] ${
              node.done
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-dark-900/80 border-slate-800 text-slate-300'
            }`}
          >
            {node.done && <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={4} />}
            <span className="font-black uppercase tracking-wider">{node.label}</span>
            <span className={node.done ? 'text-emerald-400/70' : 'text-slate-500'}>{node.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const LabeledBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
      <span>{label}</span>
      <span className="font-mono">{Math.round(value * 100)}%</span>
    </div>
    <MeterBar value={value} theme="legs" />
  </div>
);

const FuelTile: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="px-3 py-2.5 rounded-xl bg-dark-950/60 border border-slate-800">
    <div className="text-neon-amber mb-1">{icon}</div>
    <div className="font-mono font-black text-white text-sm">{value}</div>
    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
  </div>
);
