import { FigureSpec, Pt, Stroke } from './SkillFigure';
import { ALL, climber, figure, hold, scaled } from './figureKit';
import { patched } from './figureOverrides';

/**
 * One illustration per bouldering skill, drawn by `SkillFigure`. Front views
 * look at the climber's back (the wall is behind the figure); side views put
 * the wall on the left.
 */

/* ------------------------------------------------------------------ */
/* Scenery                                                             */
/* ------------------------------------------------------------------ */


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

/**
 * The back of a right hand seen from behind, fingers up, thumb on screen-left.
 * `fingers` runs index to little finger: 'in' reaches up into a pocket, 'off' is curled away from it,
 * 'free' is left out so the figure can draw that finger itself.
 */
function handFromBehind(cx: number, fingers: ('in' | 'off' | 'free')[], k = 1): Stroke[] {
  const knuckleY = 55;
  const s = (dx: number, y: number): Pt => [cx + dx * k, knuckleY + (y - knuckleY) * k];
  const strokes: Stroke[] = [
    { pts: [s(1.5, 104), s(0, 74)], width: 11 * k, tone: 'body' },
    { pts: [s(-10, 74), s(10, 74), s(10.5, knuckleY), s(-10.5, knuckleY)], width: 3, tone: 'body', closed: true },
    { pts: [s(-9.5, 70), s(-15, 62), s(-15.5, 56.5)], width: 3.4, tone: 'body' },
  ];
  fingers.forEach((state, i) => {
    if (state === 'free') return;
    const x = -7.5 + 5 * i;
    const out = i < 2 ? -1 : 1;
    strokes.push(
      state === 'in'
        ? { pts: [s(x, knuckleY), s(x, 34)], width: 3.6, tone: 'focus' }
        : { pts: [s(x, knuckleY), s(x + out, 48), s(x + 2.6 * out, 51.5)], width: 3.4, tone: 'body' },
    );
  });
  return strokes;
}

