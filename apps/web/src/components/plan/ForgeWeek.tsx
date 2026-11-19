'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, HeartPulse, Minus, Plus, Search, X } from 'lucide-react';
import { ARMOR_CATALOG, DISCIPLINES, Discipline, EXERCISE_BY_ID, exerciseCatalog } from '../../data/campaignCatalog';
import {
  DAY_IDS,
  DAY_KINDS,
  DAY_NAMES,
  DayId,
  DayKind,
  PlanSpec,
  SpecExercise,
  choiceFor,
  newId,
  normalizeSpec,
} from '../../utils/campaignPlan';
import { ArmorSlot, SpecDayV3 as SpecDay, WarmUp } from '../../utils/campaignV3';
import { figureForExercise } from '../game/figures';
import { ArrowRightIcon, FlameIcon, HoldIcon, MoonIcon, PlateIcon, RingsIcon, ShieldIcon } from '../game/icons';
import { Chip, Figure } from '../game/kit';
import { repsChoices } from './catalogOptions';
import { removeAt, setAt } from './fields';

/**
 * The week, built like a quest board: pick a day, give it a type, drop
 * exercises in from a catalogue of figures, and tune sets and reps in place.
 * Phones edit one day at a time with the catalogue in a sheet; desktop shows
 * all seven days as columns with the catalogue alongside.
 */

const KIND_ICON: Record<DayKind, React.ComponentType<{ className?: string }>> = {
  push: ArrowUp,
  pull: ArrowDown,
  legs: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M9 3v8l-2 10M15 3v8l2 10" />
    </svg>
  ),
  core: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <rect x="7" y="4" width="10" height="16" rx="3" />
      <path d="M7 10h10M7 14h10" />
    </svg>
  ),
  recovery: HeartPulse,
  rest: MoonIcon,
};

/** Each shelf of the catalogue wears a glyph, never a colour. */
const SHELF_ICON: Partial<Record<Discipline, React.ComponentType<{ className?: string }>>> = {
  calisthenics: RingsIcon,
  gym: PlateIcon,
  bouldering: HoldIcon,
  prep: FlameIcon,
};

const MAX_EXERCISES = 20;
const MAX_WARM_UPS = 10;

/** Where the catalogue drops what is picked: the day's missions or its warm-up. */
type Target = 'missions' | 'warmups';

interface Props {
  spec: PlanSpec;
  onChange: (spec: PlanSpec) => void;
  initialDay?: DayId;
}

