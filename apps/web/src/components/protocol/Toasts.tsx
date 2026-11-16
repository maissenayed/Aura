'use client';

import React from 'react';
import { CalendarCheck, Check, Crown, Flag, Hexagon, Scale, Sparkles, Star, TrendingUp, Trophy, X } from 'lucide-react';
import { EventKind, GameEvent } from '../../utils/protocolEngine';

interface EventVisual {
  icon: React.ReactNode;
  label: string;
  text: string;
  border: string;
  bg: string;
}

const ICON = 'w-4 h-4';

/** One look per kind of event, shared by the toasts and the battle log. */
export const EVENT_VISUAL: Record<EventKind, EventVisual> = {
  pr: { icon: <TrendingUp className={ICON} />, label: 'Personal record', text: 'text-neon-cyan', border: 'border-cyan-500/50', bg: 'bg-cyan-950/60' },
  tier: { icon: <Star className={ICON} />, label: 'Skill tier', text: 'text-neon-emerald', border: 'border-emerald-500/50', bg: 'bg-emerald-950/60' },
  boss: { icon: <Crown className={ICON} />, label: 'Boss defeated', text: 'text-neon-gold', border: 'border-amber-400/60', bg: 'bg-amber-950/70' },
  level: { icon: <Sparkles className={ICON} />, label: 'Level up', text: 'text-neon-purple', border: 'border-purple-500/50', bg: 'bg-purple-950/60' },
  mass: { icon: <Scale className={ICON} />, label: 'Mass quest', text: 'text-neon-amber', border: 'border-amber-500/50', bg: 'bg-amber-950/60' },
  iron: { icon: <Flag className={ICON} />, label: 'Iron checkpoint', text: 'text-sky-300', border: 'border-sky-500/50', bg: 'bg-sky-950/60' },
  day: { icon: <CalendarCheck className={ICON} />, label: 'Mission complete', text: 'text-emerald-300', border: 'border-emerald-600/50', bg: 'bg-emerald-950/60' },
  week: { icon: <Trophy className={ICON} />, label: 'Perfect week', text: 'text-neon-gold', border: 'border-amber-400/60', bg: 'bg-amber-950/70' },
  attribute: { icon: <Hexagon className={ICON} />, label: 'Character', text: 'text-neon-purple', border: 'border-purple-400/60', bg: 'bg-purple-950/70' },
  skill: { icon: <Check className={ICON} strokeWidth={3} />, label: 'Skill mastered', text: 'text-neon-emerald', border: 'border-emerald-500/50', bg: 'bg-emerald-950/60' },
};

export interface Toast extends GameEvent {
  id: number;
}

interface ToastStackProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => (
  <div
    className="fixed bottom-[96px] lg:bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(340px,calc(100vw-2rem))] pointer-events-none"
    aria-live="polite"
  >
    {toasts.map((toast) => {
      const visual = EVENT_VISUAL[toast.kind];
      return (
        <div
          key={toast.id}
          className={`toast-in pointer-events-auto flex items-start gap-3 p-3 rounded-2xl border backdrop-blur-xl shadow-2xl ${visual.bg} ${visual.border}`}
        >
          <div className={`p-2 rounded-xl bg-dark-950/80 border ${visual.border} ${visual.text} shrink-0`}>
            {visual.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-[9px] font-black uppercase tracking-widest ${visual.text}`}>{visual.label}</div>
            <div className="text-sm font-black text-white leading-tight">{toast.title}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">{toast.detail}</div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            className="p-1 rounded-lg text-slate-500 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    })}
  </div>
);
