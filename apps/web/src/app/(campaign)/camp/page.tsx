'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AccountMenu } from '../../../components/account/AccountMenu';
import { useGame } from '../../../components/game/GameProvider';
import { figureForBoss, figureForExercise } from '../../../components/game/figures';
import { bossForDay, bossHp, splitTarget } from '../../../components/game/helpers';
import { ArrowRightIcon, BossIcon, CheckIcon, FlameIcon, ForgeIcon, MapIcon, MoonIcon } from '../../../components/game/icons';
import { Figure, HexLevel, Meter, SegmentBar } from '../../../components/game/kit';
import { RadarWeb, WEB_ORDER } from '../../../components/game/RadarWeb';
import { useSignature } from '../../../components/game/useSignature';
import { GearedFigure } from '../../../components/game/GearedFigure';
import { useMyGearLook } from '../../../components/game/useGearLook';
import { campaignComplete, questKey, restKey } from '../../../utils/protocolEngine';

/** Camp: who you are, what today asks, and the boss today's training hits. */
export default function CampPage() {
  const { derived, streak } = useGame();
  const { level } = derived;
  const xp = level.xpIntoLevel / level.xpForLevel;
  // Which of today's missions the character shows, picked from the list; the next one not done until then.
  const [picked, setPicked] = useState<number | null>(null);
  const move = useTodayMove(picked);

  return (
    <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-4 lg:gap-5">
      {/* Phones get the player strip here; desktop has it in the sidebar. */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/hero" className="flex-1 min-w-0 flex items-center gap-3" aria-label={`Level ${level.level}, ${level.rank}`}>
          <HexLevel level={level.level} progress={xp} />
          <span className="min-w-0 flex flex-col gap-1">
            <span className="font-display font-extrabold uppercase text-[20px] leading-none truncate">{level.rank}</span>
            <span className="text-[12px] text-fg-3 whitespace-nowrap">
              Week {derived.week.week} · <span className="num font-bold text-earned">{level.xpIntoLevel}</span> / {level.xpForLevel} XP
            </span>
          </span>
        </Link>
        <Link
          href="/forge"
          aria-label="Forge your campaign"
          className="w-11 h-11 shrink-0 rounded-card bg-ink-850 raised text-fg-2 flex items-center justify-center active:scale-[.97] transition"
        >
          <ForgeIcon className="w-5 h-5" />
        </Link>
        <span className="flex items-center gap-1.5 h-11 px-3 shrink-0 rounded-card bg-earned-deep text-earned-soft" aria-label={`${streak} day streak`}>
          <FlameIcon className="w-[18px] h-[18px]" lit={streak > 0} />
          <span className="num font-bold text-lg">{streak}</span>
        </span>
        {/* The avatar menu (sign out, and the owner's tools) sits at the foot of the desktop sidebar; on a phone it opens from here. */}
        <AccountMenu large />
      </div>
      <h1 className="hidden lg:block font-display font-extrabold uppercase text-[40px] leading-none">Camp</h1>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5 lg:grid-cols-12">
        <HeroStage move={move} className="lg:col-span-5" />
        <TodayCard shown={move.index} onShow={setPicked} className="lg:col-span-7" />
        <BossTile className="lg:col-span-4" />
        <ActTile className="lg:col-span-4" />
        <WebTile className="hidden lg:flex lg:col-span-4" />
        <Link
          href="/crew"
          className="lg:hidden flex items-center gap-3 p-4 rounded-card bg-ink-900 hover:bg-ink-850 transition"
          aria-label="Crew: board, duels and the weekly raid"
        >
          <span className="flex-1 min-w-0">
            <span className="block eyebrow text-fg-4">Crew</span>
            <span className="block text-[14px] font-semibold text-fg">Board, duels and this week&apos;s raid</span>
          </span>
          <span className="text-fg-4" aria-hidden>
            →
          </span>
        </Link>
        {/* Anatomy sits in the desktop sidebar; on a phone it opens from here. */}
        <Link
          href="/anatomy"
          className="lg:hidden flex items-center gap-3 p-4 rounded-card bg-ink-900 hover:bg-ink-850 transition"
          aria-label="Anatomy: the muscles today's quest trains"
        >
          <span className="flex-1 min-w-0">
            <span className="block eyebrow text-fg-4">Anatomy</span>
            <span className="block text-[14px] font-semibold text-fg">The muscles today&apos;s quest trains</span>
          </span>
          <span className="text-fg-4" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

/**
 * What the character is doing: one of today's exercises, the next one not done
 * yet unless another is picked from today's list. On a rest day (or a day
 * with nothing planned) it does the move picked in Hero → Gear.
 */
function useTodayMove(picked: number | null) {
  const { derived, save, currentWeek, todayDayId } = useGame();
  const signature = useSignature();
  const day = derived.week.days.find((entry) => entry.day.id === todayDayId)?.day;
  const exercises = day && day.kind !== 'rest' ? day.exercises : [];

  if (!day || exercises.length === 0) {
    return {
      spec: signature.spec,
      name: signature.name,
      tag: day?.kind === 'rest' ? 'Rest day' : 'Your move',
      done: false,
      dose: null,
      idle: !signature.earned,
      position: null as string | null,
      index: null as number | null,
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
    position: exercises.length > 1 ? `${index + 1} of ${exercises.length}` : null,
    index: index as number | null,
  };
}

type TodayMove = ReturnType<typeof useTodayMove>;

/** The character on the floor, doing today's move. No halo: light comes from the chalk. */
const HeroStage: React.FC<{ move: TodayMove; className?: string }> = ({ move, className = '' }) => {
  // The athlete wears their gear whatever move they do; a stage that doesn't suit the move stays out.
  const gear = useMyGearLook();

  return (
    <section className={`relative flex flex-col rounded-card bg-ink-900 overflow-hidden ${className}`} aria-label="Your character">
      <div className="absolute top-3 inset-x-3.5 flex items-center justify-between gap-2 z-10">
        <span className={`eyebrow ${move.done ? 'text-earned' : 'text-fg-4'}`}>{move.tag}</span>
        {move.position && move.position !== move.tag && <span className="eyebrow text-fg-5">{move.position}</span>}
      </div>
      <div className="relative mx-auto mt-6 w-full max-w-[280px] aspect-square">
        <span key={move.name} className="block w-full h-full anim-fade">
          <GearedFigure spec={move.spec} state={move.idle ? 'locked' : move.done ? 'mastered' : 'ready'} look={gear} animate className="w-full h-full" title={`${move.tag}: ${move.name}`} />
        </span>
      </div>
      <div className="flex items-baseline gap-2 px-3.5 pb-3.5 pt-1">
        <span className={`flex-1 min-w-0 text-[15px] font-semibold truncate ${move.done ? 'text-earned-soft' : 'text-fg-2'}`}>{move.name}</span>
        {move.dose && (
          <span className={`shrink-0 num font-bold text-[22px] leading-none ${move.done ? 'text-earned' : 'text-fg'}`}>
            {move.dose.sets ? `${move.dose.sets} × ${move.dose.reps}` : move.dose.reps}
          </span>
        )}
      </div>
    </section>
  );
};

const TodayCard: React.FC<{ shown: number | null; onShow: (index: number) => void; className?: string }> = ({ shown, onShow, className = '' }) => {
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
  const left = items.length - done;

  return (
    <section className={`flex flex-col gap-3.5 p-4 lg:p-5 rounded-card bg-ink-900 ${className}`} aria-label="Today's quest">
      <div className="flex items-end gap-3">
        <span className="flex-1 min-w-0 flex flex-col gap-1.5">
          <span className="eyebrow text-fg-4">Today · {today.name}</span>
          <span className="font-display font-extrabold uppercase text-[28px] leading-[0.95] truncate">{day.title}</span>
        </span>
        <span className="num font-bold text-[24px] leading-none text-earned">
          {done}
          <span className="text-fg-5 text-base">/{items.length}</span>
        </span>
      </div>
      <SegmentBar done={items.map((item) => item.done)} />
      <ul className="flex flex-col" aria-label={`${day.title}: ${items.length} missions`}>
        {items.map((item, index) => {
          const dose = item.exercise ? splitTarget(item.exercise.target) : null;
          // Tapping a mission shows it on the character.
          const on = Boolean(item.exercise) && index === shown;
          const row = 'w-full flex items-center gap-3 py-2 text-left';
          const content = (
            <>
              <span className={`w-11 h-11 shrink-0 rounded-tag flex items-center justify-center ${item.done ? 'bg-earned-deep' : 'bg-ink-850'} ${on ? 'ring-1 ring-fg-3' : ''}`}>
                {item.exercise ? (
                  <Figure spec={figureForExercise(item.exercise.exercise, day.kind)} state={item.done ? 'mastered' : 'ready'} className="w-10 h-10" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-fg-3" />
                )}
              </span>
              <span className={`flex-1 min-w-0 text-[14px] font-medium truncate ${item.done ? 'text-earned-soft' : 'text-fg-2'}`}>
                {item.exercise ? item.exercise.name : 'Claim your rest'}
              </span>
              {dose && (
                <span className={`shrink-0 num font-bold text-[18px] ${item.done ? 'text-earned' : 'text-fg'}`}>
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
                <span className="w-5 h-5 shrink-0 rounded-[5px] bg-earned flex items-center justify-center" aria-label="Done">
                  <CheckIcon className="w-3 h-3 text-earned-deep" strokeWidth={3.6} />
                </span>
              )}
            </>
          );
          return (
            <li key={item.id} className="list-none border-t border-ink-700 first:border-t-0">
              {item.exercise ? (
                <button type="button" aria-pressed={on} onClick={() => onShow(index)} className={`${row} cursor-pointer`}>
                  {content}
                </button>
              ) : (
                <div className={row}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      <Link
        href="/quest"
        className="h-[52px] rounded-card bg-act text-act-deep flex items-center justify-center gap-2.5 font-display font-extrabold uppercase text-[20px] tracking-[0.02em] active:scale-[.97] transition"
      >
        {done === items.length ? 'Review the day' : done > 0 ? 'Continue session' : 'Start session'}
        {left > 0 && <span className="num font-bold text-[14px] px-1.5 rounded-tag bg-act-deep text-act">{left}</span>}
        <ArrowRightIcon className="w-5 h-5" strokeWidth={2.4} />
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
      <Link href="/bosses" className={`notch flex items-center gap-3 p-4 rounded-card bg-earned-deep ${className}`}>
        <BossIcon className="w-6 h-6 text-earned" />
        <span className="font-display font-extrabold uppercase text-lg text-earned">Every boss is down</span>
      </Link>
    );
  }
  const hp = bossHp(target);
  return (
    <Link
      href={`/bosses/${target.boss.id}`}
      aria-label={`Today's boss: ${target.boss.name}, ${target.sealed ? 'sealed' : `${hp} HP`}`}
      className={`notch flex items-center gap-3 p-4 rounded-card active:scale-[.98] transition ${target.sealed ? 'bg-ink-900 chains' : 'bg-boss-deep'} ${className}`}
    >
      <span className="flex-1 min-w-0 flex flex-col gap-2">
        <span className={`eyebrow ${target.sealed ? 'text-fg-4' : 'text-boss-soft'}`}>Today&apos;s boss</span>
        <span className="font-display font-extrabold uppercase text-[22px] leading-[0.95] truncate">{target.boss.name.replace(/^The /, '')}</span>
        {target.sealed ? (
          <span className="text-[12px] text-fg-3">Sealed</span>
        ) : (
          <span className="flex items-center gap-2">
            <Meter value={hp / 1000} tone="boss" />
            <span className="num font-bold text-[13px] text-boss-soft whitespace-nowrap">{Math.round(hp / 10)}% HP</span>
          </span>
        )}
      </span>
      <Figure spec={figureForBoss(target.boss)} state={target.sealed ? 'sealed' : 'boss'} className="w-[84px] h-[84px] shrink-0" />
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
        className={`notch flex flex-col gap-2.5 p-4 rounded-card bg-earned-deep active:scale-[.98] transition ${className}`}
      >
        <span className="flex items-center justify-between">
          <ForgeIcon className="w-[22px] h-[22px] text-earned" />
          <span className="eyebrow text-earned">Campaign complete</span>
        </span>
        <span className="font-display font-extrabold uppercase text-[20px] leading-none">Plan year two</span>
        <span className="text-[13px] text-fg-3">Every act is cleared. Start from a template or add new acts in the Forge.</span>
      </Link>
    );
  }
  return (
    <Link
      href="/map"
      aria-label={`Act ${act.numeral}, ${act.name}, ${Math.round(act.progress * 100)} percent`}
      className={`flex flex-col gap-2.5 p-4 rounded-card bg-ink-900 active:scale-[.98] transition ${className}`}
    >
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-2 eyebrow text-fg-4">
          <MapIcon className="w-[18px] h-[18px] text-fg-3" />
          Act {act.numeral}
        </span>
        <span className="num font-bold text-[13px] text-fg-3">{Math.round(act.progress * 100)}%</span>
      </span>
      <span className="font-display font-extrabold uppercase text-[20px] leading-none">{act.name}</span>
      <span className="flex gap-1.5">
        {act.nodes.map((node) => (
          <span key={node.id} className={`flex-1 h-2 rounded-[2px] ${node.done ? 'bg-earned' : 'bg-ink-700'}`} />
        ))}
      </span>
    </Link>
  );
};

const WebTile: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { derived } = useGame();
  const byId = new Map(derived.attributes.map((attribute) => [attribute.def.id as string, attribute]));
  // A locked quality stays on the web, at its floor.
  const core = WEB_ORDER.map((id) => byId.get(id))
    .filter((attribute): attribute is NonNullable<typeof attribute> => Boolean(attribute))
    .map((attribute) => (attribute.unlocked ? attribute : { ...attribute, value: null, display: null }));
  return (
    <Link href="/hero" aria-label="Hero sheet" className={`items-center gap-3 p-4 rounded-card bg-ink-900 ${className}`}>
      <RadarWeb attributes={core} size={150} bare />
      <span className="flex-1 flex flex-col gap-1.5">
        {core.map((attribute) => (
          <span key={attribute.def.id} className="flex items-baseline justify-between">
            <span className="eyebrow text-fg-4">{attribute.def.short}</span>
            <span className="num font-bold text-[15px]">{attribute.display ?? attribute.value ?? '–'}</span>
          </span>
        ))}
      </span>
    </Link>
  );
};
