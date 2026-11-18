import { Disc, FigureSpec, Pt, Scene, Stroke } from './SkillFigure';
import { Drawn, Part, Pose, climber, figure, hold, pelvisToward } from './figureKit';

/**
 * One animated drawing per gym skill. Most lifts are seen side-on, facing
 * right; the equipment (plates, dumbbells, cables) moves with the hands.
 * Heavier standards of the same lift draw bigger plates.
 */

const FLOOR = 'M0,86 L100,86 L100,100 L0,100 Z';
const GROUND = 84;

/* ------------------------------------------------------------------ */
/* Equipment                                                           */
/* ------------------------------------------------------------------ */

/** Plate radius by load: a working weight, a bodyweight standard, an elite one. */
const LOAD = { light: 6, working: 7.5, heavy: 9, elite: 10.5 } as const;

const plate = (at: Pt, r: number = LOAD.working): Disc => ({ at, r, tone: 'body', kind: 'plate' });
const dumbbell = (at: Pt): Disc => ({ at, r: 3.6, tone: 'body', kind: 'plate' });
const kettlebell = (at: Pt): Disc => ({ at, r: 4.2, tone: 'body', kind: 'plate' });
const cable = (from: Pt, to: Pt): Stroke => ({ pts: [from, to], width: 0.9, tone: 'gear' });
const bar = (from: Pt, to: Pt): Stroke => ({ pts: [from, to], width: 1.8, tone: 'gear' });

/** A figure with its equipment: gear lines go behind it, plates in front. */
const kit = (person: Drawn, discs: Disc[] = [], strokes: Stroke[] = []): Drawn => ({
  strokes: [...strokes, ...person.strokes],
  discs: [...person.discs, ...discs],
});

const side = (pose: Omit<Pose, 'turn'>): Pose => ({ ...pose, turn: 1 });
const behind = (p: Pt, dx = -1.5, dy = 0): Pt => [p[0] + dx, p[1] + dy];
const PUSH: Part[] = ['lArm', 'rArm', 'torso'];
const ARMS: Part[] = ['lArm', 'rArm'];
const LEGS: Part[] = ['lLeg', 'rLeg'];

interface Lift {
  scene: Scene;
  wall?: string;
  holds?: FigureSpec['holds'];
  start: Drawn;
  end: Drawn;
  seconds?: number;
  tempo?: 'even' | 'slow-return';
  labels?: FigureSpec['labels'];
}

const lift = ({ start, end, seconds = 2.6, tempo, ...scene }: Lift): FigureSpec =>
  figure({ ...scene, people: [start], motion: { people: [end], seconds, tempo } });

/* ------------------------------------------------------------------ */
/* Presses                                                             */
/* ------------------------------------------------------------------ */

/** A rigid plank pivoting on the toes. */
function pushUp(): FigureSpec {
  const feet: Pt = [17, GROUND];
  const hands: Pt = [64, GROUND];
  const pose = (neck: Pt) =>
    climber(
      side({ neck, pelvis: pelvisToward(neck, feet), lHand: hands, rHand: behind(hands), lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: 'up', rArm: 'up' } }),
      PUSH,
    );
  return lift({ scene: 'floor', wall: FLOOR, start: pose([63.3, 61.5]), end: pose([67.9, 76]), seconds: 2.4 });
}

const FLAT_BENCH = `M18,64 L64,64 L64,69 L18,69 Z M22,69 L25,69 L25,86 L22,86 Z M56,69 L59,69 L59,86 L56,86 Z ${FLOOR}`;

/** Lying on a flat bench, pressing from the chest to straight arms. */
function benchPress(load: Disc['r'] | 'dumbbells', focus: Part[] = PUSH): FigureSpec {
  const neck: Pt = [30, 61.5];
  const pelvis: Pt = [52, 61.5];
  const pose = (hands: Pt) => {
    const person = climber(
      side({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: [70, GROUND], rFoot: [72, GROUND], bend: { lArm: 'down', rArm: 'down', lLeg: 'up', rLeg: 'up' } }),
      focus,
    );
    return kit(person, [load === 'dumbbells' ? dumbbell(hands) : plate(hands, load)]);
  };
  return lift({ scene: 'floor', wall: FLAT_BENCH, start: pose([31, 40]), end: pose([35, 55]) });
}

function inclinePress(load: number | 'dumbbells'): FigureSpec {
  const pelvis: Pt = [52, 63.5];
  const neck = pelvisToward(pelvis, [30, 49]);
  const pose = (hands: Pt) =>
    kit(
      climber(side({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: [72, GROUND], rFoot: [74, GROUND], bend: { lArm: 'down', rArm: 'down', lLeg: 'up', rLeg: 'up' } }), PUSH),
      [load === 'dumbbells' ? dumbbell(hands) : plate(hands, load)],
    );
  return lift({
    scene: 'floor',
    wall: `M26,53 L30,47 L54,62 L50,68 Z M50,64.5 L66,64.5 L66,69 L50,69 Z M56,69 L59,69 L59,86 L56,86 Z ${FLOOR}`,
    start: pose([36, 29]),
    end: pose([40, 44]),
  });
}

/** Standing (barbell) or seated (dumbbells) overhead press. */
function overheadPress(variant: 'standing' | 'seated', load: number = LOAD.working): FigureSpec {
  if (variant === 'seated') {
    const pelvis: Pt = [45, 67];
    const neck: Pt = [45, 45];
    const pose = (hands: Pt) =>
      kit(
        climber(
          side({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: [60, GROUND], rFoot: [61.5, GROUND], joints: { lLeg: [59, 67], rLeg: [60, 68] }, bend: { lArm: 'down', rArm: 'down' } }),
          PUSH,
        ),
        [dumbbell(hands)],
      );
    return lift({
      scene: 'floor',
      wall: `M34,69 L58,69 L58,73 L34,73 Z M34,34 L38,34 L38,69 L34,69 Z M44,73 L47,73 L47,86 L44,86 Z ${FLOOR}`,
      start: pose([50, 45]),
      end: pose([46, 23]),
    });
  }
  const feet: Pt = [50, GROUND];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [50, 33], pelvis: [50, 55], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'down', rArm: 'down' } }),
        PUSH,
      ),
      [plate(hands, load)],
    );
  return lift({ scene: 'floor', wall: FLOOR, start: pose([55, 32]), end: pose([51, 11]) });
}

