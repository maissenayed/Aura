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

function inclinePress(load: number): FigureSpec {
  const pelvis: Pt = [52, 63.5];
  const neck = pelvisToward(pelvis, [30, 49]);
  const pose = (hands: Pt) =>
    kit(
      climber(side({ neck, pelvis, lHand: hands, rHand: behind(hands, 1), lFoot: [72, GROUND], rFoot: [74, GROUND], bend: { lArm: 'down', rArm: 'down', lLeg: 'up', rLeg: 'up' } }), PUSH),
      [plate(hands, load)],
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

function reversePecDeck(): FigureSpec {
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
  return lift({ scene: 'floor', wall: `M36,60 L64,60 L64,64 L36,64 Z M48,64 L52,64 L52,86 L48,86 Z ${FLOOR}`, start: pose(4), end: pose(28), seconds: 2.4 });
}

/** Standing curl, elbows pinned: cable from a low pulley, or dumbbells. */
function curl(kind: 'cable' | 'dumbbell'): FigureSpec {
  const pulley: Pt = [83, 80];
  const feet: Pt = [48, GROUND];
  const pose = (hands: Pt) => {
    const person = climber(
      side({ neck: [48, 33], pelvis: [48, 55], lHand: hands, rHand: behind(hands, 1), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], joints: { lArm: [50, 46], rArm: [49, 46.5] } }),
      ARMS,
    );
    return kind === 'cable' ? kit(person, [], [cable(pulley, hands)]) : kit(person, [dumbbell(hands)]);
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

function squat(load: SquatLoad): FigureSpec {
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
  return lift({ scene: 'floor', wall: FLOOR, start: pose([47, 55], [48, 33]), end: pose([36, 68], [47.7, 49.3]), seconds: 2.8 });
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

  // Core & grip
  gym_plank: plank(),
  wrist_curls: wristCurl(),
  farmers_carry: farmersCarry(4.2),
  gym_cable_crunch: cableCrunch(),
  gym_hanging_leg_raise: hangingLegRaise(),
  gym_ab_wheel: abWheel(),
  gym_farmers_bodyweight: farmersCarry(6),
};

export function gymFigure(id: string): FigureSpec | undefined {
  return FIGURES[id];
}

export const GYM_FIGURE_IDS = Object.keys(FIGURES);
