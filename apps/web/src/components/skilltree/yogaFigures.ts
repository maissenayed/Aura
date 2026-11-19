import type { FigureSpec, Pt } from './SkillFigure';
import { Drawn, Part, SilhouettePose, add, len, mul, silhouette, sub, unit } from './figureKit';
import { CORE, Clip, FLOOR, G, LEGS, WALL_RIGHT, clip, higher, meet, toward } from './calisthenicsFamilies';
import { patched } from './figureOverrides';

/**
 * One drawing per yoga pose, in the same faceless silhouettes as the other
 * trees (see `figureKit.ts`). Each figure moves from the way into the pose to
 * the pose itself; the card shows the pose, the details panel plays the move.
 *
 * Each builder draws the way in first and the pose second, which reads
 * best; `yogaFigure` turns that round, so the pose is the first frame (what a
 * card or a still figure shows) and it is marked as the held one.
 *
 * Side views face right, with the far arm and leg drawn darker; front views
 * face the viewer, the athlete's left limbs on the left of the picture while
 * the body is upright.
 */

/* ------------------------------------------------------------------ */
/* Measures and helpers                                                */
/* ------------------------------------------------------------------ */

/** A straight leg, a hair short of locked, and a straight arm. */
const LEG = 29.3;
const ARM = 22.2;
const TORSO = 22;
/** Pelvis height of a figure standing tall. */
const STAND = G - LEG;
/** Pelvis height of a figure sitting on the floor. */
const SEAT = 82;
/** Spine height of a figure lying on the floor, and where a resting head sits. */
const FLAT = 81.6;
const HEAD_DOWN = 80.6;

const rad = (deg: number) => (deg * Math.PI) / 180;
/** The point `r` away from `o` at `deg` degrees: 0 is right, 90 down, -90 up. */
const at = (o: Pt, deg: number, r: number): Pt => [o[0] + r * Math.cos(rad(deg)), o[1] + r * Math.sin(rad(deg))];
/** `to`, or the nearest point to it within `max` of `from`, so no bone has to stretch to get there. */
const reach = (from: Pt, to: Pt, max = ARM): Pt => (len(sub(to, from)) <= max ? to : toward(from, to, max));
/** The far limb's end, a little behind the near one. */
const back = (p: Pt, dx = -1.4, dy = 0.6): Pt => [p[0] + dx, p[1] + dy];

/** Where a side view puts the shoulders: just below the neck, along the spine. */
const shoulderOf = (neck: Pt, pelvis: Pt): Pt => add(neck, mul(unit(sub(neck, pelvis)), -1.2));
/** Where a front view puts the left and right shoulders. */
function shouldersOf(neck: Pt, pelvis: Pt): [Pt, Pt] {
  const axis = unit(sub(neck, pelvis));
  const across: Pt = [-axis[1], axis[0]];
  const s = add(neck, mul(axis, -1.2));
  return [sub(s, mul(across, 5.6)), add(s, mul(across, 5.6))];
}
/** Where a front view puts the left and right hip joints. */
function hipsOf(neck: Pt, pelvis: Pt): [Pt, Pt] {
  const axis = unit(sub(neck, pelvis));
  const across: Pt = [-axis[1], axis[0]];
  return [sub(pelvis, mul(across, 3.2)), add(pelvis, mul(across, 3.2))];
}
/** The neck of a torso leaning at `deg` from the pelvis. */
const neckAt = (pelvis: Pt, deg: number): Pt => at(pelvis, deg, TORSO);

const S = (pose: SilhouettePose, focus: Part[] = []): Drawn => silhouette(pose, focus);
const FRONT = (pose: Omit<SilhouettePose, 'view'>, focus: Part[] = []): Drawn => silhouette({ ...pose, view: 'front' }, focus);

/** A folded blanket under the shoulders, its edge just short of the head. */
const BLANKET = 'M40,81.5 L72,81.5 L72,86 L40,86 Z';

/** A block or a bolster on the floor, centred at `x`. */
const block = (x: number, w = 10, h = 6.5) => `M${x - w / 2},${86 - h} L${x + w / 2},${86 - h} L${x + w / 2},86 L${x - w / 2},86 Z`;

/** Holds breathe slowly: every yoga figure moves at about the pace of a breath. */
const yoga = (start: Drawn, end: Drawn, more: Partial<Omit<Clip, 'start' | 'end'>> = {}): FigureSpec =>
  clip({ scene: 'floor', wall: FLOOR, seconds: 3.6, start, end, ...more });

const TORSO_ONLY: Part[] = ['torso'];
const UPPER: Part[] = ['lArm', 'rArm', 'torso'];
const SIDE_BODY: Part[] = ['torso', 'lLeg', 'rLeg'];

/* ------------------------------------------------------------------ */
/* Standing                                                            */
/* ------------------------------------------------------------------ */

/** Mountain: standing tall, the arms floating down from overhead to the sides on a breath out. */
function mountain(): FigureSpec {
  const pose = (lift: number) => {
    const pelvis: Pt = [50, STAND];
    const neck: Pt = [50, STAND - TORSO - lift];
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT(
      { neck, pelvis, lFoot: [46.6, G], rFoot: [53.4, G], lHand: at(ls, 96 + lift * 4, ARM), rHand: at(rs, 84 - lift * 4, ARM), bend: { lArm: 'out', rArm: 'out' } },
      TORSO_ONLY,
    );
  };
  return yoga(pose(0.6), pose(0), { seconds: 4.4 });
}

/** Chair: from standing with the arms up, the hips sit back and down. */
function chair(): FigureSpec {
  const feet: Pt = [52, G];
  const pose = (pelvis: Pt, lean: number) => {
    const neck = neckAt(pelvis, -90 + lean);
    const hand = at(shoulderOf(neck, pelvis), -90 + lean, ARM);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), lFoot: feet, rFoot: back(feet, -1.5, 0), lToe: [1, 0], rToe: [1, 0], bend: { lLeg: 'right', rLeg: 'right' } }, LEGS);
  };
  return yoga(pose([51, STAND], 2), pose([40.5, 65.5], 30));
}

/** Goddess, from the front: a wide stance sinking into a turned-out squat, arms bent like a cactus. */
function goddess(): FigureSpec {
  const lFoot: Pt = [30, G];
  const rFoot: Pt = [70, G];
  const pose = (pelvisY: number) => {
    const pelvis: Pt = [50, pelvisY];
    const neck: Pt = [50, pelvisY - TORSO];
    const [ls, rs] = shouldersOf(neck, pelvis);
    const lElbow: Pt = [ls[0] - 11.2, ls[1]];
    const rElbow: Pt = [rs[0] + 11.2, rs[1]];
    return FRONT(
      { neck, pelvis, lFoot, rFoot, lToe: [-0.9, 0.3], rToe: [0.9, 0.3], lHand: [lElbow[0], lElbow[1] - 10.8], rHand: [rElbow[0], rElbow[1] - 10.8], joints: { lArm: lElbow, rArm: rElbow }, bend: { lLeg: 'out', rLeg: 'out' } },
      LEGS,
    );
  };
  return yoga(pose(59.6), pose(66.5));
}

/** Warrior I: from a long split stance, the front knee bends over the ankle and the arms reach up. */
function warrior1(): FigureSpec {
  const front: Pt = [68, G];
  const rear: Pt = [27.5, G];
  const pose = (pelvis: Pt, up: boolean) => {
    const neck = neckAt(pelvis, -91);
    const sh = shoulderOf(neck, pelvis);
    const hand = up ? at(sh, -84, ARM) : reach(sh, [pelvis[0] + 2.5, pelvis[1] + 1]);
    return S(
      { neck, pelvis, lHand: hand, rHand: back(hand), lFoot: front, rFoot: rear, lToe: [1, 0], rToe: [1, -0.2], bend: { lLeg: 'right', rLeg: 'down', lArm: up ? 'left' : 'left', rArm: 'left' } },
      LEGS,
    );
  };
  return yoga(pose([47.8, 62.6], false), pose([52, 67.2], true));
}

/** Warrior II's legs and hips, from the front: front leg (the picture's left) bent over its ankle, back leg long. */
const W2_FRONT: Pt = [28, G];
const W2_BACK: Pt = [73, G];
const W2_PELVIS: Pt = [46, 67];

function warrior2Pose(pelvis: Pt, neck: Pt, hands: (ls: Pt, rs: Pt) => [Pt, Pt], focus: Part[] = LEGS, bend: SilhouettePose['bend'] = {}): Drawn {
  const [ls, rs] = shouldersOf(neck, pelvis);
  const [lHand, rHand] = hands(ls, rs);
  return FRONT({ neck, pelvis, lHand, rHand, lFoot: W2_FRONT, rFoot: W2_BACK, lToe: [-1, 0], rToe: [0.8, 0.35], bend: { lLeg: 'out', rLeg: 'out', lArm: 'out', rArm: 'out', ...bend } }, focus);
}

/** Warrior II held: arms level, front thigh near parallel. */
const warrior2Held = () => warrior2Pose(W2_PELVIS, [46, 45], (ls, rs) => [at(ls, 180, ARM), at(rs, 0, ARM)]);

/** Warrior II: from a wide stance with the arms down, sink into the front knee and open the arms. */
function warrior2(): FigureSpec {
  const start = warrior2Pose([50.5, 61.5], [50.5, 39.5], (ls, rs) => [at(ls, 102, ARM), at(rs, 78, ARM)]);
  return yoga(start, warrior2Held());
}

/** Reverse Warrior: from Warrior II, the torso leans back and the front arm arcs overhead. */
function reverseWarrior(): FigureSpec {
  const neck = neckAt(W2_PELVIS, -66);
  const end = warrior2Pose(W2_PELVIS, neck, (ls, rs) => [at(ls, -70, ARM), reach(rs, [63, 72])], ['torso', 'lArm', 'lLeg']);
  const start = warrior2Pose(W2_PELVIS, [46, 45], (ls, rs) => [at(ls, 180, ARM), at(rs, 0, ARM)], ['torso', 'lArm', 'lLeg']);
  return yoga(start, end);
}

/** Triangle, from the front: both legs straight, the torso tipping over the front leg, arms in one vertical line. */
function triangle(): FigureSpec {
  const pelvis: Pt = [47, 62];
  const lFoot: Pt = [26, G];
  const rFoot: Pt = [70, G];
  const pose = (deg: number, end: boolean) => {
    const neck = neckAt(pelvis, deg);
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT(
      {
        neck,
        pelvis,
        lFoot,
        rFoot,
        lToe: [-1, 0],
        rToe: [0.8, 0.35],
        lHand: end ? reach(ls, [24.5, 80]) : at(ls, 180, ARM),
        rHand: end ? at(rs, -90, ARM) : at(rs, 0, ARM),
        bend: { lArm: 'out', rArm: 'out', lLeg: 'out', rLeg: 'out' },
      },
      SIDE_BODY,
    );
  };
  return yoga(pose(-90, false), pose(200, true));
}

