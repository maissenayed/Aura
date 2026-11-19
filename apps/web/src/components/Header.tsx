'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';
import { AccountMenu } from './account/AccountMenu';
import { CampIcon, RouteIcon, Wordmark } from './game/icons';

const LINKS = [
  { href: '/', label: 'Skill Tree', icon: RouteIcon },
  { href: '/anatomy', label: 'Anatomy', icon: Activity },
  { href: '/camp', label: 'Campaign', icon: CampIcon },
];

const LINK = 'flex items-center gap-2 h-9 px-3 rounded-card text-xs font-bold whitespace-nowrap transition';

/** The bar over the pages outside the game (joining, resetting a password). Each page brings its own toolbar underneath. */
export const Header: React.FC = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-ink-900 border-b border-ink-700 px-3 sm:px-6 py-2">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/" className="flex items-center shrink-0 mr-auto" aria-label="Aura — skill tree">
          <Wordmark size="sm" />
        </Link>

        <nav aria-label="Main" className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const current = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? 'page' : undefined}
                className={`${LINK} ${current ? 'bg-ink-800 text-fg' : 'text-fg-4 hover:text-fg hover:bg-ink-850'}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={current ? '' : 'max-sm:sr-only'}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <AccountMenu />
      </div>
    </header>
  );
};
