'use client';

import React from 'react';
import type { GearTone } from '../../data/gear';
import type { ArmorSlot } from '../../utils/campaignV3';
import { GearLook, TONE } from '../game/GearedFigure';
import { Rig, StageKind, apparatusOf, apparatusWhy, fitText, stagesFor } from '../game/figureRig';
import { Figure, NodeState } from '../game/kit';
import type { FigureSpec } from '../skilltree/SkillFigure';
import type { FigurePatch } from '../skilltree/figureOverrides';
import { ENTRY_BY_ID } from './catalog';
import type { Finding } from './checks';
import { EditMode, PoseKey, flipBend, handleAt, insertPoint, jointsOf, moveHandle, parseRef, poseOf, removePoint, rigStrokes, withPose } from './geometry';
import type { FigureSource } from './sources';
import { Button, LEVEL_STYLE, LEVEL_WORD, NumberField, Panel, Segmented } from './ui';

/* ---------------- the selected handle ---------------- */

export const SelectionPanel: React.FC<{
  spec: FigureSpec;
  rig: Rig | null;
  names: string[];
  pose: PoseKey;
  mode: EditMode;
  selection: string | null;
  options: { ik: boolean; carry: boolean };
  onChange: (next: FigureSpec) => void;
}> = ({ spec, rig, names, pose, mode, selection, options, onChange }) => {
  const at = selection ? handleAt(spec, rig, names, pose, selection) : null;
  if (!selection || !at) {
    return (
      <Panel title="Selected">
        <p className="text-[12.5px] text-fg-4">
          {mode === 'joints'
            ? 'Drag a hand, foot, elbow, knee, the shoulders, hips or head. Elbows and knees bend to keep bone lengths. Hold Alt to drag without snapping.'
            : 'Drag any single point: strokes, discs, holds and the scenery. Points sitting on the moved one go with it; hold Alt to move it alone.'}
        </p>
      </Panel>
    );
  }
  const ref = parseRef(selection);
  const joint = !ref && rig ? jointsOf(rig, names, poseOf(spec, pose)).find((entry) => entry.key === selection) : undefined;
  const other: PoseKey = pose === 'start' ? 'end' : 'start';
  const twin = spec.motion ? handleAt(spec, rig, names, other, selection) : null;
  const setAt = (x: number, y: number) => onChange(moveHandle(spec, rig, names, pose, selection, [x, y], options));
  const stroke = ref?.type === 'stroke' ? poseOf(spec, pose).strokes[ref.index] : null;
  const locked = ref?.type === 'stroke' && rigStrokes(rig).has(ref.index);

  const label = joint?.label ?? (ref?.type === 'stroke' ? `Stroke ${ref.index}, point ${ref.point}` : ref?.type === 'disc' ? `Disc ${ref.index}` : ref?.type === 'hold' ? `Hold ${ref.index} (both poses)` : `Scenery point ${ref?.index} (both poses)`);

  return (
    <Panel title="Selected" right={<span className="text-[12.5px] font-bold text-fg">{label}</span>}>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="x" value={at[0]} onChange={(x) => setAt(x, at[1])} slider={false} />
        <NumberField label="y" value={at[1]} onChange={(y) => setAt(at[0], y)} slider={false} />
      </div>
      {stroke && (
        <p className="text-[12px] text-fg-4">
          {stroke.tone} · width {stroke.width}
          {stroke.far ? ' · far side' : ''}
          {stroke.closed ? ' · filled' : ''} · {stroke.pts.length} points{locked ? ' · part of the rig' : ''}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {twin && (
          <Button onClick={() => setAt(twin[0], twin[1])} title={`Put it where it is in the ${other} pose`}>
            Match {other} pose
          </Button>
        )}
        {joint?.kind === 'joint' && rig && (
          <Button onClick={() => onChange(withPose(spec, pose, flipBend(rig, poseOf(spec, pose), joint.limb!)))}>Flip the bend</Button>
        )}
        {ref?.type === 'stroke' && !locked && (
          <>
            <Button onClick={() => onChange(insertPoint(spec, ref.index, ref.point))} title="Adds a point after this one, in both poses">
              Add a point
            </Button>
            <Button onClick={() => onChange(removePoint(spec, ref.index, ref.point))} disabled={(stroke?.pts.length ?? 0) <= 2} title="Removes this point from both poses">
              Remove it
            </Button>
          </>
        )}
      </div>
      {locked && <p className="text-[12px] text-fg-4">No points can be added to the torso or a limb: the rig reads them by their shape.</p>}
    </Panel>
  );
};

/* ---------------- warnings ---------------- */

export const WarningsPanel: React.FC<{ findings: Finding[]; onPick: (finding: Finding) => void }> = ({ findings, onPick }) => (
  <Panel title={`Warnings · ${findings.length}`}>
    {findings.length === 0 ? (
      <p className="text-[12.5px] text-fg-4">Nothing found: the poses match, the rig reads two arms, two legs and a head, and the body sits where it should.</p>
    ) : (
      <ul className="flex flex-col gap-1.5">
        {findings.map((finding, i) => (
          <li key={i}>
            <button type="button" onClick={() => onPick(finding)} className="w-full text-left flex gap-2 items-start cursor-pointer group">
              <span className={`shrink-0 mt-0.5 px-1.5 rounded-tag border text-[10.5px] font-bold uppercase tracking-wide ${LEVEL_STYLE[finding.level]}`}>{LEVEL_WORD[finding.level]}</span>
              <span className="text-[12.5px] text-fg-2 group-hover:text-fg">{finding.text}</span>
            </button>
          </li>
        ))}
      </ul>
    )}
  </Panel>
);

/* ---------------- gear and stage ---------------- */

const TONES: GearTone[] = ['chalk', 'iron', 'steel', 'gold', 'crimson'];
const JOINT_SLOTS: ArmorSlot[] = ['shoulders', 'elbows', 'wrists', 'fingers', 'knees', 'ankles'];
export const STAGES: { kind: StageKind | undefined; label: string }[] = [
  { kind: undefined, label: 'Floor' },
  { kind: 'bar', label: 'Pull-up bar' },
  { kind: 'parallettes', label: 'Parallettes' },
  { kind: 'rings', label: 'Rings' },
  { kind: 'plinth', label: 'Plinth' },
  { kind: 'podium', label: 'Podium' },
  { kind: 'summit', label: 'Summit' },
];

const ToneRow: React.FC<{ label: string; value: GearTone | undefined; onChange: (tone: GearTone | undefined) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="w-[86px] shrink-0 text-[12.5px] text-fg-3">{label}</span>
    <div className="flex flex-wrap gap-1">
      <button type="button" onClick={() => onChange(undefined)} aria-pressed={!value} className={`h-6 px-1.5 rounded-tag text-[11px] font-bold cursor-pointer ${!value ? 'bg-act text-act-deep' : 'bg-ink-850 text-fg-4 hover:text-fg'}`}>
        None
      </button>
      {TONES.map((tone) => (
        <button
          key={tone}
          type="button"
          onClick={() => onChange(tone)}
          aria-pressed={value === tone}
          title={tone}
          aria-label={`${label}: ${tone}`}
          className={`w-6 h-6 rounded-tag border-2 cursor-pointer ${value === tone ? 'border-act' : 'border-transparent'}`}
        >
          <span className="block w-full h-full rounded-[2px] border border-ink-950" style={{ background: TONE[tone] }} />
        </button>
      ))}
    </div>
  </div>
);

export const GearPanel: React.FC<{ spec: FigureSpec; look: GearLook; onLook: (look: GearLook) => void; tint: NodeState; onTint: (tint: NodeState) => void }> = ({ spec, look, onLook, tint, onTint }) => {
  const fits = stagesFor(spec);
  const joints = look.joints ?? {};
  const setJoint = (slot: ArmorSlot, tone: GearTone | undefined) => {
    const next = { ...joints };
    if (tone) next[slot] = tone;
    else delete next[slot];
    onLook({ ...look, joints: next });
  };
  const refused = look.stage && !fits.includes(look.stage);
  return (
    <Panel
      title="Gear and stage"
      right={
        <div className="flex gap-1">
          <Button className="!h-7 !px-2 !text-[11.5px]" onClick={() => onLook({})}>
            Nothing
          </Button>
          <Button
            className="!h-7 !px-2 !text-[11.5px]"
            onClick={() => onLook({ ...look, head: 'steel', belt: 'iron', bag: 'chalk', trophy: true, banner: 'gold', joints: Object.fromEntries(JOINT_SLOTS.map((slot) => [slot, 'steel'])) })}
          >
            Everything
          </Button>
        </div>
      }
    >
      <ToneRow label="Headband" value={look.head} onChange={(head) => onLook({ ...look, head })} />
      <ToneRow label="Belt" value={look.belt} onChange={(belt) => onLook({ ...look, belt })} />
      <ToneRow label="Chalk bag" value={look.bag} onChange={(bag) => onLook({ ...look, bag })} />
      <ToneRow label="Banner" value={look.banner} onChange={(banner) => onLook({ ...look, banner })} />
      <div className="flex items-center gap-2">
        <span className="w-[86px] shrink-0 text-[12.5px] text-fg-3">Trophy</span>
        <Segmented label="Trophy" value={look.trophy ? 'on' : 'off'} onChange={(on) => onLook({ ...look, trophy: on === 'on' })} options={[{ value: 'off', label: 'None' }, { value: 'on', label: 'On a pole' }]} />
      </div>
      <div className="border-t border-ink-700 pt-2 flex flex-col gap-1.5">
        <span className="eyebrow text-fg-4">Joint armour</span>
        {JOINT_SLOTS.map((slot) => (
          <ToneRow key={slot} label={slot[0].toUpperCase() + slot.slice(1)} value={joints[slot]} onChange={(tone) => setJoint(slot, tone)} />
        ))}
      </div>
      <div className="border-t border-ink-700 pt-2 flex flex-col gap-1.5">
        <span className="eyebrow text-fg-4">Stage</span>
        <div className="flex flex-wrap gap-1">
          {STAGES.map(({ kind, label }) => {
            const ok = !kind || fits.includes(kind);
            const on = look.stage === kind;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onLook({ ...look, stage: kind })}
                aria-pressed={on}
                title={ok ? 'Suits this move' : fitText(spec)}
                className={`h-7 px-2 rounded-tag text-[12px] font-bold cursor-pointer ${on ? 'bg-act text-act-deep' : ok ? 'bg-ink-850 text-fg-2 hover:text-fg' : 'bg-ink-950 text-fg-5 line-through decoration-1'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-[12px] text-fg-3">
          <span className="text-fg-2 font-bold">Reads as {apparatusOf(spec)}.</span> {apparatusWhy(spec)}
        </p>
        {refused && <p className="text-[12px] text-fg">Refused: {fitText(spec)} The app draws it on the plain floor.</p>}
      </div>
      <div className="border-t border-ink-700 pt-2 flex flex-col gap-1.5">
        <span className="eyebrow text-fg-4">Drawn as</span>
        <Segmented<NodeState>
          label="Tint"
          value={tint}
          onChange={onTint}
          options={[
            { value: 'ready', label: 'Ready' },
            { value: 'mastered', label: 'Mastered' },
            { value: 'locked', label: 'Locked' },
            { value: 'boss', label: 'Boss' },
          ]}
        />
      </div>
    </Panel>
  );
};

/* ---------------- code ---------------- */

export type FixState = 'built' | 'saved' | 'draft' | 'stale' | 'removed';

export const FIX_WORD: Record<FixState, string> = {
  built: 'As its builder draws it',
  saved: 'Saved fix in use',
  draft: 'Unsaved edit',
  stale: 'Saved fix no longer fits (its builder changed), so the app leaves it out',
  removed: 'Unsaved: the saved fix is taken away',
};

export const CodePanel: React.FC<{
  id: string;
  source: FigureSource | undefined;
  siblings: string[];
  state: FixState;
  note: string;
  onNote: (note: string) => void;
  onOpen: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetToBuilt: () => void;
  onDiscardDraft: () => void;
  onCopyPatch: () => void;
  onCopyNote: () => void;
  patch: FigurePatch | null;
}> = (props) => {
  const { id, source, siblings, state } = props;
  return (
    <Panel title="Code">
      <div className="flex flex-col gap-1">
        {source ? (
          <>
            <code className="text-[12.5px] text-fg break-all">{source.call}</code>
            <span className="text-[11.5px] text-fg-4 break-all">
              {source.file.replace('apps/web/src/components/skilltree/', '')}:{source.line}
              {source.sameAs ? ` · reuses ${source.sameAs}` : ''}
            </span>
          </>
        ) : (
          <span className="text-[12px] text-fg-4">Source not known yet: open the studio on a dev server once to read it.</span>
        )}
      </div>
      {source?.family ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] text-fg-3">
            Family <code className="text-fg">{source.family}</code>: {siblings.length + 1} figures. A fault in all of them belongs in the builder, not in fixes one by one.
          </span>
          {siblings.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {siblings.map((other) => {
                const entry = ENTRY_BY_ID.get(other);
                return entry ? (
                  <button key={other} type="button" onClick={() => props.onOpen(other)} title={`${entry.name} · ${other}`} className="shrink-0 w-14 h-14 rounded-tag bg-ink-850 hover:bg-ink-800 cursor-pointer p-0.5">
                    <Figure spec={entry.asBuilt()} className="w-full h-full" />
                  </button>
                ) : null;
              })}
            </div>
          )}
        </div>
      ) : source ? (
        <span className="text-[12px] text-fg-3">Drawn by hand: an edit here only ever changes this figure.</span>
      ) : null}
      <div className="border-t border-ink-700 pt-2 flex flex-col gap-2">
        <span className={`text-[12.5px] font-bold ${state === 'built' ? 'text-fg-4' : 'text-fg'}`}>{FIX_WORD[state]}</span>
        <textarea
          value={props.note}
          onChange={(event) => props.onNote(event.target.value)}
          placeholder="What was wrong (saved with the fix)"
          rows={2}
          className="w-full px-2 py-1.5 rounded-tag bg-ink-800 border border-ink-700 text-[12.5px] text-fg placeholder:text-fg-5 resize-y"
        />
        <div className="flex flex-wrap gap-1.5">
          <Button onClick={props.onUndo} disabled={!props.canUndo} title="Undo (⌘Z)">
            Undo
          </Button>
          <Button onClick={props.onRedo} disabled={!props.canRedo} title="Redo (⇧⌘Z)">
            Redo
          </Button>
          <Button onClick={props.onResetToBuilt} disabled={state === 'built' || state === 'removed'} title="Back to the builder's drawing">
            Reset to built
          </Button>
          <Button onClick={props.onDiscardDraft} disabled={state !== 'draft' && state !== 'removed'} title="Forget the unsaved edit">
            Discard edit
          </Button>
          <Button onClick={props.onCopyPatch} disabled={!props.patch}>
            Copy fix
          </Button>
          <Button onClick={props.onCopyNote} disabled={!props.patch} title="A note for fixing the family builder itself">
            Copy fix note
          </Button>
        </div>
        <span className="text-[11px] text-fg-5">{id}</span>
      </div>
    </Panel>
  );
};