/** Extended Side Angle: from Warrior II, the torso lowers over the front thigh and the top arm reaches past the ear. */
function sideAngle(): FigureSpec {
  const neck = neckAt(W2_PELVIS, 215);
  const line = (Math.atan2(W2_PELVIS[1] - W2_BACK[1], W2_PELVIS[0] - W2_BACK[0]) * 180) / Math.PI;
  const end = warrior2Pose(W2_PELVIS, neck, (ls, rs) => [at(ls, 96, ARM), at(rs, line, ARM)], ['torso', 'rArm', 'rLeg']);
  const start = warrior2Pose(W2_PELVIS, [46, 45], (ls, rs) => [at(ls, 180, ARM), at(rs, 0, ARM)], ['torso', 'rArm', 'rLeg']);
  return yoga(start, end);
}

/** Tree, from the front: the foot slides up from the ankle to the inner thigh as the hands come together at the chest. */
function tree(): FigureSpec {
  const pelvis: Pt = [50, STAND];
  const neck: Pt = [50, STAND - TORSO];
  const pose = (foot: Pt, hands: [Pt, Pt]) =>
    FRONT({ neck, pelvis, lFoot: foot, rFoot: [53.2, G], lHand: hands[0], rHand: hands[1], bend: { lLeg: 'out', rLeg: 'out', lArm: 'out', rArm: 'out' } }, LEGS);
  return yoga(
    pose([50.6, 81.5], [
      [44.6, 55.5],
      [55.4, 55.5],
    ]),
    pose([51.6, 66], [
      [49.2, 44.5],
      [50.8, 44.5],
    ]),
  );
}

/** Eagle, side on: sitting low on the far leg, the near leg wrapped over it, elbows lifted in front of the face. */
function eagle(): FigureSpec {
  const stand: Pt = [52, G];
  const start = (() => {
    const pelvis: Pt = [46, 56];
    const neck = neckAt(pelvis, -82);
    const hand = at(shoulderOf(neck, pelvis), -12, ARM);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), lFoot: [54.5, G], rFoot: stand, lToe: [1, 0], rToe: [1, 0], bend: { lLeg: 'right', rLeg: 'right' } }, ['lLeg', 'rLeg', 'lArm', 'rArm']);
  })();
  const end = (() => {
    const pelvis: Pt = [44, 61];
    const neck = neckAt(pelvis, -72);
    return S(
      {
        neck,
        pelvis,
        lHand: [61.5, 32.6],
        rHand: [60.5, 33.5],
        lFoot: [49, 77],
        rFoot: stand,
        lToe: [-0.3, 1],
        rToe: [1, 0],
        joints: { lArm: [61, 43.5], rArm: [60, 44.5] },
        bend: { lLeg: 'right', rLeg: 'right' },
      },
      ['lLeg', 'rLeg', 'lArm', 'rArm'],
    );
  })();
  return yoga(start, end);
}

/** Warrior III: on the near leg, tipping forward until the body and the far leg are one level line. */
function warrior3(): FigureSpec {
  const foot: Pt = [46, G];
  const start = (() => {
    const pelvis: Pt = [46.5, STAND];
    const neck = neckAt(pelvis, -90);
    const hand = at(shoulderOf(neck, pelvis), -88, ARM);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), lFoot: foot, rFoot: [34, 80], lToe: [1, 0], rToe: [0.4, 0.9] }, CORE);
  })();
  const end = (() => {
    const pelvis: Pt = [45.5, STAND + 0.2];
    const neck = neckAt(pelvis, -2);
    const hand = at(shoulderOf(neck, pelvis), -2, ARM);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand, -1.4, 0.4), lFoot: foot, rFoot: at(pelvis, 181, LEG), lToe: [1, 0], rToe: [0, 1] }, CORE);
  })();
  return yoga(start, end);
}

/** Half Moon, from the front: on the left leg and the left hand (on a block), the right leg lifting level. */
function halfMoon(): FigureSpec {
  const pelvis: Pt = [41, 51.3];
  const neck: Pt = [19, 51.3];
  const [ls, rs] = shouldersOf(neck, pelvis);
  const [, rHip] = hipsOf(neck, pelvis);
  const pose = (legDeg: number, up: boolean) =>
    FRONT(
      {
        neck,
        pelvis,
        lHand: [ls[0], 79.2],
        rHand: up ? at(rs, -90, ARM) : at(rs, 0, 21),
        lFoot: [41.4, G],
        rFoot: at(rHip, legDeg, LEG),
        lToe: [-1, 0],
        rToe: [0, -1],
        bend: { lLeg: 'out', rLeg: 'out', lArm: 'out', rArm: 'out' },
      },
      SIDE_BODY,
    );
  return yoga(pose(34, false), pose(0, true), { wall: `${block(ls[0], 11)} ${FLOOR}` });
}

/** Extended Hand-to-Big-Toe: on the far leg, the near knee lifts and straightens forward, the hand holding the big toe. */
function handToToe(): FigureSpec {
  const pelvis: Pt = [42.5, STAND];
  const neck = neckAt(pelvis, -92);
  const sh = shoulderOf(neck, pelvis);
  const pose = (foot: Pt, toe: Pt) =>
    S({ neck, pelvis, lHand: reach(sh, [foot[0] - 0.5, foot[1] + 0.6]), rHand: [44.5, 55.5], lFoot: foot, rFoot: [42, G], lToe: toe, rToe: [1, 0], bend: { lLeg: 'up', rArm: 'left' } }, LEGS);
  return yoga(pose([54.5, 51.5], [1, 0.2]), pose(at(pelvis, -40, LEG), [0.6, -0.8]));
}

/** Standing Split: from a forward fold on the near leg, the far leg lifts high behind. */
function standingSplit(): FigureSpec {
  const pelvis: Pt = [50, STAND];
  const neck = neckAt(pelvis, 58);
  const sh = shoulderOf(neck, pelvis);
  const hand = reach(sh, [64.5, G]);
  const pose = (farFoot: Pt, farToe: Pt) =>
    S(
      { neck, pelvis, head: [64.6, 79.4], lHand: hand, rHand: back(hand, -1.2, 0), lFoot: [50.5, G], rFoot: farFoot, lToe: [1, 0], rToe: farToe, bend: { lArm: 'up', rArm: 'up', rLeg: 'down' } },
      LEGS,
    );
  return yoga(pose([49, G], [1, 0]), pose(at(pelvis, 240, LEG), [-0.5, -0.87]));
}

/** Dancer: holding the near foot behind, the chest tips forward as the foot kicks back and up. */
function dancer(): FigureSpec {
  const stand: Pt = [46, G];
  const start = (() => {
    const pelvis: Pt = [46.5, STAND];
    const neck = neckAt(pelvis, -89);
    const sh = shoulderOf(neck, pelvis);
    const foot: Pt = [40.5, 57];
    return S({ neck, pelvis, lHand: reach(sh, foot), rHand: at(sh, -84, ARM), lFoot: foot, rFoot: stand, lToe: [-0.2, -1], rToe: [1, 0], bend: { lLeg: 'down', lArm: 'left', rArm: 'left' } }, ['lLeg', 'torso', 'lArm']);
  })();
  const end = (() => {
    const pelvis: Pt = [46, STAND];
    const neck = neckAt(pelvis, -55);
    const sh = shoulderOf(neck, pelvis);
    const foot: Pt = [38, 34];
    return S({ neck, pelvis, lHand: reach(sh, [foot[0] + 0.5, foot[1] + 0.5]), rHand: at(sh, -35, ARM), lFoot: foot, rFoot: stand, lToe: [0.3, -1], rToe: [1, 0], bend: { lLeg: 'left', lArm: 'up', rArm: 'left' } }, ['lLeg', 'torso', 'lArm']);
  })();
  return yoga(start, end);
}

/** Bird of Paradise, from the front: standing on the right leg, the bound left leg unfolds up and out to the side. */
function birdOfParadise(): FigureSpec {
  const pelvis: Pt = [51, STAND];
  const neck: Pt = [51, STAND - TORSO];
  const [ls, rs] = shouldersOf(neck, pelvis);
  const pose = (foot: Pt, toe: Pt) =>
    FRONT({ neck, pelvis, lHand: reach(ls, [45, 55]), rHand: reach(rs, [49, 54]), lFoot: foot, rFoot: [54, G], lToe: toe, bend: { lLeg: 'out', lArm: 'out', rArm: 'out' } }, ['lLeg', 'lArm', 'rArm']);
  return yoga(pose([44, 72], [-0.3, 1]), pose([32, 31], [-0.6, -0.8]));
}

/* ------------------------------------------------------------------ */
/* Folds                                                               */
/* ------------------------------------------------------------------ */

/** Standing Forward Fold: from a flat-backed half lift, the torso hangs down in front of the legs and the head drops to the shins. */
function standingFold(): FigureSpec {
  const feet: Pt = [50, G];
  const pose = (pelvis: Pt, deg: number, hand: Pt, head?: Pt) => {
    const neck = neckAt(pelvis, deg);
    const reached = reach(shoulderOf(neck, pelvis), hand);
    return S({ neck, pelvis, head, lHand: reached, rHand: back(reached), lFoot: feet, rFoot: back(feet, -1.5, 0), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'up', rArm: 'up', lLeg: 'right', rLeg: 'right' } }, SIDE_BODY);
  };
  return yoga(pose([46, 54.6], 12, [53, 72]), pose([46.5, 54.6], 58, [64, G], [61, 79.4]));
}

/** Pyramid: both legs straight in a split stance, the torso hinging forward over the front leg. */
function pyramid(): FigureSpec {
  const pelvis: Pt = [50, 59];
  const pose = (deg: number, down: boolean) => {
    const neck = neckAt(pelvis, deg);
    const sh = shoulderOf(neck, pelvis);
    const hand = down ? reach(sh, [69.5, G]) : reach(sh, [52.5, 60]);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), lFoot: [66, G], rFoot: [34, G], lToe: [1, 0], rToe: [1, -0.3], bend: { lArm: 'left', rArm: 'left' } }, ['torso', 'lLeg']);
  };
  return yoga(pose(-89, false), pose(32, true));
}

