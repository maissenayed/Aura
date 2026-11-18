'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Cloud, CloudOff, CloudUpload, Flame, Hammer, Map, Network, ShieldHalf, Skull, Sparkles, Swords, Tent } from 'lucide-react';
import { AccountMenu } from '../account/AccountMenu';
import { useGame } from './GameProvider';
import { HexLevel, Meter } from './kit';
import { evaluateWeek } from '../../utils/protocolEngine';

/** Missions left today, whatever week the board is showing. */
function useLeftToday(): number {
  const { save, plan, currentWeek, todayDayId } = useGame();
  return React.useMemo(() => {
    if (!todayDayId) return 0;
    const today = evaluateWeek(save, currentWeek, plan).days.find((entry) => entry.day.id === todayDayId);
    return today ? today.total - today.done : 0;
  }, [currentWeek, plan, save, todayDayId]);
}

/**
 * The frame around every game screen: a bottom bar on phones with the quest as
 * a raised diamond in the middle, and a sidebar on desktop with the player
 * card, every section and the streak.
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Other paths that light this item up. */
  also?: string[];
}

const PRIMARY: NavItem[] = [
  { href: '/camp', label: 'Camp', icon: Tent },
  { href: '/', label: 'Tree', icon: Network },
  { href: '/quest', label: 'Quest', icon: Swords },
  { href: '/bosses', label: 'Bosses', icon: Skull },
  { href: '/hero', label: 'Hero', icon: ShieldHalf },
];

const SECONDARY: NavItem[] = [
  { href: '/map', label: 'Map', icon: Map },
  { href: '/forge', label: 'Forge', icon: Hammer },
  { href: '/anatomy', label: 'Anatomy', icon: Activity },
];

// The admin tool is a separate app, linked when its address is configured and during local development.
const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null);

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(`${item.href}/`) || Boolean(item.also?.some((p) => pathname.startsWith(p)));
}

export const AppShell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className="flex-1 min-h-dvh flex bg-ink-950 text-fg">
    <Sidebar />
    <div className={`flex-1 min-w-0 flex flex-col pb-[96px] lg:pb-0 ${className}`}>{children}</div>
    <BottomNav />
  </div>
);

