import saved from '../../data/propTuning.json';

/**
 * The sizes and shapes of every prop and worn piece: the gear on the figure,
 * the trophy, banner and stages behind it, the plates, rings and bars in its
 * hands, the holds on the wall. The numbers here are the drawings' defaults;
 * `data/propTuning.json` holds the refinements made in the figure studio
 * (only the numbers that differ), and is merged over them.
 *
 * Lengths are in the figures' 100 × 100 box. Fractions (`joint`, `endFrom`…)
 * are how far along a bone a piece sits, 0 at its start and 1 at its end.
 */

type P = readonly [number, number];

export interface PropTuning {
  /** The page-colour outline every worn piece gets, so it reads on any body colour. */
  outline: { strap: number; piece: number };
  /** Sleeves on the joints: how much wider than the limb, and where along the bones they sit. */
  sleeve: { pad: number; joint: number; endFrom: number; endTo: number; rootFrom: number; rootTo: number };
  /** Finger tape: a disc on the hand, as a share of the forearm's width. */
  finger: { r: number };
  /** The belt: how far above the hips, its width, and the buckle's size. */
  belt: { lift: number; width: number; buckle: number };
  /** The chalk bag at the back of the belt: how far past the belt's end, how low, its size. */
  bag: { along: number; drop: number; w: number; h: number; rx: number };
  /** The headband: how far up the head (a share of its radius), its width, how far past the head it runs. */
  headband: { offset: number; width: number; overhang: number };
  /** The trophy pennant: where its pole stands, the lowest it hangs from, its size. */
  trophy: { x: number; minTop: number; w: number; h: number; pole: number };
  /** The banner: where its pole stands, the lowest it hangs from, its size and the notch in its tail. */
  banner: { x: number; minTop: number; w: number; h: number; notch: number; pole: number };
  /** The summit: where its foot meets the ground at each side, and its three peaks. */
  summit: { left: number; right: number; peaks: P[]; edge: number };
  plinth: { x: number; w: number; trim: number };
  /** The podium: the centre block's width, the side blocks' width, how much lower second and third stand. */
  podium: { centre: number; side: number; second: number; third: number; trim: number };
  /**
   * The pull-up station. Front: two uprights at the bar's ends. Side: one
   * upright `inset` from the edge, `above` the bar, an arm out to the bar and
   * a brace under it that starts `braceAt` of the way along the arm.
   */
  station: { frontInset: number; frontPost: number; frontBar: number; inset: number; above: number; post: number; arm: number; braceAt: number; braceDrop: number; brace: number };
  /** Parallettes: how far they lift the hands, the handle's half-length, how far the legs splay, the widths. */
  parallettes: { lift: number; half: number; splay: number; leg: number; handle: number; grip: number };
  /** Rings swapped in for a bar: size, how far below the hand, the strap. Line width for every gymnastic ring. */
  rings: { r: number; drop: number; strap: number; gap: number; stroke: number };
  /** Weight plates and dumbbell ends: the rim's line, the hub as a share of the radius and its smallest size. */
  plate: { stroke: number; hub: number; hubMin: number };
  /** A bar seen end-on, gripped: its radius and line. */
  bar: { r: number; stroke: number };
  /** Climbing holds, in their own units before a figure scales or turns them. */
  holds: {
    jug: { rx: number; ry: number };
    edge: { w: number; h: number };
    sloper: { w: number; h: number };
    pinch: { w: number; h: number };
    pocket: { r: number; hole: number };
    foot: { r: number };
    volume: { w: number; h: number };
    rung: { w: number; h: number };
    end: { r: number };
  };
}

export const PROP_DEFAULTS: PropTuning = {
  outline: { strap: 1.6, piece: 1.1 },
  sleeve: { pad: 0.8, joint: 0.16, endFrom: 0.8, endTo: 0.96, rootFrom: 0.12, rootTo: 0.32 },
  finger: { r: 0.75 },
  belt: { lift: 2.4, width: 3.2, buckle: 3.2 },
  bag: { along: 1.15, drop: 2.5, w: 4.4, h: 5.2, rx: 1.2 },
  headband: { offset: 0.38, width: 2.2, overhang: 0.6 },
  trophy: { x: 5, minTop: 38, w: 16, h: 11, pole: 1.4 },
  banner: { x: 95, minTop: 30, w: 12, h: 20, notch: 4, pole: 1.4 },
  summit: { left: 4, right: 96, peaks: [[30, 34], [42, 50], [58, 22]], edge: 1.4 },
  plinth: { x: 14, w: 72, trim: 1.6 },
  podium: { centre: 36, side: 28, second: 4, third: 6.5, trim: 1.6 },
  station: { frontInset: 9.5, frontPost: 2.4, frontBar: 3, inset: 9, above: 5, post: 2.6, arm: 2.2, braceAt: 0.45, braceDrop: 13, brace: 1.6 },
  parallettes: { lift: 7, half: 5.4, splay: 2, leg: 1.8, handle: 2.4, grip: 2.4 },
  rings: { r: 3.4, drop: 1, strap: 1, gap: 4.4, stroke: 1.6 },
  plate: { stroke: 1.4, hub: 0.22, hubMin: 0.9 },
  bar: { r: 2.6, stroke: 1.4 },
  holds: {
    jug: { rx: 5, ry: 3 },
    edge: { w: 9, h: 2.4 },
    sloper: { w: 13, h: 6.4 },
    pinch: { w: 3.8, h: 9.6 },
    pocket: { r: 3.2, hole: 1.4 },
    foot: { r: 1.8 },
    volume: { w: 20, h: 13 },
    rung: { w: 24, h: 2.6 },
    end: { r: 2.4 },
  },
};

/** A sparse set of changes: any group, any number in it. Peaks are replaced whole. */
export type PropChanges = Record<string, unknown>;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The defaults with the changes laid over them. Unknown keys and non-numbers are ignored. */
export function withChanges(changes: unknown, base: PropTuning = PROP_DEFAULTS): PropTuning {
  const merge = (into: unknown, over: unknown): unknown => {
    if (Array.isArray(into)) return Array.isArray(over) && over.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)) ? over : into;
    if (isObject(into)) {
      if (!isObject(over)) return into;
      const out: Record<string, unknown> = { ...into };
      for (const key of Object.keys(into)) if (key in over) out[key] = merge(into[key], over[key]);
      return out;
    }
    return typeof over === 'number' && Number.isFinite(over) ? over : into;
  };
  return merge(base, changes) as PropTuning;
}

/** Only what differs from the defaults, for saving. */
export function changesOf(tuning: PropTuning, base: PropTuning = PROP_DEFAULTS): PropChanges {
  const diff = (now: unknown, was: unknown): unknown => {
    if (Array.isArray(now)) return JSON.stringify(now) === JSON.stringify(was) ? undefined : now;
    if (isObject(now) && isObject(was)) {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(now)) {
        const changed = diff(now[key], was[key]);
        if (changed !== undefined) out[key] = changed;
      }
      return Object.keys(out).length ? out : undefined;
    }
    return now === was ? undefined : now;
  };
  return (diff(tuning, base) as PropChanges) ?? {};
}

/** What the app draws with: the defaults and the saved refinements. */
export const PROP_TUNING: PropTuning = withChanges(saved);