/** Wide-Legged Forward Fold, from the front: from a flat back the head lowers between the feet. Folding forward, the torso points down at the floor. */
function wideFold(): FigureSpec {
  const pelvis: Pt = [50, 58.5];
  const pose = (neckY: number, head: Pt, spread: number, bend: boolean) => {
    const neck: Pt = [50, neckY];
    // Upside down, the left shoulder is on the right of the picture.
    return FRONT(
      { neck, pelvis, head, lFoot: [32, G], rFoot: [68, G], lHand: [50 + spread, G], rHand: [50 - spread, G], bend: { lArm: bend ? 'out' : 'in', rArm: bend ? 'out' : 'in', lLeg: 'out', rLeg: 'out' } },
      SIDE_BODY,
    );
  };
  return yoga(pose(64, [50, 71.4], 5.8, false), pose(72, [50, 79.6], 7.8, true));
}

/** Staff Pose: sitting on the floor, legs straight, the spine rising from a slump to upright. */
function staff(): FigureSpec {
  const pelvis: Pt = [36, SEAT];
  const pose = (deg: number) =>
    S({ neck: neckAt(pelvis, deg), pelvis, lHand: [36.6, G], rHand: [35.4, G], lFoot: [65.2, 82.5], rFoot: [64, 82], lToe: [0, -1], rToe: [0, -1] }, TORSO_ONLY);
  return yoga(pose(-101), pose(-90));
}

/** Child's Pose: from sitting on the heels, the chest folds down over the thighs, forehead to the floor. */
function child(): FigureSpec {
  const pelvis: Pt = [43.5, 76];
  const knee: Pt = [57.5, 82];
  const foot: Pt = [44, G];
  const legs = { lFoot: foot, rFoot: back(foot, -1.4, 0), lToe: [-1, 0] as Pt, rToe: [-1, 0] as Pt, joints: { lLeg: knee, rLeg: back(knee, -1.4, 0) } };
  const start = (() => {
    const neck = neckAt(pelvis, -88);
    const hand = reach(shoulderOf(neck, pelvis), [52, 75.5]);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), ...legs, joints: { ...legs.joints }, bend: { lArm: 'left', rArm: 'left' } }, TORSO_ONLY);
  })();
  const end = (() => {
    const neck = neckAt(pelvis, 14);
    const hand = reach(shoulderOf(neck, pelvis), [85.5, 83.3]);
    return S({ neck, pelvis, head: [72, HEAD_DOWN], lHand: hand, rHand: back(hand, -1, 0), ...legs, joints: { ...legs.joints } }, TORSO_ONLY);
  })();
  return yoga(start, end, { seconds: 4.4 });
}

/** Seated Forward Fold: from Staff Pose with the arms up, the chest folds forward over the legs. */
function seatedFold(): FigureSpec {
  const pelvis: Pt = [36, SEAT];
  const pose = (deg: number, fold: boolean) => {
    const neck = neckAt(pelvis, deg);
    const sh = shoulderOf(neck, pelvis);
    const hand = fold ? reach(sh, [65.5, 79.5]) : at(sh, -85, ARM);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), lFoot: [65.2, 82.5], rFoot: [64, 82], lToe: [0, -1], rToe: [0, -1], bend: { lArm: 'up', rArm: 'up' } }, SIDE_BODY);
  };
  return yoga(pose(-89, false), pose(-22, true));
}

/** Head-to-Knee: the far leg straight, the near foot against the inner thigh, folding over the straight leg. */
function headToKnee(): FigureSpec {
  const pelvis: Pt = [36, SEAT];
  const pose = (deg: number, fold: boolean) => {
    const neck = neckAt(pelvis, deg);
    const sh = shoulderOf(neck, pelvis);
    const hand = fold ? reach(sh, [64.5, 79.5]) : at(sh, -86, ARM);
    return S(
      { neck, pelvis, lHand: hand, rHand: back(hand), lFoot: [42.5, 83], rFoot: [64.8, 82.3], rToe: [0, -1], joints: { lLeg: [49.5, 79.5] }, bend: { lArm: 'up', rArm: 'up' } },
      ['torso', 'rLeg'],
    );
  };
  return yoga(pose(-89, false), pose(-22, true));
}

/** Wide-Angle Seated Fold, from the front: legs wide on the floor, the chest folding forward towards the viewer. */
function wideAngle(): FigureSpec {
  const pelvis: Pt = [50, SEAT];
  const pose = (neckY: number, head: Pt, hands: number) => {
    const neck: Pt = [50, neckY];
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT(
      { neck, pelvis, head, lHand: reach(ls, [50 - hands, 84]), rHand: reach(rs, [50 + hands, 84]), lFoot: [17.6, 82.6], rFoot: [82.4, 82.6], lToe: [0, -1], rToe: [0, -1], bend: { lArm: 'out', rArm: 'out' } },
      SIDE_BODY,
    );
  };
  return yoga(pose(60, [50, 51.4], 7.5), pose(70, [50, 65], 9));
}

/** Tortoise, from the front: knees bent and wide, the arms sliding out under the knees as the chest lowers. */
function tortoise(): FigureSpec {
  const pelvis: Pt = [50, SEAT];
  const pose = (neckY: number, head: Pt, feet: number, hands: number) => {
    const neck: Pt = [50, neckY];
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT(
      { neck, pelvis, head, lHand: reach(ls, [50 - hands, 81]), rHand: reach(rs, [50 + hands, 81]), lFoot: [50 - feet, G], rFoot: [50 + feet, G], lToe: [0, -1], rToe: [0, -1], bend: { lLeg: 'up', rLeg: 'up', lArm: 'out', rArm: 'out' } },
      UPPER,
    );
  };
  return yoga(pose(62, [50, 53.6], 21, 6), pose(73, [50, 69], 30, 27));
}

/** Boat: sitting on the sit bones, the shins lift level, then the legs straighten into a V. */
function boat(): FigureSpec {
  const pelvis: Pt = [42, 81];
  const neck = neckAt(pelvis, -115);
  const sh = shoulderOf(neck, pelvis);
  const pose = (foot: Pt, hand: Pt, toe: Pt) => S({ neck, pelvis, lHand: hand, rHand: back(hand), lFoot: foot, rFoot: back(foot, -1.2, 0.6), lToe: toe, rToe: toe, bend: { lLeg: 'up', rLeg: 'up', lArm: 'down', rArm: 'down' } }, CORE);
  return yoga(pose([62, 69.5], reach(sh, [52, 70]), [1, -0.1]), pose(at(pelvis, -48, LEG), at(sh, -4, ARM), [0.6, -0.8]));
}

/** Heron: the far leg folded back, the near leg drawn up straight towards the face. */
function heron(): FigureSpec {
  const pelvis: Pt = [40, 81.5];
  const neck = neckAt(pelvis, -91);
  const sh = shoulderOf(neck, pelvis);
  const tuck = { rFoot: [40.5, G] as Pt, rToe: [-1, 0] as Pt, rKnee: [54, 82] as Pt };
  const pose = (foot: Pt, toe: Pt, hand: Pt) =>
    S({ neck, pelvis, lHand: reach(sh, hand), rHand: back(reach(sh, hand)), lFoot: foot, rFoot: tuck.rFoot, lToe: toe, rToe: tuck.rToe, joints: { rLeg: tuck.rKnee }, bend: { lLeg: 'up', lArm: 'down', rArm: 'down' } }, ['lLeg']);
  return yoga(pose([56, G], [1, 0], [53, 72]), pose(at(pelvis, -70, LEG), [0.3, -1], [49.5, 55.5]));
}

/* ------------------------------------------------------------------ */
/* Hips                                                                */
/* ------------------------------------------------------------------ */

/** Low Lunge: from kneeling with the hips over the back knee, the hips sink forward and the arms rise. */
function lowLunge(): FigureSpec {
  const legs = { lFoot: [61, G] as Pt, rFoot: [20, G] as Pt, lToe: [1, 0] as Pt, rToe: [-1, 0] as Pt };
  const knee: Pt = [34, 82];
  const pose = (pelvis: Pt, up: boolean) => {
    const neck = neckAt(pelvis, -90);
    const sh = shoulderOf(neck, pelvis);
    const hand = up ? at(sh, -86, ARM) : reach(sh, [52, 68]);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), ...legs, joints: { rLeg: knee }, bend: { lLeg: 'right', lArm: 'left', rArm: 'left' } }, ['rLeg', 'torso']);
  };
  return yoga(pose([37, 67.5], false), pose([44, 70], true));
}

/** Half Splits: from a lunge, the hips shift back over the back knee and the front leg straightens. */
function halfSplits(): FigureSpec {
  const pelvis: Pt = [41, 67.3];
  const knee: Pt = [40, 82];
  const pose = (foot: Pt, toe: Pt, deg: number, down: boolean) => {
    const neck = neckAt(pelvis, deg);
    const sh = shoulderOf(neck, pelvis);
    const hand = down ? reach(sh, [63, G]) : reach(sh, [43.5, 68]);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), lFoot: foot, rFoot: [26, G], lToe: toe, rToe: [-1, 0], joints: { rLeg: knee }, bend: { lLeg: 'up', lArm: 'left', rArm: 'left' } }, ['lLeg']);
  };
  return yoga(pose([60, G], [1, 0], -60, false), pose(at(pelvis, 30, LEG), [0, -1], 8, true));
}

/** Lizard: the front foot steps wide, both hands go inside it and the hips sink low. */
function lizard(): FigureSpec {
  const knee: Pt = [30, 82];
  const pose = (pelvis: Pt, deg: number, hand: Pt) => {
    const neck = neckAt(pelvis, deg);
    const reached = reach(shoulderOf(neck, pelvis), hand);
    return S({ neck, pelvis, lHand: reached, rHand: back(reached), lFoot: [62, G], rFoot: [16, G], lToe: [1, 0], rToe: [-1, 0], joints: { rLeg: knee }, bend: { lLeg: 'right', lArm: 'left', rArm: 'left' } }, ['lLeg', 'rLeg']);
  };
  return yoga(pose([39.5, 70.5], -88, [53, 70]), pose([42, 74], -25, [64.5, G]));
}

