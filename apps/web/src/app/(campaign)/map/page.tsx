'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crown, Scale } from 'lucide-react';
import { ScreenHeader } from '../../../components/game/AppShell';
import { useGame } from '../../../components/game/GameProvider';
import { Chip, Meter, Stepper } from '../../../components/game/kit';
import { ActNode, ActStatus } from '../../../utils/protocolEngine';

/**
 * The campaign as one climb: act I at the bottom, the last act at the summit.
 * Cleared ground is gold, your pin sits on the next goal, and acts you have
 * not reached yet wait in the fog. Tap any waypoint for what it asks.
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
  const cyan = pinIndex > 0 ? pathThrough(layout.nodes.slice(pinIndex - 1, pinIndex + 1)) : '';

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
        right={current && <Chip tone="act">ACT {current.numeral}</Chip>}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="lg:order-2 flex flex-col gap-4">
          <section className="flex flex-col gap-3 p-4 rounded-[20px] bg-ink-900 border border-ink-700" aria-label="Bodyweight">
            <div className="flex items-center gap-2">
              <Scale className="w-[18px] h-[18px] text-earned" />
              <h2 className="flex-1 font-display font-bold text-base">Weigh-in</h2>
              <Chip tone={mass.onPace ? 'earned' : 'boss'}>{mass.onPace ? 'On pace' : `${mass.shortKg.toFixed(1)} kg short`}</Chip>
            </div>
            <div className="flex items-center gap-3">
              <Stepper value={save.bodyWeightKg} step={0.1} min={30} max={250} unit="kg" ariaLabel="Today's bodyweight" onCommit={weighIn} />
              <span className="flex-1 flex flex-col gap-1.5">
                <Meter value={mass.finalProgress} tone="earned" label="Progress to goal weight" />
                <span className="flex justify-between font-display font-bold text-xs text-fg-4">
                  <span>{mass.start} kg</span>
                  <span className="text-earned">{plan.bodyweight.goal} kg</span>
                </span>
              </span>
            </div>
            {mass.next && (
              <p className="text-xs text-fg-4">
                Next: <span className="font-display font-bold text-fg-2">{mass.next.label}</span> · {mass.next.kg.toFixed(1)} kg
              </p>
            )}
          </section>
          {current && (
            <section className="hidden lg:flex flex-col gap-2 p-4 rounded-[20px] bg-[#08111a] border border-[#143042]">
              <span className="font-display font-bold text-[13px] text-act">
                ACT {current.numeral} · {Math.round(current.progress * 100)}%
              </span>
              <h2 className="font-display font-bold text-lg">{current.name}</h2>
              <p className="text-xs text-fg-4">{current.tagline}</p>
            </section>
          )}
        </div>

        <div className="relative mx-auto rounded-3xl overflow-hidden border border-ink-750 bg-[#070910]" style={{ width: W, height: layout.height }}>
          <div className="absolute inset-0 dot-grid opacity-70" />
          <svg width={W} height={layout.height} viewBox={`0 0 ${W} ${layout.height}`} aria-hidden="true" className="absolute inset-0">
            <path d={all} fill="none" stroke="#10141f" strokeWidth="22" strokeLinecap="round" />
            <path d={all} fill="none" stroke="#1b2131" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
            {gold && <path d={gold} fill="none" stroke="#ffc247" strokeOpacity=".18" strokeWidth="20" strokeLinecap="round" />}
            {gold && <path d={gold} fill="none" stroke="#ffc247" strokeWidth="5" strokeLinecap="round" />}
            {cyan && <path d={cyan} fill="none" stroke="#3ee8ff" strokeWidth="4.5" strokeLinecap="round" className="anim-flow" />}
          </svg>

          {layout.banners.map(({ act, y }) => (
            <div
              key={act.id}
              className={`absolute left-3 right-3 h-[52px] rounded-2xl border flex items-center gap-3 px-3.5 ${
                act.complete ? 'bg-[rgba(26,19,8,.94)] border-[#5c4a22]' : act.current ? 'bg-[rgba(8,22,29,.94)] border-[#17566a]' : 'bg-[rgba(18,12,29,.9)] border-[#3d2a63]'
              }`}
              style={{ top: y - 26 }}
            >
              <span className={`w-9 font-display font-bold text-xl ${act.complete ? 'text-earned' : act.current ? 'text-act' : 'text-aura-soft'}`}>{act.numeral}</span>
              <span className="flex-1 min-w-0 font-display font-bold text-[15px] truncate">{act.name}</span>
              <span
                className={`h-[26px] px-2.5 rounded-full font-display font-bold text-xs leading-[26px] ${
                  act.complete ? 'bg-earned text-earned-deep' : act.current ? 'bg-act text-act-deep' : 'bg-[#2a1d47] text-aura-soft'
                }`}
              >
                {act.complete ? 'CLEARED' : act.current ? `${Math.round(act.progress * 100)}%` : 'FOG'}
              </span>
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
                  className={`absolute w-[46px] h-[46px] rounded-full border-2 flex items-center justify-center transition active:scale-90 cursor-pointer ${
                    node.done
                      ? 'bg-[#1a1308] border-earned shadow-[0_0_18px_rgba(255,194,71,0.35)]'
                      : future
                        ? 'bg-[#120c1d] border-[#3d2a63]'
                        : 'bg-[#08161d] border-act'
                  } ${openId === node.id ? 'outline-2 outline-offset-2 outline-white' : ''}`}
                  style={{ left: x - 23, top: y - 23 }}
                >
                  {node.done ? (
                    <Check className="w-5 h-5 text-earned" strokeWidth={3} />
                  ) : placed.index === layout.nodes.length - 1 ? (
                    <Crown className={`w-5 h-5 ${future ? 'text-aura-soft' : 'text-act'}`} />
                  ) : (
                    <span className={`w-2.5 h-2.5 rounded-full ${future ? 'bg-aura/60' : 'bg-act'}`} />
                  )}
                </button>
                <span
                  className={`absolute w-[120px] font-display font-bold text-[13px] leading-tight line-clamp-2 pointer-events-none ${
                    node.done ? 'text-earned-soft' : future ? 'text-[#8a7aa8]' : 'text-[#c9f6ff]'
                  } ${centre ? 'text-center' : right ? 'text-right' : 'text-left'}`}
                  style={centre ? { left: x - 60, top: y + 27 } : right ? { left: x - 23 - 128, top: y - 10 } : { left: x + 23 + 8, top: y - 10 }}
                >
                  {node.label}
                </span>
                {isPin && (
                  <div ref={pinRef} className="absolute" style={{ left: x, top: y - 26 }}>
                    <div className="absolute -left-[22px] -top-[34px] anim-breathe flex flex-col items-center">
                      <span className="hex-clip w-11 h-12 bg-act flex items-center justify-center">
                        <span className="hex-clip w-[38px] h-[42px] bg-ink-950 flex items-center justify-center font-display font-bold text-[17px] text-act">
                          {derived.level.level}
                        </span>
                      </span>
                      <span className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-8 border-l-transparent border-r-transparent border-t-act" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {fogUntil > 0 && (
            <div
              className="absolute inset-x-0 top-0 pointer-events-none"
              style={{ height: fogUntil, background: 'linear-gradient(180deg, rgba(6,7,11,.72) 0%, rgba(6,7,11,.5) 70%, rgba(6,7,11,0) 100%)' }}
            >
              <div className="absolute -left-14 top-[30%] w-[300px] h-[120px] rounded-full anim-drift" style={{ background: 'radial-gradient(ellipse, rgba(140,150,190,.14), transparent 70%)' }} />
              <div className="absolute left-36 top-[55%] w-[300px] h-[140px] rounded-full anim-drift" style={{ background: 'radial-gradient(ellipse, rgba(167,123,255,.12), transparent 70%)', animationDirection: 'alternate-reverse' }} />
            </div>
          )}

          {open && (
            <div
              role="status"
              className="absolute z-10 w-[220px] p-3 rounded-2xl bg-[#0e1220] border-[1.5px] shadow-[0_14px_30px_rgba(0,0,0,0.6)] anim-fade"
              style={{
                left: Math.max(10, Math.min(W - 230, open.x - 110)),
                top: Math.max(8, open.y - 23 - 96),
                borderColor: open.node.done ? '#ffc247' : '#3ee8ff',
              }}
            >
              <p className="text-[13px] font-semibold text-fg-2">{open.node.label}</p>
              <p className={`font-display font-bold text-base ${open.node.done ? 'text-earned' : 'text-act'}`}>{open.node.detail}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
