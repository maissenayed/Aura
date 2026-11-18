'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Castle, Flag, Medal, Scale, Star } from 'lucide-react';
import { ScreenHeader } from '../../../components/game/AppShell';
import { useGame } from '../../../components/game/GameProvider';
import { ArrowRightIcon, BossIcon, CheckIcon, CrownIcon, LockIcon, PlateIcon } from '../../../components/game/icons';
import { Chip, HexLevel, Meter, Stepper } from '../../../components/game/kit';
import { ActNode, ActStatus, campaignComplete } from '../../../utils/protocolEngine';

/** Each kind of goal wears its own icon until it is reached. */
const NODE_ICON: Record<ActNode['kind'], React.ComponentType<{ className?: string }>> = {
  weight: Scale,
  lift: PlateIcon,
  boss: BossIcon,
  skill: Medal,
  tower: Castle,
  tier: Star,
  milestone: Flag,
};

/**
 * The campaign as one climb: act I at the bottom, the last act at the summit.
 * Cleared ground is gold and nothing else is, your pin sits on the next goal,
 * and acts you have not reached yet wait under the fog. Tap any waypoint for
 * what it asks.
 */

const W = 340;
const ROW = 92;
const BANNER = 80;
const XS = [84, 256, 170];

interface Placed {
  node: ActNode;
  act: ActStatus;
  x: number;
  y: number;
  index: number;
}

