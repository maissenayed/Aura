import { FigureSpec, Pt } from './SkillFigure';
import { Pose, climber, figure, hold, pelvisToward } from './figureKit';

/**
 * Animated drawings for the first beginner calisthenics exercises. Each one
 * has a start pose and an end pose with the same limbs; `SkillFigure` moves
 * between them on a loop in the details panel. Side views face right.
 *
 * Keyed by exercise id from the built-in dataset; an exercise without an entry
 * simply has no drawing.
 */

const FLOOR = 'M0,86 L100,86 L100,100 L0,100 Z';
const GROUND = 84;
const BAR = 'M10,12.6 L90,12.6 L90,15.4 L10,15.4 Z';
const PARALLEL_BARS =
  'M22,49 L78,49 L78,51.6 L22,51.6 Z M26,51.6 L28.4,51.6 L28.4,90 L26,90 Z M71.6,51.6 L74,51.6 L74,90 L71.6,90 Z M0,90 L100,90 L100,100 L0,100 Z';

/** A side-on pose; the far arm and leg sit a little behind the near ones. */
const side = (pose: Omit<Pose, 'turn'>): Pose => ({ ...pose, turn: 1 });

const behind = (p: Pt, dx = -1.5, dy = 0): Pt => [p[0] + dx, p[1] + dy];

