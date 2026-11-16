import { Arrow, Disc, FigureSpec, Hold, Pt, Scene, Stroke } from './SkillFigure';
import { Drawn, Part, SilhouettePose, add, figure, hold, len, mul, scaled, silhouette, sub, unit } from './figureKit';

/**
 * Movement families for the calisthenics silhouettes, and the helpers they
 * share. `calisthenicsFigures.ts` maps each exercise to one of these.
 *
 * Originally written for levels 1–3:
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
export const G = 83.5;
export const FLOOR = 'M0,86 L100,86 L100,100 L0,100 Z';
export const LOW_FLOOR = 'M0,91 L100,91 L100,100 L0,100 Z';
export const BAR_ACROSS = (y: number) => `M8,${y - 1.6} L92,${y - 1.6} L92,${y + 1.6} L8,${y + 1.6} Z`;
export const PARALLEL_BARS =
  'M20,49 L80,49 L80,51.6 L20,51.6 Z M24,51.6 L26.4,51.6 L26.4,86 L24,86 Z M73.6,51.6 L76,51.6 L76,86 L73.6,86 Z';
export const WALL_RIGHT = 'M86,0 L100,0 L100,86 L86,86 Z';
export const BOX_LEFT = 'M6,62 L32,62 L32,86 L6,86 Z';
export const BENCH_LEFT = 'M4,64 L30,64 L30,68.5 L4,68.5 Z M7,68.5 L10,68.5 L10,86 L7,86 Z M24,68.5 L27,68.5 L27,86 L24,86 Z';

export const S = (pose: SilhouettePose, focus: Part[] = []) => silhouette(pose, focus);
export const FRONT = (pose: Omit<SilhouettePose, 'view'>, focus: Part[] = []) => silhouette({ ...pose, view: 'front' }, focus);

export const toward = (from: Pt, to: Pt, length: number): Pt => add(from, mul(unit(sub(to, from)), length));
export const behind = (p: Pt, dx = -1.5, dy = 0): Pt => [p[0] + dx, p[1] + dy];

/**
 * Where two circles cross — the point `ra` from `a` and `rb` from `b` —
 * preferring the crossing that `prefer` scores higher. Falls back to the
 * nearest point on the line between them when the circles don't meet.
 */
