'use client';

import React, { useState } from 'react';
import { Exercise } from '../types/exercise';
import { EXERCISES } from '../data/exercisesData';
import { Dialog } from './ui/Dialog';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Lock, 
  ShieldAlert, 
  Award, 
  ChevronRight, 
  ArrowLeft,
  X,
  Target,
  Sparkles,
  Flame,
  Info,
  Lightbulb,
  ExternalLink,
  VideoOff,
  Tv
} from 'lucide-react';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectPrerequisite: (exercise: Exercise) => void;
  isMastered: boolean;
  isUnlocked: boolean;
  onToggleMastered: (exerciseId: string) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onSelectPrerequisite,
  isMastered,
  isUnlocked,
  onToggleMastered,
}) => {
  if (!exercise) return null;

  // Find prerequisite exercises objects
  const prerequisiteExercises = exercise.prerequisites
    .map(id => EXERCISES.find(ex => ex.id === id))
    .filter((ex): ex is Exercise => ex !== undefined);

  // Find exercises that unlock NEXT after mastering this one
  const nextUnlocks = EXERCISES.filter(ex => ex.prerequisites.includes(exercise.id));

  const isPro = exercise.level >= 15;
  const youtubeQuery = exercise.youtubeQuery;
  const videoSearchUrl = exercise.videoSearchUrl || (youtubeQuery ? `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}` : '#');

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={exercise.swimlane.toLowerCase() as any}>
              {exercise.swimlane} Branch
            </Badge>
            <Badge variant="outline">
              {exercise.subCategory}
            </Badge>
            {isPro && (
              <Badge variant="pro">
                PRO HOLD (Lvl {exercise.level})
              </Badge>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {exercise.name}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="py-6 space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        
        {/* Dynamic Video Embed & UI */}
        <div className="space-y-2">
          <div className="relative w-full aspect-video rounded-2xl bg-dark-950 border border-slate-800/90 overflow-hidden flex items-center justify-center shadow-xl group">
            {youtubeQuery ? (
              <iframe
                src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(youtubeQuery)}`}
                title={`${exercise.name} Tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 aspect-video rounded-2xl"
              />
            ) : (
              /* Graceful Fallback State */
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 text-slate-500">
                <VideoOff className="w-10 h-10 text-slate-600 mb-1" />
                <span className="text-sm font-semibold text-slate-400">Video Tutorial Unavailable</span>
                <span className="text-xs text-slate-500">No search query available for this exercise</span>
              </div>
            )}
          </div>

          {/* External Fallback Link */}
          {youtubeQuery && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-500 font-mono">
                Embedded Tutorial for "{youtubeQuery}"
              </span>
              <a
                href={videoSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-dark-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5 text-neon-cyan" />
              </a>
            </div>
          )}
        </div>

        {/* Strength Level Meter (Progress bar 1-20 color-coded) */}
        <div className="p-4 rounded-2xl bg-dark-950/70 border border-slate-800/80">
          <Progress level={exercise.level} maxLevel={20} showLabel={true} />
        </div>

        {/* How to Unlock Block */}
        <div className="p-4 rounded-2xl bg-dark-950/80 border border-slate-800/90 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon-cyan">
            <Award className="w-4 h-4" />
            <span>How to Unlock / Requirement</span>
          </div>
          <p className="text-sm font-medium text-slate-200 leading-relaxed">
            {exercise.unlockRequirements}
          </p>
        </div>

        {/* Step-by-Step Instructions & Form Cues */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Info className="w-4 h-4 text-neon-emerald" />
            <span>Step-by-Step Performance Guide</span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-300 font-normal">
            {exercise.description.map((step, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-dark-950/50 border border-slate-800/60 leading-relaxed flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-neon-cyan text-[11px] font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expert Tip Box */}
        {exercise.expertTip && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-dark-950 border border-amber-500/40 space-y-1.5 shadow-neon-gold/10">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
              <Lightbulb className="w-4 h-4" />
              <span>Coach's Expert Tip</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-200 font-medium leading-relaxed italic">
              "{exercise.expertTip}"
            </p>
          </div>
        )}

        {/* Targeted Muscles */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Targeted Muscle Groups
          </div>
          <div className="flex flex-wrap gap-2">
            {exercise.musclesTargeted.map((muscle, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium">
                {muscle}
              </span>
            ))}
          </div>
        </div>

        {/* Prerequisites List (Clickable Badges to switch modal) */}
        <div className="p-4 rounded-2xl bg-dark-950/80 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Prerequisite Exercises ({prerequisiteExercises.length})
            </span>
            <span className="text-[11px] text-slate-500 italic">Click badge to jump to exercise</span>
          </div>

          {prerequisiteExercises.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No prerequisites. This is an entry-level foundation exercise.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {prerequisiteExercises.map(prereq => (
                <Badge
                  key={prereq.id}
                  variant="clickable"
                  onClick={() => onSelectPrerequisite(prereq)}
                  icon={<ChevronRight className="w-3 h-3 text-neon-cyan" />}
                >
                  {prereq.name} (Lvl {prereq.level})
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Downstream Unlocks */}
        {nextUnlocks.length > 0 && (
          <div className="p-4 rounded-2xl bg-dark-950/60 border border-slate-800/70 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Unlocks Next ({nextUnlocks.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {nextUnlocks.map(nextEx => (
                <Badge
                  key={nextEx.id}
                  variant="outline"
                  onClick={() => onSelectPrerequisite(nextEx)}
                >
                  {nextEx.name} (Lvl {nextEx.level})
                </Badge>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modal Footer CTA */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-dark-950 text-slate-300 border border-slate-800 hover:bg-slate-900 hover:text-white transition text-xs font-bold"
        >
          Close Window
        </button>

        <button
          onClick={() => onToggleMastered(exercise.id)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition shadow-lg ${
            isMastered
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-neon-emerald'
              : isUnlocked
              ? 'bg-gradient-to-r from-neon-cyan to-neon-emerald text-slate-950 hover:opacity-90 shadow-neon-cyan'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          {isMastered ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Mastered (Click to Reset)</span>
            </>
          ) : isUnlocked ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Mark as Mastered (+{exercise.xpReward} XP)</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Override & Unlock</span>
            </>
          )}
        </button>
      </div>
    </Dialog>
  );
};