/** Cable stack on the right with a pulley at `pulley`. */
const stackRight = (pulley: Pt) => ({
  wall: `M84,${Math.min(pulley[1] - 4, 60)} L95,${Math.min(pulley[1] - 4, 60)} L95,86 L84,86 Z ${FLOOR}`,
  holds: [hold(pulley[0], pulley[1], 'bar' as const)],
});

function tricepPushdown(): FigureSpec {
  const pulley: Pt = [83, 8];
  const feet: Pt = [46, GROUND];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [47, 33], pelvis: [46, 55], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], joints: { lArm: [50, 46], rArm: [49, 46.5] } }),
        ARMS,
      ),
      [],
      [cable(pulley, hands)],
    );
  return lift({ scene: 'floor', ...stackRight(pulley), start: pose([61, 39]), end: pose([55, 57]), seconds: 2.2 });
}

function overheadExtension(): FigureSpec {
  const pulley: Pt = [17, 42];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [54, 34], pelvis: [50, 56], lHand: hands, rHand: behind(hands, 1), lFoot: [60, GROUND], rFoot: [40, GROUND], lToe: [1, 0], rToe: [1, -0.2], joints: { lArm: [59, 23], rArm: [58, 23.5] } }),
        ARMS,
      ),
      [],
      [cable(pulley, hands)],
    );
  return lift({
    scene: 'floor',
    wall: `M5,36 L16,36 L16,86 L5,86 Z ${FLOOR}`,
    holds: [hold(pulley[0], pulley[1], 'bar')],
    start: pose([49, 27]),
    end: pose([67, 13]),
    seconds: 2.4,
  });
}

function lateralRaise(): FigureSpec {
  const pulley: Pt = [80, 80];
  const pose = (hand: Pt) =>
    kit(climber({ neck: [50, 34], pelvis: [50, 56], lHand: hand, rHand: [58, 57], lFoot: [45, GROUND], rFoot: [55, GROUND] }, ['lArm']), [], [cable(pulley, hand)]);
  return lift({
    scene: 'floor',
    wall: `M77,72 L86,72 L86,86 L77,86 Z ${FLOOR}`,
    holds: [hold(pulley[0], pulley[1], 'bar')],
    start: pose([41, 57]),
    end: pose([22, 34]),
    seconds: 2.4,
  });
}

/* ------------------------------------------------------------------ */
/* Pulls                                                               */
/* ------------------------------------------------------------------ */

function cableRow(): FigureSpec {
  const pulley: Pt = [84, 61];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [42, 43.5], pelvis: [40, 65.5], lHand: hands, rHand: behind(hands, 1), lFoot: [65, 66], rFoot: [66, 67.5], lToe: [0.2, -1], rToe: [0.2, -1], bend: { lArm: 'left', rArm: 'left', lLeg: 'up', rLeg: 'up' } }),
        ['lArm', 'rArm', 'torso'],
      ),
      [],
      [cable(pulley, hands)],
    );
  return lift({
    scene: 'floor',
    wall: `M26,68 L50,68 L50,72 L26,72 Z M36,72 L39,72 L39,86 L36,86 Z M67,60 L71,60 L71,86 L67,86 Z M84,22 L95,22 L95,86 L84,86 Z ${FLOOR}`,
    holds: [hold(pulley[0], pulley[1], 'bar')],
    start: pose([63, 58]),
    end: pose([52, 58]),
  });
}

/** Bent-over barbell row; `fromFloor` resets the bar on the floor each rep (Pendlay). */
function barbellRow(load: number, fromFloor = false): FigureSpec {
  const feet: Pt = [50, GROUND];
  const pelvis: Pt = fromFloor ? [40, 60] : [42, 56];
  const neck: Pt = fromFloor ? [61, 57] : [62.5, 49];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'up', rArm: 'up', lLeg: 'right', rLeg: 'right' } }),
        ['lArm', 'rArm', 'torso'],
      ),
      [plate(hands, load)],
    );
  return fromFloor
    ? lift({ scene: 'floor', wall: FLOOR, start: pose([62, 86 - load]), end: pose([55, 66]), seconds: 2.2 })
    : lift({ scene: 'floor', wall: FLOOR, start: pose([63, 71]), end: pose([55, 60]) });
}

function latPulldown(): FigureSpec {
  const pose = (y: number) => {
    const l: Pt = [36, y];
    const r: Pt = [64, y];
    return kit(
      climber(
        { neck: [50, 41], pelvis: [50, 63], lHand: l, rHand: r, lFoot: [43, GROUND], rFoot: [57, GROUND], joints: { lLeg: [43, 70], rLeg: [57, 70] }, bend: { lArm: 'down', rArm: 'down' } },
        ['lArm', 'rArm', 'torso'],
      ),
      [],
      [cable([50, 2], [50, y]), bar([30, y], [70, y])],
    );
  };
  return lift({ scene: 'floor', wall: `M34,66 L66,66 L66,70 L34,70 Z M48,70 L52,70 L52,86 L48,86 Z ${FLOOR}`, start: pose(19), end: pose(39) });
}

/** Front view on a bar; optional plate hanging from a dip belt. */
function pullUp(beltPlate?: number): FigureSpec {
  const pose = (neck: Pt, feet: number) => {
    const pelvis: Pt = [neck[0], neck[1] + 22];
    const person = climber(
      { neck, pelvis, lHand: [40, 14], rHand: [60, 14], lFoot: [47, feet], rFoot: [53, feet], bend: { lArm: 'down', rArm: 'down', lLeg: 'in', rLeg: 'in' } },
      ['lArm', 'rArm'],
    );
    if (!beltPlate) return person;
    const weight: Pt = [50, pelvis[1] + 12];
    return kit(person, [plate(weight, beltPlate)], [cable([46, pelvis[1]], weight), cable([54, pelvis[1]], weight)]);
  };
  return lift({
    scene: 'bar',
    wall: 'M10,12.6 L90,12.6 L90,15.4 L10,15.4 Z',
    start: pose([50, 36.5], 86),
    end: pose([50, 18], 67.5),
    seconds: beltPlate ? 2.8 : 2.4,
  });
}

