import React from 'react';
import { EyeOff, Users } from 'lucide-react';

/**
 * What joining the crew shares and what it never does. The owner reads it
 * before inviting someone and the new member reads it before joining, so both
 * see the same promise in the same words.
 */
const SEES = [
  'Weekly training XP on the board: sessions, logs, ticks and skill tests.',
  'PRs, bosses, skills and level-ups in the feed. A PR shows as “a new best”, not the number, unless numbers are switched on.',
  'The hero card: level, rank, signature move, gear and training shape.',
];

const PRIVATE = [
  'Bodyweight, weigh-ins and the Mass axis. Never shared, never ranked.',
  '“Train privately” takes anyone off every board and feed, any time, from the Crew page. Their own game is untouched.',
];

const Group: React.FC<{ icon: React.ReactNode; title: string; items: string[] }> = ({ icon, title, items }) => (
  <div className="flex flex-col gap-2">
    <span className="eyebrow text-fg-4 flex items-center gap-1.5">
      {icon}
      {title}
    </span>
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[13px] leading-snug text-fg-2">
          <span aria-hidden="true" className="mt-[7px] w-1.5 h-[3px] shrink-0 rounded-[1px] bg-fg-4" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const CrewSharing: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`grid gap-4 p-3.5 rounded-card bg-ink-850 text-left ${className}`}>
    <Group icon={<Users className="w-3.5 h-3.5" />} title="The crew sees" items={SEES} />
    <Group icon={<EyeOff className="w-3.5 h-3.5" />} title="Stays private" items={PRIVATE} />
  </div>
);
