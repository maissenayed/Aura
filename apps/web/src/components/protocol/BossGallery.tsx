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
import { Branch } from '../../utils/campaignPlan';
import { BossStatus, ProtocolSave, formatStatValue } from '../../utils/protocolEngine';
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

/** Bosses added in the plan editor get an icon from their branch. */
const BRANCH_ICON: Record<Branch, React.ReactNode> = {
  push: <Flame className="w-5 h-5" />,
  pull: <Zap className="w-5 h-5" />,
  legs: <Footprints className="w-5 h-5" />,
  core: <Flag className="w-5 h-5" />,
};

const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

function galleryTitle(count: number): string {
  if (count === 1) return 'The Final Boss';
  return `The ${NUMBER_WORDS[count] ?? count} Final Bosses`;
}

interface BossGalleryProps {
  bosses: BossStatus[];
  save: ProtocolSave;
  goalKg: number;
  onToggleMilestone: (id: string) => void;
}

export const BossGallery: React.FC<BossGalleryProps> = ({ bosses, save, goalKg, onToggleMilestone }) => (
  <Panel className="p-4 sm:p-6">
    <PanelHead
      icon={<Skull className="w-4 h-4" />}
      title={bosses.length ? galleryTitle(bosses.length) : 'Final Bosses'}
      subtitle={
        bosses.some((status) => status.requirements.some((req) => req.scales))
          ? `Every PR on a linked lift deals damage. Targets marked ⇡ are weighed against your ${save.bodyWeightKg.toFixed(1)} kg and grow with you, up to their ${goalKg} kg form.`
          : 'Every PR on a linked lift deals damage. Claim milestones when you own them.'
      }
      right={
        <Tally
          icon={<Crown className="w-4 h-4 text-neon-gold" />}
          value={`${bosses.filter((b) => b.defeated).length} / ${bosses.length}`}
          label="defeated"
        />
      }
    />

    {bosses.length === 0 && (
      <p className="text-xs text-slate-400">Your plan has no bosses yet. Add one in the Plan tab, under Bosses.</p>
    )}

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
  const { boss, order, defeated, sealed, damage } = status;
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
          {defeated ? <Crown className="w-5 h-5" /> : (BOSS_ICON[boss.id] ?? BRANCH_ICON[boss.branch])}
          <span className="absolute -top-1.5 -left-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-dark-950 border border-slate-700 text-[9px] font-black font-mono text-slate-300">
            {order}
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
          const stat = req.lift;
          const milestone = req.milestone;

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
                  {req.label}
                  {req.scales && <span className="text-slate-500" title="Grows with your bodyweight"> ⇡</span>}
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
