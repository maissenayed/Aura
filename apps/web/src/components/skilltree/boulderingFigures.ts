import { Arrow, Disc, FigureSpec, Hold, Pt, Stroke, Tone, WallAngle } from './SkillFigure';

/**
 * One illustration per bouldering skill, drawn by `SkillFigure`.
 *
 * A climber is described by where its hands, feet, neck and pelvis are; the
 * elbows and knees are worked out from limb lengths (two-bone IK), with `bend`
 * saying which way they fold. Front views look at the climber's back (the
 * wall is behind the figure); side views put the wall on the left.
 */

type Limb = 'lArm' | 'rArm' | 'lLeg' | 'rLeg';
type Part = Limb | 'torso' | 'head';
type Bend = 'out' | 'in' | 'up' | 'down' | 'left' | 'right';

interface Pose {
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

interface Drawn {
  strokes: Stroke[];
  discs: Disc[];
}

const UPPER_ARM = 11.5;
const FOREARM = 11;
const THIGH = 15;
const SHIN = 14.5;

const ALL: Part[] = ['lArm', 'rArm', 'lLeg', 'rLeg', 'torso', 'head'];

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const unit = (a: Pt): Pt => {
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

function climber(pose: Pose, focus: Part[] = [], ghost = false): Drawn {
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

interface FigureInput {
  angle: WallAngle;
  wall?: string;
  holds?: Hold[];
  people?: Drawn[];
  /** Hands drawn close up, and other one-off lines. */
  extra?: Stroke[];
  arrows?: Arrow[];
  rings?: Pt[];
  labels?: { at: Pt; text: string }[];
}

const figure = ({ people = [], extra = [], ...rest }: FigureInput): FigureSpec => ({
  ...rest,
  strokes: [...people.flatMap((person) => person.strokes), ...extra],
  discs: people.flatMap((person) => person.discs),
});

/** Shrinks a drawn climber towards `origin`, for scenes that need more room around the body. */
function scaled(drawn: Drawn, k: number, origin: Pt): Drawn {
  const move = (p: Pt) => add(origin, mul(sub(p, origin), k));
  return {
    strokes: drawn.strokes.map((stroke) => ({ ...stroke, pts: stroke.pts.map(move), width: stroke.width * Math.max(k, 0.85) })),
    discs: drawn.discs.map((disc) => ({ ...disc, at: move(disc.at), r: disc.r * k })),
  };
}

/* ------------------------------------------------------------------ */
/* Scenery                                                             */
/* ------------------------------------------------------------------ */

const hold = (x: number, y: number, shape: Hold['shape'], extra: Partial<Hold> = {}): Hold => ({ at: [x, y], shape, ...extra });

/** Overhanging wall seen from the side: x of the surface at height y. */
const steep = (y: number) => 70 - 0.5 * y;
const STEEP_WALL = 'M0,0 L70,0 L20,100 L0,100 Z';

/** A 45° wall seen from the side. */
const steeper = (y: number) => 78 - 0.7 * y;
const STEEPER_WALL = 'M0,0 L78,0 L8,100 L0,100 Z';

/** A slab seen from the side. */
const slab = (y: number) => 26 + 0.34 * y;
const SLAB_WALL = 'M0,0 L26,0 L60,100 L0,100 Z';
const SLAB_TOE: Pt = [-0.32, -0.95];

const FLOOR = 'M0,93 L100,93 L100,100 L0,100 Z';
const PAD = 'M6,86 L94,86 L96,93 L4,93 Z';

/* ------------------------------------------------------------------ */
/* Hands, for the grip skills                                          */
/* ------------------------------------------------------------------ */

/** A hand in profile: the forearm and the back of the hand, then the fingers. */
function handInProfile(fingers: Pt[], wrist: Pt, knuckle: Pt, thumb?: Pt[], focusThumb = false): Stroke[] {
  const strokes: Stroke[] = [
    { pts: [[wrist[0] + 14, 104], wrist], width: 9, tone: 'body' },
    { pts: [wrist, knuckle], width: 7, tone: 'body' },
    { pts: [knuckle, ...fingers], width: 3.6, tone: 'focus' },
  ];
  if (thumb) strokes.push({ pts: thumb, width: 3.4, tone: focusThumb ? 'focus' : 'body' });
  return strokes;
}

/* ------------------------------------------------------------------ */
/* The figures                                                         */
/* ------------------------------------------------------------------ */

const FIGURES: Record<string, FigureSpec> = {
  /* Technique ------------------------------------------------------- */

  'silent-feet': figure({
    angle: 'vertical',
    holds: [hold(41, 15, 'jug'), hold(60, 18, 'jug'), hold(43, 88.5, 'foot'), hold(63, 76, 'foot', { key: true })],
    people: [
      climber(
        { neck: [50, 36], pelvis: [50, 58], lHand: [41, 16], rHand: [60, 19], lFoot: [43, 86.5], rFoot: [62.5, 68], head: [52, 30.5] },
        ['rLeg'],
      ),
    ],
    arrows: [{ d: 'M70,62 Q72,70 66.5,74.5' }],
    rings: [[63, 76]],
  }),

  edging: figure({
    angle: 'vertical',
    holds: [hold(41, 15, 'jug'), hold(59, 15, 'jug'), hold(37, 87, 'edge', { size: 0.8 }), hold(65, 80, 'edge', { key: true, size: 0.8 })],
    people: [
      climber(
        { neck: [50, 36], pelvis: [50, 58], lHand: [41, 16], rHand: [59, 16], lFoot: [39, 85], rFoot: [62, 78], lToe: [-1, 0.05], rToe: [1, 0.08] },
        ['rLeg'],
      ),
    ],
    rings: [[65, 79]],
  }),

  smearing: figure({
    angle: 'slab',
    wall: SLAB_WALL,
    people: [
      climber(
        {
          neck: [62, 33],
          pelvis: [64, 56],
          lHand: [slab(36) + 1, 36],
          rHand: [slab(47) + 1, 47],
          lFoot: [slab(70) + 1.2, 70],
          rFoot: [slab(87) + 1.2, 87],
          lToe: SLAB_TOE,
          rToe: SLAB_TOE,
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'down' },
        },
        ['lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M66,82 L59.5,84.5', kind: 'force' }],
    rings: [[55.5, 84]],
  }),

  'high-step': figure({
    angle: 'vertical',
    holds: [hold(42, 17, 'jug'), hold(58, 13, 'jug'), hold(43, 87.5, 'foot'), hold(65, 61, 'foot', { key: true })],
    people: [
      climber(
        { neck: [49, 39], pelvis: [51, 61], lHand: [42, 18], rHand: [58, 14], lFoot: [43, 85.5], rFoot: [64.5, 58.5], bend: { rLeg: 'up' } },
        ['rLeg'],
      ),
    ],
    rings: [[65, 60.5]],
  }),

  'slab-friction': figure({
    angle: 'slab',
    wall: SLAB_WALL,
    people: [
      climber(
        {
          neck: [60, 34],
          pelvis: [63, 57],
          lHand: [slab(48) + 1, 48],
          rHand: [slab(58) + 1, 58],
          lFoot: [slab(68) + 1.2, 68],
          rFoot: [slab(90) + 1.2, 90],
          lToe: SLAB_TOE,
          rToe: SLAB_TOE,
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'down' },
        },
        ['torso', 'lLeg'],
      ),
    ],
    arrows: [{ d: 'M78,70 L74,40' }],
  }),

  'toe-in': figure({
    angle: 'overhang',
    wall: STEEP_WALL,
    holds: [
      hold(steep(15) + 2, 15, 'jug', { rotate: -63 }),
      hold(steep(26) + 2, 26, 'jug', { rotate: -63 }),
      hold(steep(73) + 1.5, 73, 'foot', { key: true }),
      hold(steep(84) + 1.5, 84, 'foot', { key: true }),
    ],
    people: [
      climber(
        {
          neck: [66, 40],
          pelvis: [52, 58],
          lHand: [steep(15) + 2, 15],
          rHand: [steep(26) + 2, 26],
          lFoot: [steep(73) + 5.5, 72],
          rFoot: [steep(84) + 5.5, 83],
          lToe: [-1, 0.25],
          rToe: [-1, 0.25],
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'down' },
        },
        ['lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M36,90 L45,86', kind: 'force' }],
    rings: [[steep(84) + 2, 84]],
  }),

  'heel-hook': figure({
    angle: 'vertical',
    holds: [hold(40, 20, 'jug'), hold(60, 9, 'jug'), hold(44, 86.5, 'foot'), hold(70, 41.5, 'jug', { key: true })],
    people: [
      climber(
        {
          neck: [47, 35],
          pelvis: [51, 57],
          lHand: [40, 21],
          rHand: [58, 12],
          lFoot: [44, 84.5],
          rFoot: [68, 40],
          rToe: [1, -0.55],
          bend: { rLeg: 'down' },
        },
        ['rLeg'],
      ),
    ],
    arrows: [{ d: 'M76,48 Q74,62 62,64', kind: 'force' }],
    rings: [[70, 41]],
  }),

  'toe-hook': figure({
    angle: 'roof',
    wall: 'M0,0 L100,0 L100,18 L0,18 Z',
    holds: [hold(30, 20.5, 'jug', { rotate: 180 }), hold(44, 20.5, 'jug', { rotate: 180 }), hold(80, 20, 'edge', { key: true, rotate: 180 })],
    people: [
      climber(
        {
          neck: [42, 40],
          pelvis: [60, 50],
          lHand: [30, 21],
          rHand: [44, 21],
          lFoot: [70, 76],
          rFoot: [77, 25],
          rToe: [0.75, -0.65],
          turn: 1,
          bend: { lArm: 'right', rArm: 'right', rLeg: 'down', lLeg: 'right' },
        },
        ['rLeg'],
      ),
    ],
    arrows: [{ d: 'M88,32 Q90,24 85,21', kind: 'force' }],
    rings: [[80, 21]],
  }),

  bicycle: figure({
    angle: 'overhang',
    wall: STEEP_WALL,
    holds: [hold(steep(15) + 2, 15, 'jug', { rotate: -63 }), hold(steep(26) + 2, 26, 'jug', { rotate: -63 }), hold(steep(72) + 3.5, 72, 'jug', { key: true, rotate: -63, size: 1.25 })],
    people: [
      climber(
        {
          neck: [66, 40],
          pelvis: [53, 58],
          lHand: [steep(15) + 2, 15],
          rHand: [steep(26) + 2, 26],
          lFoot: [steep(68) + 6.5, 67],
          rFoot: [steep(78) + 7.5, 78],
          lToe: [-1, 0.35],
          rToe: [-0.4, -1],
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'down', lArm: 'down', rArm: 'down' },
        },
        ['lLeg', 'rLeg'],
      ),
    ],
    arrows: [
      { d: 'M48,62 L42.5,66', kind: 'force' },
      { d: 'M50,86 L44.5,80.5', kind: 'force' },
    ],
    rings: [[steep(72) + 3.5, 72]],
  }),

  'knee-bar': figure({
    angle: 'overhang',
    wall: 'M0,0 L70,0 L44,52 L58,54 L57,60 L40,60 L20,100 L0,100 Z',
    holds: [hold(steep(28) + 2, 28, 'jug', { rotate: -63 }), hold(steep(76) + 2, 76, 'foot', { key: true })],
    people: [
      climber(
        {
          neck: [74, 44],
          pelvis: [66, 65],
          lHand: [80, 66],
          rHand: [steep(28) + 2, 28],
          lFoot: [78, 92],
          rFoot: [steep(76) + 3, 75],
          joints: { rLeg: [53, 63] },
          rToe: [-1, 0.3],
          turn: 1,
          bend: { rArm: 'down', lArm: 'right', lLeg: 'right' },
        },
        ['rLeg'],
      ),
    ],
    arrows: [{ d: 'M51,72 L52,65.5', kind: 'force' }],
    rings: [[53, 62]],
  }),

  falling: figure({
    angle: 'ground',
    wall: `M0,8 L24,8 L24,86 L0,86 Z ${PAD}`,
    people: [
      climber(
        { neck: [36, 18], pelvis: [38, 40], lHand: [30, 6], rHand: [44, 4], lFoot: [34, 66], rFoot: [44, 66] },
        [],
        true,
      ),
      climber(
        {
          neck: [60, 56],
          pelvis: [55, 74],
          lHand: [70, 62],
          rHand: [72, 67],
          lFoot: [50, 85],
          rFoot: [62, 85],
          turn: 0.4,
          bend: { lLeg: 'right', rLeg: 'right', lArm: 'down', rArm: 'down' },
        },
        ['lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M46,46 Q54,52 54,62' }],
  }),

  'route-reading': figure({
    angle: 'ground',
    wall: FLOOR,
    holds: [hold(26, 52, 'jug'), hold(36, 33, 'edge'), hold(56, 22, 'sloper', { key: true }), hold(74, 8, 'jug')],
    people: [
      climber(
        {
          neck: [60, 43],
          pelvis: [60, 65],
          lHand: [50, 62],
          rHand: [68, 22],
          lFoot: [55, 92],
          rFoot: [65, 92],
          head: [59, 36],
          bend: { lArm: 'out', lLeg: 'in', rLeg: 'in' },
        },
        ['rArm', 'head'],
      ),
    ],
    arrows: [{ d: 'M26,52 L36,33 L56,22 L74,8', kind: 'guide' }],
    labels: [
      { at: [19, 50], text: '1' },
      { at: [29, 29], text: '2' },
      { at: [50, 13], text: '3' },
      { at: [84, 8], text: '4' },
    ],
  }),

  projecting: figure({
    angle: 'vertical',
    holds: [hold(40, 41, 'jug'), hold(50, 13, 'edge', { key: true }), hold(70, 7, 'jug'), hold(44, 87.5, 'foot'), hold(58, 81.5, 'foot')],
    people: [
      climber(
        { neck: [50, 36], pelvis: [51, 58], lHand: [40, 41], rHand: [51, 15], lFoot: [44, 85.5], rFoot: [58, 79.5], bend: { lArm: 'down' } },
        ['rArm'],
      ),
    ],
    arrows: [
      { d: 'M40,41 L50,13 L70,7', kind: 'guide' },
      { d: 'M84,50 A8,8 0 1 1 86,38' },
    ],
    rings: [[50, 13]],
    labels: [
      { at: [31, 41], text: '1' },
      { at: [41, 9], text: '2' },
      { at: [80, 7], text: '3' },
    ],
  }),

  /* Body ------------------------------------------------------------ */

  'straight-arms': figure({
    angle: 'vertical',
    holds: [hold(40, 14, 'jug'), hold(60, 14, 'jug'), hold(36, 82, 'foot'), hold(64, 82, 'foot')],
    people: [
      climber({ neck: [50, 36], pelvis: [50, 58], lHand: [40.5, 14.5], rHand: [59.5, 14.5], lFoot: [36, 80], rFoot: [64, 80] }, ['lArm', 'rArm']),
    ],
    arrows: [{ d: 'M50,92 L50,70' }],
  }),

  'hips-over-feet': figure({
    angle: 'vertical',
    holds: [hold(60, 15, 'jug'), hold(57, 88, 'foot', { key: true }), hold(43, 76, 'foot')],
    people: [
      climber(
        { neck: [54, 36], pelvis: [57, 58], lHand: [34, 42], rHand: [60, 16], lFoot: [43, 74], rFoot: [57, 86], bend: { lArm: 'down' } },
        ['torso', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M57,60 L57,84', kind: 'guide' }],
    rings: [[57, 87]],
  }),

  flagging: figure({
    angle: 'vertical',
    holds: [hold(42, 26, 'jug'), hold(63, 8, 'jug', { key: true }), hold(59, 84, 'foot')],
    people: [
      climber(
        { neck: [52, 36], pelvis: [55, 58], lHand: [42, 27], rHand: [62, 10], lFoot: [24, 71], rFoot: [59, 82], lToe: [-0.6, 0.8] },
        ['lLeg'],
      ),
    ],
    rings: [[25, 73]],
  }),

  stemming: figure({
    angle: 'vertical',
    wall: 'M50,0 L100,0 L100,100 L50,100 Z',
    people: [
      climber(
        {
          neck: [50, 40],
          pelvis: [50, 63],
          lHand: [31, 40],
          rHand: [69, 38],
          lFoot: [23, 80],
          rFoot: [77, 80],
          lToe: [-1, -0.3],
          rToe: [1, -0.3],
          bend: { lArm: 'down', rArm: 'down' },
        },
        ['lLeg', 'rLeg'],
      ),
    ],
    arrows: [
      { d: 'M31,90 L21,90', kind: 'force' },
      { d: 'M69,90 L79,90', kind: 'force' },
    ],
  }),

  mantle: figure({
    angle: 'vertical',
    wall: 'M4,50 L96,50 L96,100 L4,100 Z',
    people: [
      climber(
        {
          neck: [50, 34],
          pelvis: [50, 57],
          lHand: [40, 49],
          rHand: [60, 49],
          lFoot: [44, 88],
          rFoot: [67, 48],
          bend: { lArm: 'up', rArm: 'up', rLeg: 'up' },
        },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [
      { d: 'M32,36 L32,46', kind: 'force' },
      { d: 'M78,24 L78,12' },
    ],
  }),

  'hip-turn': figure({
    angle: 'vertical',
    holds: [hold(28, 44, 'jug'), hold(60, 9, 'jug', { key: true }), hold(42, 87.5, 'foot'), hold(59, 82, 'foot')],
    people: [
      climber(
        {
          neck: [50, 36],
          pelvis: [53, 58],
          lHand: [28, 44],
          rHand: [59, 11],
          lFoot: [42, 85.5],
          rFoot: [58, 80],
          lToe: [-1, 0.05],
          rToe: [-1, 0.05],
          turn: 0.85,
        },
        ['torso', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M66,66 Q72,58 64,50' }],
  }),

  backstep: figure({
    angle: 'vertical',
    holds: [hold(35, 8, 'jug', { key: true }), hold(60, 27, 'jug'), hold(33, 78, 'foot', { key: true }), hold(58, 87.5, 'foot')],
    people: [
      climber(
        {
          neck: [47, 35],
          pelvis: [48, 57],
          lHand: [36, 10],
          rHand: [60, 28],
          lFoot: [36, 76],
          rFoot: [58, 85.5],
          lToe: [-1, 0.1],
          turn: 0.75,
          bend: { lLeg: 'down' },
        },
        ['lLeg'],
      ),
    ],
    rings: [[33.5, 77]],
  }),

  'drop-knee': figure({
    angle: 'vertical',
    holds: [hold(38, 28, 'jug'), hold(58, 8, 'jug', { key: true }), hold(40, 81.5, 'foot'), hold(70, 62, 'foot', { key: true })],
    people: [
      climber(
        {
          neck: [50, 36],
          pelvis: [52, 58],
          lHand: [38, 29],
          rHand: [57, 10],
          lFoot: [40, 79.5],
          rFoot: [68, 61],
          joints: { rLeg: [57, 72] },
          rToe: [1, -0.2],
          turn: 0.6,
        },
        ['rLeg'],
      ),
    ],
    rings: [[57, 72]],
  }),

  gaston: figure({
    angle: 'vertical',
    holds: [
      hold(33, 30, 'edge', { key: true, rotate: 90 }),
      hold(67, 30, 'edge', { key: true, rotate: 90 }),
      hold(42, 86, 'foot'),
      hold(58, 86, 'foot'),
    ],
    people: [
      climber(
        { neck: [50, 38], pelvis: [50, 60], lHand: [34, 31], rHand: [66, 31], lFoot: [42, 84], rFoot: [58, 84], bend: { lArm: 'up', rArm: 'up' } },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [
      { d: 'M28,22 L19,22', kind: 'force' },
      { d: 'M72,22 L81,22', kind: 'force' },
    ],
  }),

  'body-tension': figure({
    angle: 'overhang',
    wall: STEEPER_WALL,
    holds: [
      hold(steeper(14) + 2, 14, 'jug', { rotate: -55 }),
      hold(steeper(25) + 2, 25, 'jug', { rotate: -55 }),
      hold(steeper(66) + 1.5, 66, 'foot', { key: true }),
      hold(steeper(76) + 1.5, 76, 'foot', { key: true }),
    ],
    people: [
      climber(
        {
          neck: [64, 37],
          pelvis: [50, 54],
          lHand: [steeper(14) + 2, 14],
          rHand: [steeper(25) + 2, 25],
          lFoot: [steeper(66) + 3.5, 65],
          rFoot: [steeper(76) + 3.5, 75],
          lToe: [-1, 0.5],
          rToe: [-1, 0.5],
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'down' },
        },
        ['torso', 'lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M80,36 L60,62', kind: 'guide' }],
  }),

  compression: figure({
    angle: 'overhang',
    wall: 'M12,8 L30,4 L33,74 L16,78 Z M70,4 L88,8 L84,78 L67,74 Z',
    people: [
      climber(
        {
          neck: [50, 38],
          pelvis: [50, 60],
          lHand: [31, 30],
          rHand: [69, 30],
          lFoot: [33, 66],
          rFoot: [67, 66],
          bend: { lArm: 'down', rArm: 'down', lLeg: 'up', rLeg: 'up' },
        },
        ['lArm', 'rArm', 'torso'],
      ),
    ],
    arrows: [
      { d: 'M6,42 L13,42', kind: 'force' },
      { d: 'M94,42 L87,42', kind: 'force' },
    ],
  }),

  roof: figure({
    angle: 'roof',
    wall: 'M0,0 L100,0 L100,22 L0,22 Z',
    holds: [
      hold(22, 24.5, 'jug', { rotate: 180 }),
      hold(36, 24.5, 'jug', { rotate: 180 }),
      hold(68, 24, 'foot', { key: true }),
      hold(82, 24, 'edge', { key: true, rotate: 180 }),
    ],
    people: [
      climber(
        {
          neck: [36, 46],
          pelvis: [58, 48],
          lHand: [22, 25],
          rHand: [36, 25],
          lFoot: [67, 28],
          rFoot: [80, 28],
          lToe: [-0.2, -1],
          rToe: [0.8, -0.6],
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up', lArm: 'left', rArm: 'left' },
        },
        ['torso', 'lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M30,64 L10,64' }],
  }),

  'iron-cross': figure({
    angle: 'overhang',
    holds: [hold(22, 30, 'pinch', { key: true }), hold(78, 30, 'pinch', { key: true }), hold(43, 76, 'foot'), hold(58, 72, 'foot')],
    people: [
      climber(
        { neck: [50, 37], pelvis: [50, 59], lHand: [22.5, 31], rHand: [77.5, 31], lFoot: [43, 74], rFoot: [58, 70], bend: { lLeg: 'out', rLeg: 'out' } },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [
      { d: 'M9,31 L16,31', kind: 'force' },
      { d: 'M91,31 L84,31', kind: 'force' },
    ],
  }),

  /* Movement -------------------------------------------------------- */

  deadpoint: figure({
    angle: 'vertical',
    holds: [hold(42, 24, 'jug'), hold(58, 26, 'jug'), hold(59, 6, 'edge', { key: true }), hold(42, 86, 'foot'), hold(58, 84, 'foot')],
    people: [
      climber({ neck: [50, 44], pelvis: [50, 66], lHand: [42, 25], rHand: [58, 27], lFoot: [42, 84], rFoot: [58, 82] }, [], true),
      climber(
        { neck: [50, 31], pelvis: [50, 53], lHand: [42, 25], rHand: [59, 7], lFoot: [42, 84], rFoot: [58, 82], bend: { lArm: 'down' } },
        ['rArm'],
      ),
    ],
    arrows: [{ d: 'M70,60 Q75,46 70,32' }],
    rings: [[59, 6]],
  }),

  dyno: figure({
    angle: 'vertical',
    holds: [hold(42, 40, 'jug'), hold(58, 40, 'jug'), hold(50, 7, 'jug', { key: true }), hold(40, 90, 'foot'), hold(60, 90, 'foot')],
    people: [
      climber(
        { neck: [50, 56], pelvis: [50, 74], lHand: [42, 41], rHand: [58, 41], lFoot: [40, 88], rFoot: [60, 88], bend: { lLeg: 'out', rLeg: 'out' } },
        [],
        true,
      ),
      climber({ neck: [50, 29], pelvis: [51, 51], lHand: [46.5, 8], rHand: [53.5, 8], lFoot: [45, 79], rFoot: [55, 80] }, ALL),
    ],
    arrows: [{ d: 'M74,76 Q82,44 64,14' }],
    rings: [[50, 7]],
  }),

  'double-dyno': figure({
    angle: 'vertical',
    holds: [hold(30, 36, 'jug', { key: true }), hold(70, 11, 'jug', { key: true })],
    people: [
      climber(
        { neck: [42, 46], pelvis: [48, 67], lHand: [31, 37], rHand: [62, 22], lFoot: [44, 94], rFoot: [52, 92], bend: { rArm: 'down' } },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [
      { d: 'M12,86 Q10,52 24,40' },
      { d: 'M38,24 Q50,6 62,10' },
    ],
    labels: [
      { at: [22, 30], text: '1' },
      { at: [80, 11], text: '2' },
    ],
  }),

  'paddle-dyno': figure({
    angle: 'vertical',
    holds: [hold(20, 24, 'sloper'), hold(50, 20, 'sloper', { key: true }), hold(80, 24, 'sloper')],
    people: [
      climber(
        {
          neck: [44, 40],
          pelvis: [37, 61],
          lHand: [27, 28],
          rHand: [50, 21],
          lFoot: [28, 87],
          rFoot: [38, 89],
          bend: { lArm: 'down', rArm: 'down' },
        },
        ['rArm'],
      ),
    ],
    arrows: [
      { d: 'M18,14 Q32,4 46,11' },
      { d: 'M56,11 Q68,4 80,14' },
    ],
    labels: [
      { at: [20, 32], text: '1' },
      { at: [50, 28.5], text: '2' },
      { at: [80, 32], text: '3' },
    ],
  }),

  'cut-loose': figure({
    angle: 'overhang',
    wall: STEEP_WALL,
    holds: [hold(steep(15) + 2, 15, 'jug', { rotate: -63 }), hold(steep(70) + 1.5, 70, 'foot'), hold(steep(82) + 1.5, 82, 'foot')],
    people: [
      climber(
        { neck: [66, 40], pelvis: [52, 58], lHand: [steep(15) + 2, 15], rHand: [steep(15) + 2, 15], lFoot: [steep(70) + 4, 69], rFoot: [steep(82) + 4, 81], turn: 1, bend: { lLeg: 'up', rLeg: 'up' } },
        [],
        true,
      ),
      climber(
        {
          neck: [65, 37],
          pelvis: [69, 59],
          lHand: [steep(15) + 2, 15],
          rHand: [steep(15) + 2, 15],
          lFoot: [80, 86],
          rFoot: [76, 88],
          turn: 1,
          bend: { lLeg: 'left', rLeg: 'left' },
        },
        ['torso', 'lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M38,90 Q56,100 84,94' }],
  }),

  'swing-catch': figure({
    angle: 'vertical',
    holds: [hold(67, 11, 'jug', { key: true }), hold(30, 38, 'jug')],
    people: [
      climber(
        { neck: [57, 35], pelvis: [47, 54], lHand: [42, 48], rHand: [66, 12], lFoot: [30, 75], rFoot: [37, 80], bend: { lArm: 'down', lLeg: 'down', rLeg: 'down' } },
        ['rArm'],
      ),
    ],
    arrows: [{ d: 'M24,86 Q44,98 62,88' }],
    rings: [[67, 11]],
  }),

  pogo: figure({
    angle: 'vertical',
    holds: [hold(42, 28, 'jug'), hold(58, 26, 'jug'), hold(60, 86.5, 'foot'), hold(22, 7, 'jug', { key: true })],
    people: [
      climber({ neck: [50, 40], pelvis: [52, 62], lHand: [42, 29], rHand: [58, 27], lFoot: [44, 92], rFoot: [60, 84.5] }, [], true),
      climber(
        { neck: [50, 40], pelvis: [52, 62], lHand: [42, 29], rHand: [58, 27], lFoot: [26, 52], rFoot: [60, 84.5], bend: { lLeg: 'down' } },
        ['lLeg'],
      ),
    ],
    arrows: [{ d: 'M40,94 Q24,88 22,64' }],
    rings: [[22, 7]],
  }),

  'run-jump': figure({
    angle: 'ground',
    wall: FLOOR,
    holds: [hold(74, 12, 'jug', { key: true }), hold(86, 22, 'jug', { key: true })],
    people: [
      climber(
        { neck: [22, 58], pelvis: [24, 78], lHand: [14, 70], rHand: [32, 64], lFoot: [16, 93], rFoot: [34, 86], turn: 0.5, bend: { rLeg: 'up' } },
        [],
        true,
      ),
      climber(
        { neck: [63, 34], pelvis: [54, 53], lHand: [73, 13], rHand: [84, 21], lFoot: [36, 64], rFoot: [46, 74], turn: 0.3, bend: { lLeg: 'down', rLeg: 'down' } },
        ['lArm', 'rArm', 'lLeg', 'rLeg'],
      ),
    ],
    arrows: [
      { d: 'M6,97 L24,97', kind: 'guide' },
      { d: 'M36,82 Q42,46 62,26' },
    ],
  }),

  'double-clutch': figure({
    angle: 'vertical',
    holds: [hold(34, 30, 'jug', { key: true }), hold(72, 10, 'jug', { key: true })],
    people: [
      climber(
        { neck: [50, 36], pelvis: [52, 58], lHand: [35, 31], rHand: [70, 12], lFoot: [46, 85], rFoot: [56, 84], bend: { lArm: 'down' } },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M18,92 Q14,50 28,34 Q46,16 64,12' }],
    labels: [
      { at: [24, 26], text: '1' },
      { at: [82, 10], text: '2' },
    ],
  }),

  /* Strength -------------------------------------------------------- */

  'open-hand': figure({
    angle: 'close-up',
    wall: 'M0,0 L24,0 L24,40 Q44,40 44,50 Q44,58 24,58 L24,100 L0,100 Z',
    extra: handInProfile(
      [
        [40, 41.5],
        [33.5, 38.5],
        [28.5, 39.8],
      ],
      [56, 66],
      [48, 46],
      [
        [54, 58],
        [50, 62],
        [47, 60],
      ],
    ),
    arrows: [{ d: 'M70,40 L70,56', kind: 'force' }],
  }),

  'half-crimp': figure({
    angle: 'close-up',
    wall: 'M0,0 L24,0 L24,48 L40,48 L40,53 L24,53 L24,100 L0,100 Z',
    extra: handInProfile(
      [
        [38, 35],
        [33, 40],
        [30, 46.5],
      ],
      [52, 66],
      [46, 45],
      [
        [50, 57],
        [45, 61],
        [42, 59],
      ],
    ),
    arrows: [{ d: 'M70,40 L70,56', kind: 'force' }],
    labels: [{ at: [42, 28], text: '90°' }],
  }),

  slopers: figure({
    angle: 'vertical',
    holds: [hold(40, 18, 'sloper', { key: true, size: 1.3 }), hold(60, 18, 'sloper', { key: true, size: 1.3 }), hold(40, 88, 'foot'), hold(60, 88, 'foot')],
    people: [
      climber(
        { neck: [50, 42], pelvis: [50, 64], lHand: [40.5, 16], rHand: [59.5, 16], lFoot: [40, 86], rFoot: [60, 86], bend: { lLeg: 'out', rLeg: 'out' } },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M50,70 L50,82', kind: 'force' }],
  }),

  pinches: figure({
    angle: 'close-up',
    wall: 'M43,10 L57,10 L59,90 L41,90 Z',
    extra: [
      { pts: [[50, 104], [50, 64]], width: 10, tone: 'body' },
      { pts: [[40, 42], [60, 42], [61, 62], [41, 63]], width: 3, tone: 'body', closed: true },
      { pts: [[60, 44], [64.5, 44.5], [62, 47]], width: 3.2, tone: 'focus' },
      { pts: [[60.5, 49], [65, 49.5], [62.5, 52]], width: 3.2, tone: 'focus' },
      { pts: [[61, 54], [65, 54.5], [62.5, 57]], width: 3.2, tone: 'focus' },
      { pts: [[41, 56], [35, 50], [39, 44.5]], width: 3.6, tone: 'focus' },
    ],
    arrows: [
      { d: 'M24,48 L32,48', kind: 'force' },
      { d: 'M78,50 L70,50', kind: 'force' },
    ],
  }),

  'full-crimp': figure({
    angle: 'close-up',
    wall: 'M0,0 L24,0 L24,49 L36,49 L36,52.5 L24,52.5 L24,100 L0,100 Z',
    extra: handInProfile(
      [
        [37, 33],
        [34, 46],
        [28, 47.5],
      ],
      [50, 64],
      [45, 44],
      [
        [48, 54],
        [40, 46],
        [35, 41.5],
      ],
      true,
    ),
    arrows: [{ d: 'M70,40 L70,56', kind: 'force' }],
  }),

  monos: figure({
    angle: 'close-up',
    wall: 'M0,0 L30,0 L30,44 L20,44 L20,51 L30,51 L30,100 L0,100 Z',

    extra: [
      { pts: [[60, 104], [50, 64]], width: 9, tone: 'body' },
      { pts: [[50, 64], [44, 49]], width: 7, tone: 'body' },
      { pts: [[44, 49], [36, 47.5], [23, 47.5]], width: 3.4, tone: 'focus' },
      { pts: [[45, 54], [38, 56], [39, 61]], width: 3.2, tone: 'body' },
      { pts: [[44, 45], [37, 41], [38, 36]], width: 3.2, tone: 'body' },
    ],
    rings: [[25, 47.5]],
  }),

  'lock-off': figure({
    angle: 'vertical',
    holds: [hold(41, 36, 'jug'), hold(60, 6, 'jug', { key: true }), hold(42, 82, 'foot'), hold(58, 80, 'foot')],
    people: [
      climber(
        { neck: [50, 30], pelvis: [50, 52], lHand: [41, 37], rHand: [59, 8], lFoot: [42, 80], rFoot: [58, 78], joints: { lArm: [40, 43] } },
        ['lArm'],
      ),
    ],
    rings: [[60, 6]],
  }),

  'one-arm-lock': figure({
    angle: 'vertical',
    holds: [hold(44, 36, 'jug', { key: true }), hold(62, 6, 'jug')],
    people: [
      climber(
        {
          neck: [51, 31],
          pelvis: [51, 53],
          lHand: [44, 37],
          rHand: [61, 9],
          lFoot: [48, 82],
          rFoot: [55, 83],
          joints: { lArm: [42, 44] },
          bend: { lLeg: 'in', rLeg: 'in' },
        },
        ['lArm'],
      ),
    ],
    arrows: [{ d: 'M68,30 L64,14' }],
  }),

  hangboard: figure({
    angle: 'board',
    wall: 'M16,6 L84,6 L84,20 L16,20 Z',
    holds: [hold(37, 20, 'edge', { key: true }), hold(63, 20, 'edge', { key: true })],
    people: [
      climber(
        { neck: [50, 42], pelvis: [50, 64], lHand: [37.5, 21], rHand: [62.5, 21], lFoot: [46, 93], rFoot: [54, 93], bend: { lLeg: 'in', rLeg: 'in' } },
        ['lArm', 'rArm'],
      ),
    ],
    labels: [{ at: [80, 52], text: '10s' }],
  }),

  'campus-move': figure({
    angle: 'overhang',
    holds: [hold(40, 34, 'jug'), hold(60, 7, 'jug', { key: true })],
    people: [
      climber(
        { neck: [50, 32], pelvis: [51, 54], lHand: [40, 35], rHand: [59, 10], lFoot: [47, 83], rFoot: [55, 84], joints: { lArm: [38, 42] }, bend: { lLeg: 'in', rLeg: 'in' } },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M70,34 Q74,22 66,12' }],
    rings: [[60, 7]],
  }),

  'campus-ladder': figure({
    angle: 'board',
    wall: 'M28,0 L72,0 L72,100 L28,100 Z',
    holds: [
      hold(50, 46, 'rung'),
      hold(50, 36, 'rung', { key: true }),
      hold(50, 26, 'rung', { key: true }),
      hold(50, 16, 'rung'),
      hold(50, 6, 'rung'),
    ],
    people: [
      climber(
        { neck: [50, 48], pelvis: [50, 70], lHand: [44, 36], rHand: [56, 26], lFoot: [47, 97], rFoot: [53, 97], bend: { lLeg: 'in', rLeg: 'in', lArm: 'down' } },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M80,30 Q84,20 76,14' }],
    labels: [
      { at: [21, 46], text: '1' },
      { at: [21, 36], text: '2' },
      { at: [21, 26], text: '3' },
      { at: [21, 16], text: '4' },
      { at: [21, 6], text: '5' },
    ],
  }),

  'campus-skip': figure({
    angle: 'board',
    wall: 'M30,0 L70,0 L70,100 L30,100 Z',
    holds: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((rung) => hold(50, 94 - (rung - 1) * 10.5, 'rung', { key: rung === 1 || rung === 5 || rung === 9, size: 0.75 })),
    people: [
      scaled(
        climber(
          { neck: [50, 46], pelvis: [50, 68], lHand: [44, 60], rHand: [56, 24], lFoot: [47, 96], rFoot: [53, 96], bend: { lArm: 'out', lLeg: 'in', rLeg: 'in' } },
          ['lArm', 'rArm'],
        ),
        0.75,
        [50, 10],
      ),
    ],
    arrows: [{ d: 'M78,52 Q86,30 74,12' }],
    labels: [
      { at: [22, 94], text: '1' },
      { at: [22, 52], text: '5' },
      { at: [22, 10], text: '9' },
    ],
  }),

  'one-arm-hang': figure({
    angle: 'board',
    wall: 'M16,6 L84,6 L84,20 L16,20 Z',
    holds: [hold(40, 20, 'edge'), hold(60, 20, 'edge', { key: true })],
    people: [
      climber(
        { neck: [54, 42], pelvis: [54, 64], lHand: [42, 70], rHand: [60, 21], lFoot: [50, 93], rFoot: [58, 93], turn: 0.3, bend: { lArm: 'out', lLeg: 'in', rLeg: 'in' } },
        ['rArm'],
      ),
    ],
    labels: [{ at: [82, 52], text: '5s' }],
  }),
};

export function boulderingFigure(id: string): FigureSpec | undefined {
  return FIGURES[id];
}

/** For checks: every skill id that has a drawing. */
export const BOULDERING_FIGURE_IDS = Object.keys(FIGURES);
