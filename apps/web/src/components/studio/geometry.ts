import { Rig, rigOf } from '../game/figureRig';
import { motionPlay } from '../skilltree/SkillFigure';
import type { Disc, FigureSpec, Motion, Pt, Stroke } from '../skilltree/SkillFigure';
import type { FigurePatch } from '../skilltree/figureOverrides';

/**
 * The figure studio's geometry: one pose of a figure, its timing, its joints,
 * and the edits made by dragging them. Every edit keeps the strokes and discs
 * in the same order with the same number of points, so the two poses still
 * animate into each other and the rig still reads the same joints.
 */

export type PoseKey = 'start' | 'end';

export interface PoseGeo {
  strokes: Stroke[];
  discs: Disc[];
}

export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const scale = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const len = (a: Pt) => Math.hypot(a[0], a[1]);
export const dist = (a: Pt, b: Pt) => len(sub(a, b));
export const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0];
export const round2 = (value: number) => Math.round(value * 100) / 100;
const r2 = (p: Pt): Pt => [round2(p[0]), round2(p[1])];
/** Two points the drawing treats as one: the rig pairs bones by this. */
export const same = (a: Pt, b: Pt) => Math.abs(a[0] - b[0]) < 0.6 && Math.abs(a[1] - b[1]) < 0.6;

export const isBody = (stroke: Stroke) => stroke.tone !== 'gear' && stroke.tone !== 'ghost';
export const isHeld = (disc: Disc) => disc.kind === 'plate' || disc.kind === 'ring';

/* ---------------- poses ---------------- */

export const poseOf = (spec: FigureSpec, key: PoseKey): PoseGeo =>
  key === 'end' && spec.motion ? { strokes: spec.motion.strokes, discs: spec.motion.discs } : { strokes: spec.strokes, discs: spec.discs ?? [] };

export const withPose = (spec: FigureSpec, key: PoseKey, geo: PoseGeo): FigureSpec =>
  key === 'end' && spec.motion ? { ...spec, motion: { ...spec.motion, strokes: geo.strokes, discs: geo.discs } } : { ...spec, strokes: geo.strokes, discs: geo.discs };

/** One pose drawn still. */
export const stillAt = (spec: FigureSpec, key: PoseKey): FigureSpec => ({ ...spec, ...poseOf(spec, key), motion: undefined });

/** The figure part way between its poses: 0 is the start, 1 the end. */
export function frameAt(spec: FigureSpec, p: number): PoseGeo {
  const base = poseOf(spec, 'start');
  if (!spec.motion || p <= 0) return base;
  const end = poseOf(spec, 'end');
  return {
    strokes: base.strokes.map((stroke, i) => {
      const to = end.strokes[i];
      if (!to || to.pts.length !== stroke.pts.length) return stroke;
      return { ...stroke, pts: stroke.pts.map((pt, j) => lerp(pt, to.pts[j], p)) };
    }),
    discs: base.discs.map((disc, i) => (end.discs[i] ? { ...disc, at: lerp(disc.at, end.discs[i].at, p) } : disc)),
  };
}

/* ---------------- timing, as SMIL plays it ---------------- */

const bez = (t: number, a: number, b: number) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;