function facePull(): FigureSpec {
  const pulley: Pt = [84, 30];
  const feet: Pt = [46, GROUND];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [46, 33], pelvis: [46, 55], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'up', rArm: 'up' } }),
        ['lArm', 'rArm', 'torso'],
      ),
      [],
      [cable(pulley, hands)],
    );
  return lift({ scene: 'floor', ...stackRight(pulley), start: pose([67, 32]), end: pose([53, 25]), seconds: 2.2 });
}

function reversePecDeck(inwards = false): FigureSpec {
  // Seen from behind: arms straight out in front (short), then swept wide.
  const pose = (spread: number) => {
    const l: Pt = [50 - spread, 36];
    const r: Pt = [50 + spread, 36];
    return climber(
      {
        neck: [50, 36],
        pelvis: [50, 58],
        lHand: l,
        rHand: r,
        lFoot: [43, GROUND],
        rFoot: [57, GROUND],
        joints: { lArm: [(43.5 + l[0]) / 2, 36], rArm: [(56.5 + r[0]) / 2, 36], lLeg: [43, 66], rLeg: [57, 66] },
      },
      ['lArm', 'rArm'],
    );
  };
  return lift({
    scene: 'floor',
    wall: `M36,60 L64,60 L64,64 L36,64 Z M48,64 L52,64 L52,86 L48,86 Z ${FLOOR}`,
    start: pose(inwards ? 28 : 4),
    end: pose(inwards ? 5 : 28),
    seconds: 2.4,
  });
}

/** Standing curl, elbows pinned: cable from a low pulley, or dumbbells. */
function curl(kind: 'cable' | 'dumbbell' | 'barbell'): FigureSpec {
  const pulley: Pt = [83, 80];
  const feet: Pt = [48, GROUND];
  const pose = (hands: Pt) => {
    const person = climber(
      side({ neck: [48, 33], pelvis: [48, 55], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], joints: { lArm: [50, 46], rArm: [49, 46.5] } }),
      ARMS,
    );
    if (kind === 'cable') return kit(person, [], [cable(pulley, hands)]);
    return kit(person, [kind === 'barbell' ? plate(hands, LOAD.light) : dumbbell(hands)]);
  };
  return lift({
    scene: 'floor',
    wall: kind === 'cable' ? `M82,66 L94,66 L94,86 L82,86 Z ${FLOOR}` : FLOOR,
    holds: kind === 'cable' ? [hold(pulley[0], pulley[1], 'bar')] : undefined,
    start: pose([54, 57]),
    end: pose([58, 36]),
    seconds: 2.2,
  });
}

/* ------------------------------------------------------------------ */
/* Legs                                                                */
/* ------------------------------------------------------------------ */

type SquatLoad = { kind: 'back' | 'front'; r: number } | { kind: 'goblet' };

/** With `box`, the squat sits back onto a box set at parallel. */
function squat(load: SquatLoad, { box = false }: { box?: boolean } = {}): FigureSpec {
  const feet: Pt = [48, GROUND];
  const pose = (pelvis: Pt, neck: Pt) => {
    const hands: Pt =
      load.kind === 'back' ? [neck[0] - 2, neck[1] + 1] : load.kind === 'front' ? [neck[0] + 5, neck[1] + 0.5] : [neck[0] + 6, neck[1] + 8];
    const discs = load.kind === 'goblet' ? [dumbbell(hands)] : [plate(load.kind === 'back' ? [neck[0] - 3, neck[1] - 1] : [neck[0] + 5, neck[1] - 1], load.r)];
    return kit(
      climber(
        side({
          neck,
          pelvis,
          lHand: hands,
          rHand: behind(hands, 1),
          lFoot: feet,
          rFoot: behind(feet, 1.5),
          lToe: [1, 0],
          rToe: [1, 0],
          bend: { lArm: load.kind === 'front' ? 'right' : 'down', rArm: load.kind === 'front' ? 'right' : 'down', lLeg: 'right', rLeg: 'right' },
        }),
        LEGS,
      ),
      discs,
    );
  };
  // The box sits under the hips at the bottom, so the athlete touches down on it.
  const wall = box ? `M20,71 L41,71 L41,86 L20,86 Z ${FLOOR}` : FLOOR;
  return lift({ scene: 'floor', wall, start: pose([47, 55], [48, 33]), end: pose([36, 68], [47.7, 49.3]), seconds: 2.8 });
}

/** Conventional deadlift from the floor, or a Romanian deadlift from the top. */
function hinge(kind: 'deadlift' | 'kettlebell' | 'romanian', r: number = LOAD.working): FigureSpec {
  const feet: Pt = [50, GROUND];
  const weight = (hands: Pt) => (kind === 'kettlebell' ? kettlebell(hands) : plate(hands, r));
  const pose = (pelvis: Pt, neck: Pt, hands: Pt) =>
    kit(
      climber(
        side({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lLeg: 'right', rLeg: 'right' } }),
        ['torso', 'lLeg', 'rLeg'],
      ),
      [weight(hands)],
    );
  const top = pose([48, 55], [49, 33], [51, 55.5]);
  if (kind === 'romanian') return lift({ scene: 'floor', wall: FLOOR, start: top, end: pose([40, 56], [60, 51], [60, 70]), seconds: 3 });
  const floorY = kind === 'kettlebell' ? 86 - 4.2 : 86 - r;
  return lift({ scene: 'floor', wall: FLOOR, start: pose([40, 60], [60, 56], [58, floorY]), end: top, seconds: 2.8 });
}

function legCurl(): FigureSpec {
  const pose = (foot: Pt) =>
    climber(
      side({ neck: [40, 34], pelvis: [40, 56], lHand: [50, 58], rHand: [49, 58.5], lFoot: foot, rFoot: behind(foot, 1), joints: { lLeg: [55, 56], rLeg: [54, 56.5] }, bend: { lArm: 'down', rArm: 'down' } }),
      LEGS,
    );
  return lift({
    scene: 'floor',
    wall: `M28,58.5 L52,58.5 L52,62.5 L28,62.5 Z M28,30 L32,30 L32,58.5 L28,58.5 Z M39,62.5 L42,62.5 L42,86 L39,86 Z ${FLOOR}`,
    start: pose([69, 60]),
    end: pose([51, 70]),
    seconds: 2.4,
  });
}

