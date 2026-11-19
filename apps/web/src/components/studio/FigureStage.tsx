'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { GearLook, GearedFigure } from '../game/GearedFigure';
import type { Rig } from '../game/figureRig';
import type { NodeState } from '../game/kit';
import type { FigureSpec, Pt, Stroke } from '../skilltree/SkillFigure';
import type { Finding } from './checks';
import {
  DragOptions,
  EditMode,
  PoseKey,
  dist,
  frameAt,
  handleAt,
  isBody,
  jointsOf,
  limbGeo,
  moveHandle,
  parseRef,
  poseOf,
  poseTime,
  progressAt,
  refKey,
  stillAt,
  timingOf,
  wallPoints,
} from './geometry';
import { Segmented } from './ui';

/**
 * The big drawing: the figure exactly as the app draws it (with its gear and
 * stage), and on top of it the studio's overlay — the other pose as a ghost,
 * the rig, the paths the hands and feet travel, warnings, and the handles that
 * edit the pose. The timeline drives the figure's own animation clock, so
 * scrubbing shows what ships.
 */

export interface ViewOptions {
  onion: boolean;
  rig: boolean;
  trails: boolean;
  marks: boolean;
}

export interface StageProps {
  spec: FigureSpec;
  rig: Rig | null;
  names: string[];
  look: GearLook;
  tint: NodeState;
  pose: PoseKey;
  onPose: (pose: PoseKey) => void;
  mode: EditMode;
  view: ViewOptions;
  options: DragOptions & { snap: boolean };
  selection: string | null;
  onSelect: (key: string | null) => void;
  findings: Finding[];
  /** Why editing is off right now, if it is. */
  locked: string | null;
  onEditStart: () => void;
  onEdit: (next: FigureSpec) => void;
  onEditEnd: () => void;
  title: string;
}

const toPath = (pts: Pt[], closed?: boolean) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') + (closed ? ' Z' : '');

const SPEEDS = [0.1, 0.25, 0.5, 1] as const;

/** Where a pointer is in the figure's 100 × 100 box. */
function boxPoint(svg: SVGSVGElement, event: { clientX: number; clientY: number }): Pt {
  const matrix = svg.getScreenCTM();
  if (!matrix) return [0, 0];
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return [point.x, point.y];
}

/** Floor, boxes and benches under a point: the surface top at x, from the scenery. */
function surfaceTops(wall: string | undefined, x: number): number[] {
  if (!wall) return [];
  return wall
    .split(/(?=M)/)
    .map((part) => (part.match(/-?\d+(\.\d+)?/g) ?? []).map(Number))
    .filter((nums) => nums.length >= 4)
    .map((nums) => {
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      return { x1: Math.min(...xs), x2: Math.max(...xs), top: Math.min(...ys) };
    })
    .filter((box) => box.x2 - box.x1 > 4 && x >= box.x1 && x <= box.x2)
    .map((box) => box.top);
}

