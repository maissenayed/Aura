'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Flame, Hammer, Map, Moon, Repeat, Skull, Swords } from 'lucide-react';
import { useGame } from '../../../components/game/GameProvider';
import { figureForBoss, figureForExercise } from '../../../components/game/figures';
import { bossForDay, bossHp, splitTarget } from '../../../components/game/helpers';
import { Figure, HexLevel, Meter } from '../../../components/game/kit';
import { RadarWeb } from '../../../components/game/RadarWeb';
import { useSignature } from '../../../components/game/useSignature';
import { campaignComplete, questKey, restKey } from '../../../utils/protocolEngine';

/** Camp: who you are, what today asks, and the boss today's training hits. */
export default function CampPage() {
  const { derived, streak } = useGame();
  const { level } = derived;

  return (
    <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-4 lg:gap-5">
      {/* Phones get the player strip here; desktop has it in the sidebar. */}
      <div className="flex items-center justify-between lg:hidden">
        <Link href="/hero" className="flex items-center gap-3" aria-label={`Level ${level.level}, ${level.rank}`}>
          <HexLevel level={level.level} />
          <span className="flex flex-col gap-0.5">
            <span className="font-display font-semibold text-[17px]">{level.rank}</span>
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-fg-4">Week {derived.week.week}</span>
          </span>
        </Link>
        <span className="flex items-center gap-2">
          <Link
            href="/forge"
            aria-label="Forge your campaign"
            className="w-10 h-10 rounded-full bg-ink-800 border border-ink-600 text-fg-2 flex items-center justify-center"
          >
            <Hammer className="w-5 h-5" />
          </Link>
          <span className="flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-[#1a1208] border border-[#4a3410] text-earned font-display font-bold" aria-label={`${streak} day streak`}>
            <Flame className="w-[18px] h-[18px]" />
            {streak}
          </span>
        </span>
      </div>
      <h1 className="hidden lg:block font-display font-bold text-[32px] leading-none">Camp</h1>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5 lg:grid-cols-12">
        <HeroStage className="lg:col-span-5" />
        <TodayCard className="lg:col-span-7" />
        <BossTile className="lg:col-span-4" />
        <ActTile className="lg:col-span-4" />
        <WebTile className="hidden lg:flex lg:col-span-4" />
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

const MOTES = [
  { left: '34%', delay: '0s', colour: '#a77bff' },
  { left: '43%', delay: '.9s', colour: '#3ee8ff' },
  { left: '52%', delay: '1.7s', colour: '#a77bff' },
  { left: '62%', delay: '2.5s', colour: '#a77bff' },
  { left: '38%', delay: '3.1s', colour: '#ffc247' },
  { left: '58%', delay: '3.7s', colour: '#3ee8ff' },
];

/**
 * What the character is doing: today's exercises, starting on the next one
 * not done yet; tapping steps through the day. On a rest day (or a day with
 * nothing planned) it strikes your signature move instead.
 */
function useTodayMove() {
  const { derived, save, currentWeek, todayDayId } = useGame();
  const signature = useSignature();
  const [picked, setPicked] = useState<number | null>(null);
  const day = derived.week.days.find((entry) => entry.day.id === todayDayId)?.day;
  const exercises = day && day.kind !== 'rest' ? day.exercises : [];

  if (!day || exercises.length === 0) {
    return {
      spec: signature.spec,
      name: signature.name,
      tag: day?.kind === 'rest' ? 'Rest day' : 'Signature',
      done: false,
      dose: null,
      idle: !signature.earned,
      cycle: signature.choices > 1 ? signature.next : undefined,
    };
  }

  const isDone = (index: number) => Boolean(save.quests[questKey(currentWeek, exercises[index].id)]);
  const next = exercises.findIndex((_, index) => !isDone(index));
  const index = (picked ?? (next >= 0 ? next : 0)) % exercises.length;
  const current = exercises[index];
  const done = isDone(index);
  return {
    spec: figureForExercise(current.exercise, day.kind),
    name: current.name,
    tag: done ? 'Done' : index === next ? 'Next up' : `${index + 1} of ${exercises.length}`,
    done,
    dose: splitTarget(current.target),
    idle: false,
    cycle: exercises.length > 1 ? () => setPicked((index + 1) % exercises.length) : undefined,
  };
}

const HeroStage: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { derived } = useGame();
  const move = useTodayMove();
  const { level } = derived;
  const pct = level.xpIntoLevel / level.xpForLevel;
  const r = 128;
  const c = 2 * Math.PI * r;
  const angle = pct * 2 * Math.PI - Math.PI / 2;

  return (
    <section
      className={`relative flex flex-col items-center gap-2 lg:rounded-3xl lg:border lg:border-ink-750 lg:bg-[radial-gradient(circle_at_50%_42%,#140f24,#0a0d16_62%)] lg:p-5 ${className}`}
      aria-label="Your character"
    >
      <div className="relative w-[300px] h-[300px] max-w-full">
        <div className="absolute inset-0 rounded-full anim-aura" style={{ background: 'radial-gradient(circle at 50% 56%, rgba(167,123,255,.4) 0%, rgba(167,123,255,.12) 42%, transparent 70%)' }} />
        <svg className="absolute inset-0 anim-spin-slow" width="300" height="300" viewBox="0 0 300 300" aria-hidden="true">
          <circle cx="150" cy="150" r="112" fill="none" stroke="#a77bff" strokeOpacity=".35" strokeWidth="1.2" strokeDasharray="1 9" />
        </svg>
        <svg className="absolute inset-0" width="300" height="300" viewBox="0 0 300 300" role="img" aria-label={`${level.xpIntoLevel} of ${level.xpForLevel} XP to level ${level.level + 1}`}>
          <circle cx="150" cy="150" r={r} fill="none" stroke="#161b29" strokeWidth="7" />
          <circle
            cx="150"
            cy="150"
            r={r}
            fill="none"
            stroke="#ffc247"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            transform="rotate(-90 150 150)"
            style={{ transition: 'stroke-dashoffset .8s ease-out' }}
          />
          <circle cx={150 + r * Math.cos(angle)} cy={150 + r * Math.sin(angle)} r="9" fill="#ffc247" fillOpacity=".25" />
          <circle cx={150 + r * Math.cos(angle)} cy={150 + r * Math.sin(angle)} r="5" fill="#fff3d1" />
        </svg>
        {MOTES.map((mote) => (
          <span key={mote.left + mote.delay} className="absolute bottom-[70px] w-1 h-1 rounded-full opacity-0 anim-mote" style={{ left: mote.left, animationDelay: mote.delay, background: mote.colour }} />
        ))}
        <button
          type="button"
          onClick={move.cycle}
          disabled={!move.cycle}
          aria-label={`${move.tag}: ${move.name}${move.cycle ? '. Tap for the next one' : ''}`}
          className="absolute left-1/2 top-1/2 w-[200px] h-[200px] -ml-[100px] -mt-[104px] cursor-pointer disabled:cursor-default"
        >
          <span key={move.name} className="block anim-breathe anim-fade" style={{ filter: 'drop-shadow(0 0 14px rgba(167,123,255,.5))' }}>
            <Figure
              spec={move.spec}
              state={move.idle ? 'locked' : move.done ? 'mastered' : 'ready'}
              accent={move.done ? '#ffc247' : '#a77bff'}
              animate
              className="w-[200px] h-[200px]"
            />
          </span>
        </button>
        <span className="absolute left-1/2 bottom-1 -translate-x-1/2 flex items-center gap-1.5 h-7 px-3 rounded-full bg-[#0d1019] border border-[#2a2414] font-display font-bold text-sm text-earned whitespace-nowrap">
          {level.xpIntoLevel}
          <span className="text-[#7d6a3e]">/ {level.xpForLevel} XP</span>
        </span>
      </div>
      <button
        type="button"
        onClick={move.cycle}
        disabled={!move.cycle}
        className="max-w-full flex items-center gap-2 h-9 px-3.5 rounded-full bg-[#0d1019] border border-ink-700 text-fg-2 text-[13px] font-semibold cursor-pointer disabled:cursor-default"
      >
        <span className={`shrink-0 text-[10.5px] font-extrabold tracking-[0.1em] uppercase ${move.done ? 'text-earned' : 'text-aura-soft'}`}>{move.tag}</span>
        <span className="truncate">{move.name}</span>
        {move.dose && (
          <span className="shrink-0 font-display font-bold text-act">
            {move.dose.sets ? `${move.dose.sets} × ${move.dose.reps}` : move.dose.reps}
          </span>
        )}
        {move.cycle && <Repeat className="w-3.5 h-3.5 shrink-0 text-fg-5" />}
      </button>
    </section>
  );
};

const TodayCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { derived, save, currentWeek, todayDayId } = useGame();
  // Camp always talks about today, whatever week the mission board is showing.
  const today = derived.week.days.find((entry) => entry.day.id === todayDayId) ?? derived.week.days[0];
  const day = today?.day;
  if (!day) return null;
  const items =
    day.kind === 'rest'
      ? [{ id: 'rest', exercise: null, done: Boolean(save.quests[restKey(currentWeek, day.id)]) }]
      : day.exercises.map((exercise) => ({ id: exercise.id, exercise, done: Boolean(save.quests[questKey(currentWeek, exercise.id)]) }));
  const done = items.filter((item) => item.done).length;

  return (
    <section className={`flex flex-col gap-4 p-4 lg:p-5 rounded-[22px] bg-[linear-gradient(180deg,#0f1322,#0a0d16)] border border-ink-700 ${className}`} aria-label="Today's quest">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-act/10 border border-act/35 text-act flex items-center justify-center">
          <Swords className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-fg-4">Today</span>
          <span className="font-display font-bold text-[21px] truncate">{day.title}</span>
        </span>
        <span className="font-display font-bold text-[22px] text-earned">
          {done}
          <span className="text-fg-5 text-base">/{items.length}</span>
        </span>
      </div>
      <ul className="flex flex-col gap-1.5" aria-label={`${day.title}: ${items.length} missions`}>
        {items.map((item) => {
          const dose = item.exercise ? splitTarget(item.exercise.target) : null;
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl border ${item.done ? 'bg-earned/10 border-earned/35' : 'bg-ink-850 border-ink-700'}`}
            >
              <span className={`w-11 h-11 shrink-0 rounded-xl bg-ink-950 border flex items-center justify-center ${item.done ? 'border-[#5c4a22]' : 'border-ink-700'}`}>
                {item.exercise ? (
                  <Figure spec={figureForExercise(item.exercise.exercise, day.kind)} state={item.done ? 'mastered' : 'ready'} className="w-10 h-10" />
                ) : (
                  <Moon className="w-5 h-5 text-fg-3" />
                )}
              </span>
              <span className={`flex-1 min-w-0 text-[14px] font-semibold truncate ${item.done ? 'text-[#d9c38f]' : 'text-fg-2'}`}>
                {item.exercise ? item.exercise.name : 'Claim your rest'}
              </span>
              {dose && (
                <span className={`shrink-0 font-display font-bold text-[15px] ${item.done ? 'text-earned' : 'text-fg'}`}>
                  {dose.sets ? (
                    <>
                      {dose.sets}
                      <span className="text-fg-5"> × </span>
                      {dose.reps}
                    </>
                  ) : (
                    dose.reps
                  )}
                </span>
              )}
              {item.done && (
                <span className="w-5 h-5 shrink-0 rounded-full bg-earned flex items-center justify-center" aria-label="Done">
                  <Check className="w-3 h-3 text-earned-deep" strokeWidth={4} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <Link
        href="/quest"
        className="h-[54px] rounded-2xl bg-act text-act-deep flex items-center justify-center gap-2.5 font-display font-bold text-lg tracking-[0.04em] shadow-[0_10px_28px_rgba(62,232,255,0.25)] active:scale-[.98] transition"
      >
        {done === items.length ? 'REVIEW' : done > 0 ? 'CONTINUE' : 'START'}
        <ArrowRight className="w-5 h-5" strokeWidth={2.4} />
      </Link>
    </section>
  );
};

const BossTile: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { derived, todayDayId } = useGame();
  // The boss today's training hits — a leg day fights a leg boss.
  const today = derived.week.days.find((entry) => entry.day.id === todayDayId)?.day;
  const target = bossForDay(derived.bosses, today);
  if (!target) {
    return (
      <Link href="/bosses" className={`flex items-center gap-3 p-4 rounded-[20px] bg-[#14100a] border border-[#3a2c12] ${className}`}>
        <Skull className="w-6 h-6 text-earned" />
        <span className="font-display font-bold text-earned">Every boss is down</span>
      </Link>
    );
  }
  const hp = bossHp(target);
  return (
    <Link
      href={`/bosses/${target.boss.id}`}
      aria-label={`Today's boss: ${target.boss.name}, ${target.sealed ? 'sealed' : `${hp} HP`}`}
      className={`flex items-center gap-3 p-4 rounded-[20px] bg-[radial-gradient(circle_at_80%_50%,#2a0c15,#0d070a_65%)] border border-[#3a1624] active:scale-[.98] transition ${className}`}
    >
      <span className="flex-1 min-w-0 flex flex-col gap-2.5">
        <span className="flex items-center gap-2 text-boss-soft font-display font-bold text-[13px]">
          <Skull className="w-[18px] h-[18px] text-boss" />
          <span className="tracking-[0.08em]">TODAY&apos;S BOSS</span>
          <span className="ml-auto">{target.sealed ? 'SEALED' : `${Math.round(hp / 10)}%`}</span>
        </span>
        <span className="font-display font-bold text-base leading-tight truncate">{target.boss.name.replace(/^The /, '')}</span>
        <Meter value={hp / 1000} tone="boss" />
      </span>
      <Figure spec={figureForBoss(target.boss)} state={target.sealed ? 'sealed' : 'boss'} className="w-[88px] h-[88px] shrink-0" />
    </Link>
  );
};

const ActTile: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { derived } = useGame();
  const act = derived.acts.find((entry) => entry.current) ?? derived.acts[derived.acts.length - 1];
  if (!act) return null;
  // Every act cleared: the tile points at the next campaign instead of a finished act.
  if (campaignComplete(derived.acts)) {
    return (
      <Link
        href="/forge"
        aria-label="Campaign complete. Plan year two in the Forge"
        className={`flex flex-col gap-2.5 p-4 rounded-[20px] bg-[#16110a] border border-[#5c4a22] active:scale-[.98] transition ${className}`}
      >
        <span className="flex items-center justify-between">
          <Hammer className="w-[22px] h-[22px] text-earned" />
          <span className="font-display font-bold text-[13px] text-earned">CAMPAIGN COMPLETE</span>
        </span>
        <span className="font-display font-bold text-base leading-tight">Plan year two</span>
        <span className="text-xs text-fg-3">Every act is cleared. Start from a template or add new acts in the Forge.</span>
      </Link>
    );
  }
  return (
    <Link
      href="/map"
      aria-label={`Act ${act.numeral}, ${act.name}, ${Math.round(act.progress * 100)} percent`}
      className={`flex flex-col gap-2.5 p-4 rounded-[20px] bg-[#08111a] border border-[#143042] active:scale-[.98] transition ${className}`}
    >
      <span className="flex items-center justify-between">
        <Map className="w-[22px] h-[22px] text-act" />
        <span className="font-display font-bold text-[13px] text-act">
          ACT {act.numeral} · {Math.round(act.progress * 100)}%
        </span>
      </span>
      <span className="font-display font-bold text-base leading-tight">{act.name}</span>
      <span className="flex gap-1.5">
        {act.nodes.map((node) => (
          <span key={node.id} className={`flex-1 h-2 rounded-full ${node.done ? 'bg-earned' : 'bg-[#1d2a38]'}`} />
        ))}
      </span>
    </Link>
  );
};

const WebTile: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { derived } = useGame();
  const core = derived.attributes.filter((attribute) => attribute.unlocked && !attribute.def.unlock).slice(0, 6);
  return (
    <Link href="/hero" aria-label="Hero sheet" className={`items-center gap-3 p-4 rounded-[20px] bg-ink-900 border border-ink-700 ${className}`}>
      <RadarWeb attributes={core} size={150} bare />
      <span className="flex-1 flex flex-col gap-1.5">
        {core.map((attribute) => (
          <span key={attribute.def.id} className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-fg-4">{attribute.def.short}</span>
            <span className="font-display font-bold text-[15px]">{attribute.display ?? attribute.value ?? '–'}</span>
          </span>
        ))}
      </span>
    </Link>
  );
};
