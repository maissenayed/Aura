import React from 'react';

/**
 * Aura's own icons, drawn with the figures' pen: 24 grid, 2px stroke, round
 * caps and joins. Shapes come from the training world (the tree is a route of
 * holds, the forge an anvil). One filled detail per icon at most, in a state
 * colour: the flame's core lights while the streak is alive.
 * Same props as the stock icons, so they drop in where those were.
 */
export interface IconProps {
  className?: string;
  strokeWidth?: number;
  /** Fill the icon's one solid detail (a lit flame, a forged shield). */
  lit?: boolean;
  'aria-hidden'?: boolean;
}

function icon(draw: (lit: boolean) => React.ReactNode) {
  const Icon: React.FC<IconProps> = ({ className = 'w-6 h-6', strokeWidth = 2, lit = false }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {draw(lit)}
    </svg>
  );
  return Icon;
}

export const CampIcon = icon(() => (
  <>
    <path d="M4 21l16-4M4 17l16 4" />
    <path d="M12 3.5c3 3 4.5 5 4.5 7.4a4.5 4.5 0 0 1-9 0c0-1.9 1.1-3.3 2.4-4.4.2 1.5.9 2.4 2 2.9-.3-2.1-.3-3.8.1-5.9z" />
  </>
));

/** The skill tree: a route of holds up a wall. */
export const RouteIcon = icon(() => (
  <>
    <path d="M7 19.5 16.5 15 8 10 16 4.5" strokeDasharray="2 2.6" />
    <circle cx="7" cy="19.5" r="2.4" fill="currentColor" />
    <circle cx="16.5" cy="15" r="2.4" fill="currentColor" />
    <circle cx="8" cy="10" r="2.4" fill="currentColor" />
    <circle cx="16" cy="4.5" r="2.4" />
  </>
));

/** Today's quest: a session card with a tick. */
export const QuestIcon = icon(() => (
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h4" />
    <path d="M9 16.2l1.8 1.8 4-4" />
  </>
));

/** Bosses: a horned helm. */
export const BossIcon = icon(() => (
  <>
    <path d="M4.5 3.5c0 3.2 1.2 5.3 3.3 6.4M19.5 3.5c0 3.2-1.2 5.3-3.3 6.4" />
    <path d="M7 12a5 5 0 0 1 10 0v4.5L15 21H9l-2-4.5z" />
    <path d="M9.6 14.6h1.6M12.8 14.6h1.6" />
  </>
));

/** The hero sheet: a figure, arms up. */
export const HeroIcon = icon(() => (
  <>
    <circle cx="12" cy="4.8" r="2.3" />
    <path d="M12 8.6v6.6M12 15.2 9 21M12 15.2l3 5.8M12 10 6.5 6.8M12 10l5.5-3.2" />
  </>
));

/** The Forge: an anvil. */
export const ForgeIcon = icon(() => (
  <>
    <path d="M3 7h13.5c0 3-2 5-4.5 5.2V15h3v3.5H7V15h3v-2.8C6.2 12 3 10.4 3 7z" />
    <path d="M16.5 7H21" />
  </>
));

export const MapIcon = icon(() => (
  <>
    <path d="M4 6.5l5-2 6 2 5-2v13l-5 2-6-2-5 2z" />
    <path d="M9 4.5v13M15 6.5v13" />
  </>
));

/** The streak. `lit` fills its core while the streak is alive. */
export const FlameIcon = icon((lit) => (
  <>
    <path d="M12 2.8c3.6 3.9 5.6 6.6 5.6 10.2a5.6 5.6 0 0 1-11.2 0c0-2.4 1.2-4.1 2.8-5.5.2 1.8 1 3 2.4 3.6-.4-2.9-.3-5.6.4-8.3z" />
    {lit && <path d="M12 13.2c1.4 1.3 2.1 2.3 2.1 3.4a2.1 2.1 0 0 1-4.2 0c0-1.1.7-2.1 2.1-3.4z" fill="currentColor" stroke="none" />}
  </>
));