/** A rounded hole in the rock (path drawn against the rock's winding, so it cuts through). */
const hole = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} Z`;

/* ------------------------------------------------------------------ */
/* The figures                                                         */
/* ------------------------------------------------------------------ */

const FIGURES: Record<string, FigureSpec> = {
  /* Technique ------------------------------------------------------- */

  bld_silent_feet: figure({
    scene: 'vertical',
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

  bld_edging: figure({
    scene: 'vertical',
    holds: [hold(41, 15, 'jug'), hold(59, 15, 'jug'), hold(37, 87, 'edge', { size: 0.8 }), hold(65, 80, 'edge', { key: true, size: 0.8 })],
    people: [
      climber(
        { neck: [50, 36], pelvis: [50, 58], lHand: [41, 16], rHand: [59, 16], lFoot: [39, 85], rFoot: [62, 78], lToe: [-1, 0.05], rToe: [1, 0.08] },
        ['rLeg'],
      ),
    ],
    rings: [[65, 79]],
  }),

  bld_smearing: figure({
    scene: 'slab',
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

  bld_high_step: figure({
    scene: 'vertical',
    holds: [hold(42, 17, 'jug'), hold(58, 13, 'jug'), hold(43, 87.5, 'foot'), hold(65, 61, 'foot', { key: true })],
    people: [
      climber(
        { neck: [49, 39], pelvis: [51, 61], lHand: [42, 18], rHand: [58, 14], lFoot: [43, 85.5], rFoot: [64.5, 58.5], bend: { rLeg: 'up' } },
        ['rLeg'],
      ),
    ],
    rings: [[65, 60.5]],
  }),

  bld_slab_friction: figure({
    scene: 'slab',
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

  bld_toe_in: figure({
    scene: 'overhang',
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

  bld_heel_hook: figure({
    scene: 'vertical',
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

  bld_toe_hook: figure({
    scene: 'roof',
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

  bld_bicycle: figure({
    scene: 'overhang',
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

  bld_knee_bar: figure({
    scene: 'overhang',
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

  bld_falling: figure({
    scene: 'ground',
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

  bld_route_reading: figure({
    scene: 'ground',
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

  bld_projecting: figure({
    scene: 'vertical',
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

  bld_outside_edge: figure({
    scene: 'vertical',
    holds: [hold(41, 15, 'jug'), hold(59, 15, 'jug'), hold(43, 87, 'edge', { size: 0.8 }), hold(64.5, 80, 'edge', { key: true, size: 0.8 })],
    people: [
      climber(
        { neck: [52, 36], pelvis: [56, 58], lHand: [41, 16], rHand: [59, 16], lFoot: [44, 85], rFoot: [67.5, 78], rToe: [-1, 0.08], turn: 0.85, bend: { rLeg: 'in', lLeg: 'out' } },
        ['rLeg'],
      ),
    ],
    rings: [[64.5, 79]],
  }),

  bld_rock_over: figure({
    scene: 'vertical',
    holds: [hold(34, 26, 'jug'), hold(50, 18, 'jug'), hold(78, 12, 'jug'), hold(40, 88, 'foot'), hold(75, 60.5, 'foot', { key: true })],
    people: [
      climber({ neck: [41, 40], pelvis: [42, 62], lHand: [34, 27], rHand: [50, 19], lFoot: [40, 86], rFoot: [74, 58.5], bend: { rLeg: 'up' } }, [], true),
      climber(
        { neck: [72, 28], pelvis: [70, 49], lHand: [50, 19], rHand: [78, 13], lFoot: [62, 75], rFoot: [74, 58.5], bend: { rLeg: 'right', lLeg: 'in' } },
        ['rLeg'],
      ),
    ],
    arrows: [{ d: 'M40,70 Q58,78 64,58' }],
    rings: [[75, 60.5]],
  }),

  bld_good_samaritan: figure({
    scene: 'vertical',
    holds: [hold(42, 25, 'jug'), hold(42, 88, 'foot'), hold(80, 48, 'foot', { key: true })],
    people: [
      climber(
        {
          neck: [56, 46],
          pelvis: [52, 66],
          lHand: [42, 26],
          rHand: [69.5, 65.5],
          lFoot: [43, 86],
          rFoot: [70, 64],
          rToe: [1, -0.2],
          joints: { rLeg: [60, 52.5] },
          bend: { rArm: 'right' },
        },
        ['rArm'],
      ),
    ],
    arrows: [{ d: 'M78,72 Q87,66 82,53' }],
    rings: [[69.5, 65]],
  }),

  bld_heel_toe_cam: figure({
    scene: 'roof',
    wall: 'M0,0 L100,0 L100,20 L76,20 L76,5 L65,5 L65,20 L0,20 Z',
    holds: [hold(28, 22.5, 'jug', { rotate: 180 }), hold(42, 22.5, 'jug', { rotate: 180 })],
    people: [
      climber(
        {
          neck: [44, 40],
          pelvis: [62, 41],
          lHand: [28, 23],
          rHand: [42, 23],
          lFoot: [74, 65],
          rFoot: [67.4, 15.5],
          rToe: [1, -0.5],
          turn: 1,
          bend: { lArm: 'right', rArm: 'right', rLeg: 'left', lLeg: 'right' },
        },
        ['rLeg'],
      ),
    ],
    rings: [[70.5, 12.5]],
  }),

  bld_frog_pinch: figure({
    scene: 'overhang',
    wall: 'M50,44 L58,98 L42,98 Z',
    holds: [hold(40, 16, 'jug'), hold(60, 16, 'jug')],
    people: [
      climber(
        { neck: [50, 36], pelvis: [50, 58], lHand: [40, 17], rHand: [60, 17], lFoot: [44.5, 76], rFoot: [55.5, 76], lToe: [-1, 0.25], rToe: [1, 0.25], bend: { lLeg: 'out', rLeg: 'out' } },
        ['lLeg', 'rLeg'],
      ),
    ],
    arrows: [
      { d: 'M24,80 L33,80', kind: 'force' },
      { d: 'M76,80 L67,80', kind: 'force' },
    ],
  }),

  bld_bat_hang: figure({
    scene: 'roof',
    wall: 'M0,0 L100,0 L100,18 L0,18 Z',
    holds: [hold(18, 20.5, 'jug', { rotate: 180 }), hold(30, 20.5, 'jug', { rotate: 180 }), hold(48, 20.5, 'jug', { key: true, rotate: 180 }), hold(66, 20.5, 'jug', { key: true, rotate: 180 })],
    people: [
      climber(
        {
          neck: [57, 64],
          pelvis: [57, 42],
          lHand: [63, 85],
          rHand: [51, 85],
          lFoot: [65, 25],
          rFoot: [49, 25],
          lToe: [-0.15, -1],
          rToe: [0.15, -1],
          turn: 0.2,
          bend: { lLeg: 'out', rLeg: 'out', lArm: 'out', rArm: 'out' },
        },
        ['lLeg', 'rLeg'],
      ),
    ],
    rings: [[48, 22], [66, 22]],
  }),

  bld_alpine_knee: figure({
    scene: 'vertical',
    wall: 'M14,43 L86,43 L92,49 L8,49 Z M8,49 L92,49 L92,54 L8,54 Z',
    holds: [hold(40, 16, 'jug'), hold(58, 12, 'jug'), hold(43, 88, 'foot')],
    people: [
      climber(
        {
          neck: [50, 34],
          pelvis: [51, 57],
          lHand: [40, 17],
          rHand: [58, 13],
          lFoot: [43, 86],
          rFoot: [75, 45],
          joints: { rLeg: [60.5, 45] },
        },
        ['rLeg'],
      ),
    ],
    rings: [[60.5, 45]],
  }),

  bld_knee_press: figure({
    scene: 'vertical',
    wall: 'M67,44 L94,36 L94,92 L73,84 Z',
    holds: [hold(40, 16, 'jug'), hold(58, 12, 'jug'), hold(42, 86, 'foot'), hold(63, 82.5, 'foot', { key: true })],
    people: [
      climber(
        { neck: [50, 36], pelvis: [52, 58], lHand: [40, 17], rHand: [58, 13], lFoot: [42, 84], rFoot: [63, 80.5], joints: { rLeg: [67.5, 66] } },
        ['rLeg'],
      ),
    ],
    arrows: [{ d: 'M74,66 L83,66', kind: 'force' }],
    rings: [[68, 66]],
  }),

  /* Body ------------------------------------------------------------ */

  bld_straight_arms: figure({
    scene: 'vertical',
    holds: [hold(40, 14, 'jug'), hold(60, 14, 'jug'), hold(36, 82, 'foot'), hold(64, 82, 'foot')],
    people: [
      climber({ neck: [50, 36], pelvis: [50, 58], lHand: [40.5, 14.5], rHand: [59.5, 14.5], lFoot: [36, 80], rFoot: [64, 80] }, ['lArm', 'rArm']),
    ],
    arrows: [{ d: 'M50,92 L50,70' }],
  }),

  bld_hips_over_feet: figure({
    scene: 'vertical',
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

  bld_flagging: figure({
    scene: 'vertical',
    holds: [hold(42, 26, 'jug'), hold(63, 8, 'jug', { key: true }), hold(59, 84, 'foot')],
    people: [
      climber(
        { neck: [52, 36], pelvis: [55, 58], lHand: [42, 27], rHand: [62, 10], lFoot: [24, 71], rFoot: [59, 82], lToe: [-0.6, 0.8] },
        ['lLeg'],
      ),
    ],
    rings: [[25, 73]],
  }),

  bld_stemming: figure({
    scene: 'vertical',
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

  bld_mantle: figure({
    scene: 'vertical',
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

  bld_hip_turn: figure({
    scene: 'vertical',
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

  bld_backstep: figure({
    scene: 'vertical',
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

  bld_drop_knee: figure({
    scene: 'vertical',
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

  bld_gaston: figure({
    scene: 'vertical',
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

  bld_body_tension: figure({
    scene: 'overhang',
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

  bld_compression: figure({
    scene: 'overhang',
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

  bld_roof: figure({
    scene: 'roof',
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

  bld_iron_cross: figure({
    scene: 'overhang',
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

  bld_perching: figure({
    scene: 'vertical',
    wall: 'M0,0 L20,0 L20,100 L0,100 Z M20,58 L54,64 L20,86 Z',
    people: [
      climber(
        {
          neck: [37, 30],
          pelvis: [41, 51],
          lHand: [22, 31],
          rHand: [22, 39],
          lFoot: [33, 58.6],
          rFoot: [38, 59.5],
          lToe: [-1, -0.17],
          rToe: [-1, -0.17],
          joints: { lLeg: [26, 47], rLeg: [29, 49] },
          turn: 1,
          bend: { lArm: 'down', rArm: 'down' },
        },
        ['lLeg', 'rLeg'],
      ),
    ],
    rings: [[36, 61]],
  }),

  bld_frogging: figure({
    scene: 'vertical',
    holds: [hold(40, 18, 'jug'), hold(60, 18, 'jug'), hold(37, 74, 'edge', { key: true, size: 0.8 }), hold(63, 74, 'edge', { key: true, size: 0.8 })],
    people: [
      climber(
        { neck: [50, 40], pelvis: [50, 62], lHand: [40, 19], rHand: [60, 19], lFoot: [39, 72], rFoot: [61, 72], lToe: [-1, 0.1], rToe: [1, 0.1], bend: { lLeg: 'out', rLeg: 'out' } },
        ['lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M50,94 L50,78' }],
  }),

  bld_outward_facing: figure({
    scene: 'vertical',
    wall: 'M0,0 L26,0 L26,100 L0,100 Z M64,0 L100,0 L100,100 L64,100 Z',
    people: [
      climber(
        {
          neck: [30.5, 38],
          pelvis: [38, 58],
          lHand: [28, 60],
          rHand: [28, 60],
          lFoot: [62, 51],
          rFoot: [62, 68],
          lToe: [0.15, -1],
          rToe: [0.15, -1],
          head: [33, 31.5],
          joints: { lArm: [28.5, 49], rArm: [28.5, 49] },
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up' },
        },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M48,32 L48,14' }],
  }),

  bld_back_flag: figure({
    scene: 'vertical',
    holds: [hold(40, 24, 'jug'), hold(65, 8, 'jug', { key: true }), hold(44, 87.5, 'foot')],
    people: [
      climber(
        { neck: [49, 37], pelvis: [48, 59], lHand: [40, 25], rHand: [64, 10], lFoot: [44, 85.5], rFoot: [30, 77], rToe: [-1, 0.25] },
        ['rLeg'],
      ),
    ],
    rings: [[29, 77.5]],
  }),

  bld_inside_flag: figure({
    scene: 'vertical',
    holds: [hold(60, 24, 'jug'), hold(38, 10, 'jug', { key: true }), hold(56, 88.5, 'foot')],
    people: [
      climber(
        { neck: [49, 34], pelvis: [52, 57], lHand: [38, 12], rHand: [60, 25], lFoot: [70, 76], rFoot: [56, 86.5], lToe: [1, 0.25] },
        ['lLeg'],
      ),
    ],
    rings: [[71, 76.5]],
  }),

  bld_arm_flag: figure({
    scene: 'vertical',
    holds: [hold(62, 11, 'jug', { key: true }), hold(44, 84.5, 'foot'), hold(58, 88.5, 'foot')],
    people: [
      climber(
        { neck: [52, 36], pelvis: [53, 58], lHand: [24, 42], rHand: [62, 13], lFoot: [44, 82.5], rFoot: [58, 86.5] },
        ['lArm'],
      ),
    ],
    arrows: [{ d: 'M22,48 L22,58', kind: 'force' }],
  }),

  bld_peter_pan: figure({
    scene: 'vertical',
    holds: [hold(60, 13, 'jug', { key: true })],
    people: [
      climber(
        { neck: [60, 32], pelvis: [44, 48], lHand: [58, 14], rHand: [62, 14], lFoot: [14, 44], rFoot: [18, 54], bend: { lArm: 'up' } },
        ['lLeg', 'rLeg', 'torso'],
      ),
    ],
    arrows: [{ d: 'M50,74 Q30,78 18,64' }],
  }),

  bld_janja: figure({
    scene: 'overhang',
    wall: STEEP_WALL,
    holds: [hold(steep(14) + 2, 14, 'jug', { key: true, rotate: -63 })],
    people: [
      climber(
        {
          neck: [70, 34],
          pelvis: [60, 54],
          lHand: [steep(14) + 2, 14],
          rHand: [steep(14) + 2.5, 15],
          lFoot: [82, 55],
          rFoot: [80, 59],
          joints: { lLeg: [70, 64], rLeg: [68, 66] },
          turn: 1,
          bend: { lArm: 'down', rArm: 'down' },
        },
        ['torso', 'lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M88,74 Q94,64 88,54' }],
  }),

  bld_side_pull: figure({
    scene: 'vertical',
    holds: [hold(26, 34, 'edge', { key: true, rotate: 90 }), hold(64, 16, 'jug'), hold(40, 84, 'foot'), hold(50, 90, 'foot')],
    people: [
      climber(
        { neck: [53, 42], pelvis: [59, 63], lHand: [27.5, 34.5], rHand: [63, 19], lFoot: [41, 82], rFoot: [51, 88] },
        ['lArm'],
      ),
    ],
    arrows: [
      { d: 'M33,26 L42,26', kind: 'force' },
      { d: 'M44,95 L34,95', kind: 'force' },
    ],
  }),

  bld_undercling: figure({
    scene: 'vertical',
    wall: 'M0,0 L28,0 L28,100 L0,100 Z',
    holds: [hold(31, 49, 'edge', { key: true, size: 0.7 }), hold(30, 10, 'jug', { rotate: 90 })],
    people: [
      climber(
        {
          neck: [41, 30],
          pelvis: [45, 52],
          lHand: [32, 52],
          rHand: [31, 11],
          lFoot: [29.5, 66],
          rFoot: [29.5, 75],
          lToe: [-0.3, -1],
          rToe: [-0.3, -1],
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up', lArm: 'right', rArm: 'right' },
        },
        ['lArm'],
      ),
    ],
    arrows: [{ d: 'M36,62 L36,55', kind: 'force' }],
    rings: [[32, 51]],
  }),

  bld_lay_back: figure({
    scene: 'vertical',
    wall: 'M14,0 L32,0 L32,100 L14,100 Z',
    people: [
      climber(
        {
          neck: [54, 30],
          pelvis: [60, 51],
          lHand: [33, 24],
          rHand: [33, 34],
          lFoot: [34, 58],
          rFoot: [34, 70],
          lToe: [-0.3, -1],
          rToe: [-0.3, -1],
          turn: 0.8,
          bend: { lLeg: 'up', rLeg: 'up' },
        },
        ['lArm', 'rArm', 'lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M80,70 L80,40' }],
  }),

  bld_elevator_door: figure({
    scene: 'vertical',
    wall: 'M12,0 L45,0 L45,100 L12,100 Z M55,0 L88,0 L88,100 L55,100 Z',
    people: [
      climber(
        { neck: [50, 30], pelvis: [50, 52], lHand: [45.5, 41], rHand: [54.5, 41], lFoot: [40, 78], rFoot: [60, 78], lToe: [-1, 0.3], rToe: [1, 0.3] },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [
      { d: 'M28,50 L18,50', kind: 'force' },
      { d: 'M72,50 L82,50', kind: 'force' },
    ],
  }),

  bld_gastondercling: figure({
    scene: 'vertical',
    holds: [hold(61, 56, 'jug', { key: true, rotate: -45 }), hold(40, 16, 'jug'), hold(42, 82, 'foot'), hold(58, 80, 'foot')],
    people: [
      climber(
        { neck: [50, 40], pelvis: [51, 62], lHand: [41, 18], rHand: [63, 58.5], lFoot: [42, 80], rFoot: [58, 78], turn: 0.3 },
        ['rArm'],
      ),
    ],
    arrows: [{ d: 'M70,56 L78,48', kind: 'force' }],
  }),

  bld_inverted: figure({
    scene: 'overhang',
    wall: STEEPER_WALL,
    holds: [
      hold(steeper(50) + 2, 50, 'jug', { rotate: -55 }),
      hold(steeper(58) + 2, 58, 'jug', { rotate: -55 }),
      hold(steeper(26) + 2, 26, 'jug', { key: true, rotate: -55 }),
      hold(steeper(34) + 2, 34, 'jug', { key: true, rotate: -55 }),
    ],
    people: [
      climber(
        {
          neck: [56, 66],
          pelvis: [71, 50],
          lHand: [steeper(50) + 2, 50],
          rHand: [steeper(58) + 2, 58],
          lFoot: [steeper(26) + 4, 25],
          rFoot: [steeper(34) + 4, 33],
          lToe: [-0.6, -0.8],
          rToe: [-0.6, -0.8],
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'down' },
        },
        ['lLeg', 'rLeg'],
      ),
    ],
    rings: [[steeper(26) + 2, 26]],
  }),

  bld_inside_figure_four: figure({
    scene: 'overhang',
    holds: [hold(67, 47, 'jug', { key: true, size: 1.2 }), hold(36, 7, 'jug')],
    people: [
      climber(
        {
          neck: [51, 30],
          pelvis: [49, 52],
          lHand: [37, 8.5],
          rHand: [66, 46],
          lFoot: [70, 60],
          rFoot: [50, 82],
          joints: { lLeg: [63, 45.5], rArm: [63, 36] },
          bend: { rLeg: 'left' },
        },
        ['lLeg'],
      ),
    ],
    arrows: [{ d: 'M24,40 L24,20' }],
    rings: [[64, 45]],
  }),

  bld_outside_figure_four: figure({
    scene: 'overhang',
    wall: STEEP_WALL,
    holds: [hold(steep(50) + 2, 50, 'jug', { key: true, rotate: -63, size: 1.2 }), hold(steep(12) + 2, 12, 'jug', { rotate: -63 })],
    people: [
      climber(
        {
          neck: [62, 32],
          pelvis: [66, 54],
          lHand: [steep(12) + 3, 13],
          rHand: [49, 50],
          lFoot: [44, 59],
          rFoot: [70, 84],
          joints: { lLeg: [52, 47] },
          turn: 0.8,
          bend: { rArm: 'down', rLeg: 'left' },
        },
        ['lLeg', 'rArm'],
      ),
    ],
    rings: [[51, 47]],
  }),

  bld_figure_nine: figure({
    scene: 'overhang',
    holds: [hold(74, 51, 'jug', { key: true, size: 1.2 }), hold(18, 30, 'jug')],
    people: [
      climber(
        {
          neck: [52, 34],
          pelvis: [52, 56],
          lHand: [19, 31],
          rHand: [73, 50],
          lFoot: [48, 86],
          rFoot: [79, 59],
          joints: { rLeg: [69, 45.5] },
          bend: { lArm: 'down', rArm: 'down' },
        },
        ['rLeg', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M30,22 L16,22' }],
    rings: [[70, 47]],
  }),

  /* Movement -------------------------------------------------------- */

  bld_deadpoint: figure({
    scene: 'vertical',
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

  bld_dyno: figure({
    scene: 'vertical',
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

  bld_double_dyno: figure({
    scene: 'vertical',
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

  bld_paddle_dyno: figure({
    scene: 'vertical',
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

  bld_cut_loose: figure({
    scene: 'overhang',
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

  bld_swing_catch: figure({
    scene: 'vertical',
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

  bld_pogo: figure({
    scene: 'vertical',
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

  bld_run_jump: figure({
    scene: 'ground',
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

  bld_double_clutch: figure({
    scene: 'vertical',
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

  bld_hip_swing: figure({
    scene: 'vertical',
    wall: 'M0,0 L22,0 L22,100 L0,100 Z',
    holds: [hold(24, 36, 'jug', { rotate: -90 }), hold(24, 15, 'jug', { key: true, rotate: -90 }), hold(23.8, 88, 'foot')],
    people: [
      climber(
        {
          neck: [39, 53],
          pelvis: [50, 74],
          lHand: [25, 36],
          rHand: [25, 36],
          lFoot: [25, 87],
          rFoot: [25, 87],
          turn: 1,
          bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'down' },
        },
        [],
        true,
      ),
      climber(
        {
          neck: [31, 37],
          pelvis: [33, 59],
          lHand: [25, 36],
          rHand: [25.5, 15],
          lFoot: [25, 87],
          rFoot: [25, 87],
          head: [33.5, 30.5],
          joints: { lArm: [29, 47] },
          turn: 1,
          bend: { lLeg: 'left', rLeg: 'left', rArm: 'down' },
        },
        ['torso'],
      ),
    ],
    arrows: [{ d: 'M60,80 Q52,64 40,60' }],
    rings: [[24, 15]],
  }),

  bld_arm_swing: figure({
    scene: 'vertical',
    holds: [hold(38, 33, 'jug'), hold(72, 9, 'jug', { key: true }), hold(44, 81.5, 'foot'), hold(58, 79.5, 'foot')],
    people: [
      climber(
        { neck: [55, 30], pelvis: [54, 52], lHand: [38, 34], rHand: [66, 52], lFoot: [44, 80], rFoot: [58, 78], bend: { lArm: 'down', rArm: 'right' } },
        [],
        true,
      ),
      climber(
        { neck: [55, 30], pelvis: [54, 52], lHand: [38, 34], rHand: [71.5, 10], lFoot: [44, 80], rFoot: [58, 78], bend: { lArm: 'down' } },
        ['rArm'],
      ),
    ],
    arrows: [{ d: 'M72,58 Q90,40 77,18' }],
    rings: [[72, 9]],
  }),

  bld_headbutt: figure({
    scene: 'vertical',
    holds: [hold(34, 34, 'jug'), hold(78, 19, 'jug', { key: true }), hold(42, 85.5, 'foot'), hold(57, 83.5, 'foot')],
    people: [
      climber(
        { neck: [45, 46], pelvis: [48, 68], lHand: [34, 35], rHand: [50, 64], lFoot: [42, 84], rFoot: [57, 82], head: [39.5, 42], bend: { lArm: 'down' } },
        [],
        true,
      ),
      climber(
        { neck: [56, 37], pelvis: [52, 59], lHand: [34, 35], rHand: [76, 20], lFoot: [42, 84], rFoot: [57, 82], head: [62, 31.5], bend: { lArm: 'down' } },
        ['head', 'torso'],
      ),
    ],
    arrows: [{ d: 'M36,35 Q44,18 57,24' }],
    rings: [[78, 19]],
  }),

  bld_step_up_dyno: figure({
    scene: 'vertical',
    holds: [hold(40, 52, 'jug'), hold(58, 52, 'jug'), hold(68.5, 74, 'foot', { key: true }), hold(42, 95, 'foot'), hold(55, 6, 'jug', { key: true, size: 1.3 })],
    people: [
      climber(
        { neck: [49, 62], pelvis: [50, 82], lHand: [40, 53], rHand: [58, 53], lFoot: [42, 93], rFoot: [68, 72], bend: { lArm: 'down', rArm: 'down', rLeg: 'up' } },
        [],
        true,
      ),
      climber(
        { neck: [58, 22], pelvis: [61, 44], lHand: [51, 7], rHand: [59, 7], lFoot: [54, 73], rFoot: [68, 72], bend: { lLeg: 'in' } },
        ['rLeg', 'lArm', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M82,76 Q90,42 70,12' }],
    rings: [[68.5, 74]],
  }),

  bld_one_arm_dyno: figure({
    scene: 'vertical',
    holds: [hold(40, 47, 'jug'), hold(56, 47, 'jug'), hold(68, 8, 'jug', { key: true }), hold(38, 91, 'foot'), hold(58, 91, 'foot')],
    people: [
      climber(
        { neck: [48, 61], pelvis: [48, 78], lHand: [40, 48], rHand: [56, 48], lFoot: [38, 89], rFoot: [58, 89], bend: { lLeg: 'out', rLeg: 'out' } },
        [],
        true,
      ),
      climber(
        { neck: [62, 30], pelvis: [60, 52], lHand: [47, 50], rHand: [67.5, 9], lFoot: [55, 80], rFoot: [62, 81], bend: { lArm: 'out' } },
        ['rArm'],
      ),
    ],
    arrows: [{ d: 'M28,76 Q26,30 56,12' }],
    rings: [[68, 8]],
  }),

  bld_swing_jump: figure({
    scene: 'vertical',
    holds: [hold(28, 13, 'jug'), hold(76, 22, 'jug', { key: true })],
    people: [
      climber(
        { neck: [36, 34], pelvis: [48, 52], lHand: [26, 14], rHand: [30, 14], lFoot: [62, 74], rFoot: [67, 70], bend: { lLeg: 'down', rLeg: 'down' } },
        [],
        true,
      ),
      climber(
        { neck: [64, 40], pelvis: [61, 62], lHand: [49, 27], rHand: [75, 23], lFoot: [55, 90], rFoot: [61, 91], bend: { lArm: 'down', lLeg: 'right', rLeg: 'right' } },
        ['rArm', 'torso'],
      ),
    ],
    arrows: [{ d: 'M40,24 Q55,6 70,15' }],
    rings: [[76, 22]],
  }),

  bld_hand_match: figure({
    scene: 'vertical',
    holds: [hold(42, 20, 'jug', { key: true, size: 1.3 }), hold(68, 32, 'jug'), hold(44, 87.5, 'foot'), hold(60, 85.5, 'foot')],
    people: [
      climber({ neck: [48, 41], pelvis: [50, 63], lHand: [39, 21], rHand: [67, 33], lFoot: [44, 85.5], rFoot: [60, 83.5] }, [], true),
      climber(
        { neck: [48, 41], pelvis: [50, 63], lHand: [39, 21], rHand: [45.5, 21], lFoot: [44, 85.5], rFoot: [60, 83.5] },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M70,24 Q64,12 52,14' }],
    rings: [[42, 20]],
  }),

  bld_foot_match: figure({
    scene: 'vertical',
    holds: [hold(40, 15, 'jug'), hold(60, 15, 'jug'), hold(50, 85, 'edge', { key: true }), hold(69, 75, 'foot')],
    people: [
      climber({ neck: [50, 35], pelvis: [50, 57], lHand: [40, 16], rHand: [60, 16], lFoot: [47, 83.5], rFoot: [68.5, 73] }, [], true),
      climber(
        { neck: [50, 35], pelvis: [50, 57], lHand: [40, 16], rHand: [60, 16], lFoot: [47, 83.5], rFoot: [53, 83.5] },
        ['lLeg', 'rLeg'],
      ),
    ],
    rings: [[50, 85]],
  }),

  bld_piano_match: figure({
    scene: 'close-up',
    wall: 'M28,24 L72,24 L72,32 L28,32 Z',
    extra: [
      // left hand, leaving: little and ring finger still on, middle and index lifted
      { pts: [[12, 104], [29, 63]], width: 10, tone: 'body' },
      { pts: [[26, 48], [40, 44], [41, 57], [30, 61]], width: 3, tone: 'body', closed: true },
      { pts: [[27.5, 47], [30, 35], [31.5, 27]], width: 3.4, tone: 'body' },
      { pts: [[32, 46], [34.5, 34], [36, 27]], width: 3.4, tone: 'body' },
      { pts: [[36.5, 45], [39, 39]], width: 3.4, tone: 'body' },
      { pts: [[40, 44.5], [43, 40]], width: 3.4, tone: 'body' },
      { pts: [[40, 54], [45, 50]], width: 3.2, tone: 'body' },
      // right hand, arriving: index and middle finger on, ring and little still to come
      { pts: [[86, 104], [65, 63]], width: 10, tone: 'body' },
      { pts: [[52, 45], [66, 49], [64, 61], [53, 58]], width: 3, tone: 'body', closed: true },
      { pts: [[52.5, 45.5], [44.5, 33.5], [41, 27]], width: 3.4, tone: 'focus' },
      { pts: [[57, 46.5], [49.5, 34], [46, 27]], width: 3.4, tone: 'focus' },
      { pts: [[61, 47.5], [57.5, 41.5]], width: 3.4, tone: 'focus' },
      { pts: [[65, 48.5], [62.5, 43.5]], width: 3.4, tone: 'focus' },
      { pts: [[53, 54], [48, 50.5]], width: 3.2, tone: 'body' },
    ],
    arrows: [{ d: 'M64,16 L46,16' }],
  }),

  bld_hand_foot_match: figure({
    scene: 'vertical',
    holds: [hold(43, 14, 'jug'), hold(64, 57, 'jug', { key: true, size: 1.3 }), hold(43, 86.5, 'foot')],
    people: [
      climber(
        {
          neck: [52, 35],
          pelvis: [54, 57],
          lHand: [43, 15],
          rHand: [60.5, 56.5],
          lFoot: [43, 84.5],
          rFoot: [68, 56],
          joints: { rLeg: [67, 43] },
          rToe: [-1, 0.1],
          bend: { rArm: 'in' },
        },
        ['rLeg'],
      ),
    ],
    arrows: [{ d: 'M44,68 Q58,74 64,66' }],
    rings: [[64, 57]],
  }),

  bld_houdini: figure({
    scene: 'close-up',
    wall: 'M0,0 L24,0 L24,50 L36,50 L36,54 L24,54 L24,100 L0,100 Z',
    extra: [
      // bottom hand, gripping the edge
      { pts: [[56, 104], [48, 68]], width: 9, tone: 'body' },
      { pts: [[48, 68], [43, 50]], width: 7, tone: 'body' },
      { pts: [[43, 50], [37, 41.5], [31, 44], [28, 49.5]], width: 3.6, tone: 'body' },
      // top hand, laid over the holding fingers
      { pts: [[86, 104], [62, 62]], width: 9, tone: 'focus' },
      { pts: [[62, 62], [50, 45]], width: 7, tone: 'focus' },
      { pts: [[50, 45], [41, 36], [33, 38], [29, 43.5]], width: 3.6, tone: 'focus' },
    ],
    arrows: [{ d: 'M90,52 L76,52', kind: 'force' }],
  }),

  bld_foot_cross: figure({
    scene: 'vertical',
    holds: [hold(36, 20, 'jug'), hold(62, 18, 'jug'), hold(37, 83.5, 'foot'), hold(54, 86.5, 'foot'), hold(69, 81.5, 'foot', { key: true })],
    people: [
      climber(
        { neck: [50, 36], pelvis: [52, 58], lHand: [36, 21], rHand: [62, 19], lFoot: [37, 81.5], rFoot: [54, 84.5], turn: 0.4 },
        [],
        true,
      ),
      climber(
        { neck: [50, 36], pelvis: [52, 58], lHand: [36, 21], rHand: [62, 19], lFoot: [68.5, 79.5], rFoot: [54, 84.5], turn: 0.4, bend: { lLeg: 'down' } },
        ['lLeg'],
      ),
    ],
    arrows: [{ d: 'M36,92 Q52,100 66,90' }],
    rings: [[69, 81.5]],
  }),

  bld_hand_cross: figure({
    scene: 'vertical',
    holds: [hold(36, 26, 'jug'), hold(52, 20, 'jug'), hold(65.5, 18, 'jug', { key: true }), hold(48, 88, 'foot'), hold(63, 84, 'foot')],
    people: [
      climber(
        { neck: [58, 38], pelvis: [56, 60], lHand: [36.5, 27], rHand: [52, 21], lFoot: [48, 86], rFoot: [63, 82], turn: 0.5, head: [60, 32.5] },
        [],
        true,
      ),
      climber(
        { neck: [58, 38], pelvis: [56, 60], lHand: [65, 19], rHand: [52, 21], lFoot: [48, 86], rFoot: [63, 82], turn: 0.5, head: [60, 32.5], bend: { lArm: 'down', rArm: 'down' } },
        ['lArm'],
      ),
    ],
    arrows: [{ d: 'M36,18 Q50,2 61,10' }],
    rings: [[65.5, 18]],
  }),

  bld_rose_move: figure({
    scene: 'vertical',
    holds: [hold(38, 29, 'jug'), hold(66, 17, 'jug'), hold(73.5, 49.5, 'jug', { key: true }), hold(31.5, 59.5, 'foot'), hold(58, 88.5, 'foot')],
    people: [
      climber(
        {
          neck: [58, 38],
          pelvis: [50, 58],
          lHand: [38.5, 30],
          rHand: [66, 18],
          lFoot: [33, 58],
          rFoot: [58, 86.5],
          joints: { lLeg: [42, 70] },
          lToe: [-1, -0.15],
          turn: 0.75,
        },
        [],
        true,
      ),
      climber(
        {
          neck: [58, 38],
          pelvis: [50, 58],
          lHand: [73, 49],
          rHand: [66, 18],
          lFoot: [33, 58],
          rFoot: [58, 86.5],
          joints: { lLeg: [42, 70] },
          lToe: [-1, -0.15],
          turn: 0.75,
          bend: { lArm: 'down' },
        },
        ['lArm'],
      ),
    ],
    arrows: [{ d: 'M34,38 Q44,66 66,58' }],
    rings: [[73.5, 49.5]],
  }),

  bld_beached_whale: figure({
    scene: 'vertical',
    wall: 'M0,50 L50,50 Q56,50 56,56 L56,100 L0,100 Z',
    people: [
      climber(
        {
          neck: [34, 46],
          pelvis: [56, 47],
          head: [27.5, 43],
          lHand: [12.5, 48],
          rHand: [16, 48.2],
          lFoot: [59.5, 77],
          rFoot: [61.5, 73.5],
          joints: { rArm: [25, 48.2] },
          turn: 1,
          bend: { lArm: 'up', lLeg: 'right', rLeg: 'right' },
        },
        ['torso'],
      ),
    ],
    arrows: [{ d: 'M64,33 L42,33' }],
  }),

  bld_chin: figure({
    scene: 'vertical',
    wall: 'M0,40 L52,40 L52,100 L0,100 Z',
    people: [
      climber(
        {
          neck: [59, 43],
          pelvis: [61, 65],
          head: [56, 35.5],
          lHand: [44, 39],
          rHand: [72, 62],
          lFoot: [54, 82],
          rFoot: [57.5, 93],
          turn: 1,
          bend: { lArm: 'down', rArm: 'right', lLeg: 'right', rLeg: 'right' },
        },
        ['head'],
      ),
    ],
    arrows: [{ d: 'M54,18 L54,26', kind: 'force' }],
    rings: [[52.5, 39.5]],
  }),

  bld_barrel_roll: figure({
    scene: 'vertical',
    wall: 'M4,100 L4,64 Q4,56 12,56 L88,56 Q96,56 96,64 L96,100 Z',
    people: [
      climber(
        {
          neck: [32, 50],
          pelvis: [54, 52],
          head: [26.5, 46],
          lHand: [10, 55.5],
          rHand: [29, 55.5],
          lFoot: [51, 80],
          rFoot: [77, 54.5],
          rToe: [1, -0.4],
          turn: 0.6,
          bend: { rLeg: 'up', lLeg: 'right', rArm: 'left' },
        },
        ['rLeg', 'torso'],
      ),
    ],
    arrows: [{ d: 'M26,86 Q16,72 28,62' }],
    rings: [[78, 55]],
  }),

  bld_soapmaker: figure({
    scene: 'vertical',
    wall: 'M2,100 L2,66 Q50,30 98,66 L98,100 Z',
    people: [
      climber(
        {
          neck: [50, 30],
          pelvis: [51, 52],
          lHand: [37, 49],
          rHand: [63, 49],
          lFoot: [45, 80],
          rFoot: [78, 52.6],
          bend: { lArm: 'in', rArm: 'in', rLeg: 'up' },
        },
        ['lArm', 'rArm'],
      ),
    ],
    extra: [
      { pts: [[37, 48.8], [30, 51]], width: 3.6, tone: 'focus' },
      { pts: [[63, 48.8], [70, 51]], width: 3.6, tone: 'focus' },
    ],
    arrows: [{ d: 'M90,84 Q94,68 84,59' }],
  }),

  bld_midnight_lightning: figure({
    scene: 'vertical',
    wall: 'M4,50 L96,50 L96,100 L4,100 Z',
    people: [
      climber(
        {
          neck: [47, 26],
          pelvis: [54, 48],
          lHand: [35.5, 49.5],
          rHand: [68, 36],
          lFoot: [46, 76],
          rFoot: [79, 49],
          bend: { rLeg: 'up', rArm: 'down' },
        },
        ['lArm', 'rLeg'],
      ),
    ],
    extra: [{ pts: [[35.5, 49], [28, 49]], width: 3.6, tone: 'focus' }],
    arrows: [{ d: 'M58,14 Q74,12 80,30' }],
  }),

  /* Strength -------------------------------------------------------- */

  bld_open_hand: figure({
    scene: 'close-up',
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

  bld_half_crimp: figure({
    scene: 'close-up',
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

  bld_slopers: figure({
    scene: 'vertical',
    holds: [hold(40, 18, 'sloper', { key: true, size: 1.3 }), hold(60, 18, 'sloper', { key: true, size: 1.3 }), hold(40, 88, 'foot'), hold(60, 88, 'foot')],
    people: [
      climber(
        { neck: [50, 42], pelvis: [50, 64], lHand: [40.5, 16], rHand: [59.5, 16], lFoot: [40, 86], rFoot: [60, 86], bend: { lLeg: 'out', rLeg: 'out' } },
        ['lArm', 'rArm'],
      ),
    ],
    arrows: [{ d: 'M50,70 L50,82', kind: 'force' }],
  }),

  bld_pinches: figure({
    scene: 'close-up',
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

  bld_full_crimp: figure({
    scene: 'close-up',
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

  bld_monos: figure({
    scene: 'close-up',
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

  bld_lock_off: figure({
    scene: 'vertical',
    holds: [hold(41, 36, 'jug'), hold(60, 6, 'jug', { key: true }), hold(42, 82, 'foot'), hold(58, 80, 'foot')],
    people: [
      climber(
        { neck: [50, 30], pelvis: [50, 52], lHand: [41, 37], rHand: [59, 8], lFoot: [42, 80], rFoot: [58, 78], joints: { lArm: [40, 43] } },
        ['lArm'],
      ),
    ],
    rings: [[60, 6]],
  }),

  bld_one_arm_lock: figure({
    scene: 'vertical',
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

  bld_hangboard: figure({
    scene: 'board',
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

  bld_campus_move: figure({
    scene: 'overhang',
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

  bld_campus_ladder: figure({
    scene: 'board',
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

  bld_campus_skip: figure({
    scene: 'board',
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

  bld_one_arm_hang: figure({
    scene: 'board',
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

  bld_palm_down: figure({
    scene: 'vertical',
    wall: 'M57,60 L78,60 L82,72 L54,72 Z',
    holds: [hold(38, 15, 'jug'), hold(36, 71, 'foot'), hold(54, 87.5, 'foot')],
    people: [
      climber(
        { neck: [51, 36], pelvis: [48, 58], lHand: [38, 16], rHand: [59, 58.5], lFoot: [36, 69], rFoot: [54, 85.5], bend: { lLeg: 'out' } },
        ['rArm'],
      ),
    ],
    extra: [{ pts: [[58.5, 58.4], [68, 58.4]], width: 3.6, tone: 'focus' }],
    arrows: [{ d: 'M74,38 L74,50', kind: 'force' }],
  }),

  bld_open_crimp: figure({
    scene: 'close-up',
    wall: 'M0,0 L24,0 L24,48 L40,48 L40,53 L24,53 L24,100 L0,100 Z',
    extra: handInProfile(
      [
        [40.8, 44.3],
        [33.8, 44.9],
        [28, 46.5],
      ],
      [57, 67],
      [51.6, 46.2],
      [
        [55, 58],
        [50, 62],
        [47, 60],
      ],
    ),
    arrows: [{ d: 'M72,40 L72,56', kind: 'force' }],
  }),

  bld_quarter_crimp: figure({
    scene: 'close-up',
    wall: 'M0,0 L24,0 L24,48 L40,48 L40,53 L24,53 L24,100 L0,100 Z',
    extra: handInProfile(
      [
        [41, 40.7],
        [34.2, 43],
        [29, 46.5],
      ],
      [55, 67],
      [50.5, 46.5],
      [
        [53, 58],
        [48, 62],
        [45, 60],
      ],
    ),
    arrows: [{ d: 'M72,40 L72,56', kind: 'force' }],
    labels: [{ at: [42, 31], text: '45°' }],
  }),

  bld_meat_hook: figure({
    scene: 'close-up',
    wall: 'M0,0 L24,0 L24,38 L44,38 Q47,38 47,41 L47,57 Q47,60 44,60 L24,60 L24,100 L0,100 Z',
    extra: [
      { pts: [[74, 104], [56, 52]], width: 9, tone: 'body' },
      { pts: [[56, 52], [50.5, 37], [38, 34]], width: 8, tone: 'focus' },
      { pts: [[38, 34], [29, 35.3]], width: 3.6, tone: 'body' },
      { pts: [[52, 46], [44, 47.5], [40, 53]], width: 3.4, tone: 'focus' },
    ],
    arrows: [{ d: 'M74,28 L74,44', kind: 'force' }],
  }),

  bld_thumbercling: figure({
    scene: 'close-up',
    wall: 'M0,0 L24,0 L24,36 L42,45.5 L42,49 L24,49 L24,100 L0,100 Z',
    extra: [
      { pts: [[64, 104], [52, 76]], width: 9, tone: 'body' },
      { pts: [[52, 76], [44, 66]], width: 7, tone: 'body' },
      { pts: [[44, 66], [37.5, 67.5], [38.5, 73]], width: 3.4, tone: 'body' },
      { pts: [[47, 68], [40, 59], [35, 51]], width: 3.6, tone: 'focus' },
    ],
    arrows: [{ d: 'M72,66 L72,50', kind: 'force' }],
    rings: [[35, 51]],
  }),

  bld_front_back_three: figure({
    scene: 'close-up',
    wall: `M0,0 L100,0 L100,100 L0,100 Z ${hole(28, 36.5, 8.5, 4.6)} ${hole(72, 36.5, 8.5, 4.6)}`,
    extra: [...handFromBehind(30, ['in', 'in', 'in', 'off'], 0.8), ...handFromBehind(70, ['off', 'in', 'in', 'in'], 0.8)],
    labels: [
      { at: [28, 24], text: 'F3' },
      { at: [72, 24], text: 'B3' },
    ],
  }),

  bld_two_finger_pocket: figure({
    scene: 'close-up',
    wall: `M0,0 L100,0 L100,100 L0,100 Z ${hole(50, 33, 7.5, 5)}`,
    extra: handFromBehind(50, ['off', 'in', 'in', 'off']),
  }),

  bld_stacked_fingers: figure({
    scene: 'close-up',
    wall: 'M0,0 L30,0 L30,48 L16,48 L16,52 L30,52 L30,100 L0,100 Z',
    extra: [
      { pts: [[62, 104], [52, 66]], width: 9, tone: 'body' },
      { pts: [[52, 66], [46, 51]], width: 7, tone: 'body' },
      { pts: [[46, 51], [38, 50], [19, 50]], width: 3.4, tone: 'focus' },
      { pts: [[46.5, 46], [40, 37], [34.5, 41], [32.5, 46.4]], width: 3.4, tone: 'focus' },
      { pts: [[47, 56], [40, 58], [41, 63]], width: 3.2, tone: 'body' },
    ],
    arrows: [{ d: 'M33,24 L33,33', kind: 'force' }],
  }),

  bld_closed_mono: figure({
    scene: 'close-up',
    wall: 'M0,0 L30,0 L30,44.5 L27,45.5 L27,49.5 L30,50.5 L30,100 L0,100 Z',
    extra: [
      { pts: [[62, 104], [52, 64]], width: 9, tone: 'body' },
      { pts: [[52, 64], [46, 48]], width: 7, tone: 'body' },
      { pts: [[46, 48], [39, 37], [33, 42], [29.5, 47.5]], width: 3.4, tone: 'focus' },
      { pts: [[47, 54], [40, 56], [41, 61]], width: 3.2, tone: 'body' },
    ],
    rings: [[28.5, 47.5]],
  }),
};

const fixed = new Map<string, FigureSpec | undefined>();

export function boulderingFigure(id: string): FigureSpec | undefined {
  if (!fixed.has(id)) fixed.set(id, FIGURES[id] && patched(id, FIGURES[id]));
  return fixed.get(id);
}

/** The figure exactly as drawn here, before any studio fix: for the figure studio. */
export function boulderingFigureAsBuilt(id: string): FigureSpec | undefined {
  return FIGURES[id];
}

/** For checks: every skill id that has a drawing. */
export const BOULDERING_FIGURE_IDS = Object.keys(FIGURES);
