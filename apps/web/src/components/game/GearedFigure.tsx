'use client';

import React, { useMemo } from 'react';
import type { FigureSpec, MotionPlay, Pt } from '../skilltree/SkillFigure';
import type { ArmorSlot } from '../../utils/campaignV3';
import type { GearTone } from '../../data/gear';
import type { NodeState } from './kit';
import { Figure } from './kit';
import { Bones, Limb, StageKind, Staged, bonesAt, rigOf, stageMove } from './figureRig';
import type { PropTuning } from './propTuning';
import { usePropTuning } from './propTuningContext';

export type { StageKind } from './figureRig';

/**
 * The athlete's figure wearing their gear, in one drawing. The joints are read
 * from the pose itself (see `figureRig.ts`), in both of the motion's poses, so
 * every piece moves with the athlete on the same clock.
 *
 * Every piece is outlined in the page colour, so it reads as something worn on
 * any body colour and in both themes. The stage is real equipment and only
 * appears under a move it suits; the trophy and the banner stand on poles
 * beside it. Cosmetic only, like the gear itself.
 */

export interface GearLook {
  head?: GearTone;
  belt?: GearTone;
  bag?: GearTone;
  trophy?: boolean;
  banner?: GearTone;
  stage?: StageKind;
  /** This week's forged armour, in the colour of its tempering grade. */
  joints?: Partial<Record<ArmorSlot, GearTone>>;
}

export const TONE: Record<GearTone, string> = {
  chalk: 'var(--fig-tape)',
  iron: 'var(--color-ink-500)',
  steel: 'var(--color-armour)',
  gold: 'var(--color-earned)',
  crimson: 'var(--color-boss)',
};
const OUTLINE = 'var(--color-ink-950)';
const POLE = 'var(--color-fg-4)';
const TIERS: GearTone[] = ['chalk', 'iron', 'steel', 'gold'];

const STAGE_OF: Record<string, StageKind> = {
  'stage:pull-up-bar': 'bar',
  'stage:parallettes': 'parallettes',
  'stage:rings': 'rings',
  'stage:competition-plinth': 'plinth',
  'stage:the-podium': 'podium',
};

/** The stage an item id puts the athlete on; none for the plain floor. */
export const stageOfId = (id: string | undefined): StageKind | undefined => (id?.startsWith('stage:summit') ? 'summit' : id ? STAGE_OF[id] : undefined);

/** What an equipped item looks like on the figure, read from its id alone, so a crew card can draw it too. */
export function gearLookOf(gear: Record<string, string> | undefined, joints?: GearLook['joints']): GearLook {
  const look: GearLook = { joints };
  for (const [slot, id] of Object.entries(gear ?? {})) {
    const tier = TIERS[Math.max(0, Number(id.split(':').pop()) - 1)] ?? 'iron';
    if (slot === 'head') look.head = id.startsWith('head:spotter') ? 'steel' : tier;
    if (slot === 'waist') {
      if (id.startsWith('waist:records')) look.belt = tier;
      else look.bag = tier;
    }
    if (slot === 'trophy') look.trophy = true;
    if (slot === 'banner') look.banner = tier;
    if (slot === 'stage') look.stage = stageOfId(id);
  }
  return look;
}

/* ---------------- the worn pieces, as shapes ---------------- */

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const unit = (a: Pt): Pt => scale(a, 1 / Math.max(0.001, len(a)));

export type Piece =
  | { kind: 'line'; key: string; a: Pt; b: Pt; width: number; colour: string }
  | { kind: 'circle'; key: string; c: Pt; r: number; tone: GearTone }
  | { kind: 'rect'; key: string; c: Pt; w: number; h: number; rx: number; tone: GearTone };

const outlined = (tone: GearTone, width = 1.1) => ({ fill: TONE[tone], stroke: OUTLINE, strokeWidth: width, strokeLinejoin: 'round' as const });