/** Front Splits: from Half Splits, the legs slide apart until both lie straight along the floor. */
function frontSplits(): FigureSpec {
  const start = (() => {
    const pelvis: Pt = [40, 69];
    const neck = neckAt(pelvis, -62);
    const hand = reach(shoulderOf(neck, pelvis), [51.5, 72.5]);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand), lFoot: at(pelvis, 27, LEG), rFoot: [20, G], lToe: [0, -1], rToe: [-1, 0], joints: { rLeg: [34, 82] }, bend: { lArm: 'down', rArm: 'down' } }, LEGS);
  })();
  const end = (() => {
    const pelvis: Pt = [50, SEAT];
    const neck = neckAt(pelvis, -90);
    const hand = reach(shoulderOf(neck, pelvis), [52.5, G]);
    return S({ neck, pelvis, lHand: hand, rHand: back(hand, -3, 0), lFoot: [79.2, 82.6], rFoot: [21, 82.6], lToe: [0, -1], rToe: [-1, 0], joints: { rLeg: [35.5, 82.3] } }, LEGS);
  })();
  return yoga(start, end);
}

/** Bound Angle, from the front: the soles together, the knees settling down towards the floor. */
function boundAngle(): FigureSpec {
  const pelvis: Pt = [50, SEAT];
  const neck: Pt = [50, 60];
  const [ls, rs] = shouldersOf(neck, pelvis);
  const pose = (knee: Pt, foot: number) =>
    FRONT(
      {
        neck,
        pelvis,
        lHand: reach(ls, [50 - foot, 82]),
        rHand: reach(rs, [50 + foot, 82]),
        lFoot: [50 - foot, G],
        rFoot: [50 + foot, G],
        joints: { lLeg: knee, rLeg: [100 - knee[0], knee[1]] },
        bend: { lArm: 'out', rArm: 'out' },
      },
      LEGS,
    );
  return yoga(pose([36.6, 73.5], 2), pose([33.5, 79.5], 2.5), { seconds: 4.4 });
}

/** Happy Baby: on the back, the knees draw wide towards the armpits and the hands hold the feet. */
function happyBaby(): FigureSpec {
  const pelvis: Pt = [56, FLAT];
  const neck: Pt = [34, FLAT];
  const sh = shoulderOf(neck, pelvis);
  const pose = (knee: Pt, footDeg: number, hand: (foot: Pt) => Pt) => {
    const foot = at(knee, footDeg, 14.3);
    const reached = reach(sh, hand(foot));
    return S(
      { neck, pelvis, head: [25.4, HEAD_DOWN], lHand: reached, rHand: back(reached, 1.2, 0.4), lFoot: foot, rFoot: back(foot, 1.2, 0.4), lToe: [0, -1], rToe: [0, -1], joints: { lLeg: knee, rLeg: back(knee, 1.2, 0.4) }, bend: { lArm: 'up', rArm: 'up' } },
      LEGS,
    );
  };
  return yoga(
    pose(at(pelvis, -120, 14.6), -40, (foot) => [foot[0] - 3, foot[1] + 5]),
    pose(at(pelvis, -152, 14.6), -100, (foot) => [foot[0] + 0.4, foot[1] + 0.8]),
  );
}

/** Garland: squatting deep, the heels down, the palms together and the elbows easing the knees apart. */
function garland(): FigureSpec {
  const feet: Pt = [50, G];
  const pose = (pelvis: Pt, deg: number, hand: Pt) => {
    const neck = neckAt(pelvis, deg);
    const reached = reach(shoulderOf(neck, pelvis), hand);
    return S({ neck, pelvis, lHand: reached, rHand: back(reached, -0.8, 0.3), lFoot: feet, rFoot: back(feet, -1.5, 0), lToe: [1, 0], rToe: [1, 0], bend: { lLeg: 'right', rLeg: 'right', lArm: 'down', rArm: 'down' } }, LEGS);
  };
  return yoga(pose([45, 64], -76, [61, 61]), pose([44.5, 76], -84, [55.5, 63]));
}

/** Pigeon: the near shin forward, the far leg long behind; the chest folds down over the front shin. */
function pigeon(): FigureSpec {
  const pelvis: Pt = [45, 78];
  const legs = { lFoot: [47, G] as Pt, rFoot: [16.5, 82.6] as Pt, lToe: [-1, 0.1] as Pt, rToe: [-1, 0] as Pt, joints: { lLeg: [58, 82] as Pt } };
  const pose = (deg: number, hand: Pt, head?: Pt) => {
    const neck = neckAt(pelvis, deg);
    const reached = reach(shoulderOf(neck, pelvis), hand);
    return S({ neck, pelvis, head, lHand: reached, rHand: back(reached, -1, 0), ...legs, joints: { ...legs.joints } }, LEGS);
  };
  return yoga(pose(-70, [58, 80]), pose(11, [87, 83.3], [74, HEAD_DOWN]), { seconds: 4.4 });
}

/** Fire Log, from the front: shins stacked like logs, knee over ankle, the chest folding forward. */
function fireLog(): FigureSpec {
  const pelvis: Pt = [50, SEAT];
  const pose = (neckY: number, head: Pt, hands: [Pt, Pt]) => {
    const neck: Pt = [50, neckY];
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT(
      {
        neck,
        pelvis,
        head,
        lHand: reach(ls, hands[0]),
        rHand: reach(rs, hands[1]),
        lFoot: [57.2, 83],
        rFoot: [42.8, 77.6],
        lToe: [0, -1],
        rToe: [0, -1],
        joints: { lLeg: [42.8, 83], rLeg: [57.2, 77.6] },
        bend: { lArm: 'out', rArm: 'out' },
      },
      LEGS,
    );
  };
  return yoga(
    pose(60, [50, 51.4], [
      [43, 80],
      [57, 76],
    ]),
    pose(71, [50, 64.5], [
      [40, 84],
      [60, 84],
    ]),
  );
}

/** Half Lotus, from the front: the right foot lifts from the floor onto the left thigh. */
function halfLotus(): FigureSpec {
  const pelvis: Pt = [50, SEAT];
  const neck: Pt = [50, 60];
  const [ls, rs] = shouldersOf(neck, pelvis);
  const pose = (rFoot: Pt, rHand: Pt) =>
    FRONT(
      { neck, pelvis, lHand: reach(ls, [39, 80]), rHand: reach(rs, rHand), lFoot: [52, 84], rFoot, lToe: [1, 0], rToe: [-1, -0.2], joints: { lLeg: [38, 82.5], rLeg: [62, 82.5] }, bend: { lArm: 'out', rArm: 'out' } },
      LEGS,
    );
  return yoga(pose([48.2, 84.2], [57, 83]), pose([47.5, 78.8], [61, 80]));
}

/** Lotus, from the front: from Half Lotus, the left foot lifts over onto the right thigh. */
function lotus(): FigureSpec {
  const pelvis: Pt = [50, SEAT];
  const neck: Pt = [50, 60];
  const [ls, rs] = shouldersOf(neck, pelvis);
  const pose = (lFoot: Pt, lHand: Pt) =>
    FRONT(
      { neck, pelvis, lHand: reach(ls, lHand), rHand: reach(rs, [61.5, 79.5]), lFoot, rFoot: [47.5, 78.6], lToe: [1, -0.2], rToe: [-1, -0.2], joints: { lLeg: [38, 82.5], rLeg: [62, 82.5] }, bend: { lArm: 'out', rArm: 'out' } },
      LEGS,
    );
  return yoga(pose([52, 84], [43, 83]), pose([52.5, 79.6], [38.5, 79.5]));
}

/** Side Lunge, from the front: from a wide stance, the hips sink onto the left heel, the right leg long with its toes up. */
function sideLunge(): FigureSpec {
  const lFoot: Pt = [35, G];
  const rFoot: Pt = [71, 82.5];
  const pose = (pelvis: Pt, neck: Pt, toe: Pt) => {
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT(
      { neck, pelvis, lHand: reach(ls, [neck[0] + 1.6, neck[1] + 10]), rHand: reach(rs, [neck[0] + 2.8, neck[1] + 10]), lFoot, rFoot, lToe: [-0.9, 0.3], rToe: toe, bend: { lLeg: 'out', rLeg: 'up', lArm: 'out', rArm: 'out' } },
      LEGS,
    );
  };
  return yoga(pose([50, 62], [50, 40], [1, 0.2]), pose([40, 74], [41.5, 52.1], [0, -1]));
}

