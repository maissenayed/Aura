'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Exercise } from '@aura/types';
import { Badge } from './ui/Badge';
import { 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Flame, 
  Dumbbell, 
  ShieldAlert, 
  Target,
  Zap,
  GitBranch
} from 'lucide-react';

export interface ExerciseNodeData extends Record<string, unknown> {
  exercise: Exercise;
  status: 'mastered' | 'unlocked' | 'locked';
  onSelectExercise: (exercise: Exercise) => void;
  isHighlightedPrereq?: boolean;
  isHighlightedUnlock?: boolean;
  isDimmed?: boolean;
  hasCrossBranchPrereqs?: boolean;
}

export type CustomExerciseNode = Node<ExerciseNodeData, 'exerciseNode'>;

export const ExerciseNode = memo(({ data }: NodeProps<CustomExerciseNode>) => {
  const { 
    exercise, 
    status, 
    onSelectExercise, 
    isHighlightedPrereq, 
    isHighlightedUnlock, 
    isDimmed,
    hasCrossBranchPrereqs 
  } = data;

  const isMastered = status === 'mastered';
  const isUnlocked = status === 'unlocked';
  const isPro = exercise.level >= 15;

  // Determine Branch Icon & Colors
  const getBranchDetails = (swimlane: string) => {
    switch (swimlane) {
      case 'Push':
        return { icon: Flame, color: 'text-neon-cyan', border: 'border-neon-cyan/40', bg: 'bg-cyan-950/20' };
      case 'Pull':
        return { icon: Dumbbell, color: 'text-neon-emerald', border: 'border-neon-emerald/40', bg: 'bg-emerald-950/20' };
      case 'Core':
        return { icon: ShieldAlert, color: 'text-neon-purple', border: 'border-neon-purple/40', bg: 'bg-purple-950/20' };
      case 'Legs':
        return { icon: Target, color: 'text-neon-amber', border: 'border-neon-amber/40', bg: 'bg-amber-950/20' };
      default:
        return { icon: Zap, color: 'text-slate-400', border: 'border-slate-800', bg: 'bg-dark-900' };
    }
  };

  const branch = getBranchDetails(exercise.swimlane);
  const BranchIcon = branch.icon;

  // Active path highlight classes
  let highlightBorder = '';
  if (isHighlightedPrereq) {
    highlightBorder = 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-105 z-30';
  } else if (isHighlightedUnlock) {
    highlightBorder = 'ring-2 ring-neon-emerald shadow-[0_0_20px_rgba(0,255,157,0.5)] scale-105 z-30';
  }

  return (
    <div className={`relative transition-all duration-300 ${isDimmed ? 'opacity-25 grayscale scale-95' : 'opacity-100 scale-100'}`}>
      {/* Left Input Handle Port (Prerequisite Inflow) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in-left"
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-neon-cyan hover:!scale-125 transition-transform"
      />

      {/* Main Node Card */}
      <div
        onClick={() => onSelectExercise(exercise)}
        className={`w-64 p-3.5 rounded-2xl bg-dark-900/95 border backdrop-blur-xl transition-all duration-200 cursor-pointer shadow-xl hover:-translate-y-1 ${
          highlightBorder || (isPro ? 'pro-glow-border border-neon-purple/80' : isMastered ? 'border-emerald-500/60 shadow-neon-emerald/20' : isUnlocked ? 'border-neon-cyan/50 hover:border-neon-cyan shadow-neon-cyan/10' : 'border-slate-800/80 opacity-75')
        }`}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`p-1 rounded-lg bg-dark-950 border border-slate-800 ${branch.color}`}>
              <BranchIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
              Lvl {exercise.level}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {hasCrossBranchPrereqs && (
              <span 
                title="Cross-Branch Requirement (Multi-Branch)"
                className="px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-[9px] font-mono text-purple-300 flex items-center gap-0.5"
              >
                <GitBranch className="w-2.5 h-2.5 text-purple-400" />
                <span>Multi</span>
              </span>
            )}
            
            {isMastered ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>DONE</span>
              </span>
            ) : isUnlocked ? (
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-neon-cyan border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>READY</span>
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>LOCKED</span>
              </span>
            )}
          </div>
        </div>

        {/* Exercise Title */}
        <h3 className="text-sm font-black tracking-tight text-white line-clamp-1 group-hover:text-neon-cyan transition-colors">
          {exercise.name}
        </h3>

        {/* Subcategory & Requirements Tag */}
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-1.5">
          <span className="truncate max-w-[140px] font-medium text-slate-400">
            {exercise.subCategory}
          </span>
          <span className="font-mono text-[10px] text-neon-cyan/80">
            +{exercise.xpReward} XP
          </span>
        </div>
      </div>

      {/* Right Output Handle Port (Downstream Unlock Outflow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-right"
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-neon-emerald hover:!scale-125 transition-transform"
      />
    </div>
  );
});

ExerciseNode.displayName = 'ExerciseNode';
