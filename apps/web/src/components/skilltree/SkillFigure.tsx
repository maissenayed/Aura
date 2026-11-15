import React, { useId, useSyncExternalStore } from 'react';

/**
 * Draws one skill illustration in the app's dark/neon look: a figure on a wall,
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
}

export interface Disc {
  at: Pt;
  r: number;
  tone: Tone;
  /** A weight plate or dumbbell end, drawn in front of the figure. */
  kind?: 'plate';
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
  | 'bars';

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
};

const INK = {
  panel: '#0a0c12',
  frame: '#1c2336',
  dot: '#1c2336',
  wall: '#131824',
  wallEdge: '#334155',
  hold: '#1c2336',
  holdEdge: '#475569',
  body: '#cbd5e1',
  ghost: '#64748b',
  gear: '#64748b',
  plate: '#94a3b8',
  arrow: '#f8fafc',
  label: '#f8fafc',
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
}

export const SkillFigure: React.FC<SkillFigureProps> = ({
  spec,
  accent,
  compact = false,
  framed = false,
  animate = false,
  className,
  title,
}) => {
  // Marker ids must be unique per drawing, and safe inside url(#…).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const reducedMotion = useReducedMotion();
  const arrowHead = `${uid}-arrow`;
  const clip = `${uid}-clip`;
  const order: Tone[] = ['gear', 'ghost', 'body', 'focus'];
  const toneColour = (tone: Tone) =>
    tone === 'focus' ? accent : tone === 'ghost' ? INK.ghost : tone === 'gear' ? INK.gear : INK.body;
  const arrowWidth = compact ? 2.6 : 1.5;

  const motion = animate && !reducedMotion ? spec.motion : undefined;
  const tempo = TEMPO[motion?.tempo ?? 'even'];
  const keySplines = [EASE, HOLD, EASE, HOLD].join(';');
  /** SMIL values for one attribute: the base pose, then the moved pose, in the tempo's order. */
  const loop = (from: string, to: string) => tempo.order.map((frame) => (frame === 0 ? from : to)).join(';');
  const timing = motion && {
    dur: `${motion.seconds}s`,
    repeatCount: 'indefinite',
    calcMode: 'spline' as const,
    keyTimes: tempo.keyTimes,
    keySplines,
  };

  const strokes = spec.strokes.map((stroke, index) => ({ stroke, target: motion?.strokes[index] }));
  const discs = (spec.discs ?? []).map((disc, index) => ({ disc, target: motion?.discs[index] }));
  const plates = discs.filter(({ disc }) => disc.kind === 'plate');
  /** cx and cy animations for a disc that moves with the motion. */
  const follow = (disc: Disc, target?: Disc) =>
    timing &&
    target && (
      <>
        <animate attributeName="cx" values={loop(String(disc.at[0]), String(target.at[0]))} {...timing} />
        <animate attributeName="cy" values={loop(String(disc.at[1]), String(target.at[1]))} {...timing} />
      </>
    );

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
          <path d="M0,0 L10,5 L0,10 z" fill={INK.arrow} />
        </marker>
        {/* Rock and floors run to the panel's rounded edge, not past it. */}
        <clipPath id={clip}>
          <rect x="0.5" y="0.5" width="99" height="99" rx={framed ? 12 : 0} />
        </clipPath>
      </defs>

      {framed && <rect x="0.5" y="0.5" width="99" height="99" rx="12" fill={INK.panel} />}
      <g clipPath={`url(#${clip})`}>
        {framed && !compact && (
          <g fill={INK.dot}>
            {[10, 30, 50, 70, 90].flatMap((x) => [10, 30, 50, 70, 90].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" />))}
          </g>
        )}

        {spec.wall && <path d={spec.wall} fill={INK.wall} stroke={INK.wallEdge} strokeWidth="1.2" strokeLinejoin="round" />}

        {spec.holds?.map((hold, index) => (
          <HoldMark key={index} hold={hold} accent={accent} />
        ))}

        {order.map((tone) => {
          const lines = strokes.filter(({ stroke }) => stroke.tone === tone);
          const dots = discs.filter(({ disc }) => disc.tone === tone && disc.kind !== 'plate');
          if (lines.length === 0 && dots.length === 0) return null;
          const colour = toneColour(tone);
          return (
            <g
              key={tone}
              opacity={tone === 'ghost' ? 0.55 : 1}
              style={tone === 'focus' ? { filter: `drop-shadow(0 0 ${compact ? 1.2 : 1.8}px ${accent})` } : undefined}
            >
              {lines.map(({ stroke, target }, index) => {
                const d = toPath(stroke.pts, stroke.closed);
                return (
                  <path
                    key={index}
                    d={d}
                    fill={stroke.closed ? colour : 'none'}
                    stroke={colour}
                    strokeWidth={stroke.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={tone === 'ghost' && !stroke.closed ? '2.4 2.2' : undefined}
                  >
                    {timing && target && <animate attributeName="d" values={loop(d, toPath(target.pts, target.closed))} {...timing} />}
                  </path>
                );
              })}
              {dots.map(({ disc, target }, index) => (
                <circle
                  key={index}
                  cx={disc.at[0]}
                  cy={disc.at[1]}
                  r={disc.r}
                  fill={tone === 'ghost' ? 'none' : colour}
                  stroke={colour}
                  strokeWidth={tone === 'ghost' ? 1.2 : 0}
                >
                  {follow(disc, target)}
                </circle>
              ))}
            </g>
          );
        })}

        {plates.map(({ disc, target }, index) => (
          <g key={index}>
            <circle cx={disc.at[0]} cy={disc.at[1]} r={disc.r} fill={INK.wall} stroke={INK.plate} strokeWidth={compact ? 1.8 : 1.4}>
              {follow(disc, target)}
            </circle>
            <circle cx={disc.at[0]} cy={disc.at[1]} r={Math.max(0.9, disc.r * 0.22)} fill={INK.plate}>
              {follow(disc, target)}
            </circle>
          </g>
        ))}

        {spec.rings?.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r={compact ? 5 : 5.5} fill="none" stroke={accent} strokeWidth={compact ? 1.6 : 1.1} strokeDasharray="2 1.6" />
        ))}

        {spec.arrows?.map((arrow, index) => (
          <path
            key={index}
            d={arrow.d}
            fill="none"
            stroke={INK.arrow}
            strokeOpacity={arrow.kind === 'guide' ? 0.55 : 0.9}
            strokeWidth={arrowWidth}
            strokeLinecap="round"
            strokeDasharray={arrow.kind === 'force' ? undefined : arrow.kind === 'guide' ? '1 2.4' : '3 2.4'}
            markerEnd={arrow.kind === 'guide' ? undefined : `url(#${arrowHead})`}
          />
        ))}

        {!compact &&
          spec.labels?.map((label, index) => (
            <text
              key={index}
              x={label.at[0]}
              y={label.at[1]}
              fill={INK.label}
              fontSize="6"
              fontWeight="800"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {label.text}
            </text>
          ))}
      </g>
      {framed && <rect x="0.5" y="0.5" width="99" height="99" rx="12" fill="none" stroke={INK.frame} />}
    </svg>
  );
};