export function meet(a: Pt, ra: number, b: Pt, rb: number, prefer: (p: Pt) => number): Pt {
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
export const higher = (p: Pt) => -p[1];
export const lower = (p: Pt) => p[1];
export const righter = (p: Pt) => p[0];

/** Body from the neck to the feet when held straight (torso plus legs). */
export const BODY = 51.5;
export const ARM = 23.5;

/** A figure plus the things it holds: straps and bands behind it, rings and plates in front. */
export const kit = (person: Drawn, discs: Disc[] = [], strokes: Stroke[] = []): Drawn => ({
  strokes: [...strokes, ...person.strokes],
  discs: [...person.discs, ...discs],
});
export const ring = (hand: Pt): Disc => ({ at: [hand[0], hand[1] - 1], r: 3.4, tone: 'body', kind: 'ring' });
export const strap = (hand: Pt, anchorX = hand[0]): Stroke => ({ pts: [[anchorX, -2], [hand[0], hand[1] - 4.4]], width: 1, tone: 'gear' });
export const onRings = (person: Drawn, hands: Pt[], anchors?: number[]): Drawn =>
  kit(
    person,
    hands.map(ring),
    hands.map((hand, index) => strap(hand, anchors?.[index])),
  );
export const plateAt = (at: Pt, r = 5): Disc => ({ at, r, tone: 'body', kind: 'plate' });
export const band = (pts: Pt[]): Stroke => ({ pts, width: 1.4, tone: 'gear' });

export interface Clip {
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

export const clip = ({ start, end, seconds = 2.6, tempo, ...scene }: Clip): FigureSpec =>
  figure({ ...scene, people: [start], motion: { people: [end], seconds, tempo } });

export const ARMS: Part[] = ['lArm', 'rArm'];
export const PUSH: Part[] = ['lArm', 'rArm', 'torso'];
export const LEGS: Part[] = ['lLeg', 'rLeg'];
export const CORE: Part[] = ['torso', 'lLeg', 'rLeg'];

/* ------------------------------------------------------------------ */
/* Push-ups                                                            */
/* ------------------------------------------------------------------ */

export interface PushUpOptions {
  /** shoulder: hands under the shoulders · diamond: hands together under the chest · pseudo: hands back by the waist. */
  grip?: 'shoulder' | 'diamond' | 'pseudo';
  rings?: boolean;
  /** Rings turned out at the top. */
  turnedOut?: boolean;
  tempo?: 'even' | 'slow-return';
}

/** A rigid plank pivoting on the toes, from straight arms to chest near the hands. */
export function pushUp({ grip = 'shoulder', rings = false, turnedOut = false, tempo }: PushUpOptions = {}): FigureSpec {
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
  const arrows: Arrow[] = turnedOut ? [{ d: `M${hands[0] + 7},${hands[1] + 2} Q${hands[0] + 10},${hands[1] - 3} ${hands[0] + 6},${hands[1] - 7}`, kind: 'force' }] : [];
  return clip({ scene: rings ? 'rings' : 'floor', wall: FLOOR, start: pose(up), end: pose(down), tempo, seconds: 2.4, arrows });
}

/** Archer push-up, seen head-on: one arm bends, the other stays straight out to the side. */
export function archerPushUp({ rings = false, turnedOut = false }: { rings?: boolean; turnedOut?: boolean } = {}): FigureSpec {
  const y = rings ? G - 7 : G;
  const l: Pt = [24, y];
  const r: Pt = [64, y];
  const pose = (neck: Pt, pelvis: Pt) => {
    const person = FRONT(
      { neck, pelvis, lHand: l, rHand: r, lFoot: [pelvis[0] - 2, pelvis[1] + 2], rFoot: [pelvis[0] + 2, pelvis[1] + 2], bend: { rArm: 'out' } },
      ['lArm', 'rArm'],
    );
    return rings ? onRings(person, [l, r]) : person;
  };
  const lift = rings ? 6 : 0;
  const arrows: Arrow[] = turnedOut
    ? [
        { d: 'M16,70 Q12,64 16,58', kind: 'force' },
        { d: 'M72,70 Q76,64 72,58', kind: 'force' },
      ]
    : [];
  return clip({
    scene: rings ? 'rings' : 'floor',
    wall: FLOOR,
    start: pose([48, 58 - lift], [48, 64 - lift]),
    end: pose([58, 72 - lift], [57, 77 - lift]),
    seconds: 2.8,
    arrows,
  });
}

/** One-arm push-up: the free arm behind the back, the hand on a bench, a low box, or the floor with the legs wide (seen from behind). */
export function oneArmPushUp(support: 'bench' | 'box' | 'straddle'): FigureSpec {
  if (support === 'straddle') {
    const pose = (neckY: number) => {
      const neck: Pt = [50, neckY];
      return FRONT(
        { neck, pelvis: [50, neckY + 10], lHand: [45, G], rHand: [55, neckY + 9], lFoot: [16, G], rFoot: [84, G], bend: { rArm: 'down' } },
        ['lArm', 'torso'],
      );
    };
    return clip({ scene: 'floor', wall: FLOOR, start: pose(60), end: pose(69), seconds: 2.6 });
  }
  const feet: Pt = [12, G];
  const top = support === 'bench' ? 64 : 74;
  const hand: Pt = [68, top - 2.4];
  const surface = support === 'bench' ? 'M56,64 L88,64 L88,68.5 L56,68.5 Z M59,68.5 L62,68.5 L62,86 L59,86 Z M82,68.5 L85,68.5 L85,86 L82,86 Z' : 'M56,74 L88,74 L88,86 L56,86 Z';
  const up = meet(feet, BODY, hand, ARM, higher);
  const downY = hand[1] - 8;
  const down: Pt = [feet[0] + Math.sqrt(BODY * BODY - (feet[1] - downY) ** 2), downY];
  const pose = (neck: Pt) => {
    const pelvis = toward(neck, feet, 22);
    const back = add(toward(neck, pelvis, 13), [0, -4]);
    return S({ neck, pelvis, lHand: hand, rHand: back, lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: 'up', rArm: 'up' } }, ['lArm', 'torso']);
  };
  return clip({ scene: 'floor', wall: `${surface} ${FLOOR}`, start: pose(up), end: pose(down), seconds: 2.6 });
}

/* ------------------------------------------------------------------ */
/* Pike and headstand presses                                          */
/* ------------------------------------------------------------------ */

export interface PikeOptions {
  /** Feet on a box instead of the floor. */
  box?: boolean;
  /** Lower all the way until the head touches the floor. */
  toHead?: boolean;
}

/** Hips high, hands on the floor; the head travels down in front of the hands. */
export function pikePress({ box = false, toHead = false }: PikeOptions = {}): FigureSpec {
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
export function wallPress(tempo?: 'slow-return'): FigureSpec {
  const hands: Pt = [74, G];
  const pose = (neck: Pt) => {
    const pelvis: Pt = [neck[0] + 2, neck[1] - 22];
    return S({ neck, pelvis, lHand: hands, rHand: behind(hands, -1.5), lFoot: [80.5, pelvis[1] - 29], rFoot: [80.5, pelvis[1] - 27.5], bend: { lArm: 'left', rArm: 'left' } }, PUSH);
  };
  return clip({ scene: 'floor', wall: `${WALL_RIGHT} ${FLOOR}`, start: pose([75, 61]), end: pose([77, 72.5]), tempo, seconds: tempo ? 3.4 : 2.6 });
}

/** Handstand against the wall: chest to the wall (strict) or back to the wall. */
export function wallHandstand(chestToWall: boolean): FigureSpec {
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
export function wallHeadstand(): FigureSpec {
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
export function wallPlank(): FigureSpec {
  const pose = (hands: Pt, feet: Pt) => {
    const neck = meet(feet, BODY, hands, ARM, higher);
    return S({ neck, pelvis: toward(neck, feet, 22), lHand: hands, rHand: behind(hands, 1.5), lFoot: feet, rFoot: behind(feet, 0, 1.5) }, PUSH);
  };
  return clip({ scene: 'floor', wall: `${WALL_RIGHT} ${FLOOR}`, start: pose([34, G], [83.5, 54]), end: pose([50, G], [83.5, 30]), seconds: 3 });
}

/** Frog stand: knees resting on the elbows, leaning forward until the feet lift. */
export function frogStand({ rings = false }: { rings?: boolean } = {}): FigureSpec {
  const lift = rings ? 12 : 0;
  const up = (p: Pt): Pt => [p[0], p[1] - lift];
  const hands = up([60, G]);
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) => {
    const person = S(
      { neck: up(neck), pelvis: up(pelvis), lHand: hands, rHand: behind(hands, -1.5), lFoot: up(feet), rFoot: behind(up(feet), 1.5), bend: { lArm: 'left', rArm: 'left' }, joints: { lLeg: up([56, 66]), rLeg: up([55, 67]) } },
      ['lArm', 'rArm', 'torso'],
    );
    return rings ? onRings(person, [hands, behind(hands, -1.5)]) : person;
  };
  return clip({ scene: rings ? 'rings' : 'floor', wall: FLOOR, start: pose([63, 59], [44, 64], [42, G]), end: pose([67, 64], [48, 56], [42, 72]), seconds: 2.6 });
}

/* ------------------------------------------------------------------ */
/* Dips and supports                                                   */
/* ------------------------------------------------------------------ */

export interface DipOptions {
  rings?: boolean;
  /** How far down: a full dip, a partial one to about 75°, or until the forearms rest on the bars. */
  depth?: 'full' | 'partial' | 'forearms';
  extra?: 'band' | 'plate' | 'floor';
  /** Plate radius for weighted dips: bigger is heavier. */
  plate?: number;
  tempo?: 'even' | 'slow-return';
  /** bent: knees bent behind · l-sit: legs held level in front · pike: legs angled down in front. */
  legs?: 'bent' | 'l-sit' | 'pike';
  /** Torso leaning forward about 45°. */
  lean?: boolean;
  /** One arm only, the other resting on the hip. */
  oneArm?: boolean;
  turnedOut?: boolean;
}

export function dip({ rings = false, depth = 'full', extra, plate = 5, tempo, legs = 'bent', lean = false, oneArm = false, turnedOut = false }: DipOptions = {}): FigureSpec {
  const hands: Pt = [50, 49.5];
  const pose = (neck: Pt, pelvis: Pt, bentFeet: Pt, elbow?: Pt) => {
    const feet: Pt = legs === 'l-sit' ? [pelvis[0] + 28.5, pelvis[1] + 1] : legs === 'pike' ? [pelvis[0] + 21, pelvis[1] + 20] : bentFeet;
    let person = S(
      {
        neck,
        pelvis,
        lHand: hands,
        rHand: oneArm ? [pelvis[0] + 3, pelvis[1] - 2] : behind(hands, -1.5),
        lFoot: feet,
        rFoot: behind(feet, -2, legs === 'bent' ? -2 : 1.5),
        bend: { lArm: 'left', rArm: oneArm ? 'down' : 'left', lLeg: 'right', rLeg: 'right' },
        joints: elbow ? { lArm: elbow, rArm: behind(elbow, -1.5) } : undefined,
      },
      legs === 'l-sit' ? ['lArm', 'rArm', 'torso', 'lLeg', 'rLeg'] : PUSH,
    );
    if (rings) person = onRings(person, oneArm ? [hands] : [hands, behind(hands, -1.5)]);
    if (extra === 'plate') person = kit(person, [plateAt([pelvis[0] + 1, pelvis[1] + 8 + plate], plate)], [band([pelvis, [pelvis[0] + 1, pelvis[1] + 4 + plate]])]);
    if (extra === 'band') person = kit(person, [], [band([[24, 50.5], [feet[0], feet[1] + 2.5], [76, 50.5]])]);
    return person;
  };
  const top = lean ? pose([57, 29], [41.2, 44.2], [36, 68]) : pose([50, 26.5], [48, 48.5], [42, 74]);
  const bottom =
    depth === 'forearms'
      ? pose([46, 39.5], [43, 61.3], [34, 84], [38.5, 49.5])
      : depth === 'partial'
        ? pose([53.5, 34], [46, 54.5], [39, 79])
        : lean
          ? pose([61, 41], [45.2, 56.2], [38, 80])
          : pose([55, 40], [44, 59], [36, 82]);
  const wall = rings ? FLOOR : `${PARALLEL_BARS} ${extra === 'floor' ? FLOOR : ''}`;
  const arrows: Arrow[] = turnedOut ? [{ d: 'M58,58 Q62,53 58,48', kind: 'force' }] : [];
  return clip({ scene: rings ? 'rings' : 'bars', wall, start: top, end: bottom, tempo, seconds: tempo ? 3.4 : 2.6, arrows });
}

/** Ring dip seen from the front: wide, or Bulgarian with the rings pushed out to the sides at the bottom. */
export function frontRingDip(kind: 'wide' | 'bulgarian'): FigureSpec {
  const pose = (neckY: number, l: Pt, r: Pt, straight: boolean) =>
    onRings(
      FRONT(
        {
          neck: [50, neckY],
          pelvis: [50, neckY + 22],
          lHand: l,
          rHand: r,
          lFoot: [47.5, neckY + 49],
          rFoot: [52.5, neckY + 49],
          bend: { lArm: 'down', rArm: 'down' },
          joints: straight ? { lArm: [(44.4 + l[0]) / 2, (neckY + l[1]) / 2], rArm: [(55.6 + r[0]) / 2, (neckY + r[1]) / 2], lLeg: [48, neckY + 36], rLeg: [52, neckY + 36] } : { lLeg: [48, neckY + 36], rLeg: [52, neckY + 36] },
        },
        PUSH,
      ),
      [l, r],
      [36, 64],
    );
  const out = kind === 'bulgarian' ? 20 : 15;
  return clip({
    scene: 'rings',
    wall: FLOOR,
    start: pose(27, [40, 51], [60, 51], true),
    end: pose(41, [50 - out, kind === 'bulgarian' ? 46 : 51], [50 + out, kind === 'bulgarian' ? 46 : 51], false),
    seconds: 2.8,
  });
}

export interface SupportOptions {
  rings?: boolean;
  /** Rings turned out: the hands rotate so the thumbs point away from the body. */
  turnedOut?: boolean;
  /** Shrug the body down and press it back up with the shoulders. */
  press?: boolean;
}

/** Straight-arm support, seen from the front. */
export function support({ rings = true, turnedOut = false, press = false }: SupportOptions = {}): FigureSpec {
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

export interface PullUpOptions {
  extra?: 'jump' | 'band' | 'plate';
  /** Plate radius for weighted pull-ups: bigger is heavier. */
  plate?: number;
  /**
   * explosive: pull so hard the hands come off the bar · clap: …and clap at the top ·
   * scapular: straight arms, shoulders only · typewriter: slide side to side at the top ·
   * archer: pull to one hand, the other arm straight · one-arm: one hand, lowering slowly.
   */
  kind?: 'pull' | 'explosive' | 'clap' | 'scapular' | 'typewriter' | 'archer' | 'one-arm';
  tempo?: 'even' | 'slow-return';
  rings?: boolean;
  wide?: boolean;
}

export function pullUp({ extra, plate = 5.5, kind = 'pull', tempo, rings = false, wide = false }: PullUpOptions = {}): FigureSpec {
  const barY = 14;
  const spread = wide || kind === 'typewriter' || kind === 'archer' ? 16 : 10;
  const pose = (neck: Pt, hands?: [Pt, Pt], straight = false) => {
    const pelvis: Pt = [neck[0], neck[1] + 22];
    const l: Pt = hands?.[0] ?? [50 - spread, barY];
    const r: Pt = hands?.[1] ?? [50 + spread, barY];
    const feetY = extra === 'jump' && neck[1] > 30 ? 88 : neck[1] + 50;
    let person = FRONT(
      {
        neck,
        pelvis,
        lHand: l,
        rHand: r,
        lFoot: [neck[0] - 2.5, feetY],
        rFoot: [neck[0] + 2.5, feetY],
        bend: { lArm: 'down', rArm: 'down', lLeg: 'in', rLeg: 'in' },
        joints: straight ? { lArm: [(neck[0] - 5.6 + l[0]) / 2, (neck[1] + l[1]) / 2], rArm: [(neck[0] + 5.6 + r[0]) / 2, (neck[1] + r[1]) / 2] } : undefined,
      },
      ARMS,
    );
    if (rings) person = onRings(person, kind === 'one-arm' ? [l] : [l, r]);
    if (extra === 'plate') person = kit(person, [plateAt([neck[0], pelvis[1] + 7 + plate], plate)], [band([[neck[0] - 3.5, pelvis[1]], [neck[0], pelvis[1] + 2 + plate], [neck[0] + 3.5, pelvis[1]]])]);
    if (extra === 'band') person = kit(person, [], [band([[44, barY + 1], [47.5, feetY + 2.5], [52.5, feetY + 2.5], [56, barY + 1]])]);
    return person;
  };
  const wall = rings ? '' : BAR_ACROSS(barY);
  const scene: Scene = rings ? 'rings' : 'bar';
  const hangY = 35;
  switch (kind) {
    case 'scapular':
      return clip({ scene, wall, start: pose([50, 36.5], undefined, true), end: pose([50, 31.5], undefined, true), seconds: 2, arrows: [{ d: 'M30,46 L30,37' }, { d: 'M70,46 L70,37' }] });
    case 'explosive':
      return clip({ scene, wall, start: pose([50, hangY]), end: pose([50, 15], [[40, barY - 7], [60, barY - 7]]), seconds: 1.8, arrows: [{ d: 'M80,40 L80,22' }] });
    case 'clap':
      return clip({ scene, wall, start: pose([50, hangY]), end: pose([50, 16], [[48, 2], [52, 2]], true), seconds: 1.8, arrows: [{ d: 'M80,40 L80,22' }] });
    case 'typewriter':
      return clip({ scene, wall, start: pose([39, 19]), end: pose([61, 19]), seconds: 2.6 });
    case 'archer':
      return clip({ scene, wall, start: pose([50, hangY]), end: pose([39, 19]), seconds: 2.6 });
    case 'one-arm': {
      const one = (neck: Pt) => {
        const l: Pt = [neck[0] + 4, barY];
        return pose(neck, [l, [neck[0] + 7, neck[1] + 9]]);
      };
      return clip({ scene, wall, start: one([46, 19]), end: one([46, hangY]), tempo: 'slow-return', seconds: 3.6 });
    }
    default: {
      const ground = extra === 'jump' ? ` ${LOW_FLOOR}` : '';
      const hang = pose([50, hangY]);
      const top = pose([50, 18.5]);
      return tempo === 'slow-return'
        ? clip({ scene, wall: wall + ground, start: top, end: hang, tempo, seconds: 3.4 })
        : clip({ scene, wall: wall + ground, start: hang, end: top, seconds: extra === 'jump' ? 2.2 : 2.4 });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Side-on bar work: kips, chest-to-bar, muscle-ups                    */
/* ------------------------------------------------------------------ */

export const BAR_HOLD = (x: number, y: number) => [hold(x, y, 'bar')];

/** Dead hang to a strong arch: chest up, shoulder blades pulled back. */
export function archHang(): FigureSpec {
  const bar: Pt = [50, 12];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet), bend: { lArm: 'left', rArm: 'left' } }, ['torso', 'lArm', 'rArm']);
  return clip({ scene: 'bar', holds: BAR_HOLD(50, 12), start: pose([49, 35.5], [48, 57.5], [47, 86]), end: pose([55, 32.5], [47, 53], [40, 81]), seconds: 2.4 });
}

/** Chest-to-bar pull-up: the body leans back so the chest meets the bar. */
export function chestToBar(): FigureSpec {
  const bar: Pt = [56, 12];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet), bend: { lArm: 'down', rArm: 'down', lLeg: 'right', rLeg: 'right' } }, ['lArm', 'rArm', 'torso']);
  return clip({ scene: 'bar', holds: BAR_HOLD(56, 12), start: pose([55, 35.5], [53, 57.5], [52, 86]), end: pose([49, 17], [40, 37], [44, 64]), seconds: 2.4 });
}

/** Kipping pull-up: a hollow-to-arch swing that throws the chin over the bar. */
export function kipPullUp({ clap = false }: { clap?: boolean } = {}): FigureSpec {
  const bar: Pt = [52, 12];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt, hands: Pt = bar) =>
    S({ neck, pelvis, lHand: hands, rHand: behind(hands), lFoot: feet, rFoot: behind(feet), bend: { lArm: 'down', rArm: 'down' } }, ['torso', 'lLeg', 'rLeg']);
  const top = clap ? pose([50, 16], [52, 38], [76, 54], [55, 1]) : pose([50, 18.5], [52, 40.5], [76, 56]);
  return clip({ scene: 'bar', holds: BAR_HOLD(52, 12), start: pose([54, 35], [48, 56], [33, 80]), end: top, seconds: 1.8, arrows: [{ d: 'M30,90 Q56,98 80,70' }] });
}

