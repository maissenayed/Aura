'use client';

import React, { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { useGame } from './GameProvider';
import { useSignature } from './useSignature';
import { Figure, Label } from './kit';
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
  const catalog = useMemo(() => gearCatalog(save, plan, derived.level.level, derived.level.rank, crew), [save, plan, derived.level.level, derived.level.rank, crew]);
  const equipped = equippedGear(save, catalog);
  const [openSlot, setOpenSlot] = useState<GearSlot | null>(null);
  const temper = temperOf(save.quests, plan);
  const names = Object.fromEntries(catalog.map((item) => [item.id, item.name]));
  const byId = new Map(derived.attributes.map((attribute) => [attribute.def.id as string, attribute]));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] items-start">
      <section className="flex flex-col items-center gap-3 p-4 rounded-card bg-ink-900" aria-label="Your athlete">
        <button
          type="button"
          onClick={signature.next}
          disabled={signature.choices < 2}
          aria-label={`${signature.name}${signature.choices > 1 ? '. Tap for another of your hardest skills' : ''}`}
          className="w-[220px] h-[220px] rounded-card bg-ink-850 flex items-center justify-center cursor-pointer disabled:cursor-default"
        >
          <Figure spec={signature.spec} state={signature.earned ? 'mastered' : 'locked'} animate className="w-[200px] h-[200px]" />
        </button>
        <span className="text-center">
          <span className={`block font-display font-extrabold uppercase text-[20px] leading-none ${TONE_TEXT[equipped.title?.tone ?? 'iron']}`}>{equipped.title?.name ?? derived.level.rank}</span>
          <span className="block text-[12.5px] text-fg-3 mt-1">
            {signature.earned ? signature.name : 'Prove a skill to strike its pose'} · on the {equipped.stage?.name.toLowerCase() ?? 'floor'}
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

        {openSlot && (
          <SlotList
            slot={openSlot}
            items={catalog.filter((item) => item.slot === openSlot)}
            equippedId={equipped[openSlot]?.id ?? null}
            onEquip={(id) => equip(openSlot, id)}
          />
        )}

        <section className="flex flex-col gap-2" aria-label="What your crew sees">
          <Label>What your crew sees</Label>
          <PlayerCard
            card={{
              name: 'You',
              level: derived.level.level,
              rank: equipped.title?.name ?? derived.level.rank,
              signature: signature.earned && save.signature ? save.signature : null,
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

const SlotList: React.FC<{ slot: GearSlot; items: GearItem[]; equippedId: string | null; onEquip: (id: string | null) => void }> = ({ slot, items, equippedId, onEquip }) => {
  const sorted = [...items].sort((a, b) => Number(b.owned) - Number(a.owned));
  const blurb = GEAR_SLOTS.find((entry) => entry.slot === slot)?.blurb;
  return (
    <section className="flex flex-col gap-2 p-3 rounded-card bg-ink-900" aria-label={`${slot} items`}>
      {blurb && <p className="text-[12.5px] text-fg-3">{blurb}</p>}
      <ul className="flex flex-col gap-1.5">
        {sorted.map((item) => {
          const on = item.id === equippedId;
          return (
            <li key={item.id} className="list-none">
              <button
                type="button"
                disabled={!item.owned}
                aria-pressed={on}
                onClick={() => onEquip(on ? null : item.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-card text-left cursor-pointer disabled:cursor-default ${on ? 'bg-ink-800 ring-1 ring-fg-3' : 'bg-ink-850'}`}
              >
                {!item.owned && <Lock className="w-4 h-4 shrink-0 text-fg-5" />}
                <span className="flex-1 min-w-0">
                  <span className={`block text-[13.5px] font-semibold ${item.owned ? TONE_TEXT[item.tone] : 'text-fg-4'}`}>{item.name}</span>
                  <span className="block text-[11.5px] text-fg-4">
                    {item.how}
                    {item.progress ? ` · ${item.progress}` : ''}
                  </span>
                </span>
                {item.owned && <span className="text-[12px] font-semibold text-fg-3">{on ? 'Equipped' : 'Equip'}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
