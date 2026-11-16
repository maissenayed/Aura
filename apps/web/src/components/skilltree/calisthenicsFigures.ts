import { Arrow, Disc, FigureSpec, Hold, Pt, Scene, Stroke } from './SkillFigure';
import { Drawn, Part, SilhouettePose, add, figure, hold, len, mul, scaled, silhouette, sub, unit } from './figureKit';

/**
 * Animated silhouettes for the calisthenics tree, levels 1–3.
 *
 * Exercises are drawn by movement family — push-ups, dips, pull-ups, rows,
 * levers, squats… — each a small function with options, so that variants
 * read as themselves (incline or decline, rings or bars, tuck or one leg)
 * without a hand-made drawing per exercise. Every figure has a start and an
 * end pose; the details panel loops between them, the card shows the start.
 *
 * Side views face right; the far arm and leg are drawn darker.
 */

/* ------------------------------------------------------------------ */
/* Scenery and helpers                                                 */
/* ------------------------------------------------------------------ */

/** Centre line of a limb resting on the floor. */
const G = 83.5;
const FLOOR = 'M0,86 L100,86 L100,100 L0,100 Z';
const LOW_FLOOR = 'M0,91 L100,91 L100,100 L0,100 Z';
const BAR_ACROSS = (y: number) => `M8,${y - 1.6} L92,${y - 1.6} L92,${y + 1.6} L8,${y + 1.6} Z`;
const PARALLEL_BARS =
  'M20,49 L80,49 L80,51.6 L20,51.6 Z M24,51.6 L26.4,51.6 L26.4,86 L24,86 Z M73.6,51.6 L76,51.6 L76,86 L73.6,86 Z';
const WALL_RIGHT = 'M86,0 L100,0 L100,86 L86,86 Z';
const BOX_LEFT = 'M6,62 L32,62 L32,86 L6,86 Z';
const BENCH_LEFT = 'M4,64 L30,64 L30,68.5 L4,68.5 Z M7,68.5 L10,68.5 L10,86 L7,86 Z M24,68.5 L27,68.5 L27,86 L24,86 Z';

const S = (pose: SilhouettePose, focus: Part[] = []) => silhouette(pose, focus);
const FRONT = (pose: Omit<SilhouettePose, 'view'>, focus: Part[] = []) => silhouette({ ...pose, view: 'front' }, focus);

const toward = (from: Pt, to: Pt, length: number): Pt => add(from, mul(unit(sub(to, from)), length));
const behind = (p: Pt, dx = -1.5, dy = 0): Pt => [p[0] + dx, p[1] + dy];

/**
 * Where two circles cross — the point `ra` from `a` and `rb` from `b` —
 * preferring the crossing that `prefer` scores higher. Falls back to the
 * nearest point on the line between them when the circles don't meet.
 */
function meet(a: Pt, ra: number, b: Pt, rb: number, prefer: (p: Pt) => number): Pt {
  const span = sub(b, a);
  const d = len(span);
  if (d > ra + rb || d < Math.abs(ra - rb) || d === 0) return toward(a, b, Math.min(ra, d));
  const along = (ra * ra - rb * rb + d * d) / (2 * d);
  const off = Math.sqrt(Math.max(0, ra * ra - along * along));
  const base = add(a, mul(span, along / d));
  const normal: Pt = [(-span[1] / d) * off, (span[0] / d) * off];
  const p1 = add(base, normal);
  const p2 = sub(base, normal);
  return prefer(p1) >= prefer(p2) ? p1 : p2;
}
const higher = (p: Pt) => -p[1];
const lower = (p: Pt) => p[1];
const righter = (p: Pt) => p[0];

/** Body from the neck to the feet when held straight (torso plus legs). */
const BODY = 51.5;
const ARM = 23.5;

/** A figure plus the things it holds: straps and bands behind it, rings and plates in front. */
const kit = (person: Drawn, discs: Disc[] = [], strokes: Stroke[] = []): Drawn => ({
  strokes: [...strokes, ...person.strokes],
  discs: [...person.discs, ...discs],
});
const ring = (hand: Pt): Disc => ({ at: [hand[0], hand[1] - 1], r: 3.4, tone: 'body', kind: 'ring' });
const strap = (hand: Pt, anchorX = hand[0]): Stroke => ({ pts: [[anchorX, -2], [hand[0], hand[1] - 4.4]], width: 1, tone: 'gear' });
const onRings = (person: Drawn, hands: Pt[], anchors?: number[]): Drawn =>
  kit(
    person,
    hands.map(ring),
    hands.map((hand, index) => strap(hand, anchors?.[index])),
  );
const plateAt = (at: Pt, r = 5): Disc => ({ at, r, tone: 'body', kind: 'plate' });
const band = (pts: Pt[]): Stroke => ({ pts, width: 1.4, tone: 'gear' });

interface Clip {
  scene: Scene;
  wall?: string;
  holds?: Hold[];
  start: Drawn;
  end: Drawn;
  seconds?: number;
  tempo?: 'even' | 'slow-return';
  arrows?: Arrow[];
  labels?: FigureSpec['labels'];
}

const clip = ({ start, end, seconds = 2.6, tempo, ...scene }: Clip): FigureSpec =>
  figure({ ...scene, people: [start], motion: { people: [end], seconds, tempo } });

const ARMS: Part[] = ['lArm', 'rArm'];
const PUSH: Part[] = ['lArm', 'rArm', 'torso'];
const LEGS: Part[] = ['lLeg', 'rLeg'];
const CORE: Part[] = ['torso', 'lLeg', 'rLeg'];

/* ------------------------------------------------------------------ */
/* Push-ups                                                            */
/* ------------------------------------------------------------------ */

interface PushUpOptions {
  /** shoulder: hands under the shoulders · diamond: hands together under the chest · pseudo: hands back by the waist. */
  grip?: 'shoulder' | 'diamond' | 'pseudo';
  rings?: boolean;
  tempo?: 'even' | 'slow-return';
}

/** A rigid plank pivoting on the toes, from straight arms to chest near the hands. */
function pushUp({ grip = 'shoulder', rings = false, tempo }: PushUpOptions = {}): FigureSpec {
  const feet: Pt = [14, G];
  const handX = grip === 'pseudo' ? 52 : grip === 'diamond' ? 60 : 63;
  const hands: Pt = rings ? [handX, G - 7] : [handX, G];
  const reach = grip === 'pseudo' ? ARM - 1 : ARM;
  const up = meet(feet, BODY, hands, reach, higher);
  const downY = rings ? G - 12 : G - 8;
  const down: Pt = [feet[0] + Math.sqrt(BODY * BODY - (feet[1] - downY) ** 2), downY];
  const pose = (neck: Pt) => {
    const person = S(
      { neck, pelvis: toward(neck, feet, 22), lHand: hands, rHand: behind(hands, -1.5), lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: 'up', rArm: 'up' } },
      grip === 'diamond' ? ARMS : PUSH,
    );
    return rings ? onRings(person, [hands, behind(hands, -1.5)]) : person;
  };
  return clip({ scene: rings ? 'rings' : 'floor', wall: FLOOR, start: pose(up), end: pose(down), tempo, seconds: 2.4 });
}

