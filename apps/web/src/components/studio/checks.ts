import { apparatusOf, barAcross, bonesAt, rigOf, stageMove, stagesFor } from '../game/figureRig';
import type { FigureSpec, Pt, Stroke } from '../skilltree/SkillFigure';
import { PoseKey, dist, frameAt, isBody, limbGeo, limbNames, partLabel, poseOf } from './geometry';

/**
 * What looks wrong with a figure, found from its numbers: poses that don't
 * match (the animation snaps), a rig the gear can't sit on, bones that
 * stretch, a body floating off the floor or sinking into it, hands off the bar
 * or out of the rings, a body leaving the frame, and a stage's equipment
 * running through the athlete.
 */

export type Level = 'error' | 'warn' | 'info';

export interface Finding {
  level: Level;
  code: string;
  text: string;
  pose?: PoseKey;
  /** Where to look, in the figure's box. */
  at?: Pt;
}

const UPPER_ARM = 11.5;
const FOREARM = 11;
const THIGH = 15;
const SHIN = 14.5;

const POSE_WORD: Record<PoseKey, string> = { start: 'start pose', end: 'end pose' };
const fmt = (value: number) => (Math.round(value * 10) / 10).toString();

/** Solid scenery as boxes: what a foot, hand or head can rest on. */
function surfaces(wall?: string): { x1: number; x2: number; top: number }[] {
  if (!wall) return [];
  return wall
    .split(/(?=M)/)
    .map((part) => (part.match(/-?\d+(\.\d+)?/g) ?? []).map(Number))
    .filter((nums) => nums.length >= 4)
    .map((nums) => {
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      return { x1: Math.min(...xs), x2: Math.max(...xs), top: Math.min(...ys), h: Math.max(...ys) - Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) };
    })
    // Thin uprights (posts, a rope) hold nothing up.
    .filter((box) => box.w > 4);
}

/** How far above the surface under it a point's lowest edge is (negative: into it). Surfaces well above the point don't count. */
const gapAt = (boxes: ReturnType<typeof surfaces>, x: number, bottom: number) => {
  const gaps = boxes.filter((box) => x >= box.x1 - 0.5 && x <= box.x2 + 0.5).map((box) => box.top - bottom).filter((gap) => gap >= -4);
  return gaps.length ? Math.min(...gaps) : null;
};

