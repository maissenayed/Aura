import saved from '../../data/figureOverrides.json';
import type { Disc, FigureSpec, Hold, Pt, Stroke } from './SkillFigure';

/**
 * Hand fixes to single figures, made in the figure studio and saved in
 * `data/figureOverrides.json`. A figure is built by its family (or by hand)
 * and then the fix for its id is laid over it: whole point lists for the
 * strokes it changes, new centres for discs and holds, a new wall.
 *
 * Every fix remembers the figure it was made on (a fingerprint of its
 * points). When the builder changes, the fingerprint no longer matches and the
 * fix is left out rather than laid over a different drawing; the studio shows
 * it as stale.
 */

export interface FigurePatch {
  /** The figure as built when the fix was made. */
  fingerprint: string;
  /** Stroke index → its points, in the base pose. */
  strokes?: Record<string, Pt[]>;
  /** Disc index → its centre, in the base pose. */
  discs?: Record<string, Pt>;
  /** The same, for the motion's second pose. */
  motionStrokes?: Record<string, Pt[]>;
  motionDiscs?: Record<string, Pt>;
  /** Hold index → its centre; holds are the scene's, shared by both poses. */
  holds?: Record<string, Pt>;
  wall?: string;
  /** What was wrong, in words. */
  note?: string;
}

export const SAVED_PATCHES = saved as Record<string, FigurePatch>;

/** A short hash of everything a fix can touch, rounded so a last-digit difference between runtimes doesn't matter. */
export function fingerprintOf(spec: FigureSpec): string {
  const parts: (number | string)[] = [];
  const pts = (list: readonly Pt[]) => list.forEach(([x, y]) => parts.push(Math.round(x * 10), Math.round(y * 10)));
  const strokes = (list: Stroke[]) => list.forEach((stroke) => (parts.push('s', stroke.pts.length), pts(stroke.pts)));
  const discs = (list: Disc[] = []) => list.forEach((disc) => (parts.push('d'), pts([disc.at]), parts.push(Math.round(disc.r * 10))));
  strokes(spec.strokes);
  discs(spec.discs);
  if (spec.motion) {
    parts.push('m');
    strokes(spec.motion.strokes);
    discs(spec.motion.discs);
  }
  (spec.holds ?? []).forEach((hold: Hold) => (parts.push('h'), pts([hold.at])));
  parts.push('w', spec.wall ?? '');
  // FNV-1a, 32 bits.
  let hash = 0x811c9dc5;
  for (const char of parts.join(',')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

const withPts = <T extends { pts: Pt[] }>(list: T[], fix?: Record<string, Pt[]>): T[] =>
  fix ? list.map((item, index) => (fix[index] ? { ...item, pts: fix[index] } : item)) : list;
const withAt = <T extends { at: Pt }>(list: T[], fix?: Record<string, Pt>): T[] =>
  fix ? list.map((item, index) => (fix[index] ? { ...item, at: fix[index] } : item)) : list;

/** The figure with a fix laid over it, whether or not the fingerprint matches. */
export function applyPatch(spec: FigureSpec, patch: FigurePatch): FigureSpec {
  return {
    ...spec,
    wall: patch.wall ?? spec.wall,
    holds: spec.holds && withAt(spec.holds, patch.holds),
    strokes: withPts(spec.strokes, patch.strokes),
    discs: spec.discs && withAt(spec.discs, patch.discs),
    motion: spec.motion && {
      ...spec.motion,
      strokes: withPts(spec.motion.strokes, patch.motionStrokes),
      discs: withAt(spec.motion.discs, patch.motionDiscs),
    },
  };
}

/** Whether a fix was made on this very drawing. */
export const patchFits = (spec: FigureSpec, patch: FigurePatch | undefined) => Boolean(patch) && patch.fingerprint === fingerprintOf(spec);

/** The figure as the app draws it: with its saved fix, when the fix still fits. */
export function patched(id: string, spec: FigureSpec): FigureSpec {
  const patch = SAVED_PATCHES[id];
  return patch && patchFits(spec, patch) ? applyPatch(spec, patch) : spec;
}