/** Archer push-up, seen head-on: one arm bends, the other stays straight out to the side. */
function archerPushUp(): FigureSpec {
  const pose = (neck: Pt, pelvis: Pt) =>
    FRONT(
      { neck, pelvis, lHand: [24, G], rHand: [64, G], lFoot: [pelvis[0] - 2, pelvis[1] + 2], rFoot: [pelvis[0] + 2, pelvis[1] + 2], bend: { rArm: 'out' } },
      ['lArm', 'rArm'],
    );
  return clip({ scene: 'floor', wall: FLOOR, start: pose([48, 58], [48, 64]), end: pose([58, 72], [57, 77]), seconds: 2.8 });
}

/* ------------------------------------------------------------------ */
/* Pike and headstand presses                                          */
/* ------------------------------------------------------------------ */

interface PikeOptions {
  /** Feet on a box instead of the floor. */
  box?: boolean;
  /** Lower all the way until the head touches the floor. */
  toHead?: boolean;
}

/** Hips high, hands on the floor; the head travels down in front of the hands. */
function pikePress({ box = false, toHead = false }: PikeOptions = {}): FigureSpec {
  const hands: Pt = [70, G];
  const feet: Pt = box ? [26, 60] : [32, G];
  const pelvis: Pt = box ? [52, 40] : [44, 56];
  const pose = (neck: Pt, hips: Pt) =>
    S({ neck, pelvis: hips, lHand: hands, rHand: behind(hands, -1.5), lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: 'up', rArm: 'up', lLeg: 'left', rLeg: 'left' } }, PUSH);
  const upNeck = meet(pelvis, 22, hands, ARM, righter);
  const lowHips: Pt = [pelvis[0] + 3, pelvis[1] + (box ? 3 : 4)];
  const lowNeck = toward(lowHips, [hands[0] - 2, toHead ? G + 4 : G - 4], 22);
  return clip({ scene: 'floor', wall: box ? `${BOX_LEFT} ${FLOOR}` : FLOOR, start: pose(upNeck, pelvis), end: pose(lowNeck, lowHips), seconds: 2.8 });
}

/* ------------------------------------------------------------------ */
/* Upside down against a wall                                          */
/* ------------------------------------------------------------------ */

/** Handstand push-up against the wall: from straight arms to the head on the floor. */
function wallPress(tempo?: 'slow-return'): FigureSpec {
  const hands: Pt = [74, G];
  const pose = (neck: Pt) => {
    const pelvis: Pt = [neck[0] + 2, neck[1] - 22];
    return S({ neck, pelvis, lHand: hands, rHand: behind(hands, -1.5), lFoot: [80.5, pelvis[1] - 29], rFoot: [80.5, pelvis[1] - 27.5], bend: { lArm: 'left', rArm: 'left' } }, PUSH);
  };
  return clip({ scene: 'floor', wall: `${WALL_RIGHT} ${FLOOR}`, start: pose([75, 61]), end: pose([77, 72.5]), tempo, seconds: tempo ? 3.4 : 2.6 });
}

/** Handstand against the wall: chest to the wall (strict) or back to the wall. */
function wallHandstand(chestToWall: boolean): FigureSpec {
  const hands: Pt = chestToWall ? [78, G] : [68, G];
  const pose = (push: number) => {
    const neck: Pt = [hands[0] + (chestToWall ? 0.5 : 2), 60 - push];
    const pelvis: Pt = [neck[0] + (chestToWall ? 1.5 : 4), neck[1] - 22];
    const feet: Pt = [chestToWall ? 81.5 : 81, pelvis[1] - 28.5];
    return S({ neck, pelvis, lHand: hands, rHand: behind(hands, -1.5), lFoot: feet, rFoot: behind(feet, 0, 1.5) }, ['lArm', 'rArm', 'torso']);
  };
  return clip({ scene: 'floor', wall: `${WALL_RIGHT} ${FLOOR}`, start: pose(0), end: pose(2), seconds: 2.4, arrows: [{ d: chestToWall ? 'M60,40 L60,30' : 'M50,40 L50,30' }] });
}

/** Tripod headstand against the wall: head and hands down, legs going from tucked to straight up. */
function wallHeadstand(): FigureSpec {
  const neck: Pt = [72, 72];
  const pelvis: Pt = [74, 50];
  const pose = (feet: Pt, knees?: Pt) =>
    S(
      { neck, pelvis, lHand: [62, G], rHand: [60.5, G], lFoot: feet, rFoot: behind(feet, 0, 1.5), bend: { lArm: 'up', rArm: 'up' }, joints: knees ? { lLeg: knees, rLeg: behind(knees, 0, 1.5) } : undefined },
      ['torso', 'lLeg', 'rLeg'],
    );
  return clip({ scene: 'floor', wall: `${WALL_RIGHT} ${FLOOR}`, start: pose([64, 58], [64, 40]), end: pose([80.5, 21], [77.5, 35.5]), seconds: 3 });
}

/** Wall plank: feet up the wall, hands walking in until the body is steep. */
function wallPlank(): FigureSpec {
  const pose = (hands: Pt, feet: Pt) => {
    const neck = meet(feet, BODY, hands, ARM, higher);
    return S({ neck, pelvis: toward(neck, feet, 22), lHand: hands, rHand: behind(hands, 1.5), lFoot: feet, rFoot: behind(feet, 0, 1.5) }, PUSH);
  };
  return clip({ scene: 'floor', wall: `${WALL_RIGHT} ${FLOOR}`, start: pose([34, G], [83.5, 54]), end: pose([50, G], [83.5, 30]), seconds: 3 });
}

/** Frog stand: knees resting on the elbows, leaning forward until the feet lift. */
function frogStand(): FigureSpec {
  const hands: Pt = [60, G];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    S(
      { neck, pelvis, lHand: hands, rHand: behind(hands, -1.5), lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: 'left', rArm: 'left' }, joints: { lLeg: [56, 66], rLeg: [55, 67] } },
      ['lArm', 'rArm', 'torso'],
    );
  return clip({ scene: 'floor', wall: FLOOR, start: pose([63, 59], [44, 64], [42, G]), end: pose([67, 64], [48, 56], [42, 72]), seconds: 2.6 });
}

/* ------------------------------------------------------------------ */
/* Dips and supports                                                   */
/* ------------------------------------------------------------------ */

