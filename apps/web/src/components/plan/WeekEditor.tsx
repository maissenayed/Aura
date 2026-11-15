'use client';

import React, { useState } from 'react';
import { Moon } from 'lucide-react';
import { ARMOR_BY_ID, DISCIPLINES, EXERCISE_BY_ID } from '../../data/campaignCatalog';
import {
  CampaignPlan,
  DAY_IDS,
  DAY_KINDS,
  DAY_NAMES,
  DayId,
  DayKind,
  DoseChoice,
  PlanSpec,
  SpecDay,
  SpecExercise,
  TRAINABLE_ATTRIBUTES,
  choiceFor,
  newId,
  normalizeSpec,
} from '../../utils/campaignPlan';
import { themeFor } from '../protocol/primitives';
import { ExercisePicker } from './ExercisePicker';
import { armorGroups, repsChoices, setOptions } from './catalogOptions';
import {
  DeleteButton,
  EditCard,
  Facts,
  Group,
  GroupedSelect,
  MoveButtons,
  SelectField,
  TextField,
  moveBy,
  removeAt,
  setAt,
} from './fields';

interface Props {
  spec: PlanSpec;
  /** The same plan built out from the catalog, for names and what each exercise logs. */
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

export const WeekEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const [dayId, setDayId] = useState<DayId>('mon');
  const [openId, setOpenId] = useState<string | null>(null);
  const dayIndex = DAY_IDS.indexOf(dayId);
  const day = spec.days[dayIndex];
  const resolvedDay = plan.days[dayIndex];

  /** Changes that can pull in a lift go through the normaliser, which adds it. */
  const commit = (next: PlanSpec) => onChange(normalizeSpec(next, spec));
  const setDay = (next: SpecDay, structural = false) => {
    const nextSpec = { ...spec, days: setAt(spec.days, dayIndex, next) };
    if (structural) commit(nextSpec);
    else onChange(nextSpec);
  };
  const setExercises = (exercises: SpecExercise[]) => setDay({ ...day, exercises }, true);

  const addExercise = (exerciseId: string) => {
    const exercise: SpecExercise = { id: newId('ex'), ...choiceFor(exerciseId) };
    setExercises([...day.exercises, exercise]);
    setOpenId(exercise.id);
  };

  const moveToDay = (index: number, target: DayId) => {
    const exercise = day.exercises[index];
    const targetIndex = DAY_IDS.indexOf(target);
    const days = spec.days.map((entry, i) => {
      if (i === dayIndex) return { ...entry, exercises: removeAt(entry.exercises, index) };
      if (i === targetIndex) return { ...entry, exercises: [...entry.exercises, exercise] };
      return entry;
    });
    onChange({ ...spec, days });
    setDayId(target);
  };