export const ForgeWeek: React.FC<Props> = ({ spec, onChange, initialDay = 'mon' }) => {
  const [dayId, setDayId] = useState<DayId>(initialDay);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [target, setTarget] = useState<Target>('missions');
  const dayIndex = DAY_IDS.indexOf(dayId);
  const day = spec.days[dayIndex];
  const full = target === 'warmups' ? day.warmUps.length >= MAX_WARM_UPS : day.exercises.length >= MAX_EXERCISES;

  /** Changes that can pull in a lift go through the normaliser, which adds it. */
  const setDayAt = (index: number, next: SpecDay, structural = false) => {
    const nextSpec = { ...spec, days: setAt(spec.days, index, next) };
    onChange(structural ? normalizeSpec(nextSpec, spec) : nextSpec);
  };

  const add = (exerciseId: string) => {
    if (full) return;
    if (target === 'warmups') {
      if (day.warmUps.some((entry) => entry.exercise === exerciseId)) return;
      const warmUp: WarmUp = { id: `${day.id}_warm_${exerciseId}`, ...choiceFor(exerciseId) };
      setDayAt(dayIndex, { ...day, warmUps: [...day.warmUps, warmUp] }, true);
    } else {
      const exercise: SpecExercise = { id: newId('ex'), ...choiceFor(exerciseId) };
      const kind = day.kind === 'rest' ? kindFor(exerciseId) : day.kind;
      setDayAt(dayIndex, { ...day, kind, exercises: [...day.exercises, exercise] }, true);
    }
    setFlash(exerciseId);
    window.setTimeout(() => setFlash((current) => (current === exerciseId ? null : current)), 800);
  };

  const moveToDay = (from: number, index: number, target: DayId) => {
    const exercise = spec.days[from].exercises[index];
    const targetIndex = DAY_IDS.indexOf(target);
    onChange({
      ...spec,
      days: spec.days.map((entry, i) => {
        if (i === from) return { ...entry, exercises: removeAt(entry.exercises, index) };
        if (i === targetIndex) return { ...entry, exercises: [...entry.exercises, exercise] };
        return entry;
      }),
    });
  };

  const toggleArmor = (slot: ArmorSlot) =>
    onChange({ ...spec, armor: spec.armor.includes(slot) ? spec.armor.filter((other) => other !== slot) : [...spec.armor, slot] });

  const targetPicker = <TargetPicker target={target} onPick={setTarget} />;

  return (
    <div className="flex flex-col gap-4">
      {/* Phones: one day at a time. */}
      <div className="lg:hidden flex flex-col gap-3">
        <div className="grid grid-cols-7 gap-1.5">
          {spec.days.map((entry) => {
            const on = entry.id === dayId;
            const Icon = KIND_ICON[entry.kind];
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setDayId(entry.id)}
                aria-pressed={on}
                aria-label={`${DAY_NAMES[entry.id]}, ${entry.kind}, ${entry.exercises.length} exercises`}
                className={`h-[66px] rounded-card border-[1.5px] flex flex-col items-center justify-center gap-1 transition active:scale-[.97] cursor-pointer ${
                  on ? 'bg-ink-800 border-act text-fg' : 'bg-ink-900 border-transparent text-fg-3 hover:bg-ink-850'
                }`}
              >
                <span className="eyebrow">{DAY_NAMES[entry.id].slice(0, 1)}</span>
                <Icon className="w-4 h-4" />
                <span className={`num font-bold text-[13px] leading-none ${on ? 'text-fg' : 'text-fg-5'}`}>{entry.kind === 'rest' ? '–' : entry.exercises.length}</span>
              </button>
            );
          })}
        </div>
        <DayCard
          day={day}
          onDay={(next, structural) => setDayAt(dayIndex, next, structural)}
          onMoveToDay={(index, target) => moveToDay(dayIndex, index, target)}
        />
        <div className="grid grid-cols-2 gap-2">
          {(['missions', 'warmups'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                setTarget(kind);
                setPickerOpen(true);
              }}
              className="h-12 rounded-card border border-ink-600 text-fg hover:bg-ink-850 font-display font-extrabold uppercase text-lg tracking-[0.02em] flex items-center justify-center gap-2 transition active:scale-[.97] cursor-pointer"
            >
              {kind === 'missions' ? <Plus className="w-[18px] h-[18px]" strokeWidth={2.8} /> : <FlameIcon className="w-[18px] h-[18px] text-armour" />}
              {kind === 'missions' ? 'Mission' : 'Warm-up'}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: the whole week as a board, catalogue alongside. */}
      <div className="hidden lg:flex gap-4 items-start">
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="grid grid-cols-[repeat(7,minmax(128px,1fr))] gap-2 min-w-[900px]">
            {spec.days.map((entry, index) => (
              <DayColumn
                key={entry.id}
                day={entry}
                selected={entry.id === dayId}
                onSelect={() => setDayId(entry.id)}
                onDay={(next, structural) => setDayAt(index, next, structural)}
                onMoveToDay={(i, target) => moveToDay(index, i, target)}
              />
            ))}
          </div>
        </div>
        <div className="w-[300px] shrink-0 sticky top-6">
          <Catalogue dayName={DAY_NAMES[dayId]} picked={target === 'warmups' ? day.warmUps : day.exercises} flash={flash} onPick={add} target={target} header={targetPicker} />
        </div>
      </div>

      <ArmorRow armor={spec.armor} onToggle={toggleArmor} />

      {pickerOpen && (
        <>
          <button type="button" aria-label="Close" onClick={() => setPickerOpen(false)} className="lg:hidden fixed inset-0 z-[45] bg-[var(--scrim)] anim-fade cursor-pointer" />
          <div role="dialog" aria-label="Add an exercise" className="lg:hidden fixed z-50 inset-x-0 bottom-0 h-[82dvh] rounded-t-card bg-ink-900 border-t border-ink-700 lift-shadow p-4 pt-2.5 flex flex-col gap-3 anim-sheet">
            <span className="self-center w-10 h-1 rounded-full bg-ink-600" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="flex-1 font-display font-extrabold uppercase text-[26px] leading-none">{target === 'warmups' ? 'Warm-up' : 'Mission'} · {DAY_NAMES[dayId].slice(0, 3)}</span>
              <button type="button" onClick={() => setPickerOpen(false)} aria-label="Close" className="w-11 h-11 rounded-card border border-ink-600 text-fg-2 hover:bg-ink-850 flex items-center justify-center transition active:scale-[.97] cursor-pointer">
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>
            {targetPicker}
            <Catalogue dayName={DAY_NAMES[dayId]} picked={target === 'warmups' ? day.warmUps : day.exercises} flash={flash} onPick={add} target={target} grid />
          </div>
        </>
      )}
    </div>
  );
};