interface DipOptions {
  rings?: boolean;
  /** How far down: a full dip, or a partial one to about 75°. */
  depth?: 'full' | 'partial';
  extra?: 'band' | 'plate' | 'floor';
  tempo?: 'even' | 'slow-return';
}

function dip({ rings = false, depth = 'full', extra, tempo }: DipOptions = {}): FigureSpec {
  const hands: Pt = [50, 49.5];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) => {
    let person = S(
      { neck, pelvis, lHand: hands, rHand: behind(hands, -1.5), lFoot: feet, rFoot: behind(feet, -2, -2), bend: { lArm: 'left', rArm: 'left', lLeg: 'right', rLeg: 'right' } },
      PUSH,
    );
    if (rings) person = onRings(person, [hands, behind(hands, -1.5)]);
    if (extra === 'plate') person = kit(person, [plateAt([pelvis[0] + 1, pelvis[1] + 13])], [band([pelvis, [pelvis[0] + 1, pelvis[1] + 9]])]);
    if (extra === 'band') person = kit(person, [], [band([[24, 50.5], [feet[0], feet[1] + 2.5], [76, 50.5]])]);
    return person;
  };
  const top = pose([50, 26.5], [48, 48.5], [42, 74]);
  const bottom = depth === 'partial' ? pose([53.5, 34], [46, 54.5], [39, 79]) : pose([55, 40], [44, 59], [36, 82]);
  const wall = rings ? FLOOR : `${PARALLEL_BARS} ${extra === 'floor' ? FLOOR : ''}`;
  return clip({ scene: rings ? 'rings' : 'bars', wall, start: top, end: bottom, tempo, seconds: tempo ? 3.4 : 2.6 });
}

interface SupportOptions {
  rings?: boolean;
  /** Rings turned out: the hands rotate so the thumbs point away from the body. */
  turnedOut?: boolean;
  /** Shrug the body down and press it back up with the shoulders. */
  press?: boolean;
}

/** Straight-arm support, seen from the front. */
function support({ rings = true, turnedOut = false, press = false }: SupportOptions = {}): FigureSpec {
  const l: Pt = [40, 52];
  const r: Pt = [60, 52];
  const pose = (neckY: number) => {
    const person = FRONT(
      {
        neck: [50, neckY],
        pelvis: [50, neckY + 22],
        lHand: l,
        rHand: r,
        lFoot: [47.5, neckY + 50.5],
        rFoot: [52.5, neckY + 50.5],
        // Straight arms that shorten as the shoulders rise or sink.
        joints: { lArm: [(44.4 + l[0]) / 2, (neckY + l[1]) / 2], rArm: [(55.6 + r[0]) / 2, (neckY + r[1]) / 2], lLeg: [48, neckY + 36], rLeg: [52, neckY + 36] },
      },
      ['lArm', 'rArm', 'torso'],
    );
    return rings ? onRings(person, [l, r], [38, 62]) : person;
  };
  const arrows: Arrow[] = turnedOut
    ? [
        { d: 'M33,60 Q30,55 34,50', kind: 'force' },
        { d: 'M67,60 Q70,55 66,50', kind: 'force' },
      ]
    : [];
  return clip({
    scene: rings ? 'rings' : 'bars',
    wall: rings ? FLOOR : 'M8,50.5 L92,50.5 L92,53.5 L8,53.5 Z',
    start: pose(press ? 33 : 30),
    end: pose(press ? 26.5 : 28),
    seconds: press ? 2.2 : 2.6,
    arrows,
  });
}

/* ------------------------------------------------------------------ */
/* Pull-ups, seen from the front                                       */
/* ------------------------------------------------------------------ */

interface PullUpOptions {
  extra?: 'jump' | 'band' | 'plate';
  /** explosive: pull so hard the hands come off the bar · scapular: straight arms, shoulders only. */
  kind?: 'pull' | 'explosive' | 'scapular';
  tempo?: 'even' | 'slow-return';
  rings?: boolean;
}

function pullUp({ extra, kind = 'pull', tempo, rings = false }: PullUpOptions = {}): FigureSpec {
  const barY = 14;
  const pose = (neckY: number, handsY = barY, straight = false) => {
    const neck: Pt = [50, neckY];
    const pelvis: Pt = [50, neckY + 22];
    const l: Pt = [40, handsY];
    const r: Pt = [60, handsY];
    const feetY = extra === 'jump' && neckY > 30 ? 88 : neckY + 50;
    let person = FRONT(
      {
        neck,
        pelvis,
        lHand: l,
        rHand: r,
        lFoot: [47.5, feetY],
        rFoot: [52.5, feetY],
        bend: { lArm: 'down', rArm: 'down', lLeg: 'in', rLeg: 'in' },
        joints: straight ? { lArm: [(44.4 + l[0]) / 2, (neckY + l[1]) / 2], rArm: [(55.6 + r[0]) / 2, (neckY + r[1]) / 2] } : undefined,
      },
      ARMS,
    );
    if (rings) person = onRings(person, [l, r]);
    if (extra === 'plate') person = kit(person, [plateAt([50, pelvis[1] + 12], 5.5)], [band([[46.5, pelvis[1]], [50, pelvis[1] + 7], [53.5, pelvis[1]]])]);
    if (extra === 'band') person = kit(person, [], [band([[44, barY + 1], [47.5, feetY + 2.5], [52.5, feetY + 2.5], [56, barY + 1]])]);
    return person;
  };
  const wall = rings ? '' : BAR_ACROSS(barY);
  const scene: Scene = rings ? 'rings' : 'bar';
  if (kind === 'scapular') return clip({ scene, wall, start: pose(36.5, barY, true), end: pose(31.5, barY, true), seconds: 2, arrows: [{ d: 'M30,46 L30,37' }, { d: 'M70,46 L70,37' }] });
  if (kind === 'explosive')
    return clip({ scene, wall, start: pose(35), end: pose(15, barY - 7), seconds: 1.8, arrows: [{ d: 'M80,40 L80,22' }] });
  const ground = extra === 'jump' ? ` ${LOW_FLOOR}` : '';
  const hang = pose(35);
  const top = pose(18.5);
  return tempo === 'slow-return'
    ? clip({ scene, wall: wall + ground, start: top, end: hang, tempo, seconds: 3.4 })
    : clip({ scene, wall: wall + ground, start: hang, end: top, seconds: extra === 'jump' ? 2.2 : 2.4 });
}

/* ------------------------------------------------------------------ */
/* Side-on bar work: kips, chest-to-bar, muscle-ups                    */
/* ------------------------------------------------------------------ */

const BAR_HOLD = (x: number, y: number) => [hold(x, y, 'bar')];

