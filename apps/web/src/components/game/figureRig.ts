import type { Disc, FigureSpec, Pt, Stroke } from '../skilltree/SkillFigure';
import { FLOOR, LOW_FLOOR } from '../skilltree/calisthenicsFamilies';

/**
 * The joints of a figure, and which stages fit the move it does.
 *
 * Figures are plain strokes (a closed torso, two-segment limbs) and a head
 * disc. The rig is found once, on the base pose, as indices into those lists;
 * the motion's second pose keeps the same strokes in the same order, so the
 * same rig reads the joints of either pose. That is what lets gear move with
 * the athlete.
 *
 * A stage is real equipment, so it has to suit the move: a pull-up hangs from
 * a pull-up bar or rings, a planche can be held on parallettes, a squat
 * stands on the floor, a plinth or the podium. A move with its own equipment
 * (parallel bars, a wall, a box) keeps it.
 */

export type StageKind = 'bar' | 'parallettes' | 'rings' | 'plinth' | 'podium' | 'summit';

/** bar: hangs from a bar · rings · floor: on a plain floor · fixed: keeps its own equipment. */
export type Apparatus = 'bar' | 'rings' | 'floor' | 'fixed';

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const same = (a: Pt, b: Pt) => Math.abs(a[0] - b[0]) < 0.6 && Math.abs(a[1] - b[1]) < 0.6;

const isBody = (stroke: Stroke) => stroke.tone !== 'gear' && stroke.tone !== 'ghost';

export interface Limb {
  root: Pt;
  joint: Pt;
  end: Pt;
  width: number;
}

export interface Bones {
  head: { at: Pt; r: number } | null;
  shoulders: Pt;
  hips: Pt;
  /** The two torso corners at the hips. */
  hipCorners: [Pt, Pt];
  arms: Limb[];
  legs: Limb[];
  /** The lowest point of the body. */
  floor: number;
}

export interface Rig {
  torso: number;
  /** Torso corners nearest the head (the shoulders), then farthest (the hips). */
  corners: [number, number, number, number];
  head: number | null;
  limbs: { upper: number; lower: number; arm: boolean }[];
}

export function rigOf(spec: FigureSpec): Rig | null {
  const strokes = spec.strokes;
  const torso = strokes.findIndex((stroke) => isBody(stroke) && stroke.closed && stroke.pts.length >= 4);
  if (torso < 0) return null;
  const discs = spec.discs ?? [];
  let head: number | null = null;
  discs.forEach((disc, index) => {
    if (disc.kind || disc.tone === 'ghost') return;
    if (head === null || disc.r > discs[head].r) head = index;
  });
  const pts = strokes[torso].pts;
  const at = head !== null ? discs[head].at : pts[0];
  const byHead = pts.map((_, index) => index).sort((a, b) => len(sub(pts[a], at)) - len(sub(pts[b], at)));
  const corners: Rig['corners'] = [byHead[0], byHead[1], byHead[byHead.length - 1], byHead[byHead.length - 2]];
  const shoulders = mid(pts[corners[0]], pts[corners[1]]);
  const hips = mid(pts[corners[2]], pts[corners[3]]);

  // Limbs: two open segments that meet at a joint.
  const segments = strokes
    .map((stroke, index) => ({ stroke, index }))
    .filter(({ stroke }) => isBody(stroke) && !stroke.closed && stroke.pts.length === 2 && len(sub(stroke.pts[1], stroke.pts[0])) > 1);
  const used = new Set<number>();
  const limbs: Rig['limbs'] = [];
  segments.forEach((upper) => {
    if (used.has(upper.index)) return;
    const lower = segments.find((entry) => entry.index !== upper.index && !used.has(entry.index) && same(entry.stroke.pts[0], upper.stroke.pts[1]));
    if (!lower) return;
    used.add(upper.index);
    used.add(lower.index);
    const root = upper.stroke.pts[0];
    limbs.push({ upper: upper.index, lower: lower.index, arm: len(sub(root, shoulders)) <= len(sub(root, hips)) });
  });
  return { torso, corners, head, limbs };
}

