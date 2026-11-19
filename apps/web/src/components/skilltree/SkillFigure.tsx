import React, { useId, useSyncExternalStore } from 'react';
import type { PropTuning } from '../game/propTuning';
import { usePropTuning } from '../game/propTuningContext';

/**
 * Draws one skill illustration in chalk on iron: a figure on a wall,
 * a bar or the floor, or a hand close up. The drawing is plain data — see
 * `figureKit.ts` and the per-tree figure files — so a figure stays a few lines
 * of numbers instead of a hand-made SVG per skill. A figure with `motion`
 * moves between its two poses on a loop.
 *
 * Everything lives in a 100 × 100 box.
 */

export type Pt = readonly [number, number];

/**
 * body: the figure · focus: the part the skill is about · ghost: where it was a
 * moment ago · gear: cables, bars and handles, drawn behind the figure.
 */
export type Tone = 'body' | 'focus' | 'ghost' | 'gear';

export interface Stroke {
  pts: Pt[];
  width: number;
  tone: Tone;
  /** Closed and filled, for the torso and palms. */
  closed?: boolean;
  /** On the far side of the body: drawn first and darker, so the figure reads in depth. */
  far?: boolean;
}

export interface Disc {
  at: Pt;
  r: number;
  tone: Tone;
  /** plate: a weight plate or dumbbell end · ring: a gymnastic ring. Both are drawn in front of the figure. */
  kind?: 'plate' | 'ring';
}

export type HoldShape = 'jug' | 'edge' | 'sloper' | 'pinch' | 'pocket' | 'foot' | 'volume' | 'rung' | 'bar';

export interface Hold {
  at: Pt;
  shape: HoldShape;
  /** The hold the skill is about, drawn in the accent colour. */
  key?: boolean;
  size?: number;
  rotate?: number;
}

export interface Arrow {
  /** SVG path data. */
  d: string;
  /** move: where the body or a limb travels · force: a push or pull · guide: a line to read, no head. */
  kind?: 'move' | 'force' | 'guide';
}

export type Scene =
  | 'slab'
  | 'vertical'
  | 'overhang'
  | 'roof'
  | 'board'
  | 'ground'
  | 'close-up'
  | 'floor'
  | 'bar'
  | 'bars'
  | 'rings';

/**
 * A second pose with exactly the same strokes and discs, in the same order.
 * even: there and back at the same pace · slow-return: a slow way there (an
 * eccentric), then a quick reset.
 */
export interface Motion {
  strokes: Stroke[];
  discs: Disc[];
  seconds: number;
  tempo?: 'even' | 'slow-return';
}

export interface FigureSpec {
  scene: Scene;
  /** Solid rock, floor, bars or board, as SVG path data. */
  wall?: string;
  holds?: Hold[];
  strokes: Stroke[];
  discs?: Disc[];
  arrows?: Arrow[];
  /** Spots worth looking at. */
  rings?: Pt[];
  labels?: { at: Pt; text: string }[];
  motion?: Motion;
}

export const SCENE_LABEL: Record<Scene, string> = {
  slab: 'Slab',
  vertical: 'Vertical wall',
  overhang: 'Overhang',
  roof: 'Roof',
  board: 'Training board',
  ground: 'On the ground',
  'close-up': 'Close-up',
  floor: 'On the floor',
  bar: 'On a bar',
  bars: 'Parallel bars',
  rings: 'On rings',
};

/** Theme colours (CSS variables), so Daylight redraws the same figures in ink on paper. */
const INK = {
  panel: 'var(--fig-panel)',
  frame: 'var(--fig-frame)',
  wall: 'var(--fig-wall)',
  wallEdge: 'var(--fig-wall-edge)',
  hold: 'var(--fig-hold)',
  holdEdge: 'var(--fig-hold-edge)',
  body: 'var(--fig-ready-body)',
  ghost: 'var(--fig-ghost)',
  gear: 'var(--fig-gear)',
  far: 'var(--fig-ready-far)',
  plate: 'var(--fig-plate)',
  arrow: 'var(--fig-arrow)',
  label: 'var(--fig-arrow)',
  shadow: 'var(--fig-shadow)',
};