/** Walking lunge with dumbbells at the sides. */
function lunge(): FigureSpec {
  const front: Pt = [64, GROUND];
  const back: Pt = [27, GROUND];
  const pose = (pelvis: Pt) => {
    const hands: Pt = [pelvis[0] + 2, pelvis[1] + 2];
    return kit(
      climber(
        side({ neck: [pelvis[0], pelvis[1] - 22], pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: front, rFoot: back, lToe: [1, 0], rToe: [1, -0.25], bend: { lLeg: 'up', rLeg: 'down' } }),
        LEGS,
      ),
      [dumbbell([hands[0], hands[1] + 1])],
    );
  };
  return lift({ scene: 'floor', wall: FLOOR, start: pose([46, 61]), end: pose([45, 70]) });
}

function splitSquat(): FigureSpec {
  const front: Pt = [60, GROUND];
  const back: Pt = [24, 62.5];
  const pose = (pelvis: Pt) => {
    const hands: Pt = [pelvis[0] + 2, pelvis[1] + 2];
    return kit(
      climber(
        side({ neck: [pelvis[0] + 1, pelvis[1] - 22], pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: front, rFoot: back, lToe: [1, 0], rToe: [-1, 0.3], bend: { lLeg: 'up', rLeg: 'down' } }),
        LEGS,
      ),
      [dumbbell([hands[0], hands[1] + 1])],
    );
  };
  return lift({ scene: 'floor', wall: `M6,64 L30,64 L30,68 L6,68 Z M10,68 L13,68 L13,86 L10,86 Z M24,68 L27,68 L27,86 L24,86 Z ${FLOOR}`, start: pose([45, 58]), end: pose([43, 68]) });
}

function calfRaise(): FigureSpec {
  const toe: Pt = [51, 79.5];
  const pose = (rise: number) => {
    const ankle: Pt = rise ? [47.5, 75] : [46.5, 81];
    const dir: Pt = [toe[0] - ankle[0], toe[1] - ankle[1]];
    return climber(
      side({ neck: [47, 52 - rise - 22], pelvis: [47, 52 - rise], lHand: [49, 74 - rise], rHand: [48, 74.5 - rise], lFoot: ankle, rFoot: behind(ankle, 1), lToe: dir, rToe: dir }),
      LEGS,
    );
  };
  return lift({ scene: 'floor', wall: `M44,80 L66,80 L66,86 L44,86 Z ${FLOOR}`, start: pose(0), end: pose(5), seconds: 2 });
}

/* ------------------------------------------------------------------ */
/* Core & grip                                                         */
/* ------------------------------------------------------------------ */

function plank(): FigureSpec {
  const feet: Pt = [16, GROUND];
  const neck: Pt = [62, 74];
  return figure({
    scene: 'floor',
    wall: FLOOR,
    people: [
      climber(
        side({ neck, pelvis: pelvisToward(neck, feet), lHand: [73, GROUND], rHand: [72, GROUND], lFoot: feet, rFoot: behind(feet, 1.5), joints: { lArm: [62, GROUND], rArm: [61, GROUND] } }),
        ['torso', 'lLeg', 'rLeg'],
      ),
    ],
    arrows: [{ d: 'M16,70 L66,58', kind: 'guide' }],
  });
}

function cableCrunch(): FigureSpec {
  const pulley: Pt = [83, 8];
  const pose = (neck: Pt, hands: Pt) =>
    kit(
      climber(
        side({ neck, pelvis: [49, 69], lHand: hands, rHand: behind(hands, 1), lFoot: [35, GROUND], rFoot: [34, GROUND], joints: { lLeg: [50, GROUND], rLeg: [49, GROUND] }, bend: { lArm: 'down', rArm: 'down' } }),
        ['torso'],
      ),
      [],
      [cable(pulley, hands)],
    );
  return lift({ scene: 'floor', ...stackRight(pulley), start: pose([57, 48], [61, 44]), end: pose([69, 62], [71, 57]), seconds: 2.4 });
}

/**
 * Captain's chair: back on the backrest, forearms on the pads, hands on the
 * grips, the legs hanging free; the knees lift to the chest.
 */
function captainsChair(): FigureSpec {
  const chair = [
    'M40.5,20 L43.5,20 L43.5,58 L40.5,58 Z', // backrest
    'M45,39.6 L65,39.6 L65,42.4 L45,42.4 Z', // forearm pad
    'M62,42.4 L64.6,42.4 L64.6,86 L62,86 Z', // front upright
    'M40.5,58 L43.1,58 L43.1,86 L40.5,86 Z', // back upright
  ].join(' ');
  const pose = (lFoot: Pt, knee?: Pt) =>
    climber(
      side({
        neck: [47.5, 26],
        pelvis: [47.5, 48],
        lHand: [60, 37.6],
        rHand: [58.5, 37.6],
        lFoot,
        rFoot: behind(lFoot, -1.5, 1),
        joints: { lArm: [48.5, 37.6], rArm: [47, 37.6], ...(knee ? { lLeg: knee, rLeg: behind(knee) } : {}) },
      }),
      ['torso', 'lLeg', 'rLeg'],
    );
  return lift({ scene: 'floor', wall: `${chair} ${FLOOR}`, start: pose([48.5, 77]), end: pose([58, 58], [60.5, 44.5]), seconds: 2.6 });
}

/**
 * Hack squat: back and shoulders against the sled's pad, which rides a rail
 * set at an angle; the athlete squats down the rail.
 */