/** Dead hang to a strong arch: chest up, shoulder blades pulled back. */
function archHang(): FigureSpec {
  const bar: Pt = [50, 12];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet), bend: { lArm: 'left', rArm: 'left' } }, ['torso', 'lArm', 'rArm']);
  return clip({ scene: 'bar', holds: BAR_HOLD(50, 12), start: pose([49, 35.5], [48, 57.5], [47, 86]), end: pose([55, 32.5], [47, 53], [40, 81]), seconds: 2.4 });
}

/** Chest-to-bar pull-up: the body leans back so the chest meets the bar. */
function chestToBar(): FigureSpec {
  const bar: Pt = [56, 12];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet), bend: { lArm: 'down', rArm: 'down', lLeg: 'right', rLeg: 'right' } }, ['lArm', 'rArm', 'torso']);
  return clip({ scene: 'bar', holds: BAR_HOLD(56, 12), start: pose([55, 35.5], [53, 57.5], [52, 86]), end: pose([49, 17], [40, 37], [44, 64]), seconds: 2.4 });
}

/** Kipping pull-up: a hollow-to-arch swing that throws the chin over the bar. */
function kipPullUp(): FigureSpec {
  const bar: Pt = [52, 12];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet), bend: { lArm: 'down', rArm: 'down' } }, ['torso', 'lLeg', 'rLeg']);
  return clip({ scene: 'bar', holds: BAR_HOLD(52, 12), start: pose([54, 35], [48, 56], [33, 80]), end: pose([50, 18.5], [52, 40.5], [76, 56]), seconds: 1.8, arrows: [{ d: 'M30,90 Q56,98 80,70' }] });
}

/** Muscle-up from a hang to support over the bar (or the slow way down for negatives). Drawn smaller to fit both ends. */
function muscleUp(tempo?: 'slow-return'): FigureSpec {
  const bar: Pt = [50, 37];
  const k = 0.78;
  const pose = (neck: Pt, pelvis: Pt, feet: Pt, bendArms: 'down' | 'up' = 'down') =>
    scaled(
      S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet), bend: { lArm: bendArms, rArm: bendArms } }, ['lArm', 'rArm', 'torso']),
      k,
      bar,
    );
  const hang = pose([48, 61.5], [46, 83.5], [45, 112]);
  const support = pose([53, 14.5], [50, 37], [47, 65]);
  const wall = BAR_ACROSS(bar[1]);
  return tempo
    ? clip({ scene: 'bar', wall, start: support, end: hang, tempo, seconds: 3.6 })
    : clip({ scene: 'bar', wall, start: hang, end: support, seconds: 2.4 });
}

/* ------------------------------------------------------------------ */
/* Hanging leg work                                                    */
/* ------------------------------------------------------------------ */

type HangLegs = 'l-hang' | 'straight-raise' | 'knees-to-bar';

/** Hanging from a bar, raising the legs. */
function hangingRaise(kind: HangLegs): FigureSpec {
  const bar: Pt = [50, 12];
  const neck: Pt = [50, 35.5];
  const pose = (pelvis: Pt, feet: Pt, knees?: Pt) =>
    S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet, 0, 1.5), joints: knees ? { lLeg: knees, rLeg: behind(knees, 0, 1.5) } : undefined }, CORE);
  const hang = pose([50, 57.5], [50, 86.5]);
  const end =
    kind === 'l-hang'
      ? pose([48, 57.5], [77, 57])
      : kind === 'straight-raise'
        ? pose([56, 54], [67, 26])
        : pose([54, 55], [56, 34], [64, 44]);
  return clip({ scene: 'bar', holds: BAR_HOLD(50, 12), start: hang, end, seconds: kind === 'l-hang' ? 2.6 : 2.4 });
}

/** L-sit pull-up on wide rings: legs held level while the body rises. */
function ringLPull(): FigureSpec {
  const pose = (neckY: number) => {
    const neck: Pt = [46, neckY];
    const pelvis: Pt = [46, neckY + 22];
    const hand: Pt = [48, 12];
    return onRings(S({ neck, pelvis, lHand: hand, rHand: behind(hand, 1.5), lFoot: [75, pelvis[1]], rFoot: [75, pelvis[1] + 1.5], bend: { lArm: 'right', rArm: 'right' } }, ['lArm', 'rArm', 'lLeg', 'rLeg']), [hand]);
  };
  return clip({ scene: 'rings', start: pose(35), end: pose(19), seconds: 2.6 });
}

/* ------------------------------------------------------------------ */
/* Rotations on rings: skin the cat and friends                        */
/* ------------------------------------------------------------------ */

/** Hands on rings at (50,14); the body rotates around them. */
const ringHand: Pt = [50, 14];
const onTheRings = (person: Drawn) => onRings(person, [ringHand]);

function ringPose(neck: Pt, pelvis: Pt, feet: Pt, knees?: Pt, focus: Part[] = CORE): Drawn {
  return onTheRings(
    S({ neck, pelvis, lHand: ringHand, rHand: behind(ringHand, 1), lFoot: feet, rFoot: behind(feet, 1.5), joints: knees ? { lLeg: knees, rLeg: behind(knees, 1.5) } : undefined }, focus),
  );
}

const DEAD_HANG = () => ringPose([50, 37.5], [50, 59.5], [50, 88]);
const INVERTED_TUCK = () => ringPose([50, 37], [51, 15], [41, 21], [38, 8]);
const GERMAN_HANG = () => ringPose([48, 37], [34, 52], [30, 76], [24, 62], ['lArm', 'rArm', 'torso']);

type Rotation = 'german-hang' | 'skin-the-cat' | 'full-turn' | 'backward-roll' | 'tuck-levers' | 'cross-to-back-lever';