/** Timing of one loop, as SMIL keyTimes and the matching value order. */
const TEMPO = {
  // there, a short pause, back, a short pause
  even: { keyTimes: '0;0.42;0.5;0.92;1', order: [0, 1, 1, 0, 0] },
  // slowly there, a pause, quickly back
  'slow-return': { keyTimes: '0;0.68;0.78;0.92;1', order: [0, 1, 1, 0, 0] },
} as const;
const EASE = '0.45 0 0.55 1';
const HOLD = '0 0 1 1';

/**
 * How a playing figure moves: the SMIL timing shared by every animated part,
 * and the values for one attribute (the base pose, then the moved pose, in the
 * tempo's order). Anything drawn on the figure with these stays in step with it.
 */
export interface MotionPlay {
  attrs: { dur: string; repeatCount: string; calcMode: 'spline'; keyTimes: string; keySplines: string };
  values: (from: string, to: string) => string;
}

export function motionPlay(motion?: Motion): MotionPlay | null {
  if (!motion) return null;
  const tempo = TEMPO[motion.tempo ?? 'even'];
  return {
    attrs: { dur: `${motion.seconds}s`, repeatCount: 'indefinite', calcMode: 'spline', keyTimes: tempo.keyTimes, keySplines: [EASE, HOLD, EASE, HOLD].join(';') },
    values: (from, to) => tempo.order.map((frame) => (frame === 0 ? from : to)).join(';'),
  };
}

/* Whether the visitor asked for less motion; checked live so a change applies at once. */
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
// Until the browser says otherwise, assume stillness: the server never animates.
const serverReducedMotion = () => true;

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, prefersReducedMotion, serverReducedMotion);
}

interface SkillFigureProps {
  spec: FigureSpec;
  /** The branch colour: the focus part, key holds and rings are drawn in it. */
  accent: string;
  /** Small thumbnail: no background dots or labels, heavier arrows. */
  compact?: boolean;
  /** Draw a rounded panel behind the figure. */
  framed?: boolean;
  /** Play the figure's motion, when it has one. */
  animate?: boolean;
  className?: string;
  /** Spoken description; without one the drawing is treated as decoration. */
  title?: string;
  /** Recolours the athlete — gold once mastered, dim while locked. Defaults to the usual light ink. */
  tint?: { body: string; far: string };
  /** Drawn over the floor and walls, behind the athlete: a stage, poles. */
  underlay?: React.ReactNode;
  /** Drawn in front of the athlete, given the motion's timing (null when still) so it can move with them. */
  overlay?: (play: MotionPlay | null) => React.ReactNode;
  /** Plays even when the visitor asked for less motion: the figure studio's timeline drives it by hand. */
  alwaysAnimate?: boolean;
}