/** Middle Splits, from the front: from a wide stance with the hands on the thighs, the feet slide out until the hips reach the floor. */
function middleSplits(): FigureSpec {
  const pose = (pelvisY: number, feet: [Pt, Pt], hands: [Pt, Pt], toe: Pt) => {
    const pelvis: Pt = [50, pelvisY];
    const neck: Pt = [50, pelvisY - TORSO];
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT({ neck, pelvis, lHand: reach(ls, hands[0]), rHand: reach(rs, hands[1]), lFoot: feet[0], rFoot: feet[1], lToe: [-toe[0], toe[1]], rToe: toe, bend: { lArm: 'out', rArm: 'out' } }, LEGS);
  };
  return yoga(
    pose(
      70,
      [
        [21, 81.5],
        [79, 81.5],
      ],
      [
        [38, 70],
        [62, 70],
      ],
      [0.9, 0.3],
    ),
    pose(
      SEAT,
      [
        [17.6, 82.6],
        [82.4, 82.6],
      ],
      [
        [44, G],
        [56, G],
      ],
      [0, -1],
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Twists                                                              */
/* ------------------------------------------------------------------ */

/** Supine Twist, seen from the feet: lying on the back, arms wide, the bent knees fall over to one side. */
function supineTwist(): FigureSpec {
  // From the feet, lying down: the body runs into the picture, so the torso is short and the arms reach out wide.
  const pelvis: Pt = [50, 82.5];
  const neck: Pt = [50, 74.5];
  const [ls, rs] = shouldersOf(neck, pelvis);
  const [lHip, rHip] = hipsOf(neck, pelvis);
  const pose = (knees: [Pt, Pt], feet: [Pt, Pt]) =>
    FRONT(
      { neck, pelvis, head: [50, 68], lHand: at(ls, 182, ARM), rHand: at(rs, -2, ARM), lFoot: feet[0], rFoot: feet[1], joints: { lLeg: knees[0], rLeg: knees[1] }, bend: { lArm: 'out', rArm: 'out' } },
      ['torso', 'lLeg', 'rLeg'],
    );
  const upL = at(lHip, -93, 13.5);
  const upR = at(rHip, -87, 13.5);
  const downL = at(lHip, -8, 14.3);
  const downR = at(rHip, -22, 12.6);
  return yoga(
    pose([upL, upR], [at(upL, 92, 14.4), at(upR, 88, 14.4)]),
    pose([downL, downR], [at(downL, 171, 13.6), at(downR, 166, 13.6)]),
    { seconds: 4.4 },
  );
}

/** Easy Seated Twist, from the front: sitting cross-legged, the chest turns to one side, one hand behind. */
function seatedTwist(): FigureSpec {
  const pelvis: Pt = [50, SEAT];
  const pose = (neck: Pt, lHand: Pt, rHand: Pt) => {
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT(
      { neck, pelvis, lHand: reach(ls, lHand), rHand: reach(rs, rHand), lFoot: [51.2, 84.2], rFoot: [48.8, 84.2], lToe: [1, 0], rToe: [-1, 0], joints: { lLeg: [37, 82.5], rLeg: [63, 82.5] }, bend: { lArm: 'out', rArm: 'out' } },
      TORSO_ONLY,
    );
  };
  return yoga(pose([50, 60], [39, 80], [61, 80]), pose([52, 60.1], [60.5, 80], [69, 82.5]));
}

/** Half Lord of the Fishes: the near foot steps over the far leg; the far arm hugs the knee as the chest turns. */
function halfLord(): FigureSpec {
  const pelvis: Pt = [38, SEAT];
  const pose = (deg: number, hug: boolean) => {
    const neck = neckAt(pelvis, deg);
    const sh = shoulderOf(neck, pelvis);
    return S(
      {
        neck,
        pelvis,
        lHand: hug ? [33, G] : reach(sh, [39, G]),
        rHand: hug ? reach(sh, [54, 67]) : reach(sh, [48, 70]),
        lFoot: [55, G],
        rFoot: [62.5, 82.4],
        lToe: [1, 0],
        rToe: [0, -1],
        bend: { lLeg: 'up', lArm: 'left', rArm: 'down' },
      },
      TORSO_ONLY,
    );
  };
  return yoga(pose(-90, false), pose(-96, true));
}

/** Marichi's Twist: the near knee up, the far leg straight, the far arm wrapping round the knee into a bind behind the back. */
function marichi(): FigureSpec {
  const pelvis: Pt = [38, SEAT];
  const pose = (deg: number, bound: boolean) => {
    const neck = neckAt(pelvis, deg);
    const sh = shoulderOf(neck, pelvis);
    return S(
      {
        neck,
        pelvis,
        lHand: bound ? reach(sh, [32.5, 73.5]) : reach(sh, [36, G]),
        rHand: bound ? [44.5, 72.5] : reach(sh, [53, 66]),
        lFoot: [50, G],
        rFoot: [67, 82.4],
        lToe: [1, 0],
        rToe: [0, -1],
        joints: bound ? { rArm: [48.8, 62.6] } : undefined,
        bend: { lLeg: 'up', lArm: 'left', rArm: 'down' },
      },
      ['torso', 'lArm', 'rArm'],
    );
  };
  return yoga(pose(-90, false), pose(-92, true));
}

/** Revolved Chair: in Chair Pose with the palms together, the chest turns and an elbow hooks outside the knee. */
function revolvedChair(): FigureSpec {
  const feet: Pt = [52, G];
  const pelvis: Pt = [40.5, 65.5];
  const pose = (deg: number, hands: Pt, elbow?: Pt) => {
    const neck = neckAt(pelvis, deg);
    return S(
      { neck, pelvis, lHand: hands, rHand: back(hands, -0.6, 0.4), lFoot: feet, rFoot: back(feet, -1.5, 0), lToe: [1, 0], rToe: [1, 0], joints: elbow ? { rArm: elbow } : undefined, bend: { lLeg: 'right', rLeg: 'right', lArm: 'down', rArm: 'down' } },
      ['torso', 'lLeg', 'rLeg'],
    );
  };
  return yoga(pose(-62, [58, 55]), pose(-38, [60, 51.5], [60, 62.5]));
}

/** Revolved Low Lunge: in a low lunge, the palms together, the far elbow hooks outside the front knee as the chest turns. */
function revolvedLunge(): FigureSpec {
  const pelvis: Pt = [43, 70];
  const knee: Pt = [34, 82];
  const pose = (deg: number, hands: Pt, elbow?: Pt) => {
    const neck = neckAt(pelvis, deg);
    return S(
      { neck, pelvis, lHand: hands, rHand: back(hands, -0.6, 0.4), lFoot: [61, G], rFoot: [20, G], lToe: [1, 0], rToe: [-1, 0], joints: { rLeg: knee, ...(elbow ? { rArm: elbow } : {}) }, bend: { lLeg: 'right', lArm: 'down', rArm: 'down' } },
      TORSO_ONLY,
    );
  };
  return yoga(pose(-88, [50.5, 57]), pose(-48, [61, 55], [60.5, 66]));
}

/** Revolved Triangle, from the front: legs straight in a short stance, the right hand down by the front foot, the left arm up. */
function revolvedTriangle(): FigureSpec {
  const pelvis: Pt = [47, 60];
  const pose = (deg: number, twisted: boolean) => {
    const neck = neckAt(pelvis, deg);
    const [ls, rs] = shouldersOf(neck, pelvis);
    return FRONT(
      {
        neck,
        pelvis,
        lHand: twisted ? at(ls, -92, ARM) : reach(ls, [44, 61]),
        rHand: twisted ? reach(rs, [27, 79.5]) : reach(rs, [50, 61]),
        lFoot: [29, G],
        rFoot: [66, G],
        lToe: [-1, 0],
        rToe: [0.8, 0.3],
        bend: { lArm: 'out', rArm: 'in', lLeg: 'out', rLeg: 'out' },
      },
      ['torso', 'lArm', 'rArm'],
    );
  };
  return yoga(pose(-90, false), pose(205, true), { wall: `${block(27, 10)} ${FLOOR}` });
}

/** Revolved Side Angle: a high lunge, the back heel lifted, the far elbow outside the front knee and the chest turned up. */
function revolvedSideAngle(): FigureSpec {
  const pelvis: Pt = [44, 66];
  const pose = (deg: number, hands: Pt) => {
    const neck = neckAt(pelvis, deg);
    return S(
      { neck, pelvis, lHand: hands, rHand: back(hands, -0.6, 0.4), lFoot: [64, G], rFoot: at(pelvis, 151, LEG), lToe: [1, 0], rToe: [0.7, 0.7], bend: { lLeg: 'right', rLeg: 'down', lArm: 'down', rArm: 'down' } },
      ['torso', 'lLeg', 'rLeg'],
    );
  };
  return yoga(pose(-86, [51, 53]), pose(-30, [63, 51]));
}

/** Revolved Half Moon: on the near leg, the far hand on a block under the shoulder, the far leg lifted level and the near arm reaching up as the chest turns. */
function revolvedHalfMoon(): FigureSpec {
  const pelvis: Pt = [45.5, STAND + 0.2];
  const neck = neckAt(pelvis, -2);
  const sh = shoulderOf(neck, pelvis);
  const blockHand = reach(sh, [sh[0] + 0.4, 76]);
  const pose = (legDeg: number, up: boolean) =>
    S(
      { neck, pelvis, lHand: up ? at(sh, -90, ARM) : back(blockHand, 1, -0.4), rHand: blockHand, lFoot: [46, G], rFoot: at(pelvis, legDeg, LEG), lToe: [1, 0], rToe: [0, 1], bend: { lArm: 'left', rArm: 'left' } },
      ['torso', 'lArm', 'rLeg'],
    );
  return yoga(pose(158, false), pose(181, true), { wall: `${block(sh[0] + 0.4, 10, 8)} ${FLOOR}` });
}

/* ------------------------------------------------------------------ */
/* Backbends                                                           */
/* ------------------------------------------------------------------ */

/** Cat-Cow: on hands and knees, the back rounds up with the head down, then the belly drops with the head up. */
function catCow(): FigureSpec {
  const pelvis: Pt = [40, 67];
  const hands: Pt = [61.6, G];
  const pose = (neck: Pt, head: Pt) =>
    S({ neck, pelvis, head, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: [26, G], rFoot: [24.6, G], lToe: [-1, 0], rToe: [-1, 0], joints: { lLeg: [40, 82], rLeg: [38.6, 82] } }, TORSO_ONLY);
  return yoga(pose([61.4, 60.6], [65.4, 69.6]), pose([61.4, 63], [68.4, 56.4]), { seconds: 4.4 });
}

/** Fish: lying on the back, propped on the forearms, the chest lifts and the crown of the head lowers to the floor. */
function fish(): FigureSpec {
  const pelvis: Pt = [55, FLAT];
  const feet: Pt = [84.3, 82];
  const pose = (neck: Pt, head: Pt, elbow: Pt, hand: Pt) =>
    S({ neck, pelvis, head, lHand: hand, rHand: back(hand, 1, 0), lFoot: feet, rFoot: back(feet, -1.2, 0), lToe: [0.3, -1], rToe: [0.3, -1], joints: { lArm: elbow, rArm: back(elbow, 1, 0) } }, TORSO_ONLY);
  const neck = neckAt(pelvis, 209);
  const sh = shoulderOf(neck, pelvis);
  return yoga(pose([33, FLAT], [24.4, HEAD_DOWN], [44.5, 83], [55.4, G]), pose(neck, [31, 78.6], [sh[0] + 3.6, 82.2], [51, G]));
}

/** Camel: kneeling tall, the hips press forward and the chest arches back until the hands reach the heels. */
function camel(): FigureSpec {
  const knee: Pt = [49, 82];
  const foot: Pt = [35, 82];
  const pose = (pelvis: Pt, deg: number, hand: (sh: Pt) => Pt) => {
    const neck = neckAt(pelvis, deg);
    const reached = hand(shoulderOf(neck, pelvis));
    return S({ neck, pelvis, lHand: reached, rHand: back(reached, -1, 0), lFoot: foot, rFoot: back(foot, -1.4, 0), lToe: [0, -1], rToe: [0, -1], joints: { lLeg: knee, rLeg: back(knee, -1.4, 0) }, bend: { lArm: 'left', rArm: 'left' } }, TORSO_ONLY);
  };
  return yoga(pose([49.5, 67], -90, (sh) => reach(sh, [47, 66])), pose([52, 68], -150, (sh) => reach(sh, [35.5, 79.5])));
}

/** Side Plank, from the front: on the left hand and the edge of the left foot, the hips lift into one straight line. */
const PLANK_HAND: Pt = [38.5, G];
const PLANK_FEET: Pt = [84, G];

function sidePlankPose(pelvis: Pt, deg: number, topArm: number, top: { foot: Pt; knee?: Pt }, focus: Part[]): Drawn {
  const neck = neckAt(pelvis, deg);
  const [, rs] = shouldersOf(neck, pelvis);
  return FRONT(
    {
      neck,
      pelvis,
      lHand: PLANK_HAND,
      rHand: at(rs, topArm, ARM),
      lFoot: PLANK_FEET,
      rFoot: top.foot,
      joints: top.knee ? { rLeg: top.knee } : undefined,
      bend: { lArm: 'out', rArm: 'out', lLeg: 'out', rLeg: 'out' },
    },
    focus,
  );
}

/** The neck angle that puts the lower shoulder of a front view right over the supporting hand. */
function overHand(pelvis: Pt, hand: Pt): number {
  let best = { deg: 180, gap: Infinity };
  for (let deg = 150; deg <= 260; deg += 0.5) {
    const [ls] = shouldersOf(neckAt(pelvis, deg), pelvis);
    const gap = Math.abs(len(sub(hand, ls)) - ARM) + Math.abs(ls[0] - hand[0]) * 0.4;
    if (gap < best.gap) best = { deg, gap };
  }
  return best.deg;
}

function sidePlank(): FigureSpec {
  const low: Pt = [59.5, 74.5];
  const high: Pt = [59, 67.2];
  const start = sidePlankPose(low, overHand(low, PLANK_HAND) + 4, -88, { foot: [83.2, 80.2] }, CORE);
  const end = sidePlankPose(high, overHand(high, PLANK_HAND), -90, { foot: [83.2, 80.2] }, CORE);
  return yoga(start, end);
}

/** Wild Thing, from the front: from Side Plank, the top foot steps back, the hips lift high and the top arm reaches over. */
function wildThing(): FigureSpec {
  const high: Pt = [59, 67.2];
  const lifted: Pt = [61.5, 60.5];
  const start = sidePlankPose(high, overHand(high, PLANK_HAND), -90, { foot: [83.2, 80.2] }, ['torso', 'rArm', 'rLeg']);
  const end = sidePlankPose(lifted, overHand(lifted, PLANK_HAND), 205, { foot: [72, G], knee: [71.5, 68.5] }, ['torso', 'rArm', 'rLeg']);
  return yoga(start, end);
}

/** Sphinx: from lying face down with the forehead on the forearms, the chest lifts onto the forearms, elbows under the shoulders. */
function sphinx(): FigureSpec {
  const pelvis: Pt = [42, FLAT];
  const feet: Pt = [13, 83];
  const pose = (deg: number, elbow: Pt, hand: Pt, head?: Pt) =>
    S({ neck: neckAt(pelvis, deg), pelvis, head, lHand: hand, rHand: back(hand, -1, 0), lFoot: feet, rFoot: back(feet, 1, 0), lToe: [-1, 0.2], rToe: [-1, 0.2], joints: { lArm: elbow, rArm: back(elbow, -1, 0) } }, TORSO_ONLY);
  const neck = neckAt(pelvis, -24);
  const sh = shoulderOf(neck, pelvis);
  return yoga(pose(0, [73.4, 83.2], [84.2, 83.4], [72, 79.4]), pose(-24, [sh[0] + 1.4, 82.4], [sh[0] + 12.3, 83.4]), { seconds: 4.4 });
}

/** Cobra: from lying face down, the hands press and the chest lifts, the elbows staying bent and close. */
function cobra(): FigureSpec {
  const pelvis: Pt = [42, FLAT];
  const feet: Pt = [13, 83];
  const pose = (deg: number, head?: Pt) => {
    const neck = neckAt(pelvis, deg);
    const hand: Pt = [61, G];
    return S({ neck, pelvis, head, lHand: hand, rHand: back(hand, -1, 0), lFoot: feet, rFoot: back(feet, 1, 0), lToe: [-1, 0.2], rToe: [-1, 0.2], bend: { lArm: 'up', rArm: 'up' } }, TORSO_ONLY);
  };
  return yoga(pose(-3, [72, HEAD_DOWN]), pose(-34));
}

/** Locust: lying face down, the chest, arms and straight legs lift off the floor together. */
function locust(): FigureSpec {
  const pelvis: Pt = [45, FLAT];
  const pose = (deg: number, legDeg: number, armDeg: number, head?: Pt) => {
    const neck = neckAt(pelvis, deg);
    const hand = at(shoulderOf(neck, pelvis), armDeg, 21);
    const foot = at(pelvis, legDeg, LEG);
    return S({ neck, pelvis, head, lHand: hand, rHand: back(hand, 0, 1), lFoot: foot, rFoot: back(foot, 0, 1), lToe: [-1, 0.2], rToe: [-1, 0.2] }, ['torso', 'lLeg', 'rLeg']);
  };
  return yoga(pose(0, 180, 177, [75.4, HEAD_DOWN]), pose(-14, 191, 192));
}

/** Upward-Facing Dog: from the belly, the arms straighten, the chest opens forward and the thighs leave the floor. */
function upwardDog(): FigureSpec {
  const hands: Pt = [64, G];
  const feet: Pt = [14, 83];
  const start = (() => {
    const pelvis: Pt = [43, FLAT];
    const neck = neckAt(pelvis, -2);
    return S({ neck, pelvis, head: [73.4, HEAD_DOWN], lHand: hands, rHand: back(hands, -1, 0), lFoot: feet, rFoot: back(feet, 1, 0), lToe: [-1, 0.2], rToe: [-1, 0.2], bend: { lArm: 'up', rArm: 'up' } }, UPPER);
  })();
  const end = (() => {
    const neck: Pt = [hands[0] + 0.6, hands[1] - ARM - 1.2];
    const pelvis = toward(neck, [neck[0] - 40, 80], TORSO);
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1, 0), lFoot: feet, rFoot: back(feet, 1, 0), lToe: [-1, 0.2], rToe: [-1, 0.2] }, UPPER);
  })();
  return yoga(start, end);
}

