'use client';

import { useMemo } from 'react';
import { useGame } from './GameProvider';
import { equippedGear, gearCatalog } from '../../data/gear';
import type { GearTone } from '../../data/gear';
import { gradeOf, slotOfPiece, temperOf } from '../../utils/armor';
import type { ArmorSlot } from '../../utils/campaignV3';
import { useCrewAwards } from '../../utils/crewStore';
import { GearLook, gearLookOf } from './GearedFigure';

/** Tempering grades as the gear's material: cotton tape, leather, steel thread, gold stitching. */
const GRADE_TONE: GearTone[] = ['chalk', 'iron', 'steel', 'gold'];

/** What the athlete is wearing now: the equipped items, and this week's forged armour in its grade. */
export function useMyGearLook(): GearLook {
  const { save, plan, derived } = useGame();
  const crew = useCrewAwards();
  return useMemo(() => {
    const catalog = gearCatalog(save, plan, derived.level.level, derived.level.rank, crew);
    const equipped = equippedGear(save, catalog);
    const ids: Record<string, string> = {};
    for (const [slot, item] of Object.entries(equipped)) if (item) ids[slot] = item.id;
    const temper = temperOf(save.quests, plan);
    const joints: Partial<Record<ArmorSlot, GearTone>> = {};
    for (const { piece, forged } of derived.week.armor) {
      if (!forged) continue;
      const slot = slotOfPiece(piece.id);
      joints[slot] = GRADE_TONE[gradeOf(temper.get(slot) ?? 0).index];
    }
    return gearLookOf(ids, joints);
  }, [save, plan, derived.level.level, derived.level.rank, derived.week.armor, crew]);
}