export const SkillFigure: React.FC<SkillFigureProps> = ({
  spec,
  accent,
  compact = false,
  framed = false,
  animate = false,
  className,
  title,
  tint,
  underlay,
  overlay,
  alwaysAnimate = false,
}) => {
  // Marker ids must be unique per drawing, and safe inside url(#…).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const reducedMotion = useReducedMotion() && !alwaysAnimate;
  const t = usePropTuning();
  const arrowHead = `${uid}-arrow`;
  const clip = `${uid}-clip`;
  const body = tint?.body ?? INK.body;
  const farInk = tint?.far ?? INK.far;
  const colourOf = (tone: Tone, far = false) =>
    tone === 'focus' ? accent : tone === 'ghost' ? INK.ghost : tone === 'gear' ? INK.gear : far ? farInk : body;
  // No glow: the working part is pressed harder instead, half a stroke heavier on the large drawing.
  const widthOf = (stroke: Stroke) => (stroke.tone === 'focus' && !stroke.far && !compact ? stroke.width + 0.5 : stroke.width);
  const arrowWidth = compact ? 2.6 : 1.5;

  const motion = animate && !reducedMotion ? spec.motion : undefined;
  const play = motionPlay(motion);
  const loop = (from: string, to: string) => play!.values(from, to);
  const timing = play?.attrs;

  const strokes = spec.strokes.map((stroke, index) => ({ stroke, target: motion?.strokes[index] }));
  const discs = (spec.discs ?? []).map((disc, index) => ({ disc, target: motion?.discs[index] }));
  /** cx and cy animations for a disc that moves with the motion. */
  const follow = (disc: Disc, target?: Disc) =>
    timing &&
    target && (
      <>
        <animate attributeName="cx" values={loop(String(at2(disc.at[0])), String(at2(target.at[0])))} {...timing} />
        <animate attributeName="cy" values={loop(String(at2(disc.at[1])), String(at2(target.at[1])))} {...timing} />
      </>
    );

  /**
   * Back to front: cables, ghosts, the far arm and leg, heads, the near body,
   * then plates and rings held in the hands. Within a layer, shapes keep the
   * order the figure listed them in.
   */
  const isGear = (disc: Disc) => disc.kind === 'plate' || disc.kind === 'ring';
  const layers = [
    { key: 'gear', strokes: strokes.filter(({ stroke }) => stroke.tone === 'gear'), discs: [] },
    {
      key: 'ghost',
      strokes: strokes.filter(({ stroke }) => stroke.tone === 'ghost'),
      discs: discs.filter(({ disc }) => disc.tone === 'ghost' && !isGear(disc)),
    },
    { key: 'far', strokes: strokes.filter(({ stroke }) => stroke.far && stroke.tone !== 'gear' && stroke.tone !== 'ghost'), discs: [] },
    {
      key: 'near',
      strokes: strokes.filter(({ stroke }) => !stroke.far && stroke.tone !== 'gear' && stroke.tone !== 'ghost'),
      discs: discs.filter(({ disc }) => disc.tone !== 'ghost' && !isGear(disc)),
    },
  ];
  const equipment = discs.filter(({ disc }) => isGear(disc));

  // A flat cast shadow where the figure meets the floor, instead of a glow.
  const shadow = (() => {
    if (spec.scene !== 'floor' && spec.scene !== 'ground') return null;
    const pts = spec.strokes.filter((stroke) => stroke.tone !== 'gear' && stroke.tone !== 'ghost').flatMap((stroke) => stroke.pts);
    if (pts.length === 0) return null;
    const floor = Math.max(...pts.map(([, y]) => y));
    const touching = pts.filter(([, y]) => y >= floor - 3).map(([x]) => x);
    const left = Math.min(...touching);
    const right = Math.max(...touching);
    return { cx: at2((left + right) / 2), cy: at2(Math.min(97, floor + 2.2)), rx: at2((right - left) / 2 + 7) };
  })();

  const scenery = splitScenery(spec.wall);
  // A bar seen end-on with nothing else around it runs out to the edge on the side the body leaves free, so it reads as a bar.
  if (spec.scene === 'bar' && !spec.wall?.trim()) {
    const arms = (spec.holds ?? [])
      .filter((hold) => hold.shape === 'bar')
      .map(({ at: [x, y] }) => (barArmSide(spec, x) === 'right' ? `M${x},${y - 1.3} L100,${y - 1.3} L100,${y + 1.3} L${x},${y + 1.3} Z` : `M0,${y - 1.3} L${x},${y - 1.3} L${x},${y + 1.3} L0,${y + 1.3} Z`));
    scenery.rods = [scenery.rods, ...arms].join(' ').trim();
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <marker id={arrowHead} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: INK.arrow }} />
        </marker>
        {/* Rock and floors run to the panel's rounded edge, not past it. */}
        <clipPath id={clip}>
          <rect x="0.5" y="0.5" width="99" height="99" rx={framed ? 10 : 0} />
        </clipPath>
      </defs>

      {framed && <rect x="0.5" y="0.5" width="99" height="99" rx="10" style={{ fill: INK.panel }} />}
      <g clipPath={`url(#${clip})`}>
        {scenery.ground && <path d={scenery.ground} strokeWidth="1.2" strokeLinejoin="round" style={{ fill: INK.wall, stroke: INK.wallEdge }} />}
        {scenery.rods && <path d={scenery.rods} strokeWidth="1.2" strokeLinejoin="round" style={{ fill: INK.hold, stroke: INK.holdEdge }} />}
        {underlay}

        {shadow && <ellipse cx={shadow.cx} cy={shadow.cy} rx={shadow.rx} ry="1.8" opacity="0.85" style={{ fill: INK.shadow }} />}

        {spec.holds?.map((hold, index) => hold.shape !== 'bar' && <HoldMark key={index} hold={hold} accent={accent} t={t} />)}

        {layers.map((layer) => (
          <g key={layer.key} opacity={layer.key === 'ghost' ? 0.55 : undefined}>
            {layer.discs.map(({ disc, target }, index) => (
              <circle
                key={`d${index}`}
                cx={at2(disc.at[0])}
                cy={at2(disc.at[1])}
                r={disc.r}
                strokeWidth={disc.tone === 'ghost' ? 1.2 : 0}
                style={{ fill: disc.tone === 'ghost' ? 'none' : colourOf(disc.tone), stroke: colourOf(disc.tone) }}
              >
                {follow(disc, target)}
              </circle>
            ))}
            {layer.strokes.map(({ stroke, target }, index) => {
              const d = toPath(stroke.pts, stroke.closed);
              const colour = colourOf(stroke.tone, stroke.far);
              return (
                <path
                  key={`s${index}`}
                  d={d}
                  strokeWidth={widthOf(stroke)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={stroke.tone === 'ghost' && !stroke.closed ? '2.4 2.2' : undefined}
                  opacity={stroke.far && stroke.tone === 'focus' ? 0.55 : undefined}
                  style={{ fill: stroke.closed ? colour : 'none', stroke: colour }}
                >
                  {timing && target && <animate attributeName="d" values={loop(d, toPath(target.pts, target.closed))} {...timing} />}
                </path>
              );
            })}
          </g>
        ))}

        {/* A bar seen end-on is gripped: drawn over the hands, like a plate, or the fist would hide it. */}
        {spec.holds?.map(
          (hold, index) =>
            hold.shape === 'bar' && (
              <circle
                key={`bar${index}`}
                cx={hold.at[0]}
                cy={hold.at[1]}
                r={t.bar.r * (hold.size ?? 1)}
                strokeWidth={t.bar.stroke + (compact ? 0.4 : 0)}
                style={{ fill: hold.key ? accent : INK.wall, stroke: hold.key ? accent : INK.plate }}
              />
            ),
        )}

        {equipment.map(({ disc, target }, index) =>
          disc.kind === 'ring' ? (
            <circle key={index} cx={at2(disc.at[0])} cy={at2(disc.at[1])} r={disc.r} strokeWidth={t.rings.stroke + (compact ? 0.4 : 0)} style={{ fill: 'none', stroke: INK.plate }}>
              {follow(disc, target)}
            </circle>
          ) : (
            <g key={index}>
              <circle cx={at2(disc.at[0])} cy={at2(disc.at[1])} r={disc.r} strokeWidth={t.plate.stroke + (compact ? 0.4 : 0)} style={{ fill: INK.wall, stroke: INK.plate }}>
                {follow(disc, target)}
              </circle>
              <circle cx={at2(disc.at[0])} cy={at2(disc.at[1])} r={Math.max(t.plate.hubMin, disc.r * t.plate.hub)} style={{ fill: INK.plate }}>
                {follow(disc, target)}
              </circle>
            </g>
          ),
        )}

        {spec.rings?.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r={compact ? 5 : 5.5} strokeWidth={compact ? 1.6 : 1.1} strokeDasharray="2 1.6" style={{ fill: 'none', stroke: accent }} />
        ))}

        {overlay?.(play)}

        {spec.arrows?.map((arrow, index) => (
          <path
            key={index}
            d={arrow.d}
            strokeOpacity={arrow.kind === 'guide' ? 0.55 : 0.9}
            strokeWidth={arrowWidth}
            strokeLinecap="round"
            strokeDasharray={arrow.kind === 'force' ? undefined : arrow.kind === 'guide' ? '1 2.4' : '3 2.4'}
            markerEnd={arrow.kind === 'guide' ? undefined : `url(#${arrowHead})`}
            style={{ fill: 'none', stroke: INK.arrow }}
          />
        ))}

        {!compact &&
          spec.labels?.map((label, index) => (
            <text
              key={index}
              x={label.at[0]}
              y={label.at[1]}
              fontSize="6"
              fontWeight="800"
              fontFamily="var(--font-archivo), system-ui, sans-serif"
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fill: INK.label, fontStretch: '75%' }}
            >
              {label.text}
            </text>
          ))}
      </g>
      {framed && <rect x="0.5" y="0.5" width="99" height="99" rx="10" style={{ fill: 'none', stroke: INK.frame }} />}
    </svg>
  );
};

