'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Castle, ChevronDown } from 'lucide-react';
import { ArrowRightIcon, CheckIcon, LockIcon } from './icons';
import { Chip } from './kit';
import { LadderStatus, TierStatus, XP_RULES } from '../../utils/protocolEngine';

/**
 * Every tower of the plan and how far up it you are. A floor clears when its
 * skill is mastered on the tree; a placed floor counts for the climb but is
 * credited, not earned, so only mastered floors are gold. A tower is climbed
 * when every floor is clear and its summit is proven, which pays its XP and
 * a badge.
 */

const skillHref = (tower: LadderStatus, floor: TierStatus) =>
  floor.tier.skill ? `/?tree=${floor.tier.skill.tree}&skill=${encodeURIComponent(floor.tier.skill.id)}` : tower.ladder.tower ? `/?tree=${tower.ladder.tower.tree}` : '/';

const climbedOf = (tower: LadderStatus) => tower.tiers.length > 0 && tower.clearedCount === tower.tiers.length && tower.summitProven;

export const TowersPanel: React.FC<{ ladders: LadderStatus[]; className?: string }> = ({ ladders, className = '' }) => {
  const towers = ladders.filter((entry) => entry.ladder.tower);
  const [openId, setOpenId] = useState<string | null>(null);
  const climbed = towers.filter(climbedOf).length;

  return (
    <section className={`flex flex-col gap-3 p-4 rounded-card bg-ink-900 ${className}`} aria-label="Towers">
      <div className="flex items-center gap-2">
        <Castle className="w-[18px] h-[18px] text-fg-3" aria-hidden="true" />
        <h2 className="flex-1 font-display font-extrabold uppercase text-[22px] leading-none">Towers</h2>
        {towers.length > 0 && (
          <span className={`num font-bold text-[13px] ${climbed ? 'text-earned' : 'text-fg-3'}`}>
            {climbed}/{towers.length} climbed
          </span>
        )}
      </div>

      {towers.length === 0 ? (
        <p className="text-[13px] text-fg-3">
          No towers in your plan. Raise one in the{' '}
          <Link href="/forge" className="font-semibold text-act hover:underline">
            Forge
          </Link>
          : a summit skill and every skill below it, climbed floor by floor.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {towers.map((tower) => (
            <TowerRow key={tower.ladder.id} tower={tower} open={openId === tower.ladder.id} onToggle={() => setOpenId(openId === tower.ladder.id ? null : tower.ladder.id)} />
          ))}
        </ul>
      )}

      {towers.length > 0 && (
        <p className="text-[12px] text-fg-4">
          A floor clears when you master its skill on the tree. A climbed tower pays <span className="num font-bold">{XP_RULES.tower}</span> XP and a badge.
        </p>
      )}
    </section>
  );
};

const TowerRow: React.FC<{ tower: LadderStatus; open: boolean; onToggle: () => void }> = ({ tower, open, onToggle }) => {
  const total = tower.tiers.length;
  const climbed = climbedOf(tower);
  const next = tower.tiers.find((floor) => !floor.cleared);
  const summit = tower.tiers[total - 1];
  // Every floor clear but the summit only placed: it still has to be proven.
  const proveSummit = !next && !tower.summitProven && summit;
  const status = climbed ? 'Climbed' : proveSummit ? `Prove ${summit.tier.name}` : next ? `Next: ${next.tier.name}` : '';

  return (
    <li className={`list-none rounded-card ${open ? 'bg-ink-850 raised' : 'bg-ink-950'}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex flex-col gap-2 p-3 text-left cursor-pointer">
        <span className="flex items-center gap-2 w-full">
          <span className={`flex-1 min-w-0 text-[14px] font-semibold truncate ${climbed ? 'text-earned-soft' : 'text-fg'}`}>{tower.ladder.name}</span>
          {climbed ? (
            <Chip tone="earned">
              <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />+{XP_RULES.tower} XP
            </Chip>
          ) : (
            <span className="num font-bold text-[13px] text-fg-2">
              {tower.clearedCount}/{total}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-fg-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </span>
        <Floors tower={tower} />
        {status && <span className={`text-[12px] truncate ${climbed ? 'text-earned-soft' : 'text-fg-3'}`}>{status}</span>}
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {/* The summit on top, the way the tower stands. */}
          <ol className="flex flex-col gap-1" aria-label={`${tower.ladder.name}, summit first`}>
            {[...tower.tiers].reverse().map((floor) => (
              <FloorRow key={floor.tier.id} tower={tower} floor={floor} isSummit={floor === summit} />
            ))}
          </ol>
          {!climbed && (
            <Link
              href={skillHref(tower, proveSummit ? summit : (next ?? summit))}
              className="mt-1 h-11 rounded-card bg-act text-act-deep font-display font-extrabold uppercase text-lg tracking-[0.02em] flex items-center justify-center gap-1.5 active:scale-[.97] transition"
            >
              {proveSummit ? 'Prove the summit' : 'Climb'}
              <ArrowRightIcon className="w-[18px] h-[18px]" strokeWidth={2.4} />
            </Link>
          )}
        </div>
      )}
    </li>
  );
};

/** One segment per floor, bottom floor first: gold when mastered, chalk for the next one, iron otherwise. */
const Floors: React.FC<{ tower: LadderStatus }> = ({ tower }) => {
  const mastered = tower.tiers.filter((floor) => floor.cleared && !floor.byBlueprint).length;
  const placed = tower.clearedCount - mastered;
  return (
    <span
      className="flex gap-1 w-full"
      role="img"
      aria-label={`${tower.clearedCount} of ${tower.tiers.length} floors clear${placed ? `, ${placed} of them placed` : ''}`}
    >
      {tower.tiers.map((floor) => (
        <span
          key={floor.tier.id}
          className={`flex-1 h-2.5 rounded-[2px] ${
            floor.cleared ? (floor.byBlueprint ? 'bg-ink-500' : 'bg-earned') : floor.isCurrent ? 'bg-act' : 'bg-ink-700'
          }`}
        />
      ))}
    </span>
  );
};

const FloorRow: React.FC<{ tower: LadderStatus; floor: TierStatus; isSummit: boolean }> = ({ tower, floor, isSummit }) => {
  const placed = floor.cleared && floor.byBlueprint;
  const mastered = floor.cleared && !floor.byBlueprint;
  return (
    <li className="list-none">
      <Link
        href={skillHref(tower, floor)}
        className={`flex items-center gap-2.5 h-10 px-2.5 rounded-tag transition hover:bg-ink-800 ${floor.isCurrent ? 'bg-ink-800 ring-1 ring-act' : ''}`}
      >
        <span className="w-9 shrink-0 num font-bold text-[12px] text-fg-4">{floor.tier.rung}</span>
        <span className={`flex-1 min-w-0 text-[13px] truncate ${mastered ? 'text-earned-soft' : floor.isCurrent ? 'text-fg font-semibold' : 'text-fg-3'}`}>{floor.tier.name}</span>
        {isSummit && <span className="eyebrow shrink-0 text-fg-4">Summit</span>}
        {mastered ? (
          <CheckIcon className="w-4 h-4 text-earned shrink-0" strokeWidth={3} aria-label="Mastered" />
        ) : placed ? (
          <span className="text-[11px] font-semibold text-fg-4 shrink-0">Placed</span>
        ) : floor.isCurrent ? (
          <span className="text-[11px] font-semibold text-act shrink-0">Next</span>
        ) : (
          <LockIcon className="w-3.5 h-3.5 text-fg-5 shrink-0" strokeWidth={2.4} aria-label="Not yet" />
        )}
      </Link>
    </li>
  );
};
