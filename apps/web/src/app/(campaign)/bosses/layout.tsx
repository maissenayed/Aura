'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CrownIcon, LockIcon } from '../../../components/game/icons';
import { ScreenHeader } from '../../../components/game/AppShell';
import { useGame } from '../../../components/game/GameProvider';
import { figureForBoss } from '../../../components/game/figures';
import { bossHp, sealedLine } from '../../../components/game/helpers';
import { Chip, Figure, Meter } from '../../../components/game/kit';

/**
 * The boss gallery, with the fight beside it on desktop. On a phone the
 * gallery steps aside while a boss is open, so the fight gets the whole screen.
 */
export default function BossesLayout({ children }: { children: React.ReactNode }) {
  const { derived } = useGame();
  const params = useParams<{ bossId?: string }>();
  const openId = params.bossId;
  const slain = derived.bosses.filter((status) => status.defeated).length;

  return (
    <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-5">
      <div className={openId ? 'hidden lg:block' : ''}>
        <ScreenHeader
          title="Bosses"
          right={
            <Chip tone={slain > 0 ? 'earned' : 'dim'} className="h-10 px-3 rounded-card text-[17px]">
              <CrownIcon className="w-4 h-4" strokeWidth={2.2} />
              <span className="num">{slain}</span>
              <span className={slain > 0 ? 'text-earned-dim' : 'text-fg-5'}>/ {derived.bosses.length}</span>
              <span className="eyebrow">slain</span>
            </Chip>
          }
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_420px] items-start">
        <ul className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(176px,1fr))] gap-3 ${openId ? 'hidden lg:grid' : ''}`}>
          {derived.bosses.map((status) => {
            const hp = bossHp(status);
            const on = status.boss.id === openId;
            const state = status.defeated ? 'slain' : status.sealed ? 'sealed' : 'boss';
            return (
              <li key={status.boss.id}>
                <Link
                  href={`/bosses/${status.boss.id}`}
                  aria-current={on ? 'page' : undefined}
                  aria-label={`${status.boss.name}, ${status.defeated ? 'slain' : status.sealed ? 'sealed' : `${hp} HP`}`}
                  className={`notch relative h-[214px] flex flex-col gap-2 p-3 rounded-card overflow-hidden transition hover:-translate-y-0.5 ${
                    status.defeated ? 'bg-earned-deep' : status.sealed ? 'bg-ink-900 chains' : 'bg-boss-deep'
                  } ${on ? 'outline-2 -outline-offset-2 outline-act' : ''}`}
                >
                  <span className="relative h-[110px] flex items-center justify-center">
                    <Figure spec={figureForBoss(status.boss)} state={state} className="w-[108px] h-[108px]" />
                    {status.sealed && (
                      <span className="absolute w-11 h-11 rounded-card bg-ink-950 border-[1.5px] border-ink-500 flex items-center justify-center">
                        <LockIcon className="w-5 h-5 text-fg-3" />
                      </span>
                    )}
                    {status.defeated && (
                      <span className="absolute top-0 right-0 w-[30px] h-[30px] rounded-[7px] bg-earned flex items-center justify-center">
                        <CrownIcon className="w-4 h-4 text-earned-deep" strokeWidth={2.4} />
                      </span>
                    )}
                  </span>
                  <span className={`font-display font-extrabold uppercase text-[18px] leading-[0.95] line-clamp-2 min-h-[34px] ${status.defeated ? 'text-earned-soft' : status.sealed ? 'text-fg-3' : 'text-fg'}`}>
                    {status.boss.name.replace(/^The /, '')}
                  </span>
                  <span className="mt-auto">
                    {status.defeated ? (
                      <span className="eyebrow text-earned">Slain</span>
                    ) : status.sealed ? (
                      <span className="text-[12px] font-medium leading-snug text-fg-3 line-clamp-2">{sealedLine(status.sealedBy)}</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Meter value={hp / 1000} tone="boss" className="h-1.5" />
                        <span className="num font-bold text-[13px] text-boss-soft min-w-[34px] text-right">{Math.round(hp / 10)}%</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="lg:sticky lg:top-6">{children}</div>
      </div>
    </main>
  );
}
