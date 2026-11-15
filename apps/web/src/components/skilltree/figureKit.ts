import { Arrow, Disc, FigureSpec, Hold, Motion, Pt, Scene, Stroke, Tone } from './SkillFigure';

/**
 * Building blocks for skill drawings (see `SkillFigure`).
 *
 * A figure is described by where its hands, feet, neck and pelvis are; the
 * elbows and knees are worked out from limb lengths (two-bone IK), with `bend`
 * saying which way they fold. Front views look at the athlete's back; side
 * views show them in profile.
 */

export type Limb = 'lArm' | 'rArm' | 'lLeg' | 'rLeg';
export type Part = Limb | 'torso' | 'head';
export type Bend = 'out' | 'in' | 'up' | 'down' | 'left' | 'right';

export interface Pose {
  neck: Pt;
  pelvis: Pt;
  lHand: Pt;
  rHand: Pt;
  lFoot: Pt;
  rFoot: Pt;
  bend?: Partial<Record<Limb, Bend>>;
  /** Set an elbow or knee directly instead of solving it. */
  joints?: Partial<Record<Limb, Pt>>;
  /** 0 = square to the wall, 1 = side-on. Narrows the shoulders and hips. */
  turn?: number;
  head?: Pt;
  /** Direction the shoe points, when the foot itself matters. */
  lToe?: Pt;
  rToe?: Pt;
}

export interface Drawn {
  strokes: Stroke[];
  discs: Disc[];
}

const UPPER_ARM = 11.5;
const FOREARM = 11;
const THIGH = 15;
const SHIN = 14.5;

export const ALL: Part[] = ['lArm', 'rArm', 'lLeg', 'rLeg', 'torso', 'head'];

export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const len = (a: Pt) => Math.hypot(a[0], a[1]);
export const unit = (a: Pt): Pt => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};

/** Where the elbow or knee goes so both bones keep their length, folded towards `bend`. */
function solveJoint(root: Pt, tip: Pt, first: number, second: number, bend: Bend, centreX: number): Pt {
  const span = sub(tip, root);
  const d = len(span);
  if (d < 1e-6) return root;
  if (d >= first + second) return add(root, mul(span, first / (first + second)));
  const along = (first * first - second * second + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, first * first - along * along));
  const base = add(root, mul(span, along / d));
  const normal: Pt = [(-span[1] / d) * off, (span[0] / d) * off];
  const a = add(base, normal);
  const b = sub(base, normal);
  const score = (p: Pt) => {
    switch (bend) {
      case 'out':
        return Math.abs(p[0] - centreX);
      case 'in':
        return -Math.abs(p[0] - centreX);
      case 'up':
        return -p[1];
      case 'down':
        return p[1];
      case 'left':
        return -p[0];
      case 'right':
        return p[0];
    }
  };
  return score(a) >= score(b) ? a : b;
}

export function climber(pose: Pose, focus: Part[] = [], ghost = false): Drawn {
  const axis = unit(sub(pose.neck, pose.pelvis));
  const across: Pt = [-axis[1], axis[0]];
  const turn = pose.turn ?? 0;
  const shoulderHalf = 6.5 * (1 - 0.65 * turn);
  const hipHalf = 4.2 * (1 - 0.55 * turn);
  // `across` points to screen-right for an upright climber.
  const lShoulder = sub(pose.neck, mul(across, shoulderHalf));
  const rShoulder = add(pose.neck, mul(across, shoulderHalf));
  const lHip = sub(pose.pelvis, mul(across, hipHalf));
  const rHip = add(pose.pelvis, mul(across, hipHalf));
  const centreX = (pose.neck[0] + pose.pelvis[0]) / 2;
  const bend = pose.bend ?? {};
  const joints = pose.joints ?? {};

  const joint = (limb: Limb, root: Pt, tip: Pt, a: number, b: number) =>
    joints[limb] ?? solveJoint(root, tip, a, b, bend[limb] ?? 'out', centreX);

  const tone = (part: Part): Tone => (ghost ? 'ghost' : focus.includes(part) ? 'focus' : 'body');
  const foot = (at: Pt, toe?: Pt): Pt[] => (toe ? [at, add(at, mul(unit(toe), 4.6))] : [at]);

  const strokes: Stroke[] = [
    { pts: [lShoulder, rShoulder, rHip, lHip], width: 3.4, tone: tone('torso'), closed: true },
    { pts: [lShoulder, joint('lArm', lShoulder, pose.lHand, UPPER_ARM, FOREARM), pose.lHand], width: 3.6, tone: tone('lArm') },
    { pts: [rShoulder, joint('rArm', rShoulder, pose.rHand, UPPER_ARM, FOREARM), pose.rHand], width: 3.6, tone: tone('rArm') },
    { pts: [lHip, joint('lLeg', lHip, pose.lFoot, THIGH, SHIN), ...foot(pose.lFoot, pose.lToe)], width: 4.2, tone: tone('lLeg') },
    { pts: [rHip, joint('rLeg', rHip, pose.rFoot, THIGH, SHIN), ...foot(pose.rFoot, pose.rToe)], width: 4.2, tone: tone('rLeg') },
  ];
  const head = pose.head ?? add(pose.neck, mul(axis, 6.4));
  strokes.push({ pts: [pose.neck, add(pose.neck, mul(sub(head, pose.neck), 0.5))], width: 2.6, tone: tone('head') });

  return { strokes, discs: [{ at: head, r: 4.4, tone: tone('head') }] };
}

export interface FigureInput {
  scene: Scene;
  wall?: string;
  holds?: Hold[];
  people?: Drawn[];
  /** Hands drawn close up, and other one-off lines. */
  extra?: Stroke[];
  arrows?: Arrow[];
  rings?: Pt[];
  labels?: { at: Pt; text: string }[];
  /** A second pose to move to and back, for animated figures. Same people and extra lines, in the same order. */
  motion?: { people?: Drawn[]; extra?: Stroke[]; seconds: number; tempo?: Motion['tempo'] };
}

export const figure = ({ people = [], extra = [], motion, ...rest }: FigureInput): FigureSpec => ({
  ...rest,
  strokes: [...people.flatMap((person) => person.strokes), ...extra],
  discs: people.flatMap((person) => person.discs),
  motion: motion && {
    strokes: [...(motion.people ?? []).flatMap((person) => person.strokes), ...(motion.extra ?? [])],
    discs: (motion.people ?? []).flatMap((person) => person.discs),
    seconds: motion.seconds,
    tempo: motion.tempo,
  },
});

/** Shrinks a drawn climber towards `origin`, for scenes that need more room around the body. */
export function scaled(drawn: Drawn, k: number, origin: Pt): Drawn {
  const move = (p: Pt) => add(origin, mul(sub(p, origin), k));
  return {
    strokes: drawn.strokes.map((stroke) => ({ ...stroke, pts: stroke.pts.map(move), width: stroke.width * Math.max(k, 0.85) })),
    discs: drawn.discs.map((disc) => ({ ...disc, at: move(disc.at), r: disc.r * k })),
  };
}

export const hold = (x: number, y: number, shape: Hold['shape'], extra: Partial<Hold> = {}): Hold => ({ at: [x, y], shape, ...extra });

/** The pelvis on the straight line from the neck towards the feet: a body held rigid, like a plank. */
export const pelvisToward = (neck: Pt, feet: Pt): Pt => add(neck, mul(unit(sub(feet, neck)), 22));
