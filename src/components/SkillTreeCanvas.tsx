'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap,
  Node, 
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import { Exercise, Swimlane, UserProgress } from '../types/exercise';
import { ExerciseNode } from './ExerciseNode';
import { 
  Flame, 
  Dumbbell, 
  ShieldAlert, 
  Target, 
  RotateCcw,
  Sparkles,
  GitBranch,
  Eye,
  Layers
} from 'lucide-react';

interface SkillTreeCanvasProps {
  exercises: Exercise[];
  progress: UserProgress;
  onSelectExercise: (exercise: Exercise) => void;
  selectedSwimlane: Swimlane | 'All';
  searchQuery: string;
  minLevel: number;
  maxLevel: number;
}

const nodeTypes: NodeTypes = {
  exerciseNode: ExerciseNode as any,
};

export const SkillTreeCanvas: React.FC<SkillTreeCanvasProps> = ({
  exercises,
  progress,
  onSelectExercise,
  selectedSwimlane,
  searchQuery,
  minLevel,
  maxLevel,
}) => {
  // Currently focused node for Path Tracing
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Filter exercises based on user selections and Level Range
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSwimlane = selectedSwimlane === 'All' || ex.swimlane === selectedSwimlane;
      const matchesQuery = searchQuery === '' || 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ex.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevelRange = ex.level >= minLevel && ex.level <= maxLevel;
      return matchesSwimlane && matchesQuery && matchesLevelRange;
    });
  }, [exercises, selectedSwimlane, searchQuery, minLevel, maxLevel]);

  // Dynamically calculate Swimlane Row Y-Offsets to guarantee ZERO overlapping between rows
  const swimlaneYOffsets: Record<Swimlane, number> = useMemo(() => {
    const swimlanes: Swimlane[] = ['Push', 'Pull', 'Core', 'Legs'];
    const offsets: Record<Swimlane, number> = {
      'Push': 140,
      'Pull': 650,
      'Core': 1160,
      'Legs': 1670,
    };

    let currentY = 140;

    swimlanes.forEach(s => {
      offsets[s] = currentY;

      // Find max nodes at any single level in this swimlane
      const swimlaneExercises = filteredExercises.filter(ex => ex.swimlane === s);
      const countsByLevel: Record<number, number> = {};
      swimlaneExercises.forEach(ex => {
        countsByLevel[ex.level] = (countsByLevel[ex.level] || 0) + 1;
      });

      const maxNodesAtSingleLevel = Math.max(1, ...Object.values(countsByLevel));
      
      // Node height + vertical stagger gap = 175px per slot + 180px row gap
      const rowHeight = (maxNodesAtSingleLevel * 175) + 180;
      currentY += rowHeight;
    });

    return offsets;
  }, [filteredExercises]);

  // Compute Exercise Status
  const getExerciseStatus = useCallback((ex: Exercise): 'locked' | 'unlocked' | 'mastered' => {
    if (progress.masteredIds.includes(ex.id)) return 'mastered';
    if (ex.prerequisites.length === 0) return 'unlocked';
    const allPrereqsMet = ex.prerequisites.every(id => progress.masteredIds.includes(id));
    return allPrereqsMet ? 'unlocked' : 'locked';
  }, [progress.masteredIds]);

  // Recursive Ancestors Finder (Upstream Prerequisite Chain)
  const getUpstreamAncestors = useCallback((nodeId: string): Set<string> => {
    const ancestors = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      const currentEx = exercises.find(e => e.id === currentId);
      if (currentEx) {
        currentEx.prerequisites.forEach(prereqId => {
          if (!ancestors.has(prereqId)) {
            ancestors.add(prereqId);
            stack.push(prereqId);
          }
        });
      }
    }
    return ancestors;
  }, [exercises]);

  // Recursive Descendants Finder (Downstream Unlock Chain)
  const getDownstreamDescendants = useCallback((nodeId: string): Set<string> => {
    const descendants = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      exercises.forEach(ex => {
        if (ex.prerequisites.includes(currentId) && !descendants.has(ex.id)) {
          descendants.add(ex.id);
          stack.push(ex.id);
        }
      });
    }
    return descendants;
  }, [exercises]);

  // Sets for Active Path Tracing
  const activeAncestors = useMemo(() => {
    if (!focusedNodeId) return new Set<string>();
    return getUpstreamAncestors(focusedNodeId);
  }, [focusedNodeId, getUpstreamAncestors]);

  const activeDescendants = useMemo(() => {
    if (!focusedNodeId) return new Set<string>();
    return getDownstreamDescendants(focusedNodeId);
  }, [focusedNodeId, getDownstreamDescendants]);

  // Generate React Flow Nodes with Generous Dynamic Spacing
  const initialNodes: Node[] = useMemo(() => {
    const slotCounters: Record<string, number> = {};

    return filteredExercises.map(ex => {
      const key = `${ex.swimlane}_lvl_${ex.level}`;
      const slotIndex = slotCounters[key] || 0;
      slotCounters[key] = slotIndex + 1;

      // Generous Horizontal Spacing: Level 1 starts at 140px, spacing 480px per level
      const x = 140 + (ex.level - minLevel) * 480;
      const baseY = swimlaneYOffsets[ex.swimlane];
      
      // Generous Vertical Staggering Offset: 175px per node at same level
      const y = baseY + (slotIndex * 175);

      const status = getExerciseStatus(ex);

      const hasCrossBranchPrereqs = ex.prerequisites.some(prereqId => {
        const prereqEx = exercises.find(e => e.id === prereqId);
        return prereqEx && prereqEx.swimlane !== ex.swimlane;
      });

      const isFocused = focusedNodeId === ex.id;
      const isHighlightedPrereq = activeAncestors.has(ex.id);
      const isHighlightedUnlock = activeDescendants.has(ex.id);
      const isDimmed = focusedNodeId !== null && !isFocused && !isHighlightedPrereq && !isHighlightedUnlock;

      return {
        id: ex.id,
        type: 'exerciseNode',
        position: { x, y },
        data: {
          exercise: ex,
          status,
          onSelectExercise,
          isHighlightedPrereq,
          isHighlightedUnlock,
          isDimmed,
          hasCrossBranchPrereqs,
        },
      };
    });
  }, [filteredExercises, minLevel, swimlaneYOffsets, getExerciseStatus, exercises, focusedNodeId, activeAncestors, activeDescendants, onSelectExercise]);

  // Generate React Flow Edges
  const initialEdges: Edge[] = useMemo(() => {
    const edgesList: Edge[] = [];

    filteredExercises.forEach(targetEx => {
      targetEx.prerequisites.forEach(prereqId => {
        const sourceEx = exercises.find(e => e.id === prereqId);
        if (!sourceEx) return;

        const edgeId = `${prereqId}->${targetEx.id}`;
        const isCrossBranch = sourceEx.swimlane !== targetEx.swimlane;
        const isSourceMastered = progress.masteredIds.includes(prereqId);
        const isTargetMastered = progress.masteredIds.includes(targetEx.id);

        const isPathPrereq = focusedNodeId !== null && (
          (activeAncestors.has(prereqId) || prereqId === focusedNodeId) && 
          (activeAncestors.has(targetEx.id) || targetEx.id === focusedNodeId)
        );

        const isPathUnlock = focusedNodeId !== null && (
          (activeDescendants.has(prereqId) || prereqId === focusedNodeId) && 
          (activeDescendants.has(targetEx.id) || targetEx.id === focusedNodeId)
        );

        const isDimmedEdge = focusedNodeId !== null && !isPathPrereq && !isPathUnlock;

        let strokeColor = '#334155';
        let strokeWidth = 2;
        let animated = false;

        if (isPathPrereq) {
          strokeColor = '#f59e0b';
          strokeWidth = 4;
          animated = true;
        } else if (isPathUnlock) {
          strokeColor = '#00ff9d';
          strokeWidth = 4;
          animated = true;
        } else if (isCrossBranch) {
          strokeColor = isSourceMastered ? '#d946ef' : '#00f0ff';
          strokeWidth = 3;
          animated = true;
        } else if (isTargetMastered) {
          strokeColor = '#00ff9d';
          strokeWidth = 3;
        } else if (isSourceMastered) {
          strokeColor = '#00f0ff';
          strokeWidth = 2.5;
          animated = true;
        }

        edgesList.push({
          id: edgeId,
          source: prereqId,
          sourceHandle: 'out-right',
          target: targetEx.id,
          targetHandle: 'in-left',
          type: 'bezier',
          animated,
          style: {
            stroke: strokeColor,
            strokeWidth,
            opacity: isDimmedEdge ? 0.15 : 1,
            transition: 'all 0.3s ease',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 16,
            height: 16,
          },
        });
      });
    });

    return edgesList;
  }, [filteredExercises, exercises, progress.masteredIds, focusedNodeId, activeAncestors, activeDescendants]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Mouse Handlers for Node Path Focus
  const handleNodeMouseEnter = (_: React.MouseEvent, node: Node) => {
    setFocusedNodeId(node.id);
  };

  const handleNodeMouseLeave = () => {
    setFocusedNodeId(null);
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const ex = exercises.find(e => e.id === node.id);
    if (ex) onSelectExercise(ex);
  };

  return (
    <div className="relative w-full h-[calc(100vh-180px)] min-h-[580px] bg-dark-950 bg-grid-pattern select-none overflow-hidden z-0">
      
      {/* Top Level Tier Axis Banner */}
      <div className="absolute top-0 left-0 right-0 z-10 h-10 bg-dark-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center px-6 overflow-x-auto gap-8 pointer-events-none">
        <div className="flex items-center gap-2 text-xs font-bold text-neon-cyan shrink-0">
          <Layers className="w-4 h-4" />
          <span>PROGRESSION TIMELINE</span>
        </div>
        <div className="flex items-center gap-12 font-mono text-[11px] font-bold text-slate-400">
          {Array.from({ length: maxLevel - minLevel + 1 }, (_, i) => minLevel + i).map(lvl => (
            <span key={lvl} className="shrink-0 px-3 py-0.5 rounded bg-dark-950 border border-slate-800 text-slate-200">
              Lvl {lvl} {lvl >= 15 ? '★ PRO' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Path Focus Mode Status Indicator */}
      {focusedNodeId && (
        <div className="absolute top-14 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-900/90 border border-amber-500/40 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-xl animate-in fade-in">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Path Tracing Mode: Highlighting Prerequisite Chain</span>
        </div>
      )}

      {/* React Flow Main Graph Viewport */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onNodeClick={handleNodeClick}
        defaultViewport={{ x: 50, y: 50, zoom: 0.75 }}
        minZoom={0.2}
        maxZoom={1.8}
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="pt-10 z-0"
      >
        <Background color="#1e293b" gap={36} size={1} />
        
        {/* Navigation Controls */}
        <Controls className="!bg-dark-900/90 !border-slate-800 !text-slate-300 !z-10" />
        
        {/* MiniMap Overview */}
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as any;
            if (data?.status === 'mastered') return '#00ff9d';
            if (data?.status === 'unlocked') return '#00f0ff';
            return '#1e293b';
          }}
          maskColor="rgba(6, 7, 10, 0.85)"
          className="!bg-dark-900/90 !border-slate-800 !z-10"
        />
      </ReactFlow>
    </div>
  );
};