/** Muscle-up from a hang to support over the bar (or the slow way down for negatives). Drawn smaller to fit both ends. */
export function muscleUp(tempo?: 'slow-return', kip = false): FigureSpec {
  const bar: Pt = [50, 37];
  const k = 0.78;
  const pose = (neck: Pt, pelvis: Pt, feet: Pt, bendArms: 'down' | 'up' = 'down') =>
    scaled(
      S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet), bend: { lArm: bendArms, rArm: bendArms } }, ['lArm', 'rArm', 'torso']),
      k,
      bar,
    );
  const hang = kip ? pose([52, 61], [45, 82.5], [26, 106]) : pose([48, 61.5], [46, 83.5], [45, 112]);
  const support = pose([53, 14.5], [50, 37], [47, 65]);
  const wall = BAR_ACROSS(bar[1]);
  const arrows: Arrow[] = kip ? [{ d: 'M14,92 Q46,100 78,78' }] : [];
  return tempo
    ? clip({ scene: 'bar', wall, start: support, end: hang, tempo, seconds: 3.6 })
    : clip({ scene: 'bar', wall, start: hang, end: support, seconds: 2.4, arrows });
}

/** Bar pullover: from a hang, the hips swing up and over the bar into support. */
export function barPullover(): FigureSpec {
  const bar: Pt = [50, 37];
  const k = 0.78;
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    scaled(S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet), bend: { lArm: 'down', rArm: 'down' } }, CORE), k, bar);
  return clip({
    scene: 'bar',
    wall: BAR_ACROSS(bar[1]),
    start: pose([48, 61.5], [46, 83.5], [45, 112]),
    end: pose([55, 15], [48, 37.5], [20, 30]),
    seconds: 2.6,
    arrows: [{ d: 'M66,52 A16,16 0 1 0 64,24' }],
  });
}

/** Pull-up holding the legs level in an L, on a bar or rings; `clap` lets go at the top. */
export function lPullUp({ rings = false, clap = false }: { rings?: boolean; clap?: boolean } = {}): FigureSpec {
  const grip: Pt = [48, 12];
  const pose = (neckY: number, hands: Pt = grip) => {
    const neck: Pt = [46, neckY];
    const pelvis: Pt = [46, neckY + 22];
    const person = S({ neck, pelvis, lHand: hands, rHand: behind(hands, 1.5), lFoot: [75, pelvis[1]], rFoot: [75, pelvis[1] + 1.5], bend: { lArm: 'right', rArm: 'right' } }, ['lArm', 'rArm', 'lLeg', 'rLeg']);
    return rings ? onRings(person, [grip]) : person;
  };
  const top = clap ? pose(17, [50, 1]) : pose(19);
  return clip({ scene: rings ? 'rings' : 'bar', wall: rings ? undefined : BAR_ACROSS(grip[1]), start: pose(35), end: top, seconds: clap ? 2 : 2.6, arrows: clap ? [{ d: 'M84,40 L84,22' }] : [] });
}

/* ------------------------------------------------------------------ */
/* Hanging leg work                                                    */
/* ------------------------------------------------------------------ */

export type HangLegs = 'l-hang' | 'straight-raise' | 'knees-to-bar' | 'toes-to-bar' | 'straddle-toes' | 'wipers';
/** Hanging from a bar, raising the legs. */
export function hangingRaise(kind: HangLegs, { ankleWeights = false }: { ankleWeights?: boolean } = {}): FigureSpec {
  if (kind === 'straddle-toes' || kind === 'wipers') {
    // Seen from the front.
    const pose = (pelvis: Pt, l: Pt, r: Pt) =>
      FRONT({ neck: [50, 35], pelvis, lHand: [40, 14], rHand: [60, 14], lFoot: l, rFoot: r, bend: { lArm: 'down', rArm: 'down' } }, CORE);
    const hang = pose([50, 57], [47.5, 85.5], [52.5, 85.5]);
    return kind === 'wipers'
      ? clip({ scene: 'bar', wall: BAR_ACROSS(14), start: pose([50, 56], [28, 22], [33, 18]), end: pose([50, 56], [72, 22], [67, 18]), seconds: 2.4 })
      : clip({ scene: 'bar', wall: BAR_ACROSS(14), start: hang, end: pose([50, 53], [26, 20], [74, 20]), seconds: 2.4 });
  }
  const bar: Pt = [50, 12];
  const neck: Pt = [50, 35.5];
  const pose = (pelvis: Pt, feet: Pt, knees?: Pt) => {
    const person = S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: feet, rFoot: behind(feet, 0, 1.5), joints: knees ? { lLeg: knees, rLeg: behind(knees, 0, 1.5) } : undefined }, CORE);
    return ankleWeights ? kit(person, [plateAt([feet[0] + 1.5, feet[1]], 2.8)]) : person;
  };
  const hang = pose([50, 57.5], [50, 86.5]);
  const t2bHips = toward(neck, [63, 52], 22);
  const end =
    kind === 'l-hang'
      ? pose([48, 57.5], [77, 57])
      : kind === 'straight-raise'
        ? pose([56, 54], [67, 26])
        : kind === 'toes-to-bar'
          ? pose(t2bHips, toward(t2bHips, [53, 12], 29.5))
          : pose([54, 55], [56, 34], [64, 44]);
  return clip({ scene: 'bar', holds: BAR_HOLD(50, 12), start: hang, end, seconds: kind === 'l-hang' ? 2.6 : 2.4 });
}