/** A rest day takes the type of the first exercise dropped on it. */
function kindFor(exerciseId: string): DayKind {
  const category = EXERCISE_BY_ID.get(exerciseId)?.category;
  if (category === 'push' || category === 'pull' || category === 'legs' || category === 'core') return category;
  if (category === 'recovery' || category === 'warmup') return 'recovery';
  return 'pull';
}

/* ------------------------------------------------------------------ */

const KindPicker: React.FC<{ kind: DayKind; onPick: (kind: DayKind) => void; compact?: boolean }> = ({ kind, onPick, compact = false }) => (
  <div role="radiogroup" aria-label="Day type" className={`grid gap-1 ${compact ? 'grid-cols-3' : 'grid-cols-6'}`}>
    {DAY_KINDS.map((entry) => {
      const on = entry.id === kind;
      const Icon = KIND_ICON[entry.id];
      return (
        <button
          key={entry.id}
          type="button"
          role="radio"
          aria-checked={on}
          aria-label={entry.label}
          title={entry.label}
          onClick={() => onPick(entry.id)}
          className={`${compact ? 'h-7 rounded-tag' : 'h-11 rounded-card'} flex flex-col items-center justify-center gap-0.5 transition active:scale-[.97] cursor-pointer ${
            on ? 'bg-act text-act-deep' : 'bg-ink-850 text-fg-3 hover:bg-ink-800 hover:text-fg'
          }`}
        >
          <Icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {!compact && <span className="text-[10px] font-semibold leading-none">{entry.label}</span>}
        </button>
      );
    })}
  </div>
);

const DayCard: React.FC<{
  day: SpecDay;
  onDay: (next: SpecDay, structural?: boolean) => void;
  onMoveToDay: (index: number, target: DayId) => void;
}> = ({ day, onDay, onMoveToDay }) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-2.5 p-3.5 rounded-card bg-ink-900">
      <label className="flex flex-col gap-1">
        <span className="sr-only">Day title</span>
        <input
          type="text"
          value={day.title}
          maxLength={60}
          onChange={(event) => onDay({ ...day, title: event.target.value })}
          className="h-11 w-full px-3 rounded-card bg-ink-900 border border-ink-700 text-fg font-display font-extrabold uppercase text-[22px] placeholder:text-fg-5 focus:border-act outline-none transition-colors"
        />
      </label>
      <KindPicker kind={day.kind} onPick={(kind) => onDay({ ...day, kind })} />
    </div>
    <WarmUps warmUps={day.warmUps} onChange={(warmUps) => onDay({ ...day, warmUps })} />
    {day.kind === 'rest' ? (
      <div className="h-[110px] rounded-card border-[1.5px] border-dashed border-ink-600 flex flex-col items-center justify-center gap-2 text-fg-4">
        <MoonIcon className="w-7 h-7" />
        <span className="font-display font-extrabold uppercase text-[22px] leading-none">Claim your rest</span>
      </div>
    ) : (
      <ul className="flex flex-col gap-2">
        {day.exercises.map((exercise, index) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            kind={day.kind}
            dayId={day.id}
            onChange={(next) => onDay({ ...day, exercises: setAt(day.exercises, index, next) })}
            onRemove={() => onDay({ ...day, exercises: removeAt(day.exercises, index) })}
            onMoveToDay={(target) => onMoveToDay(index, target)}
          />
        ))}
      </ul>
    )}
  </div>
);

