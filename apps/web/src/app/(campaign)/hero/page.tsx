'use client';

import React, { useState } from 'react';
import { Castle, Crown, Hexagon, Lock, Medal, ShieldHalf, Sparkles, Star, TrendingUp } from 'lucide-react';
import { useGame } from '../../../components/game/GameProvider';
import { figureForLift } from '../../../components/game/figures';
import { Figure, HexLevel, Label, Meter, Stepper } from '../../../components/game/kit';
import { RadarWeb } from '../../../components/game/RadarWeb';
import { ATTRIBUTE_MAX } from '../../../utils/attributes';
import { DAY_NAMES, formatStatValue, recordName, unitLabel } from '../../../utils/campaignPlan';
import { HistoryPoint } from '../../../utils/campaignV3';
import { Sport, badgesUnbacked, currentOf, rankForLevel } from '../../../utils/protocolEngine';
import { metricOf } from '../../../utils/records';
import { skillOf } from '../../../utils/treeIndex';

type Tab = 'stats' | 'badges' | 'lifts' | 'armor';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'stats', label: 'Stats', icon: Hexagon },
  { id: 'badges', label: 'Badges', icon: Medal },
  { id: 'lifts', label: 'Lifts', icon: TrendingUp },
  { id: 'armor', label: 'Armour', icon: ShieldHalf },
];

/** The level where the next rank starts, or null at the top. */
function nextRank(level: number, sport: Sport): { level: number; rank: string } | null {
  for (let next = level + 1; next <= 60; next += 1) {
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
        <HexLevel level={level.level} />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h1 className="font-display font-bold text-xl lg:text-[28px] leading-tight">{level.rank}</h1>
          <div className="flex items-center gap-2">
            <Meter value={level.xpIntoLevel / level.xpForLevel} tone="earned" className="h-1.5 max-w-[160px]" label="XP to next level" />
            {upcoming && (
              <span className="text-[11px] font-bold text-fg-4 truncate">
                {upcoming.rank} at {upcoming.level}
              </span>
            )}
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Hero" className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#0c0f18] border border-ink-700 lg:max-w-lg">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-10 rounded-xl flex items-center justify-center gap-1.5 text-[12.5px] font-bold transition cursor-pointer ${
              tab === id ? 'bg-act text-act-deep' : 'text-[#8a94ad] hover:text-fg'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'badges' && <BadgesTab />}
      {tab === 'armor' && <ArmorTab />}
      {tab === 'lifts' && <LiftsTab />}
    </main>
  );
}

/* ------------------------------------------------------------------ */