function hackSquat(): FigureSpec {
  const rail: Pt = [0.356, -0.935];
  const back: Pt = [-0.935, -0.356];
  const along = (p: Pt, t: number, off = 0): Pt => [p[0] + rail[0] * t + back[0] * off, p[1] + rail[1] * t + back[1] * off];
  const feet: Pt = [53, GROUND];
  const pose = (pelvis: Pt) => {
    const neck = along(pelvis, 22);
    const hands: Pt = [neck[0] + 2.5, neck[1] + 2.5];
    // The pad slides with the athlete, just behind the back.
    const pad = bar(along(pelvis, -1, 3.6), along(pelvis, 23, 3.6));
    return kit(
      climber(
        side({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'down', rArm: 'down', lLeg: 'right', rLeg: 'right' } }),
        LEGS,
      ),
      [],
      [bar(along([42, 57], -32, 6), along([42, 57], 42, 6)), { ...pad, width: 3.6 }],
    );
  };
  return lift({ scene: 'floor', wall: FLOOR, start: pose([42, 57]), end: pose(along([42, 57], -13)), seconds: 2.8 });
}

function hangingLegRaise(): FigureSpec {
  const pose = (feet: Pt) =>
    climber(side({ neck: [50, 33], pelvis: [50, 55], lHand: [50, 11.5], rHand: [49, 11.5], lFoot: feet, rFoot: behind(feet, 0, 1.5) }), ['torso', 'lLeg', 'rLeg']);
  return lift({ scene: 'bar', holds: [hold(50, 10, 'bar')], start: pose([50, 84]), end: pose([79, 56]), seconds: 2.6 });
}

function abWheel(): FigureSpec {
  const pose = (pelvis: Pt, neck: Pt, hands: Pt) =>
    kit(
      climber(
        side({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: [22, GROUND], rFoot: [21, GROUND], joints: { lLeg: [36, GROUND], rLeg: [35, GROUND] } }),
        ['torso', 'lArm', 'rArm'],
      ),
      [{ at: [hands[0], 82], r: 4, tone: 'body', kind: 'plate' }],
    );
  return lift({ scene: 'floor', wall: FLOOR, start: pose([38, 69], [55, 57], [57, 79]), end: pose([49, 76.5], [70.3, 71], [90, 79]), seconds: 3 });
}

function wristCurl(): FigureSpec {
  // Close-up: forearm resting on a bench, the hand lifting a dumbbell.
  const pose = (hand: Pt): Drawn => ({
    strokes: [
      { pts: [[14, 53], [54, 53]], width: 8, tone: 'body' },
      { pts: [[54, 53], hand], width: 6.5, tone: 'focus' },
    ],
    discs: [{ ...dumbbell(hand), r: 5 }],
  });
  return lift({ scene: 'close-up', wall: 'M8,58 L62,58 L62,66 L8,66 Z M14,66 L18,66 L18,100 L14,100 Z M52,66 L56,66 L56,100 L52,100 Z', start: pose([60, 63]), end: pose([61, 42]), seconds: 2.4 });
}

function farmersCarry(r: number): FigureSpec {
  const pose = (front: Pt, back: Pt) => {
    const hands: Pt = [49, 57.5];
    return kit(
      climber(side({ neck: [48, 35], pelvis: [48, 57], lHand: hands, rHand: behind(hands, 1), lFoot: front, rFoot: back, lToe: [1, 0], rToe: [1, 0] }), ['lArm', 'rArm', 'torso']),
      [{ ...dumbbell([hands[0], hands[1] + 2]), r }],
    );
  };
  return lift({ scene: 'floor', wall: FLOOR, start: pose([60, GROUND], [37, GROUND]), end: pose([37, GROUND], [60, GROUND]), seconds: 1.8 });
}


/* ------------------------------------------------------------------ */
/* Machines, and the bodybuilding lifts around them                    */
/* ------------------------------------------------------------------ */

/** A seat with a back pad, facing right: the frame most machines share. */
const SEAT = 'M30,69 L54,69 L54,73 L30,73 Z M30,36 L34,36 L34,69 L30,69 Z M40,73 L43,73 L43,86 L40,86 Z';
/** A weight stack on the right. */
const STACK = 'M84,30 L95,30 L95,86 L84,86 Z';
/** A handle: a short upright grip at the hand. */
const grip = (at: Pt): Stroke => bar([at[0], at[1] - 3], [at[0], at[1] + 3]);
const along = (from: Pt, dir: Pt, k: number): Pt => [from[0] + dir[0] * k, from[1] + dir[1] * k];

/** Seated, pressing two handles straight forwards from the chest. */
function chestPress(): FigureSpec {
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [41, 46], pelvis: [41, 68], lHand: hands, rHand: behind(hands, 1), lFoot: [57, GROUND], rFoot: [58.5, GROUND], joints: { lLeg: [56, 68], rLeg: [57, 69] }, bend: { lArm: 'down', rArm: 'down' } }),
        PUSH,
      ),
      [],
      [grip(hands), bar(hands, [84, hands[1]])],
    );
  return lift({ scene: 'floor', wall: `${SEAT} ${STACK} ${FLOOR}`, start: pose([51, 51]), end: pose([62, 50]) });
}

/** Seated, pushing two handles at the sides down until the arms are straight. */
function seatedDip(): FigureSpec {
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [41, 46], pelvis: [41, 68], lHand: hands, rHand: behind(hands, 1), lFoot: [57, GROUND], rFoot: [58.5, GROUND], joints: { lLeg: [56, 68], rLeg: [57, 69] }, bend: { lArm: 'left', rArm: 'left' } }),
        ARMS,
      ),
      [],
      [grip(hands), bar(hands, [hands[0] + 16, hands[1]])],
    );
  return lift({ scene: 'floor', wall: `${SEAT} ${FLOOR}`, start: pose([46, 50]), end: pose([45, 66]), seconds: 2.2 });
}

/** Front view between two high pulleys, sweeping the hands down and together. */
function cableFly(): FigureSpec {
  const pose = (l: Pt, r: Pt) =>
    kit(
      climber({ neck: [50, 34], pelvis: [50, 56], lHand: l, rHand: r, lFoot: [44, GROUND], rFoot: [56, GROUND], bend: { lArm: 'down', rArm: 'down' } }, ['lArm', 'rArm', 'torso']),
      [],
      [cable([10, 12], l), cable([90, 12], r)],
    );
  return lift({
    scene: 'floor',
    wall: `M2,8 L10,8 L10,86 L2,86 Z M90,8 L98,8 L98,86 L90,86 Z ${FLOOR}`,
    holds: [hold(10, 12, 'bar'), hold(90, 12, 'bar')],
    start: pose([26, 28], [74, 28]),
    end: pose([47, 54], [53, 54]),
    seconds: 2.6,
  });
}