/**
 * Everything worn, placed on one pose's joints. The same look on the same rig
 * always gives the same pieces in the same order, so a piece in the base pose
 * and in the moved pose can be paired by position.
 */
export function piecesOf(bones: Bones, look: GearLook, t: PropTuning): Piece[] {
  const joints = look.joints ?? {};
  const pieces: Piece[] = [];
  // A strap or sleeve: an outline in the page colour, then the material on top.
  const strap = (key: string, a: Pt, b: Pt, width: number, tone: GearTone) => {
    pieces.push({ kind: 'line', key: `${key}-o`, a, b, width: width + t.outline.strap, colour: OUTLINE });
    pieces.push({ kind: 'line', key, a, b, width, colour: TONE[tone] });
  };
  const sleeve = (limb: Limb, at: 'joint' | 'end' | 'root', tone: GearTone, key: string) => {
    const w = limb.width + t.sleeve.pad;
    if (at === 'joint') strap(key, lerp(limb.joint, limb.root, t.sleeve.joint), lerp(limb.joint, limb.end, t.sleeve.joint), w, tone);
    else if (at === 'end') strap(key, lerp(limb.joint, limb.end, t.sleeve.endFrom), lerp(limb.joint, limb.end, t.sleeve.endTo), w, tone);
    else strap(key, lerp(limb.root, limb.joint, t.sleeve.rootFrom), lerp(limb.root, limb.joint, t.sleeve.rootTo), w, tone);
  };

  bones.arms.forEach((arm, index) => {
    if (joints.shoulders) sleeve(arm, 'root', joints.shoulders, `shoulder${index}`);
    if (joints.elbows) sleeve(arm, 'joint', joints.elbows, `elbow${index}`);
    if (joints.wrists) sleeve(arm, 'end', joints.wrists, `wrist${index}`);
    if (joints.fingers) pieces.push({ kind: 'circle', key: `finger${index}`, c: arm.end, r: arm.width * t.finger.r, tone: joints.fingers });
  });
  bones.legs.forEach((leg, index) => {
    if (joints.knees) sleeve(leg, 'joint', joints.knees, `knee${index}`);
    if (joints.ankles) sleeve(leg, 'end', joints.ankles, `ankle${index}`);
  });

  if (look.belt || look.bag) {
    const axis = sub(bones.shoulders, bones.hips);
    const up = scale(unit(axis), t.belt.lift);
    const [a, b] = [add(bones.hipCorners[0], up), add(bones.hipCorners[1], up)];
    if (look.belt) {
      strap('belt', a, b, t.belt.width, look.belt);
      pieces.push({ kind: 'rect', key: 'buckle', c: mid(a, b), w: t.belt.buckle, h: t.belt.buckle, rx: t.belt.buckle * 0.19, tone: look.belt === 'gold' ? 'iron' : 'gold' });
    }
    // The bag hangs at the back of the belt, just below it.
    if (look.bag) pieces.push({ kind: 'rect', key: 'bag', c: add(lerp(a, b, t.bag.along), scale(unit(axis), -t.bag.drop)), w: t.bag.w, h: t.bag.h, rx: t.bag.rx, tone: look.bag });
  }

  if (look.head && bones.head) {
    const { at, r } = bones.head;
    // The band sits on the forehead: toward the top of the head, away from the torso, whatever the pose.
    const away = unit(sub(at, bones.shoulders));
    const centre = add(at, scale(away, r * t.headband.offset));
    const across: Pt = [-away[1], away[0]];
    const half = Math.sqrt(Math.max(0, r * r - (r * t.headband.offset) ** 2)) + t.headband.overhang;
    strap('head', add(centre, scale(across, half)), add(centre, scale(across, -half)), t.headband.width, look.head);
  }
  return pieces;
}

const at2 = (value: number) => Math.round(value * 100) / 100;

