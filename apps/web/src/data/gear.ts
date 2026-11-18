/**
 * The avatar's gear: cosmetic only. No item changes XP, stats or boss damage,
 * nothing is for sale, and nothing drops at random. Every item comes from
 * something earned (a badge tier, a slain boss, a rank, a tower, the crew) and
 * says exactly how. Joint gear is the week's forged armour, in its tempering
 * grade, so it is not equipped by hand.
 */

import type { CampaignPlan } from '../utils/campaignPlan';
import { familyBadgeId, FamilyId } from '../utils/badgeFamilies';
import type { CrewAwards } from '../utils/badgeFamilies';
import type { ProtocolSave } from '../utils/protocolEngine';

export type GearSlot = 'stage' | 'head' | 'waist' | 'trophy' | 'banner' | 'title';

export const GEAR_SLOTS: { slot: GearSlot; name: string; blurb: string }[] = [
  { slot: 'stage', name: 'Stage', blurb: 'What you stand on: earned by rank and tower summits.' },
  { slot: 'head', name: 'Head', blurb: 'Headbands for perfect weeks and spotter streaks.' },
  { slot: 'waist', name: 'Waist', blurb: 'A belt that gains plates with records; a chalk bag for sessions.' },
  { slot: 'trophy', name: 'Trophy', blurb: 'One item for each boss you slew.' },
  { slot: 'banner', name: 'Banner', blurb: 'Crew colours from raids and duels.' },
  { slot: 'title', name: 'Title', blurb: 'Your rank and one boss of your choosing.' },
];

/** The material an item is made of: gold only from proof, crimson only from bosses. */
export type GearTone = 'chalk' | 'iron' | 'steel' | 'gold' | 'crimson';

export interface GearItem {
  id: string;
  slot: GearSlot;
  name: string;
  tone: GearTone;
  /** How it is earned, in words. */
  how: string;
  owned: boolean;
  /** For a locked item: how far there is to go, e.g. "9 to go". */
  progress?: string;
}

const TIER_TONE: GearTone[] = ['chalk', 'iron', 'steel', 'gold'];
const TIER_NAME = ['Chalk', 'Iron', 'Steel', 'Gold'];

/** Rank stages, by the level each rank title starts at on the ladder. */
const STAGES: { level: number; name: string }[] = [
  { level: 1, name: 'Floor' },
  { level: 6, name: 'Pull-up bar' },
  { level: 12, name: 'Parallettes' },
  { level: 20, name: 'Rings' },
  { level: 30, name: 'Competition plinth' },
  { level: 56, name: 'The podium' },
];

/**
 * Every item the plan and the save can offer, owned or not. Ownership is
 * worked out from badges, level and the crew's awards, so only what is
 * equipped is ever saved.
 */
export function gearCatalog(save: ProtocolSave, plan: CampaignPlan, level: number, rank: string, crew?: CrewAwards | null): GearItem[] {
  const badges = save.badges ?? {};
  const has = (id: string) => Boolean(badges[id]);
  const items: GearItem[] = [];

  for (const stage of STAGES) {
    items.push({
      id: `stage:${stage.name.toLowerCase().replace(/\s+/g, '-')}`,
      slot: 'stage',
      name: stage.name,
      tone: stage.level >= 30 ? 'gold' : stage.level >= 12 ? 'steel' : 'iron',
      how: stage.level === 1 ? 'Where everyone starts' : `Reach level ${stage.level}`,
      owned: level >= stage.level,
      progress: level >= stage.level ? undefined : `level ${level} of ${stage.level}`,
    });
  }
  for (const tree of plan.trees.filter((entry) => entry.tower)) {
    items.push({
      id: `stage:summit:${tree.id}`,
      slot: 'stage',
      name: `${tree.name} summit`,
      tone: 'gold',
      how: `Climb ${tree.name} to a proven summit`,
      owned: has(`tower:${tree.id}`),
    });
  }

  const tiered = (family: FamilyId, slot: GearSlot, names: string[], what: string) =>
    names.forEach((name, index) =>
      items.push({
        id: `${slot}:${family}:${index + 1}`,
        slot,
        name,
        tone: TIER_TONE[index],
        how: `${TIER_NAME[index]} ${what} badge`,
        owned: has(familyBadgeId(family, index + 1)),
      }),
    );
  tiered('perfect', 'head', ['Chalk headband', 'Iron headband', 'Steel headband', 'Gold headband'], 'Perfect weeks');
  tiered('sessions', 'waist', ['Chalk bag', 'Leather chalk bag', 'Steel-clasp chalk bag', 'Gold-stitched chalk bag'], 'Sessions');
  tiered('records', 'waist', ['Lifting belt', 'Belt with iron plates', 'Belt with steel plates', 'Belt with gold plates'], 'Records');

  // The crew's items, counted by the server.
  const crewItem = (id: string, slot: GearSlot, name: string, tone: GearTone, how: string, count: number, need: number) =>
    items.push({ id, slot, name, tone, how, owned: count >= need, progress: count >= need ? undefined : `${count} of ${need}` });
  crewItem('head:spotter:1', 'head', 'Spotter band', 'iron', 'Twelve weeks in a spotter streak', crew?.spotterWeeks ?? 0, 12);
  crewItem('banner:raids:1', 'banner', 'Raid pennant', 'chalk', 'Land a hit in a crew raid that falls', crew?.raids ?? 0, 1);
  crewItem('banner:raids:2', 'banner', 'Raid banner', 'iron', 'Five crew raids', crew?.raids ?? 0, 5);
  crewItem('banner:raids:3', 'banner', 'Steel war banner', 'steel', 'Fifteen crew raids', crew?.raids ?? 0, 15);
  crewItem('banner:raids:4', 'banner', 'Gold war banner', 'gold', 'Forty crew raids', crew?.raids ?? 0, 40);
  crewItem('banner:duels:1', 'banner', 'Duel ribbon', 'chalk', 'Win a duel', crew?.duelsWon ?? 0, 1);

  for (const boss of plan.bosses) {
    const slain = has(`boss:${boss.id}`);
    const short = boss.name.replace(/^(The|One Clean) /, '');
    items.push({ id: `trophy:${boss.id}`, slot: 'trophy', name: `${short} trophy`, tone: 'crimson', how: `Slay ${boss.name}`, owned: slain });
    items.push({ id: `title:${boss.id}`, slot: 'title', name: `${rank} · Breaker of ${short}`, tone: 'crimson', how: `Slay ${boss.name}`, owned: slain });
  }
  items.push({ id: 'title:rank', slot: 'title', name: rank, tone: 'iron', how: 'Your rank', owned: true });
  return items;
}

/** The equipped item in each slot, if it is still owned: an item tied to a badge leaves with it. */
export function equippedGear(save: ProtocolSave, catalog: GearItem[]): Partial<Record<GearSlot, GearItem>> {
  const owned = new Map(catalog.filter((item) => item.owned).map((item) => [item.id, item]));
  const out: Partial<Record<GearSlot, GearItem>> = {};
  for (const [slot, id] of Object.entries(save.gear ?? {})) {
    const item = owned.get(id);
    if (item && item.slot === slot) out[slot as GearSlot] = item;
  }
  if (!out.stage) out.stage = catalog.find((item) => item.id === 'stage:floor');
  if (!out.title) out.title = catalog.find((item) => item.id === 'title:rank');
  return out;
}