/** Lying on a flat bench, bending only at the elbows to bring the bar behind the forehead. */
function skullCrusher(): FigureSpec {
  const neck: Pt = [30, 61.5];
  const elbow: Pt = [27, 48.5];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck, pelvis: [52, 61.5], lHand: hands, rHand: behind(hands, 1), lFoot: [70, GROUND], rFoot: [72, GROUND], joints: { lArm: elbow, rArm: behind(elbow, 1) }, bend: { lLeg: 'up', rLeg: 'up' } }),
        ARMS,
      ),
      [plate(hands, LOAD.light)],
    );
  return lift({ scene: 'floor', wall: FLAT_BENCH, start: pose([24.3, 37.8]), end: pose([18.5, 55.5]), seconds: 2.4 });
}

/** One knee and hand on a bench, rowing a dumbbell to the hip. */
function dumbbellRow(): FigureSpec {
  const pose = (hand: Pt) =>
    kit(
      climber(
        side({ neck: [60, 57], pelvis: [38, 57], lHand: hand, rHand: [70, 63.5], lFoot: [43, GROUND], rFoot: [24, 62.5], lToe: [1, 0], rToe: [-1, 0], joints: { rLeg: [37, 63] }, bend: { lArm: 'up', rArm: 'left', lLeg: 'right' } }),
        ['lArm', 'torso'],
      ),
      [dumbbell(hand)],
    );
  return lift({
    scene: 'floor',
    wall: `M18,64.5 L74,64.5 L74,69 L18,69 Z M22,69 L25,69 L25,86 L22,86 Z M67,69 L70,69 L70,86 L67,86 Z ${FLOOR}`,
    start: pose([60, 78]),
    end: pose([47, 63]),
    seconds: 2.2,
  });
}

/** Front view: shoulders drawn up towards the ears, dumbbells rising with them. */
function shrug(): FigureSpec {
  const pose = (neck: number) =>
    kit(
      climber({ neck: [50, neck], pelvis: [50, 56], head: [50, 27.6], lHand: [41.5, neck + 23.5], rHand: [58.5, neck + 23.5], lFoot: [45, GROUND], rFoot: [55, GROUND] }, ['torso', 'head']),
      [dumbbell([41.5, neck + 25.5]), dumbbell([58.5, neck + 25.5])],
    );
  return lift({ scene: 'floor', wall: FLOOR, start: pose(34.5), end: pose(31.5), seconds: 2 });
}

/** Facing a high pulley, arms straight, sweeping the bar from head height to the thighs. */
function straightArmPulldown(): FigureSpec {
  const pulley: Pt = [83, 8];
  const feet: Pt = [44, GROUND];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [52, 35], pelvis: [44, 56], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'up', rArm: 'up' } }),
        ['lArm', 'rArm', 'torso'],
      ),
      [],
      [cable(pulley, hands)],
    );
  return lift({ scene: 'floor', ...stackRight(pulley), start: pose([70, 23]), end: pose([57, 54]), seconds: 2.4 });
}

/** Seated, upper arms braced on a sloped pad, curling the handle up. */
function preacherCurl(): FigureSpec {
  const elbow: Pt = [57, 55];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [48, 46], pelvis: [40, 67], lHand: hands, rHand: behind(hands, 1), lFoot: [56, GROUND], rFoot: [57.5, GROUND], joints: { lArm: elbow, rArm: behind(elbow, 1), lLeg: [55, 68], rLeg: [56, 69] } }),
        ARMS,
      ),
      [],
      [grip(hands)],
    );
  return lift({
    scene: 'floor',
    wall: `M49,52 L52,48.5 L66,58.5 L63,62 Z M60,61 L63,61 L63,86 L60,86 Z M28,69 L50,69 L50,73 L28,73 Z M37,73 L40,73 L40,86 L37,86 Z ${FLOOR}`,
    start: pose([66, 61.5]),
    end: pose([55, 44.5]),
    seconds: 2.2,
  });
}

/** Leaning back on a 45° seat, pressing the sled up and away with both feet. */
function legPress(r: number = LOAD.working): FigureSpec {
  const pelvis: Pt = [38, 70];
  const across: Pt = [0.7, 0.7];
  const pose = (feet: Pt) =>
    kit(
      climber(
        side({ neck: [23, 54], pelvis, lHand: [44, 73], rHand: [45, 73.5], lFoot: feet, rFoot: behind(feet, 1, 1), bend: { lLeg: 'up', rLeg: 'up' } }),
        LEGS,
      ),
      [plate([feet[0] + 7, feet[1] - 5], r)],
      [bar(along(feet, across, -6), along(feet, across, 6))],
    );
  return lift({
    scene: 'floor',
    wall: `M14,56 L18,52 L38,74 L34,78 Z M30,76 L52,76 L52,80 L30,80 Z M40,80 L43,80 L43,86 L40,86 Z M56,80 L90,38 L92,40 L58,82 Z ${FLOOR}`,
    start: pose([50, 60]),
    end: pose([60, 50]),
    seconds: 2.8,
  });
}

/** Seated, straightening the knees against a roller on the shins. */
function legExtension(): FigureSpec {
  const knee: Pt = [55, 66];
  const pose = (foot: Pt) =>
    kit(
      climber(
        side({ neck: [40, 44], pelvis: [40, 66], lHand: [50, 68], rHand: [49, 68.5], lFoot: foot, rFoot: behind(foot, 1), joints: { lLeg: knee, rLeg: behind(knee, 1) }, bend: { lArm: 'down', rArm: 'down' } }),
        LEGS,
      ),
      [{ ...dumbbell([foot[0] + 1.5, foot[1] + 2]), r: 2.6 }],
    );
  return lift({
    scene: 'floor',
    wall: `M28,68.5 L58,68.5 L58,72.5 L28,72.5 Z M28,40 L32,40 L32,68.5 L28,68.5 Z M39,72.5 L42,72.5 L42,86 L39,86 Z ${FLOOR}`,
    start: pose([53.5, 80.5]),
    end: pose([69.3, 63.5]),
    seconds: 2.4,
  });
}