/** The joints in one pose: the base pose's strokes and discs, or the motion's. */
export function bonesAt(rig: Rig, strokes: Stroke[], discs: Disc[]): Bones {
  const pts = strokes[rig.torso].pts;
  const [a, b, c, d] = rig.corners;
  const limb = ({ upper, lower }: Rig['limbs'][number]): Limb => ({
    root: strokes[upper].pts[0],
    joint: strokes[upper].pts[1],
    end: strokes[lower].pts[1],
    width: Math.max(strokes[upper].width, strokes[lower].width),
  });
  const head = rig.head !== null ? discs[rig.head] : null;
  return {
    head: head ? { at: head.at, r: head.r } : null,
    shoulders: mid(pts[a], pts[b]),
    hips: mid(pts[c], pts[d]),
    hipCorners: [pts[c], pts[d]],
    arms: rig.limbs.filter((entry) => entry.arm).map(limb),
    legs: rig.limbs.filter((entry) => !entry.arm).map(limb),
    floor: Math.max(...strokes.filter(isBody).flatMap((stroke) => stroke.pts.map(([, y]) => y))),
  };
}

/* ---------------- what the move is done on ---------------- */

const BAR_WALL = /^M8,(-?[\d.]+) L92,\1 L92,(-?[\d.]+) L8,\2 Z$/;

/** The height of a bar drawn across the scene, if the scenery is only that bar. */
const barAcross = (wall?: string): number | null => {
  const match = wall ? BAR_WALL.exec(wall.trim()) : null;
  return match ? (Number(match[1]) + Number(match[2])) / 2 : null;
};

/** Where the floor is, for a scene that is only a floor. */
const floorLine = (spec: FigureSpec): number | null => {
  const wall = spec.wall?.trim();
  if (wall === FLOOR) return 86;
  if (wall === LOW_FLOOR) return 91;
  return null;
};

export function apparatusOf(spec: FigureSpec): Apparatus {
  const holds = spec.holds ?? [];
  if (spec.scene === 'rings') return 'rings';
  if (spec.scene === 'bar') {
    const onlyBar = (barAcross(spec.wall) !== null && holds.length === 0) || (!spec.wall?.trim() && holds.length > 0 && holds.every((hold) => hold.shape === 'bar'));
    return onlyBar ? 'bar' : 'fixed';
  }
  if ((spec.scene === 'floor' || spec.scene === 'ground') && holds.length === 0 && floorLine(spec) !== null) return 'floor';
  return 'fixed';
}

const handsDown = (bones: Bones) => bones.arms.length > 0 && bones.arms.every((arm) => arm.end[1] >= bones.floor - 2.5);

/** Whether only the hands touch the floor in this pose: a planche, an L-sit, a handstand. */
const onHandsAlone = (strokes: Stroke[], bones: Bones) => {
  if (!handsDown(bones)) return false;
  const hands = bones.arms.map((arm) => arm.end);
  const nearHand = (p: Pt) => hands.some((hand) => len(sub(p, hand)) < 4.5);
  return strokes.filter(isBody).every((stroke) => stroke.pts.every((p) => nearHand(p) || p[1] <= bones.floor - 2.5));
};

/** Each pose's strokes, discs and joints: the base pose, then the motion's. */
const posesOf = (spec: FigureSpec, rig: Rig) => {
  const list = [{ strokes: spec.strokes, discs: spec.discs ?? [] }];
  if (spec.motion) list.push({ strokes: spec.motion.strokes, discs: spec.motion.discs });
  return list.map((pose) => ({ ...pose, bones: bonesAt(rig, pose.strokes, pose.discs) }));
};

