'use client';

import React, { useMemo, useState } from 'react';
import { Castle, Hexagon, Lock, Medal, Shirt, Sparkles, Star, TrendingUp } from 'lucide-react';
import { GearTab } from '../../../components/game/GearTab';
import { CrownIcon, ShieldIcon } from '../../../components/game/icons';
import { ThemeChoice, useThemeChoice } from '../../../utils/theme';
import { useGame } from '../../../components/game/GameProvider';
import { figureForLift } from '../../../components/game/figures';
import { Figure, HexLevel, Label, Meter, Stepper } from '../../../components/game/kit';
import { RadarWeb, WEB_ORDER } from '../../../components/game/RadarWeb';
import { ATTRIBUTE_MAX, AttributeStatus, evaluateAttributes } from '../../../utils/attributes';
import { addDays, asOf } from '../../../utils/evidence';
import { DAY_NAMES, formatStatValue, recordName, unitLabel } from '../../../utils/campaignPlan';
import { HistoryPoint } from '../../../utils/campaignV3';
import { BODYWEIGHT_RECORD, Sport, badgesUnbacked, currentOf, rankForLevel } from '../../../utils/protocolEngine';
import { JOINT_GEAR, gradeOf, temperOf } from '../../../utils/armor';
import type { ArmorSlot } from '../../../utils/campaignV3';
import { TIER_NAMES, familiesOf } from '../../../utils/badgeFamilies';
import { useCrewAwards } from '../../../utils/crewStore';
import { metricOf } from '../../../utils/records';
import { skillOf } from '../../../utils/treeIndex';

type Tab = 'stats' | 'badges' | 'lifts' | 'armor' | 'gear';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'stats', label: 'Stats', icon: Hexagon },
  { id: 'badges', label: 'Badges', icon: Medal },
  { id: 'lifts', label: 'Lifts', icon: TrendingUp },
  { id: 'armor', label: 'Armour', icon: ShieldIcon },
  { id: 'gear', label: 'Gear', icon: Shirt },
];

/** The level where the next rank starts, or null at the top. */
function nextRank(level: number, sport: Sport): { level: number; rank: string } | null {
  for (let next = level + 1; next <= level + 40; next += 1) {
    if (rankForLevel(next, sport) !== rankForLevel(level, sport)) return { level: next, rank: rankForLevel(next, sport) };
  }
  return null;
}

