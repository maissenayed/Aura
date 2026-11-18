'use client';

import React from 'react';
import { CalendarCheck, Check, Crown, Flag, Hexagon, Medal, Scale, Star, TrendingUp, Trophy, X } from 'lucide-react';
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
  pr: { icon: <TrendingUp className={ICON} />, label: 'Personal record', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  log: { icon: <CalendarCheck className={ICON} />, label: 'Session logged', text: 'text-fg-2', border: 'border-ink-600', bg: 'bg-ink-850' },
  tier: { icon: <Star className={ICON} />, label: 'Skill tier', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  boss: { icon: <Crown className={ICON} />, label: 'Boss defeated', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  act: { icon: <Flag className={ICON} />, label: 'Act cleared', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  campaign: { icon: <Trophy className={ICON} />, label: 'Campaign complete', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  level: { icon: <TrendingUp className={ICON} />, label: 'Level up', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  mass: { icon: <Scale className={ICON} />, label: 'Mass quest', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  iron: { icon: <Flag className={ICON} />, label: 'Iron checkpoint', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  day: { icon: <CalendarCheck className={ICON} />, label: 'Mission complete', text: 'text-earned-soft', border: 'border-earned-line', bg: 'bg-earned-deep' },
  week: { icon: <Trophy className={ICON} />, label: 'Perfect week', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  attribute: { icon: <Hexagon className={ICON} />, label: 'Character', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  skill: { icon: <Check className={ICON} strokeWidth={3} />, label: 'Skill mastered', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
  badge: { icon: <Medal className={ICON} />, label: 'Badge earned', text: 'text-earned', border: 'border-earned-line', bg: 'bg-earned-deep' },
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
    className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] lg:bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(340px,calc(100vw-2rem))] pointer-events-none"
    aria-live="polite"
  >
    {toasts.map((toast) => {
      const visual = EVENT_VISUAL[toast.kind];
      return (
        <div
          key={toast.id}
          className={`notch toast-in pointer-events-auto flex items-start gap-3 p-3 rounded-card lift-shadow ${visual.bg}`}
        >
          <div className={`p-2 rounded-tag bg-ink-950/50 ${visual.text} shrink-0`}>
            {visual.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`eyebrow ${visual.text}`}>{visual.label}</div>
            <div className="font-display font-extrabold uppercase text-[18px] text-fg leading-none mt-0.5">{toast.title}</div>
            <div className="text-[12px] text-fg-3 mt-1">{toast.detail}</div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            className="p-1 rounded-card text-fg-5 hover:text-fg transition cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    })}
  </div>
);