/** The pieces in front of the athlete, each moving between its place in the two poses. */
const Worn: React.FC<{ spec: FigureSpec; look: GearLook; play: MotionPlay | null; t: PropTuning }> = ({ spec, look, play, t }) => {
  const rig = rigOf(spec);
  if (!rig) return null;
  const base = piecesOf(bonesAt(rig, spec.strokes, spec.discs ?? []), look, t);
  const moved = play && spec.motion ? piecesOf(bonesAt(rig, spec.motion.strokes, spec.motion.discs), look, t) : null;
  const move = (attribute: string, from: number, to: number | undefined) =>
    play && to !== undefined && Math.abs(from - to) > 0.01 ? <animate key={attribute} attributeName={attribute} values={play.values(String(at2(from)), String(at2(to)))} {...play.attrs} /> : null;

  return (
    <g pointerEvents="none">
      {base.map((piece, index) => {
        const target = moved?.[index];
        if (piece.kind === 'line') {
          const to = target?.kind === 'line' ? target : undefined;
          return (
            <line key={piece.key} x1={at2(piece.a[0])} y1={at2(piece.a[1])} x2={at2(piece.b[0])} y2={at2(piece.b[1])} strokeWidth={piece.width} strokeLinecap="round" style={{ stroke: piece.colour }}>
              {move('x1', piece.a[0], to?.a[0])}
              {move('y1', piece.a[1], to?.a[1])}
              {move('x2', piece.b[0], to?.b[0])}
              {move('y2', piece.b[1], to?.b[1])}
            </line>
          );
        }
        if (piece.kind === 'circle') {
          const to = target?.kind === 'circle' ? target : undefined;
          return (
            <circle key={piece.key} cx={at2(piece.c[0])} cy={at2(piece.c[1])} r={piece.r} style={outlined(piece.tone, t.outline.piece)}>
              {move('cx', piece.c[0], to?.c[0])}
              {move('cy', piece.c[1], to?.c[1])}
            </circle>
          );
        }
        const to = target?.kind === 'rect' ? target : undefined;
        return (
          <rect key={piece.key} x={at2(piece.c[0] - piece.w / 2)} y={at2(piece.c[1] - piece.h / 2)} width={piece.w} height={piece.h} rx={piece.rx} style={outlined(piece.tone, t.outline.piece)}>
            {move('x', piece.c[0] - piece.w / 2, to && to.c[0] - to.w / 2)}
            {move('y', piece.c[1] - piece.h / 2, to && to.c[1] - to.h / 2)}
          </rect>
        );
      })}
    </g>
  );
};

/**
 * What stands under and behind the athlete: a stage, its equipment, the
 * trophy and banner. On a pull-up station they hang from its uprights; on
 * anything else each stands on a pole of its own.
 */