const FIGURES: Record<string, FigureSpec> = {
  /* Regular Pushups: a rigid plank pivoting on the toes. */
  ex_7: (() => {
    const feet: Pt = [17, GROUND];
    const hands: Pt = [64, GROUND];
    const pose = (neck: Pt) =>
      climber(
        side({ neck, pelvis: pelvisToward(neck, feet), lHand: hands, rHand: behind(hands), lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: 'up', rArm: 'up' } }),
        ['lArm', 'rArm', 'torso'],
      );
    return figure({
      scene: 'floor',
      wall: FLOOR,
      people: [pose([63.3, 61.5])],
      motion: { people: [pose([67.9, 76])], seconds: 2.4 },
    });
  })(),

  /* Pike Push Up: hips high, the head travels down in front of the hands. */
  ex_427: (() => {
    const feet: Pt = [29, GROUND];
    const hands: Pt = [72.6, GROUND];
    const pose = (pelvis: Pt, neck: Pt) =>
      climber(
        side({ neck, pelvis, lHand: hands, rHand: behind(hands), lFoot: feet, rFoot: behind(feet, 1.5), bend: { lArm: 'up', rArm: 'up', lLeg: 'left', rLeg: 'left' } }),
        ['lArm', 'rArm', 'torso'],
      );
    return figure({
      scene: 'floor',
      wall: FLOOR,
      people: [pose([38, 56], [55.1, 69.8])],
      motion: { people: [pose([44, 60], [61.6, 73.2])], seconds: 2.6 },
    });
  })(),

  /* Jump Pull-ups: from standing under the bar to chin over it. */
  ex_5: (() => {
    const pose = (neck: Pt, pelvis: Pt, lFoot: Pt, rFoot: Pt) =>
      climber({ neck, pelvis, lHand: [40, 14], rHand: [60, 14], lFoot, rFoot, bend: { lArm: 'down', rArm: 'down' } }, ['lArm', 'rArm']);
    return figure({
      scene: 'bar',
      wall: `${BAR} M0,90 L100,90 L100,100 L0,100 Z`,
      people: [pose([50, 37], [50, 59], [44, 88], [56, 88])],
      motion: { people: [pose([50, 17.5], [50, 39.5], [46, 68], [54, 68])], seconds: 2.2 },
    });
  })(),

  /* Scapular Pull: arms stay straight, the shoulder blades pull the body up a little. */
  ex_380: (() => {
    const pose = (y: number, active: boolean) =>
      climber(
        {
          neck: [50, y],
          pelvis: [50, y + 22],
          lHand: [40, 14],
          rHand: [60, 14],
          lFoot: [47, y + 50.5],
          rFoot: [53, y + 50.5],
          // Straight arms that get shorter as the shoulders drop away from the ears.
          joints: active ? { lArm: [41.75, (14 + y) / 2], rArm: [58.25, (14 + y) / 2] } : undefined,
        },
        ['torso'],
      );
    return figure({
      scene: 'bar',
      wall: BAR,
      people: [pose(36.5, false)],
      arrows: [
        { d: 'M32,44 L32,35' },
        { d: 'M68,44 L68,35' },
      ],
      motion: { people: [pose(31, true)], seconds: 2 },
    });
  })(),

  /* Row Eccentric: chest at the bar, then a slow lowering to straight arms. */
  ex_4: (() => {
    const feet: Pt = [12, GROUND];
    const bar: Pt = [70, 52];
    const pose = (neck: Pt) =>
      climber(
        side({
          neck,
          pelvis: pelvisToward(neck, feet),
          lHand: bar,
          rHand: behind(bar, -1, 0.5),
          lFoot: feet,
          rFoot: behind(feet, 1.5),
          lToe: [0.25, -1],
          rToe: [0.25, -1],
          bend: { lArm: 'down', rArm: 'down' },
        }),
        ['lArm', 'rArm', 'torso'],
      );
    return figure({
      scene: 'bar',
      wall: `M69,54 L71,54 L71,86 L69,86 Z ${FLOOR}`,
      holds: [hold(bar[0], bar[1], 'bar', { key: true })],
      people: [pose([58, 62])],
      motion: { people: [pose([61, 74])], seconds: 3.2, tempo: 'slow-return' },
    });
  })(),

  /* Parallel Bars Jump Dips: from straight-arm support down to bent elbows, leaning forward. */
  ex_8: (() => {
    const hands: Pt = [50, 49.5];
    const pose = (neck: Pt, pelvis: Pt, lFoot: Pt, rFoot: Pt) =>
      climber(
        side({ neck, pelvis, lHand: hands, rHand: behind(hands), lFoot, rFoot, bend: { lArm: 'left', rArm: 'left', lLeg: 'right', rLeg: 'right' } }),
        ['lArm', 'rArm', 'torso'],
      );
    return figure({
      scene: 'bars',
      wall: PARALLEL_BARS,
      people: [pose([50, 27.5], [48, 49.5], [40, 74], [38, 72])],
      motion: { people: [pose([55, 40], [44, 59], [36, 82], [34, 80])], seconds: 2.6 },
    });
  })(),

  /* Parallel Squat: hips back and down until the thighs are level, arms forward for balance. */
  ex_11: (() => {
    const feet: Pt = [48, GROUND];
    const pose = (pelvis: Pt, neck: Pt) => {
      const reach: Pt = [neck[0] + 22, neck[1] + 1];
      return climber(
        side({ neck, pelvis, lHand: reach, rHand: behind(reach, -1, 1.5), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lLeg: 'right', rLeg: 'right' } }),
        ['lLeg', 'rLeg'],
      );
    };
    return figure({
      scene: 'floor',
      wall: FLOOR,
      people: [pose([47, 55], [48, 33])],
      motion: { people: [pose([36, 68], [47.7, 49.3])], seconds: 2.6 },
    });
  })(),

  /* Lunges: drop the back knee towards the floor, front shin upright. */
  ex_14: (() => {
    const front: Pt = [64, GROUND];
    const back: Pt = [27, GROUND];
    const pose = (pelvis: Pt) => {
      const neck: Pt = [pelvis[0], pelvis[1] - 22];
      const hip: Pt = [pelvis[0] + 3, pelvis[1] - 1];
      return climber(
        side({
          neck,
          pelvis,
          lHand: hip,
          rHand: behind(hip),
          lFoot: front,
          rFoot: back,
          lToe: [1, 0],
          rToe: [1, -0.25],
          bend: { lArm: 'right', rArm: 'right', lLeg: 'up', rLeg: 'down' },
        }),
        ['lLeg', 'rLeg'],
      );
    };
    return figure({
      scene: 'floor',
      wall: FLOOR,
      people: [pose([46, 61])],
      motion: { people: [pose([45, 70])], seconds: 2.6 },
    });
  })(),

  /* Glute Bridge: lying down, push the hips up until shoulders, hips and knees line up. */
  ex_12: (() => {
    const feet: Pt = [72, GROUND];
    const hands: Pt = [52, GROUND];
    const pose = (pelvis: Pt, neck: Pt) =>
      climber(
        side({ neck, pelvis, lHand: hands, rHand: behind(hands), lFoot: feet, rFoot: behind(feet, 1.5), lToe: [1, 0], rToe: [1, 0], bend: { lArm: 'down', rArm: 'down', lLeg: 'up', rLeg: 'up' } }),
        ['torso', 'lLeg', 'rLeg'],
      );
    const raised: Pt = [55, 64];
    return figure({
      scene: 'floor',
      wall: FLOOR,
      people: [pose([52, 81], [30, 81])],
      motion: { people: [pose(raised, pelvisToward(raised, [34, 80]))], seconds: 2.4 },
    });
  })(),

  /* Floor Tuck Raises: lying down, bring the knees from straight out to the chest. */
  ex_15: (() => {
    const hands: Pt = [50, GROUND];
    const pose = (lFoot: Pt) =>
      climber(
        side({ neck: [28, 81], pelvis: [50, 81], lHand: hands, rHand: behind(hands), lFoot, rFoot: behind(lFoot, 1.5), bend: { lLeg: 'up', rLeg: 'up' } }),
        ['torso', 'lLeg', 'rLeg'],
      );
    return figure({
      scene: 'floor',
      wall: FLOOR,
      people: [pose([78, 79])],
      motion: { people: [pose([54, 66])], seconds: 2.2 },
    });
  })(),
};

export function calisthenicsFigure(id: string): FigureSpec | undefined {
  return FIGURES[id];
}

export const CALISTHENICS_FIGURE_IDS = Object.keys(FIGURES);
