'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { useGame } from './GameProvider';
import { BossHpChip } from './BossHpChip';
import { bossesOfExercise } from './helpers';
import { MissionEvidence, MissionGrade, landedSkills, missionEvidence, sessionMinutes, trainingDays } from '../../utils/evidence';
import { formatStatValue, liftOf } from '../../utils/campaignPlan';
import { logPassDates } from '../../utils/skillStandards';
import { skillOf } from '../../utils/treeIndex';
import type { SkillTreeRef } from '../../utils/campaignV3';
import { AvatarFigure } from './AvatarFigure';

const GRADE_LABEL: Record<MissionGrade, string> = { done: 'Done', hit: 'Hit', overload: 'Overload', pr: 'PR' };

/** What to aim for next time, from what was logged: one more rep, 2.5 kg, 5 seconds. */
function nextTarget(mission: MissionEvidence, unit: string | undefined): string | null {
  if (mission.value === null || mission.grade === 'done') return null;
  if (unit === 'reps') return `${mission.value + 1} reps`;
  if (unit === 'seconds') return `${mission.value + 5} s`;
  if (unit === 'kg' || unit === 'added-kg') return `${unit === 'added-kg' ? '+' : ''}${mission.value + 2.5} kg`;
  return null;
}

/**
 * The finished moment: the session on one card. Time on the clock, what each
 * mission earned against the athlete's own past, skills landed, bosses hit,
 * the streak, the XP, and what to aim for next time.
 */
export const SessionCard: React.FC<{ date: string; onClose: () => void }> = ({ date, onClose }) => {
  const { save, plan, derived, streak } = useGame();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const missions = useMemo(() => missionEvidence(save, plan).filter((mission) => mission.date === date), [save, plan, date]);
  const day = trainingDays(save, plan).get(date);
  const landed = landedSkills(save, (key) => logPassDates(save, key)).filter((entry) => entry.date === date);
  const landedXp = landed.reduce((sum, entry) => sum + entry.xp, 0);
  const minutes = Math.round(sessionMinutes(save.sessions?.[date]));
  const logged = missions.filter((mission) => mission.value !== null).length;
  const bosses = [...new Map(missions.flatMap((mission) => bossesOfExercise(derived.bosses, mission.exercise)).map((status) => [status.boss.id, status])).values()];
  const total = (day?.xp ?? 0) + landedXp;
  const nexts = missions
    .map((mission) => ({ mission, next: nextTarget(mission, liftOf(plan, mission.exercise.lift)?.unit) }))
    .filter((entry) => entry.next);

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-[var(--scrim)] anim-fade" role="dialog" aria-modal="true" aria-label="Session finished">
      <div className="w-full lg:max-w-[440px] max-h-[92dvh] overflow-y-auto rounded-t-card lg:rounded-card bg-ink-950 border border-ink-700 p-4 pb-[max(16px,env(safe-area-inset-bottom))] flex flex-col gap-3 anim-sheet">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="eyebrow text-fg-4">Session · {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <h2 className="font-display font-extrabold uppercase text-[34px] leading-[0.9] text-fg">
              Finished
            </h2>
          </div>
          <span className="w-16 h-16 shrink-0">
            <AvatarFigure size={64} />
          </span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 -mr-1 flex items-center justify-center rounded-card text-fg-4 hover:text-fg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            [minutes ? `${minutes} min` : '—', 'on the clock'],
            [String(logged), logged === 1 ? 'number logged' : 'numbers logged'],
            [String(streak), 'day streak'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-card bg-ink-900 p-2.5 flex flex-col gap-0.5">
              <span className="num font-bold text-[22px] leading-none text-fg">{value}</span>
              <span className="text-[11px] text-fg-4">{label}</span>
            </div>
          ))}
        </div>

        <ul className="rounded-card bg-ink-900 p-3 flex flex-col gap-2.5">
          {missions.map((mission) => {
            const lift = liftOf(plan, mission.exercise.lift);
            return (
              <li key={mission.key} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="min-w-0 text-fg-2">
                  {mission.exercise.name}
                  {mission.value !== null && lift ? <span className="num text-fg"> · {formatStatValue(mission.value, lift.unit)}</span> : null}
                  <small className="block text-[11.5px] text-fg-4">
                    {mission.grade === 'pr'
                      ? 'All-time best. PR.'
                      : mission.grade === 'overload' && mission.previous !== null && lift
                        ? `Best of the last 4 weeks was ${formatStatValue(mission.previous, lift.unit)}. Overload.`
                        : mission.grade === 'hit'
                          ? 'Logged at target.'
                          : 'Ticked at the usual number.'}
                  </small>
                </span>
                <span className={`shrink-0 num font-bold ${mission.grade === 'pr' || mission.grade === 'overload' ? 'text-earned' : 'text-fg-2'}`}>
                  {GRADE_LABEL[mission.grade]} +{mission.xp}
                </span>
              </li>
            );
          })}
          {landed.map((entry) => {
            const [tree, ...rest] = entry.key.split(':');
            const skill = skillOf(tree as SkillTreeRef, rest.join(':'));
            return (
              <li key={entry.key} className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="min-w-0 text-fg-2">
                  {skill?.name ?? 'Skill'}
                  <small className="block text-[11.5px] text-fg-4">Landed. Prove it again in 2 to 21 days.</small>
                </span>
                <span className="shrink-0 num font-bold text-earned">+{entry.xp}</span>
              </li>
            );
          })}
          {missions.length === 0 && landed.length === 0 && <li className="text-[13px] text-fg-4">Nothing ticked or logged today yet.</li>}
        </ul>

        {bosses.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Bosses hit today">
            {bosses.map((status) => (
              <BossHpChip key={status.boss.id} status={status} />
            ))}
          </div>
        )}

        <div className="flex items-baseline justify-between border-t border-ink-700 pt-2.5">
          <span className="eyebrow text-fg-4">
            {day && day.raw > day.xp ? `Capped at ${day.xp} for the day` : day?.session ? `Session +${day.session}` : 'Today'}
          </span>
          <span className="num font-bold text-[30px] text-earned">+{total} XP</span>
        </div>
        {nexts.length > 0 && (
          <p className="text-[12.5px] text-fg-3">
            Next time: {nexts.slice(0, 3).map((entry) => `${entry.mission.exercise.name} ${entry.next}`).join(' · ')}.
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-card bg-fg text-ink-950 font-display font-extrabold uppercase text-xl tracking-[0.02em] active:scale-[.97] transition cursor-pointer"
        >
          Open the chest
        </button>
      </div>
    </div>
  );
};
