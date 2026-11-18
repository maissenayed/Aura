'use client';

import React from 'react';
import type { FigureSpec, Pt } from '../skilltree/SkillFigure';
import type { ArmorSlot } from '../../utils/campaignV3';
import type { GearTone } from '../../data/gear';
import type { NodeState } from './kit';
import { Figure } from './kit';

/**
 * The athlete's figure wearing their gear. The figures are drawn as plain
 * strokes (a closed torso, two-segment limbs) and a head disc, so the joints
 * are found from the pose itself: the head, where the torso meets the arms and
 * the legs, and each limb's middle and end. Gear is drawn on those points, so it
 * follows any pose.
 *
 * Every piece is outlined in the page colour, so it reads as something worn on
 * any body colour and in both themes. The stage is real equipment behind and
 * under the figure; the trophy and the banner stand on poles beside it.
 * Cosmetic only, like the gear itself.
 */

export type StageKind = 'bar' | 'parallettes' | 'rings' | 'plinth' | 'podium' | 'summit';

export interface GearLook {
  head?: GearTone;
  belt?: GearTone;
  bag?: GearTone;
  trophy?: boolean;
  banner?: GearTone;
  stage?: StageKind;
  /** This week's forged armour, in the colour of its tempering grade. */
  joints?: Partial<Record<ArmorSlot, GearTone>>;
}

const TONE: Record<GearTone, string> = {
  chalk: 'var(--fig-tape)',
  iron: 'var(--color-ink-500)',
  steel: 'var(--color-armour)',
  gold: 'var(--color-earned)',
  crimson: 'var(--color-boss)',
};
const OUTLINE = 'var(--color-ink-950)';
const POLE = 'var(--color-fg-4)';
const TIERS: GearTone[] = ['chalk', 'iron', 'steel', 'gold'];

const STAGE_OF: Record<string, StageKind> = {
  'stage:pull-up-bar': 'bar',
  'stage:parallettes': 'parallettes',
  'stage:rings': 'rings',
  'stage:competition-plinth': 'plinth',
  'stage:the-podium': 'podium',
};

/** What an equipped item looks like on the figure, read from its id alone, so a crew card can draw it too. */
export function gearLookOf(gear: Record<string, string> | undefined, joints?: GearLook['joints']): GearLook {
  const look: GearLook = { joints };
  for (const [slot, id] of Object.entries(gear ?? {})) {
    const tier = TIERS[Math.max(0, Number(id.split(':').pop()) - 1)] ?? 'iron';
    if (slot === 'head') look.head = id.startsWith('head:spotter') ? 'steel' : tier;
    if (slot === 'waist') {
      if (id.startsWith('waist:records')) look.belt = tier;
      else look.bag = tier;
    }
    if (slot === 'trophy') look.trophy = true;
    if (slot === 'banner') look.banner = tier;
    if (slot === 'stage') look.stage = id.startsWith('stage:summit') ? 'summit' : STAGE_OF[id];
  }
  return look;
}

/* ---------------- finding the joints in a pose ---------------- */

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const same = (a: Pt, b: Pt) => Math.abs(a[0] - b[0]) < 0.6 && Math.abs(a[1] - b[1]) < 0.6;
const unit = (a: Pt): Pt => scale(a, 1 / Math.max(0.001, len(a)));

interface Limb {
  root: Pt;
  joint: Pt;
  end: Pt;
  width: number;
}

interface Skeleton {
  head: { at: Pt; r: number } | null;
  shoulders: Pt;
  hips: Pt;
  /** The two torso corners at the hips. */
  hipCorners: [Pt, Pt];
  arms: Limb[];
  legs: Limb[];
  /** The lowest point of the body: where the feet meet the floor. */
  floor: number;
}

function skeletonOf(spec: FigureSpec): Skeleton | null {
  const body = spec.strokes.filter((stroke) => stroke.tone !== 'gear' && stroke.tone !== 'ghost');
  const torso = body.find((stroke) => stroke.closed);
  const head = [...(spec.discs ?? [])].filter((disc) => !disc.kind && disc.tone !== 'ghost').sort((a, b) => b.r - a.r)[0];
  if (!torso || torso.pts.length < 4) return null;
  const at = head?.at ?? torso.pts[0];
  const byHead = [...torso.pts].sort((a, b) => len(sub(a, at)) - len(sub(b, at)));
  const shoulders = mid(byHead[0], byHead[1]);
  const hipCorners: [Pt, Pt] = [byHead[byHead.length - 1], byHead[byHead.length - 2]];
  const hips = mid(hipCorners[0], hipCorners[1]);

  // Limbs: two open segments that meet at a joint.
  const segments = body.filter((stroke) => !stroke.closed && stroke.pts.length === 2 && len(sub(stroke.pts[1], stroke.pts[0])) > 1);
  const arms: Limb[] = [];
  const legs: Limb[] = [];
  const used = new Set<number>();
  segments.forEach((upper, i) => {
    if (used.has(i)) return;
    const j = segments.findIndex((lower, k) => k !== i && !used.has(k) && same(lower.pts[0], upper.pts[1]));
    if (j < 0) return;
    used.add(i);
    used.add(j);
    const limb: Limb = { root: upper.pts[0], joint: upper.pts[1], end: segments[j].pts[1], width: Math.max(upper.width, segments[j].width) };
    if (len(sub(limb.root, shoulders)) <= len(sub(limb.root, hips))) arms.push(limb);
    else legs.push(limb);
  });
  const floor = Math.max(...body.flatMap((stroke) => stroke.pts.map(([, y]) => y)));
  return { head: head ? { at: head.at, r: head.r } : null, shoulders, hips, hipCorners, arms, legs, floor };
}

