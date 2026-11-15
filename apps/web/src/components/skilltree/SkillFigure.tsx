import React, { useId } from 'react';

/**
 * Draws one skill illustration: a climber (or a hand) on a wall, in the app's
 * dark/neon look. The drawing is plain data — see `boulderingFigures.ts` — so a
 * figure stays a few lines of numbers instead of a hand-made SVG per skill.
 *
 * Everything lives in a 100 × 100 box.
 */

export type Pt = readonly [number, number];

/** body: the climber · focus: the part the skill is about · ghost: where it was a moment ago. */
export type Tone = 'body' | 'focus' | 'ghost';

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
}

export type HoldShape = 'jug' | 'edge' | 'sloper' | 'pinch' | 'pocket' | 'foot' | 'volume' | 'rung';

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

export type WallAngle = 'slab' | 'vertical' | 'overhang' | 'roof' | 'board' | 'ground' | 'close-up';

export interface FigureSpec {
  angle: WallAngle;
  /** Solid rock, floor or board, as SVG path data. */
  wall?: string;
  holds?: Hold[];
  strokes: Stroke[];
  discs?: Disc[];
  arrows?: Arrow[];
  /** Spots worth looking at. */
  rings?: Pt[];
  labels?: { at: Pt; text: string }[];
}

export const ANGLE_LABEL: Record<WallAngle, string> = {
  slab: 'Slab',
  vertical: 'Vertical wall',
  overhang: 'Overhang',
  roof: 'Roof',
  board: 'Training board',
  ground: 'On the ground',
  'close-up': 'Close-up',
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
  arrow: '#f8fafc',
  label: '#f8fafc',
};

interface SkillFigureProps {
  spec: FigureSpec;
  /** The branch colour: the focus part, key holds and rings are drawn in it. */
  accent: string;
  /** Small thumbnail: no background dots or labels, heavier arrows. */
  compact?: boolean;
  /** Draw a rounded panel behind the figure. */
  framed?: boolean;
  className?: string;
  /** Spoken description; without one the drawing is treated as decoration. */
  title?: string;
}

export const SkillFigure: React.FC<SkillFigureProps> = ({ spec, accent, compact = false, framed = false, className, title }) => {
  // Marker ids must be unique per drawing, and safe inside url(#…).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const arrowHead = `${uid}-arrow`;
  const clip = `${uid}-clip`;
  const order: Tone[] = ['ghost', 'body', 'focus'];
  const toneColour = (tone: Tone) => (tone === 'focus' ? accent : tone === 'ghost' ? INK.ghost : INK.body);
  const arrowWidth = compact ? 2.6 : 1.5;

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
        const strokes = spec.strokes.filter((stroke) => stroke.tone === tone);
        const discs = spec.discs?.filter((disc) => disc.tone === tone) ?? [];
        if (strokes.length === 0 && discs.length === 0) return null;
        const colour = toneColour(tone);
        return (
          <g
            key={tone}
            opacity={tone === 'ghost' ? 0.55 : 1}
            style={tone === 'focus' ? { filter: `drop-shadow(0 0 ${compact ? 1.2 : 1.8}px ${accent})` } : undefined}
          >
            {strokes.map((stroke, index) => (
              <path
                key={index}
                d={toPath(stroke.pts, stroke.closed)}
                fill={stroke.closed ? colour : 'none'}
                stroke={colour}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={tone === 'ghost' && !stroke.closed ? '2.4 2.2' : undefined}
              />
            ))}
            {discs.map((disc, index) => (
              <circle key={index} cx={disc.at[0]} cy={disc.at[1]} r={disc.r} fill={tone === 'ghost' ? 'none' : colour} stroke={colour} strokeWidth={tone === 'ghost' ? 1.2 : 0} />
            ))}
          </g>
        );
      })}

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
  }
};