const toPath = (pts: Pt[], closed?: boolean) =>
  pts.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') + (closed ? ' Z' : '');

const HoldMark: React.FC<{ hold: Hold; accent: string }> = ({ hold, accent }) => {
  const [x, y] = hold.at;
  const fill = hold.key ? accent : INK.hold;
  const fillOpacity = hold.key ? 0.28 : 1;
  const stroke = hold.key ? accent : INK.holdEdge;
  const common = { fill, fillOpacity, stroke, strokeWidth: 0.9, vectorEffect: 'non-scaling-stroke' as const };
  const transform = `translate(${x} ${y}) rotate(${hold.rotate ?? 0}) scale(${hold.size ?? 1})`;

  switch (hold.shape) {
    case 'jug':
      return (
        <g transform={transform}>
          <ellipse rx="5" ry="3" {...common} />
          <path d="M-3.2,-0.4 Q0,1.8 3.2,-0.4" fill="none" stroke={INK.panel} strokeWidth="1.1" />
        </g>
      );
    case 'edge':
      return <rect transform={transform} x="-4.5" y="-1.2" width="9" height="2.4" rx="1" {...common} />;
    case 'sloper':
      return <path transform={transform} d="M-6.5,2.2 Q-6.5,-4.2 0,-4.2 Q6.5,-4.2 6.5,2.2 Z" {...common} />;
    case 'pinch':
      return <rect transform={transform} x="-1.9" y="-4.8" width="3.8" height="9.6" rx="1.6" {...common} />;
    case 'pocket':
      return (
        <g transform={transform}>
          <circle r="3.2" {...common} />
          <circle r="1.4" fill={INK.panel} />
        </g>
      );
    case 'foot':
      return <circle transform={transform} r="1.8" {...common} />;
    case 'volume':
      return <path transform={transform} d="M-10,6 L0,-7 L10,6 Z" strokeLinejoin="round" {...common} />;
    case 'rung':
      return <rect transform={transform} x="-12" y="-1.3" width="24" height="2.6" rx="0.9" {...common} />;
    case 'bar':
      // A bar seen end-on.
      return <circle transform={transform} r="2.4" {...common} />;
  }
};