/** Front view, seated: knees pushed apart against pads (abduction) or squeezed together (adduction). */
function hipMachine(outwards: boolean): FigureSpec {
  const pose = (spread: number) => {
    const lKnee: Pt = [50 - spread, 70];
    const rKnee: Pt = [50 + spread, 70];
    const pad = (knee: Pt, side: number): Pt => [knee[0] + side * (outwards ? 3.5 : -3.5), knee[1]];
    return kit(
      climber({ neck: [50, 42], pelvis: [50, 64], lHand: [40, 66], rHand: [60, 66], lFoot: [50 - spread * 0.7, GROUND], rFoot: [50 + spread * 0.7, GROUND], joints: { lLeg: lKnee, rLeg: rKnee } }, LEGS),
      [{ ...dumbbell(pad(lKnee, -1)), r: 2.8 }, { ...dumbbell(pad(rKnee, 1)), r: 2.8 }],
    );
  };
  return lift({
    scene: 'floor',
    wall: `M34,66 L66,66 L66,69 L34,69 Z M38,36 L62,36 L62,40 L38,40 Z ${FLOOR}`,
    start: pose(outwards ? 6 : 15),
    end: pose(outwards ? 15 : 6),
    seconds: 2.2,
  });
}

/** Seated, knees bent under a pad, rising onto the toes. */
function seatedCalfRaise(): FigureSpec {
  const toe: Pt = [60, 79.5];
  const pose = (rise: number) => {
    const ankle: Pt = rise ? [56.5, 75.5] : [55.5, 81];
    const knee: Pt = [56, 66 - rise];
    const dir: Pt = [toe[0] - ankle[0], toe[1] - ankle[1]];
    return kit(
      climber(
        side({ neck: [40, 44], pelvis: [40, 66], lHand: [52, 64 - rise], rHand: [51, 64.5 - rise], lFoot: ankle, rFoot: behind(ankle, 1), lToe: dir, rToe: dir, joints: { lLeg: knee, rLeg: behind(knee, 1) } }),
        LEGS,
      ),
      [],
      [bar([48, 62.5 - rise], [60, 62.5 - rise])],
    );
  };
  return lift({
    scene: 'floor',
    wall: `M28,68.5 L50,68.5 L50,72.5 L28,72.5 Z M37,72.5 L40,72.5 L40,86 L37,86 Z M52,80 L68,80 L68,86 L52,86 Z ${FLOOR}`,
    start: pose(0),
    end: pose(5),
    seconds: 2,
  });
}

/** Holding the frame, kicking one leg straight back against a low cable. */
function gluteKickback(): FigureSpec {
  const pulley: Pt = [83, 82];
  const pose = (foot: Pt) =>
    kit(
      climber(
        side({ neck: [60, 37], pelvis: [47, 55], lHand: [72, 46], rHand: [71, 46.5], lFoot: [50, GROUND], rFoot: foot, lToe: [1, 0], rToe: [0.3, 1], bend: { lArm: 'down', rArm: 'down', lLeg: 'right', rLeg: 'right' } }),
        ['rLeg'],
      ),
      [],
      [cable(pulley, foot)],
    );
  return lift({
    scene: 'floor',
    wall: `M74,30 L78,30 L78,86 L74,86 Z M82,74 L94,74 L94,86 L82,86 Z ${FLOOR}`,
    holds: [hold(pulley[0], pulley[1], 'bar')],
    start: pose([46, 82]),
    end: pose([22, 66]),
    seconds: 2.2,
  });
}

/** On a 45° bench, hinging at the hips over the pad and rising to a straight line. */
function backExtension(r?: number): FigureSpec {
  const pelvis: Pt = [46, 60];
  // Legs straight from the foot plate to the pad.
  const feet: Pt = [25.5, 80.5];
  const pose = (neck: Pt) => {
    const chest: Pt = [neck[0] - (neck[0] - pelvis[0]) * 0.25, neck[1] - (neck[1] - pelvis[1]) * 0.25];
    const person = climber(
      side({ neck, pelvis, lHand: chest, rHand: behind(chest, 1), lFoot: feet, rFoot: behind(feet, 1, 0.5), lToe: [-0.4, 1], rToe: [-0.4, 1] }),
      ['torso', 'lLeg', 'rLeg'],
    );
    return r ? kit(person, [plate(chest, r)]) : person;
  };
  return lift({
    scene: 'floor',
    wall: `M40,62 L48,54 L53,59 L45,67 Z M19,82.5 L31,82.5 L31,85.5 L19,85.5 Z M44,66 L47,66 L47,86 L44,86 Z ${FLOOR}`,
    start: pose([61.5, 44.5]),
    end: pose([57, 79]),
    seconds: 2.8,
  });
}

/** Side-on to a cable at chest height, pressing the handle out and holding it there. */
function pallofPress(): FigureSpec {
  const pulley: Pt = [14, 46];
  const feet: Pt = [48, GROUND];
  const pose = (hands: Pt) =>
    kit(
      climber(
        side({ neck: [48, 34], pelvis: [48, 56], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], joints: { lLeg: [50, 70], rLeg: [49, 70.5] }, bend: { lArm: 'down', rArm: 'down' } }),
        ['torso'],
      ),
      [],
      [cable(pulley, hands)],
    );
  return lift({
    scene: 'floor',
    wall: `M4,40 L14,40 L14,86 L4,86 Z ${FLOOR}`,
    holds: [hold(pulley[0], pulley[1], 'bar')],
    start: pose([55, 45]),
    end: pose([69, 44]),
    seconds: 2.6,
    tempo: 'slow-return',
  });
}