export function checkFigure(spec: FigureSpec): Finding[] {
  const out: Finding[] = [];
  const poses: PoseKey[] = spec.motion ? ['start', 'end'] : ['start'];
  const closeUp = spec.scene === 'close-up';

  /* The two poses must list the same shapes, in the same order, with the same number of points. */
  if (spec.motion) {
    const a = spec.strokes;
    const b = spec.motion.strokes;
    if (a.length !== b.length) out.push({ level: 'error', code: 'mismatch', text: `The start pose has ${a.length} strokes and the end pose ${b.length}: the animation can't pair them.` });
    const restyled: number[] = [];
    a.forEach((stroke, i) => {
      const other = b[i];
      if (!other) return;
      if (other.pts.length !== stroke.pts.length)
        out.push({ level: 'error', code: 'mismatch', text: `Stroke ${i} has ${stroke.pts.length} points in the start pose and ${other.pts.length} in the end pose, so it snaps instead of moving.`, at: stroke.pts[0] });
      else if (Boolean(other.closed) !== Boolean(stroke.closed) || other.tone !== stroke.tone || Boolean(other.far) !== Boolean(stroke.far)) restyled.push(i);
    });
    if (restyled.length)
      out.push({
        level: 'warn',
        code: 'mismatch',
        text: `${restyled.length === 1 ? `Stroke ${restyled[0]} changes` : `Strokes ${restyled.join(', ')} change`} look between the poses (near or far side, tone, fill). Only shapes animate, so the whole move is drawn in the start pose's style.`,
      });
    const da = spec.discs?.length ?? 0;
    if (da !== spec.motion.discs.length) out.push({ level: 'error', code: 'mismatch', text: `The start pose has ${da} discs and the end pose ${spec.motion.discs.length}.` });
  }
  if (closeUp) return out;

  /* The rig: what gear and stages are placed on. */
  const rig = rigOf(spec);
  if (!rig) {
    out.push({ level: 'warn', code: 'rig', text: 'No torso found, so worn gear and stages are never drawn on this figure.' });
    return out;
  }
  const names = limbNames(rig, spec);
  const arms = rig.limbs.filter((limb) => limb.arm).length;
  const legs = rig.limbs.length - arms;
  if (arms !== 2 || legs !== 2)
    out.push({ level: 'warn', code: 'rig', text: `The rig reads ${arms} arm${arms === 1 ? '' : 's'} and ${legs} leg${legs === 1 ? '' : 's'}: sleeves and tape go on what it reads.` });
  if (rig.head === null) out.push({ level: 'warn', code: 'rig', text: 'No head found, so a headband is never drawn.' });

  /* Bones: each keeps its length, against the figure's own scale and between the poses. */
  const lengths = poses.map((key) => {
    const geo = poseOf(spec, key);
    return rig.limbs.map((limb) => {
      const g = limbGeo(geo, limb);
      return { upper: dist(g.joint, g.root), lower: dist(g.end, g.joint), span: dist(g.end, g.root), g };
    });
  });
  const ratios = lengths[0].flatMap((bone, i) => [bone.upper / (rig.limbs[i].arm ? UPPER_ARM : THIGH), bone.lower / (rig.limbs[i].arm ? FOREARM : SHIN)]).sort((x, y) => x - y);
  const k = ratios[Math.floor(ratios.length / 2)] || 1;
  poses.forEach((key, p) => {
    lengths[p].forEach((bone, i) => {
      const arm = rig.limbs[i].arm;
      const parts: [string, number, number][] = [
        [arm ? 'upper arm' : 'thigh', bone.upper, arm ? UPPER_ARM : THIGH],
        [arm ? 'forearm' : 'shin', bone.lower, arm ? FOREARM : SHIN],
      ];
      parts.forEach(([part, length, standard]) => {
        const off = length / (standard * k) - 1;
        // Longer is always a fault (a bone can't grow); shorter can be meant, a limb foreshortened by a joint set by hand.
        if (Math.abs(off) > 0.14)
          out.push({
            level: off > 0 ? 'warn' : 'info',
            code: 'stretch',
            pose: key,
            at: bone.g.joint,
            text:
              off > 0
                ? `${names[i]}: the ${part} is ${fmt(off * 100)}% longer than it should be in the ${POSE_WORD[key]}${bone.span >= bone.upper + bone.lower - 0.1 ? ' (out of reach: the limb is pulled straight)' : ''}.`
                : `${names[i]}: the ${part} is ${fmt(-off * 100)}% shorter than the body's other bones in the ${POSE_WORD[key]} (foreshortened, or a joint set by hand).`,
          });
      });
    });
  });
  if (spec.motion) {
    lengths[0].forEach((bone, i) => {
      const end = lengths[1][i];
      const arm = rig.limbs[i].arm;
      const change = (a: number, b: number) => Math.abs(b - a) / Math.max(a, 0.01);
      const most = Math.max(change(bone.upper, end.upper), change(bone.lower, end.lower));
      if (most > 0.08)
        out.push({
          // A tenth either way reads as a slightly bent arm; more than that, the limb visibly grows or shrinks.
          level: most > 0.2 ? 'warn' : 'info',
          code: 'stretch',
          pose: 'end',
          at: end.g.joint,
          text: `${names[i]}: the ${change(bone.upper, end.upper) >= change(bone.lower, end.lower) ? (arm ? 'upper arm' : 'thigh') : arm ? 'forearm' : 'shin'} changes length by ${fmt(most * 100)}% between the poses.`,
        });
    });
  }

  /* Half way: every point travels in a straight line between the poses, so a limb that swings a long way folds up on the way. */
  if (spec.motion) {
    const halfway = frameAt(spec, 0.5);
    lengths[0].forEach((bone, i) => {
      const g = limbGeo(halfway, rig.limbs[i]);
      const shrink = Math.max(1 - dist(g.joint, g.root) / bone.upper, 1 - dist(g.end, g.joint) / bone.lower);
      if (shrink > 0.18)
        out.push({ level: 'info', code: 'midway', at: g.joint, text: `${names[i]} shrinks by ${fmt(shrink * 100)}% half way through the move: points travel in straight lines between the two poses.` });
    });
  }

  /* On the floor: the lowest part rests on the scenery under it, neither above nor into it. */
  const boxes = surfaces(spec.wall);
  if ((spec.scene === 'floor' || spec.scene === 'ground') && boxes.length) {
    poses.forEach((key) => {
      const geo = poseOf(spec, key);
      let best: { gap: number; at: Pt } | null = null;
      const consider = (at: Pt, half: number) => {
        const gap = gapAt(boxes, at[0], at[1] + half);
        if (gap !== null && (!best || gap < best.gap)) best = { gap, at };
      };
      geo.strokes.filter(isBody).forEach((stroke: Stroke) => stroke.pts.forEach((pt) => consider(pt, stroke.width / 2)));
      geo.discs.filter((disc) => !disc.kind && disc.tone !== 'ghost').forEach((disc) => consider(disc.at, disc.r));
      // A body lying down sinks a little by design (the torso's fill reaches past the floor line); only a deep sink or a clear gap is a fault.
      if (best && best.gap > 2.5) out.push({ level: best.gap > 3.5 ? 'warn' : 'info', code: 'floor', pose: key, at: best.at, text: `Floats ${fmt(best.gap)} above the floor in the ${POSE_WORD[key]}.` });
      if (best && best.gap < -2.2) out.push({ level: best.gap < -4.5 ? 'warn' : 'info', code: 'floor', pose: key, at: best.at, text: `Sinks ${fmt(-best.gap)} into the floor in the ${POSE_WORD[key]}.` });
    });
  }

  /* On a bar: some hand grips it in each pose. */
  const ends = spec.holds?.filter((hold) => hold.shape === 'bar').map((hold) => hold.at) ?? [];
  const across = spec.scene === 'bar' ? barAcross(spec.wall) : null;
  if (spec.scene === 'bar' && (ends.length || across !== null)) {
    poses.forEach((key) => {
      const geo = poseOf(spec, key);
      const hands = rig.limbs.filter((limb) => limb.arm).map((limb) => limbGeo(geo, limb).end);
      const away = (hand: Pt) =>
        Math.min(...ends.map((at) => dist(hand, at)), across !== null && hand[0] >= 7 && hand[0] <= 93 ? Math.abs(hand[1] - across) : Infinity);
      const nearest = Math.min(...hands.map(away));
      if (hands.length && nearest > 3.4) {
        const hand = hands.reduce((a, b) => (away(a) <= away(b) ? a : b));
        out.push({ level: 'warn', code: 'bar', pose: key, at: hand, text: `No hand on the bar in the ${POSE_WORD[key]} (the nearest is ${fmt(nearest)} away).` });
      }
    });
  }

  /* Rings: each has a hand in it. */
  poses.forEach((key) => {
    const geo = poseOf(spec, key);
    const hands = rig.limbs.filter((limb) => limb.arm).map((limb) => limbGeo(geo, limb).end);
    geo.discs.forEach((disc) => {
      if (disc.kind !== 'ring' || !hands.length) return;
      const nearest = Math.min(...hands.map((hand) => dist(hand, disc.at)));
      if (nearest > 3.2) out.push({ level: 'warn', code: 'rings', pose: key, at: disc.at, text: `A ring with no hand in it in the ${POSE_WORD[key]} (the nearest hand is ${fmt(nearest)} away).` });
    });
  });

  /* The frame: the drawing is clipped at the box's edge. */
  poses.forEach((key) => {
    const geo = poseOf(spec, key);
    let worst: { by: number; side: string; at: Pt } | null = null;
    const edge = (at: Pt, half: number) => {
      const sides: [number, string][] = [
        [-(at[0] - half), 'left'],
        [at[0] + half - 100, 'right'],
        [-(at[1] - half), 'top'],
        [at[1] + half - 100, 'bottom'],
      ];
      sides.forEach(([by, side]) => {
        if (by > 1 && (!worst || by > worst.by)) worst = { by, side, at };
      });
    };
    geo.strokes.filter(isBody).forEach((stroke) => stroke.pts.forEach((pt) => edge(pt, stroke.width / 2)));
    geo.discs.filter((disc) => disc.tone !== 'ghost').forEach((disc) => edge(disc.at, disc.r));
    if (worst) out.push({ level: 'info', code: 'frame', pose: key, at: worst.at, text: `Leaves the frame at the ${worst.side} by ${fmt(worst.by)} in the ${POSE_WORD[key]}.` });
  });

  /* A pull-up station's upright and brace must clear the body. */
  if (apparatusOf(spec) === 'bar') {
    const staged = stageMove(spec, 'bar');
    const posts = (staged.frame ?? []).filter((line) => Math.abs(line.from[0] - line.to[0]) < 0.01 || line.to[1] > line.from[1] + 1);
    poses.forEach((key) => {
      const geo = poseOf(staged.spec, key);
      const bones = bonesAt(rig, geo.strokes, geo.discs);
      const hands = bones.arms.map((arm) => arm.end);
      for (const line of posts) {
        const hit = geo.strokes.filter(isBody).flatMap((stroke) =>
          stroke.pts.filter((pt) => !hands.some((hand) => dist(hand, pt) < 3) && segmentDistance(pt, line.from, line.to) < stroke.width / 2 + line.width / 2).map((pt) => pt),
        )[0];
        if (hit) {
          out.push({ level: 'warn', code: 'stage', pose: key, at: hit, text: `On the pull-up bar stage, the station's ${Math.abs(line.from[0] - line.to[0]) < 0.01 ? 'upright' : 'brace'} runs through the body in the ${POSE_WORD[key]}.` });
          break;
        }
      }
    });
  }

  /* On parallettes the pose is lifted: it has to stay in the frame. */
  if (stagesFor(spec).includes('parallettes')) {
    const staged = stageMove(spec, 'parallettes').spec;
    poses.forEach((key) => {
      const geo = poseOf(staged, key);
      const top = Math.min(...geo.strokes.filter(isBody).flatMap((stroke) => stroke.pts.map(([, y]) => y - stroke.width / 2)), ...geo.discs.map((disc) => disc.at[1] - disc.r));
      if (top < -1) out.push({ level: 'info', code: 'stage', pose: key, text: `On parallettes the body leaves the top of the frame by ${fmt(-top)} in the ${POSE_WORD[key]}.` });
    });
  }

  return out;
}

function segmentDistance(p: Pt, a: Pt, b: Pt): number {
  const ab: Pt = [b[0] - a[0], b[1] - a[1]];
  const l2 = ab[0] * ab[0] + ab[1] * ab[1];
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2)) : 0;
  return dist(p, [a[0] + ab[0] * t, a[1] + ab[1] * t]);
}

/** Each kind of finding, for filtering the figure list. */
export const CODE_LABEL: Record<string, string> = {
  mismatch: "Poses don't match",
  rig: 'Rig problems',
  stretch: 'Bones stretch or shrink',
  floor: 'Off or into the floor',
  bar: 'Hands off the bar',
  rings: 'Rings without a hand',
  stage: 'Stage clashes',
  stale: 'Stale fixes',
  frame: 'Leaves the frame',
  midway: 'Folds up mid-move',
};

export const worstLevel = (findings: Finding[]): Level | null =>
  findings.some((f) => f.level === 'error') ? 'error' : findings.some((f) => f.level === 'warn') ? 'warn' : findings.length ? 'info' : null;

export { partLabel };