/** Bow: face down, the knees bend and the hands reach back; then the legs kick into the hands and lift the chest and thighs. */
function bow(): FigureSpec {
  const pelvis: Pt = [50, 79.5];
  const pose = (deg: number, knee: Pt, foot: Pt, head?: Pt) => {
    const neck = neckAt(pelvis, deg);
    const hand = reach(shoulderOf(neck, pelvis), [foot[0] + 0.6, foot[1] + 0.6]);
    return S(
      { neck, pelvis, head, lHand: hand, rHand: back(hand, 1, 0.5), lFoot: foot, rFoot: back(foot, 1, 0.5), lToe: [0, -1], rToe: [0, -1], joints: { lLeg: knee, rLeg: back(knee, 1, 0.5) }, bend: { lArm: 'down', rArm: 'down' } },
      ['torso', 'lLeg', 'rLeg'],
    );
  };
  const lowKnee: Pt = [35.5, 82.5];
  const highKnee: Pt = [40, 69];
  return yoga(pose(-6, lowKnee, at(lowKnee, -70, 14.4)), pose(-35, highKnee, at(highKnee, -58, 14.8)));
}

/* ------------------------------------------------------------------ */
/* Arm balances                                                        */
/* ------------------------------------------------------------------ */

/** Plank: from the knees, the legs step back into one straight line on straight arms. */
function plankPose(knees: boolean): Drawn {
  const hands: Pt = [64, G];
  const neck: Pt = [hands[0] + 0.6, hands[1] - ARM - 1.2];
  const knee: Pt = [36.5, 82];
  const feet: Pt = knees ? at(knee, -152, 14.4) : [14, G];
  const pelvis = knees ? meet(neck, TORSO, knee, 15, higher) : toward(neck, feet, TORSO);
  return S(
    { neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: feet, rFoot: back(feet, 1.4, 0), lToe: [1, 0.2], rToe: [1, 0.2], joints: knees ? { lLeg: knee, rLeg: back(knee, 1.4, 0) } : undefined },
    CORE,
  );
}

function plank(): FigureSpec {
  return yoga(plankPose(true), plankPose(false));
}

/** Four-Limbed Staff: from Plank, the body lowers in one piece until the elbows bend to a right angle. */
function chaturanga(): FigureSpec {
  const hands: Pt = [62, G];
  const feet: Pt = [12, 82];
  const pose = (neckY: number, shift: number) => {
    const neck: Pt = [hands[0] + shift, neckY];
    const pelvis = toward(neck, feet, TORSO);
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: feet, rFoot: back(feet, 1.4, 0), lToe: [1, 0.2], rToe: [1, 0.2], bend: { lArm: 'up', rArm: 'up' } }, UPPER);
  };
  return yoga(pose(hands[1] - ARM - 1.2, 0.6), pose(72, 4), { seconds: 3 });
}

/** Crow: squatting with the hands down, the knees rest high on the upper arms and the weight tips forward until the feet lift. */
function crow(): FigureSpec {
  const hands: Pt = [62, G];
  const start = (() => {
    const pelvis: Pt = [43, 71];
    const neck = neckAt(pelvis, -22);
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: [48, G], rFoot: [46.6, G], lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'left', rArm: 'left', lLeg: 'right', rLeg: 'right' } }, UPPER);
  })();
  const end = (() => {
    const pelvis: Pt = [49.5, 54];
    const neck = neckAt(pelvis, 28);
    const knee = at(pelvis, 22, 14.4);
    const foot = at(knee, 158, 14.2);
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: foot, rFoot: back(foot, 1.2, 0.4), lToe: [-0.6, 0.8], rToe: [-0.6, 0.8], joints: { lLeg: knee, rLeg: back(knee, 1.2, 0.4) }, bend: { lArm: 'left', rArm: 'left' } }, UPPER);
  })();
  return yoga(start, end);
}

/** Side Crow: from a twisted squat, both knees rest on the side of one arm and the folded, stacked legs float behind. */
function sideCrow(): FigureSpec {
  const hands: Pt = [60, G];
  const start = (() => {
    const pelvis: Pt = [44, 71];
    const neck = neckAt(pelvis, -22);
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: [49, G], rFoot: [47.6, G], lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'left', rArm: 'left', lLeg: 'right', rLeg: 'right' } }, ['lArm', 'rArm', 'torso']);
  })();
  const end = (() => {
    const neck: Pt = [66.5, 66];
    const pelvis = at(neck, 196, TORSO);
    const knee = at(pelvis, 8, 14.4);
    const foot = at(knee, 172, 14.2);
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: foot, rFoot: back(foot, 0.6, -2.4), lToe: [-1, 0], rToe: [-1, 0], joints: { lLeg: knee, rLeg: back(knee, 0.6, -2.4) }, bend: { lArm: 'left', rArm: 'left' } }, ['lArm', 'rArm', 'torso']);
  })();
  return yoga(start, end);
}