/**
 * Whether a move can be done on parallettes: the hands stay planted on the
 * floor throughout, and at some point they carry the whole body (a frog
 * stand, a planche, an L-sit, a handstand). A push-up's feet never leave the
 * floor, so it stays on the floor.
 */
export function parallettesFit(spec: FigureSpec): boolean {
  const rig = rigOf(spec);
  if (!rig) return false;
  const all = posesOf(spec, rig);
  return all.every(({ bones }) => handsDown(bones)) && all.some(({ strokes, bones }) => onHandsAlone(strokes, bones));
}

/** Which stages suit a move. The plain floor (no stage) always does: it is the move's own setting. */
export function stagesFor(spec: FigureSpec): StageKind[] {
  switch (apparatusOf(spec)) {
    case 'bar':
      return ['bar', 'rings'];
    case 'rings':
      return ['rings'];
    case 'floor':
      return parallettesFit(spec) ? ['parallettes', 'plinth', 'podium', 'summit'] : ['plinth', 'podium', 'summit'];
    default:
      return [];
  }
}

export const stageFits = (spec: FigureSpec, stage: StageKind | undefined) => !stage || stagesFor(spec).includes(stage);

/** What a move can be done on, in words, for a stage that doesn't suit it. */
export function fitText(spec: FigureSpec): string {
  switch (apparatusOf(spec)) {
    case 'bar':
      return 'Hanging moves go on a pull-up bar or rings.';
    case 'rings':
      return 'Ring moves stay on the rings.';
    case 'floor':
      return parallettesFit(spec) ? 'Holds on the hands go on the floor, parallettes, a plinth, the podium or a summit.' : 'Floor moves go on the floor, a plinth, the podium or a summit.';
    default:
      return 'This move keeps its own equipment.';
  }
}

/* ---------------- putting a move on a stage ---------------- */

const shift = (dy: number) => ({
  pt: ([x, y]: Pt): Pt => [x, y + dy],
  stroke: (stroke: Stroke): Stroke => ({ ...stroke, pts: stroke.pts.map(([x, y]) => [x, y + dy] as Pt) }),
  disc: (disc: Disc): Disc => ({ ...disc, at: [disc.at[0], disc.at[1] + dy] }),
});

/** Hands that are apart, so two hands together get one ring or one parallette. */
const apart = (hands: Pt[]) => hands.filter((hand, index) => hands.findIndex((other) => len(sub(other, hand)) < 3) === index);

