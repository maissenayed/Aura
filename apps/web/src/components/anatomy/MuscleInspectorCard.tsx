'use client';

import React, { useState } from 'react';
import { MuscleMetadata, getExercisesForMuscle } from '../../data/muscleData';
import { Exercise } from '@aura/types';
import { 
  Flame, 
  Dumbbell, 
  Compass, 
  ShieldCheck, 
  ExternalLink, 
  Zap, 
  ChevronRight,
  BookOpen,
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';

interface MuscleInspectorCardProps {
  muscle: MuscleMetadata | null;
  onSelectExercise?: (exercise: Exercise) => void;
  onClose?: () => void;
}

export const MuscleInspectorCard: React.FC<MuscleInspectorCardProps> = ({
  muscle,
  onSelectExercise,
}) => {
  // Level Min & Max state (Defaults: Min = 1, Max = 5)
  const [minLevel, setMinLevel] = useState<number>(1);
  const [maxLevel, setMaxLevel] = useState<number>(5);
  const [displayLimit, setDisplayLimit] = useState<number>(5);

  if (!muscle) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[580px] p-8 text-center rounded-3xl bg-dark-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-dark-950 border border-slate-800 text-neon-cyan animate-bounce">
          <Compass className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black tracking-tight text-white mb-2">
          SELECT A MUSCLE GROUP
        </h3>
        <p className="max-w-xs text-xs text-slate-400 leading-relaxed mb-6">
          Hover over or click any muscle region on the anatomical model to inspect biomechanics, origins/insertions, and matched calisthenics exercises.
        </p>

        <div className="grid grid-cols-2 gap-2 text-left w-full max-w-xs text-[11px] font-medium text-slate-400">
          <div className="p-3 rounded-xl bg-dark-950/80 border border-slate-800">
            <span className="text-neon-cyan font-bold block mb-1">⚡ Push Chain</span>
            Chest, Delts, Triceps, Serratus
          </div>
          <div className="p-3 rounded-xl bg-dark-950/80 border border-slate-800">
            <span className="text-neon-purple font-bold block mb-1">🔥 Pull Chain</span>
            Lats, Traps, Biceps, Forearms
          </div>
          <div className="p-3 rounded-xl bg-dark-950/80 border border-slate-800">
            <span className="text-neon-emerald font-bold block mb-1">🛡️ Core System</span>
            Abs, Obliques, Lower Back
          </div>
          <div className="p-3 rounded-xl bg-dark-950/80 border border-slate-800">
            <span className="text-neon-amber font-bold block mb-1">🏋️ Leg Power</span>
            Quads, Glutes, Hamstrings
          </div>
        </div>
      </div>
    );
  }

  // Get matched exercises filtered by Level Min & Max, sorted ascending by level
  const matchedExercises: Exercise[] = getExercisesForMuscle(muscle.id, minLevel, maxLevel);
  const visibleExercises = matchedExercises.slice(0, displayLimit);
  const hasMore = matchedExercises.length > displayLimit;

  // Level presets
  const levelPresets = [
    { label: 'Lvl 1-5 (Foundation)', min: 1, max: 5 },
    { label: 'Lvl 6-10 (Intermediate)', min: 6, max: 10 },
    { label: 'Lvl 11-15 (Advanced)', min: 11, max: 15 },
    { label: 'Lvl 16+ (Titan)', min: 16, max: 20 },
    { label: 'All Levels (1-20)', min: 1, max: 20 },
  ];

  // Category badge styles
  let categoryColor = 'text-neon-cyan border-neon-cyan/40 bg-neon-cyan/10 shadow-neon-cyan';
  if (muscle.category === 'Pull') {
    categoryColor = 'text-neon-purple border-neon-purple/40 bg-neon-purple/10 shadow-neon-purple';
  } else if (muscle.category === 'Core') {
    categoryColor = 'text-neon-emerald border-neon-emerald/40 bg-neon-emerald/10 shadow-neon-emerald';
  } else if (muscle.category === 'Legs') {
    categoryColor = 'text-neon-amber border-neon-amber/40 bg-neon-amber/10 shadow-neon-gold';
  }

  return (
    <div className="flex flex-col w-full h-full p-6 rounded-3xl bg-dark-900/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-y-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="space-y-2 border-b border-slate-800/80 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-wider ${categoryColor}`}>
            {muscle.category} • {muscle.region}
          </span>
          <span className="text-[10px] font-mono font-semibold text-slate-400">
            ID: #{muscle.id}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          {muscle.name}
        </h2>
        <p className="text-xs font-mono italic text-neon-cyan">
          {muscle.latinName}
        </p>
      </div>

      {/* OVERVIEW & DESCRIPTION */}
      <div className="space-y-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-neon-cyan" />
          <span>Anatomical Overview</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed bg-dark-950/80 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          {muscle.description}
        </p>
      </div>

      {/* BIOMECHANICS & ACTIONS */}
      <div className="grid grid-cols-1 gap-3">
        <div className="p-4 rounded-2xl bg-dark-950/80 border border-slate-800/80 space-y-1">
          <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-neon-emerald flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-neon-emerald" />
            <span>Primary Function & Biomechanics</span>
          </h5>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {muscle.primaryFunction}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-dark-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Origin Point</span>
            <p className="text-[11px] text-slate-300 font-mono leading-tight">{muscle.origin}</p>
          </div>
          <div className="p-3 rounded-xl bg-dark-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Insertion Point</span>
            <p className="text-[11px] text-slate-300 font-mono leading-tight">{muscle.insertion}</p>
          </div>
        </div>
      </div>

      {/* PRO COACHING TIP */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-neon-purple/10 via-dark-950 to-dark-950 border border-neon-purple/30 space-y-1">
        <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-neon-purple flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neon-purple" />
          <span>Coach Form Cue & Hypertrophy Tip</span>
        </h5>
        <p className="text-xs text-slate-300 italic leading-relaxed">
          "{muscle.formTip}"
        </p>
      </div>

      {/* MATCHED CALISTHENICS EXERCISES WITH MIN/MAX LEVEL FILTER */}
      <div className="space-y-4 pt-2 border-t border-slate-800/80">
        
        {/* EXERCISE HEADER & COUNTER */}
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Targeted Exercises</span>
          </h4>
          <span className="text-[10px] text-neon-cyan font-mono font-bold bg-neon-cyan/10 border border-neon-cyan/30 px-2.5 py-0.5 rounded-full">
            {matchedExercises.length} Found (Lvl {minLevel}–{maxLevel})
          </span>
        </div>

        {/* LEVEL FILTER CONTROLS (MIN & MAX) */}
        <div className="p-3.5 rounded-2xl bg-dark-950/90 border border-slate-800/90 space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neon-emerald" />
              <span>Level Range Filter</span>
            </span>
            <span className="text-[10px] text-slate-400">Sorted: Lowest Level First</span>
          </div>

          {/* PRESET PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {levelPresets.map((preset) => {
              const isActive = minLevel === preset.min && maxLevel === preset.max;
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    setMinLevel(preset.min);
                    setMaxLevel(preset.max);
                    setDisplayLimit(5); // Reset display limit to 5 on filter change
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-xl border transition-all shrink-0 ${
                    isActive
                      ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 shadow-neon-cyan'
                      : 'bg-dark-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* CUSTOM MIN / MAX INPUT SELECTORS */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">Min Level:</span>
              <select
                value={minLevel}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMinLevel(val);
                  if (val > maxLevel) setMaxLevel(val);
                  setDisplayLimit(5);
                }}
                className="flex-1 py-1 px-2 text-xs font-mono font-bold rounded-xl bg-dark-900 border border-slate-700 text-neon-cyan focus:outline-none focus:border-neon-cyan"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>Lvl {lvl}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">Max Level:</span>
              <select
                value={maxLevel}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxLevel(val);
                  if (val < minLevel) setMinLevel(val);
                  setDisplayLimit(5);
                }}
                className="flex-1 py-1 px-2 text-xs font-mono font-bold rounded-xl bg-dark-900 border border-slate-700 text-neon-cyan focus:outline-none focus:border-neon-cyan"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>Lvl {lvl}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* EXERCISE CARDS LIST */}
        {visibleExercises.length === 0 ? (
          <div className="p-4 rounded-2xl bg-dark-950/60 border border-slate-800 text-center text-xs text-slate-400">
            No exercises found in Level {minLevel}–{maxLevel} for this muscle group. Try expanding the level range.
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleExercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => onSelectExercise?.(exercise)}
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-dark-950/90 border border-slate-800 hover:border-neon-cyan/50 hover:bg-dark-850 transition-all duration-200 cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-black text-xs group-hover:scale-110 transition-transform">
                    L{exercise.level}
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-white group-hover:text-neon-cyan transition-colors">
                      {exercise.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {exercise.subCategory} • <span className="text-neon-emerald">+{exercise.xpReward} XP</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={exercise.videoSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Watch video tutorial"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SHOW MORE BUTTON */}
        {hasMore && (
          <button
            onClick={() => setDisplayLimit((prev) => prev + 5)}
            className="w-full py-2.5 text-xs font-extrabold rounded-2xl bg-dark-950/90 border border-slate-800 text-neon-cyan hover:bg-slate-800/80 hover:border-neon-cyan/40 transition flex items-center justify-center gap-2"
          >
            <span>Show More Exercises ({matchedExercises.length - displayLimit} remaining)</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

      </div>

    </div>
  );
};
