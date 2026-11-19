'use client';

import React, { useMemo, useState } from 'react';
import type { GearTone } from '../../data/gear';
import { GearLook, GearedFigure, TONE } from '../game/GearedFigure';
import { StageKind, apparatusOf, barAcross, stagesFor } from '../game/figureRig';
import { Figure } from '../game/kit';
import { PROP_DEFAULTS, PropChanges, PropTuning, changesOf } from '../game/propTuning';
import { usePropTuning } from '../game/propTuningContext';
import type { Disc, FigureSpec, Hold, HoldShape } from '../skilltree/SkillFigure';
import { CATALOG, ENTRY_BY_ID } from './catalog';
import { Button, NumberField, Panel } from './ui';

/**
 * Every prop and worn piece on one sheet: each drawn on a few figures (or on
 * its own), in the tone picked at the top, with the numbers that shape it.
 * Changes show on every figure in the studio at once.
 */

interface FieldDef {
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

type Preview =
  | { kind: 'worn'; look: (tone: GearTone) => GearLook; samples: string[] }
  | { kind: 'specs'; specs: FigureSpec[] };

interface Card {
  key: string;
  title: string;
  blurb: string;
  preview: Preview;
  fields: FieldDef[];
}

const f = (path: string, label: string, min: number, max: number, step = 0.1): FieldDef => ({ path, label, min, max, step });

const get = (tuning: PropTuning, path: string): number => path.split('.').reduce<unknown>((at, key) => (at as Record<string, unknown>)[key], tuning) as number;

function set(tuning: PropTuning, path: string, value: number): PropTuning {
  const keys = path.split('.');
  const clone = (node: unknown, depth: number): unknown => {
    if (depth === keys.length) return value;
    const key = keys[depth];
    if (Array.isArray(node)) return node.map((item, i) => (String(i) === key ? clone(item, depth + 1) : item));
    const obj = node as Record<string, unknown>;
    return { ...obj, [key]: clone(obj[key], depth + 1) };
  };
  return clone(tuning, 0) as PropTuning;
}

/** Figures to show a stage on: the first that suits it, by how the bar is drawn. */
function samplesFor(stage: StageKind, side?: 'front' | 'end'): string[] {
  const fits = CATALOG.filter((entry) => {
    const spec = entry.asBuilt();
    if (!stagesFor(spec).includes(stage)) return false;
    if (stage === 'bar' || stage === 'rings') {
      if (apparatusOf(spec) !== 'bar') return false;
      return side === 'front' ? barAcross(spec.wall) !== null : barAcross(spec.wall) === null;
    }
    return true;
  });
  return fits.slice(0, 3).map((entry) => entry.id);
}

const pick = (...ids: string[]) => ids.filter((id) => ENTRY_BY_ID.has(id));

const discs = (list: Disc[], scene: FigureSpec['scene'] = 'floor', labels: FigureSpec['labels'] = []): FigureSpec => ({ scene, strokes: [], discs: list, labels });

const HOLD_SHAPES: HoldShape[] = ['jug', 'edge', 'sloper', 'pinch', 'pocket', 'foot', 'volume', 'rung', 'bar'];
const holdBoard = (key: boolean): FigureSpec => ({
  scene: 'vertical',
  wall: 'M0,0 L100,0 L100,100 L0,100 Z',
  strokes: [],
  holds: HOLD_SHAPES.map((shape, i): Hold => ({ at: [20 + (i % 3) * 30, 18 + Math.floor(i / 3) * 31], shape, key })),
  labels: HOLD_SHAPES.map((shape, i) => ({ at: [20 + (i % 3) * 30, 30 + Math.floor(i / 3) * 31] as [number, number], text: shape })),
});

const ALL_JOINTS = (tone: GearTone): GearLook => ({ joints: { shoulders: tone, elbows: tone, wrists: tone, knees: tone, ankles: tone } });

function cards(): Card[] {
  const wear = pick('ex_11', 'ex_23', 'ex_7', 'ex_205');
  const floor = pick('ex_11', 'ex_7');
  const front = samplesFor('bar', 'front');
  const end = samplesFor('bar', 'end');
  return [
    {
      key: 'headband',
      title: 'Headband',
      blurb: 'On the forehead, away from the torso whatever the pose.',
      preview: { kind: 'worn', look: (tone) => ({ head: tone }), samples: wear },
      fields: [f('headband.offset', 'Height on the head', 0, 0.9, 0.02), f('headband.width', 'Band width', 0.5, 5), f('headband.overhang', 'Runs past the head', 0, 3)],
    },
    {
      key: 'belt',
      title: 'Lifting belt and buckle',
      blurb: 'Across the hips, a little above them; the buckle is gold unless the belt is.',
      preview: { kind: 'worn', look: (tone) => ({ belt: tone }), samples: wear },
      fields: [f('belt.lift', 'Above the hips', 0, 8), f('belt.width', 'Belt width', 1, 6), f('belt.buckle', 'Buckle size', 1, 6)],
    },
    {
      key: 'bag',
      title: 'Chalk bag',
      blurb: 'At the back of the belt, just below it.',
      preview: { kind: 'worn', look: (tone) => ({ bag: tone }), samples: wear },
      fields: [f('bag.along', 'Along the belt', 0.5, 1.6, 0.01), f('bag.drop', 'Below the belt', 0, 8), f('bag.w', 'Width', 2, 9), f('bag.h', 'Height', 2, 10), f('bag.rx', 'Corner', 0, 3)],
    },
    {
      key: 'sleeves',
      title: 'Joint sleeves',
      blurb: 'The forged armour: shoulders, elbows, wrists, knees and ankles.',
      preview: { kind: 'worn', look: ALL_JOINTS, samples: wear },
      fields: [
        f('sleeve.pad', 'Wider than the limb', 0, 3),
        f('sleeve.joint', 'Elbow and knee reach', 0.05, 0.4, 0.01),
        f('sleeve.endFrom', 'Wrist and ankle from', 0.5, 0.95, 0.01),
        f('sleeve.endTo', 'Wrist and ankle to', 0.6, 1, 0.01),
        f('sleeve.rootFrom', 'Shoulder from', 0, 0.5, 0.01),
        f('sleeve.rootTo', 'Shoulder to', 0.1, 0.7, 0.01),
      ],
    },
    {
      key: 'fingers',
      title: 'Finger tape',
      blurb: 'A disc of tape on each hand.',
      preview: { kind: 'worn', look: (tone) => ({ joints: { fingers: tone } }), samples: wear },
      fields: [f('finger.r', 'Size, as a share of the forearm', 0.3, 1.5, 0.01)],
    },
    {
      key: 'outline',
      title: 'Outline',
      blurb: 'The page-colour edge every worn piece gets, so it reads on any body.',
      preview: { kind: 'worn', look: (tone) => ({ head: tone, belt: tone, joints: { elbows: tone, knees: tone } }), samples: wear },
      fields: [f('outline.strap', 'Around straps and sleeves', 0, 3), f('outline.piece', 'Around the bag, tape and backdrop', 0, 2.5)],
    },
    {
      key: 'trophy',
      title: 'Trophy pennant',
      blurb: 'One per slain boss, on a pole at the left (or on the station upright).',
      preview: { kind: 'worn', look: () => ({ trophy: true }), samples: [...floor, ...end.slice(0, 1)] },
      fields: [f('trophy.x', 'Pole position', 2, 30), f('trophy.minTop', 'Hangs no lower than', 10, 70), f('trophy.w', 'Length', 6, 30), f('trophy.h', 'Height', 5, 24), f('trophy.pole', 'Pole width', 0.5, 3)],
    },
    {
      key: 'banner',
      title: 'Banner',
      blurb: 'Crew colours, on a pole at the right (or on the station upright).',
      preview: { kind: 'worn', look: (tone) => ({ banner: tone }), samples: [...floor, ...end.slice(0, 1)] },
      fields: [f('banner.x', 'Pole position', 70, 98), f('banner.minTop', 'Hangs no lower than', 10, 70), f('banner.w', 'Width', 6, 24), f('banner.h', 'Length', 8, 34), f('banner.notch', 'Tail notch', 0, 10), f('banner.pole', 'Pole width', 0.5, 3)],
    },
    {
      key: 'summit',
      title: 'Summit',
      blurb: "A tower's proven summit, behind the athlete.",
      preview: { kind: 'worn', look: () => ({ stage: 'summit' }), samples: floor },
      fields: [
        f('summit.left', 'Left foot', 0, 20),
        f('summit.right', 'Right foot', 80, 100),
        f('summit.peaks.0.0', 'Peak 1 x', 0, 100, 0.5),
        f('summit.peaks.0.1', 'Peak 1 y', 0, 90, 0.5),
        f('summit.peaks.1.0', 'Peak 2 x', 0, 100, 0.5),
        f('summit.peaks.1.1', 'Peak 2 y', 0, 90, 0.5),
        f('summit.peaks.2.0', 'Peak 3 x', 0, 100, 0.5),
        f('summit.peaks.2.1', 'Peak 3 y', 0, 90, 0.5),
        f('summit.edge', 'Gold edge', 0.5, 3),
      ],
    },
    {
      key: 'plinth',
      title: 'Competition plinth',
      blurb: 'A block in place of the floor, trimmed in gold.',
      preview: { kind: 'worn', look: () => ({ stage: 'plinth' }), samples: floor },
      fields: [f('plinth.x', 'Left edge', 0, 40), f('plinth.w', 'Width', 30, 100), f('plinth.trim', 'Gold trim', 0, 3)],
    },
    {
      key: 'podium',
      title: 'The podium',
      blurb: 'First in the middle, second and third lower at the sides.',
      preview: { kind: 'worn', look: () => ({ stage: 'podium' }), samples: floor },
      fields: [f('podium.centre', 'Centre width', 20, 60), f('podium.side', 'Side width', 14, 40), f('podium.second', 'Second lower by', 0, 12), f('podium.third', 'Third lower by', 0, 14), f('podium.trim', 'Gold trim', 0, 3)],
    },
    {
      key: 'station',
      title: 'Pull-up station',
      blurb: 'From the front: uprights at the bar ends. From the side: one upright clear of the body, an arm out to the bar and a brace.',
      preview: { kind: 'worn', look: () => ({ stage: 'bar', trophy: true, banner: 'iron' }), samples: [...front.slice(0, 1), ...end.slice(0, 2)] },
      fields: [
        f('station.frontInset', 'Front: uprights in from the edge', 2, 20),
        f('station.frontPost', 'Front: upright width', 1, 5),
        f('station.frontBar', 'Front: bar width', 1, 6),
        f('station.inset', 'Side: upright in from the edge', 2, 20),
        f('station.above', 'Side: upright above the bar', 0, 15),
        f('station.post', 'Side: upright width', 1, 5),
        f('station.arm', 'Side: arm width', 1, 5),
        f('station.braceAt', 'Side: brace starts along the arm', 0.1, 0.9, 0.01),
        f('station.braceDrop', 'Side: brace drop', 4, 25),
        f('station.brace', 'Side: brace width', 0.5, 4),
      ],
    },
    {
      key: 'parallettes',
      title: 'Parallettes',
      blurb: 'A handle under each hand on splayed legs; holds on the hands are lifted onto them.',
      preview: { kind: 'worn', look: () => ({ stage: 'parallettes' }), samples: samplesFor('parallettes') },
      fields: [f('parallettes.lift', 'Lift', 3, 14), f('parallettes.half', 'Leg spread at the handle', 3, 9), f('parallettes.splay', 'Leg splay', 0, 5), f('parallettes.leg', 'Leg width', 0.8, 3.5), f('parallettes.handle', 'Handle width', 1, 4), f('parallettes.grip', 'Handle under the hand', 0, 5)],
    },
    {
      key: 'rings',
      title: 'Gymnastic rings',
      blurb: 'Rings in place of a bar, on straps; the line width is every ring’s.',
      preview: { kind: 'worn', look: () => ({ stage: 'rings' }), samples: [...end.slice(0, 2), ...pick('ex_9')] },
      fields: [f('rings.r', 'Ring size (for a bar)', 2, 6), f('rings.drop', 'Below the hand', 0, 3), f('rings.strap', 'Strap width', 0.4, 2.5), f('rings.gap', 'Strap stops above the hand', 2, 8), f('rings.stroke', 'Ring line (every ring)', 0.6, 3)],
    },
    {
      key: 'plates',
      title: 'Plates, dumbbells, kettlebells',
      blurb: "Their size comes from each figure's load; the rim and hub are shared.",
      preview: {
        kind: 'specs',
        specs: [
          discs([{ at: [30, 50], r: 9, tone: 'body', kind: 'plate' }, { at: [62, 50], r: 6, tone: 'body', kind: 'plate' }, { at: [84, 50], r: 3.6, tone: 'body', kind: 'plate' }]),
          discs([{ at: [50, 40], r: 4.2, tone: 'body', kind: 'plate' }, { at: [50, 62], r: 3.4, tone: 'body', kind: 'ring' }]),
        ],
      },
      fields: [f('plate.stroke', 'Rim line', 0.5, 3), f('plate.hub', 'Hub, as a share of the size', 0.1, 0.5, 0.01), f('plate.hubMin', 'Smallest hub', 0.3, 2)],
    },
    {
      key: 'bar',
      title: 'Bar seen end-on',
      blurb: 'Drawn over the hands, like a plate, so the fist never hides it.',
      preview: { kind: 'specs', specs: [{ scene: 'bar', strokes: [], holds: [{ at: [40, 40], shape: 'bar' }] }, ...end.slice(0, 1).map((id) => ENTRY_BY_ID.get(id)!.asBuilt())] },
      fields: [f('bar.r', 'Radius', 1.2, 5), f('bar.stroke', 'Line', 0.5, 3)],
    },
    {
      key: 'holds',
      title: 'Climbing holds',
      blurb: 'Before a figure scales or turns them; the key hold is drawn in the branch colour.',
      preview: { kind: 'specs', specs: [holdBoard(false), holdBoard(true)] },
      fields: [
        f('holds.jug.rx', 'Jug width', 2, 9),
        f('holds.jug.ry', 'Jug height', 1, 6),
        f('holds.edge.w', 'Edge width', 3, 16),
        f('holds.edge.h', 'Edge depth', 1, 5),
        f('holds.sloper.w', 'Sloper width', 6, 20),
        f('holds.sloper.h', 'Sloper height', 3, 10),
        f('holds.pinch.w', 'Pinch width', 2, 7),
        f('holds.pinch.h', 'Pinch height', 5, 15),
        f('holds.pocket.r', 'Pocket size', 1.5, 6),
        f('holds.pocket.hole', 'Pocket hole', 0.5, 3),
        f('holds.foot.r', 'Foot chip', 0.8, 4),
        f('holds.volume.w', 'Volume width', 10, 30),
        f('holds.volume.h', 'Volume height', 6, 20),
        f('holds.rung.w', 'Rung width', 10, 36),
        f('holds.rung.h', 'Rung depth', 1, 5),
        f('holds.end.r', 'Bar hold', 1, 5),
      ],
    },
  ];
}

const TONES: GearTone[] = ['chalk', 'iron', 'steel', 'gold', 'crimson'];

export const PropsSheet: React.FC<{ changes: PropChanges; saved: PropChanges; onChange: (changes: PropChanges | null) => void }> = ({ saved, onChange }) => {
  const tuning = usePropTuning();
  const [tone, setTone] = useState<GearTone>('steel');
  const list = useMemo(() => cards(), []);

  const update = (next: PropTuning) => {
    const changes = changesOf(next);
    onChange(JSON.stringify(changes) === JSON.stringify(saved) ? null : changes);
  };

  const changedCount = Object.keys(changesOf(tuning)).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[12.5px] text-fg-3">Worn pieces in</span>
        <div className="flex gap-1">
          {TONES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTone(option)}
              aria-pressed={tone === option}
              className={`h-8 pl-1.5 pr-2.5 rounded-tag inline-flex items-center gap-1.5 text-[12.5px] font-bold cursor-pointer ${tone === option ? 'bg-act text-act-deep' : 'bg-ink-850 text-fg-3 hover:text-fg'}`}
            >
              <span className="w-4 h-4 rounded-[3px] border border-ink-950" style={{ background: TONE[option] }} />
              {option}
            </button>
          ))}
        </div>
        <span className="text-[12.5px] text-fg-4">
          {changedCount ? `${changedCount} group${changedCount === 1 ? '' : 's'} differ from the defaults` : 'Everything at its default'}
        </span>
        <Button onClick={() => update(PROP_DEFAULTS)} disabled={!changedCount}>
          Everything to default
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] xl:grid-cols-2 gap-4">
        {list.map((card) => (
          <Panel key={card.key} title={card.title}>
            <p className="text-[12.5px] text-fg-3 -mt-1">{card.blurb}</p>
            <div className="grid grid-cols-3 gap-2">
              {card.preview.kind === 'worn'
                ? card.preview.samples.slice(0, 3).map((id) => {
                    const entry = ENTRY_BY_ID.get(id);
                    if (!entry) return null;
                    return (
                      <div key={id} className="flex flex-col gap-1">
                        <div className="rounded-tag bg-ink-950 border border-ink-700 aspect-square">
                          <GearedFigure spec={entry.asBuilt()} look={(card.preview as { look: (tone: GearTone) => GearLook }).look(tone)} animate alwaysAnimate compact={false} className="w-full h-full" title={entry.name} />
                        </div>
                        <span className="text-[11px] text-fg-4 truncate">{entry.name}</span>
                      </div>
                    );
                  })
                : card.preview.specs.map((spec, i) => (
                    <div key={i} className="rounded-tag bg-ink-950 border border-ink-700 aspect-square">
                      <Figure spec={spec} compact={false} animate alwaysAnimate className="w-full h-full" />
                    </div>
                  ))}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {card.fields.map((field) => {
                const value = get(tuning, field.path);
                const base = get(PROP_DEFAULTS, field.path);
                return (
                  <NumberField
                    key={field.path}
                    label={field.label}
                    value={value}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    changed={Math.abs(value - base) > 1e-9}
                    onReset={() => update(set(tuning, field.path, base))}
                    onChange={(next) => update(set(tuning, field.path, next))}
                  />
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
};
