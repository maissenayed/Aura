'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Cloud, CloudOff, CloudUpload, ListTree, Users } from 'lucide-react';
import { AccountMenu } from '../account/AccountMenu';
import { useAccount } from '../../utils/accountStore';
import { useGame } from './GameProvider';
import { HexLevel, Meter } from './kit';
import { BossIcon, CampIcon, FlameIcon, ForgeIcon, HeroIcon, MapIcon, QuestIcon, RouteIcon, Wordmark } from './icons';
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
 * The frame around every game screen: a flat bottom bar on phones with the
 * quest as a chalk key in the middle, and a sidebar on desktop with the player
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
  { href: '/camp', label: 'Camp', icon: CampIcon },
  { href: '/', label: 'Tree', icon: RouteIcon },
  { href: '/quest', label: 'Quest', icon: QuestIcon },
  { href: '/bosses', label: 'Bosses', icon: BossIcon },
  { href: '/hero', label: 'Hero', icon: HeroIcon },
];

const SECONDARY: NavItem[] = [
  { href: '/crew', label: 'Crew', icon: Users },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/forge', label: 'Forge', icon: ForgeIcon },
  { href: '/anatomy', label: 'Anatomy', icon: Activity },
];

/** The owner's tools, shown only to the owner. */
const OWNER: NavItem[] = [{ href: '/admin/exercises', label: 'Exercises', icon: ListTree }];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(`${item.href}/`) || Boolean(item.also?.some((p) => pathname.startsWith(p)));
}

export const AppShell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className="flex-1 min-h-dvh flex bg-ink-950 text-fg">
    <Sidebar />
    <div className={`flex-1 min-w-0 flex flex-col pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-0 ${className}`}>{children}</div>
    <BottomNav />
  </div>
);

const SYNC = {
  connecting: { icon: CloudUpload, label: 'Connecting', tone: 'text-fg-4' },
  saving: { icon: CloudUpload, label: 'Saving', tone: 'text-fg-2' },
  synced: { icon: Cloud, label: 'Synced', tone: 'text-fg-4' },
  offline: { icon: CloudOff, label: 'Offline — saved on this device', tone: 'text-fg-2' },
} as const;

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { gate, derived, streak, sync } = useGame();
  const owner = useAccount().account?.role === 'admin';
  const ready = gate === 'ready';
  const left = useLeftToday();
  const SyncIcon = SYNC[sync].icon;

  return (
    <aside className="hidden lg:flex sticky top-0 z-10 h-dvh w-[236px] shrink-0 flex-col gap-5 px-3.5 py-6 border-r border-ink-800 bg-ink-900">
      <Link href="/camp" className="flex items-center px-2" aria-label="Aura — camp">
        <Wordmark size="sm" />
      </Link>

      {ready ? (
        <Link
          href="/hero"
          aria-label={`Level ${derived.level.level}, ${derived.level.rank}`}
          className="flex items-center gap-3 p-3 rounded-card bg-ink-850 raised hover:bg-ink-800 transition"
        >
          <HexLevel level={derived.level.level} size="sm" progress={derived.level.xpIntoLevel / derived.level.xpForLevel} />
          <span className="flex-1 min-w-0 flex flex-col gap-1.5">
            <span className="font-display font-extrabold uppercase text-base leading-none truncate">{derived.level.rank}</span>
            <Meter value={derived.level.xpIntoLevel / derived.level.xpForLevel} tone="earned" className="h-[5px]" />
          </span>
        </Link>
      ) : (
        <Link href="/camp" className="flex items-center justify-center h-11 rounded-card bg-act text-act-deep font-display font-extrabold uppercase text-lg tracking-[0.02em]">
          Start your campaign
        </Link>
      )}

      <nav aria-label="Main" className="flex flex-col gap-1">
        {[...PRIMARY, ...SECONDARY, ...(owner ? OWNER : [])].map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center gap-3 h-11 px-3 rounded-card text-sm font-semibold transition ${
                active ? 'bg-ink-800 text-fg before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-[2px] before:bg-act' : 'text-fg-4 hover:bg-ink-850 hover:text-fg'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span>{item.label === 'Tree' ? 'Skill tree' : item.label}</span>
              {item.href === '/quest' && ready && left > 0 && (
                <span className="ml-auto min-w-5 h-5 px-1.5 rounded-tag bg-ink-950 border border-ink-600 text-fg num font-bold text-[12px] flex items-center justify-center">
                  {left}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        {ready && (
          <div className="flex items-center gap-2 h-11 px-3.5 rounded-card bg-earned-deep text-earned-soft">
            <FlameIcon className="w-[18px] h-[18px]" lit={streak > 0} />
            <span className="num font-bold text-lg">{streak}</span>
            <span className="eyebrow">day streak</span>
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
      className="lg:hidden fixed z-40 inset-x-0 bottom-0 bg-ink-900 border-t border-ink-700 px-[max(8px,env(safe-area-inset-left))]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="h-[68px] max-w-[520px] mx-auto flex items-center justify-around">
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
                className={`relative w-[52px] h-[52px] rounded-card flex items-center justify-center transition active:scale-[.97] ${
                  active ? 'bg-ink-950 text-fg border-2 border-act' : 'bg-act text-act-deep'
                }`}
              >
                <Icon className="w-[26px] h-[26px]" strokeWidth={2.2} />
                {gate === 'ready' && left > 0 && !active && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-[5px] bg-ink-950 border-[1.5px] border-act text-fg num font-bold text-[11px] flex items-center justify-center">
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
              className={`relative w-[60px] h-[54px] flex flex-col items-center justify-center gap-1 ${active ? 'text-fg' : 'text-fg-5'}`}
            >
              {/* The current page carries a chalk tally mark. */}
              {active && <span className="absolute -top-[7px] w-[18px] h-[3px] rounded-[2px] bg-act" aria-hidden="true" />}
              <Icon className="w-[23px] h-[23px]" strokeWidth={2} />
              <span className="font-sans [font-stretch:125%] font-semibold text-[9.5px] uppercase leading-none" style={{ letterSpacing: '0.07em' }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
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
        className="w-11 h-11 shrink-0 rounded-card bg-ink-850 raised text-fg-2 flex items-center justify-center hover:bg-ink-800 transition"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>
    )}
    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
      {eyebrow && <span className="eyebrow text-fg-4">{eyebrow}</span>}
      <h1 className="font-display font-extrabold uppercase text-[32px] lg:text-[40px] leading-[0.95] truncate">{title}</h1>
    </div>
    {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
  </div>
);