/** Armour. `lit` = forged. */
export const ShieldIcon = icon((lit) => (
  <>
    <path d="M12 3l7 2.8v5.4c0 4.8-3 8.3-7 9.8-4-1.5-7-5-7-9.8V5.8z" fill={lit ? 'currentColor' : 'none'} fillOpacity={lit ? 0.22 : undefined} />
    <path d="M12 7.5v9" />
  </>
));

/** Loot. `lit` = open. */
export const ChestIcon = icon((lit) => (
  <>
    <rect x="3" y="10" width="18" height="10" rx="1.5" fill={lit ? 'currentColor' : 'none'} fillOpacity={lit ? 0.22 : undefined} />
    <path d="M3 10c0-3.5 3-5.5 9-5.5s9 2 9 5.5M3 13.5h18" />
    <rect x="10.5" y="12" width="3" height="4" rx=".6" />
  </>
));

export const LockIcon = icon(() => (
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>
));

export const CheckIcon = icon(() => <path d="M5 12.5l4.5 4.5L19 7.5" />);

export const ArrowRightIcon = icon(() => <path d="M5 12h14M13 6l6 6-6 6" />);

/** Slain. */
export const CrownIcon = icon(() => <path d="M4 19h16M5 16 4 7l5 4 3-6 3 6 5-4-1 9z" />);

export const MoonIcon = icon(() => <path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.4 6.4 0 0 0 10 10z" />);

/** Disciplines: rings for calisthenics, a plate for the gym, a hold for bouldering, a lotus for yoga. */
export const RingsIcon = icon(() => (
  <>
    <path d="M8 2v6M16 2v6" />
    <circle cx="8" cy="13" r="5" />
    <circle cx="16" cy="13" r="5" />
  </>
));

export const PlateIcon = icon(() => (
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M12 3.5v3M12 17.5v3" />
  </>
));

export const HoldIcon = icon(() => (
  <>
    <path d="M5 15c0-5 3.5-9 8-9 3.5 0 6 2.4 6 5.6 0 4-3.8 6.9-8.4 6.9C7.4 18.5 5 17.4 5 15z" />
    <circle cx="12.5" cy="12" r="1.6" />
  </>
));

export const LotusIcon = icon(() => (
  <>
    <path d="M12 18.5c-2.6-2-3.6-4.6-3-7.6.4-1.9 1.5-3.6 3-4.9 1.5 1.3 2.6 3 3 4.9.6 3-.4 5.6-3 7.6z" />
    <path d="M9.2 17.6C6 17.3 3.6 15.4 3 12.4c2-.4 3.9-.1 5.6.9" />
    <path d="M14.8 17.6c3.2-.3 5.6-2.2 6.2-5.2-2-.4-3.9-.1-5.6.9" />
  </>
));

/* ------------------------------------------------------------------ */
/* The mark                                                             */
/* ------------------------------------------------------------------ */

/**
 * The Ring: Camp's XP ring, open on purpose, with a chalk point where you are.
 * Gold on iron; never closed, never glowing.
 */
export const RingMark: React.FC<{ className?: string; title?: string }> = ({ className = 'w-6 h-6', title }) => (
  <svg viewBox="0 0 100 100" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    <circle
      cx="50"
      cy="50"
      r="38"
      fill="none"
      strokeWidth="13"
      strokeLinecap="round"
      strokeDasharray="200.5 38.3"
      transform="rotate(-90 50 50)"
      style={{ stroke: 'var(--color-earned)' }}
    />
    <circle cx="17.9" cy="29.6" r="7" style={{ fill: 'var(--color-fg)' }} />
  </svg>
);

/** The lockup: the Ring and AURA in the narrowest, heaviest width. */
export const Wordmark: React.FC<{ className?: string; size?: 'sm' | 'md' }> = ({ className = '', size = 'md' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Aura">
    <RingMark className={size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'} />
    <span aria-hidden="true" className={`font-display font-black leading-none tracking-[0.02em] ${size === 'sm' ? 'text-xl' : 'text-[28px]'}`}>
      AURA
    </span>
  </span>
);
