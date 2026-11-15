'use client';

import React from 'react';
import {
  ArrowUp,
  Check,
  Crown,
  Dumbbell,
  Flag,
  Flame,
  Footprints,
  Gauge,
  Hand,
  Lock,
  Repeat,
  Skull,
  Wind,
  Zap,
} from 'lucide-react';
import { MILESTONES, StatId } from '../../data/protocolData';
import { BossStatus, ProtocolSave, formatStatValue, statById } from '../../utils/protocolEngine';
import { MeterBar, Panel, PanelHead, Tally, themeFor } from './primitives';

const BOSS_ICON: Record<string, React.ReactNode> = {
  boss_planche: <Flame className="w-5 h-5" />,
  boss_frontlever: <Wind className="w-5 h-5" />,
  boss_hspu: <ArrowUp className="w-5 h-5" />,
  boss_pullup_engine: <Repeat className="w-5 h-5" />,
  boss_pushup_engine: <Gauge className="w-5 h-5" />,
  boss_nordic: <Footprints className="w-5 h-5" />,
  boss_pistol: <Dumbbell className="w-5 h-5" />,
  boss_humanflag: <Flag className="w-5 h-5" />,
  boss_muscleup: <Zap className="w-5 h-5" />,
  boss_oap: <Hand className="w-5 h-5" />,
};

interface BossGalleryProps {
  bosses: BossStatus[];
  save: ProtocolSave;
  onToggleMilestone: (id: string) => void;
}

export const BossGallery: React.FC<BossGalleryProps> = ({ bosses, save, onToggleMilestone }) => (
  <Panel className="p-4 sm:p-6">
    <PanelHead
      icon={<Skull className="w-4 h-4" />}
      title="The Ten Final Bosses"
      subtitle={`Every PR on a linked lift deals damage. The Full Planche is weighed against your ${save.bodyWeightKg.toFixed(1)} kg — it grows as you do, up to its 75 kg form.`}
      right={
        <Tally
          icon={<Crown className="w-4 h-4 text-neon-gold" />}
          value={`${bosses.filter((b) => b.defeated).length} / ${bosses.length}`}
          label="defeated"
        />
      }
    />

    <div className="grid gap-4 md:grid-cols-2">
      {bosses.map((status) => (
        <BossCard key={status.boss.id} status={status} save={save} onToggleMilestone={onToggleMilestone} />
      ))}
    </div>
  </Panel>
);

interface BossCardProps {
  status: BossStatus;
  save: ProtocolSave;
  onToggleMilestone: (id: string) => void;
}

const BossCard: React.FC<BossCardProps> = ({ status, save, onToggleMilestone }) => {
  const { boss, defeated, sealed, damage } = status;
  const theme = themeFor(boss.branch);
  const hp = defeated ? 0 : 1 - damage;

  const shell = defeated
    ? 'border-amber-400/60 bg-gradient-to-br from-amber-950/40 via-dark-900/60 to-dark-900/60'
    : 'border-slate-800/80 bg-dark-950/60';

  return (
    <article className={`relative p-4 rounded-2xl border ${shell}`}>
      <header className="flex items-start gap-3 mb-3">
        <div
          className={`relative flex items-center justify-center w-11 h-11 rounded-xl border shrink-0 ${
            defeated ? 'bg-amber-500/20 text-neon-gold border-amber-400/50' : `${theme.bg} ${theme.text} ${theme.border}`
          }`}
        >
          {defeated ? <Crown className="w-5 h-5" /> : BOSS_ICON[boss.id]}
          <span className="absolute -top-1.5 -left-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-dark-950 border border-slate-700 text-[9px] font-black font-mono text-slate-300">
            {boss.order}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-white">{boss.name}</h3>
            {defeated && (
              <span className="text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest bg-amber-500/20 text-neon-gold border-amber-400/50">
                Defeated
              </span>
            )}
            {sealed && !defeated && (
              <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest bg-slate-900 text-slate-400 border-slate-700">
                <Lock className="w-2.5 h-2.5" />
                Sealed
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{boss.epithet}</p>
        </div>
      </header>

      {/* HP */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${defeated ? 'text-neon-gold' : 'text-neon-rose'}`}>
          HP
        </span>
        <MeterBar value={hp} theme="hp" label={`${boss.name} health`} />
        <span className="text-[11px] font-mono font-black text-slate-300 shrink-0 w-10 text-right">
          {Math.round(hp * 100)}%
        </span>
      </div>

      <ul className="space-y-1.5">
        {status.requirements.map((req, index) => {
          const kind = req.requirement.kind;
          const stat = kind === 'stat' ? statById(req.requirement.ref as StatId) : undefined;
          const milestone = kind === 'milestone' ? MILESTONES.find((m) => m.id === req.requirement.ref) : undefined;

          return (
            <li
              key={`${boss.id}_${index}`}
              className="flex items-center justify-between gap-2 text-[11px] py-1.5 px-2.5 rounded-lg bg-dark-900/70 border border-slate-800/70"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded-full border shrink-0 ${
                    req.met ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-dark-950 border-slate-700 text-transparent'
                  }`}
                >
                  <Check className="w-2.5 h-2.5" strokeWidth={4} />
                </span>
                <span className={`truncate ${req.met ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {req.requirement.label}
                </span>
              </span>

              {stat && (
                <span className="font-mono font-bold shrink-0">
                  <span className={req.met ? 'text-emerald-400' : 'text-white'}>
                    {stat.hasBaseline || req.current > 0 ? formatStatValue(req.current, stat.unit) : '—'}
                  </span>
                  <span className="text-slate-600"> / </span>
                  <span className="text-slate-400">{formatStatValue(req.target, stat.unit)}</span>
                </span>
              )}

              {milestone && (
                <button
                  type="button"
                  onClick={() => onToggleMilestone(milestone.id)}
                  title={milestone.description}
                  aria-pressed={Boolean(save.milestones[milestone.id])}
                  className={`shrink-0 px-2 py-0.5 rounded-md border font-black uppercase tracking-wider text-[9px] transition cursor-pointer active:scale-95 ${
                    save.milestones[milestone.id]
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-dark-950 text-neon-cyan border-cyan-500/40 hover:bg-cyan-950/40'
                  }`}
                >
                  {save.milestones[milestone.id] ? 'Claimed' : 'Claim'}
                </button>
              )}

              {kind === 'boss' && (
                <span className={`shrink-0 font-black uppercase tracking-wider text-[9px] ${req.met ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {req.met ? 'Done' : 'Standing'}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
};