const SYNC = {
  connecting: { icon: CloudUpload, label: 'Connecting', tone: 'text-fg-4' },
  saving: { icon: CloudUpload, label: 'Saving', tone: 'text-act' },
  synced: { icon: Cloud, label: 'Synced', tone: 'text-fg-4' },
  offline: { icon: CloudOff, label: 'Offline — saved on this device', tone: 'text-earned' },
} as const;

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { gate, derived, streak, sync } = useGame();
  const ready = gate === 'ready';
  const left = useLeftToday();
  const SyncIcon = SYNC[sync].icon;

  return (
    <aside className="hidden lg:flex sticky top-0 h-dvh w-[236px] shrink-0 flex-col gap-5 px-3.5 py-6 border-r border-ink-750 bg-[#080a10]">
      <Link href="/camp" className="flex items-center gap-2 px-2" aria-label="Aura — camp">
        <Sparkles className="w-[18px] h-[18px] text-aura" />
        <span className="font-display font-bold text-xl tracking-[0.32em]">AURA</span>
      </Link>

      {ready ? (
        <Link
          href="/hero"
          aria-label={`Level ${derived.level.level}, ${derived.level.rank}`}
          className="flex items-center gap-3 p-3 rounded-2xl bg-ink-800 border border-ink-700 hover:border-ink-600 transition"
        >
          <HexLevel level={derived.level.level} size="sm" />
          <span className="flex-1 min-w-0 flex flex-col gap-1.5">
            <span className="font-display font-bold text-sm truncate">{derived.level.rank}</span>
            <Meter value={derived.level.xpIntoLevel / derived.level.xpForLevel} tone="earned" className="h-[5px]" />
          </span>
        </Link>
      ) : (
        <Link href="/camp" className="flex items-center justify-center h-11 rounded-2xl bg-act text-act-deep font-display font-bold tracking-wide">
          START YOUR CAMPAIGN
        </Link>
      )}

      <nav aria-label="Main" className="flex flex-col gap-1">
        {[...PRIMARY, ...SECONDARY].map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold transition ${
                active ? 'bg-[#08161d] text-act' : 'text-fg-4 hover:bg-ink-800 hover:text-fg'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span>{item.label === 'Tree' ? 'Skill tree' : item.label}</span>
              {item.href === '/quest' && ready && left > 0 && (
                <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-boss text-white text-[11px] font-bold flex items-center justify-center">
                  {left}
                </span>
              )}
            </Link>
          );
        })}
        {ADMIN_URL && (
          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold text-fg-4 hover:bg-ink-800 hover:text-fg transition"
          >
            <Sparkles className="w-5 h-5 text-aura" />
            <span>Admin</span>
          </a>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        {ready && (
          <div className="flex items-center gap-2 h-11 px-3.5 rounded-[14px] bg-[#1a1208] border border-[#4a3410] text-earned font-display font-bold">
            <Flame className="w-[18px] h-[18px]" />
            <span>{streak} day streak</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-1">
          {ready && (
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${SYNC[sync].tone}`} title={SYNC[sync].label}>
              <SyncIcon className="w-4 h-4" />
              {SYNC[sync].label.split(' — ')[0]}
            </span>
          )}
          <AccountMenu />
        </div>
      </div>
    </aside>
  );
};

const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { gate } = useGame();
  const left = useLeftToday();

  return (
    <nav
      aria-label="Main"
      className="lg:hidden fixed z-40 left-3 right-3 bottom-3.5 h-[66px] rounded-3xl bg-[#0c0f18] border border-ink-700 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      {PRIMARY.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        if (item.href === '/quest') {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={gate === 'ready' && left > 0 ? `Today's quest, ${left} left` : "Today's quest"}
              className={`relative -mt-8 w-[60px] h-[60px] rounded-[18px] rotate-45 flex items-center justify-center transition active:scale-95 ${
                active
                  ? 'bg-fg text-act-deep shadow-[0_0_0_3px_#3ee8ff,0_8px_26px_rgba(62,232,255,0.45)]'
                  : 'bg-act text-act-deep shadow-[0_8px_26px_rgba(62,232,255,0.4)]'
              }`}
            >
              <Icon className="w-[26px] h-[26px] -rotate-45" strokeWidth={2.2} />
              {gate === 'ready' && left > 0 && !active && (
                <span className="absolute -top-1.5 -right-1.5 -rotate-45 w-5 h-5 rounded-full bg-boss border-2 border-[#0c0f18] text-white text-[11px] font-bold flex items-center justify-center">
                  {left > 9 ? '9+' : left}
                </span>
              )}
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`w-[58px] h-[54px] flex flex-col items-center justify-center gap-1 text-[10.5px] tracking-[0.04em] ${
              active ? 'text-act font-bold' : 'text-[#8a94ad] font-semibold'
            }`}
          >
            <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

/** A page title row used by the game screens: an optional back link, the title, and things on the right. */
export const ScreenHeader: React.FC<{
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  back?: { href: string; label: string };
  right?: React.ReactNode;
}> = ({ title, eyebrow, back, right }) => (
  <div className="flex items-center gap-3 min-h-11">
    {back && (
      <Link
        href={back.href}
        aria-label={back.label}
        className="w-11 h-11 shrink-0 rounded-[14px] border border-ink-700 bg-ink-800 text-fg-2 flex items-center justify-center hover:border-ink-600 transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>
    )}
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
      {eyebrow && <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-fg-4">{eyebrow}</span>}
      <h1 className="font-display font-bold text-[26px] lg:text-[32px] leading-[1.05] truncate">{title}</h1>
    </div>
    {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
  </div>
);