/** L-sit pull-up on wide rings: legs held level while the body rises. */
export function ringLPull(): FigureSpec {
  return lPullUp({ rings: true });
}

/* ------------------------------------------------------------------ */
/* Rotations on rings: skin the cat and friends                        */
/* ------------------------------------------------------------------ */

/** Hands on rings at (50,14); the body rotates around them. */
export const ringHand: Pt = [50, 14];
export const onTheRings = (person: Drawn) => onRings(person, [ringHand]);

export function ringPose(neck: Pt, pelvis: Pt, feet: Pt, knees?: Pt, focus: Part[] = CORE): Drawn {
  return onTheRings(
    S({ neck, pelvis, lHand: ringHand, rHand: behind(ringHand, 1), lFoot: feet, rFoot: behind(feet, 1.5), joints: knees ? { lLeg: knees, rLeg: behind(knees, 1.5) } : undefined }, focus),
  );
}

export const DEAD_HANG = () => ringPose([50, 37.5], [50, 59.5], [50, 88]);
export const INVERTED_TUCK = () => ringPose([50, 37], [51, 15], [41, 21], [38, 8]);
export const GERMAN_HANG = () => ringPose([48, 37], [34, 52], [30, 76], [24, 62], ['lArm', 'rArm', 'torso']);

export type Rotation =
  | 'german-hang'
  | 'skin-the-cat'
  | 'full-turn'
  | 'backward-roll'
  | 'tuck-levers'
  | 'cross-to-back-lever'
  | 'kip-to-support'
  | 'felge-tuck'
  | 'felge-pike';
export function rotation(kind: Rotation): FigureSpec {
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
    case 'kip-to-support':
    case 'felge-tuck':
    case 'felge-pike': {
      // Rings at hip height of the support; the body comes up from under them.
      const hands: Pt = [50, 47];
      const at = (neck: Pt, pelvis: Pt, feet: Pt, knees?: Pt) =>
        onRings(S({ neck, pelvis, lHand: hands, rHand: behind(hands, -1.5), lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: 'up', rArm: 'up' }, joints: knees ? { lLeg: knees, rLeg: behind(knees, 1.5) } : undefined }, CORE), [hands]);
      const start =
        kind === 'felge-tuck' ? at([50, 70], [51, 48], [42, 60], [40, 48]) : at([50, 70], [51, 48], [62, 74]);
      const end =
        kind === 'felge-tuck'
          ? at([50, 25], [49, 47], [58, 60], [60, 46])
          : kind === 'felge-pike'
            ? at([50, 25], [49, 47], [77, 48])
            : at([50, 25], [49, 47], [50, 75]);
      return clip({ scene: 'rings', wall: FLOOR, start, end, seconds: 2.6, arrows: [{ d: 'M72,64 Q80,44 66,30' }] });
    }
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

export type LeverLegs = 'tuck' | 'advanced-tuck' | 'one-leg' | 'straddle' | 'half-lay';
/** Front lever: from a dead hang the body swings up to horizontal, face up, below the bar. */
export function frontLever(legs: LeverLegs, { rows = false }: { rows?: boolean } = {}): FigureSpec {
  const bar: Pt = [56, 18];
  const at = (y: number) => {
    const neck: Pt = [60, y];
    const pelvis: Pt = [38, y];
    const shape: Record<LeverLegs, { l: Pt; r: Pt; lKnee?: Pt; rKnee?: Pt }> = {
      tuck: { l: [32, y - 6], r: [30.5, y - 6], lKnee: [44, y - 10], rKnee: [42.5, y - 10] },
      'advanced-tuck': { l: [24, y - 14], r: [22.5, y - 14], lKnee: [38, y - 14.5], rKnee: [36.5, y - 14.5] },
      'one-leg': { l: [8.5, y], r: [30.5, y - 6], rKnee: [42.5, y - 10] },
      straddle: { l: [8.5, y], r: [10, y + 6] },
      'half-lay': { l: [8.5, y], r: [24, y + 8], rKnee: [30, y - 10] },
    };
    const { l, r, lKnee, rKnee } = shape[legs];
    return S({ neck, pelvis, lHand: bar, rHand: behind(bar), lFoot: l, rFoot: r, bend: { lArm: 'down', rArm: 'down' }, joints: { ...(lKnee ? { lLeg: lKnee } : {}), ...(rKnee ? { rLeg: rKnee } : {}) } }, ['torso', 'lArm', 'rArm']);
  };
  const hang = S({ neck: [56, 41.5], pelvis: [56, 63.5], lHand: bar, rHand: behind(bar), lFoot: [56, 92], rFoot: [54.5, 92] }, ['torso', 'lArm', 'rArm']);
  return rows
    ? clip({ scene: 'bar', holds: BAR_HOLD(bar[0], bar[1]), start: at(40), end: at(27), seconds: 2.6 })
    : clip({ scene: 'bar', holds: BAR_HOLD(bar[0], bar[1]), start: hang, end: at(40), seconds: 3 });
}

