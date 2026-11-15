'use client';

import React, { memo } from 'react';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { Check, Crown, Lock, Sparkles } from 'lucide-react';
import { Exercise, Swimlane } from '@aura/types';
import { SkillStatus } from '../../utils/skillTree';
import { LANE_THEME } from './laneTheme';

/* ------------------------------------------------------------------ */
/* Exercise card                                                       */
/* ------------------------------------------------------------------ */

export interface SkillNodeData extends Record<string, unknown> {
  exercise: Exercise;
  status: SkillStatus;
  selected: boolean;
  dimmed: boolean;
  /** Prerequisites that exist but are filtered off the canvas right now. */
  hiddenPrerequisites: number;
  onSelect: (id: string) => void;
}

const STATUS: Record<SkillStatus, { label: string; icon: React.ReactNode; chip: string; card: string; name: string }> = {
  mastered: {
    label: 'Mastered',
    icon: <Check className="w-3 h-3" strokeWidth={3.5} />,
    chip: 'text-emerald-300',
    card: 'border-emerald-500/50 bg-emerald-950/30',
    name: 'text-emerald-50',
  },
  ready: {
    label: 'Ready',
    icon: <Sparkles className="w-3 h-3" />,
    chip: 'text-neon-cyan',
    card: 'border-cyan-400/60 bg-dark-800 shadow-[0_0_18px_-6px_rgba(0,240,255,0.55)]',
    name: 'text-white',
  },
  locked: {
    label: 'Locked',
    icon: <Lock className="w-3 h-3" />,
    chip: 'text-slate-500',
    card: 'border-slate-800 bg-dark-900/80',
    name: 'text-slate-400',
  },
};

/** The connection points exist only so edges have somewhere to attach — they are not interactive. */
// Note: React Flow turns pointer events off on nodes that are neither selectable nor draggable,
// so the card's button switches them back on for itself (`pointer-events-auto`).
const HANDLE = '!w-px !h-px !min-w-0 !min-h-0 !border-0 !bg-transparent !pointer-events-none';

export const SkillNode = memo(({ data }: NodeProps<Node<SkillNodeData>>) => {
  const { exercise, status, selected, dimmed, hiddenPrerequisites, onSelect } = data;
  const look = STATUS[status];
  const lane = LANE_THEME[exercise.swimlane];

  return (
    <>
      <Handle type="target" position={Position.Left} isConnectable={false} className={HANDLE} />
      <button
        type="button"
        onClick={() => onSelect(exercise.id)}
        aria-pressed={selected}
        aria-label={`${exercise.name}, level ${exercise.level}, ${look.label.toLowerCase()}`}
        className={`nodrag pointer-events-auto relative flex flex-col justify-between w-full h-full pl-4 pr-3 py-2.5 rounded-xl border text-left cursor-pointer transition-[opacity,box-shadow,border-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white hover:border-slate-400 ${look.card} ${
          selected ? 'ring-2 ring-white' : ''
        } ${dimmed ? 'opacity-40' : ''}`}
      >
        <span aria-hidden className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full ${lane.solid} ${status === 'locked' ? 'opacity-30' : ''}`} />

        <span className="flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${look.chip}`}>
            {look.icon}
            {look.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500">
            {exercise.proStatus && <Crown className="w-3 h-3 text-neon-gold" aria-label="Pro hold" />}
            L{exercise.level}
          </span>
        </span>

        <span className={`text-[13px] font-bold leading-tight line-clamp-2 ${look.name}`}>{exercise.name}</span>

        {hiddenPrerequisites > 0 && (
          <span className="absolute -left-2 top-1/2 -translate-y-1/2 px-1 rounded bg-dark-950 border border-slate-700 text-[9px] font-mono font-bold text-slate-400" title="Needs an exercise from an earlier level that is filtered out">
            +{hiddenPrerequisites}
          </span>
        )}
      </button>
      <Handle type="source" position={Position.Right} isConnectable={false} className={HANDLE} />
    </>
  );
});
SkillNode.displayName = 'SkillNode';

/* ------------------------------------------------------------------ */
/* Labels that give the grid its bearings                              */
/* ------------------------------------------------------------------ */

export interface LaneHeaderData extends Record<string, unknown> {
  lane: Swimlane;
  mastered: number;
  total: number;
  ready: number;
}

export const LaneHeaderNode = memo(({ data }: NodeProps<Node<LaneHeaderData>>) => {
  const lane = LANE_THEME[data.lane];
  return (
    <div className={`flex items-center gap-3 w-full h-full px-3 rounded-xl border ${lane.border} ${lane.tint} pointer-events-none`}>
      <span className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${lane.text}`}>
        {lane.icon}
        {lane.label}
      </span>
      <span className="text-[11px] font-mono font-bold text-slate-300">
        {data.mastered}
        <span className="text-slate-500"> / {data.total} mastered</span>
      </span>
      {data.ready > 0 && <span className="text-[11px] font-bold text-neon-cyan">{data.ready} ready</span>}
    </div>
  );
});
LaneHeaderNode.displayName = 'LaneHeaderNode';

export interface LineLabelData extends Record<string, unknown> {
  label: string;
  mastered: number;
  total: number;
}

export const LineLabelNode = memo(({ data }: NodeProps<Node<LineLabelData>>) => (
  <div className="flex flex-col justify-center w-full h-full pr-3 text-right pointer-events-none">
    <span className="text-[12px] font-bold text-slate-200 leading-tight line-clamp-2">{data.label}</span>
    <span className={`text-[10px] font-mono font-bold ${data.mastered > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
      {data.mastered}/{data.total}
    </span>
  </div>
));
LineLabelNode.displayName = 'LineLabelNode';

export interface LevelHeaderData extends Record<string, unknown> {
  level: number;
}

export const LevelHeaderNode = memo(({ data }: NodeProps<Node<LevelHeaderData>>) => (
  <div className="flex items-center gap-2 w-full h-full pointer-events-none">
    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Level {data.level}</span>
    <span className="flex-1 h-px bg-slate-800" />
  </div>
));
LevelHeaderNode.displayName = 'LevelHeaderNode';
