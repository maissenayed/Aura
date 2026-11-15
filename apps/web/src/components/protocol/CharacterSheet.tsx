'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Hexagon, Lock, Sparkles } from 'lucide-react';
import { AttributeStatus } from '../../utils/attributes';
import { MeterBar, Panel, PanelHead, Tally } from './primitives';

/* Geometry of the web, in SVG units. */
const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 128;
/**
 * Extra room around the web so side labels are never clipped. On a phone the
 * whole drawing is scaled down hard, so labels get a larger font (in drawing
 * units) and the margins grow to fit them.
 */
const LAYOUT = {
  // Two-line labels (name above value) sit close to the web.
  wide: { padX: 84, padY: 28, font: 13, gap: 24, twoLine: true },
  // On phones each label is one line, further out, so neighbours near the bottom cannot stack.
  compact: { padX: 136, padY: 44, font: 22, gap: 34, twoLine: false },
};

const PHONE_QUERY = '(max-width: 639px)';
const subscribePhone = (onChange: () => void) => {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const useCompact = () =>
  useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
const RINGS = [0.25, 0.5, 0.75, 1];

const COLOUR = {
  base: '#00f0ff',
  earned: '#d946ef',
  secret: '#f59e0b',
  grid: '#1e293b',
  gridOuter: '#334155',
  unmeasured: '#64748b',
};

const colourOf = (attribute: AttributeStatus) =>
  attribute.value === null
    ? COLOUR.unmeasured
    : attribute.def.secret
      ? COLOUR.secret
      : attribute.def.unlock
        ? COLOUR.earned
        : COLOUR.base;

/** The number shown for an attribute: a dash until something it is built from has been logged. */
const shownValue = (attribute: AttributeStatus) => (attribute.value === null ? '–' : String(attribute.value));

/** Point on the web for axis `index` of `count`, at `fraction` of the radius. Axis 0 points straight up. */
function point(index: number, count: number, fraction: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return { x: CENTER + Math.cos(angle) * RADIUS * fraction, y: CENTER + Math.sin(angle) * RADIUS * fraction, angle };
}

const polygon = (points: { x: number; y: number }[]) => points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

interface CharacterSheetProps {
  attributes: AttributeStatus[];
  level: number;
  rank: string;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ attributes, level, rank }) => {
  const [focusId, setFocusId] = useState<string | null>(null);
  const { padX, padY, font, gap, twoLine } = LAYOUT[useCompact() ? 'compact' : 'wide'];

  const shown = attributes.filter((attribute) => attribute.unlocked);
  // Hidden attributes are teased by their milestone — except the secret one, which stays a surprise.
  const hidden = attributes.filter((attribute) => !attribute.unlocked && !attribute.def.secret);
  const total = attributes.filter((attribute) => !attribute.def.secret || attribute.unlocked).length;
  // Only what has been measured counts towards the average, so an unlogged lift never drags it down.
  const measured = shown.filter((attribute) => attribute.value !== null).map((attribute) => attribute.value ?? 0);
  const average = measured.length ? Math.round(measured.reduce((sum, value) => sum + value, 0) / measured.length) : null;
  const unmeasured = shown.length - measured.length;

  const count = shown.length;
  // A value of 0 (or one not measured yet) still draws a sliver, so the shape never collapses to a dot.
  const valuePoints = shown.map((attribute, index) => point(index, count, Math.max(0.04, (attribute.value ?? 0) / 100)));

  return (
    <Panel className="p-4 sm:p-6">
      <PanelHead
        icon={<Hexagon className="w-4 h-4" />}
        title="Character"
        subtitle="Read from the numbers on your account: your current lifts against the end-game targets, your bodyweight and the missions you tick. Hidden attributes join the web as you hit milestones."
        right={<Tally icon={<Sparkles className="w-4 h-4 text-neon-purple" />} value={`${shown.length} / ${total}`} label="attributes" />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
        {/* The web */}
        <figure className="relative">
          <svg
            viewBox={`${-padX} ${-padY} ${SIZE + padX * 2} ${SIZE + padY * 2}`}
            className="w-full max-w-[540px] mx-auto block"
            role="img"
            aria-label={`Attribute web: ${shown
              .map((attribute) => `${attribute.def.name} ${attribute.value ?? 'not measured yet'}`)
              .join(', ')}`}
          >
            <defs>
              <radialGradient id="character-fill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#d946ef" stopOpacity="0.28" />
              </radialGradient>
            </defs>

            {RINGS.map((ring) => (
              <polygon
                key={ring}
                points={polygon(shown.map((_, index) => point(index, count, ring)))}
                fill="none"
                stroke={ring === 1 ? COLOUR.gridOuter : COLOUR.grid}
                strokeWidth={ring === 1 ? 1.5 : 1}
              />
            ))}

            {shown.map((attribute, index) => {
              const end = point(index, count, 1);
              const focused = focusId === attribute.def.id;
              return (
                <line
                  key={attribute.def.id}
                  x1={CENTER}
                  y1={CENTER}
                  x2={end.x}
                  y2={end.y}
                  stroke={focused ? colourOf(attribute) : COLOUR.grid}
                  strokeWidth={focused ? 2 : 1}
                />
              );
            })}

            <polygon points={polygon(valuePoints)} fill="url(#character-fill)" stroke="#00f0ff" strokeWidth={2} strokeLinejoin="round" />

            {shown.map((attribute, index) => {
              const at = valuePoints[index];
              const label = point(index, count, (RADIUS + gap) / RADIUS);
              const cos = Math.cos(label.angle);
              // Only labels pointing (nearly) straight up or down are centred; the rest lean
              // away from the web, so neighbours at the bottom never collide.
              const anchor = cos > 0.08 ? 'start' : cos < -0.08 ? 'end' : 'middle';
              const sin = Math.sin(label.angle);
              // Two lines (name, value): lift labels above the web, drop those below it.
              const shiftY = twoLine
                ? sin < -0.5 ? -font * 1.1 : sin > 0.5 ? font * 0.9 : -font * 0.15
                : sin < -0.5 ? -font * 0.2 : sin > 0.5 ? font * 0.8 : font * 0.35;
              const focused = focusId === attribute.def.id;

              return (
                <g
                  key={attribute.def.id}
                  onMouseEnter={() => setFocusId(attribute.def.id)}
                  onMouseLeave={() => setFocusId(null)}
                  className="cursor-default"
                >
                  <circle cx={at.x} cy={at.y} r={focused ? 6 : 4.5} fill={colourOf(attribute)} stroke="#06070a" strokeWidth={2} />
                  <text
                    x={label.x}
                    y={label.y + shiftY}
                    textAnchor={anchor}
                    className="font-sans"
                    fill={focused ? '#ffffff' : '#cbd5e1'}
                    fontSize={font}
                    fontWeight={700}
                  >
                    {attribute.def.short}
                    <tspan {...(twoLine ? { x: label.x, dy: '1.15em' } : { dx: 6 })} fill={colourOf(attribute)} fontFamily="ui-monospace, monospace" fontWeight={800}>
                      {shownValue(attribute)}
                    </tspan>
                  </text>
                </g>
              );
            })}
          </svg>

          <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
            <span>
              Level <strong className="font-mono text-white">{level}</strong> · {rank}
            </span>
            <span>
              Average <strong className="font-mono text-white">{average ?? '–'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neon-cyan" /> Core attribute
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neon-purple" /> Unlocked
            </span>
            {unmeasured > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> Not measured yet
              </span>
            )}
          </figcaption>
        </figure>

        {/* The numbers */}
        <div className="space-y-5">
          <ul className="space-y-2">
            {shown.map((attribute) => {
              const focused = focusId === attribute.def.id;
              return (
                <li key={attribute.def.id}>
                  <button
                    type="button"
                    onClick={() => setFocusId(focused ? null : attribute.def.id)}
                    onMouseEnter={() => setFocusId(attribute.def.id)}
                    onMouseLeave={() => setFocusId(null)}
                    aria-pressed={focused}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                      attribute.def.secret
                        ? 'bg-amber-950/25 border-amber-500/40'
                        : focused
                          ? 'bg-dark-800 border-slate-500'
                          : 'bg-dark-950/60 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colourOf(attribute) }} />
                        <span className="text-sm font-bold text-white truncate">{attribute.def.name}</span>
                        {attribute.def.secret && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-black uppercase tracking-wider text-neon-gold border-amber-400/50">
                            Secret
                          </span>
                        )}
                      </span>
                      <span className={`font-mono font-black ${attribute.value === null ? 'text-slate-500' : 'text-white'}`}>
                        {shownValue(attribute)}
                      </span>
                    </span>
                    <MeterBar
                      value={(attribute.value ?? 0) / 100}
                      theme={attribute.def.secret ? 'gold' : attribute.def.unlock ? 'core' : 'push'}
                      size="sm"
                      label={
                        attribute.value === null
                          ? `${attribute.def.name} not measured yet`
                          : `${attribute.def.name} ${attribute.value} of 100`
                      }
                    />
                    {attribute.value === null && attribute.def.measure && (
                      <span className="block mt-2 text-[11px] font-semibold text-amber-300/90">
                        Not measured yet — {attribute.def.measure}
                      </span>
                    )}
                    <span className="block mt-2 text-[11px] text-slate-400 leading-relaxed">{attribute.def.blurb}</span>
                    {attribute.builtBy.length > 0 && (
                      <span className="block mt-1 text-[11px] text-slate-500">
                        Built by {attribute.builtBy.join(', ')}
                        {attribute.sessions > 0 && (
                          <span className="text-slate-400">
                            {' '}
                            · {attribute.sessions} {attribute.sessions === 1 ? 'session' : 'sessions'} logged
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {hidden.length > 0 && (
            <section aria-labelledby="hidden-attributes">
              <h3 id="hidden-attributes" className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Still hidden ({hidden.length})
              </h3>
              <ul className="space-y-1.5">
                {hidden.map((attribute) => (
                  <li
                    key={attribute.def.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-950/40 border border-dashed border-slate-800"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-dark-900 border border-slate-700 text-slate-500 shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-300">{attribute.def.name}</span>
                      <span className="block text-[11px] text-slate-500">Unlocks: {attribute.def.unlock?.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Panel>
  );
};