const rect = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} L${x2},${y1} L${x2},${y2} L${x1},${y2} Z`;

const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0];

/**
 * A two-segment limb from `root` reaching `target` instead of `end`: the same
 * segment lengths, the joint bent to the same side as before. Out of reach,
 * the limb points straight at the target.
 */
function bendTo(root: Pt, joint: Pt, end: Pt, target: Pt): Pt {
  const a = len(sub(joint, root));
  const b = len(sub(end, joint));
  const span = sub(target, root);
  const d = len(span);
  if (d === 0 || d >= a + b || d <= Math.abs(a - b)) return [root[0] + (span[0] / Math.max(d, 0.001)) * a, root[1] + (span[1] / Math.max(d, 0.001)) * a];
  const along = (a * a - b * b + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, a * a - along * along));
  const foot: Pt = [root[0] + (span[0] * along) / d, root[1] + (span[1] * along) / d];
  const normal: Pt = [(-span[1] / d) * off, (span[0] / d) * off];
  const side = Math.sign(cross(sub(end, root), sub(joint, root))) || 1;
  const p1: Pt = [foot[0] + normal[0], foot[1] + normal[1]];
  const p2: Pt = [foot[0] - normal[0], foot[1] - normal[1]];
  return Math.sign(cross(span, sub(p1, root))) === side ? p1 : p2;
}

/** The floor a staged move stands on. */
export const RIG_FLOOR = 96;

/** One bar or upright of a stage's equipment, drawn behind the athlete. */
export interface FrameLine {
  from: Pt;
  to: Pt;
  width: number;
  tone: 'iron' | 'steel';
}

export interface Staged {
  spec: FigureSpec;
  /** The stage actually drawn: the equipped one when it suits the move, else none. */
  stage?: StageKind;
  /** Where poles and stages meet the ground. */
  ground: number;
  /** The stage's equipment: a pull-up station's uprights, parallettes. */
  frame?: FrameLine[];
  /** The station's uprights, by side, so the trophy and banner hang on them instead of on poles beside them. */
  uprights?: { left?: Upright; right?: Upright };
}

export interface Upright {
  x: number;
  /** Where the upright starts. */
  top: number;
}

/**
 * The move done on a stage. A pull-up bar adds the station the bar hangs
 * from; rings replace the bar with a ring in each hand, on straps; parallettes
 * put the hands on two handles. A plinth, the podium and a summit are drawn
 * under or behind the athlete, so the move itself is unchanged.
 */
export function stageMove(spec: FigureSpec, stage: StageKind | undefined): Staged {
  const fits = stage && stageFits(spec, stage) ? stage : undefined;
  const rig = rigOf(spec);
  const lowest = rig ? Math.max(...posesOf(spec, rig).map(({ bones }) => bones.floor)) : 84;
  const ground = floorLine(spec) ?? Math.min(97, lowest + 2.5);
  if (!fits || !rig) return { spec, stage: fits, ground };

  if (fits === 'bar') {
    const floor = [spec.wall ?? '', rect(0, RIG_FLOOR, 100, 100)].join(' ').trim();
    const y = barAcross(spec.wall);
    if (y !== null) {
      // Seen from the front: the bar on two uprights, at its ends.
      const frame: FrameLine[] = [
        { from: [9.5, y], to: [9.5, RIG_FLOOR], width: 2.4, tone: 'iron' },
        { from: [90.5, y], to: [90.5, RIG_FLOOR], width: 2.4, tone: 'iron' },
        { from: [8, y], to: [92, y], width: 3, tone: 'iron' },
      ];
      return { spec: { ...spec, wall: floor }, stage: fits, ground: RIG_FLOOR, frame, uprights: { left: { x: 9.5, top: y }, right: { x: 90.5, top: y } } };
    }
    /**
     * Seen from the side the bar is end-on, and uprights at its ends would run
     * straight through the athlete. So it is a station from the side: one
     * upright off to the side the body never swings to, an arm out to the bar
     * and a brace under it.
     */
    const all = posesOf(spec, rig).flatMap(({ strokes, discs }) => [
      ...strokes.filter(isBody).flatMap((stroke) => stroke.pts),
      ...discs.filter((disc) => !disc.kind).map((disc) => disc.at),
    ]);
    const xs = all.map(([x]) => x);
    const uprights: NonNullable<Staged['uprights']> = {};
    const frame = (spec.holds ?? []).flatMap(({ at: [x, barY] }): FrameLine[] => {
      const right = Math.max(...xs) - x <= x - Math.min(...xs);
      const post = right ? 91 : 9;
      uprights[right ? 'right' : 'left'] = { x: post, top: barY - 5 };
      return [
        { from: [post, barY - 5], to: [post, RIG_FLOOR], width: 2.6, tone: 'iron' },
        { from: [x, barY], to: [post, barY], width: 2.2, tone: 'iron' },
        { from: [x + (post - x) * 0.45, barY], to: [post, barY + 13], width: 1.6, tone: 'iron' },
      ];
    });
    return { spec: { ...spec, wall: floor }, stage: fits, ground: RIG_FLOOR, frame, uprights };
  }

  if (fits === 'rings' && apparatusOf(spec) === 'bar') {
    const [{ bones: base }, after] = posesOf(spec, rig);
    const moved = after?.bones;
    const keep = apart(base.arms.map((arm) => arm.end));
    const index = keep.map((hand) => base.arms.findIndex((arm) => arm.end === hand));
    const ringAt = (hand: Pt): Disc => ({ at: [hand[0], hand[1] - 1], r: 3.4, tone: 'body', kind: 'ring' });
    const strapTo = (anchor: number, hand: Pt): Stroke => ({ pts: [[anchor, -2], [hand[0], hand[1] - 4.4]], width: 1, tone: 'gear' });
    const handsIn = (bones: Bones) => index.map((i) => bones.arms[i].end);
    const anchors = keep.map(([x]) => x);
    return {
      spec: {
        ...spec,
        scene: 'rings',
        wall: undefined,
        holds: (spec.holds ?? []).filter((hold) => hold.shape !== 'bar'),
        strokes: [...spec.strokes, ...keep.map((hand, i) => strapTo(anchors[i], hand))],
        discs: [...(spec.discs ?? []), ...keep.map(ringAt)],
        motion: spec.motion && moved && {
          ...spec.motion,
          strokes: [...spec.motion.strokes, ...handsIn(moved).map((hand, i) => strapTo(anchors[i], hand))],
          discs: [...spec.motion.discs, ...handsIn(moved).map(ringAt)],
        },
      },
      stage: fits,
      ground,
    };
  }

  if (fits === 'parallettes') {
    const lift = 7;
    const up = shift(-lift);
    const [base, moved] = posesOf(spec, rig);
    /**
     * Hands stay on the handles in both poses. A pose on the hands alone is
     * lifted whole onto them; a pose with the feet or seat still down keeps
     * the body where it is, and the elbows bend to reach the handles.
     */
    const onHandles = ({ strokes, discs, bones }: (typeof base)) => {
      if (onHandsAlone(strokes, bones)) return { strokes: strokes.map(up.stroke), discs: discs.map(up.disc), lifted: true };
      const next = strokes.slice();
      for (const { upper, lower, arm } of rig.limbs) {
        if (!arm) continue;
        const [shoulder, elbow] = strokes[upper].pts;
        const hand = strokes[lower].pts[1];
        const target: Pt = [hand[0], hand[1] - lift];
        const bent = bendTo(shoulder, elbow, hand, target);
        next[upper] = { ...strokes[upper], pts: [shoulder, bent] };
        next[lower] = { ...strokes[lower], pts: [bent, target] };
      }
      return { strokes: next, discs, lifted: false };
    };
    const first = onHandles(base);
    const second = moved && onHandles(moved);
    // A handle under each hand (one for both, seen from the side), on two splayed legs.
    const frame = apart(base.bones.arms.map((arm) => arm.end)).flatMap(([x, y]): FrameLine[] => {
      const grip = y - lift + 2.4;
      return [
        { from: [x - 5.4, grip], to: [x - 7.4, ground], width: 1.8, tone: 'steel' },
        { from: [x + 5.4, grip], to: [x + 7.4, ground], width: 1.8, tone: 'steel' },
        { from: [x - 7, grip], to: [x + 7, grip], width: 2.4, tone: 'steel' },
      ];
    });
    const marks = first.lifted ? up.pt : (p: Pt) => p;
    return {
      spec: {
        ...spec,
        // On the handles the hands are off the floor, so no floor shadow is cast under them.
        scene: 'bars',
        strokes: first.strokes,
        discs: first.discs,
        rings: spec.rings?.map(marks),
        labels: spec.labels?.map((label) => ({ ...label, at: marks(label.at) })),
        // Arrows are paths drawn for the floor; on the handles they would point at the wrong place.
        arrows: undefined,
        motion: spec.motion && second && { ...spec.motion, strokes: second.strokes, discs: second.discs },
      },
      stage: fits,
      ground,
      frame,
    };
  }

  // A plinth or the podium stands in place of the plain floor, so it reads as a block, not a mark on the floor.
  if (fits === 'plinth' || fits === 'podium') return { spec: { ...spec, wall: undefined }, stage: fits, ground };
  return { spec, stage: fits, ground };
}
