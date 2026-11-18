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
 * follows any pose. Cosmetic only, like the gear itself.
 */

export interface GearLook {
  head?: GearTone;
  belt?: GearTone;
  bag?: GearTone;
  trophy?: boolean;
  banner?: GearTone;
  stage?: GearTone;
  /** This week's forged armour, in the colour of its tempering grade. */
  joints?: Partial<Record<ArmorSlot, GearTone>>;
}

const TONE: Record<GearTone, string> = {
  chalk: 'var(--color-fg-3)',
  iron: 'var(--color-ink-500)',
  steel: 'var(--color-armour)',
  gold: 'var(--color-earned)',
  crimson: 'var(--color-boss)',
};
const TIERS: GearTone[] = ['chalk', 'iron', 'steel', 'gold'];

/** What an equipped item looks like on the figure, read from its id alone, so a crew card can draw it too. */
export function gearLookOf(gear: Record<string, string> | undefined, joints?: GearLook['joints']): GearLook {
  const look: GearLook = { joints };
  for (const [slot, id] of Object.entries(gear ?? {})) {
    const tier = TIERS[Math.max(0, Number(id.split(':').pop()) - 1)] ?? 'iron';
    if (slot === 'head') look.head = id.startsWith('head:spotter') ? 'iron' : tier;
    if (slot === 'waist') {
      if (id.startsWith('waist:records')) look.belt = tier;
      else look.bag = tier;
    }
    if (slot === 'trophy') look.trophy = true;
    if (slot === 'banner') look.banner = tier;
    if (slot === 'stage' && id !== 'stage:floor') {
      look.stage = id.startsWith('stage:summit') || /plinth|podium/.test(id) ? 'gold' : /parallettes|rings/.test(id) ? 'steel' : 'iron';
    }
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

interface Limb {
  root: Pt;
  joint: Pt;
  end: Pt;
  width: number;
}

interface Skeleton {
  head: { at: Pt; r: number } | null;
  /** The torso's two ends, and the two corners at the hips. */
  shoulders: Pt;
  hips: Pt;
  hipCorners: [Pt, Pt];
  arms: Limb[];
  legs: Limb[];
}

function skeletonOf(spec: FigureSpec): Skeleton | null {
  const torso = spec.strokes.find((stroke) => stroke.closed && stroke.tone !== 'gear' && stroke.tone !== 'ghost');
  const head = [...(spec.discs ?? [])].filter((disc) => !disc.kind && disc.tone !== 'ghost').sort((a, b) => b.r - a.r)[0];
  if (!torso || torso.pts.length < 4) return null;
  const at = head?.at ?? torso.pts[0];
  const byHead = [...torso.pts].sort((a, b) => len(sub(a, at)) - len(sub(b, at)));
  const shoulders = mid(byHead[0], byHead[1]);
  const hipCorners: [Pt, Pt] = [byHead[byHead.length - 1], byHead[byHead.length - 2]];
  const hips = mid(hipCorners[0], hipCorners[1]);

  // Limbs: two open segments that meet at a joint.
  const segments = spec.strokes.filter((stroke) => !stroke.closed && stroke.tone !== 'gear' && stroke.tone !== 'ghost' && stroke.pts.length === 2 && len(sub(stroke.pts[1], stroke.pts[0])) > 1);
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
  return { head: head ? { at: head.at, r: head.r } : null, shoulders, hips, hipCorners, arms, legs };
}

/* ---------------- drawing ---------------- */

const Band: React.FC<{ from: Pt; to: Pt; width: number; tone: GearTone }> = ({ from, to, width, tone }) => (
  <line
    x1={from[0]}
    y1={from[1]}
    x2={to[0]}
    y2={to[1]}
    strokeWidth={width}
    strokeLinecap="round"
    style={{ stroke: TONE[tone] }}
  />
);

const GearLayer: React.FC<{ spec: FigureSpec; look: GearLook }> = ({ spec, look }) => {
  const bones = skeletonOf(spec);
  const joints = look.joints ?? {};
  const pieces: React.ReactNode[] = [];

  if (bones) {
    const sleeve = (limb: Limb, at: 'joint' | 'end' | 'root', tone: GearTone, key: string) => {
      const w = limb.width + 1.2;
      if (at === 'joint') {
        pieces.push(<Band key={`${key}-a`} from={lerp(limb.joint, limb.root, 0.14)} to={limb.joint} width={w} tone={tone} />);
        pieces.push(<Band key={`${key}-b`} from={limb.joint} to={lerp(limb.joint, limb.end, 0.14)} width={w} tone={tone} />);
      } else if (at === 'end') {
        pieces.push(<Band key={key} from={lerp(limb.joint, limb.end, 0.8)} to={lerp(limb.joint, limb.end, 0.95)} width={w} tone={tone} />);
      } else {
        pieces.push(<Band key={key} from={lerp(limb.root, limb.joint, 0.12)} to={lerp(limb.root, limb.joint, 0.3)} width={w} tone={tone} />);
      }
    };
    bones.arms.forEach((arm, index) => {
      if (joints.shoulders) sleeve(arm, 'root', joints.shoulders, `shoulder${index}`);
      if (joints.elbows) sleeve(arm, 'joint', joints.elbows, `elbow${index}`);
      if (joints.wrists) sleeve(arm, 'end', joints.wrists, `wrist${index}`);
      if (joints.fingers) {
        pieces.push(<circle key={`finger${index}`} cx={arm.end[0]} cy={arm.end[1]} r={arm.width * 0.7} style={{ fill: TONE[joints.fingers] }} />);
      }
    });
    bones.legs.forEach((leg, index) => {
      if (joints.knees) sleeve(leg, 'joint', joints.knees, `knee${index}`);
      if (joints.ankles) sleeve(leg, 'end', joints.ankles, `ankle${index}`);
    });

    if (look.belt) {
      const axis = sub(bones.shoulders, bones.hips);
      const up = scale(axis, Math.min(0.12, 2.2 / Math.max(1, len(axis))));
      pieces.push(<Band key="belt" from={add(bones.hipCorners[0], up)} to={add(bones.hipCorners[1], up)} width={2.8} tone={look.belt} />);
    }
    if (look.bag) {
      const side = lerp(bones.hipCorners[0], bones.hipCorners[1], -0.25);
      pieces.push(<rect key="bag" x={side[0] - 1.8} y={side[1] - 1.6} width={3.6} height={4.2} rx={1} style={{ fill: TONE[look.bag] }} />);
    }
    if (look.head && bones.head) {
      const { at, r } = bones.head;
      // The band sits on the forehead: toward the top of the head, away from the torso, whatever the pose.
      const away = sub(at, bones.shoulders);
      const unit = scale(away, 1 / Math.max(0.001, len(away)));
      const centre = add(at, scale(unit, r * 0.32));
      const across: Pt = [-unit[1], unit[0]];
      const half = Math.sqrt(Math.max(0, r * r - (r * 0.32) ** 2));
      pieces.push(<Band key="head" from={add(centre, scale(across, half))} to={add(centre, scale(across, -half))} width={1.9} tone={look.head} />);
    }
  }

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
      {look.stage && (spec.scene === 'floor' || spec.scene === 'ground') && (
        <rect x="14" y="91" width="72" height="5" rx="1.5" style={{ fill: TONE[look.stage], opacity: 0.85 }} />
      )}
      {pieces}
      {look.trophy && (
        <path d="M8 74 h9 v5 c0 3 -2 5 -4.5 6 c-2.5 -1 -4.5 -3 -4.5 -6 z" style={{ fill: TONE.crimson }} />
      )}
      {look.banner && (
        <g>
          <line x1="88" y1="6" x2="88" y2="22" strokeWidth="1.2" style={{ stroke: 'var(--color-fg-4)' }} />
          <path d="M88 6 h-9 l3 3.5 l-3 3.5 h9 z" style={{ fill: TONE[look.banner] }} />
        </g>
      )}
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
  return (
    <span className={`relative block ${className}`}>
      <Figure spec={spec} state={state} animate={animate && !worn} className="w-full h-full" title={title} />
      {worn && <GearLayer spec={spec} look={look} />}
    </span>
  );
};