export const FigureStage: React.FC<StageProps> = (props) => {
  const { spec, rig, names, look, tint, pose, onPose, mode, view, options, selection, onSelect, findings, locked, title } = props;
  const timing = useMemo(() => timingOf(spec.motion), [spec.motion]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [u, setU] = useState(0);
  /** On the timeline (playing or scrubbed) rather than standing in one pose to edit it. */
  const [onTimeline, setOnTimeline] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const overlay = useRef<SVGSVGElement>(null);
  const drag = useRef<{ key: string; start: FigureSpec; offset: Pt; pointer: number } | null>(null);
  const [snapAt, setSnapAt] = useState<Pt | null>(null);

  // A new figure or pose: stand still in that pose.
  const standing = `${title}|${pose}`;
  const [stood, setStood] = useState(standing);
  if (stood !== standing) {
    setStood(standing);
    setPlaying(false);
    setOnTimeline(false);
    setU(timing ? poseTime(timing, pose) : 0);
  }

  useEffect(() => {
    if (!playing || !timing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setU((at) => (at + (dt * speed) / timing.seconds) % 1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, timing]);

  const live = onTimeline && Boolean(timing);
  const shown = useMemo(() => (live ? spec : stillAt(spec, pose)), [live, spec, pose]);

  // The figure's SMIL clock, held still and set by hand.
  useEffect(() => {
    const svg = wrap.current?.querySelector('svg:not([data-overlay])') as SVGSVGElement | null;
    if (!svg || !live || !timing) return;
    svg.pauseAnimations();
    svg.setCurrentTime(u * timing.seconds);
  }, [u, live, timing, shown, look]);

  const figure = useMemo(
    () => <GearedFigure spec={shown} look={look} state={tint} animate={live} alwaysAnimate compact={false} className="absolute inset-0 w-full h-full" title={title} />,
    [shown, look, tint, live, title],
  );

  const progress = live && timing ? progressAt(timing, u) : pose === 'end' ? 1 : 0;
  const frame = useMemo(() => frameAt(spec, progress), [spec, progress]);
  const other = pose === 'start' ? 'end' : 'start';
  const editing = !live && !locked;

  const joints = useMemo(() => (rig ? jointsOf(rig, names, frame) : []), [rig, names, frame]);

  /* ---------- dragging ---------- */

  const snap = (key: string, target: Pt, start: FigureSpec): { at: Pt; snapped: boolean } => {
    if (!options.snap || !rig) return { at: target, snapped: false };
    const limbIndex = /^end:(\d+)$/.exec(key)?.[1];
    const candidates: Pt[] = [];
    const twin = spec.motion ? handleAt(start, rig, names, other, key) : null;
    if (twin) candidates.push(twin);
    if (limbIndex !== undefined) {
      const limb = rig.limbs[Number(limbIndex)];
      if (limb.arm) {
        (start.holds ?? []).filter((hold) => hold.shape === 'bar').forEach((hold) => candidates.push(hold.at));
        poseOf(start, pose).discs.filter((disc) => disc.kind === 'ring').forEach((disc) => candidates.push([disc.at[0], disc.at[1] + 1]));
      }
      // Resting on the floor, a box or a bench: the limb's edge on the surface.
      const lower = poseOf(start, pose).strokes[limb.lower];
      const half = (lower?.width ?? 4) / 2;
      surfaceTops(start.wall, target[0]).forEach((top) => candidates.push([target[0], top - half]));
    }
    const best = candidates.map((at) => ({ at, d: dist(at, target) })).sort((a, b) => a.d - b.d)[0];
    return best && best.d < 2.2 ? { at: best.at, snapped: true } : { at: target, snapped: false };
  };

  const begin = (key: string, event: React.PointerEvent) => {
    if (!editing || !overlay.current) return;
    event.preventDefault();
    event.stopPropagation();
    const at = handleAt(spec, rig, names, pose, key);
    if (!at) return;
    const pointer = boxPoint(overlay.current, event);
    overlay.current.setPointerCapture(event.pointerId);
    drag.current = { key, start: spec, offset: [at[0] - pointer[0], at[1] - pointer[1]], pointer: event.pointerId };
    onSelect(key);
    props.onEditStart();
  };

  const move = (event: React.PointerEvent) => {
    const active = drag.current;
    if (!active || !overlay.current || event.pointerId !== active.pointer) return;
    const pointer = boxPoint(overlay.current, event);
    const raw: Pt = [pointer[0] + active.offset[0], pointer[1] + active.offset[1]];
    const { at, snapped } = event.altKey ? { at: raw, snapped: false } : snap(active.key, raw, active.start);
    setSnapAt(snapped ? at : null);
    props.onEdit(moveHandle(active.start, rig, names, pose, active.key, at, options, !event.altKey));
  };

  const end = (event: React.PointerEvent) => {
    if (!drag.current || event.pointerId !== drag.current.pointer) return;
    drag.current = null;
    setSnapAt(null);
    props.onEditEnd();
  };

  /* ---------- the overlay ---------- */

  const bodyOf = (strokes: Stroke[]) => strokes.filter(isBody);
  const ghost = view.onion && spec.motion ? poseOf(spec, live ? 'start' : other) : null;
  const ghost2 = view.onion && spec.motion && live ? poseOf(spec, 'end') : null;
  const ends = rig ? rig.limbs.map((limb) => ({ from: limbGeo(poseOf(spec, 'start'), limb).end, to: limbGeo(poseOf(spec, 'end'), limb).end })) : [];
  const marks = view.marks ? findings.filter((finding) => finding.at && (live || !finding.pose || finding.pose === pose)) : [];

  const pointHandles = editing && mode === 'points' ? pointsOf(spec, pose) : [];

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div ref={wrap} className="relative w-full aspect-square rounded-card bg-ink-900 border border-ink-700 overflow-hidden select-none">
        {figure}
        <svg
          ref={overlay}
          data-overlay=""
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full touch-none"
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerDown={() => editing && onSelect(null)}
          aria-hidden="true"
        >
          {[ghost, ghost2].map(
            (geo, g) =>
              geo && (
                <g key={g} opacity={0.75} pointerEvents="none">
                  {bodyOf(geo.strokes).map((stroke, i) => (
                    <path key={i} d={toPath(stroke.pts, stroke.closed)} strokeWidth={0.45} strokeDasharray="1.2 0.9" strokeLinecap="round" style={{ fill: 'none', stroke: 'var(--color-armour)' }} />
                  ))}
                  {geo.discs.filter((disc) => !disc.kind && disc.tone !== 'ghost').map((disc, i) => (
                    <circle key={i} cx={disc.at[0]} cy={disc.at[1]} r={disc.r} strokeWidth={0.45} strokeDasharray="1.2 0.9" style={{ fill: 'none', stroke: 'var(--color-armour)' }} />
                  ))}
                </g>
              ),
          )}

          {view.trails && spec.motion && (
            <g pointerEvents="none">
              {ends.map(({ from, to }, i) =>
                dist(from, to) > 0.5 ? (
                  <g key={i}>
                    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} strokeWidth={0.5} strokeDasharray="0.6 1" style={{ stroke: 'var(--color-fg-3)' }} />
                    <circle cx={(from[0] + to[0]) / 2} cy={(from[1] + to[1]) / 2} r={0.6} style={{ fill: 'var(--color-fg-3)' }} />
                  </g>
                ) : null,
              )}
            </g>
          )}

          {view.rig && rig && (
            <g pointerEvents="none">
              <path d={toPath(frame.strokes[rig.torso].pts, true)} strokeWidth={0.5} style={{ fill: 'none', stroke: 'var(--color-armour)' }} />
              {rig.limbs.map((limb, i) => {
                const g = limbGeo(frame, limb);
                return <path key={i} d={toPath([g.root, g.joint, g.end])} strokeWidth={0.55} style={{ fill: 'none', stroke: 'var(--color-armour)' }} />;
              })}
              {rig.head !== null && frame.discs[rig.head] && <circle cx={frame.discs[rig.head].at[0]} cy={frame.discs[rig.head].at[1]} r={frame.discs[rig.head].r} strokeWidth={0.5} style={{ fill: 'none', stroke: 'var(--color-armour)' }} />}
              {!editing && joints.map((joint) => <circle key={joint.key} cx={joint.at[0]} cy={joint.at[1]} r={0.8} style={{ fill: 'var(--color-armour)' }} />)}
            </g>
          )}

          {marks.map((finding, i) => (
            <circle key={i} cx={finding.at![0]} cy={finding.at![1]} r={4.2} strokeWidth={0.6} strokeDasharray="1.4 1" pointerEvents="none" style={{ fill: 'none', stroke: finding.level === 'info' ? 'var(--color-fg-4)' : 'var(--color-fg)' }} />
          ))}

          {editing && mode === 'joints' &&
            joints.map((joint) => {
              const on = selection === joint.key;
              const r = joint.kind === 'end' ? 1.7 : joint.kind === 'body' ? 1.5 : 1.3;
              return (
                <g key={joint.key} onPointerDown={(event) => begin(joint.key, event)} className="cursor-grab" role="presentation">
                  <circle cx={joint.at[0]} cy={joint.at[1]} r={3.2} style={{ fill: 'transparent' }} />
                  {joint.kind === 'body' ? (
                    <rect x={joint.at[0] - r} y={joint.at[1] - r} width={r * 2} height={r * 2} transform={`rotate(45 ${joint.at[0]} ${joint.at[1]})`} strokeWidth={0.5} style={{ fill: on ? 'var(--color-act)' : 'var(--color-ink-950)', stroke: 'var(--color-act)' }} />
                  ) : (
                    <circle cx={joint.at[0]} cy={joint.at[1]} r={r} strokeWidth={0.5} style={{ fill: on ? 'var(--color-act)' : 'var(--color-ink-950)', stroke: joint.kind === 'joint' ? 'var(--color-armour)' : 'var(--color-act)' }} />
                  )}
                  {on && (
                    <text x={joint.at[0] + 2.6} y={joint.at[1] - 2.2} fontSize={3} fontWeight={700} style={{ fill: 'var(--color-fg)', paintOrder: 'stroke', stroke: 'var(--color-ink-950)', strokeWidth: 0.8 }}>
                      {joint.label}
                    </text>
                  )}
                </g>
              );
            })}

          {pointHandles.map(({ key, at, kind }) => {
            const on = selection === key;
            return (
              <g key={key} onPointerDown={(event) => begin(key, event)} className="cursor-grab" role="presentation">
                <circle cx={at[0]} cy={at[1]} r={2} style={{ fill: 'transparent' }} />
                {kind === 'wall' || kind === 'hold' ? (
                  <rect x={at[0] - 0.85} y={at[1] - 0.85} width={1.7} height={1.7} strokeWidth={0.4} style={{ fill: on ? 'var(--color-act)' : 'var(--color-ink-950)', stroke: 'var(--color-fg-3)' }} />
                ) : (
                  <circle cx={at[0]} cy={at[1]} r={on ? 1.2 : 0.85} strokeWidth={0.4} style={{ fill: on ? 'var(--color-act)' : 'var(--color-ink-950)', stroke: kind === 'gear' ? 'var(--color-fg-4)' : 'var(--color-act)' }} />
                )}
              </g>
            );
          })}

          {snapAt && <circle cx={snapAt[0]} cy={snapAt[1]} r={2.6} strokeWidth={0.5} pointerEvents="none" style={{ fill: 'none', stroke: 'var(--color-act)' }} />}
        </svg>
        {locked && !live && <p className="absolute left-3 bottom-3 right-3 text-[12px] text-fg-3 bg-ink-950/85 rounded-tag px-2 py-1">{locked}</p>}
        {live && !playing && <p className="absolute left-3 top-3 text-[12px] text-fg-3 bg-ink-950/85 rounded-tag px-2 py-1">Paused mid-move. Pick the start or end pose to edit it.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Pose to edit"
          value={live ? ('' as PoseKey) : pose}
          onChange={(next) => {
            setOnTimeline(false);
            setPlaying(false);
            if (timing) setU(poseTime(timing, next));
            onPose(next);
          }}
          options={[
            { value: 'start', label: 'Start pose' },
            { value: 'end', label: 'End pose', disabled: !spec.motion, title: spec.motion ? undefined : 'This figure holds one pose' },
          ]}
        />
        <button
          type="button"
          onClick={() => {
            if (!timing) return;
            setOnTimeline(true);
            setPlaying((on) => !on);
          }}
          disabled={!timing}
          aria-label={playing ? 'Pause' : 'Play'}
          className="w-9 h-9 rounded-card bg-act text-act-deep flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <Segmented label="Speed" value={String(speed)} onChange={(next) => setSpeed(Number(next) as (typeof SPEEDS)[number])} options={SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }))} />
      </div>

      {timing && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 h-8 flex items-center">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-ink-700" />
            {/* Where each pose is held: the start at 0, the end in its pause. */}
            <span className="absolute top-0 bottom-0 w-px bg-fg-4" style={{ left: '0%' }} />
            <span className="absolute top-0 bottom-0 bg-ink-600" style={{ left: `${timing.keyTimes[1] * 100}%`, width: `${(timing.keyTimes[2] - timing.keyTimes[1]) * 100}%` }} />
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(u * 1000)}
              aria-label="Scrub through the move"
              onChange={(event) => {
                setOnTimeline(true);
                setPlaying(false);
                setU(Number(event.target.value) / 1000);
              }}
              className="relative w-full accent-[var(--color-act)] cursor-pointer"
            />
          </div>
          <span className="num text-[13px] text-fg-3 w-[92px] text-right">
            {(u * timing.seconds).toFixed(2)} / {timing.seconds.toFixed(1)} s
          </span>
        </div>
      )}
    </div>
  );
};

/** Every point that can be moved one at a time in a pose: stroke points, disc centres, holds and the wall's corners. */
function pointsOf(spec: FigureSpec, pose: PoseKey): { key: string; at: Pt; kind: 'body' | 'gear' | 'disc' | 'hold' | 'wall' }[] {
  const geo = poseOf(spec, pose);
  const out: { key: string; at: Pt; kind: 'body' | 'gear' | 'disc' | 'hold' | 'wall' }[] = [];
  wallPoints(spec.wall).forEach((at, index) => out.push({ key: refKey({ type: 'wall', index }), at, kind: 'wall' }));
  (spec.holds ?? []).forEach((hold, index) => out.push({ key: refKey({ type: 'hold', index }), at: hold.at, kind: 'hold' }));
  geo.strokes.forEach((stroke, index) =>
    stroke.pts.forEach((at, point) => out.push({ key: refKey({ type: 'stroke', index, point }), at, kind: isBody(stroke) ? 'body' : 'gear' })),
  );
  geo.discs.forEach((disc, index) => out.push({ key: refKey({ type: 'disc', index }), at: disc.at, kind: 'disc' }));
  return out;
}

export { parseRef };
