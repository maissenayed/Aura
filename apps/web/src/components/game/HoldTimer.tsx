'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Timer } from 'lucide-react';

/** "0:42". */
export const clockText = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/**
 * A hold timer: tap to start, tap to stop, and the seconds it ran are the
 * number. A 30-second hold costs 30 seconds, so the clock is the evidence.
 */
export const HoldTimer: React.FC<{ onDone: (seconds: number) => void; label?: string; compact?: boolean }> = ({ onDone, label = 'Hold timer', compact = false }) => {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => {
      setNow(Date.now());
      frame.current = window.setTimeout(tick, 200);
    };
    tick();
    return () => {
      if (frame.current) window.clearTimeout(frame.current);
    };
  }, [startedAt]);

  const running = startedAt !== null;
  const seconds = running ? Math.max(0, (now - startedAt) / 1000) : 0;

  const toggle = () => {
    if (!running) {
      setStartedAt(Date.now());
      setNow(Date.now());
      return;
    }
    const held = (Date.now() - startedAt) / 1000;
    setStartedAt(null);
    if (held >= 1) onDone(Math.floor(held));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={running}
      aria-label={running ? `Stop the hold at ${Math.floor(seconds)} seconds` : label}
      className={`flex items-center justify-center gap-1.5 rounded-card font-semibold transition cursor-pointer active:scale-[.97] ${
        compact ? 'h-11 px-3 text-[13px]' : 'h-12 px-4 text-sm'
      } ${running ? 'bg-act text-ink-950' : 'border border-ink-600 text-fg hover:bg-ink-850'}`}
    >
      {running ? <Pause className="w-4 h-4" /> : compact ? <Timer className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      <span className="num">{running ? clockText(seconds) : compact ? 'Hold' : label}</span>
    </button>
  );
};

/** A rest countdown between sets: it only reminds, it never blocks. */
export const RestTimer: React.FC<{ seconds?: number }> = ({ seconds = 90 }) => {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (endsAt === null) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= endsAt) setEndsAt(null);
    }, 250);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const left = endsAt === null ? 0 : Math.max(0, (endsAt - now) / 1000);
  return (
    <button
      type="button"
      onClick={() => {
        setNow(Date.now());
        setEndsAt(endsAt === null ? Date.now() + seconds * 1000 : null);
      }}
      aria-pressed={endsAt !== null}
      className={`h-9 px-3 rounded-card text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-[.97] ${
        endsAt !== null ? 'bg-ink-800 text-fg' : 'border border-ink-600 text-fg-2 hover:bg-ink-850'
      }`}
    >
      <Timer className="w-3.5 h-3.5" />
      <span className="num">{endsAt !== null ? `Rest ${clockText(left)}` : `Rest ${clockText(seconds)}`}</span>
    </button>
  );
};