function rotation(kind: Rotation): FigureSpec {
  switch (kind) {
    case 'german-hang':
      // Settle deeper into the shoulder stretch.
      return clip({ scene: 'rings', start: GERMAN_HANG(), end: ringPose([47, 40], [33, 56], [29, 80], [23, 66], ['lArm', 'rArm', 'torso']), seconds: 3 });
    case 'skin-the-cat':
      return clip({ scene: 'rings', start: INVERTED_TUCK(), end: GERMAN_HANG(), seconds: 3, arrows: [{ d: 'M70,30 Q78,52 62,66' }] });
    case 'full-turn':
      return clip({ scene: 'rings', start: DEAD_HANG(), end: INVERTED_TUCK(), seconds: 2.6, arrows: [{ d: 'M78,60 A20,20 0 1 0 74,64' }] });
    case 'backward-roll':
      // From support on the rings, roll backwards to an inverted pike.
      return clip({
        scene: 'rings',
        start: onRings(S({ neck: [50, 25], pelvis: [49, 47], lHand: [50, 47], rHand: [48.5, 47], lFoot: [52, 75], rFoot: [50.5, 75] }, CORE), [[50, 47]]),
        end: onRings(S({ neck: [52, 69], pelvis: [48, 47], lHand: [50, 47], rHand: [48.5, 47], lFoot: [70, 32], rFoot: [70, 33.5], bend: { lArm: 'up', rArm: 'up' } }, CORE), [[50, 47]]),
        seconds: 2.8,
        arrows: [{ d: 'M70,52 Q76,36 62,26' }],
      });
    case 'tuck-levers':
      // Advanced tuck front lever turning over to an advanced tuck back lever.
      return clip({
        scene: 'rings',
        start: ringPose([54, 37], [32, 37], [33, 29], [42, 27], ['torso', 'lArm', 'rArm']),
        end: ringPose([66, 18.5], [44, 18.5], [48, 30], [56, 27], ['torso', 'lArm', 'rArm']),
        seconds: 3,
      });
    case 'cross-to-back-lever':
      // From support, lower forwards into a tuck back lever.
      return clip({
        scene: 'rings',
        start: onRings(S({ neck: [50, 25], pelvis: [49, 47], lHand: [50, 47], rHand: [48.5, 47], lFoot: [50, 75], rFoot: [48.5, 75] }, PUSH), [[50, 47]]),
        end: onRings(
          S({ neck: [70, 50], pelvis: [48, 50], lHand: [50, 47], rHand: [48.5, 47], lFoot: [44, 64], rFoot: [42.5, 64], joints: { lLeg: [56, 60], rLeg: [54.5, 60] } }, PUSH),
          [[50, 47]],
        ),
        seconds: 3,
      });
  }
}

/* ------------------------------------------------------------------ */
/* Levers                                                              */
/* ------------------------------------------------------------------ */

type LeverLegs = 'tuck' | 'one-leg';

/** Front lever: from a dead hang the body swings up to horizontal, face up, below the bar. */
function frontLever(legs: LeverLegs): FigureSpec {
  const bar: Pt = [56, 18];
  const pose = (neck: Pt, pelvis: Pt, l: Pt, r: Pt, lKnee?: Pt, rKnee?: Pt) =>
    S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: l, rFoot: r, joints: { ...(lKnee ? { lLeg: lKnee } : {}), ...(rKnee ? { rLeg: rKnee } : {}) } }, ['torso', 'lArm', 'rArm']);
  const hang = pose([56, 41.5], [56, 63.5], [56, 92], [54.5, 92]);
  const tucked = { foot: [32, 34] as Pt, knee: [44, 30] as Pt };
  const lever =
    legs === 'tuck'
      ? pose([60, 40], [38, 40], tucked.foot, behind(tucked.foot), tucked.knee, behind(tucked.knee))
      : pose([60, 40], [38, 40], [8.5, 40], behind(tucked.foot), undefined, behind(tucked.knee));
  return clip({ scene: 'bar', holds: BAR_HOLD(bar[0], bar[1]), start: hang, end: lever, seconds: 3 });
}

/** Back lever: from an inverted hang the body lowers to horizontal, face down, arms behind. */
function backLever(legs: LeverLegs): FigureSpec {
  const bar: Pt = [44, 22];
  const pose = (neck: Pt, pelvis: Pt, l: Pt, r: Pt, lKnee?: Pt, rKnee?: Pt) =>
    S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: l, rFoot: r, joints: { ...(lKnee ? { lLeg: lKnee } : {}), ...(rKnee ? { rLeg: rKnee } : {}) } }, ['torso', 'lArm', 'rArm']);
  const inverted = pose([46, 45], [45, 23], [44, -2], [42.5, -2]);
  const knee: Pt = [52, 36];
  const foot: Pt = [42, 42];
  const lever =
    legs === 'tuck'
      ? pose([66, 29], [44, 29], foot, behind(foot), knee, behind(knee))
      : pose([66, 29], [44, 29], [15, 29], behind(foot), undefined, behind(knee));
  return clip({ scene: 'bar', holds: BAR_HOLD(bar[0], bar[1]), start: inverted, end: lever, seconds: 3 });
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

interface RowOptions {
  /** How upright the body is: the more upright, the easier. */
  angle?: 'flat' | 'incline' | 'upright';
  rings?: boolean;
  tempo?: 'even' | 'slow-return';
}

/** Body straight from the heels, pulling the chest to the bar or rings. */
function row({ angle = 'flat', rings = false, tempo }: RowOptions = {}): FigureSpec {
  const heels: Pt = angle === 'upright' ? [42, G] : angle === 'incline' ? [24, G] : [12, G];
  const grip: Pt = angle === 'upright' ? [64, 20] : angle === 'incline' ? [68, 32] : [70, 52];
  const pose = (reach: number) => {
    const neck = meet(heels, BODY, grip, reach, lower);
    const person = S(
      { neck, pelvis: toward(neck, heels, 22), lHand: grip, rHand: behind(grip, -1, 0.5), lFoot: heels, rFoot: behind(heels, 1.5), lToe: [0.25, -1], rToe: [0.25, -1], bend: { lArm: 'down', rArm: 'down' } },
      ['lArm', 'rArm', 'torso'],
    );
    return rings ? onRings(person, [grip]) : person;
  };
  const wall = rings ? FLOOR : `M${grip[0] - 1},${grip[1] + 2} L${grip[0] + 1},${grip[1] + 2} L${grip[0] + 1},86 L${grip[0] - 1},86 Z ${FLOOR}`;
  const holds = rings ? undefined : [hold(grip[0], grip[1], 'bar')];
  const top = pose(11);
  const bottom = pose(ARM);
  return tempo === 'slow-return'
    ? clip({ scene: rings ? 'rings' : 'bar', wall, holds, start: top, end: bottom, tempo, seconds: 3.4 })
    : clip({ scene: rings ? 'rings' : 'bar', wall, holds, start: bottom, end: top, seconds: 2.4 });
}

/* ------------------------------------------------------------------ */
/* Squats and single-leg work                                          */
/* ------------------------------------------------------------------ */

function squat(depth: 'parallel' | 'full'): FigureSpec {
  const feet: Pt = [48, G];
  const pose = (pelvis: Pt, neck: Pt) => {
    const reach: Pt = [neck[0] + 22, neck[1] + 1];
    return S(
      { neck, pelvis, lHand: reach, rHand: behind(reach, -1, 1.5), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lLeg: 'right', rLeg: 'right' } },
      LEGS,
    );
  };
  const bottom = depth === 'full' ? pose([38, 74], [52, 57]) : pose([36, 67], [47.7, 48.3]);
  return clip({ scene: 'floor', wall: FLOOR, start: pose([47, 54], [48, 32]), end: bottom, seconds: 2.6 });
}