/* ---------------- drawing ---------------- */

/** A strap or sleeve: an outline in the page colour, then the material on top. */
const Strap: React.FC<{ from: Pt; to: Pt; width: number; tone: GearTone }> = ({ from, to, width, tone }) => (
  <g strokeLinecap="round">
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} strokeWidth={width + 1.6} style={{ stroke: OUTLINE }} />
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} strokeWidth={width} style={{ stroke: TONE[tone] }} />
  </g>
);

const outlined = (tone: GearTone) => ({ fill: TONE[tone], stroke: OUTLINE, strokeWidth: 1.1, strokeLinejoin: 'round' as const });

/** Equipment behind and under the figure, and the poles beside it. Drawn first, so the figure stands in front. */
const Backdrop: React.FC<{ look: GearLook; floor: number }> = ({ look, floor }) => {
  const top = Math.min(92, floor + 1.5);
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {look.stage === 'bar' && (
        <g style={{ stroke: TONE.iron }} strokeWidth="2.4" strokeLinecap="round">
          <line x1="12" y1="10" x2="12" y2={top} />
          <line x1="88" y1="10" x2="88" y2={top} />
          <line x1="8" y1="10" x2="92" y2="10" strokeWidth="3" />
        </g>
      )}
      {look.stage === 'rings' && (
        <g>
          {[16, 84].map((x) => (
            <g key={x}>
              <line x1={x} y1="0" x2={x} y2="26" strokeWidth="1.2" style={{ stroke: POLE }} />
              <circle cx={x} cy="31" r="5" strokeWidth="2.2" style={{ fill: 'none', stroke: TONE.steel }} />
            </g>
          ))}
        </g>
      )}
      {look.stage === 'summit' && (
        <path d={`M4 ${top} L30 34 L42 50 L58 22 L96 ${top} Z`} style={{ fill: 'var(--color-ink-800)', stroke: TONE.gold, strokeWidth: 1.4, strokeLinejoin: 'round' }} />
      )}
      {look.trophy && (
        <g>
          <line x1="5" y1="38" x2="5" y2={top} strokeWidth="1.4" strokeLinecap="round" style={{ stroke: POLE }} />
          <path d="M5 38 L21 43.5 L5 49 Z" style={outlined('crimson')} />
        </g>
      )}
      {look.banner && (
        <g>
          <line x1="95" y1="30" x2="95" y2={top} strokeWidth="1.4" strokeLinecap="round" style={{ stroke: POLE }} />
          <path d="M95 31 L83 31 L83 50 L89 46 L95 50 Z" style={outlined(look.banner)} />
        </g>
      )}
    </svg>
  );
};