const DayColumn: React.FC<{
  day: SpecDay;
  selected: boolean;
  onSelect: () => void;
  onDay: (next: SpecDay, structural?: boolean) => void;
  onMoveToDay: (index: number, target: DayId) => void;
}> = ({ day, selected, onSelect, onDay, onMoveToDay }) => {
  const Icon = KIND_ICON[day.kind];
  return (
    <div
      className={`flex flex-col gap-1.5 p-2 rounded-card border-[1.5px] min-h-[480px] transition-colors ${selected ? 'bg-ink-900 border-act' : 'bg-ink-900 border-transparent'}`}
    >
      <button type="button" onClick={onSelect} aria-pressed={selected} className="flex flex-col gap-1 px-1 pt-1 pb-2 border-b border-ink-700 text-left cursor-pointer">
        <span className={`flex items-center gap-1.5 ${selected ? 'text-fg' : 'text-fg-3'}`}>
          <span className="font-display font-extrabold uppercase text-[22px] leading-none">{DAY_NAMES[day.id].slice(0, 3)}</span>
          <Icon className="w-3.5 h-3.5" />
          <span className="ml-auto num font-bold text-[13px] text-fg-5">{day.exercises.length}</span>
        </span>
        <span className="text-[12px] font-medium text-fg-4 leading-tight line-clamp-2 min-h-[30px]">{day.title}</span>
      </button>
      {selected && <KindPicker kind={day.kind} onPick={(kind) => onDay({ ...day, kind })} compact />}
      <WarmUps warmUps={day.warmUps} onChange={(warmUps) => onDay({ ...day, warmUps })} compact />
      {day.kind === 'rest' ? (
        <div className="flex-1 min-h-[120px] rounded-card border-[1.5px] border-dashed border-ink-600 flex flex-col items-center justify-center gap-1.5 text-fg-5">
          <MoonIcon className="w-5 h-5" />
          <span className="eyebrow">Rest</span>
        </div>
      ) : (
        day.exercises.map((exercise, index) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            kind={day.kind}
            dayId={day.id}
            compact
            onChange={(next) => onDay({ ...day, exercises: setAt(day.exercises, index, next) })}
            onRemove={() => onDay({ ...day, exercises: removeAt(day.exercises, index) })}
            onMoveToDay={(target) => onMoveToDay(index, target)}
          />
        ))
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Add to ${DAY_NAMES[day.id]}`}
        className="h-9 mt-auto rounded-card border-[1.5px] border-dashed border-ink-600 text-fg-3 flex items-center justify-center hover:bg-ink-850 hover:text-fg transition active:scale-[.97] cursor-pointer"
      >
        <Plus className="w-4 h-4" strokeWidth={2.8} />
      </button>
    </div>
  );
};

const ExerciseRow: React.FC<{
  exercise: SpecExercise;
  kind: DayKind;
  dayId: DayId;
  compact?: boolean;
  onChange: (next: SpecExercise) => void;
  onRemove: () => void;
  onMoveToDay: (target: DayId) => void;
}> = ({ exercise, kind, dayId, compact = false, onChange, onRemove, onMoveToDay }) => {
  const catalog = EXERCISE_BY_ID.get(exercise.exercise);
  const name = catalog?.name ?? 'Unknown exercise';
  const reps = repsChoices(exercise.exercise);
  const repIndex = reps.findIndex((option) => option.id === exercise.reps);
  const cycle = () => reps.length > 0 && onChange({ ...exercise, reps: reps[(repIndex + 1) % reps.length].id });
  const sets = (delta: number) => onChange({ ...exercise, sets: Math.min(10, Math.max(1, exercise.sets + delta)) });

  if (compact) {
    return (
      <li className="list-none flex flex-col gap-1.5 p-2 rounded-card bg-ink-850 anim-fade">
        <div className="flex items-center gap-1.5">
          <span className="w-8 h-8 rounded-tag shrink-0 bg-ink-950 flex items-center justify-center">
            <Figure spec={figureForExercise(exercise.exercise, kind)} className="w-7 h-7" />
          </span>
          <span className="flex-1" />
          <button type="button" onClick={onRemove} aria-label={`Remove ${name}`} className="w-6 h-6 shrink-0 rounded-tag text-fg-4 hover:text-boss hover:bg-ink-800 flex items-center justify-center cursor-pointer">
            <X className="w-3 h-3" strokeWidth={2.8} />
          </button>
        </div>
        <span className="text-[12px] font-semibold text-fg-2 leading-tight line-clamp-2" title={name}>
          {name}
        </span>
        {reps.length > 0 && <Dose exercise={exercise} reps={reps} onSets={sets} onCycle={cycle} compact />}
        <label className="sr-only">
          Move {name} to another day
          <select value={dayId} onChange={(event) => onMoveToDay(event.target.value as DayId)}>
            {DAY_IDS.map((id) => (
              <option key={id} value={id}>
                {DAY_NAMES[id]}
              </option>
            ))}
          </select>
        </label>
      </li>
    );
  }

  return (
    <li className={`list-none flex ${compact ? 'flex-col gap-1.5 p-2 rounded-card bg-ink-850' : 'items-center gap-2.5 p-2 rounded-card bg-ink-900'} anim-fade`}>
      <div className={`flex ${compact ? 'items-start' : 'items-center flex-1 min-w-0'} gap-2`}>
        <span className={`${compact ? 'w-8 h-8 bg-ink-950' : 'w-[50px] h-[50px] bg-ink-850'} rounded-tag shrink-0 flex items-center justify-center`}>
          <Figure spec={figureForExercise(exercise.exercise, kind)} className={compact ? 'w-7 h-7' : 'w-11 h-11'} />
        </span>
        <span className={`flex-1 min-w-0 flex flex-col ${compact ? '' : 'gap-1.5'}`}>
          <span className={`${compact ? 'text-[12px] leading-tight line-clamp-2' : 'text-[14px] truncate'} font-semibold text-fg-2`}>{name}</span>
          {!compact && reps.length > 0 && <Dose exercise={exercise} reps={reps} onSets={sets} onCycle={cycle} />}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className={`${compact ? 'w-5 h-5 rounded-tag' : 'w-10 h-10 rounded-card'} shrink-0 text-fg-4 hover:text-boss hover:bg-ink-850 flex items-center justify-center transition active:scale-[.97] cursor-pointer`}
        >
          <X className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} strokeWidth={2.8} />
        </button>
      </div>
      {compact && reps.length > 0 && <Dose exercise={exercise} reps={reps} onSets={sets} onCycle={cycle} compact />}
      <label className={compact ? 'sr-only' : 'sr-only'}>
        Move {name} to another day
        <select value={dayId} onChange={(event) => onMoveToDay(event.target.value as DayId)}>
          {DAY_IDS.map((id) => (
            <option key={id} value={id}>
              {DAY_NAMES[id]}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
};

const Dose: React.FC<{
  exercise: SpecExercise;
  reps: { id: string; label: string }[];
  onSets: (delta: number) => void;
  onCycle: () => void;
  compact?: boolean;
}> = ({ exercise, reps, onSets, onCycle, compact = false }) => {
  const label = reps.find((option) => option.id === exercise.reps)?.label ?? exercise.reps;
  // Same parts as the kit Stepper: iron well, quiet minus, chalk plus.
  const box = compact ? 'w-[22px] h-6 rounded-tag bg-ink-800' : 'w-9 h-9 rounded-card';
  return (
    <span className="flex items-center gap-1">
      <span className={`flex items-center ${compact ? 'gap-0.5' : 'h-10 px-0.5 rounded-card bg-ink-900 border border-ink-700'}`}>
        <button
          type="button"
          onClick={() => onSets(-1)}
          aria-label="One set fewer"
          className={`${box} flex items-center justify-center text-fg-3 hover:text-fg transition active:scale-[.97] cursor-pointer`}
        >
          <Minus className="w-3 h-3" strokeWidth={3.4} />
        </button>
        <span className={`min-w-[18px] text-center num font-bold ${compact ? 'text-[14px]' : 'text-lg'}`}>{exercise.sets}</span>
        <button
          type="button"
          onClick={() => onSets(1)}
          aria-label="One set more"
          className={`${box} flex items-center justify-center text-fg hover:bg-ink-800 transition active:scale-[.97] cursor-pointer`}
        >
          <Plus className="w-3 h-3" strokeWidth={3.4} />
        </button>
      </span>
      <span className="text-fg-5 num font-bold text-[13px]">×</span>
      <button
        type="button"
        onClick={onCycle}
        aria-label={`Reps: ${label}. Change`}
        title={label}
        className={`${compact ? 'h-6 flex-1 min-w-0 text-[12px] rounded-tag' : 'h-10 px-3 text-base rounded-card'} border border-ink-600 text-fg hover:bg-ink-850 num font-bold truncate transition active:scale-[.97] cursor-pointer`}
      >
        {exercise.reps || label}
      </button>
    </span>
  );
};

/* ------------------------------------------------------------------ */

const Catalogue: React.FC<{
  dayName: string;
  /** What the day already has where picks land, so those show as added. */
  picked: { exercise: string }[];
  flash: string | null;
  onPick: (id: string) => void;
  target: Target;
  header?: React.ReactNode;
  grid?: boolean;
}> = ({ dayName, picked, flash, onPick, target, header, grid = false }) => {
  const [chosen, setChosen] = useState<Discipline>('calisthenics');
  // Warm-ups open on the warm-up drills; any shelf can still be browsed.
  const [warmShelf, setWarmShelf] = useState<Discipline>('prep');
  const discipline = target === 'warmups' ? warmShelf : chosen;
  const pickShelf = target === 'warmups' ? setWarmShelf : setChosen;
  const [query, setQuery] = useState('');
  const onDay = new Set(picked.map((exercise) => exercise.exercise));

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return exerciseCatalog().filter(
      (exercise) =>
        (needle ? exercise.name.toLowerCase().includes(needle) || exercise.focus.toLowerCase().includes(needle) : exercise.discipline === discipline),
    )
      .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
      .slice(0, 60);
  }, [discipline, query]);

  return (
    <section aria-label={`Exercise catalogue for ${dayName}`} className={`flex flex-col gap-2.5 min-h-0 ${grid ? 'flex-1' : 'p-3.5 rounded-card bg-ink-900'}`}>
      {!grid && (
        <div className="flex items-center gap-2">
          <span className="flex-1 font-display font-extrabold uppercase text-[22px] leading-none">Catalogue</span>
          <Chip tone="act">
            <ArrowRightIcon className="w-3.5 h-3.5" strokeWidth={2.6} />
            {dayName.slice(0, 3)}
          </Chip>
        </div>
      )}
      {header}
      <label className="flex items-center gap-2 h-11 px-3 rounded-card bg-ink-900 border border-ink-700 focus-within:border-act transition-colors">
        <Search className="w-4 h-4 text-fg-5" />
        <span className="sr-only">Search exercises</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-fg placeholder:text-fg-5"
        />
      </label>
      {!query && (
        <div className="flex flex-wrap gap-1.5">
          {DISCIPLINES.map((entry) => {
            const Glyph = SHELF_ICON[entry.id];
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => pickShelf(entry.id)}
                aria-pressed={entry.id === discipline}
                className={`h-8 px-2.5 rounded-tag flex items-center gap-1.5 text-[13px] font-semibold transition active:scale-[.97] cursor-pointer ${
                  entry.id === discipline ? 'bg-act text-act-deep' : 'bg-ink-850 text-fg-3 hover:bg-ink-800 hover:text-fg'
                }`}
              >
                {Glyph && <Glyph className="w-3.5 h-3.5" />}
                {entry.label}
              </button>
            );
          })}
        </div>
      )}
      <ul className={`min-h-0 overflow-y-auto no-scrollbar ${grid ? 'grid grid-cols-3 gap-2 content-start flex-1' : 'flex flex-col gap-1.5 max-h-[560px]'}`}>
        {results.map((exercise) => {
          const added = onDay.has(exercise.id);
          return (
            <li key={exercise.id} className="list-none">
              <button
                type="button"
                onClick={() => onPick(exercise.id)}
                aria-label={`Add ${exercise.name}`}
                className={`w-full border-[1.5px] rounded-card transition active:scale-[.97] cursor-pointer ${flash === exercise.id ? 'bg-ink-750' : 'bg-ink-850 hover:bg-ink-800'} ${
                  added ? 'border-ink-500' : 'border-transparent'
                } ${grid ? 'h-[128px] p-1.5 flex flex-col items-center gap-1 text-center' : 'p-1.5 flex items-center gap-2.5 text-left'}`}
              >
                <span className={`${grid ? 'w-16 h-16' : 'w-11 h-11'} shrink-0 rounded-tag bg-ink-950 flex items-center justify-center`}>
                  <Figure spec={figureForExercise(exercise.id, exercise.category)} className={grid ? 'w-14 h-14' : 'w-10 h-10'} />
                </span>
                <span className={`flex-1 min-w-0 flex flex-col ${grid ? 'items-center' : ''}`}>
                  <span className={`text-[12px] font-semibold text-fg-2 leading-tight ${grid ? 'line-clamp-2' : 'truncate'}`}>{exercise.name}</span>
                  <span className="num font-bold text-[12px] text-fg-4">
                    {exercise.sets} × {exercise.reps || '—'}
                  </span>
                </span>
                {!grid && (
                  <span className={`w-7 h-7 shrink-0 rounded-tag flex items-center justify-center ${added ? 'bg-act text-act-deep' : 'bg-ink-750 text-fg'}`}>
                    <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/** Tendon work is armour, so it wears steel. */
const ArmorRow: React.FC<{ armor: ArmorSlot[]; onToggle: (slot: ArmorSlot) => void }> = ({ armor, onToggle }) => (
  <section aria-label="Weekly tendon armour" className="flex flex-col gap-2.5 p-3.5 rounded-card bg-ink-900">
    <div className="flex items-center gap-2">
      <ShieldIcon className="w-[18px] h-[18px] text-armour" lit={armor.length > 0} />
      <h2 className="flex-1 font-display font-extrabold uppercase text-[22px] leading-none">Weekly armour</h2>
      <span className="num font-bold text-[15px] text-armour">
        {armor.length}
        <span className="text-fg-5">/{ARMOR_CATALOG.length}</span>
      </span>
    </div>
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
      {ARMOR_CATALOG.map((piece) => {
        const slot = piece.id.replace(/^armor_/, '') as ArmorSlot;
        const on = armor.includes(slot);
        return (
          <button
            key={piece.id}
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => onToggle(slot)}
            title={`${piece.drill} — ${piece.when}`}
            className={`h-[58px] rounded-card border-[1.5px] flex flex-col items-center justify-center gap-1 transition active:scale-[.97] cursor-pointer ${
              on ? 'bg-armour-deep border-armour-line text-armour' : 'bg-ink-850 border-dashed border-ink-600 text-fg-4 hover:text-fg'
            }`}
          >
            <ShieldIcon className="w-5 h-5" lit={on} />
            <span className="text-[11px] font-semibold">{piece.slot}</span>
          </button>
        );
      })}
    </div>
  </section>
);

const TargetPicker: React.FC<{ target: Target; onPick: (target: Target) => void }> = ({ target, onPick }) => (
  <div role="radiogroup" aria-label="Add to" className="grid grid-cols-2 gap-1 p-1 rounded-card bg-ink-950">
    {(['missions', 'warmups'] as const).map((id) => (
      <button
        key={id}
        type="button"
        role="radio"
        aria-checked={id === target}
        onClick={() => onPick(id)}
        className={`h-9 rounded-tag text-[13px] font-semibold flex items-center justify-center gap-1.5 transition active:scale-[.97] cursor-pointer ${
          id === target ? 'bg-act text-act-deep' : 'text-fg-3 hover:text-fg'
        }`}
      >
        {id === 'missions' ? <Plus className="w-3.5 h-3.5" strokeWidth={3} /> : <FlameIcon className="w-3.5 h-3.5" />}
        {id === 'missions' ? 'Missions' : 'Warm-up'}
      </button>
    ))}
  </div>
);

/** The day's warm-up: done before the missions, ticked on the quest board. Warm-ups wear steel. */
const WarmUps: React.FC<{ warmUps: WarmUp[]; onChange: (warmUps: WarmUp[]) => void; compact?: boolean }> = ({ warmUps, onChange, compact = false }) => {
  if (!warmUps.length) return null;
  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-1.5 p-3 rounded-card bg-ink-900'}`} aria-label="Warm-up">
      {!compact && (
        <span className="eyebrow flex items-center gap-1.5 text-armour">
          <FlameIcon className="w-3.5 h-3.5" /> Warm-up
        </span>
      )}
      <ul className="flex flex-wrap gap-1">
        {warmUps.map((warmUp, index) => {
          const name = EXERCISE_BY_ID.get(warmUp.exercise)?.name ?? 'Warm-up';
          return (
            <li
              key={warmUp.id}
              className={`list-none flex items-center gap-1 rounded-tag bg-armour-deep text-armour ${compact ? 'pl-1.5 pr-0.5 h-6 text-[11px] max-w-full' : 'pl-2.5 pr-1 h-8 text-[13px]'}`}
            >
              {compact && <FlameIcon className="w-3 h-3 shrink-0" />}
              <span className="truncate font-semibold">{name}</span>
              <button
                type="button"
                onClick={() => onChange(removeAt(warmUps, index))}
                aria-label={`Remove ${name} from the warm-up`}
                className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} shrink-0 rounded-tag flex items-center justify-center hover:bg-armour-line cursor-pointer`}
              >
                <X className="w-3 h-3" strokeWidth={2.8} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
