'use client';

import React, { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { useGame } from './GameProvider';
import { PoseOption, useSignature } from './useSignature';
import { Figure, Label } from './kit';
import { GearedFigure, stageOfId } from './GearedFigure';
import { Apparatus, apparatusOf, fitText, stageFits } from './figureRig';
import type { FigureSpec } from '../skilltree/SkillFigure';
import { useMyGearLook } from './useGearLook';
import { PlayerCard } from './PlayerCard';
import { GEAR_SLOTS, GearItem, GearSlot, GearTone, equippedGear, gearCatalog } from '../../data/gear';
import { useCrewAwards } from '../../utils/crewStore';
import { JOINT_GEAR, gradeOf, temperOf } from '../../utils/armor';
import { slotOfPiece } from '../../utils/armor';
import { WEB_ORDER } from './RadarWeb';

const TONE_TEXT: Record<GearTone, string> = {
  chalk: 'text-fg-2',
  iron: 'text-fg',
  steel: 'text-armour',
  gold: 'text-earned',
  crimson: 'text-boss-soft',
};

/**
 * The avatar and its gear. Cosmetic only: nothing here changes XP, stats or
 * boss damage, nothing is for sale and nothing drops at random. Every item
 * says how it is earned; only what is equipped is saved.
 */
export const GearTab: React.FC = () => {
  const { save, plan, derived, equip } = useGame();
  const crew = useCrewAwards();
  const signature = useSignature();
  const look = useMyGearLook();
  const catalog = useMemo(() => gearCatalog(save, plan, derived.level.level, derived.level.rank, crew), [save, plan, derived.level.level, derived.level.rank, crew]);
  const equipped = equippedGear(save, catalog);
  const [openSlot, setOpenSlot] = useState<GearSlot | 'pose' | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const temper = temperOf(save.quests, plan);
  const names = Object.fromEntries(catalog.map((item) => [item.id, item.name]));
  const byId = new Map(derived.attributes.map((attribute) => [attribute.def.id as string, attribute]));
  const stageShown = equipped.stage && stageFits(signature.spec, stageOfId(equipped.stage.id)) && stageOfId(equipped.stage.id) ? equipped.stage : null;

  /** A new move keeps the stage if it suits it; otherwise the stage goes back to the plain floor, and says so. */
  const choosePose = (option: PoseOption) => {
    signature.pick(option.key);
    const stage = equipped.stage;
    if (stage && !stageFits(option.spec, stageOfId(stage.id))) {
      equip('stage', null);
      setNote(`The ${stage.name.toLowerCase()} doesn't suit ${option.name}, so the stage is back to the floor.`);
    } else setNote(null);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] items-start">
      <section className="flex flex-col items-center gap-3 p-4 rounded-card bg-ink-900" aria-label="Your athlete">
        <span className="w-[220px] h-[220px] rounded-card bg-ink-850 flex items-center justify-center">
          <GearedFigure spec={signature.spec} state={signature.earned ? 'mastered' : 'locked'} look={look} animate className="w-[200px] h-[200px]" title={signature.name} />
        </span>
        <span className="text-center">
          <span className={`block font-display font-extrabold uppercase text-[20px] leading-none ${TONE_TEXT[equipped.title?.tone ?? 'iron']}`}>{equipped.title?.name ?? derived.level.rank}</span>
          <span className="block text-[12.5px] text-fg-3 mt-1">
            {signature.earned ? signature.name : 'Prove a skill to strike its pose'} · {stageShown ? `on the ${stageShown.name.toLowerCase()}` : whereOf(signature.spec)}
          </span>
        </span>
        <ul className="w-full flex flex-wrap justify-center gap-1.5" aria-label="Joint gear this week">
          {derived.week.armor.map(({ piece, forged }) => {
            const slot = slotOfPiece(piece.id);
            const grade = gradeOf(temper.get(slot) ?? 0);
            return (
              <li
                key={piece.id}
                className={`list-none h-7 px-2 rounded-tag text-[11.5px] font-semibold flex items-center ${forged ? (grade.index === 3 ? 'bg-earned-deep text-earned' : 'bg-armour-deep text-armour') : 'border border-dashed border-ink-600 text-fg-5'}`}
                title={forged ? `${grade.name}: ${grade.look}` : 'Not forged this week'}
              >
                {grade.name} {JOINT_GEAR[slot]?.toLowerCase() ?? piece.slot}
              </li>
            );
          })}
        </ul>
        <p className="text-[11.5px] text-fg-4 text-center">Joint gear is this week&apos;s forged armour, in the grade its weeks have tempered it to.</p>
      </section>

      <div className="flex flex-col gap-3">
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-label="Gear slots">
          <li className="list-none">
            <button
              type="button"
              aria-expanded={openSlot === 'pose'}
              onClick={() => setOpenSlot(openSlot === 'pose' ? null : 'pose')}
              className={`w-full h-[78px] p-2.5 rounded-card text-left flex flex-col justify-between cursor-pointer transition ${openSlot === 'pose' ? 'bg-ink-800 ring-1 ring-fg-3' : 'bg-ink-900 hover:bg-ink-850'}`}
            >
              <span className="eyebrow text-fg-4">Move · {signature.options.length}</span>
              <span className={`text-[13px] font-semibold leading-tight line-clamp-2 ${signature.earned ? 'text-earned' : 'text-fg-5'}`}>{signature.earned ? signature.name : 'None proven yet'}</span>
            </button>
          </li>
          {GEAR_SLOTS.map(({ slot, name }) => {
            const item = equipped[slot];
            const owned = catalog.filter((entry) => entry.slot === slot && entry.owned).length;
            return (
              <li key={slot} className="list-none">
                <button
                  type="button"
                  aria-expanded={openSlot === slot}
                  onClick={() => setOpenSlot(openSlot === slot ? null : slot)}
                  className={`w-full h-[78px] p-2.5 rounded-card text-left flex flex-col justify-between cursor-pointer transition ${openSlot === slot ? 'bg-ink-800 ring-1 ring-fg-3' : 'bg-ink-900 hover:bg-ink-850'}`}
                >
                  <span className="eyebrow text-fg-4">
                    {name} · {owned}
                  </span>
                  <span className={`text-[13px] font-semibold leading-tight line-clamp-2 ${item ? TONE_TEXT[item.tone] : 'text-fg-5'}`}>{item?.name ?? 'Empty'}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {note && (
          <p className="text-[12.5px] text-fg-3 px-1" role="status">
            {note}
          </p>
        )}

        {openSlot === 'pose' && <PoseList options={signature.options} picked={signature.key} onPick={choosePose} />}

        {openSlot && openSlot !== 'pose' && (
          <SlotList
            slot={openSlot}
            items={catalog.filter((item) => item.slot === openSlot)}
            equippedId={equipped[openSlot]?.id ?? null}
            move={signature.earned ? { spec: signature.spec, name: signature.name } : null}
            onEquip={(id) => {
              setNote(null);
              equip(openSlot, id);
            }}
          />
        )}

        <section className="flex flex-col gap-2" aria-label="What your crew sees">
          <Label>What your crew sees</Label>
          <PlayerCard
            card={{
              name: 'You',
              level: derived.level.level,
              rank: equipped.title?.name ?? derived.level.rank,
              signature: signature.key,
              signatureName: signature.earned ? signature.name : null,
              gear: Object.fromEntries(Object.entries(equipped).map(([slot, item]) => [slot, item?.id ?? ''])),
              shape: WEB_ORDER.map((id) => {
                const attribute = byId.get(id);
                return { id, short: attribute?.def.short ?? id, share: attribute?.unlocked && attribute.value !== null ? attribute.value / 999 : null };
              }),
            }}
            gearNames={names}
          />
          <p className="text-[11.5px] text-fg-4">Your web&apos;s shape without numbers, your title, pose and gear. Bodyweight never.</p>
        </section>
      </div>
    </div>
  );
};

/** Where a move is done when no stage is drawn: its own setting. */
const WHERE: Partial<Record<FigureSpec['scene'], string>> = { bar: 'on a bar', bars: 'on parallel bars', rings: 'on rings', ground: 'on the ground' };
const whereOf = (spec: FigureSpec) => WHERE[spec.scene] ?? 'on the floor';

const GROUPS: { apparatus: Apparatus; name: string; fits: string }[] = [
  { apparatus: 'bar', name: 'On a bar', fits: 'Pull-up bar or rings' },
  { apparatus: 'rings', name: 'On rings', fits: 'Rings' },
  { apparatus: 'floor', name: 'On the floor', fits: 'Floor, plinth, podium, summit' },
  { apparatus: 'fixed', name: 'Own equipment', fits: 'Keeps its bars, wall or box' },
];

/** Every proven move, grouped by what it is done on, so the stages it allows are plain. */
const PoseList: React.FC<{ options: PoseOption[]; picked: string | null; onPick: (option: PoseOption) => void }> = ({ options, picked, onPick }) => {
  if (options.length === 0) {
    return <p className="p-3 rounded-card bg-ink-900 text-[12.5px] text-fg-3">Prove a skill on the map and your athlete can do it here. Placed skills don&apos;t count.</p>;
  }
  const grouped = GROUPS.map((group) => ({ ...group, options: options.filter((option) => apparatusOf(option.spec) === group.apparatus) })).filter((group) => group.options.length > 0);
  return (
    <section className="flex flex-col gap-3 p-3 rounded-card bg-ink-900" aria-label="Moves">
      <p className="text-[12.5px] text-fg-3">The move your athlete does. Each move takes only the stages that suit it.</p>
      {grouped.map((group) => (
        <div key={group.apparatus} className="flex flex-col gap-1.5">
          <span className="eyebrow text-fg-4">
            {group.name} · <span className="text-fg-5 normal-case tracking-normal">{group.fits}</span>
          </span>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {group.options.map((option) => {
              const on = option.key === picked;
              return (
                <li key={option.key} className="list-none">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onPick(option)}
                    className={`w-full h-full flex flex-col items-center gap-1 p-2 rounded-card text-center cursor-pointer transition ${on ? 'bg-ink-800 ring-1 ring-earned' : 'bg-ink-850 hover:bg-ink-800'}`}
                  >
                    <Figure spec={option.spec} state={on ? 'mastered' : 'ready'} className="w-14 h-14" />
                    <span className={`text-[12.5px] font-semibold leading-tight line-clamp-2 ${on ? 'text-earned' : 'text-fg-2'}`}>{option.name}</span>
                    <span className="text-[11px] text-fg-5">Level {option.level}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
};

const SlotList: React.FC<{
  slot: GearSlot;
  items: GearItem[];
  equippedId: string | null;
  /** The move the avatar does: a stage it doesn't suit can't be put under it. */
  move: { spec: FigureSpec; name: string } | null;
  onEquip: (id: string | null) => void;
}> = ({ slot, items, equippedId, move, onEquip }) => {
  const fits = (item: GearItem) => slot !== 'stage' || !move || stageFits(move.spec, stageOfId(item.id));
  const sorted = [...items].sort((a, b) => Number(b.owned && fits(b)) - Number(a.owned && fits(a)) || Number(b.owned) - Number(a.owned));
  const blurb = GEAR_SLOTS.find((entry) => entry.slot === slot)?.blurb;
  return (
    <section className="flex flex-col gap-2 p-3 rounded-card bg-ink-900" aria-label={`${slot} items`}>
      {blurb && <p className="text-[12.5px] text-fg-3">{blurb}</p>}
      {slot === 'stage' && move && <p className="text-[12.5px] text-fg-3">{fitText(move.spec)}</p>}
      <ul className="flex flex-col gap-1.5">
        {sorted.map((item) => {
          const on = item.id === equippedId;
          const suits = fits(item);
          const usable = item.owned && suits;
          return (
            <li key={item.id} className="list-none">
              <button
                type="button"
                disabled={!usable}
                aria-pressed={on}
                onClick={() => onEquip(on ? null : item.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-card text-left cursor-pointer disabled:cursor-default ${on ? 'bg-ink-800 ring-1 ring-fg-3' : 'bg-ink-850'}`}
              >
                {!item.owned && <Lock className="w-4 h-4 shrink-0 text-fg-5" />}
                <span className="flex-1 min-w-0">
                  <span className={`block text-[13.5px] font-semibold ${usable ? TONE_TEXT[item.tone] : 'text-fg-4'}`}>{item.name}</span>
                  <span className="block text-[11.5px] text-fg-4">
                    {item.owned && !suits && move ? `Not with ${move.name}` : item.how}
                    {item.progress ? ` · ${item.progress}` : ''}
                  </span>
                </span>
                {usable && <span className="text-[12px] font-semibold text-fg-3">{on ? 'Equipped' : 'Equip'}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
