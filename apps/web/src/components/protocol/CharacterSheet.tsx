'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Calculator, Hexagon, Info, Lock, Sparkles } from 'lucide-react';
import { ATTRIBUTE_MAX, AttributeStatus } from '../../utils/attributes';
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

/** The number shown for an attribute: its real unit where it has one (66 kg), a dash until it can be measured. */
const shownValue = (attribute: AttributeStatus) =>
  attribute.display ?? (attribute.value === null ? '–' : String(attribute.value));

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
  const valuePoints = shown.map((attribute, index) =>
    point(index, count, Math.max(0.04, (attribute.value ?? 0) / ATTRIBUTE_MAX)),
  );

  return (
    <Panel className="p-4 sm:p-6">
      <PanelHead
        icon={<Hexagon className="w-4 h-4" />}
        title="Character"
        subtitle={`Every attribute is scored out of ${ATTRIBUTE_MAX}, read from the numbers on your account. Open any attribute to see exactly how its score is worked out. Hidden attributes join the web as you hit milestones.`}
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
              .map((attribute) => `${attribute.def.name} ${attribute.display ?? attribute.value ?? 'not measured yet'}`)
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

            {/* Scale, up the first axis: a quarter, half, three quarters and the 999 cap. */}
            {count > 0 &&
              RINGS.map((ring) => (
                <text
                  key={`scale_${ring}`}
                  x={CENTER + 5}
                  y={CENTER - RADIUS * ring + 4}
                  fontSize={font * 0.62}
                  fill="#64748b"
                  fontFamily="ui-monospace, monospace"
                  aria-hidden
                >
                  {ring === 1 ? ATTRIBUTE_MAX : Math.round(ring * 1000)}
                </text>
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
              <span className="text-slate-600"> / {ATTRIBUTE_MAX}</span>
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
          <details className="p-3 rounded-xl border border-slate-800 bg-dark-950/60">
            <summary className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer select-none">
              <Info className="w-4 h-4 text-neon-cyan shrink-0" />
              How scores work
            </summary>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-400 leading-relaxed list-disc pl-4">
              <li>
                Every attribute is scored out of <strong className="text-slate-200">{ATTRIBUTE_MAX}</strong>: a share of the way
                to the top, times {ATTRIBUTE_MAX}.
              </li>
              <li>
                <strong className="text-slate-200">Strength</strong> (Push, Pull, Legs, Endurance, Straight-Arm, Balance, Power): each
                linked lift&apos;s current number divided by its end-game number, averaged. Lifts you haven&apos;t logged are left out,
                so logging one never lowers the score.
              </li>
              <li>
                <strong className="text-slate-200">Conditioning</strong> (Core, Compression, Grip, Tendons): sessions ticked, up to 12 for
                each exercise that builds it. Tendons also count weeks with every armor piece forged.
              </li>
              <li>
                <strong className="text-slate-200">Lean Mass</strong>: your bodyweight against your goal weight.
              </li>
              <li>Which exercises build which attribute is set in the Plan tab.</li>
            </ul>
          </details>

          <ul className="space-y-2">
            {shown.map((attribute) => {
              const focused = focusId === attribute.def.id;
              return (
                <li
                  key={attribute.def.id}
                  onMouseEnter={() => setFocusId(attribute.def.id)}
                  onMouseLeave={() => setFocusId(null)}
                  className={`p-3 rounded-xl border transition ${
                    attribute.def.secret
                      ? 'bg-amber-950/25 border-amber-500/40'
                      : focused
                        ? 'bg-dark-800 border-slate-500'
                        : 'bg-dark-950/60 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFocusId(focused ? null : attribute.def.id)}
                    aria-pressed={focused}
                    aria-label={`Highlight ${attribute.def.name} on the web`}
                    className="w-full text-left cursor-pointer"
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
                      <span className={`font-mono font-black shrink-0 ${attribute.value === null ? 'text-slate-500' : 'text-white'}`}>
                        {shownValue(attribute)}
                        {attribute.value !== null && !attribute.display && (
                          <span className="text-[10px] font-bold text-slate-500"> / {ATTRIBUTE_MAX}</span>
                        )}
                      </span>
                    </span>
                    <MeterBar
                      value={(attribute.value ?? 0) / ATTRIBUTE_MAX}
                      theme={attribute.def.secret ? 'gold' : attribute.def.unlock ? 'core' : 'push'}
                      size="sm"
                      label={
                        attribute.value === null
                          ? `${attribute.def.name} not measured yet`
                          : `${attribute.def.name} ${attribute.value} of ${ATTRIBUTE_MAX}`
                      }
                    />
                  </button>

                  {attribute.explain && <p className="mt-2 text-[11px] font-semibold text-slate-300">{attribute.explain}</p>}
                  {attribute.value === null && attribute.measure && (
                    <p className="mt-2 text-[11px] font-semibold text-amber-300/90">Not measured yet — {attribute.measure}</p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">{attribute.def.blurb}</p>

                  {attribute.parts.length > 0 && (
                    <details className="mt-2 group">
                      <summary className="flex items-center gap-1.5 w-fit text-[11px] font-bold text-neon-cyan cursor-pointer select-none hover:underline">
                        <Calculator className="w-3.5 h-3.5" />
                        How it&apos;s calculated
                      </summary>
                      <div className="mt-2 p-2.5 rounded-lg border border-slate-800 bg-dark-900/80 space-y-2">
                        <ul className="space-y-1.5">
                          {attribute.parts.map((part, index) => (
                            <li key={`${part.label}_${index}`} className="text-[11px]">
                              <span className="flex items-baseline justify-between gap-2">
                                <span className={`min-w-0 truncate ${part.share === null ? 'text-slate-500' : 'text-slate-200'}`}>
                                  {part.label}
                                </span>
                                {part.share !== null && (
                                  <span className="font-mono font-bold text-slate-300 shrink-0">{Math.round(part.share * 100)}%</span>
                                )}
                              </span>
                              <span className="block text-[10px] text-slate-500">{part.detail}</span>
                              {part.share !== null && (
                                <span className="block mt-1 h-1 rounded-full bg-dark-950 overflow-hidden" aria-hidden>
                                  <span className="block h-full rounded-full bg-slate-400/70" style={{ width: `${part.share * 100}%` }} />
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        {attribute.formula ? (
                          <p className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-200 break-words">{attribute.formula}</p>
                        ) : (
                          <p className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">Nothing measured yet, so there is no score.</p>
                        )}
                      </div>
                    </details>
                  )}

                  {attribute.builtBy.length > 0 && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Built by {attribute.builtBy.join(', ')}
                      {attribute.sessions > 0 && (
                        <span className="text-slate-400">
                          {' '}
                          · {attribute.sessions} {attribute.sessions === 1 ? 'session' : 'sessions'} logged
                        </span>
                      )}
                    </p>
                  )}
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
                      <span className="block text-[11px] text-slate-500">Unlocks: {attribute.unlockLabel}</span>
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