/** Shoulder-Pressing Pose: the thighs sit high on the upper arms and the feet lift off the floor, ankles crossed in front. */
function shoulderPressPose(lifted: boolean, focus: Part[] = ['lArm', 'rArm', 'lLeg', 'rLeg']): Drawn {
  const hands: Pt = [57, G];
  const pelvis: Pt = lifted ? [37, 60] : [38, 64];
  const neck = neckAt(pelvis, lifted ? 5 : 0);
  const feet: Pt = lifted ? [63, 69] : [55, G];
  return S(
    { neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: feet, rFoot: back(feet, -1.2, lifted ? -1.2 : 0), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'left', rArm: 'left', lLeg: 'up', rLeg: 'up' } },
    focus,
  );
}

function shoulderPress(): FigureSpec {
  return yoga(shoulderPressPose(false), shoulderPressPose(true));
}

/** Firefly: from Shoulder-Pressing Pose, the arms straighten and both legs extend forward, straight and high. */
function firefly(): FigureSpec {
  const focus: Part[] = ['lLeg', 'rLeg', 'lArm', 'rArm'];
  const end = (() => {
    const hands: Pt = [57, G];
    const pelvis: Pt = [36.5, 55.5];
    const neck = neckAt(pelvis, 17);
    const foot = at(pelvis, -12, LEG);
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: foot, rFoot: back(foot, -0.6, 1.6), lToe: [0.9, -0.3], rToe: [0.9, -0.3], bend: { lArm: 'left', rArm: 'left' } }, focus);
  })();
  return yoga(shoulderPressPose(true, focus), end);
}

/** Eight-Angle: one leg hooked over the near arm, ankles crossed; the hips lift, the chest lowers level and the legs straighten to the side. */
function eightAngle(): FigureSpec {
  const focus: Part[] = ['lArm', 'rArm', 'lLeg', 'rLeg'];
  const start = (() => {
    const pelvis: Pt = [46, 74];
    const neck = neckAt(pelvis, -150);
    const hand: Pt = [33, G];
    return S({ neck, pelvis, lHand: hand, rHand: back(hand, 5, 0), lFoot: [70, 80], rFoot: [70.4, 77.8], lToe: [1, -0.3], rToe: [1, -0.3], bend: { lArm: 'right', rArm: 'right', lLeg: 'up', rLeg: 'up' } }, focus);
  })();
  const end = (() => {
    const pelvis: Pt = [47, 64];
    const neck = neckAt(pelvis, 172);
    const foot = at(pelvis, -8, LEG);
    return S({ neck, pelvis, lHand: [32, G], rHand: [37, G], lFoot: foot, rFoot: back(foot, 0.4, 2.2), lToe: [1, -0.3], rToe: [1, -0.3], bend: { lArm: 'right', rArm: 'right' } }, focus);
  })();
  return yoga(start, end);
}

/** Flying Pigeon: the near shin across the arms, the far leg lifting straight back as the chest tips forward. */
function flyingPigeon(): FigureSpec {
  const hands: Pt = [62, G];
  const pose = (pelvis: Pt, deg: number, farFoot: Pt) => {
    const knee = at(pelvis, -5, 14.4);
    return S(
      { neck: neckAt(pelvis, deg), pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: at(knee, 60, 13.6), rFoot: farFoot, lToe: [0.5, 0.9], rToe: [-0.8, 0.5], joints: { lLeg: knee }, bend: { lArm: 'left', rArm: 'left', rLeg: 'down' } },
      ['lArm', 'rArm', 'rLeg'],
    );
  };
  return yoga(pose([43, 55], 25, [40, G]), pose([46, 59], 20, at([46, 59], 192, LEG)));
}

/* ------------------------------------------------------------------ */
/* Inversions                                                          */
/* ------------------------------------------------------------------ */

/** Downward-Facing Dog: from all fours, the hips lift up and back into an upside-down V, arms and back in one line. */
function downDog(): FigureSpec {
  const pelvis: Pt = [48, 58.5];
  const dir = unit(sub([pelvis[0] + 35.2, G], pelvis));
  const hands = add(pelvis, mul(dir, TORSO + 1.2 + ARM - 0.4));
  const start = (() => {
    const neck: Pt = [hands[0] - 0.6, hands[1] - ARM - 1.2];
    const hips = toward(neck, [60.5, 66.5], TORSO);
    return S({ neck, pelvis: hips, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: [47, G], rFoot: [45.6, G], lToe: [-1, 0], rToe: [-1, 0], joints: { lLeg: [61, 82], rLeg: [59.6, 82] } }, SIDE_BODY);
  })();
  const end = (() => {
    const neck = add(pelvis, mul(dir, TORSO));
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: [36, G], rFoot: [34.6, G], lToe: [1, 0.15], rToe: [1, 0.15], bend: { lLeg: 'left', rLeg: 'left' } }, SIDE_BODY);
  })();
  return yoga(start, end);
}

/** Dolphin: Downward Dog on the forearms, the hips lifting high as the feet walk in. */
function dolphin(): FigureSpec {
  const elbow: Pt = [63, 82.5];
  const hand: Pt = [74, 83.5];
  const pose = (pelvis: Pt, feet: Pt) => {
    const neck = toward(pelvis, [elbow[0] + 5, elbow[1] - 3], TORSO);
    return S(
      { neck, pelvis, lHand: hand, rHand: back(hand, -1.4, 0), lFoot: feet, rFoot: back(feet, -1.4, 0), lToe: [1, 0.15], rToe: [1, 0.15], joints: { lArm: elbow, rArm: back(elbow, -1.4, 0) }, bend: { lLeg: 'left', rLeg: 'left' } },
      ['lArm', 'rArm', 'torso'],
    );
  };
  return yoga(pose([44, 57], [24, G]), pose([49, 52], [32, G]));
}

/** Forearm Stand: from Dolphin with the feet walked in, the legs float up over the shoulders. */
function forearmStand(): FigureSpec {
  const elbow: Pt = [52, 82.5];
  const hand: Pt = [63, 83.5];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt) =>
    S({ neck, pelvis, lHand: hand, rHand: back(hand, -1.4, 0), lFoot: feet, rFoot: back(feet, -1, 1), lToe: [0.2, -1], rToe: [0.2, -1], joints: { lArm: elbow, rArm: back(elbow, -1.4, 0) }, bend: { lLeg: 'left', rLeg: 'left' } }, ['lArm', 'rArm', 'torso']);
  const walked: Pt = [53.5, 71.5];
  const up: Pt = [52.6, 72];
  return yoga(pose(walked, at(walked, 250, TORSO), [38, G]), pose(up, [52, 50], [52.5, 50 - LEG]));
}

/** Scorpion: from Forearm Stand, the knees bend and the back arches until the feet drop towards the head. */
function scorpion(): FigureSpec {
  const elbow: Pt = [52, 82.5];
  const hand: Pt = [63, 83.5];
  const pose = (neck: Pt, pelvis: Pt, feet: Pt, knee?: Pt) =>
    S(
      { neck, pelvis, lHand: hand, rHand: back(hand, -1.4, 0), lFoot: feet, rFoot: back(feet, -1, 1), lToe: [0.6, 0.8], rToe: [0.6, 0.8], joints: { lArm: elbow, rArm: back(elbow, -1.4, 0), ...(knee ? { lLeg: knee, rLeg: back(knee, -1, 1) } : {}) } },
      ['torso', 'lLeg', 'rLeg'],
    );
  const archNeck: Pt = [55.5, 72];
  const archPelvis = at(archNeck, 239, TORSO);
  const knee = at(archPelvis, -118, 14.6);
  return yoga(pose([52.6, 72], [52, 50], [52.5, 50 - LEG]), pose(archNeck, archPelvis, at(knee, 12, 14.3), knee));
}

/** Supported Headstand: forearms and the crown of the head down, the knees draw in and the legs rise straight up. */
function headstand(): FigureSpec {
  const elbow: Pt = [44.5, 82.5];
  const hands: Pt = [54.5, 81.5];
  const neck: Pt = [53.5, 75.5];
  const pelvis: Pt = [54.5, 53.5];
  const pose = (feet: Pt, knee?: Pt) =>
    S(
      { neck, pelvis, head: [53.8, HEAD_DOWN], lHand: hands, rHand: back(hands, 1.2, 0), lFoot: feet, rFoot: back(feet, -1, 1), lToe: [0.2, -1], rToe: [0.2, -1], joints: { lArm: elbow, rArm: back(elbow, 1.2, 0), ...(knee ? { lLeg: knee, rLeg: back(knee, -1, 1) } : {}) } },
      ['lArm', 'rArm', 'torso'],
    );
  const knee: Pt = [66, 45];
  return yoga(pose(at(knee, 130, 14), knee), pose([56, 53.5 - LEG]));
}

/** Tripod Headstand: the head and both hands make a triangle; the knees leave the arms and the legs rise to vertical. */
function tripodHeadstand(): FigureSpec {
  const hands: Pt = [62, G];
  const neck: Pt = [51.5, 73];
  const pelvis: Pt = [53, 51];
  const pose = (feet: Pt, knee?: Pt) =>
    S(
      { neck, pelvis, head: [51, HEAD_DOWN], lHand: hands, rHand: back(hands, -1.4, 0), lFoot: feet, rFoot: back(feet, -1, 1), lToe: [0.2, -1], rToe: [0.2, -1], joints: knee ? { lLeg: knee, rLeg: back(knee, -1, 1) } : undefined, bend: { lArm: 'up', rArm: 'up' } },
      ['lArm', 'rArm', 'torso'],
    );
  return yoga(pose([47, 55], [61, 62]), pose([55, 22]));
}

/** Handstand: from Downward Dog, a hop brings the hips over the shoulders and the legs together overhead. */
function handstandFigure(): FigureSpec {
  const hands: Pt = [56, G];
  const start = (() => {
    const pelvis: Pt = [37, 55];
    const neck = toward(pelvis, [hands[0] + 2, 66], TORSO);
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: [30, G], rFoot: at(pelvis, 205, LEG), lToe: [1, 0.15], rToe: [-0.8, 0.4], bend: { lLeg: 'left', rLeg: 'down' } }, ['lArm', 'rArm', 'torso']);
  })();
  const end = (() => {
    const neck: Pt = [hands[0], hands[1] - ARM - 1.2];
    const pelvis: Pt = [neck[0] + 1, neck[1] - TORSO];
    return S({ neck, pelvis, lHand: hands, rHand: back(hands, -1.4, 0), lFoot: [pelvis[0] + 1, pelvis[1] - LEG], rFoot: [pelvis[0] - 0.4, pelvis[1] - LEG + 0.6], lToe: [0.2, -1], rToe: [0.2, -1] }, ['lArm', 'rArm', 'torso']);
  })();
  return yoga(start, end);
}