/** Side-to-side squat, seen from the front: a wide stance, sitting into one leg while the other stays straight. */
function sideSquat(): FigureSpec {
  const l: Pt = [30, G];
  const r: Pt = [70, G];
  const pose = (pelvis: Pt, neck: Pt) =>
    FRONT({ neck, pelvis, lHand: [neck[0] - 4, neck[1] + 9], rHand: [neck[0] + 4, neck[1] + 9], lFoot: l, rFoot: r, bend: { lArm: 'out', rArm: 'out', lLeg: 'out', rLeg: 'out' } }, LEGS);
  return clip({ scene: 'floor', wall: FLOOR, start: pose([50, 58], [50, 36]), end: pose([36, 70], [40, 48.5]), seconds: 2.8 });
}

type SplitKind = 'lunge' | 'chair' | 'shrimp';

function splitLeg(kind: SplitKind): FigureSpec {
  if (kind === 'shrimp') {
    // Standing on one leg, the other held behind; lower until the back knee touches.
    const front: Pt = [52, G];
    const pose = (pelvis: Pt, backKnee: Pt, backFoot: Pt) =>
      S(
        {
          neck: [pelvis[0] + 4, pelvis[1] - 21.5],
          pelvis,
          lHand: [pelvis[0] + 22, pelvis[1] - 20],
          rHand: backFoot,
          lFoot: front,
          rFoot: backFoot,
          lToe: [1, 0],
          bend: { lLeg: 'right', rArm: 'down' },
          joints: { rLeg: backKnee },
        },
        LEGS,
      );
    return clip({ scene: 'floor', wall: FLOOR, start: pose([50, 54], [45, 67], [36, 58]), end: pose([42, 66], [38, G - 1], [26, 74]), seconds: 2.8 });
  }
  const front: Pt = kind === 'chair' ? [62, G] : [64, G];
  const back: Pt = kind === 'chair' ? [22, 62.5] : [27, G];
  const pose = (pelvis: Pt) => {
    const hips: Pt = [pelvis[0] + 2, pelvis[1] + 1];
    return S(
      {
        neck: [pelvis[0] + 0.5, pelvis[1] - 22],
        pelvis,
        lHand: hips,
        rHand: behind(hips),
        lFoot: front,
        rFoot: back,
        lToe: [1, 0],
        rToe: kind === 'chair' ? [-1, 0.25] : [1, -0.25],
        bend: { lArm: 'right', rArm: 'right', lLeg: 'up', rLeg: 'down' },
      },
      LEGS,
    );
  };
  return kind === 'chair'
    ? clip({ scene: 'floor', wall: `${BENCH_LEFT} ${FLOOR}`, start: pose([46, 56]), end: pose([44, 67]) })
    : clip({ scene: 'floor', wall: FLOOR, start: pose([46, 60]), end: pose([45, 69.5]) });
}

/* ------------------------------------------------------------------ */
/* Lying down: bridges, slides, core                                   */
/* ------------------------------------------------------------------ */

type BridgeKind = 'two-legs' | 'one-leg' | 'shoulders-raised' | 'hands-under';

/** Glute bridge: lying down, hips pushed up until shoulders, hips and knees line up. */
function gluteBridge(kind: BridgeKind): FigureSpec {
  const feet: Pt = [72, G];
  const raisedShoulders = kind === 'shoulders-raised';
  const shoulders: Pt = raisedShoulders ? [24, 61.5] : [28, 81];
  const pose = (pelvis: Pt, up: boolean) => {
    const neck: Pt = up ? toward(pelvis, shoulders, 22) : raisedShoulders ? shoulders : [pelvis[0] - 22, pelvis[1]];
    const freeLeg: Pt = add(pelvis, mul(unit(sub(pelvis, neck)), 28));
    const hands: Pt = kind === 'hands-under' ? [pelvis[0] - 3, pelvis[1] + 3] : raisedShoulders ? [neck[0] + 5, neck[1] + 6] : [50, G];
    return S(
      {
        neck,
        pelvis,
        lHand: hands,
        rHand: behind(hands, -1),
        lFoot: feet,
        rFoot: kind === 'one-leg' ? freeLeg : behind(feet, 1.5),
        lToe: [1, 0],
        rToe: kind === 'one-leg' ? undefined : [1, 0],
        bend: { lArm: 'down', rArm: 'down', lLeg: 'up', rLeg: 'up' },
      },
      CORE,
    );
  };
  const low: Pt = raisedShoulders ? [44, 76] : [50, 80.5];
  const high: Pt = raisedShoulders ? [46, 61.5] : [54, 64];
  return clip({ scene: 'floor', wall: raisedShoulders ? `${BENCH_LEFT} ${FLOOR}` : FLOOR, start: pose(low, false), end: pose(high, true), seconds: 2.4 });
}

/** Hamstring slide: hips up on the heels, then slide the heels out and back. */
function hamstringSlide(oneLeg: boolean, tempo?: 'slow-return'): FigureSpec {
  const shoulders: Pt = [26, 81];
  const pose = (pelvis: Pt, heel: Pt) => {
    const neck = toward(pelvis, shoulders, 22);
    const freeLeg: Pt = add(pelvis, mul(unit(sub(pelvis, neck)), 28.5));
    return kit(
      S({ neck, pelvis, lHand: [48, G], rHand: [47, G], lFoot: heel, rFoot: oneLeg ? freeLeg : behind(heel, 1.5), lToe: [0.3, -1], bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'down' } }, ['lLeg', 'rLeg', 'torso']),
      [plateAt([heel[0], heel[1] + 1], 2.4)],
    );
  };
  const bent = pose([50, 63], [70, G]);
  const long = pose([46, 74], [83, G]);
  return tempo ? clip({ scene: 'floor', wall: FLOOR, start: bent, end: long, tempo, seconds: 3.4 }) : clip({ scene: 'floor', wall: FLOOR, start: long, end: bent, seconds: 2.6 });
}

/** Reverse hyper: face down on a bench, hips at the edge, lifting bent legs behind. */
function reverseHyper(knees: 'tuck' | 'right-angle'): FigureSpec {
  const neck: Pt = [62, 56.5];
  const pelvis: Pt = [40, 56.5];
  const hands: Pt = [72, 64];
  const pose = (knee: Pt, foot: Pt) =>
    S({ neck, pelvis, lHand: hands, rHand: behind(hands), lFoot: foot, rFoot: behind(foot, 0, 1.5), bend: { lArm: 'up', rArm: 'up' }, joints: { lLeg: knee, rLeg: behind(knee, 0, 1.5) } }, ['lLeg', 'rLeg', 'torso']);
  const hanging = pose([32, 69], [36, 82]);
  const lifted = knees === 'tuck' ? pose([28, 50], [36, 46]) : pose([26, 57], [26, 42]);
  return clip({ scene: 'floor', wall: `M38,61 L76,61 L76,65 L38,65 Z M44,65 L47,65 L47,86 L44,86 Z M68,65 L71,65 L71,86 L68,86 Z ${FLOOR}`, start: hanging, end: lifted, seconds: 2.4 });
}