export const Backdrop: React.FC<{ look: GearLook; staged: Staged; t: PropTuning }> = ({ look, staged: { stage, ground, frame, uprights }, t }) => {
  const trophy = { x: uprights?.left?.x ?? t.trophy.x, top: Math.max(t.trophy.minTop, (uprights?.left?.top ?? 0) + 3), pole: !uprights?.left };
  const banner = { x: uprights?.right?.x ?? t.banner.x, top: Math.max(t.banner.minTop, (uprights?.right?.top ?? 0) + 3), pole: !uprights?.right };
  const line = t.outline.piece;
  const { plinth, podium, summit } = t;
  const sideW = podium.side;
  return (
    <g>
      {frame?.map((bar, index) => (
        <line key={index} x1={bar.from[0]} y1={bar.from[1]} x2={bar.to[0]} y2={bar.to[1]} strokeWidth={bar.width} strokeLinecap="round" style={{ stroke: TONE[bar.tone] }} />
      ))}
      {stage === 'summit' && (
        <path
          d={`M${summit.left} ${ground} ${summit.peaks.map(([x, y]) => `L${x} ${y}`).join(' ')} L${summit.right} ${ground} Z`}
          style={{ fill: 'var(--color-ink-800)', stroke: TONE.gold, strokeWidth: summit.edge, strokeLinejoin: 'round' }}
        />
      )}
      {stage === 'plinth' && (
        <g>
          <rect x={plinth.x} y={ground} width={plinth.w} height={100 - ground} rx="1.5" style={outlined('iron', line)} />
          <line x1={plinth.x + 0.6} y1={ground + 0.8} x2={plinth.x + plinth.w - 0.6} y2={ground + 0.8} strokeWidth={plinth.trim} style={{ stroke: TONE.gold }} />
        </g>
      )}
      {stage === 'podium' && (
        <g>
          <rect x={50 - podium.centre / 2 - sideW + 2} y={ground + podium.second} width={sideW} height={100 - ground} rx="1" style={outlined('iron', line)} />
          <rect x={50 + podium.centre / 2 - 2} y={ground + podium.third} width={sideW} height={100 - ground} rx="1" style={outlined('iron', line)} />
          <rect x={50 - podium.centre / 2} y={ground} width={podium.centre} height={100 - ground} rx="1" style={outlined('iron', line)} />
          <line x1={50 - podium.centre / 2 + 0.6} y1={ground + 0.8} x2={50 + podium.centre / 2 - 0.6} y2={ground + 0.8} strokeWidth={podium.trim} style={{ stroke: TONE.gold }} />
        </g>
      )}
      {look.trophy && (
        <g>
          {trophy.pole && <line x1={trophy.x} y1={trophy.top} x2={trophy.x} y2={ground} strokeWidth={t.trophy.pole} strokeLinecap="round" style={{ stroke: POLE }} />}
          <path d={`M${trophy.x} ${trophy.top} L${trophy.x + t.trophy.w} ${trophy.top + t.trophy.h / 2} L${trophy.x} ${trophy.top + t.trophy.h} Z`} style={outlined('crimson', line)} />
        </g>
      )}
      {look.banner && (
        <g>
          {banner.pole && <line x1={banner.x} y1={banner.top} x2={banner.x} y2={ground} strokeWidth={t.banner.pole} strokeLinecap="round" style={{ stroke: POLE }} />}
          <path
            d={`M${banner.x} ${banner.top + 1} L${banner.x - t.banner.w} ${banner.top + 1} L${banner.x - t.banner.w} ${banner.top + t.banner.h} L${banner.x - t.banner.w / 2} ${banner.top + t.banner.h - t.banner.notch} L${banner.x} ${banner.top + t.banner.h} Z`}
            style={outlined(look.banner, line)}
          />
        </g>
      )}
    </g>
  );
};

export const wearsAnything = (look: GearLook) => Boolean(look.head || look.belt || look.bag || look.trophy || look.banner || look.stage || Object.keys(look.joints ?? {}).length);

/**
 * A figure with gear on, animated if asked: the gear moves with the athlete.
 * A stage that doesn't suit the move is left out, so a squat never stands
 * under a pull-up bar.
 */
export const GearedFigure: React.FC<{
  spec: FigureSpec;
  state?: NodeState;
  look: GearLook;
  animate?: boolean;
  className?: string;
  title?: string;
  /** Drawn large even when still, with labels; for the figure studio. */
  compact?: boolean;
  /** Plays even when the visitor asked for less motion; for the figure studio's timeline. */
  alwaysAnimate?: boolean;
}> = ({ spec, state, look, animate = false, className = 'w-12 h-12', title, compact, alwaysAnimate }) => {
  const t = usePropTuning();
  const staged = useMemo(() => stageMove(spec, look.stage, t), [spec, look.stage, t]);
  const shared = { state, animate, className, title, compact, alwaysAnimate };
  if (!wearsAnything(look)) return <Figure spec={spec} {...shared} />;
  return (
    <Figure
      spec={staged.spec}
      {...shared}
      underlay={<Backdrop look={look} staged={staged} t={t} />}
      overlay={(play) => <Worn spec={staged.spec} look={look} play={play} t={t} />}
    />
  );
};
