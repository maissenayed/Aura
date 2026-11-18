'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAccount } from '../../utils/accountStore';

/**
 * How the crew works, in a few lines: open on the first visit, closed with
 * "Got it", and back from the header's "How it works". Whether it was seen is
 * remembered on this device only.
 */

const KEY = 'aura_crew_guide_seen_v1';
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const readSeen = () => {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
let openedByHand = false;

export function setGuideOpen(open: boolean): void {
  openedByHand = open;
  if (!open) {
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      /* Private mode: it just opens again next visit. */
    }
  }
  listeners.forEach((listener) => listener());
}

/** Open on a first visit, or when reopened from the header. */
export function useGuideOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => openedByHand || !readSeen(),
    () => false,
  );
}

const STEPS: { title: string; text: string }[] = [
  { title: 'Train on Quest', text: 'Press Start, log your numbers (not just ticks), and press Finish after 15 minutes or more with every mission done.' },
  { title: 'That session counts here', text: 'It adds your training XP on the board, lands a hit on the crew raid and scores your duels.' },
  { title: 'Cheer the crew', text: 'Open the Feed and give chalk to what your friends did.' },
];

const TABS: { name: string; text: string }[] = [
  { name: 'Board', text: 'Who trained most this week, Monday to Sunday. Only training counts: ticks, logged numbers, finished sessions and skill tests, not bosses. Tap someone to see their card.' },
  { name: 'Most improved', text: 'This week against your own last four weeks, so a beginner can top it.' },
  { name: 'Crew raid', text: 'A boss you all fight together each week. Each finished session is a hit, each PR another. Everyone who hits it gets the badge when it falls.' },
  { name: 'Feed', text: 'What the crew did in the last three weeks: PRs, skills, bosses, level-ups. It fills itself. Chalk is a like; I saw it vouches that you saw it happen.' },
  { name: 'Duels', text: 'Seven days, one on one. Each day scores how much of your own plan you did, up to 100, so any two levels compete fairly.' },
  { name: 'Spotters', text: 'Up to five training partners. The streak counts weeks you both did at least 80% of your missions. Regulars are the people who logged an exercise most.' },
];

export const CrewGuide: React.FC = () => {
  const open = useGuideOpen();
  const { mode, account } = useAccount();
  if (!open) return null;
  const owner = mode === 'accounts' && account?.role === 'admin';

  return (
    <section aria-label="How the crew works" className="flex flex-col gap-4 p-4 rounded-card bg-ink-900 border border-ink-700 anim-fade">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="eyebrow text-fg-4">How the crew works</span>
          <h2 className="font-display font-extrabold uppercase text-[24px] leading-none text-fg">Train, then compare</h2>
        </div>
        <button
          type="button"
          onClick={() => setGuideOpen(false)}
          aria-label="Close the guide"
          className="w-10 h-10 -mr-1 -mt-1 flex items-center justify-center rounded-card text-fg-4 hover:text-fg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <ol className="flex flex-col gap-2.5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="list-none flex gap-3">
            <span className="w-7 h-7 shrink-0 rounded-tag bg-ink-800 flex items-center justify-center num font-bold text-[14px] text-fg">{index + 1}</span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold text-fg">{step.title}</span>
              <span className="text-[13px] text-fg-3 leading-snug">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <dl className="flex flex-col gap-2 border-t border-ink-700 pt-3">
        {TABS.map((tab) => (
          <div key={tab.name} className="flex flex-col gap-0.5">
            <dt className="text-[13px] font-semibold text-fg-2">{tab.name}</dt>
            <dd className="text-[12.5px] text-fg-4 leading-snug">{tab.text}</dd>
          </div>
        ))}
      </dl>

      <p className="text-[12.5px] text-fg-4 leading-snug">
        Bodyweight is never shared. To leave the board and the feed, switch on Train privately at the bottom of Board.
        {owner && (
          <>
            {' '}
            You run the crew from <Link href="/team" className="underline text-fg-2">Team</Link>: invite people, remove them and review flags.
          </>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/quest"
          className="h-11 px-4 rounded-card bg-fg text-ink-950 font-display font-extrabold uppercase text-lg tracking-[0.02em] flex items-center"
        >
          Go to today&apos;s quest
        </Link>
        <button
          type="button"
          onClick={() => setGuideOpen(false)}
          className="h-11 px-4 rounded-card border border-ink-600 text-fg text-sm font-semibold cursor-pointer hover:bg-ink-850"
        >
          Got it
        </button>
      </div>
    </section>
  );
};