/** The hero sheet: attributes as a web, tendon work as armor, and the lift numbers behind it all. */
export default function HeroPage() {
  const { derived } = useGame();
  const { level } = derived;
  const [tab, setTab] = useState<Tab>('stats');
  const upcoming = nextRank(level.level, level.sport);

  return (
    <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <HexLevel level={level.level} progress={level.xpIntoLevel / level.xpForLevel} />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <h1 className="font-display font-extrabold uppercase text-[28px] lg:text-[36px] leading-[0.95]">{level.rank}</h1>
          <div className="flex items-center gap-2">
            <Meter value={level.xpIntoLevel / level.xpForLevel} tone="earned" className="h-1.5 max-w-[160px]" label="XP to next level" />
            {upcoming && (
              <span className="text-[12px] font-medium text-fg-4 truncate">
                {upcoming.rank} at {upcoming.level}
              </span>
            )}
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Hero" className="grid grid-cols-5 gap-1 p-1 rounded-card bg-ink-900 lg:max-w-xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-10 rounded-tag flex items-center justify-center gap-1.5 text-[13px] font-semibold transition cursor-pointer ${
              tab === id ? 'bg-ink-800 raised text-fg' : 'text-fg-4 hover:text-fg'
            }`}
          >
            <Icon className="hidden sm:block w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'badges' && <BadgesTab />}
      {tab === 'armor' && <ArmorTab />}
      {tab === 'lifts' && <LiftsTab />}
      {tab === 'gear' && <GearTab />}

      <ThemeSwitch />
    </main>
  );
}

/* ------------------------------------------------------------------ */

const StatsTab: React.FC = () => {
  const { derived, save, plan, todayIso } = useGame();
  const byId = new Map(derived.attributes.map((attribute) => [attribute.def.id as string, attribute]));
  // The web: six qualities in opposing pairs. A locked one stays on the web, at its floor.
  const web = WEB_ORDER.map((id) => byId.get(id))
    .filter((attribute): attribute is AttributeStatus => Boolean(attribute))
    .map((attribute) => (attribute.unlocked ? attribute : { ...attribute, value: null, display: null }));
  const monthAgo = useMemo(() => {
    if (!todayIso) return null;
    const then = asOf(save, addDays(todayIso, -28));
    const attributes = evaluateAttributes(then, plan, derived.bosses, derived.ladders);
    const at = new Map(attributes.map((attribute) => [attribute.def.id as string, attribute]));
    return WEB_ORDER.map((id) => (at.get(id)?.unlocked ? (at.get(id)?.value ?? null) : null));
  }, [save, plan, todayIso, derived.bosses, derived.ladders]);
  const bars = derived.attributes.filter((attribute) => attribute.unlocked && !WEB_ORDER.includes(attribute.def.id) && attribute.def.id !== 'mass' && attribute.def.id !== 'aura');
  const mass = byId.get('mass');
  const aura = byId.get('aura');
  const hidden = derived.attributes.filter((attribute) => !attribute.unlocked && !WEB_ORDER.includes(attribute.def.id));
  const selectable = [...web.filter((attribute) => attribute.unlocked), ...bars];
  const [selectedId, setSelectedId] = useState<string>(selectable[0]?.def.id ?? '');
  const selected = selectable.find((attribute) => attribute.def.id === selectedId) ?? selectable[0];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[auto_minmax(0,1fr)] items-start">
      <div className="flex flex-col items-center gap-2 overflow-hidden">
        <RadarWeb attributes={web} previous={monthAgo ?? undefined} size={340} selectedId={selected?.def.id} onSelect={setSelectedId} />
        <p className="text-[12px] text-fg-4 text-center max-w-[320px]">
          Solid: now. Dashed: four weeks ago. Push sits opposite Pull, so a lopsided shape is an imbalance to train.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {selected && (
          <section key={selected.def.id} className="flex flex-col gap-3 p-4 rounded-card bg-ink-900 anim-fade" aria-label={selected.def.name}>
            <div className="flex items-baseline gap-2">
              <h2 className="font-display font-bold text-[15px] uppercase tracking-[0.06em] text-fg-3 flex-1">{selected.def.name}</h2>
              <span className="font-display font-bold text-[28px] leading-none">{selected.display ?? selected.value ?? '–'}</span>
              {selected.display === null && <span className="font-display font-semibold text-sm text-fg-5">/{ATTRIBUTE_MAX}</span>}
            </div>
            <p className="text-xs text-fg-4">{selected.explain || selected.def.blurb}</p>
            {selected.parts.map((part) => (
              <div key={part.label} className="flex items-center gap-2.5">
                <span className="w-[112px] shrink-0 text-xs font-semibold text-fg-3 truncate" title={part.label}>
                  {part.label}
                </span>
                <Meter value={part.share ?? 0} tone={part.share === null ? 'dim' : 'earned'} />
                <span className="w-[96px] shrink-0 text-right font-display font-bold text-[12px] text-fg-2 truncate" title={part.detail}>
                  {part.detail}
                </span>
              </div>
            ))}
            {selected.value === null && selected.measure && <p className="text-[13px] text-fg-2">{selected.measure}</p>}
          </section>
        )}

        {web.some((attribute) => !attribute.unlocked) && (
          <p className="text-[12.5px] text-fg-4">
            {web
              .filter((attribute) => !attribute.unlocked)
              .map((attribute) => `${attribute.def.short}: ${attribute.unlockLabel}`)
              .join(' · ')}
          </p>
        )}

        {bars.length > 0 && (
          <section className="flex flex-col gap-2 p-4 rounded-card bg-ink-900" aria-label="More qualities">
            <Label>More qualities</Label>
            {bars.map((attribute) => (
              <button key={attribute.def.id} type="button" onClick={() => setSelectedId(attribute.def.id)} className="flex items-center gap-2.5 text-left cursor-pointer">
                <span className="w-[112px] shrink-0 text-xs font-semibold text-fg-3 truncate">{attribute.def.name}</span>
                <Meter value={(attribute.value ?? 0) / ATTRIBUTE_MAX} tone="act" />
                <span className="w-10 shrink-0 text-right num font-bold text-[13px] text-fg-2">{attribute.value ?? '–'}</span>
              </button>
            ))}
          </section>
        )}

        {mass && (
          <section className="flex flex-col gap-1.5 p-4 rounded-card bg-ink-900" aria-label="Body">
            <Label>Body · never shared</Label>
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] text-fg-3">{mass.explain || mass.def.blurb}</span>
              <span className="num font-bold text-[18px] text-fg">{mass.display ?? mass.value ?? '–'}</span>
            </span>
          </section>
        )}

        {aura?.unlocked && (
          <section className="notch flex items-center gap-3 p-4 rounded-card bg-earned-deep" aria-label="Aura">
            <Sparkles className="w-[22px] h-[22px] text-earned" />
            <span className="flex-1 text-[13px] text-earned-soft">{aura.def.blurb}</span>
            <span className="num font-bold text-[24px] text-earned">{aura.display ?? aura.value ?? '–'}</span>
          </section>
        )}

        {hidden.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {hidden.map((attribute) =>
              attribute.def.secret ? (
                <div
                  key={attribute.def.id}
                  className="notch col-span-2 h-[84px] rounded-card border border-dashed border-earned-line flex items-center justify-center gap-2.5 bg-earned-deep"
                  aria-label={`Secret attribute. ${attribute.unlockLabel}`}
                >
                  <Sparkles className="w-[22px] h-[22px] text-earned" />
                  <span className="flex flex-col">
                    <span className="font-display font-extrabold text-xl tracking-[0.2em] text-earned">???</span>
                    <span className="text-[12px] font-semibold text-earned-soft">{attribute.unlockLabel}</span>
                  </span>
                </div>
              ) : (
                <div key={attribute.def.id} className="h-[84px] p-2 rounded-card bg-ink-900 flex flex-col items-center justify-center gap-1 text-center" title={attribute.unlockLabel}>
                  <Lock className="w-4 h-4 text-fg-5" />
                  <span className="text-[11px] font-bold text-fg-3 leading-tight">{attribute.def.short}</span>
                  <span className="text-[9.5px] text-fg-5 leading-tight line-clamp-2">{attribute.unlockLabel}</span>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* Where each armor slot sits on the body, in the doll's 100×100 box (side of the screen, joint). */
const SLOTS: Record<string, { side: 'L' | 'R'; row: number; joint: [number, number] }> = {
  shoulders: { side: 'L', row: 0, joint: [44, 25] },
  elbows: { side: 'R', row: 0, joint: [60, 37] },
  fingers: { side: 'L', row: 1, joint: [36, 50] },
  wrists: { side: 'R', row: 1, joint: [64, 50] },
  ankles: { side: 'L', row: 2, joint: [44, 88] },
  knees: { side: 'R', row: 2, joint: [55, 70] },
};

/** A joint's tempering: weeks forged in total, its grade, and the next one. Grades are never lost. */
const TemperLine: React.FC<{ slot: string }> = ({ slot }) => {
  const { save, plan } = useGame();
  const weeks = temperOf(save.quests, plan).get(slot as ArmorSlot) ?? 0;
  const grade = gradeOf(weeks);
  const gear = JOINT_GEAR[slot as ArmorSlot];
  return (
    <span className="flex flex-col gap-1.5 p-2.5 rounded-card bg-ink-850">
      <span className="flex items-center justify-between gap-2">
        <span className={`text-[13px] font-semibold ${grade.index === 3 ? 'text-earned' : grade.index === 2 ? 'text-armour' : 'text-fg-2'}`}>
          {grade.name} {gear ? gear.toLowerCase() : ''} · {grade.look.toLowerCase()}
        </span>
        <span className="num font-bold text-[13px] text-fg-3">
          {weeks} {weeks === 1 ? 'week' : 'weeks'}
        </span>
      </span>
      {grade.next !== null && <Meter value={weeks / grade.next} tone="armour" label="Weeks to the next grade" />}
      <span className="text-[12px] text-fg-4">
        {grade.next !== null
          ? `${grade.next - weeks} more ${grade.next - weeks === 1 ? 'week' : 'weeks'} forged to reach ${gradeOf(grade.next).name}. Weeks need not be in a row.`
          : 'Masterwork: the highest grade. It stays, whatever comes next.'}
      </span>
    </span>
  );
};

const ArmorTab: React.FC = () => {
  const { derived, plan } = useGame();
  const pieces = derived.week.armor;
  const [pickedId, setPickedId] = useState<string | null>(pieces[0]?.piece.id ?? null);
  const picked = pieces.find((entry) => entry.piece.id === pickedId) ?? pieces[0];

  if (pieces.length === 0) {
    return (
      <p className="p-5 rounded-card border border-dashed border-ink-600 text-fg-3">
        No armour in your plan. Choose the joints to protect in the Forge (Week), then warm up with exercises that guard them.
      </p>
    );
  }

  const W = 340;
  const H = 330;
  const scale = 3.2;
  const ox = W / 2 - 50 * scale;
  const onBody = pieces.filter((entry) => SLOTS[entry.piece.slot.toLowerCase()]);
  const offBody = pieces.filter((entry) => !SLOTS[entry.piece.slot.toLowerCase()]);
  const rowY = [66, 166, 266];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[auto_minmax(0,1fr)] items-start">
      <div className="relative mx-auto rounded-card bg-ink-900" style={{ width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="absolute inset-0">
          <g transform={`translate(${ox} 4) scale(${scale})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="50,24 40,37 36,50" strokeWidth="4.2" style={{ stroke: 'var(--fig-ready-far)' }} />
            <polyline points="50,52 45,70 44,88" strokeWidth="4.8" style={{ stroke: 'var(--fig-ready-far)' }} />
            <polyline points="50,24 50,52" strokeWidth="7.6" style={{ stroke: 'var(--fig-ready-body)' }} />
            <polyline points="50,52 55,70 56,88" strokeWidth="5" style={{ stroke: 'var(--fig-ready-body)' }} />
            <polyline points="50,24 60,37 64,50" strokeWidth="4.4" style={{ stroke: 'var(--fig-ready-body)' }} />
            <circle cx="50" cy="16" r="5.4" style={{ fill: 'var(--fig-ready-body)' }} />
          </g>
          {onBody.map(({ piece, forged }) => {
            const slot = SLOTS[piece.slot.toLowerCase()];
            const bx = slot.side === 'L' ? 72 : W - 72;
            const jx = ox + slot.joint[0] * scale;
            const jy = 4 + slot.joint[1] * scale;
            return (
              <g key={piece.id}>
                <line x1={bx} y1={rowY[slot.row]} x2={jx} y2={jy} strokeWidth="1.5" strokeDasharray={forged ? undefined : '3 4'} style={{ stroke: forged ? 'var(--color-armour)' : 'var(--color-ink-600)' }} />
                <circle cx={jx} cy={jy} r="4.5" style={{ fill: forged ? 'var(--color-armour)' : 'var(--color-ink-500)' }} />
              </g>
            );
          })}
        </svg>
        {onBody.map(({ piece, forged }) => {
          const slot = SLOTS[piece.slot.toLowerCase()];
          const left = slot.side === 'L' ? 14 : W - 72;
          const on = picked?.piece.id === piece.id;
          return (
            <div key={piece.id} className="absolute flex flex-col items-center gap-1" style={{ left, top: rowY[slot.row] - 29, width: 58 }}>
              <button
                type="button"
                onClick={() => setPickedId(piece.id)}
                aria-pressed={on}
                aria-label={`${piece.slot}${forged ? ', forged this week' : ''}`}
                className={`w-[58px] h-[58px] rounded-card border-2 flex items-center justify-center transition active:scale-[.97] cursor-pointer ${
                  on ? 'border-act' : forged ? 'border-armour-line' : 'border-ink-600 border-dashed'
                } ${forged ? 'bg-armour-deep' : 'bg-ink-850'}`}
              >
                <ShieldIcon className={`w-6 h-6 ${forged ? 'text-armour' : 'text-fg-4'}`} lit={forged} />
              </button>
              <span className={`text-[11px] font-semibold whitespace-nowrap ${on ? 'text-fg' : forged ? 'text-armour' : 'text-fg-4'}`}>{piece.slot}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {picked && (
          <section className="flex flex-col gap-2.5 p-4 rounded-card bg-ink-900" aria-label={picked.piece.slot}>
            <span className="flex items-center gap-2">
              <span className="flex-1 font-display font-extrabold uppercase text-[24px] leading-none">{picked.piece.slot}</span>
              <span className={`h-7 px-2.5 rounded-tag eyebrow flex items-center ${picked.forged ? 'bg-armour text-armour-deep' : 'bg-ink-800 text-fg-4'}`}>
                {picked.forged ? 'Forged' : 'Not yet'}
              </span>
            </span>
            <TemperLine slot={picked.piece.slot.toLowerCase()} />
            <span className="text-[13px] text-fg-3">
              {picked.forged
                ? `Forged this week by ${picked.forgedBy.join(', ') || 'hand'}.`
                : picked.guardedBy.length
                  ? 'Tick one of these warm-ups on the quest board this week to forge it:'
                  : 'None of your warm-ups guards it yet. Add one in the Forge (Week → Warm-up).'}
            </span>
            {!picked.forged && picked.guardedBy.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {picked.guardedBy.map((entry) => (
                  <li key={`${entry.day}_${entry.name}`} className="list-none h-8 px-2.5 rounded-tag bg-ink-850 text-[12px] text-fg-2 flex items-center gap-1.5">
                    <span className="num font-bold text-fg-4">{DAY_NAMES[entry.day].slice(0, 3)}</span> {entry.name}
                  </li>
                ))}
              </ul>
            )}
            <span className="text-[12px] text-fg-4">Extra care: {picked.piece.drill} — {picked.piece.when.toLowerCase()}.</span>
          </section>
        )}
        {offBody.map(({ piece, forged }) => (
          <div key={piece.id} className={`flex items-center gap-3 p-3 rounded-card ${forged ? 'bg-armour-deep' : 'bg-ink-900'}`}>
            <ShieldIcon className={`w-5 h-5 ${forged ? 'text-armour' : 'text-fg-4'}`} lit={forged} />
            <span className="flex-1 text-sm font-semibold">{piece.slot}</span>
            <span className="text-xs text-fg-4">{piece.drill}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 p-3.5 rounded-card bg-ink-900">
          <Label>Full set</Label>
          <span className="flex-1 flex gap-1">
            {pieces.map(({ piece, forged }) => (
              <span key={piece.id} className={`flex-1 h-2 rounded-[2px] ${forged ? 'bg-armour' : 'bg-ink-700'}`} />
            ))}
          </span>
          <span className={`num font-bold text-[15px] ${derived.week.armorCount === pieces.length ? 'text-earned' : 'text-fg-2'}`}>
            {derived.week.armorCount}
            <span className="text-fg-5">/{pieces.length}</span>
          </span>
        </div>
        <p className="text-[12px] text-fg-4">
          {plan.armor.length ? 'Armour is forged by your warm-ups: each one guards some joints. Forge every piece in one week to unlock Tendons.' : ''}
        </p>
      </div>
    </div>
  );
};

const LiftsTab: React.FC = () => {
  const { derived, save, plan, logStat } = useGame();
  // Lifts that left the plan keep their history here instead of vanishing with the mission.
  const earlier = Object.entries(save.history ?? {})
    .filter(([key, points]) => points.length > 0 && key !== BODYWEIGHT_RECORD && !plan.lifts.some((lift) => lift.id === key))
    .sort((a, b) => (a[1][a[1].length - 1][0] < b[1][b[1].length - 1][0] ? 1 : -1));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="flex flex-col gap-4 min-w-0">
      <ul className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2 gap-2.5">
        {plan.lifts.map((lift) => {
          const value = currentOf(save, lift);
          const progress = lift.endgame ? Math.min(1, Math.max(0, (value - lift.baseline) / Math.max(1e-6, lift.endgame - lift.baseline))) : 0;
          const history = save.history?.[lift.id] ?? [];
          const best = history.length ? Math.max(...history.map((point) => point[1])) : null;
          const last = history[history.length - 1];
          return (
            <li key={lift.id} className="flex flex-col gap-2.5 p-3 rounded-card bg-ink-900">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 shrink-0 rounded-tag bg-ink-850 flex items-center justify-center">
                  <Figure spec={figureForLift(lift)} className="w-10 h-10" />
                </span>
                <span className="flex-1 min-w-0 flex flex-col">
                  <span className="text-[13.5px] font-semibold text-fg-2 truncate">{lift.name}</span>
                  <span className="text-[11px] text-fg-5 truncate">
                    {best === null ? 'Not logged yet' : `Best ${formatStatValue(best, lift.unit)} · last ${last[0].slice(5).replace('-', '/')}`}
                    {lift.endgame === null ? '' : ` · end-game ${formatStatValue(lift.endgame, lift.unit)}`}
                  </span>
                </span>
                {history.length > 1 && <Sparkline points={history} />}
              </div>
              <div className="flex items-center gap-2.5">
                <Meter value={progress} tone={progress >= 1 ? 'earned' : 'act'} className="h-1.5" />
                <Stepper
                  value={value}
                  step={lift.step}
                  unit={unitLabel(lift.unit)}
                  prefix={lift.unit === 'added-kg' ? '+' : ''}
                  placeholder={lift.hasBaseline ? undefined : 'log it'}
                  ariaLabel={lift.name}
                  onCommit={(next) => logStat(lift.id, next)}
                  commitSame
                />
              </div>
            </li>
          );
        })}
      </ul>
      {earlier.length > 0 && (
        <section aria-label="Earlier lifts" className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between">
            <Label>Earlier lifts</Label>
            <span className="text-[12px] text-fg-4">No longer in your plan</span>
          </span>
          <ul className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2 gap-2">
            {earlier.map(([key, points]) => {
              const unit = metricOf(key);
              const best = Math.max(...points.map((point) => point[1]));
              const last = points[points.length - 1];
              return (
                <li key={key} className="list-none flex items-center gap-3 p-3 rounded-card bg-ink-900">
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[13px] font-semibold text-fg-3 truncate">{recordName(key)}</span>
                    <span className="text-[11px] text-fg-5 truncate">
                      Best {formatStatValue(best, unit)} · last {last[0].slice(5).replace('-', '/')} · {points.length} logs
                    </span>
                  </span>
                  {points.length > 1 && <Sparkline points={points} />}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      </div>

      <section className="flex flex-col gap-2.5 p-4 rounded-card bg-ink-900" aria-label="Where your XP comes from">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display font-bold text-base">XP</h2>
          <span className="font-display font-bold text-earned">{derived.level.xp.toLocaleString()}</span>
        </div>
        {derived.level.breakdown.map((line) => (
          <div key={line.label} className="flex items-center gap-2.5">
            <span className="w-[110px] shrink-0 text-xs font-semibold text-fg-3">{line.label}</span>
            <Meter value={derived.level.xp ? line.xp / derived.level.xp : 0} tone="earned" className="h-1.5" />
            <span className="w-14 shrink-0 text-right font-display font-bold text-xs text-fg-2">{line.xp}</span>
          </div>
        ))}
      </section>
    </div>
  );
};

/** A lift's logged numbers over time, oldest on the left. */
const Sparkline: React.FC<{ points: HistoryPoint[] }> = ({ points }) => {
  const W = 72;
  const H = 28;
  const values = points.map((point) => point[1]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xy = values.map((value, index) => [(index / (values.length - 1)) * (W - 4) + 2, H - 3 - ((value - min) / span) * (H - 6)]);
  const rising = values[values.length - 1] >= values[0];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0" role="img" aria-label={`${values.length} logs, from ${values[0]} to ${values[values.length - 1]}`}>
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: rising ? 'var(--color-earned)' : 'var(--color-fg-4)' }} />
      <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r="2.6" style={{ fill: rising ? 'var(--color-earned)' : 'var(--color-fg-4)' }} />
    </svg>
  );
};

type BadgeKind = 'boss' | 'tower' | 'record' | 'skill';

const BADGE_LOOK: Record<BadgeKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  boss: { label: 'Bosses', icon: CrownIcon, tone: 'text-earned bg-earned-deep' },
  tower: { label: 'Towers', icon: Castle, tone: 'text-earned bg-earned-deep' },
  record: { label: 'End-game numbers', icon: Star, tone: 'text-earned bg-earned-deep' },
  skill: { label: 'Skills mastered', icon: Medal, tone: 'text-earned-soft bg-earned-deep' },
};

/**
 * Every badge earned: bosses, towers, end-game numbers, and each skill mastered on the trees.
 * Badges stay when the plan moves on; one the numbers stop backing can be taken back.
 */
const BadgesTab: React.FC = () => {
  const { save, plan, derived, recountBadges, todayIso } = useGame();
  const crew = useCrewAwards();
  const unbacked = todayIso ? badgesUnbacked(save, derived, plan, todayIso) : [];
  const badges: { id: string; kind: BadgeKind; name: string; date: string }[] = [];
  for (const [id, date] of Object.entries(save.badges ?? {})) {
    const [kind, ...rest] = id.split(':');
    const ref = rest.join(':');
    if (kind === 'boss') badges.push({ id, kind, name: plan.bosses.find((boss) => boss.id === ref)?.name ?? 'A boss from an earlier plan', date });
    if (kind === 'tower') badges.push({ id, kind, name: plan.trees.find((tree) => tree.id === ref)?.name ?? 'A tower from an earlier plan', date });
    if (kind === 'record') badges.push({ id, kind, name: recordName(ref), date });
  }
  for (const [key, date] of Object.entries(save.skills ?? {})) {
    const [tree, ...rest] = key.split(':');
    if (tree !== 'calisthenics' && tree !== 'bouldering') continue;
    // Placed skills are credited, not earned: no badge until they are proven.
    if (save.vouched?.[key]) continue;
    const skill = skillOf(tree, rest.join(':'));
    if (skill) badges.push({ id: key, kind: 'skill', name: skill.name, date });
  }

  // The campaign's story from the battle log: acts, the finish, new ranks and attributes, each once, at the
  // first date (the log is newest first; an attribute lost and won back, or a merged device, logs it twice).
  const milestones = save.log.filter((entry, index, log) => {
    const older = log.slice(index + 1);
    if (entry.kind === 'act' || entry.kind === 'campaign' || entry.kind === 'attribute') {
      return !older.some(
        (other) => other.kind === entry.kind && other.title === entry.title && (entry.kind !== 'act' || other.detail === entry.detail),
      );
    }
    if (entry.kind !== 'level') return false;
    const previous = older.find((other) => other.kind === 'level');
    return !previous || previous.detail !== entry.detail;
  });
  const families = familiesOf(save, plan, derived.level.perfectWeeks, crew);

  const named = new Map(badges.map((badge) => [badge.id, badge.kind === 'record' ? `${badge.name} end-game number` : badge.name]));
  return (
    <div className="flex flex-col gap-5">
      {unbacked.length > 0 && (
        <section aria-label="Badges to recount" className="flex flex-col gap-3 p-4 rounded-card bg-boss-deep">
          <span className="font-display font-extrabold uppercase text-[20px] leading-none text-fg">
            {unbacked.length === 1 ? 'One badge your numbers don\u2019t back' : `${unbacked.length} badges your numbers don\u2019t back`}
          </span>
          <span className="text-sm text-fg-2">
            {unbacked.map((id) => named.get(id) ?? id).join(' · ')}. Your logs today fall short of what {unbacked.length === 1 ? 'it needs' : 'they need'}, so {unbacked.length === 1 ? 'it was' : 'they were'} probably earned by a number typed wrong.
          </span>
          <button
            type="button"
            onClick={recountBadges}
            className="self-start h-11 px-4 rounded-card font-display font-extrabold uppercase text-lg tracking-[0.02em] cursor-pointer transition bg-boss text-ink-950 active:scale-[.97]"
          >
            Take {unbacked.length === 1 ? 'it' : 'them'} back
          </button>
        </section>
      )}
      <section aria-label="Badge families" className="flex flex-col gap-2.5">
        <Label>Families · Chalk, Iron, Steel, Gold</Label>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {families.map(({ def, count, tier, next }) => (
            <li key={def.id} className={`list-none flex flex-col gap-1 p-3 rounded-card ${tier === 4 ? 'bg-earned-deep' : 'bg-ink-900'}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-fg">{def.name}</span>
                <span className={`eyebrow ${tier === 4 ? 'text-earned' : tier === 3 ? 'text-armour' : tier > 0 ? 'text-fg-2' : 'text-fg-5'}`}>
                  {tier > 0 ? TIER_NAMES[tier - 1] : 'None yet'}
                </span>
              </span>
              <span className="num font-bold text-[20px] text-fg leading-none">{def.crew && !crew ? '–' : count}</span>
              <span className="text-[11.5px] text-fg-4">
                {def.counts}
                {next !== null ? ` · ${TIER_NAMES[tier]} at ${next}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>
      {badges.length === 0 && milestones.length === 0 && (
        <p className="p-4 rounded-card border border-dashed border-ink-600 text-fg-3 text-sm">
          No feats yet. Prove a skill, slay a boss, climb a tower or reach a lift&apos;s end-game number.
        </p>
      )}
      {milestones.length > 0 && (
        <section aria-label="Milestones" className="flex flex-col gap-2.5">
          <Label>Milestones</Label>
          <ol className="flex flex-col gap-1.5">
            {milestones.map((entry, index) => (
              <li key={`${entry.date}_${index}`} className="list-none flex items-center gap-3 p-2.5 rounded-card bg-ink-900">
                <span className="w-[84px] shrink-0 num font-bold text-[12px] text-fg-4">{entry.date}</span>
                <span className="flex-1 min-w-0 text-[13px] font-semibold text-fg-2 truncate">
                  {entry.kind === 'level' ? `${entry.title} · ${entry.detail}` : entry.kind === 'act' ? `${entry.title} · ${entry.detail}` : entry.title}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {(Object.keys(BADGE_LOOK) as BadgeKind[]).map((kind) => {
        const list = badges.filter((badge) => badge.kind === kind).sort((a, b) => (a.date < b.date ? 1 : -1));
        if (!list.length) return null;
        const { label, icon: Icon, tone } = BADGE_LOOK[kind];
        return (
          <section key={kind} aria-label={label} className="flex flex-col gap-2.5">
            <span className="flex items-center gap-2">
              <Label className="flex-1">{label}</Label>
              <span className="num font-bold text-[15px] text-fg-3">{list.length}</span>
            </span>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {list.map((badge) => (
                <li key={badge.id} className={`notch list-none flex flex-col items-center gap-1.5 p-3 rounded-card text-center ${tone}`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-[12.5px] font-semibold text-fg-2 leading-tight line-clamp-2">{badge.name}</span>
                  <span className="num text-[12px] font-bold text-earned-dim">{badge.date.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Daylight' },
  { id: 'system', label: 'Follow phone' },
];

/** Dark is home; Daylight is the paper look for training outside. Saved on this device. */
const ThemeSwitch: React.FC = () => {
  const [choice, setChoice] = useThemeChoice();
  return (
    <section aria-label="Look" className="mt-4 flex flex-col gap-2 lg:max-w-lg">
      <Label>Look</Label>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 p-1 rounded-card bg-ink-900">
        {THEMES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={choice === id}
            onClick={() => setChoice(id)}
            className={`h-10 rounded-tag text-[13px] font-semibold transition cursor-pointer ${choice === id ? 'bg-ink-800 raised text-fg' : 'text-fg-4 hover:text-fg'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
};