/** Front view: pulling a high cable down and across the body to the far hip. */
function woodchop(): FigureSpec {
  const pulley: Pt = [12, 10];
  const pose = (hands: Pt, lFoot: Pt) =>
    kit(
      climber({ neck: [50, 34], pelvis: [50, 56], lHand: hands, rHand: [hands[0] + 2, hands[1] + 1], lFoot, rFoot: [58, GROUND], bend: { lArm: 'down', rArm: 'down' } }, ['torso', 'lArm', 'rArm']),
      [],
      [cable(pulley, hands)],
    );
  return lift({
    scene: 'floor',
    wall: `M2,6 L12,6 L12,86 L2,86 Z ${FLOOR}`,
    holds: [hold(pulley[0], pulley[1], 'bar')],
    start: pose([38, 22], [42, GROUND]),
    end: pose([56, 51], [43, GROUND]),
    seconds: 2.4,
  });
}

/* ------------------------------------------------------------------ */
/* The figures                                                         */
/* ------------------------------------------------------------------ */

const FIGURES: Record<string, FigureSpec | undefined> = {
  // Push
  gym_pushup: pushUp(),
  gym_db_bench: benchPress('dumbbells'),
  lateral_raise: lateralRaise(),
  tricep_pushdown: tricepPushdown(),
  bench_press: benchPress(LOAD.working),
  db_press: overheadPress('seated'),
  overhead_extension: overheadExtension(),
  incline_bench: inclinePress(LOAD.working),
  gym_bench_bodyweight: benchPress(LOAD.heavy),
  overhead_press: overheadPress('standing'),
  gym_close_grip_bench: benchPress(LOAD.heavy, ['lArm', 'rArm']),
  gym_bench_1_5x: benchPress(LOAD.elite),
  gym_ohp_bodyweight: overheadPress('standing', LOAD.heavy),
  machine_chest_press: chestPress(),
  pec_deck: reversePecDeck(true),
  cable_fly: cableFly(),
  machine_shoulder_press: overheadPress('seated'),
  machine_dip: seatedDip(),
  incline_db_press: inclinePress('dumbbells'),
  skull_crusher: skullCrusher(),
  spoto_press: benchPress(LOAD.working),
  larsen_press: benchPress(LOAD.working, ['torso', 'lArm', 'rArm']),
  push_press: overheadPress('standing', LOAD.heavy),

  // Pull
  cable_row: cableRow(),
  lat_pulldown: latPulldown(),
  face_pulls: facePull(),
  cable_curl: curl('cable'),
  barbell_row: barbellRow(LOAD.working),
  gym_pullup: pullUp(),
  reverse_pec_deck: reversePecDeck(),
  hammer_curl: curl('dumbbell'),
  gym_pendlay_row: barbellRow(LOAD.working, true),
  gym_weighted_pullup: pullUp(LOAD.light),
  gym_row_bodyweight: barbellRow(LOAD.heavy),
  gym_pullup_half_bw: pullUp(LOAD.heavy),
  machine_row: cableRow(),
  db_row: dumbbellRow(),
  db_shrug: shrug(),
  t_bar_row: barbellRow(LOAD.heavy),
  straight_arm_pulldown: straightArmPulldown(),
  machine_preacher_curl: preacherCurl(),
  barbell_curl: curl('barbell'),

  // Legs
  gym_goblet_squat: squat({ kind: 'goblet' }),
  gym_kb_deadlift: hinge('kettlebell'),
  leg_curl: legCurl(),
  walking_lunges: lunge(),
  calf_raises: calfRaise(),
  back_squat: squat({ kind: 'back', r: LOAD.working }),
  deadlift: hinge('deadlift', LOAD.working),
  split_squat: splitSquat(),
  gym_front_squat: squat({ kind: 'front', r: LOAD.working }),
  gym_rdl: hinge('romanian', LOAD.working),
  gym_squat_1_5x: squat({ kind: 'back', r: LOAD.heavy }),
  gym_deadlift_2x: hinge('deadlift', LOAD.heavy),
  gym_squat_2x: squat({ kind: 'back', r: LOAD.elite }),
  gym_deadlift_2_5x: hinge('deadlift', LOAD.elite),
  leg_press: legPress(LOAD.working),
  leg_press_2x: legPress(LOAD.heavy),
  leg_press_3x: legPress(LOAD.elite),
  leg_extension: legExtension(),
  hack_squat: hackSquat(),
  hip_abduction: hipMachine(true),
  hip_adduction: hipMachine(false),
  seated_calf_raise: seatedCalfRaise(),
  glute_kickback: gluteKickback(),
  back_extension: backExtension(),
  weighted_back_extension: backExtension(LOAD.light),
  box_squat: squat({ kind: 'back', r: LOAD.working }, { box: true }),
  pause_squat: squat({ kind: 'back', r: LOAD.heavy }),
  trap_bar_deadlift: hinge('deadlift', LOAD.working),
  sumo_deadlift: hinge('deadlift', LOAD.heavy),
  deficit_deadlift: hinge('deadlift', LOAD.heavy),
  total_4x: hinge('deadlift', LOAD.heavy),
  total_5x: hinge('deadlift', LOAD.elite),

  // Core & grip
  gym_plank: plank(),
  wrist_curls: wristCurl(),
  farmers_carry: farmersCarry(4.2),
  gym_cable_crunch: cableCrunch(),
  gym_hanging_leg_raise: hangingLegRaise(),
  gym_ab_wheel: abWheel(),
  gym_farmers_bodyweight: farmersCarry(6),
  ab_crunch_machine: cableCrunch(),
  captains_chair: captainsChair(),
  pallof_press: pallofPress(),
  cable_woodchop: woodchop(),
};

/* Lifts added when the tree was rebuilt borrow the drawing of the lift below them. */
FIGURES['gym_bench_2x'] = FIGURES['gym_bench_1_5x'];
FIGURES['gym_assisted_pullup'] = FIGURES['lat_pulldown'];
FIGURES['gym_squat_2_5x'] = FIGURES['gym_squat_2x'];
FIGURES['gym_deadlift_3x'] = FIGURES['gym_deadlift_2_5x'];
FIGURES['machine_chest_press_bw'] = FIGURES['machine_chest_press'];
FIGURES['total_6x'] = FIGURES['total_5x'];

export function gymFigure(id: string): FigureSpec | undefined {
  return FIGURES[id];
}

export const GYM_FIGURE_IDS = Object.keys(FIGURES);