/** What the figure stands on, and what it wears. Drawn over the figure. */
const Worn: React.FC<{ spec: FigureSpec; look: GearLook; bones: Skeleton }> = ({ spec, look, bones }) => {
  const joints = look.joints ?? {};
  const pieces: React.ReactNode[] = [];
  const floorScene = spec.scene === 'floor' || spec.scene === 'ground';
  const top = Math.min(92, bones.floor + 1.5);

  const sleeve = (limb: Limb, at: 'joint' | 'end' | 'root', tone: GearTone, key: string) => {
    const w = limb.width + 0.8;
    if (at === 'joint') {
      pieces.push(<Strap key={key} from={lerp(limb.joint, limb.root, 0.16)} to={lerp(limb.joint, limb.end, 0.16)} width={w} tone={tone} />);
    } else if (at === 'end') {
      pieces.push(<Strap key={key} from={lerp(limb.joint, limb.end, 0.8)} to={lerp(limb.joint, limb.end, 0.96)} width={w} tone={tone} />);
    } else {
      pieces.push(<Strap key={key} from={lerp(limb.root, limb.joint, 0.12)} to={lerp(limb.root, limb.joint, 0.32)} width={w} tone={tone} />);
    }
  };
  bones.arms.forEach((arm, index) => {
    if (joints.shoulders) sleeve(arm, 'root', joints.shoulders, `shoulder${index}`);
    if (joints.elbows) sleeve(arm, 'joint', joints.elbows, `elbow${index}`);
    if (joints.wrists) sleeve(arm, 'end', joints.wrists, `wrist${index}`);
    if (joints.fingers) pieces.push(<circle key={`finger${index}`} cx={arm.end[0]} cy={arm.end[1]} r={arm.width * 0.75} style={outlined(joints.fingers)} />);
  });
  bones.legs.forEach((leg, index) => {
    if (joints.knees) sleeve(leg, 'joint', joints.knees, `knee${index}`);
    if (joints.ankles) sleeve(leg, 'end', joints.ankles, `ankle${index}`);
  });

  if (look.belt || look.bag) {
    const axis = sub(bones.shoulders, bones.hips);
    const up = scale(unit(axis), 2.4);
    const [a, b] = [add(bones.hipCorners[0], up), add(bones.hipCorners[1], up)];
    if (look.belt) {
      pieces.push(<Strap key="belt" from={a} to={b} width={3.2} tone={look.belt} />);
      const buckle = mid(a, b);
      pieces.push(<rect key="buckle" x={buckle[0] - 1.6} y={buckle[1] - 1.6} width={3.2} height={3.2} rx={0.6} style={outlined(look.belt === 'gold' ? 'iron' : 'gold')} />);
    }
    if (look.bag) {
      // Hung at the back of the belt, just below it.
      const side = add(lerp(a, b, 1.15), scale(unit(axis), -2.5));
      pieces.push(<rect key="bag" x={side[0] - 2.2} y={side[1] - 2.4} width={4.4} height={5.2} rx={1.2} style={outlined(look.bag)} />);
    }
  }

  if (look.head && bones.head) {
    const { at, r } = bones.head;
    // The band sits on the forehead: toward the top of the head, away from the torso, whatever the pose.
    const away = unit(sub(at, bones.shoulders));
    const centre = add(at, scale(away, r * 0.38));
    const across: Pt = [-away[1], away[0]];
    const half = Math.sqrt(Math.max(0, r * r - (r * 0.38) ** 2)) + 0.6;
    pieces.push(<Strap key="head" from={add(centre, scale(across, half))} to={add(centre, scale(across, -half))} width={2.2} tone={look.head} />);
  }

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {floorScene && look.stage === 'plinth' && (
        <g>
          <rect x="16" y={top} width="68" height={Math.max(4, 98 - top)} rx="1.5" style={outlined('iron')} />
          <line x1="16.6" y1={top + 0.8} x2="83.4" y2={top + 0.8} strokeWidth="1.6" style={{ stroke: TONE.gold }} />
        </g>
      )}
      {floorScene && look.stage === 'podium' && (
        <g>
          <rect x="8" y={top + 4} width="26" height={Math.max(3, 94 - top)} rx="1" style={outlined('iron')} />
          <rect x="66" y={top + 6} width="26" height={Math.max(2, 92 - top)} rx="1" style={outlined('iron')} />
          <rect x="34" y={top} width="32" height={Math.max(4, 98 - top)} rx="1" style={outlined('iron')} />
          <line x1="34.6" y1={top + 0.8} x2="65.4" y2={top + 0.8} strokeWidth="1.6" style={{ stroke: TONE.gold }} />
        </g>
      )}
      {floorScene && look.stage === 'parallettes' && (
        <g>
          {[
            [14, 34],
            [66, 86],
          ].map(([x1, x2]) => (
            <g key={x1} style={{ stroke: TONE.steel }} strokeWidth="1.8" strokeLinecap="round">
              <line x1={x1} y1={top - 4} x2={x2} y2={top - 4} strokeWidth="2.2" />
              <line x1={x1 + 2} y1={top - 4} x2={x1} y2={top + 1} />
              <line x1={x2 - 2} y1={top - 4} x2={x2} y2={top + 1} />
            </g>
          ))}
        </g>
      )}
      {pieces}
    </svg>
  );
};

/**
 * A figure with gear on. Gear sits on the pose's resting position, so a geared
 * figure is drawn still; with no gear it is the plain figure, animated if asked.
 */
export const GearedFigure: React.FC<{
  spec: FigureSpec;
  state?: NodeState;
  look: GearLook;
  animate?: boolean;
  className?: string;
  title?: string;
}> = ({ spec, state, look, animate = false, className = 'w-12 h-12', title }) => {
  const worn = Boolean(look.head || look.belt || look.bag || look.trophy || look.banner || look.stage || Object.keys(look.joints ?? {}).length);
  const bones = worn ? skeletonOf(spec) : null;
  return (
    <span className={`relative block ${className}`}>
      {worn && <Backdrop look={look} floor={bones?.floor ?? 84} />}
      <span className="absolute inset-0">
        <Figure spec={spec} state={state} animate={animate && !worn} className="w-full h-full" title={title} />
      </span>
      {worn && bones && <Worn spec={spec} look={look} bones={bones} />}
    </span>
  );
};
