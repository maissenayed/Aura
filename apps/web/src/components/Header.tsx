'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Flame, LayoutGrid, Sparkles, Swords } from 'lucide-react';
import { AccountMenu } from './account/AccountMenu';

// The admin tool is a separate app. It is linked when its address is configured, and during local development.
const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null);

const LINKS = [
  { href: '/', label: 'Skill Tree', icon: LayoutGrid, active: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40' },
  { href: '/anatomy', label: 'Anatomy', icon: Activity, active: 'bg-neon-emerald/15 text-neon-emerald border-neon-emerald/40' },
  { href: '/camp', label: 'Campaign', icon: Swords, active: 'bg-blue-600/25 text-blue-300 border-blue-500/50' },
];

const LINK = 'flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-extrabold whitespace-nowrap transition';

/** The site's navigation. Each page brings its own toolbar underneath. */
export const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-dark-950/95 backdrop-blur-2xl border-b border-slate-800/80 px-3 sm:px-6 py-2">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-auto" aria-label="Aura Calisthenics — skill tree">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan/20 via-neon-purple/20 to-transparent border border-neon-cyan/40">
            <Flame className="w-4.5 h-4.5 text-neon-cyan" />
          </span>
          <span className="hidden sm:block text-base font-black tracking-tight text-white">
            AURA <span className="text-neon-cyan">CALISTHENICS</span>
          </span>
        </Link>

        <nav aria-label="Main" className="no-scrollbar flex items-center gap-1 p-1 rounded-2xl bg-dark-900/90 border border-slate-800/90 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon, active }) => {
            const current = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? 'page' : undefined}
                className={`${LINK} ${current ? active : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className={current ? '' : 'max-sm:sr-only'}>{label}</span>
              </Link>
            );
          })}

          {ADMIN_URL && (
            <a
              href={ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${LINK} border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              <span className="max-sm:sr-only">Admin</span>
            </a>
          )}
        </nav>

        <AccountMenu />
      </div>
    </header>
  );
};