type FloorCore = 'tuck-raise' | 'post-tuck' | 'post-leg-raise' | 'tuck-lowering';

/** Lying on the back: tuck raises, and the dragon-flag drills holding a post behind the head. */
function floorCore(kind: FloorCore): FigureSpec {
  const post = kind !== 'tuck-raise';
  const hands: Pt = post ? [12, 76] : [50, G];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt, knees?: Pt) =>
    S(
      { neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: post ? 'up' : 'down', rArm: post ? 'up' : 'down' }, joints: knees ? { lLeg: knees, rLeg: behind(knees, 1.5) } : undefined },
      CORE,
    );
  const lying = pose([28, 81], [50, 81], [78.5, 79]);
  const scene = { scene: 'floor' as const, wall: post ? `M9,40 L13,40 L13,86 L9,86 Z ${FLOOR}` : FLOOR };
  switch (kind) {
    case 'tuck-raise':
      return clip({ ...scene, start: lying, end: pose([28, 81], [50, 81], [56, 66], [44, 66]), seconds: 2.2 });
    case 'post-tuck':
      return clip({ ...scene, start: lying, end: pose([26, 79], [36, 58], [28, 54], [44, 46]), seconds: 2.6 });
    case 'post-leg-raise':
      return clip({ ...scene, start: lying, end: pose([28, 81], [50, 81], [62, 54]), seconds: 2.6 });
    case 'tuck-lowering':
      return clip({ ...scene, start: pose([26, 79], [36, 58], [28, 54], [44, 46]), end: pose([28, 81], [49, 76], [56, 64], [56, 60]), tempo: 'slow-return', seconds: 3.6 });
  }
}

/* ------------------------------------------------------------------ */
/* Seated holds and planks                                             */
/* ------------------------------------------------------------------ */

type LSitLegs = 'tuck' | 'one-leg' | 'straight';

/** From sitting, press the floor away until the hips lift. */
function lSit(legs: LSitLegs): FigureSpec {
  const hands: Pt = [48, G];
  const pose = (lift: number) => {
    const pelvis: Pt = [47, 82 - lift];
    const neck: Pt = [46, pelvis[1] - 22];
    const straight: Pt = [76, pelvis[1] - 1];
    const tuckFoot: Pt = [58, pelvis[1] - 1];
    const tuckKnee: Pt = [56, pelvis[1] - 12];
    return S(
      {
        neck,
        pelvis,
        lHand: hands,
        rHand: behind(hands),
        lFoot: legs === 'tuck' ? tuckFoot : straight,
        rFoot: legs === 'straight' ? behind(straight, 0, 1.5) : behind(tuckFoot, 0, 1.5),
        joints: { ...(legs === 'tuck' ? { lLeg: tuckKnee } : {}), ...(legs === 'straight' ? {} : { rLeg: behind(tuckKnee, 0, 1.5) }) },
      },
      ['lArm', 'rArm', 'torso', 'lLeg', 'rLeg'],
    );
  };
  return clip({ scene: 'floor', wall: FLOOR, start: pose(0), end: pose(4), seconds: 2.4 });
}

/** Forearm plank with a timer: a steady hold with breathing. */
function plank(seconds: string): FigureSpec {
  const feet: Pt = [14, G];
  const pose = (lift: number) => {
    const neck: Pt = [62, 72.5 - lift];
    return S({ neck, pelvis: toward(neck, feet, 22), lHand: [73, G], rHand: [71.5, G], lFoot: feet, rFoot: behind(feet, 1.5), joints: { lArm: [61, G], rArm: [59.5, G] } }, CORE);
  };
  return clip({ scene: 'floor', wall: FLOOR, start: pose(0), end: pose(1.2), seconds: 3, labels: [{ at: [50, 44], text: seconds }] });
}

/** Side plank, seen from the front: hips lift from the floor into a straight line. */
function sidePlank(): FigureSpec {
  const feet: Pt = [84, G];
  const elbow: Pt = [26, G];
  const pose = (pelvisY: number) => {
    const pelvis: Pt = [56, pelvisY];
    const neck = toward(pelvis, [28, 64], 22);
    return FRONT({ neck, pelvis, lHand: [32, G], rHand: [44, pelvisY - 4], lFoot: feet, rFoot: behind(feet, 0, -1.5), joints: { lArm: elbow } }, CORE);
  };
  return clip({ scene: 'floor', wall: FLOOR, start: pose(80), end: pose(70.5), seconds: 2.4 });
}

type ReverseKind = 'reverse-plank' | 'table';

/** Facing up, hands behind: hips lift until the body is straight (or a flat table with bent knees). */
function reversePlank(kind: ReverseKind): FigureSpec {
  const hands: Pt = [30, G];
  if (kind === 'table') {
    const feet: Pt = [70, G];
    const pose = (pelvis: Pt) =>
      S({ neck: [pelvis[0] - 22, pelvis[1] - (pelvis[1] < 70 ? 0 : 6)], pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], bend: { lLeg: 'up', rLeg: 'up' } }, CORE);
    return clip({ scene: 'floor', wall: FLOOR, start: pose([52, 80]), end: pose([54, 61]), seconds: 2.4 });
  }
  const feet: Pt = [84, G];
  const pose = (pelvisY: number) => {
    const pelvis: Pt = [52, pelvisY];
    const neck = toward(pelvis, [30, pelvisY - 14 + (80 - pelvisY) * 0.4], 22);
    return S({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [0.6, -0.8] }, CORE);
  };
  return clip({ scene: 'floor', wall: FLOOR, start: pose(80), end: pose(67), seconds: 2.4 });
}

/** Back bridge, then shifting the weight to free one hand (from the head, or from straight arms). */
function backBridge(onHead: boolean): FigureSpec {
  const feet: Pt = [68, G];
  const pelvis: Pt = onHead ? [56, 60] : [56, 52];
  const neck = toward(pelvis, onHead ? [30, 76] : [30, 66], 22);
  const pose = (freeHand: Pt) =>
    S({ neck, pelvis, lHand: freeHand, rHand: onHead ? [30, G] : [28, G], lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'up' } }, ['torso', 'lArm', 'rArm']);
  // A dotted arc over the body: the back arches, belly up — not a pike.
  const arch: Arrow = { d: `M${neck[0] - 2},${neck[1] - 9} Q${pelvis[0] - 8},${pelvis[1] - 22} ${pelvis[0] + 10},${pelvis[1] - 6}`, kind: 'guide' };
  return clip({ scene: 'floor', wall: FLOOR, start: pose(onHead ? [29, G] : [27, G]), end: pose([neck[0] + 4, neck[1] - 16]), seconds: 2.8, arrows: [arch] });
}