/** Back lever: from an inverted hang the body lowers to horizontal, face down, arms behind. */
export function backLever(legs: LeverLegs): FigureSpec {
  const bar: Pt = [44, 22];
  const y = 29;
  const shape: Record<LeverLegs, { l: Pt; r: Pt; lKnee?: Pt; rKnee?: Pt }> = {
    tuck: { l: [42, 42], r: [40.5, 42], lKnee: [52, 36], rKnee: [50.5, 36] },
    'advanced-tuck': { l: [30, 44], r: [28.5, 44], lKnee: [44, 44], rKnee: [42.5, 44] },
    'one-leg': { l: [15, y], r: [40.5, 42], rKnee: [50.5, 36] },
    straddle: { l: [15, y], r: [16.5, y + 6] },
    'half-lay': { l: [15, y], r: [26, 40], rKnee: [36, 43] },
  };
  const { l, r, lKnee, rKnee } = shape[legs];
  const inverted = S({ neck: [46, 45], pelvis: [45, 23], lHand: bar, rHand: behind(bar), lFoot: [44, -2], rFoot: [42.5, -2] }, ['torso', 'lArm', 'rArm']);
  const lever = S({ neck: [66, y], pelvis: [44, y], lHand: bar, rHand: behind(bar), lFoot: l, rFoot: r, joints: { ...(lKnee ? { lLeg: lKnee } : {}), ...(rKnee ? { rLeg: rKnee } : {}) } }, ['torso', 'lArm', 'rArm']);
  return clip({ scene: 'bar', holds: BAR_HOLD(bar[0], bar[1]), start: inverted, end: lever, seconds: 3 });
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

export interface RowOptions {
  /** How upright the body is: the more upright, the easier. */
  angle?: 'flat' | 'incline' | 'upright';
  rings?: boolean;
  tempo?: 'even' | 'slow-return';
  /** both: two hands · archer: the far arm stays straight · one: the far hand rests on the hip. */
  arms?: 'both' | 'archer' | 'one';
}

/** Body straight from the heels, pulling the chest to the bar or rings. */
export function row({ angle = 'flat', rings = false, tempo, arms = 'both' }: RowOptions = {}): FigureSpec {
  const heels: Pt = angle === 'upright' ? [42, G] : angle === 'incline' ? [24, G] : [12, G];
  const grip: Pt = angle === 'upright' ? [64, 20] : angle === 'incline' ? [68, 32] : [70, 52];
  const pose = (reach: number) => {
    const neck = meet(heels, BODY, grip, reach, lower);
    const pelvis = toward(neck, heels, 22);
    const farHand: Pt = arms === 'one' ? [pelvis[0] + 3, pelvis[1] - 3] : arms === 'archer' ? toward(neck, add(grip, [8, -2]), ARM) : behind(grip, -1, 0.5);
    const person = S(
      { neck, pelvis, lHand: grip, rHand: farHand, lFoot: heels, rFoot: behind(heels, 1.5), lToe: [0.25, -1], rToe: [0.25, -1], bend: { lArm: 'down', rArm: 'down' } },
      ['lArm', 'rArm', 'torso'],
    );
    return rings ? onRings(person, arms === 'both' ? [grip] : arms === 'archer' ? [grip, farHand] : [grip]) : person;
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

export function squat(depth: 'parallel' | 'full'): FigureSpec {
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
export function sideSquat(): FigureSpec {
  const l: Pt = [30, G];
  const r: Pt = [70, G];
  const pose = (pelvis: Pt, neck: Pt) =>
    FRONT({ neck, pelvis, lHand: [neck[0] - 4, neck[1] + 9], rHand: [neck[0] + 4, neck[1] + 9], lFoot: l, rFoot: r, bend: { lArm: 'out', rArm: 'out', lLeg: 'out', rLeg: 'out' } }, LEGS);
  return clip({ scene: 'floor', wall: FLOOR, start: pose([50, 58], [50, 36]), end: pose([36, 70], [40, 48.5]), seconds: 2.8 });
}

export type SplitKind = 'lunge' | 'chair' | 'shrimp';

export function splitLeg(kind: SplitKind): FigureSpec {
  if (kind === 'shrimp') return shrimp('beginner');
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

/**
 * Shrimp squat: standing on one leg, the other bent behind; lower until the
 * back knee touches. beginner/intermediate: one hand holds the back foot ·
 * advanced: hands forward, the back foot free · two-hands: both hands hold it.
 */
export function shrimp(kind: 'beginner' | 'intermediate' | 'advanced' | 'two-hands'): FigureSpec {
  const front: Pt = [52, G];
  const deep = kind === 'beginner' ? 0 : 3;
  const pose = (pelvis: Pt, backKnee: Pt, backFoot: Pt) => {
    const reach: Pt = [pelvis[0] + 22, pelvis[1] - 20];
    return S(
      {
        neck: [pelvis[0] + 4, pelvis[1] - 21.5],
        pelvis,
        lHand: kind === 'two-hands' ? behind(backFoot, 1) : reach,
        rHand: kind === 'advanced' ? behind(reach, -1, 1.5) : backFoot,
        lFoot: front,
        rFoot: backFoot,
        lToe: [1, 0],
        bend: { lLeg: 'right', lArm: kind === 'two-hands' ? 'down' : 'left', rArm: 'down' },
        joints: { rLeg: backKnee },
      },
      LEGS,
    );
  };
  return clip({
    scene: 'floor',
    wall: FLOOR,
    start: pose([50, 54], [45, 67], [36, 58]),
    end: pose([42 - deep, 66 + deep], [38 - deep, G - 1], [26 - deep, 74]),
    seconds: 2.8,
  });
}

/* ------------------------------------------------------------------ */
/* Lying down: bridges, slides, core                                   */
/* ------------------------------------------------------------------ */

export type BridgeKind = 'two-legs' | 'one-leg' | 'shoulders-raised' | 'shoulders-one-leg' | 'weighted' | 'hands-under';
/** Glute bridge: lying down, hips pushed up until shoulders, hips and knees line up. */
export function gluteBridge(kind: BridgeKind): FigureSpec {
  const feet: Pt = [72, G];
  const raisedShoulders = kind === 'shoulders-raised' || kind === 'shoulders-one-leg' || kind === 'weighted';
  const oneLeg = kind === 'one-leg' || kind === 'shoulders-one-leg';
  const shoulders: Pt = raisedShoulders ? [24, 61.5] : [28, 81];
  const pose = (pelvis: Pt, up: boolean) => {
    const neck: Pt = up ? toward(pelvis, shoulders, 22) : raisedShoulders ? shoulders : [pelvis[0] - 22, pelvis[1]];
    const freeLeg: Pt = add(pelvis, mul(unit(sub(pelvis, neck)), 28));
    const hands: Pt = kind === 'hands-under' ? [pelvis[0] - 3, pelvis[1] + 3] : kind === 'weighted' ? [pelvis[0] - 1, pelvis[1] - 7] : raisedShoulders ? [neck[0] + 5, neck[1] + 6] : [50, G];
    const person = S(
      {
        neck,
        pelvis,
        lHand: hands,
        rHand: behind(hands, -1),
        lFoot: feet,
        rFoot: oneLeg ? freeLeg : behind(feet, 1.5),
        lToe: [1, 0],
        rToe: oneLeg ? undefined : [1, 0],
        bend: { lArm: kind === 'weighted' ? 'up' : 'down', rArm: kind === 'weighted' ? 'up' : 'down', lLeg: 'up', rLeg: 'up' },
      },
      CORE,
    );
    return kind === 'weighted' ? kit(person, [plateAt([pelvis[0], pelvis[1] - 7.5], 6.5)]) : person;
  };
  const low: Pt = raisedShoulders ? [44, 76] : [50, 80.5];
  const high: Pt = raisedShoulders ? [46, 61.5] : [54, 64];
  return clip({ scene: 'floor', wall: raisedShoulders ? `${BENCH_LEFT} ${FLOOR}` : FLOOR, start: pose(low, false), end: pose(high, true), seconds: 2.4 });
}

/** Hamstring slide: hips up on the heels, then slide the heels out and back. */
export function hamstringSlide(oneLeg: boolean, tempo?: 'slow-return'): FigureSpec {
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
export function reverseHyper(knees: 'tuck' | 'right-angle' | 'straight', { weighted = false }: { weighted?: boolean } = {}): FigureSpec {
  const neck: Pt = [62, 56.5];
  const pelvis: Pt = [40, 56.5];
  const hands: Pt = [72, 64];
  const pose = (knee: Pt | undefined, foot: Pt) => {
    const person = S(
      { neck, pelvis, lHand: hands, rHand: behind(hands), lFoot: foot, rFoot: behind(foot, 0, 1.5), bend: { lArm: 'up', rArm: 'up' }, joints: knee ? { lLeg: knee, rLeg: behind(knee, 0, 1.5) } : undefined },
      ['lLeg', 'rLeg', 'torso'],
    );
    return weighted ? kit(person, [plateAt([foot[0], foot[1] + 1], 2.8)]) : person;
  };
  if (knees === 'straight') return clip({ scene: 'floor', wall: `M38,61 L76,61 L76,65 L38,65 Z M44,65 L47,65 L47,86 L44,86 Z M68,65 L71,65 L71,86 L68,86 Z ${FLOOR}`, start: pose(undefined, [33, 85]), end: pose(undefined, [11, 54]), seconds: 2.4 });
  const hanging = pose([32, 69], [36, 82]);
  const lifted = knees === 'tuck' ? pose([28, 50], [36, 46]) : pose([26, 57], [26, 42]);
  return clip({ scene: 'floor', wall: `M38,61 L76,61 L76,65 L38,65 Z M44,65 L47,65 L47,86 L44,86 Z M68,65 L71,65 L71,86 L68,86 Z ${FLOOR}`, start: hanging, end: lifted, seconds: 2.4 });
}

export type FloorCore = 'tuck-raise' | 'post-tuck' | 'post-leg-raise' | 'tuck-lowering';

/** Lying on the back: tuck raises, and the dragon-flag drills holding a post behind the head. */
export function floorCore(kind: FloorCore): FigureSpec {
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

export type LSitLegs = 'tuck' | 'one-leg' | 'straight' | 'v-sit';
/** From sitting, press the floor away until the hips lift. */
export function lSit(legs: LSitLegs, { rings = false, turnedOut = false }: { rings?: boolean; turnedOut?: boolean } = {}): FigureSpec {
  const raise = rings ? 20 : 0;
  const hands: Pt = [48, G - raise];
  const pose = (lift: number) => {
    const pelvis: Pt = [47, 82 - lift - raise];
    const neck: Pt = [46, pelvis[1] - 22];
    const straight: Pt = legs === 'v-sit' ? [68, pelvis[1] - 21] : [76, pelvis[1] - 1];
    const tuckFoot: Pt = [58, pelvis[1] - 1];
    const tuckKnee: Pt = [56, pelvis[1] - 12];
    const person = S(
      {
        neck,
        pelvis,
        lHand: hands,
        rHand: behind(hands),
        lFoot: legs === 'tuck' ? tuckFoot : straight,
        rFoot: legs === 'straight' || legs === 'v-sit' ? behind(straight, 0, 1.5) : behind(tuckFoot, 0, 1.5),
        joints: { ...(legs === 'tuck' ? { lLeg: tuckKnee } : {}), ...(legs === 'tuck' || legs === 'one-leg' ? { rLeg: behind(tuckKnee, 0, 1.5) } : {}) },
      },
      ['lArm', 'rArm', 'torso', 'lLeg', 'rLeg'],
    );
    return rings ? onRings(person, [hands]) : person;
  };
  const arrows: Arrow[] = turnedOut ? [{ d: `M${hands[0] + 6},${hands[1] + 4} Q${hands[0] + 9},${hands[1] - 1} ${hands[0] + 5},${hands[1] - 5}`, kind: 'force' }] : [];
  return clip({ scene: rings ? 'rings' : 'floor', wall: FLOOR, start: pose(0), end: pose(4), seconds: 2.4, arrows });
}

/** Straddle L-sit seen from the front, legs wide; on the floor or on rings. */
export function straddleLSit({ rings = false }: { rings?: boolean } = {}): FigureSpec {
  const raise = rings ? 18 : 0;
  const l: Pt = [38, G - raise];
  const r: Pt = [62, G - raise];
  const pose = (lift: number) => {
    const pelvis: Pt = [50, 80 - lift - raise];
    const person = FRONT(
      { neck: [50, pelvis[1] - 22], pelvis, lHand: l, rHand: r, lFoot: [16, pelvis[1] - 6], rFoot: [84, pelvis[1] - 6] },
      ['lArm', 'rArm', 'torso', 'lLeg', 'rLeg'],
    );
    return rings ? onRings(person, [l, r], [36, 64]) : person;
  };
  return clip({ scene: rings ? 'rings' : 'floor', wall: FLOOR, start: pose(0), end: pose(4), seconds: 2.4 });
}

/** Forearm plank with a timer: a steady hold with breathing. */
export function plank(seconds: string): FigureSpec {
  const feet: Pt = [14, G];
  const pose = (lift: number) => {
    const neck: Pt = [62, 72.5 - lift];
    return S({ neck, pelvis: toward(neck, feet, 22), lHand: [73, G], rHand: [71.5, G], lFoot: feet, rFoot: behind(feet, 1.5), joints: { lArm: [61, G], rArm: [59.5, G] } }, CORE);
  };
  return clip({ scene: 'floor', wall: FLOOR, start: pose(0), end: pose(1.2), seconds: 3, labels: [{ at: [50, 44], text: seconds }] });
}

/** Side plank, seen from the front: hips lift from the floor into a straight line. */
export function sidePlank(): FigureSpec {
  const feet: Pt = [84, G];
  const elbow: Pt = [26, G];
  const pose = (pelvisY: number) => {
    const pelvis: Pt = [56, pelvisY];
    const neck = toward(pelvis, [28, 64], 22);
    return FRONT({ neck, pelvis, lHand: [32, G], rHand: [44, pelvisY - 4], lFoot: feet, rFoot: behind(feet, 0, -1.5), joints: { lArm: elbow } }, CORE);
  };
  return clip({ scene: 'floor', wall: FLOOR, start: pose(80), end: pose(70.5), seconds: 2.4 });
}

export type ReverseKind = 'reverse-plank' | 'table';

/** Facing up, hands behind: hips lift until the body is straight (or a flat table with bent knees). */
export function reversePlank(kind: ReverseKind): FigureSpec {
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
export function backBridge(kind: 'head' | 'one-arm' | 'angled' | 'wheel'): FigureSpec {
  const onHead = kind === 'head';
  const angled = kind === 'angled';
  const feet: Pt = [68, G];
  const handsAt: Pt = angled ? [26, 59.5] : onHead ? [29, G] : [27, G];
  const pelvis: Pt = onHead ? [56, 60] : angled ? [58, 50] : [56, 52];
  const neck = toward(pelvis, onHead ? [30, 76] : angled ? [30, 58] : [30, 66], 22);
  const pose = (lHand: Pt, hips: Pt = pelvis, neckAt: Pt = neck) =>
    S({ neck: neckAt, pelvis: hips, lHand, rHand: kind === 'one-arm' || onHead ? [handsAt[0] + 1, handsAt[1]] : behind(handsAt, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'up' } }, ['torso', 'lArm', 'rArm']);
  // A dotted arc over the body: the back arches, belly up — not a pike.
  const arch: Arrow = { d: `M${neck[0] - 2},${neck[1] - 9} Q${pelvis[0] - 8},${pelvis[1] - 22} ${pelvis[0] + 10},${pelvis[1] - 6}`, kind: 'guide' };
  const wall = angled ? `M6,62 L30,62 L30,86 L6,86 Z ${FLOOR}` : FLOOR;
  if (kind === 'wheel') {
    // From lying on the back, hands by the ears, push up into the wheel.
    const lying = pose([30, G], [50, 80.5], [28, 80.5]);
    return clip({ scene: 'floor', wall, start: lying, end: pose(handsAt), seconds: 2.8, arrows: [arch] });
  }
  if (angled) return clip({ scene: 'floor', wall, start: pose(handsAt, [56, 66], toward([56, 66], [30, 64], 22)), end: pose(handsAt), seconds: 2.6, arrows: [arch] });
  return clip({ scene: 'floor', wall, start: pose(handsAt), end: pose([neck[0] + 4, neck[1] - 16]), seconds: 2.8, arrows: [arch] });
}

/** Vertical flag on a pole: from standing beside it to holding the body straight up, feet off the floor. */
export function verticalFlag(): FigureSpec {
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
export function overheadPress(load: number): FigureSpec {
  const feet: Pt = [50, G];
  const pose = (hands: Pt) =>
    kit(S({ neck: [50, 32], pelvis: [50, 54], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'down', rArm: 'down' } }, PUSH), [plateAt(hands, load)]);
  return clip({ scene: 'floor', wall: FLOOR, start: pose([55, 31]), end: pose([51, 9.5]), seconds: 2.4 });
}


/* ------------------------------------------------------------------ */
/* Planche                                                             */
/* ------------------------------------------------------------------ */

export interface PlancheOptions {
  /** straight-frog: knees resting on straight arms · tuck · advanced-tuck: back flat, hips open. */
  legs: 'straight-frog' | 'tuck' | 'advanced-tuck';
  rings?: boolean;
  /** Lower and press back up while holding the shape. */
  press?: boolean;
}

/** Shoulders leaning well past the hands, hips lifted; from feet on the floor into the hold, or press-ups in it. */
export function planche({ legs, rings = false, press = false }: PlancheOptions): FigureSpec {
  const lift = rings ? 13 : 0;
  const up = (p: Pt): Pt => [p[0], p[1] - lift];
  const hands = up([56, G]);
  const pose = (neck: Pt, pelvis: Pt, feet: Pt, knee?: Pt) => {
    const person = S(
      {
        neck: up(neck),
        pelvis: up(pelvis),
        lHand: hands,
        rHand: behind(hands, -1.5),
        lFoot: up(feet),
        rFoot: behind(up(feet), 1.5),
        bend: { lArm: 'left', rArm: 'left' },
        joints: knee ? { lLeg: up(knee), rLeg: behind(up(knee), 1.5) } : undefined,
      },
      ['lArm', 'rArm', 'torso'],
    );
    return rings ? onRings(person, [hands, behind(hands, -1.5)]) : person;
  };
  const shapes: Record<PlancheOptions['legs'], { neck: Pt; pelvis: Pt; feet: Pt; knee: Pt }> = {
    'straight-frog': { neck: [65, 62], pelvis: [45, 54], feet: [46, 70], knee: [58, 66] },
    tuck: { neck: [65, 62], pelvis: [43.2, 59.4], feet: [42, 74], knee: [53, 70] },
    'advanced-tuck': { neck: [65, 62], pelvis: [43, 62], feet: [29, 75], knee: [43, 77] },
  };
  const hold = shapes[legs];
  const shape = pose(hold.neck, hold.pelvis, hold.feet, hold.knee);
  const scene: Scene = rings ? 'rings' : 'floor';
  if (press) {
    const down = (p: Pt): Pt => [p[0] + 1, p[1] + 9];
    return clip({ scene, wall: FLOOR, start: shape, end: pose(down(hold.neck), down(hold.pelvis), down(hold.feet), down(hold.knee)), seconds: 2.6 });
  }
  const lean = pose([61, 61.5], [42, 69], [36, G], legs === 'straight-frog' ? [56, 68] : undefined);
  return clip({ scene, wall: FLOOR, start: lean, end: shape, seconds: 2.8 });
}

/* ------------------------------------------------------------------ */
/* Dragon flag                                                         */
/* ------------------------------------------------------------------ */

/** On the upper back, holding a post behind the head; the rigid body lowers from steep to just above the floor. */
export function dragonFlag(legs: 'advanced-tuck' | 'one-leg-straddle' | 'full'): FigureSpec {
  const neck: Pt = [26, 76];
  const hands: Pt = [12, 72];
  const pose = (angle: number) => {
    const dir: Pt = [Math.cos(angle), -Math.sin(angle)];
    const belly: Pt = [dir[1], -dir[0]];
    const pelvis = add(neck, mul(dir, 22));
    const straight = add(pelvis, mul(dir, 29.5));
    const knee = add(pelvis, mul(belly, 15));
    const tucked = sub(knee, mul(dir, 14.5));
    const l = legs === 'advanced-tuck' ? tucked : straight;
    const r = legs === 'full' ? behind(straight, 1.5) : tucked;
    return S(
      {
        neck,
        pelvis,
        lHand: hands,
        rHand: behind(hands, 1),
        lFoot: l,
        rFoot: r,
        head: [neck[0] - 7, 81],
        bend: { lArm: 'up', rArm: 'up' },
        joints: { ...(legs === 'advanced-tuck' ? { lLeg: knee } : {}), ...(legs !== 'full' ? { rLeg: behind(knee, 1.5) } : {}) },
      },
      CORE,
    );
  };
  return clip({ scene: 'floor', wall: `M9,40 L13,40 L13,86 L9,86 Z ${FLOOR}`, start: pose((70 * Math.PI) / 180), end: pose((12 * Math.PI) / 180), tempo: 'slow-return', seconds: 3.6 });
}

/* ------------------------------------------------------------------ */
/* Elbow lever and human flag                                          */
/* ------------------------------------------------------------------ */

/** Elbows dug into the hips, the body balanced level on them; or one arm, pressing on up to a one-arm handstand. */
export function elbowLever({ rings = false, oneArmToHandstand = false }: { rings?: boolean; oneArmToHandstand?: boolean } = {}): FigureSpec {
  const lift = rings ? 9 : 0;
  const up = (p: Pt): Pt => [p[0], p[1] - lift];
  const hands = up([52, G]);
  const elbow = up([51, 72]);
  const lever = (neck: Pt, feet: Pt) => {
    const n = up(neck);
    const person = S(
      {
        neck: n,
        pelvis: toward(n, up(feet), 22),
        lHand: hands,
        rHand: oneArmToHandstand ? up([66, 62]) : behind(hands, -1.5),
        lFoot: up(feet),
        rFoot: behind(up(feet), 1.5),
        joints: { lArm: elbow, ...(oneArmToHandstand ? {} : { rArm: behind(elbow, -1.5) }) },
      },
      ['lArm', 'rArm', 'torso'],
    );
    return rings ? onRings(person, [hands]) : person;
  };
  const start = lever([62.5, 68], [12, G]);
  const hold = lever([62.5, 70.5], [11, 70.5]);
  if (oneArmToHandstand) {
    const handstand = S({ neck: [53, 60], pelvis: [55, 38], lHand: [52, G], rHand: [66, 46], lFoot: [57, 9], rFoot: [55.5, 9] }, ['lArm', 'torso']);
    return clip({ scene: 'floor', wall: FLOOR, start: hold, end: handstand, seconds: 3.2 });
  }
  return clip({ scene: rings ? 'rings' : 'floor', wall: FLOOR, start, end: hold, seconds: 2.6 });
}

/** Human flag on a pole, seen from the front: from standing beside it to the body held sideways, knees tucked. */
export function humanFlag(legs: 'tuck' | 'advanced-tuck'): FigureSpec {
  const top: Pt = [27, 18];
  const low: Pt = [27, 52];
  const wall = `M24,4 L30,4 L30,86 L24,86 Z ${FLOOR}`;
  const standing = FRONT({ neck: [44, 33], pelvis: [45, 55], lHand: low, rHand: top, lFoot: [48, G], rFoot: [53, G], bend: { lArm: 'down', rArm: 'up' } }, ['lArm', 'rArm', 'torso']);
  const knees: Pt = legs === 'tuck' ? [60, 25] : [70, 25];
  const feet: Pt = legs === 'tuck' ? [70, 31] : [80, 34];
  const flag = FRONT(
    { neck: [46, 37], pelvis: [68, 38], lHand: low, rHand: top, lFoot: feet, rFoot: behind(feet, 1, 4), joints: { lLeg: knees, rLeg: behind(knees, 1, 4) } },
    ['lArm', 'rArm', 'torso'],
  );
  return clip({ scene: 'bar', wall, start: standing, end: flag, seconds: 2.8 });
}

/* ------------------------------------------------------------------ */
/* Handstands                                                          */
/* ------------------------------------------------------------------ */

/** A straight handstand over hands at `hands`, leaning `sway` units to the side. */
const handstandPose = (hands: Pt, sway = 0, focus: Part[] = ['lArm', 'rArm', 'torso']) =>
  S(
    {
      neck: [hands[0] + sway, hands[1] - 23.5],
      pelvis: [hands[0] + 1 + sway * 1.5, hands[1] - 45.5],
      lHand: hands,
      rHand: behind(hands, -1.5),
      lFoot: [hands[0] + 2 + sway * 2, hands[1] - 74.5],
      rFoot: [hands[0] + 0.5 + sway * 2, hands[1] - 74.5],
    },
    focus,
  );

/** Freestanding handstand: kicking up from a lunge, holding with small corrections, or shifting toward one arm. */
export function handstand(kind: 'kick' | 'hold' | 'one-arm-prep'): FigureSpec {
  const hands: Pt = [56, G];
  if (kind === 'hold') return clip({ scene: 'floor', wall: FLOOR, start: handstandPose(hands, -1.5), end: handstandPose(hands, 1.5), seconds: 2.4 });
  if (kind === 'kick') {
    const neck: Pt = [55, 60.5];
    const lunge = S({ neck, pelvis: toward(neck, [34, 52], 22), lHand: hands, rHand: behind(hands, -1.5), lFoot: [40, G], rFoot: [12, 42] }, ['lLeg', 'rLeg', 'torso']);
    return clip({ scene: 'floor', wall: FLOOR, start: lunge, end: handstandPose(hands, 0, ['lLeg', 'rLeg', 'torso']), seconds: 2.4 });
  }
  // Seen from the front, upside down: the left hand is on the right of the picture.
  const pose = (shift: number, freeHand: Pt) =>
    FRONT(
      { neck: [50 - shift, 60], pelvis: [50 - shift * 1.6, 38], lHand: [57, G], rHand: freeHand, lFoot: [72 - shift * 2, 16], rFoot: [28 - shift * 2, 16] },
      ['lArm', 'rArm', 'torso'],
    );
  return clip({ scene: 'floor', wall: FLOOR, start: pose(0, [43, G]), end: pose(-4, [40, G - 6]), seconds: 2.8 });
}

/** On rings: a shoulder stand, pressing up to a handstand, or a handstand with the legs against the straps. Drawn smaller to fit. */
export function ringsHandstand(kind: 'shoulder-stand' | 'handstand' | 'strap'): FigureSpec {
  if (kind === 'shoulder-stand') {
    const hands: Pt = [50, 58];
    const pose = (feet: Pt, knees?: Pt) =>
      onRings(
        S({ neck: [51, 64.5], pelvis: [52, 42.5], lHand: hands, rHand: behind(hands, -1.5), lFoot: feet, rFoot: behind(feet, 1.5), joints: knees ? { lLeg: knees, rLeg: behind(knees, 1.5) } : undefined }, ['lArm', 'rArm', 'torso']),
        [hands],
      );
    return clip({ scene: 'rings', wall: FLOOR, start: pose([42, 48], [40, 34]), end: pose([53, 13]), seconds: 2.8 });
  }
  const k = 0.8;
  const hands: Pt = [56, 68];
  if (kind === 'strap') {
    const pose = (spread: number) =>
      scaled(
        onRings(
          FRONT(
            { neck: [50, 44.5], pelvis: [50, 22.5], lHand: [58, 68], rHand: [42, 68], lFoot: [50 + spread, -7], rFoot: [50 - spread, -7] },
            ['lArm', 'rArm', 'torso'],
          ),
          [
            [58, 68],
            [42, 68],
          ],
          [64, 36],
        ),
        k,
        [50, 68],
      );
    return clip({ scene: 'rings', wall: FLOOR, start: pose(6), end: pose(11), seconds: 2.6 });
  }
  const shoulderStand = onRings(S({ neck: [57, 76], pelvis: [58, 54], lHand: hands, rHand: behind(hands, -1.5), lFoot: [58, 24.5], rFoot: [56.5, 24.5] }, ['lArm', 'rArm', 'torso']), [hands]);
  const straight = onRings(handstandPose(hands), [hands]);
  return clip({ scene: 'rings', wall: FLOOR, start: scaled(shoulderStand, k, hands), end: scaled(straight, k, hands), seconds: 2.8 });
}

/** Headstand push-up with no wall, from the head on the floor up to a handstand. */
export function freeHeadstandPushUp(): FigureSpec {
  const hands: Pt = [56, G];
  const pose = (neck: Pt) =>
    S({ neck, pelvis: [neck[0] + 2, neck[1] - 22], lHand: hands, rHand: behind(hands, -1.5), lFoot: [neck[0] + 4, neck[1] - 51], rFoot: [neck[0] + 2.5, neck[1] - 51] }, PUSH);
  return clip({ scene: 'floor', wall: FLOOR, start: pose([58, 72.5]), end: pose([56.5, 60]), seconds: 2.8 });
}

/** Handstand push-up on rings: wide (side view), or with the legs against the straps (front view). */
export function ringsHandstandPushUp(kind: 'wide' | 'strap'): FigureSpec {
  const k = 0.8;
  if (kind === 'strap') {
    const pose = (neckY: number) =>
      scaled(
        onRings(
          FRONT(
            { neck: [50, neckY], pelvis: [50, neckY - 22], lHand: [60, 68], rHand: [40, 68], lFoot: [61, neckY - 51], rFoot: [39, neckY - 51], bend: { lArm: 'out', rArm: 'out' } },
            PUSH,
          ),
          [
            [60, 68],
            [40, 68],
          ],
          [64, 36],
        ),
        k,
        [50, 68],
      );
    return clip({ scene: 'rings', wall: FLOOR, start: pose(44.5), end: pose(56), seconds: 2.8 });
  }
  const hands: Pt = [56, 68];
  const pose = (neck: Pt) =>
    onRings(S({ neck, pelvis: [neck[0] + 2, neck[1] - 22], lHand: hands, rHand: behind(hands, -1.5), lFoot: [neck[0] + 4, neck[1] - 51], rFoot: [neck[0] + 2.5, neck[1] - 51] }, PUSH), [hands]);
  return clip({ scene: 'rings', wall: FLOOR, start: scaled(pose([56, 44.5]), k, hands), end: scaled(pose([57, 56]), k, hands), seconds: 2.8 });
}

/** Press to handstand from a crouch, an L-sit, a straddle on a box, a chair on rings, or the slow way down at a wall. */
export function pressToHandstand(from: 'bent-arm' | 'l-sit' | 'wall-straddle' | 'elevated-straddle' | 'chair'): FigureSpec {
  const hands: Pt = [56, G];
  const end = handstandPose(hands, 0, CORE);
  switch (from) {
    case 'bent-arm':
      return clip({
        scene: 'floor',
        wall: FLOOR,
        start: S({ neck: [63, 66], pelvis: [47, 51], lHand: hands, rHand: behind(hands, -1.5), lFoot: [46, 66], rFoot: [44.5, 66], bend: { lArm: 'left', rArm: 'left' }, joints: { lLeg: [58, 58], rLeg: [56.5, 58] } }, CORE),
        end,
        seconds: 3,
      });
    case 'l-sit':
      return clip({
        scene: 'floor',
        wall: FLOOR,
        start: S({ neck: [54, 58], pelvis: [55, 79.5], lHand: hands, rHand: behind(hands, -1.5), lFoot: [84, 78.5], rFoot: [84, 80] }, CORE),
        end,
        seconds: 3.2,
      });
    case 'elevated-straddle':
      return clip({
        scene: 'floor',
        wall: `${BOX_LEFT} ${FLOOR}`,
        start: S({ neck: [58, 61], pelvis: [44, 44], lHand: hands, rHand: behind(hands, -1.5), lFoot: [26, 60], rFoot: [24.5, 60] }, CORE),
        end,
        seconds: 3,
      });
    case 'wall-straddle': {
      const wallHands: Pt = [72, G];
      return clip({
        scene: 'floor',
        wall: `${WALL_RIGHT} ${FLOOR}`,
        start: handstandPose(wallHands, 2, CORE),
        end: S({ neck: [73, 61], pelvis: [58, 45], lHand: wallHands, rHand: behind(wallHands, -1.5), lFoot: [40, G], rFoot: [38.5, G] }, CORE),
        tempo: 'slow-return',
        seconds: 3.6,
      });
    }
    case 'chair': {
      const ringHands: Pt = [56, 68];
      const k = 0.8;
      const chair = onRings(
        S({ neck: [54, 45], pelvis: [55, 67], lHand: ringHands, rHand: behind(ringHands, -1.5), lFoot: [64, 74], rFoot: [62.5, 74], joints: { lLeg: [68, 60], rLeg: [66.5, 60] } }, CORE),
        [ringHands],
      );
      return clip({ scene: 'rings', wall: FLOOR, start: scaled(chair, k, ringHands), end: scaled(onRings(handstandPose(ringHands, 0, CORE), [ringHands]), k, ringHands), seconds: 3 });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Legs: pistols, Nordics, kneeling quad work                          */
/* ------------------------------------------------------------------ */

/** Pistol squat: down on one leg, the other held straight out in front; optionally holding a weight at the chest. */
export function pistol(load?: number): FigureSpec {
  const foot: Pt = [50, G];
  const pose = (pelvis: Pt, neck: Pt, free: Pt) => {
    const hands: Pt = load ? [neck[0] + 6, neck[1] + 8] : [neck[0] + 22, neck[1] + 2];
    const person = S(
      { neck, pelvis, lHand: hands, rHand: behind(hands, -1, 1.5), lFoot: foot, rFoot: free, lToe: [1, 0], bend: { lLeg: 'right', lArm: load ? 'down' : 'left', rArm: load ? 'down' : 'left' } },
      LEGS,
    );
    return load ? kit(person, [plateAt(hands, load)]) : person;
  };
  return clip({ scene: 'floor', wall: FLOOR, start: pose([49, 54], [49, 32], [76, 63]), end: pose([40, 76], [53.2, 58.4], [69, 74.5]), seconds: 3 });
}

/** Kneeling with the heels anchored: hinge at the hips, or lower the whole body forward (Nordic curl). */
export function nordic(kind: 'hinge' | 'eccentric' | 'full'): FigureSpec {
  const knee: Pt = [48, G];
  const ankle: Pt = [33, G];
  const pose = (pelvis: Pt, neck: Pt, hands: Pt) =>
    S({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: ankle, rFoot: behind(ankle, 1.5), joints: { lLeg: knee, rLeg: behind(knee, 1.5) }, bend: { lArm: 'down', rArm: 'down' } }, ['lLeg', 'rLeg', 'torso']);
  const upright = pose([48, 68.5], [48, 46.5], [55, 54]);
  const holds = [hold(31, G - 4.5, 'bar')];
  if (kind === 'hinge') return clip({ scene: 'floor', wall: FLOOR, holds, start: upright, end: pose([48, 68.5], [69.6, 72.9], [80, 78]), seconds: 2.6 });
  const dir: Pt = [0.906, -0.423];
  const pelvis = add(knee, mul(dir, 15));
  const low = pose(pelvis, add(pelvis, mul(dir, 22)), [86, G]);
  return clip({ scene: 'floor', wall: FLOOR, holds, start: upright, end: low, tempo: kind === 'eccentric' ? 'slow-return' : undefined, seconds: kind === 'eccentric' ? 3.6 : 3 });
}

/** Quad work from the knees or the toes: a kneeling lean back (leg extension, matrix) or a sissy squat. */
export function kneelingQuad(kind: 'leg-extension' | 'matrix' | 'sissy'): FigureSpec {
  if (kind === 'sissy') {
    const ankle: Pt = [50, G];
    const pose = (pelvis: Pt, neck: Pt, knee?: Pt) =>
      S(
        { neck, pelvis, lHand: [neck[0] + 20, neck[1] + 4], rHand: [neck[0] + 19, neck[1] + 5.5], lFoot: ankle, rFoot: behind(ankle, 1.5), lToe: [1, 0.3], rToe: [1, 0.3], joints: knee ? { lLeg: knee, rLeg: behind(knee, 1.5) } : undefined },
        LEGS,
      );
    return clip({ scene: 'floor', wall: FLOOR, start: pose([50, 54], [50, 32]), end: pose([54.7, 61.3], [43.7, 42.2], [64, 73]), seconds: 2.8 });
  }
  const knee: Pt = [48, G];
  const ankle: Pt = [33, G];
  const pose = (dir: Pt) => {
    const pelvis = add(knee, mul(dir, 15));
    const neck = add(pelvis, mul(dir, 22));
    return S({ neck, pelvis, lHand: [neck[0] + 20, neck[1] + 6], rHand: [neck[0] + 19, neck[1] + 7.5], lFoot: ankle, rFoot: behind(ankle, 1.5), joints: { lLeg: knee, rLeg: behind(knee, 1.5) } }, LEGS);
  };
  const back: Pt = kind === 'matrix' ? [-0.75, -0.66] : [-0.42, -0.91];
  return clip({ scene: 'floor', wall: FLOOR, start: pose([0, -1]), end: pose(back), tempo: kind === 'matrix' ? 'slow-return' : undefined, seconds: kind === 'matrix' ? 3.4 : 2.6 });
}

/* ------------------------------------------------------------------ */
/* Arms and core extras                                                */
/* ------------------------------------------------------------------ */

/** Pelican curl on rings: leaning forward with the arms straight behind, then curling the body up to the hands. */
export function pelicanCurl(incline: boolean): FigureSpec {
  const feet: Pt = incline ? [44, G] : [38, G];
  const pose = (lean: Pt, hands: Pt) => {
    const neck = add(feet, mul(unit(lean), BODY));
    return onRings(
      S({ neck, pelvis: toward(neck, feet, 22), lHand: hands, rHand: behind(hands, -1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'down', rArm: 'down' } }, ARMS),
      [hands],
      [50],
    );
  };
  return clip({ scene: 'rings', wall: FLOOR, start: pose(incline ? [14, -50] : [21, -47], incline ? [46, 58] : [44, 60]), end: pose([4, -50], [56, 36]), seconds: 2.8 });
}

/** Ab wheel: from the knees, standing towards a ramp, or a plank lifting the opposite arm and leg. */
export function abWheel(kind: 'knees' | 'ramp' | 'one-arm-leg-plank'): FigureSpec {
  const wheel = (hands: Pt): Disc => ({ at: [hands[0], hands[1] + 2.5], r: 4, tone: 'body', kind: 'plate' });
  if (kind === 'knees') {
    const pose = (pelvis: Pt, neck: Pt, hands: Pt) =>
      kit(S({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: [22, G], rFoot: [21, G], joints: { lLeg: [36, G], rLeg: [35, G] } }, ['torso', 'lArm', 'rArm']), [wheel(hands)]);
    return clip({ scene: 'floor', wall: FLOOR, start: pose([38, 69], [55, 57], [57, 79.5]), end: pose([49, 76.5], [70.3, 71], [90, 79.5]), seconds: 3 });
  }
  if (kind === 'ramp') {
    const feet: Pt = [20, G];
    const pose = (neck: Pt, pelvis: Pt, hands: Pt) => kit(S({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5) }, ['torso', 'lArm', 'rArm']), [wheel(hands)]);
    const reach: Pt = [84, 70];
    const extended = meet(feet, BODY, reach, ARM, higher);
    return clip({ scene: 'floor', wall: `M64,86 L96,62 L96,86 Z ${FLOOR}`, start: pose([46, 72], [34, 53.5], [52, 79.5]), end: pose(extended, toward(extended, feet, 22), reach), seconds: 3 });
  }
  const feet: Pt = [14, G];
  const neck: Pt = [62, 72.5];
  const pelvis = toward(neck, feet, 22);
  const plankPose = (lHand: Pt, rFoot: Pt, elbow?: Pt) =>
    S({ neck, pelvis, lHand, rHand: [71.5, G], lFoot: feet, rFoot, joints: { ...(elbow ? { lArm: elbow } : {}), rArm: [59.5, G] } }, CORE);
  return clip({ scene: 'floor', wall: FLOOR, start: plankPose([73, G], behind(feet, 1.5), [61, G]), end: plankPose([86, 66], [12, 66]), seconds: 2.8 });
}