export default function MapPage() {
  const { derived, plan, save, weighIn, currentWeek } = useGame();
  const { acts, mass } = derived;
  const [openId, setOpenId] = useState<string | null>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(() => {
    const totalNodes = acts.reduce((sum, act) => sum + act.nodes.length, 0);
    const height = 60 + acts.length * BANNER + totalNodes * ROW + 40;
    let cursor = height - 50;
    let index = 0;
    const banners: { act: ActStatus; y: number }[] = [];
    const nodes: Placed[] = [];
    for (const act of acts) {
      banners.push({ act, y: cursor - BANNER / 2 + 6 });
      cursor -= BANNER;
      for (const node of act.nodes) {
        nodes.push({ node, act, x: XS[index % XS.length], y: cursor - ROW / 2, index });
        cursor -= ROW;
        index += 1;
      }
    }
    return { height, banners, nodes };
  }, [acts]);

  const pinIndex = layout.nodes.findIndex((placed) => !placed.node.done);
  const pin = pinIndex >= 0 ? layout.nodes[pinIndex] : layout.nodes[layout.nodes.length - 1];
  const currentActIndex = acts.findIndex((act) => act.current);
  const fogUntil = (() => {
    const next = layout.banners[currentActIndex + 1];
    return next ? next.y + BANNER / 2 : 0;
  })();

  const pathThrough = (points: { x: number; y: number }[]) =>
    points.reduce((d, p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const prev = points[i - 1];
      const ym = (prev.y + p.y) / 2;
      return `${d} C${prev.x} ${ym} ${p.x} ${ym} ${p.x} ${p.y}`;
    }, '');
  const all = pathThrough(layout.nodes);
  const gold = pathThrough(layout.nodes.slice(0, Math.max(0, pinIndex === -1 ? layout.nodes.length : pinIndex)));
  const ahead = pinIndex > 0 ? pathThrough(layout.nodes.slice(pinIndex - 1, pinIndex + 1)) : '';

  useEffect(() => {
    pinRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  const current = acts[currentActIndex] ?? acts[acts.length - 1];
  const open = layout.nodes.find((placed) => placed.node.id === openId);

  return (
    <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-5">
      <ScreenHeader
        back={{ href: '/camp', label: 'Back to camp' }}
        title="Campaign"
        eyebrow={`Week ${currentWeek}`}
        right={campaignComplete(acts) ? <Chip tone="earned">COMPLETE</Chip> : current && <Chip tone="act">ACT {current.numeral}</Chip>}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="lg:order-2 flex flex-col gap-4">
          <section className="flex flex-col gap-3 p-4 rounded-card bg-ink-900" aria-label="Bodyweight">
            <div className="flex items-center gap-2">
              <Scale className="w-[18px] h-[18px] text-fg-3" />
              <h2 className="flex-1 font-display font-extrabold uppercase text-[22px] leading-none">Weigh-in</h2>
              <Chip tone={mass.onPace ? 'earned' : 'act'}>{mass.onPace ? 'On pace' : `${mass.shortKg.toFixed(1)} kg short`}</Chip>
            </div>
            <div className="flex items-center gap-3">
              <Stepper value={save.bodyWeightKg} step={0.1} min={30} max={250} unit="kg" ariaLabel="Today's bodyweight" onCommit={weighIn} />
              <span className="flex-1 flex flex-col gap-1.5">
                <Meter value={mass.finalProgress} tone="act" label="Progress to goal weight" />
                <span className="flex justify-between num font-bold text-[12px] text-fg-4">
                  <span>{mass.start} kg</span>
                  <span className="text-fg-2">{plan.bodyweight.goal} kg</span>
                </span>
              </span>
            </div>
            {mass.next && (
              <p className="text-[13px] text-fg-4">
                Next: <span className="font-semibold text-fg-2">{mass.next.label}</span> · <span className="num font-bold">{mass.next.kg.toFixed(1)} kg</span>
              </p>
            )}
          </section>
          {current && (
            <section className="hidden lg:flex flex-col gap-2 p-4 rounded-card bg-ink-900">
              <span className="eyebrow text-fg-4">
                Act {current.numeral} · {Math.round(current.progress * 100)}%
              </span>
              <h2 className="font-display font-extrabold uppercase text-[26px] leading-[0.95]">{current.name}</h2>
              <p className="text-[13px] text-fg-3">{current.tagline}</p>
            </section>
          )}
        </div>

        <div className="relative mx-auto rounded-card overflow-hidden bg-ink-900" style={{ width: W, height: layout.height }}>
          <div className="absolute inset-0 dot-grid" />
          {/* The road is cut into the iron; only the ground already cleared is gold, the next stretch is chalk. */}
          <svg width={W} height={layout.height} viewBox={`0 0 ${W} ${layout.height}`} aria-hidden="true" className="absolute inset-0">
            <path d={all} fill="none" strokeWidth="22" strokeLinecap="round" style={{ stroke: 'var(--color-ink-950)' }} />
            <path d={all} fill="none" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" style={{ stroke: 'var(--color-ink-600)' }} />
            {gold && <path d={gold} fill="none" strokeWidth="5" strokeLinecap="round" style={{ stroke: 'var(--color-earned)' }} />}
            {ahead && <path d={ahead} fill="none" strokeWidth="4" strokeDasharray="8 7" strokeLinecap="round" style={{ stroke: 'var(--color-progress)' }} />}
          </svg>

          {layout.banners.map(({ act, y }) => (
            <div
              key={act.id}
              className={`absolute left-3 right-3 h-[52px] rounded-card flex items-center gap-3 px-3.5 ${
                act.complete ? 'bg-earned-deep' : act.current ? 'bg-ink-800 raised' : 'bg-ink-850'
              }`}
              style={{ top: y - 26 }}
            >
              <span className={`min-w-9 shrink-0 font-display font-extrabold text-[26px] leading-none ${act.complete ? 'text-earned' : act.current ? 'text-fg' : 'text-fg-5'}`}>
                {act.numeral}
              </span>
              <span
                className={`flex-1 min-w-0 font-display font-extrabold uppercase text-[22px] leading-none truncate ${
                  act.complete ? 'text-earned-soft' : act.current ? 'text-fg' : 'text-fg-4'
                }`}
              >
                {act.name}
              </span>
              {act.complete ? (
                <span className="eyebrow shrink-0 flex items-center gap-1 text-earned">
                  <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />
                  Cleared
                </span>
              ) : act.current ? (
                <span className="shrink-0 num font-bold text-[18px] leading-none text-fg">{Math.round(act.progress * 100)}%</span>
              ) : (
                <span className="eyebrow shrink-0 flex items-center gap-1 text-fg-5">
                  <LockIcon className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Fog
                </span>
              )}
            </div>
          ))}

          {layout.nodes.map((placed) => {
            const { node, x, y } = placed;
            const isPin = placed === pin && !node.done;
            const future = !node.done && !placed.act.current && !placed.act.complete;
            const right = x > W / 2 + 10;
            const centre = Math.abs(x - W / 2) <= 10;
            return (
              <div key={node.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === node.id ? null : node.id)}
                  aria-expanded={openId === node.id}
                  aria-label={`${node.label}${node.done ? ', cleared' : ''}`}
                  className={`absolute w-[46px] h-[46px] rounded-full border-2 flex items-center justify-center transition active:scale-[.97] cursor-pointer ${
                    node.done ? 'bg-earned-deep border-earned' : future ? 'bg-ink-950 border-dashed border-ink-500' : 'bg-ink-900 border-act'
                  } ${isPin ? 'anim-ready' : ''} ${openId === node.id ? 'outline-2 outline-offset-2 outline-act' : ''}`}
                  style={{ left: x - 23, top: y - 23 }}
                >
                  {node.done ? (
                    <CheckIcon className="w-5 h-5 text-earned" strokeWidth={3} />
                  ) : (
                    (() => {
                      const Icon = NODE_ICON[node.kind] ?? CrownIcon;
                      return <Icon className={`w-[18px] h-[18px] ${future ? 'text-fg-5' : 'text-fg'}`} />;
                    })()
                  )}
                </button>
                <span
                  className={`absolute w-[120px] text-[13px] font-semibold leading-tight line-clamp-2 pointer-events-none ${
                    node.done ? 'text-earned-soft' : future ? 'text-fg-5' : 'text-fg'
                  } ${centre ? 'text-center' : right ? 'text-right' : 'text-left'}`}
                  style={centre ? { left: x - 60, top: y + 27 } : right ? { left: x - 23 - 128, top: y - 10 } : { left: x + 23 + 8, top: y - 10 }}
                >
                  {node.label}
                </span>
                {isPin && (
                  <div ref={pinRef} className="absolute" style={{ left: x, top: y - 26 }}>
                    <div className="absolute -left-[19px] -top-[39px] flex flex-col items-center">
                      <div className="rounded-full bg-ink-950">
                        <HexLevel level={derived.level.level} size="sm" progress={derived.level.xpIntoLevel / derived.level.xpForLevel} />
                      </div>
                      <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-8 border-l-transparent border-r-transparent border-t-act" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {fogUntil > 0 && (
            <div className="absolute inset-x-0 top-0 pointer-events-none bg-ink-950/70 border-b border-ink-700" style={{ height: fogUntil }} />
          )}

          {open && (
            <div
              role="status"
              className={`absolute z-10 w-[220px] p-3 rounded-card raised lift-shadow anim-fade ${open.node.done ? 'bg-earned-deep' : 'bg-ink-800'}`}
              style={{
                left: Math.max(10, Math.min(W - 230, open.x - 110)),
                top: Math.max(8, open.y - 23 - (open.node.href ? 170 : open.node.done ? 96 : 110)),
              }}
            >
              <p className="text-[13px] font-semibold text-fg-2">{open.node.label}</p>
              <p className={`mt-1 font-display font-extrabold uppercase text-[22px] leading-[0.95] ${open.node.done ? 'text-earned' : 'text-fg'}`}>{open.node.detail}</p>
              {!open.node.done && <Meter value={open.node.progress} tone="act" className="h-1.5 mt-2" label={`${Math.round(open.node.progress * 100)}% of the way`} />}
              {open.node.href && (
                <Link
                  href={open.node.href}
                  className={`mt-3 w-full h-12 rounded-card font-display font-extrabold uppercase text-lg tracking-[0.02em] flex items-center justify-center gap-1.5 active:scale-[.97] transition ${
                    open.node.kind === 'boss' ? 'bg-boss text-ink-950' : 'bg-act text-act-deep'
                  }`}
                >
                  {open.node.kind === 'boss' ? 'Fight' : open.node.kind === 'tower' || open.node.kind === 'skill' ? 'Climb' : 'Log it'}
                  <ArrowRightIcon className="w-[18px] h-[18px]" strokeWidth={2.4} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