/** Vertical flag on a pole: from standing beside it to holding the body straight up, feet off the floor. */
function verticalFlag(): FigureSpec {
  const top: Pt = [33, 20];
  const low: Pt = [33, 46];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    FRONT({ neck, pelvis, lHand: low, rHand: top, lFoot: feet, rFoot: behind(feet, 4), bend: { lArm: 'down', rArm: 'up' } }, ['lArm', 'rArm', 'torso']);
  return clip({
    scene: 'bar',
    wall: `M30,4 L36,4 L36,86 L30,86 Z ${FLOOR}`,
    start: pose([46, 33], [47, 55], [50, G]),
    end: pose([45, 26], [46, 48], [49, 76]),
    seconds: 2.6,
  });
}

/** Standing overhead press with a light bar. */
function overheadPress(load: number): FigureSpec {
  const feet: Pt = [50, G];
  const pose = (hands: Pt) =>
    kit(S({ neck: [50, 32], pelvis: [50, 54], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'down', rArm: 'down' } }, PUSH), [plateAt(hands, load)]);
  return clip({ scene: 'floor', wall: FLOOR, start: pose([55, 31]), end: pose([51, 9.5]), seconds: 2.4 });
}

/* ------------------------------------------------------------------ */
/* Every level 1–3 exercise                                            */
/* ------------------------------------------------------------------ */

const FIGURES: Record<string, () => FigureSpec> = {
  // Push-ups
  ex_7: () => pushUp(),
  ex_429: () => pushUp({ grip: 'diamond' }),
  ex_26: () => pushUp({ grip: 'diamond' }),
  ex_430: () => pushUp({ grip: 'pseudo' }),
  ex_49: () => pushUp({ rings: true }),
  ex_431: archerPushUp,

  // Pike and headstand presses
  ex_427: () => pikePress(),
  ex_428: () => pikePress({ box: true }),
  ex_18: () => pikePress({ box: true, toHead: true }),
  ex_1: () => pikePress({ toHead: true }),

  // Upside down at the wall
  ex_0: () => wallPress(),
  ex_426: () => wallPress(),
  ex_423: () => wallPress('slow-return'),
  ex_40: () => wallPress('slow-return'),
  ex_17: () => wallHandstand(false),
  ex_39: () => wallHandstand(true),
  ex_420: wallHeadstand,
  ex_419: wallPlank,
  ex_48: frogStand,

  // Dips
  ex_8: () => dip({ extra: 'floor' }),
  ex_27: () => dip({ tempo: 'slow-return' }),
  ex_50: () => dip(),
  ex_29: () => dip({ extra: 'band' }),
  ex_52: () => dip({ extra: 'plate' }),
  ex_402: () => dip({ rings: true }),
  ex_51: () => dip({ rings: true, tempo: 'slow-return' }),
  ex_396: () => dip({ rings: true, tempo: 'slow-return' }),
  ex_403: () => dip({ rings: true, depth: 'partial' }),

  // Supports
  ex_9: () => support(),
  ex_28: () => support({ turnedOut: true }),
  ex_395: () => support({ turnedOut: true }),
  ex_385: () => support({ rings: false, press: true }),

  // Pull-ups
  ex_5: () => pullUp({ extra: 'jump' }),
  ex_23: () => pullUp({ tempo: 'slow-return' }),
  ex_381: () => pullUp({ tempo: 'slow-return' }),
  ex_45: () => pullUp(),
  ex_24: () => pullUp({ extra: 'band' }),
  ex_46: () => pullUp({ extra: 'plate' }),
  ex_47: () => pullUp({ kind: 'explosive' }),
  ex_380: () => pullUp({ kind: 'scapular' }),

  // Side-on bar work
  ex_383: archHang,
  ex_384: chestToBar,
  ex_25: kipPullUp,
  ex_382: () => muscleUp(),
  ex_53: () => muscleUp('slow-return'),

  // Hanging leg work
  ex_367: () => hangingRaise('l-hang'),
  ex_37: () => hangingRaise('straight-raise'),
  ex_60: () => hangingRaise('knees-to-bar'),
  ex_375: ringLPull,

  // Rotations on rings
  ex_3: () => rotation('german-hang'),
  ex_21: () => rotation('skin-the-cat'),
  ex_366: () => rotation('full-turn'),
  ex_31: () => rotation('backward-roll'),
  ex_362: () => rotation('tuck-levers'),
  ex_374: () => rotation('cross-to-back-lever'),

  // Levers
  ex_365: () => frontLever('tuck'),
  ex_363: () => frontLever('one-leg'),
  ex_43: () => backLever('tuck'),
  ex_359: () => backLever('one-leg'),

  // Rows
  ex_4: () => row({ tempo: 'slow-return' }),
  ex_22: () => row({ rings: true }),
  ex_44: () => row(),
  ex_368: () => row({ angle: 'upright', rings: true }),
  ex_369: () => row({ angle: 'incline', rings: true }),

  // Squats and single leg
  ex_11: () => squat('parallel'),
  ex_32: () => squat('full'),
  ex_55: sideSquat,
  ex_14: () => splitLeg('lunge'),
  ex_35: () => splitLeg('chair'),
  ex_58: () => splitLeg('shrimp'),

  // Bridges and slides
  ex_12: () => gluteBridge('two-legs'),
  ex_33: () => gluteBridge('shoulders-raised'),
  ex_56: () => gluteBridge('one-leg'),
  ex_407: () => gluteBridge('hands-under'),
  ex_13: () => hamstringSlide(false),
  ex_34: () => hamstringSlide(true, 'slow-return'),
  ex_57: () => hamstringSlide(true),
  ex_36: () => reverseHyper('tuck'),
  ex_59: () => reverseHyper('right-angle'),

  // Core on the floor
  ex_15: () => floorCore('tuck-raise'),
  ex_16: () => floorCore('post-tuck'),
  ex_38: () => floorCore('post-leg-raise'),
  ex_61: () => floorCore('tuck-lowering'),
  ex_2: () => lSit('tuck'),
  ex_20: () => lSit('one-leg'),
  ex_42: () => lSit('straight'),
  ex_30: () => plank('25s'),
  ex_54: () => plank('60s'),
  ex_386: sidePlank,
  ex_406: () => reversePlank('reverse-plank'),
  ex_408: () => reversePlank('table'),
  ex_404: () => backBridge(true),
  ex_405: () => backBridge(false),
  ex_387: verticalFlag,

  // Weighted press
  ex_19: () => overheadPress(5),
  ex_41: () => overheadPress(6.5),
};

/** Built on first use: about a hundred figures, most of which a visit never shows. */
const built = new Map<string, FigureSpec>();

export function calisthenicsFigure(id: string): FigureSpec | undefined {
  const make = FIGURES[id];
  if (!make) return undefined;
  let spec = built.get(id);
  if (!spec) {
    spec = make();
    built.set(id, spec);
  }
  return spec;
}

export const CALISTHENICS_FIGURE_IDS = Object.keys(FIGURES);