/**
 * Coordinates are written to two decimals, as paths are: the poses use sin and
 * cos, which can differ in the last digit between server and browser, and the
 * rendered markup has to match for hydration.
 */
const at2 = (value: number) => Math.round(value * 100) / 100;

const toPath = (pts: Pt[], closed?: boolean) =>
  pts.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') + (closed ? ' Z' : '');

const HoldMark: React.FC<{ hold: Hold; accent: string; t: PropTuning }> = ({ hold, accent, t }) => {
  const [x, y] = hold.at;
  const fill = hold.key ? accent : INK.hold;
  const fillOpacity = hold.key ? 0.28 : 1;
  const stroke = hold.key ? accent : INK.holdEdge;
  const common = { fillOpacity, strokeWidth: 0.9, vectorEffect: 'non-scaling-stroke' as const, style: { fill, stroke } };
  const transform = `translate(${x} ${y}) rotate(${hold.rotate ?? 0}) scale(${hold.size ?? 1})`;
  const h = t.holds;

  switch (hold.shape) {
    case 'jug': {
      const lip = h.jug.rx * 0.64;
      return (
        <g transform={transform}>
          <ellipse rx={h.jug.rx} ry={h.jug.ry} {...common} />
          <path d={`M${-lip},-0.4 Q0,${h.jug.ry * 0.6} ${lip},-0.4`} strokeWidth="1.1" style={{ fill: 'none', stroke: INK.panel }} />
        </g>
      );
    }
    case 'edge':
      return <rect transform={transform} x={-h.edge.w / 2} y={-h.edge.h / 2} width={h.edge.w} height={h.edge.h} rx="1" {...common} />;
    case 'sloper': {
      const half = h.sloper.w / 2;
      const top = -h.sloper.h * (4.2 / 6.4);
      const foot = h.sloper.h + top;
      return <path transform={transform} d={`M${-half},${foot} Q${-half},${top} 0,${top} Q${half},${top} ${half},${foot} Z`} {...common} />;
    }
    case 'pinch':
      return <rect transform={transform} x={-h.pinch.w / 2} y={-h.pinch.h / 2} width={h.pinch.w} height={h.pinch.h} rx={h.pinch.w * 0.42} {...common} />;
    case 'pocket':
      return (
        <g transform={transform}>
          <circle r={h.pocket.r} {...common} />
          <circle r={h.pocket.hole} style={{ fill: INK.panel }} />
        </g>
      );
    case 'foot':
      return <circle transform={transform} r={h.foot.r} {...common} />;
    case 'volume': {
      const half = h.volume.w / 2;
      const top = -h.volume.h * (7 / 13);
      return <path transform={transform} d={`M${-half},${h.volume.h + top} L0,${top} L${half},${h.volume.h + top} Z`} strokeLinejoin="round" {...common} />;
    }
    case 'rung':
      return <rect transform={transform} x={-h.rung.w / 2} y={-h.rung.h / 2} width={h.rung.w} height={h.rung.h} rx="0.9" {...common} />;
    case 'bar':
      // A bar seen end-on.
      return <circle transform={transform} r={h.end.r} {...common} />;
  }
};