/** A CSS/SMIL cubic-bezier easing. */
function ease([x1, y1, x2, y2]: number[], x: number): number {
  let lo = 0;
  let hi = 1;
  let t = x;
  for (let i = 0; i < 24; i += 1) {
    const at = bez(t, x1, x2);
    if (Math.abs(at - x) < 1e-5) break;
    if (at < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return bez(t, y1, y2);
}

export interface Timing {
  seconds: number;
  keyTimes: number[];
  splines: number[][];
  /** Which pose each key time is at: 0 the start, 1 the end. */
  order: number[];
}

export function timingOf(motion?: Motion): Timing | null {
  const play = motionPlay(motion);
  if (!play || !motion) return null;
  return {
    seconds: motion.seconds,
    keyTimes: play.attrs.keyTimes.split(';').map(Number),
    splines: play.attrs.keySplines.split(';').map((spline) => spline.trim().split(/\s+/).map(Number)),
    order: play.values('0', '1').split(';').map(Number),
  };
}

/** How far between the poses the figure is at `u` (0 to 1) through its loop. */
export function progressAt(timing: Timing, u: number): number {
  const at = ((u % 1) + 1) % 1;
  const { keyTimes, splines, order } = timing;
  for (let i = 0; i < keyTimes.length - 1; i += 1) {
    if (at <= keyTimes[i + 1]) {
      const span = keyTimes[i + 1] - keyTimes[i] || 1;
      const eased = ease(splines[i], (at - keyTimes[i]) / span);
      return order[i] + (order[i + 1] - order[i]) * eased;
    }
  }
  return order[order.length - 1];
}

/** Where in the loop each pose is held still. */
export const poseTime = (timing: Timing, key: PoseKey) => (key === 'start' ? 0 : (timing.keyTimes[1] + timing.keyTimes[2]) / 2);

/* ---------------- joints ---------------- */

export interface LimbGeo {
  upper: number;
  lower: number;
  arm: boolean;
  root: Pt;
  joint: Pt;
  end: Pt;
}

export const limbGeo = (geo: PoseGeo, limb: Rig['limbs'][number]): LimbGeo => ({
  ...limb,
  root: geo.strokes[limb.upper].pts[0],
  joint: geo.strokes[limb.upper].pts[1],
  end: limb.upper === limb.lower ? geo.strokes[limb.upper].pts[2] : geo.strokes[limb.lower].pts[1],
});

export type JointKind = 'end' | 'joint' | 'shoulders' | 'hips' | 'head' | 'body';

export interface Joint {
  key: string;
  kind: JointKind;
  label: string;
  at: Pt;
  /** Index into the rig's limbs, for an end or a joint. */
  limb?: number;
}

/** "Near arm", "Far leg", "Left arm"…: far limbs are drawn darker; front views go by side of the screen. */
export function limbNames(rig: Rig, spec: FigureSpec): string[] {
  const base = poseOf(spec, 'start');
  const far = (i: number) => Boolean(base.strokes[rig.limbs[i].upper].far);
  const x = (i: number) => {
    const limb = limbGeo(base, rig.limbs[i]);
    return limb.root[0] + limb.end[0] * 0.01;
  };
  return rig.limbs.map((limb, index) => {
    const kind = limb.arm ? 'arm' : 'leg';
    const peers = rig.limbs.map((_, i) => i).filter((i) => rig.limbs[i].arm === limb.arm);
    if (peers.length < 2) return kind === 'arm' ? 'Arm' : 'Leg';
    if (peers.length === 2 && far(peers[0]) !== far(peers[1])) return `${far(index) ? 'Far' : 'Near'} ${kind}`;
    if (peers.length === 2) return `${x(index) <= x(peers.find((i) => i !== index)!) ? 'Left' : 'Right'} ${kind}`;
    return `${kind === 'arm' ? 'Arm' : 'Leg'} ${peers.indexOf(index) + 1}`;
  });
}

/** "Near arm" + "hand" → "Near hand"; "Arm 2" + "hand" → "Hand 2". */
export function partLabel(limbName: string, part: string): string {
  const match = /^(.*?)\s*(?:arm|leg|Arm|Leg)(\s\d+)?$/.exec(limbName);
  const prefix = match?.[1] ?? '';
  const number = match?.[2] ?? '';
  return `${prefix ? `${prefix} ${part}` : part[0].toUpperCase() + part.slice(1)}${number}`;
}

const PART = { arm: { joint: 'elbow', end: 'hand' }, leg: { joint: 'knee', end: 'foot' } };

export function jointsOf(rig: Rig, names: string[], geo: PoseGeo): Joint[] {
  const torso = geo.strokes[rig.torso].pts;
  const [a, b, c, d] = rig.corners;
  const joints: Joint[] = [];
  rig.limbs.forEach((limb, index) => {
    const at = limbGeo(geo, limb);
    const part = PART[limb.arm ? 'arm' : 'leg'];
    joints.push({ key: `joint:${index}`, kind: 'joint', label: partLabel(names[index], part.joint), at: at.joint, limb: index });
    joints.push({ key: `end:${index}`, kind: 'end', label: partLabel(names[index], part.end), at: at.end, limb: index });
  });
  joints.push({ key: 'shoulders', kind: 'shoulders', label: 'Shoulders', at: mid(torso[a], torso[b]) });
  joints.push({ key: 'hips', kind: 'hips', label: 'Hips', at: mid(torso[c], torso[d]) });
  if (rig.head !== null && geo.discs[rig.head]) joints.push({ key: 'head', kind: 'head', label: 'Head', at: geo.discs[rig.head].at });
  const centre = torso.reduce<Pt>((sum, p) => add(sum, scale(p, 1 / torso.length)), [0, 0]);
  joints.push({ key: 'body', kind: 'body', label: 'Whole body', at: centre });
  return joints;
}

/* ---------------- dragging ---------------- */

export interface DragOptions {
  /** Keep bone lengths: elbows and knees re-solve when a hand, foot, shoulder or hip moves. */
  ik: boolean;
  /** Plates, rings and straps held in a hand move with it. */
  carry: boolean;
}

const copy = (geo: PoseGeo): PoseGeo => ({ strokes: geo.strokes.map((s) => ({ ...s, pts: s.pts.slice() })), discs: geo.discs.map((d) => ({ ...d })) });

/** The elbow or knee for bones `a` and `b` from `root` to `target`, bent to `side` like before. */
function solve(root: Pt, a: number, b: number, target: Pt, side: number): Pt {
  const span = sub(target, root);
  const d = len(span);
  if (d < 1e-6) return add(root, [0, a]);
  if (d >= a + b) return add(root, scale(span, a / d));
  const along = (a * a - b * b + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, a * a - along * along));
  const foot = add(root, scale(span, along / d));
  const normal: Pt = [(-span[1] / d) * off, (span[0] / d) * off];
  const p1 = add(foot, normal);
  const p2 = sub(foot, normal);
  return Math.sign(cross(span, sub(p1, root))) === side ? p1 : p2;
}

const sideOf = (root: Pt, joint: Pt, end: Pt) => Math.sign(cross(sub(end, root), sub(joint, root))) || 1;

/** A target the limb can reach without stretching. */
function reachable(root: Pt, a: number, b: number, target: Pt): Pt {
  const span = sub(target, root);
  const d = len(span);
  const most = a + b - 0.02;
  const least = Math.abs(a - b) + 0.02;
  if (d > most) return add(root, scale(span, most / d));
  if (d < least && d > 1e-6) return add(root, scale(span, least / d));
  return target;
}

function setLimb(geo: PoseGeo, limb: LimbGeo, root: Pt, joint: Pt, end: Pt) {
  const upper = geo.strokes[limb.upper];
  if (limb.upper === limb.lower) {
    const delta = sub(end, upper.pts[2]);
    upper.pts = [root, joint, end, ...upper.pts.slice(3).map((p) => add(p, delta))];
  } else {
    upper.pts = [root, joint];
    geo.strokes[limb.lower].pts = [joint, end];
  }
}

/** Every other point of the pose that sits on `from` follows it to `to`; a foot drawn from the ankle moves whole. */
function follow(geo: PoseGeo, rig: Rig, skip: Set<number>, from: Pt, to: Pt) {
  const delta = sub(to, from);
  geo.strokes.forEach((stroke, index) => {
    if (skip.has(index) || index === rig.torso || !isBody(stroke)) return;
    if (stroke.pts.length === 2 && same(stroke.pts[0], from) && !rig.limbs.some((l) => l.upper === index || l.lower === index)) {
      stroke.pts = stroke.pts.map((p) => add(p, delta));
      return;
    }
    stroke.pts = stroke.pts.map((p) => (same(p, from) ? to : p));
  });
}

/** What a hand holds — plates, rings, the end of a strap or cable — moves with it. */
function carry(geo: PoseGeo, from: Pt, delta: Pt) {
  geo.discs.forEach((disc) => {
    if (isHeld(disc) && dist(disc.at, from) <= disc.r + 3) disc.at = add(disc.at, delta);
  });
  geo.strokes.forEach((stroke) => {
    if (stroke.tone === 'gear') stroke.pts = stroke.pts.map((p) => (dist(p, from) <= 6 ? add(p, delta) : p));
  });
}

export function dragJoint(rig: Rig, start: PoseGeo, joint: Joint, target: Pt, options: DragOptions): PoseGeo {
  const geo = copy(start);
  const torso = geo.strokes[rig.torso];

  if (joint.kind === 'end' || joint.kind === 'joint') {
    const limb = limbGeo(start, rig.limbs[joint.limb!]);
    const skip = new Set([limb.upper, limb.lower]);
    if (joint.kind === 'joint') {
      setLimb(geo, limb, limb.root, target, limb.end);
      follow(geo, rig, skip, limb.joint, target);
      return geo;
    }
    const a = dist(limb.joint, limb.root);
    const b = dist(limb.end, limb.joint);
    const end = options.ik ? reachable(limb.root, a, b, target) : target;
    const bent = options.ik ? solve(limb.root, a, b, end, sideOf(limb.root, limb.joint, limb.end)) : limb.joint;
    setLimb(geo, limb, limb.root, bent, end);
    follow(geo, rig, skip, limb.end, end);
    if (options.carry && limb.arm) carry(geo, limb.end, sub(end, limb.end));
    return geo;
  }

  if (joint.kind === 'shoulders' || joint.kind === 'hips') {
    const delta = sub(target, joint.at);
    const arms = joint.kind === 'shoulders';
    const corners = arms ? [rig.corners[0], rig.corners[1]] : [rig.corners[2], rig.corners[3]];
    const moved: Pt[] = corners.map((i) => start.strokes[rig.torso].pts[i]);
    corners.forEach((i) => (torso.pts[i] = add(torso.pts[i], delta)));
    rig.limbs.forEach((entry) => {
      if (entry.arm !== arms) return;
      const limb = limbGeo(start, entry);
      moved.push(limb.root);
      const root = add(limb.root, delta);
      if (!options.ik) {
        setLimb(geo, limb, root, limb.joint, limb.end);
        return;
      }
      const a = dist(limb.joint, limb.root);
      const b = dist(limb.end, limb.joint);
      const end = reachable(root, a, b, limb.end);
      setLimb(geo, limb, root, solve(root, a, b, end, sideOf(limb.root, limb.joint, limb.end)), end);
      if (!same(end, limb.end)) {
        follow(geo, rig, new Set([limb.upper, limb.lower]), limb.end, end);
        if (options.carry && limb.arm) carry(geo, limb.end, sub(end, limb.end));
      }
    });
    if (arms) {
      // The head and a neck line go with the shoulders.
      if (rig.head !== null) geo.discs[rig.head].at = add(geo.discs[rig.head].at, delta);
      geo.strokes.forEach((stroke, index) => {
        if (index === rig.torso || !isBody(stroke) || rig.limbs.some((l) => l.upper === index || l.lower === index)) return;
        if (moved.some((p) => same(stroke.pts[0], p)) || same(stroke.pts[0], joint.at)) stroke.pts = start.strokes[index].pts.map((p) => add(p, delta));
      });
    }
    return geo;
  }

  if (joint.kind === 'head') {
    const neck = mid(start.strokes[rig.torso].pts[rig.corners[0]], start.strokes[rig.torso].pts[rig.corners[1]]);
    if (rig.head !== null) geo.discs[rig.head].at = target;
    // A neck line (gym and climbing figures) reaches half way to the head.
    geo.strokes.forEach((stroke, index) => {
      if (isBody(stroke) && stroke.pts.length === 2 && same(stroke.pts[0], neck) && !rig.limbs.some((l) => l.upper === index || l.lower === index)) {
        stroke.pts = [stroke.pts[0], lerp(stroke.pts[0], target, 0.5)];
      }
    });
    return geo;
  }

  // The whole body, and what it holds.
  const delta = sub(target, joint.at);
  geo.strokes.forEach((stroke) => {
    if (isBody(stroke)) stroke.pts = stroke.pts.map((p) => add(p, delta));
  });
  geo.discs.forEach((disc) => {
    if (disc.tone !== 'ghost') disc.at = add(disc.at, delta);
  });
  if (options.carry) {
    const hands = rig.limbs.filter((l) => l.arm).map((l) => limbGeo(start, l).end);
    geo.strokes.forEach((stroke, index) => {
      if (stroke.tone === 'gear') stroke.pts = start.strokes[index].pts.map((p) => (hands.some((hand) => dist(p, hand) <= 6) ? add(p, delta) : p));
    });
  }
  return geo;
}

/** The elbow or knee folded the other way, the hand or foot where it was. */
export function flipBend(rig: Rig, start: PoseGeo, limbIndex: number): PoseGeo {
  const geo = copy(start);
  const limb = limbGeo(start, rig.limbs[limbIndex]);
  const axis = sub(limb.end, limb.root);
  const d = len(axis) || 1;
  const u: Pt = [axis[0] / d, axis[1] / d];
  const rel = sub(limb.joint, limb.root);
  const along = rel[0] * u[0] + rel[1] * u[1];
  const foot = add(limb.root, scale(u, along));
  const mirrored = sub(scale(foot, 2), limb.joint);
  setLimb(geo, limb, limb.root, mirrored, limb.end);
  follow(geo, rig, new Set([limb.upper, limb.lower]), limb.joint, mirrored);
  return geo;
}

/* ---------------- single points ---------------- */

export type PointRef =
  | { type: 'stroke'; index: number; point: number }
  | { type: 'disc'; index: number }
  | { type: 'hold'; index: number }
  | { type: 'wall'; index: number };

export const refKey = (ref: PointRef) => (ref.type === 'stroke' ? `s${ref.index}.${ref.point}` : `${ref.type[0]}${ref.index}`);

/* The wall as editable points: only paths of M, L, Q, C, S, T and Z. */
type PathPart = { cmd: string; pts: Pt[] };

export function parseWall(d?: string): PathPart[] | null {
  if (!d?.trim()) return null;
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const parts: PathPart[] = [];
  let current: PathPart | null = null;
  let pending: number[] = [];
  for (const token of tokens) {
    if (/[A-Za-z]/.test(token)) {
      if (!/[MLQCSTZ]/.test(token)) return null;
      current = { cmd: token, pts: [] };
      parts.push(current);
      pending = [];
    } else if (current) {
      pending.push(Number(token));
      if (pending.length === 2) {
        current.pts.push([pending[0], pending[1]]);
        pending = [];
      }
    }
  }
  return parts;
}

const num = (value: number) => String(round2(value));
export const wallPath = (parts: PathPart[]) =>
  parts.map((part) => (part.cmd === 'Z' ? 'Z' : `${part.cmd}${part.pts.map(([x, y]) => `${num(x)},${num(y)}`).join(' ')}`)).join(' ');

export const wallPoints = (d?: string): Pt[] => (parseWall(d) ?? []).flatMap((part) => part.pts);

export function pointAt(spec: FigureSpec, key: PoseKey, ref: PointRef): Pt | null {
  const geo = poseOf(spec, key);
  if (ref.type === 'stroke') return geo.strokes[ref.index]?.pts[ref.point] ?? null;
  if (ref.type === 'disc') return geo.discs[ref.index]?.at ?? null;
  if (ref.type === 'hold') return spec.holds?.[ref.index]?.at ?? null;
  return wallPoints(spec.wall)[ref.index] ?? null;
}

/** One point moved. `linked`: every point of the pose sitting on it moves too, so bones stay joined. */
export function dragPoint(spec: FigureSpec, key: PoseKey, ref: PointRef, target: Pt, linked: boolean): FigureSpec {
  if (ref.type === 'hold') return { ...spec, holds: spec.holds?.map((hold, i) => (i === ref.index ? { ...hold, at: target } : hold)) };
  if (ref.type === 'wall') {
    const parts = parseWall(spec.wall);
    if (!parts) return spec;
    let seen = 0;
    for (const part of parts) {
      for (let i = 0; i < part.pts.length; i += 1, seen += 1) if (seen === ref.index) part.pts[i] = target;
    }
    return { ...spec, wall: wallPath(parts) };
  }
  const geo = copy(poseOf(spec, key));
  if (ref.type === 'disc') {
    geo.discs[ref.index].at = target;
    return withPose(spec, key, geo);
  }
  const from = geo.strokes[ref.index].pts[ref.point];
  geo.strokes.forEach((stroke, index) => {
    stroke.pts = stroke.pts.map((p, j) => ((index === ref.index && j === ref.point) || (linked && same(p, from)) ? target : p));
  });
  return withPose(spec, key, geo);
}

/** Strokes the rig reads as the torso or a limb: their points can move, but not be added or removed. */
export const rigStrokes = (rig: Rig | null) => new Set(rig ? [rig.torso, ...rig.limbs.flatMap((l) => [l.upper, l.lower])] : []);

const both = (spec: FigureSpec, change: (pts: Pt[]) => Pt[], index: number): FigureSpec => {
  const base = spec.strokes.map((s, i) => (i === index ? { ...s, pts: change(s.pts) } : s));
  return {
    ...spec,
    strokes: base,
    motion: spec.motion && { ...spec.motion, strokes: spec.motion.strokes.map((s, i) => (i === index ? { ...s, pts: change(s.pts) } : s)) },
  };
};

/** A new point half way to the next one, added in both poses so they keep the same shape list. */
export const insertPoint = (spec: FigureSpec, index: number, after: number) =>
  both(spec, (pts) => {
    const next = pts[after + 1] ?? pts[after - 1] ?? pts[after];
    return [...pts.slice(0, after + 1), mid(pts[after], next), ...pts.slice(after + 1)];
  }, index);

export const removePoint = (spec: FigureSpec, index: number, at: number) => both(spec, (pts) => (pts.length > 2 ? pts.filter((_, i) => i !== at) : pts), index);

/* ---------------- patches ---------------- */

const samePts = (a: Pt[], b: Pt[]) => a.length === b.length && a.every((p, i) => Math.abs(p[0] - b[i][0]) < 0.005 && Math.abs(p[1] - b[i][1]) < 0.005);

/** What changed between the built figure and the edited one, as a fix to save. Null when nothing did. */
export function diffPatch(built: FigureSpec, edited: FigureSpec, fingerprint: string, note?: string): FigurePatch | null {
  const patch: FigurePatch = { fingerprint };
  const strokes = (from: Stroke[], to: Stroke[]) => {
    const out: Record<string, Pt[]> = {};
    to.forEach((stroke, i) => {
      if (from[i] && !samePts(from[i].pts, stroke.pts)) out[i] = stroke.pts.map(r2);
    });
    return Object.keys(out).length ? out : undefined;
  };
  const centres = <T extends { at: Pt }>(from: T[] = [], to: T[] = []) => {
    const out: Record<string, Pt> = {};
    to.forEach((item, i) => {
      if (from[i] && !samePts([from[i].at], [item.at])) out[i] = r2(item.at);
    });
    return Object.keys(out).length ? out : undefined;
  };
  patch.strokes = strokes(built.strokes, edited.strokes);
  patch.discs = centres(built.discs, edited.discs);
  if (built.motion && edited.motion) {
    patch.motionStrokes = strokes(built.motion.strokes, edited.motion.strokes);
    patch.motionDiscs = centres(built.motion.discs, edited.motion.discs);
  }
  patch.holds = centres(built.holds, edited.holds);
  if ((edited.wall ?? '') !== (built.wall ?? '')) patch.wall = edited.wall;
  if (note?.trim()) patch.note = note.trim();
  const clean = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as FigurePatch;
  return Object.keys(clean).length > 1 ? clean : null;
}

export { rigOf };

/* ---------------- one entry point for every handle ---------------- */

export type EditMode = 'joints' | 'points';

export function parseRef(key: string): PointRef | null {
  const stroke = /^s(\d+)\.(\d+)$/.exec(key);
  if (stroke) return { type: 'stroke', index: Number(stroke[1]), point: Number(stroke[2]) };
  const other = /^([dhw])(\d+)$/.exec(key);
  if (!other) return null;
  const type = ({ d: 'disc', h: 'hold', w: 'wall' } as const)[other[1] as 'd' | 'h' | 'w'];
  return { type, index: Number(other[2]) };
}

/** Where a handle is in a pose, by its key: a joint ("end:0", "hips") or a point ("s3.1", "h0"). */
export function handleAt(spec: FigureSpec, rig: Rig | null, names: string[], pose: PoseKey, key: string): Pt | null {
  const ref = parseRef(key);
  if (ref) return pointAt(spec, pose, ref);
  if (!rig) return null;
  return jointsOf(rig, names, poseOf(spec, pose)).find((joint) => joint.key === key)?.at ?? null;
}

/** Moves a handle to `target` in one pose. `linked`: points sitting on the moved one go with it. */
export function moveHandle(spec: FigureSpec, rig: Rig | null, names: string[], pose: PoseKey, key: string, target: Pt, options: DragOptions, linked = true): FigureSpec {
  const ref = parseRef(key);
  if (ref) return dragPoint(spec, pose, ref, target, linked);
  if (!rig) return spec;
  const joint = jointsOf(rig, names, poseOf(spec, pose)).find((entry) => entry.key === key);
  if (!joint) return spec;
  return withPose(spec, pose, dragJoint(rig, poseOf(spec, pose), joint, target, options));
}