const StatsTab: React.FC = () => {
  const { derived } = useGame();
  const shown = derived.attributes.filter((attribute) => attribute.unlocked);
  const hidden = derived.attributes.filter((attribute) => !attribute.unlocked);
  const [selectedId, setSelectedId] = useState<string>(shown[0]?.def.id ?? '');
  const selected = shown.find((attribute) => attribute.def.id === selectedId) ?? shown[0];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[auto_minmax(0,1fr)] items-start">
      <div className="flex justify-center overflow-hidden">
        <RadarWeb attributes={shown} size={340} selectedId={selected?.def.id} onSelect={setSelectedId} />
      </div>

      <div className="flex flex-col gap-4">
        {selected && (
          <section key={selected.def.id} className="flex flex-col gap-3 p-4 rounded-[20px] bg-ink-850 border-[1.5px] border-[#17566a] anim-fade" aria-label={selected.def.name}>
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
                <Meter value={part.share ?? 0} tone={part.share === null ? 'dim' : 'aura'} />
                <span className="w-[96px] shrink-0 text-right font-display font-bold text-[12px] text-fg-2 truncate" title={part.detail}>
                  {part.detail}
                </span>
              </div>
            ))}
            {selected.value === null && selected.measure && <p className="text-xs text-act">{selected.measure}</p>}
          </section>
        )}

        {hidden.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {hidden.map((attribute) =>
              attribute.def.secret ? (
                <div
                  key={attribute.def.id}
                  className="col-span-2 h-[84px] rounded-2xl border border-[#3d2a63] flex items-center justify-center gap-2.5 bg-[linear-gradient(110deg,#140c24_20%,#2a1650_40%,#140c24_60%)]"
                  aria-label={`Secret attribute. ${attribute.unlockLabel}`}
                >
                  <Sparkles className="w-[22px] h-[22px] text-aura-soft" />
                  <span className="flex flex-col">
                    <span className="font-display font-bold text-lg tracking-[0.2em] text-[#d9c8ff]">???</span>
                    <span className="text-[10.5px] font-bold text-[#9c86c9]">{attribute.unlockLabel}</span>
                  </span>
                </div>
              ) : (
                <div key={attribute.def.id} className="h-[84px] p-2 rounded-2xl bg-ink-900 border border-ink-700 flex flex-col items-center justify-center gap-1 text-center" title={attribute.unlockLabel}>
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

const ArmorTab: React.FC = () => {
  const { derived, plan } = useGame();
  const pieces = derived.week.armor;
  const [pickedId, setPickedId] = useState<string | null>(pieces[0]?.piece.id ?? null);
  const picked = pieces.find((entry) => entry.piece.id === pickedId) ?? pieces[0];

  if (pieces.length === 0) {
    return (
      <p className="p-5 rounded-[20px] border border-dashed border-ink-600 text-fg-3">
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
      <div className="relative mx-auto rounded-3xl border border-ink-750 bg-[radial-gradient(circle_at_50%_45%,#101626,#07090f_70%)]" style={{ width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="absolute inset-0">
          <g className="anim-breathe">
            <g transform={`translate(${ox} 4) scale(${scale})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="50,24 40,37 36,50" stroke="#7c86a3" strokeWidth="4.2" />
              <polyline points="50,52 45,70 44,88" stroke="#7c86a3" strokeWidth="4.8" />
              <polyline points="50,24 50,52" stroke="#e9edfb" strokeWidth="7.6" />
              <polyline points="50,52 55,70 56,88" stroke="#e9edfb" strokeWidth="5" />
              <polyline points="50,24 60,37 64,50" stroke="#e9edfb" strokeWidth="4.4" />
              <circle cx="50" cy="16" r="5.4" fill="#e9edfb" />
            </g>
          </g>
          {onBody.map(({ piece, forged }) => {
            const slot = SLOTS[piece.slot.toLowerCase()];
            const bx = slot.side === 'L' ? 72 : W - 72;
            const jx = ox + slot.joint[0] * scale;
            const jy = 4 + slot.joint[1] * scale;
            return (
              <g key={piece.id}>
                <line x1={bx} y1={rowY[slot.row]} x2={jx} y2={jy} stroke={forged ? '#ffc247' : '#2f374d'} strokeWidth="1.5" strokeDasharray={forged ? undefined : '3 4'} />
                <circle cx={jx} cy={jy} r="4.5" fill={forged ? '#ffc247' : '#3a4258'} />
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
                className={`w-[58px] h-[58px] rounded-[18px] border-2 flex items-center justify-center transition active:scale-90 cursor-pointer ${
                  on ? 'border-act' : forged ? 'border-[#6b5320]' : 'border-ink-600'
                } ${forged ? 'bg-[#16110a]' : 'bg-ink-850'}`}
              >
                <ShieldHalf className={`w-6 h-6 ${forged ? 'text-earned fill-earned/30' : 'text-fg-4'}`} />
              </button>
              <span className={`text-[10.5px] font-bold whitespace-nowrap ${on ? 'text-act' : forged ? 'text-earned-soft' : 'text-fg-4'}`}>{piece.slot}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {picked && (
          <section className="flex flex-col gap-2.5 p-4 rounded-[20px] bg-ink-850 border-[1.5px] border-ink-700" aria-label={picked.piece.slot}>
            <span className="flex items-center gap-2">
              <span className="flex-1 font-display font-bold text-xl">{picked.piece.slot}</span>
              <span className={`h-7 px-2.5 rounded-full text-[11px] font-extrabold tracking-[0.08em] flex items-center ${picked.forged ? 'bg-earned text-earned-deep' : 'bg-ink-800 text-fg-4'}`}>
                {picked.forged ? 'FORGED' : 'NOT YET'}
              </span>
            </span>
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
                  <li key={`${entry.day}_${entry.name}`} className="list-none h-8 px-2.5 rounded-full bg-ink-900 border border-ink-700 text-xs text-fg-2 flex items-center gap-1.5">
                    <span className="font-display font-bold text-fg-5">{DAY_NAMES[entry.day].slice(0, 3)}</span> {entry.name}
                  </li>
                ))}
              </ul>
            )}
            <span className="text-[11px] text-fg-5">Extra care: {picked.piece.drill} — {picked.piece.when.toLowerCase()}.</span>
          </section>
        )}
        {offBody.map(({ piece, forged }) => (
          <div key={piece.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${forged ? 'bg-[#16110a] border-[#4a3a18]' : 'bg-ink-850 border-ink-700'}`}>
            <ShieldHalf className={`w-5 h-5 ${forged ? 'text-earned' : 'text-fg-4'}`} />
            <span className="flex-1 text-sm font-semibold">{piece.slot}</span>
            <span className="text-xs text-fg-4">{piece.drill}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 p-3.5 rounded-[18px] bg-ink-900 border border-ink-700">
          <Label>Full set</Label>
          <span className="flex-1 flex gap-1">
            {pieces.map(({ piece, forged }) => (
              <span key={piece.id} className={`flex-1 h-2 rounded-full ${forged ? 'bg-earned' : 'bg-ink-700'}`} />
            ))}
          </span>
          <span className="font-display font-bold text-sm text-earned">
            {derived.week.armorCount}
            <span className="text-fg-5">/{pieces.length}</span>
          </span>
        </div>
        <p className="text-xs text-fg-5">
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
    .filter(([key, points]) => points.length > 0 && !plan.lifts.some((lift) => lift.id === key))
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
            <li key={lift.id} className="flex flex-col gap-2.5 p-3 rounded-[18px] bg-ink-850 border border-ink-700">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 shrink-0 rounded-[14px] bg-ink-950 border border-ink-700 flex items-center justify-center">
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
            <span className="text-[11px] text-fg-5">No longer in your plan</span>
          </span>
          <ul className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2 gap-2">
            {earlier.map(([key, points]) => {
              const unit = metricOf(key);
              const best = Math.max(...points.map((point) => point[1]));
              const last = points[points.length - 1];
              return (
                <li key={key} className="list-none flex items-center gap-3 p-3 rounded-[16px] bg-ink-900 border border-ink-750">
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

      <section className="flex flex-col gap-2.5 p-4 rounded-[20px] bg-ink-900 border border-ink-700" aria-label="Where your XP comes from">
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
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke={rising ? '#3ee8ff' : '#ff8fa3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r="2.6" fill={rising ? '#3ee8ff' : '#ff8fa3'} />
    </svg>
  );
};

type BadgeKind = 'boss' | 'tower' | 'record' | 'skill';

const BADGE_LOOK: Record<BadgeKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  boss: { label: 'Bosses', icon: Crown, tone: 'text-earned border-[#5c4a22] bg-[#16110a]' },
  tower: { label: 'Towers', icon: Castle, tone: 'text-aura-soft border-[#3d2a63] bg-[#140c24]' },
  record: { label: 'End-game numbers', icon: Star, tone: 'text-act border-[#17566a] bg-[#08161d]' },
  skill: { label: 'Skills mastered', icon: Medal, tone: 'text-emerald-300 border-emerald-800/60 bg-emerald-950/40' },
};

/**
 * Every badge earned: bosses, towers, end-game numbers, and each skill mastered on the trees.
 * Badges stay when the plan moves on; one the numbers stop backing can be taken back.
 */
const BadgesTab: React.FC = () => {
  const { save, plan, derived, recountBadges, todayIso } = useGame();
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
    const skill = skillOf(tree, rest.join(':'));
    if (skill) badges.push({ id: key, kind: 'skill', name: skill.name, date });
  }

  // The campaign's story from the battle log: acts, the finish, new ranks and attributes.
  const milestones = save.log.filter((entry, index, log) => {
    if (entry.kind === 'act' || entry.kind === 'campaign' || entry.kind === 'attribute') return true;
    if (entry.kind !== 'level') return false;
    const older = log.slice(index + 1).find((other) => other.kind === 'level');
    return !older || older.detail !== entry.detail;
  });
  if (badges.length === 0 && milestones.length === 0) {
    return (
      <p className="p-5 rounded-[20px] border border-dashed border-ink-600 text-fg-3">
        No badges yet. Master a skill on the tree, slay a boss, climb a tower or reach a lift&apos;s end-game number.
      </p>
    );
  }

  const named = new Map(badges.map((badge) => [badge.id, badge.kind === 'record' ? `${badge.name} end-game number` : badge.name]));
  return (
    <div className="flex flex-col gap-5">
      {unbacked.length > 0 && (
        <section aria-label="Badges to recount" className="flex flex-col gap-3 p-4 rounded-[20px] border border-[#6a2a3a] bg-[#1a0b10]">
          <span className="font-display font-bold text-fg">
            {unbacked.length === 1 ? 'One badge your numbers don\u2019t back' : `${unbacked.length} badges your numbers don\u2019t back`}
          </span>
          <span className="text-sm text-fg-2">
            {unbacked.map((id) => named.get(id) ?? id).join(' · ')}. Your logs today fall short of what {unbacked.length === 1 ? 'it needs' : 'they need'}, so {unbacked.length === 1 ? 'it was' : 'they were'} probably earned by a number typed wrong.
          </span>
          <button
            type="button"
            onClick={recountBadges}
            className="self-start h-11 px-4 rounded-[14px] font-display font-bold text-sm cursor-pointer transition bg-[#ff8fa3] text-[#2a0a12]"
          >
            TAKE {unbacked.length === 1 ? 'IT' : 'THEM'} BACK
          </button>
        </section>
      )}
      {milestones.length > 0 && (
        <section aria-label="Milestones" className="flex flex-col gap-2.5">
          <Label>Milestones</Label>
          <ol className="flex flex-col gap-1.5">
            {milestones.map((entry, index) => (
              <li key={`${entry.date}_${index}`} className="list-none flex items-center gap-3 p-2.5 rounded-[14px] bg-ink-900 border border-ink-750">
                <span className="w-[84px] shrink-0 font-display font-bold text-[11px] text-fg-5">{entry.date}</span>
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
              <span className="font-display font-bold text-sm text-fg-3">{list.length}</span>
            </span>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {list.map((badge) => (
                <li key={badge.id} className={`list-none flex flex-col items-center gap-1.5 p-3 rounded-[18px] border text-center ${tone}`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-[12px] font-semibold text-fg-2 leading-tight line-clamp-2">{badge.name}</span>
                  <span className="text-[10.5px] font-display font-bold opacity-80">{badge.date.slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