/**
 * Splits scenery into the ground (floors, walls, boxes, rock) and rods: bars,
 * posts, poles and ropes, anything drawn as a long thin box. Rods are
 * equipment the athlete holds or hangs from, so they are drawn in the
 * equipment colour; in the floor's colour a bar all but disappears.
 * Only straight-sided shapes can be rods, so rock is never split.
 */
function splitScenery(wall?: string): { ground: string; rods: string } {
  if (!wall) return { ground: '', rods: '' };
  const ground: string[] = [];
  const rods: string[] = [];
  for (const part of wall.split(/(?=M)/).map((piece) => piece.trim()).filter(Boolean)) {
    const straight = /^M[-\d.,\s]+(L[-\d.,\s]+)+Z?$/.test(part);
    const nums = (part.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    const xs = nums.filter((_, index) => index % 2 === 0);
    const ys = nums.filter((_, index) => index % 2 === 1);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    (straight && Math.min(w, h) <= 4 && Math.max(w, h) >= 8 ? rods : ground).push(part);
  }
  return { ground: ground.join(' '), rods: rods.join(' ') };
}

/**
 * Which side of a bar seen end-on the body leaves free, over both poses: the
 * side its arm or upright goes, so the equipment never runs through the athlete.
 */
export function barArmSide(spec: FigureSpec, barX: number): 'left' | 'right' {
  const xs = [...spec.strokes, ...(spec.motion?.strokes ?? [])]
    .filter((stroke) => stroke.tone !== 'gear' && stroke.tone !== 'ghost')
    .flatMap((stroke) => stroke.pts.map(([x]) => x));
  if (xs.length === 0) return 'right';
  return Math.max(...xs) - barX <= barX - Math.min(...xs) ? 'right' : 'left';
}