  return (
    <div className="space-y-6">
      {/* Day picker */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2" role="tablist" aria-label="Day of the week">
        {spec.days.map((entry) => {
          const active = entry.id === dayId;
          const theme = themeFor(entry.kind);
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setDayId(entry.id);
                setOpenId(null);
              }}
              className={`text-left p-2.5 rounded-xl border transition cursor-pointer ${
                active ? `${theme.bg} ${theme.border}` : 'bg-dark-950/60 border-slate-800 hover:border-slate-600'
              }`}
            >
              <span className={`block text-[10px] font-black uppercase tracking-widest ${active ? theme.text : 'text-slate-400'}`}>
                {DAY_NAMES[entry.id].slice(0, 3)}
              </span>
              <span className="block text-[10px] font-semibold text-slate-300 truncate">{entry.title || 'Untitled'}</span>
              <span className="block text-[9px] text-slate-500">
                {entry.kind === 'rest' ? 'Rest' : `${entry.exercises.length} exercise${entry.exercises.length === 1 ? '' : 's'}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* The day */}
      <Group title={DAY_NAMES[day.id]} hint="What this day is called, what kind of day it is, and the warm-up before the work.">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Title" value={day.title} maxLength={60} onChange={(title) => setDay({ ...day, title })} />
          <SelectField<DayKind>
            label="Type"
            value={day.kind}
            options={DAY_KINDS}
            onChange={(kind) => setDay({ ...day, kind })}
            hint={day.kind === 'rest' ? 'A rest day has one mission: claim your rest.' : 'Sets the day’s colour on the mission board.'}
          />
          <TextField
            className="sm:col-span-2"
            label="Purpose (optional)"
            value={day.purpose ?? ''}
            maxLength={200}
            placeholder="e.g. Flush the tendons, do zero muscle damage."
            onChange={(purpose) => setDay({ ...day, purpose })}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Warm-up</legend>
          {day.warmUps.length === 0 && <p className="text-[11px] text-slate-500">No warm-up on this day.</p>}
          {day.warmUps.map((warmUp, index) => (
            <div key={index} className="flex flex-wrap items-end gap-2 p-2 rounded-xl border border-slate-800 bg-dark-950/60">
              <DoseFields
                className="flex-1 min-w-[240px]"
                choice={warmUp}
                pickerLabel="Change warm-up"
                onChange={(next) => setDay({ ...day, warmUps: setAt(day.warmUps, index, next) })}
              />
              <DeleteButton compact label={`warm-up ${index + 1}`} onDelete={() => setDay({ ...day, warmUps: removeAt(day.warmUps, index) })} />
            </div>
          ))}
          {day.warmUps.length < 10 && (
            <ExercisePicker
              label="Add a warm-up"
              startOn="prep"
              onPick={(id) => setDay({ ...day, warmUps: [...day.warmUps, choiceFor(id)] })}
            />
          )}
        </fieldset>
      </Group>

      {day.kind === 'rest' ? (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-slate-800 bg-dark-950/60">
          <Moon className="w-5 h-5 text-slate-500 shrink-0" />
          <p className="text-xs text-slate-400">
            Rest day: the board shows a single “claim your rest” mission.
            {day.exercises.length > 0 &&
              ` This day still holds ${day.exercises.length} exercise${day.exercises.length === 1 ? '' : 's'}; they come back if you change the type.`}
          </p>
        </div>
      ) : (
        <Group
          title={`Exercises · ${day.exercises.length}`}
          hint="Pick each one from the exercise library, then its sets and reps. What it logs and builds comes with it."
        >
          <ul className="space-y-2">
            {day.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                plan={plan}
                dayId={day.id}
                choice={exercise}
                resolved={resolvedDay.exercises.find((entry) => entry.id === exercise.id)}
                index={index}
                count={day.exercises.length}
                open={openId === exercise.id}
                onToggle={() => setOpenId(openId === exercise.id ? null : exercise.id)}
                onChange={(next, structural) => {
                  const exercises = setAt(day.exercises, index, next);
                  if (structural) setExercises(exercises);
                  else setDay({ ...day, exercises });
                }}
                onMove={(delta) => setDay({ ...day, exercises: moveBy(day.exercises, index, delta) })}
                onMoveToDay={(target) => moveToDay(index, target)}
                onDelete={() => setDay({ ...day, exercises: removeAt(day.exercises, index) })}
              />
            ))}
          </ul>
          {day.exercises.length < 20 && (
            <ExercisePicker
              label={`Add an exercise to ${DAY_NAMES[day.id]}`}
              startOn={day.kind === 'recovery' ? 'prep' : 'calisthenics'}
              onPick={addExercise}
            />
          )}
        </Group>
      )}

      <ArmorEditor spec={spec} onChange={onChange} />
    </div>
  );
};

/* ------------------------------------------------------------------ */

/** Exercise (from the library), sets and reps. */
const DoseFields: React.FC<{
  choice: DoseChoice;
  pickerLabel: string;
  onChange: (choice: DoseChoice, structural: boolean) => void;
  className?: string;
}> = ({ choice, pickerLabel, onChange, className }) => {
  const reps = repsChoices(choice.exercise);
  return (
    <div className={`grid gap-2 grid-cols-2 sm:grid-cols-[3fr_1fr_1.4fr] items-end ${className ?? ''}`}>
      <div className="col-span-2 sm:col-span-1">
        <span className="block mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Exercise</span>
        <ExercisePicker label={pickerLabel} value={choice.exercise} onPick={(id) => onChange(choiceFor(id), true)} />
      </div>
      {reps.length > 0 && (
        <>
          <SelectField
            label="Sets"
            value={String(choice.sets)}
            options={setOptions}
            onChange={(sets) => onChange({ ...choice, sets: Number(sets) }, false)}
          />
          <SelectField label="Reps" value={choice.reps} options={reps} onChange={(value) => onChange({ ...choice, reps: value }, false)} />
        </>
      )}
    </div>
  );
};

interface ExerciseCardProps {
  plan: CampaignPlan;
  dayId: DayId;
  choice: SpecExercise;
  resolved: CampaignPlan['days'][number]['exercises'][number] | undefined;
  index: number;
  count: number;
  open: boolean;
  onToggle: () => void;
  onChange: (choice: SpecExercise, structural: boolean) => void;
  onMove: (delta: number) => void;
  onMoveToDay: (day: DayId) => void;
  onDelete: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  plan,
  dayId,
  choice,
  resolved,
  index,
  count,
  open,
  onToggle,
  onChange,
  onMove,
  onMoveToDay,
  onDelete,
}) => {
  const catalog = EXERCISE_BY_ID.get(choice.exercise);
  const lift = plan.lifts.find((entry) => entry.id === resolved?.lift);
  const logs = lift ? `Your best on ${lift.name}` : resolved?.load ? 'Its own working weight' : (resolved?.note ?? 'Nothing — just tick it');
  const builds = resolved?.trains?.map((id) => TRAINABLE_ATTRIBUTES.find((a) => a.id === id)?.label).join(', ') || '—';
  const feeds = (resolved?.bosses ?? [])
    .map((id) => {
      const order = plan.bosses.findIndex((boss) => boss.id === id);
      return order >= 0 ? `${order + 1} · ${plan.bosses[order].name}` : null;
    })
    .filter(Boolean)
    .join(', ');

  return (
    <EditCard
      title={catalog?.name ?? 'Unknown exercise'}
      meta={[resolved?.target, lift ? `logs ${lift.short}` : resolved?.load ? 'working weight' : resolved?.note].filter(Boolean).join(' · ')}
      open={open}
      onToggle={onToggle}
    >
      <DoseFields choice={choice} pickerLabel="Change exercise" onChange={(next, structural) => onChange({ ...choice, ...next }, structural)} />

      <Facts
        items={[
          { label: 'Skill set', value: DISCIPLINES.find((d) => d.id === catalog?.discipline)?.label ?? '—' },
          { label: 'Focus', value: `${catalog?.focus ?? '—'}${catalog?.level !== undefined ? ` · Skill Tree level ${catalog.level}` : ''}` },
          { label: 'Logs', value: logs },
          { label: 'Builds', value: builds },
          ...(feeds ? [{ label: 'Feeds', value: feeds }] : []),
          ...(resolved?.armor ? [{ label: 'Counts as', value: 'Tendon armor work' }] : []),
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <MoveButtons label={catalog?.name ?? 'exercise'} index={index} count={count} onMove={onMove} />
        <select
          value=""
          aria-label={`Move ${catalog?.name ?? 'exercise'} to another day`}
          onChange={(event) => event.target.value && onMoveToDay(event.target.value as DayId)}
          className="h-9 px-2 rounded-xl bg-dark-950 border border-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
        >
          <option value="">Move to…</option>
          {DAY_IDS.filter((id) => id !== dayId).map((id) => (
            <option key={id} value={id}>
              {DAY_NAMES[id]}
            </option>
          ))}
        </select>
        <span className="ml-auto">
          <DeleteButton label={catalog?.name ?? 'this exercise'} onDelete={onDelete} />
        </span>
      </div>
    </EditCard>
  );
};

/* ------------------------------------------------------------------ */

const ArmorEditor: React.FC<{ spec: PlanSpec; onChange: (spec: PlanSpec) => void }> = ({ spec, onChange }) => (
  <Group
    title={`Weekly tendon armor · ${spec.armor.length}`}
    hint="Small connective-tissue jobs re-forged every week, ticked from the mission board. Forging them all in one week unlocks Tendon Resilience."
  >
    <ul className="space-y-2">
      {spec.armor.map((id, index) => {
        const piece = ARMOR_BY_ID.get(id);
        if (!piece) return null;
        return (
          <li key={id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-dark-950/60">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">{piece.slot}</span>
              <span className="block text-[11px] text-slate-400">{piece.drill}</span>
              <span className="block text-[10px] text-slate-500">{piece.when}</span>
            </span>
            <DeleteButton compact label={piece.slot} onDelete={() => onChange({ ...spec, armor: removeAt(spec.armor, index) })} />
          </li>
        );
      })}
    </ul>
    {armorGroups(new Set(spec.armor))[0].options.length > 0 && (
      <GroupedSelect
        label="Add an armor piece"
        hideLabel
        value=""
        placeholder="+ Add an armor piece…"
        groups={armorGroups(new Set(spec.armor))}
        onChange={(id) => onChange({ ...spec, armor: [...spec.armor, id] })}
      />
    )}
  </Group>
);