/** Legs Up the Wall: lying on the back beside a wall, the legs swing up and rest straight up it. */
function legsUpWall(): FigureSpec {
  const pelvis: Pt = [80, FLAT];
  const neck: Pt = [58, FLAT];
  const sh = shoulderOf(neck, pelvis);
  const pose = (feet: Pt, knee?: Pt) =>
    S({ neck, pelvis, head: [49.4, HEAD_DOWN], lHand: reach(sh, [79.5, 83]), rHand: reach(sh, [80.5, 83]), lFoot: feet, rFoot: back(feet, -1, 0.6), lToe: [0, -1], rToe: [0, -1], joints: knee ? { lLeg: knee, rLeg: back(knee, -1, 0.6) } : undefined }, LEGS);
  return yoga(pose([82.5, 64], [72, 70]), pose([82.6, 52.4]), { wall: `${WALL_RIGHT} ${FLOOR}`, seconds: 4.4 });
}

/** Supported Shoulder Stand: on a folded blanket, the hips lift over the shoulders, the hands support the back and the legs straighten up. */
function shoulderStand(): FigureSpec {
  const neck: Pt = [44, 79];
  const pelvis: Pt = [46, 57];
  const elbow: Pt = [54, 80];
  const pose = (feet: Pt, knee?: Pt) =>
    S(
      { neck, pelvis, head: [34.6, 80.2], lHand: [48.5, 70], rHand: [47.5, 71], lFoot: feet, rFoot: back(feet, -1, 0.8), lToe: [0, -1], rToe: [0, -1], joints: { lArm: elbow, rArm: back(elbow, -1, 0), ...(knee ? { lLeg: knee, rLeg: back(knee, -1, 0.8) } : {}) } },
      ['torso', 'lLeg', 'rLeg'],
    );
  const knee: Pt = [36, 47];
  return yoga(pose(at(knee, 100, 14), knee), pose([47.5, 57 - LEG]), { wall: `${BLANKET} ${FLOOR}` });
}

/** Plow: from Shoulder Stand, the straight legs lower over the head until the toes reach the floor behind. */
function plow(): FigureSpec {
  const neck: Pt = [44, 79];
  const pelvis: Pt = [46, 57];
  const elbow: Pt = [54, 80];
  const pose = (feet: Pt, toe: Pt) =>
    S(
      { neck, pelvis, head: [34.6, 80.2], lHand: [48.5, 70], rHand: [47.5, 71], lFoot: feet, rFoot: back(feet, -1, 0.8), lToe: toe, rToe: toe, joints: { lArm: elbow, rArm: back(elbow, -1, 0) } },
      ['torso', 'lLeg', 'rLeg'],
    );
  return yoga(pose([47.5, 57 - LEG], [0, -1]), pose(reach(pelvis, [21, 81.5], LEG), [-1, 0.5]), { wall: `${BLANKET} ${FLOOR}` });
}

/* ------------------------------------------------------------------ */
/* Every pose's drawing                                                */
/* ------------------------------------------------------------------ */

const FIGURES: Record<string, () => FigureSpec> = {
  yoga_mountain: mountain,
  yoga_chair: chair,
  yoga_goddess: goddess,
  yoga_warrior_1: warrior1,
  yoga_warrior_2: warrior2,
  yoga_reverse_warrior: reverseWarrior,
  yoga_triangle: triangle,
  yoga_side_angle: sideAngle,
  yoga_tree: tree,
  yoga_eagle: eagle,
  yoga_warrior_3: warrior3,
  yoga_half_moon: halfMoon,
  yoga_hand_to_toe: handToToe,
  yoga_standing_split: standingSplit,
  yoga_dancer: dancer,
  yoga_bird_of_paradise: birdOfParadise,

  yoga_standing_fold: standingFold,
  yoga_pyramid: pyramid,
  yoga_wide_fold: wideFold,
  yoga_staff: staff,
  yoga_child: child,
  yoga_seated_fold: seatedFold,
  yoga_head_to_knee: headToKnee,
  yoga_wide_angle: wideAngle,
  yoga_tortoise: tortoise,
  yoga_boat: boat,
  yoga_heron: heron,

  yoga_low_lunge: lowLunge,
  yoga_half_splits: halfSplits,
  yoga_lizard: lizard,
  yoga_front_splits: frontSplits,
  yoga_bound_angle: boundAngle,
  yoga_happy_baby: happyBaby,
  yoga_garland: garland,
  yoga_pigeon: pigeon,
  yoga_fire_log: fireLog,
  yoga_half_lotus: halfLotus,
  yoga_lotus: lotus,
  yoga_side_lunge: sideLunge,
  yoga_middle_splits: middleSplits,

  yoga_supine_twist: supineTwist,
  yoga_seated_twist: seatedTwist,
  yoga_half_lord: halfLord,
  yoga_marichi: marichi,
  yoga_revolved_chair: revolvedChair,
  yoga_revolved_lunge: revolvedLunge,
  yoga_revolved_triangle: revolvedTriangle,
  yoga_revolved_side_angle: revolvedSideAngle,
  yoga_revolved_half_moon: revolvedHalfMoon,

  yoga_cat_cow: catCow,
  yoga_bridge: bridge,
  yoga_fish: fish,
  yoga_camel: camel,
  yoga_wild_thing: wildThing,
  yoga_wheel: wheel,
  yoga_king_pigeon: kingPigeon,
  yoga_sphinx: sphinx,
  yoga_cobra: cobra,
  yoga_locust: locust,
  yoga_upward_dog: upwardDog,
  yoga_bow: bow,

  yoga_plank: plank,
  yoga_side_plank: sidePlank,
  yoga_chaturanga: chaturanga,
  yoga_crow: crow,
  yoga_side_crow: sideCrow,
  yoga_shoulder_press: shoulderPress,
  yoga_firefly: firefly,
  yoga_eight_angle: eightAngle,
  yoga_flying_pigeon: flyingPigeon,

  yoga_down_dog: downDog,
  yoga_dolphin: dolphin,
  yoga_forearm_stand: forearmStand,
  yoga_scorpion: scorpion,
  yoga_headstand: headstand,
  yoga_tripod_headstand: tripodHeadstand,
  yoga_handstand: handstandFigure,
  yoga_legs_up_wall: legsUpWall,
  yoga_shoulder_stand: shoulderStand,
  yoga_plow: plow,
};

/** Bridge: lying on the back with the knees bent, the hips lift until the shoulders, hips and knees line up. */
function bridge(): FigureSpec {
  const feet: Pt = [66, G];
  const pose = (pelvis: Pt, neck: Pt, head: Pt) => {
    const hand = reach(shoulderOf(neck, pelvis), [61, 83]);
    return S({ neck, pelvis, head, lHand: hand, rHand: back(hand, -1, 0), lFoot: feet, rFoot: back(feet, -1.5, 0), lToe: [1, 0], rToe: [1, 0], bend: { lLeg: 'up', rLeg: 'up' } }, CORE);
  };
  const lifted: Pt = [52, 62];
  return yoga(pose([52, FLAT], [30, FLAT], [21.4, HEAD_DOWN]), pose(lifted, neckAt(lifted, 127.3), [31.5, HEAD_DOWN]));
}

/** Wheel: from lying on the back with the hands by the ears, the body presses up into a full arch. */
function wheel(): FigureSpec {
  const feet: Pt = [68, G];
  const pose = (pelvis: Pt, neck: Pt, hand: Pt, head?: Pt) => {
    const reached = reach(shoulderOf(neck, pelvis), hand);
    return S({ neck, pelvis, head, lHand: reached, rHand: back(reached, 1.2, 0), lFoot: feet, rFoot: back(feet, -1.5, 0), lToe: [1, 0], rToe: [1, 0], bend: { lLeg: 'up', rLeg: 'up', lArm: 'up', rArm: 'up' } }, UPPER);
  };
  const arched: Pt = [56, 57.4];
  return yoga(pose([52, FLAT], [30, FLAT], [27.5, G], [21.4, HEAD_DOWN]), pose(arched, toward(arched, [30, 68], TORSO), [27.5, G]));
}

/** One-Legged King Pigeon: from Pigeon, the back knee bends, the foot rises and both hands reach back for it as the chest arches. */
function kingPigeon(): FigureSpec {
  const pelvis: Pt = [45, 78];
  const knee: Pt = [30.5, 82];
  const pose = (deg: number, footDeg: number, hand: (sh: Pt, foot: Pt) => Pt) => {
    const neck = neckAt(pelvis, deg);
    const foot = at(knee, footDeg, 14.3);
    const reached = hand(shoulderOf(neck, pelvis), foot);
    return S(
      { neck, pelvis, lHand: reached, rHand: back(reached, 1, 0.4), lFoot: [47, G], rFoot: foot, lToe: [-1, 0.1], rToe: footDeg < 0 ? [0.3, -1] : [-1, 0], joints: { lLeg: [58, 82], rLeg: knee }, bend: { lArm: 'up', rArm: 'up' } },
      ['torso', 'rLeg', 'lArm', 'rArm'],
    );
  };
  return yoga(
    pose(-70, 178, (sh) => reach(sh, [58, 80])),
    pose(-122, -82, (sh, foot) => reach(sh, [foot[0] + 0.5, foot[1] + 0.5])),
  );
}

const fixed = new Map<string, FigureSpec | undefined>();

/** The pose as the first frame, held there, moving out to the way in and back. */
const poseFirst = (spec: FigureSpec): FigureSpec =>
  spec.motion ? { ...spec, strokes: spec.motion.strokes, discs: spec.motion.discs, motion: { ...spec.motion, strokes: spec.strokes, discs: spec.discs ?? [], held: 'start' } } : spec;

/** A pose's drawing as the app shows it: with its studio fix, when it has one, and the pose first. */
export function yogaFigure(id: string): FigureSpec | undefined {
  if (!fixed.has(id)) fixed.set(id, FIGURES[id] && poseFirst(patched(id, FIGURES[id]())));
  return fixed.get(id);
}

/** The figure exactly as drawn here, before any studio fix: for the figure studio. */
export function yogaFigureAsBuilt(id: string): FigureSpec | undefined {
  return FIGURES[id]?.();
}

/** Every pose id that has a drawing. */
export const YOGA_FIGURE_IDS = Object.keys(FIGURES);
