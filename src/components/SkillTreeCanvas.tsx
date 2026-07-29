'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Exercise, Swimlane, UserProgress } from '../types/exercise';
import { ExerciseNodeCard } from './ExerciseNodeCard';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move,
  Flame,
  Dumbbell,
  ShieldAlert,
  Target,
  ChevronDown,
  ChevronRight,
  Layers,
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';

interface SkillTreeCanvasProps {
  exercises: Exercise[];
  progress: UserProgress;
  onSelectExercise: (exercise: Exercise) => void;
  selectedSwimlane: Swimlane | 'All';
  searchQuery: string;
  levelFilter: number;
}

interface ConnectionLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isUnlocked: boolean;
  isMastered: boolean;
}

export const SkillTreeCanvas: React.FC<SkillTreeCanvasProps> = ({
  exercises,
  progress,
  onSelectExercise,
  selectedSwimlane,
  searchQuery,
  levelFilter,
}) => {
  // Pan and Zoom Canvas State
  const [scale, setScale] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Collapsed Levels state (Key: `swimlane_level`, Value: boolean)
  const [collapsedLevels, setCollapsedLevels] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connections, setConnections] = useState<ConnectionLine[]>([]);

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    const matchesSwimlane = selectedSwimlane === 'All' || ex.swimlane === selectedSwimlane;
    const matchesQuery = searchQuery === '' || 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ex.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = ex.level <= levelFilter;
    return matchesSwimlane && matchesQuery && matchesLevel;
  });

  // Swimlanes metadata
  const swimlanesList: { key: Swimlane; title: string; icon: any; color: string; bgGlow: string }[] = [
    { key: 'Push', title: 'PUSH BRANCH', icon: Flame, color: 'text-neon-cyan', bgGlow: 'from-cyan-950/30' },
    { key: 'Pull', title: 'PULL BRANCH', icon: Dumbbell, color: 'text-neon-emerald', bgGlow: 'from-emerald-950/30' },
    { key: 'Core', title: 'CORE & STATICS', icon: ShieldAlert, color: 'text-neon-purple', bgGlow: 'from-purple-950/30' },
    { key: 'Legs', title: 'LEGS & LOWER', icon: Target, color: 'text-neon-amber', bgGlow: 'from-amber-950/30' },
  ];

  const activeSwimlanes = selectedSwimlane === 'All' 
    ? swimlanesList 
    : swimlanesList.filter(s => s.key === selectedSwimlane);

  // Determine if node is unlocked
  const getExerciseStatus = useCallback((ex: Exercise): 'locked' | 'unlocked' | 'mastered' => {
    if (progress.masteredIds.includes(ex.id)) return 'mastered';
    if (ex.prerequisites.length === 0) return 'unlocked';
    const allPrereqsMet = ex.prerequisites.every(id => progress.masteredIds.includes(id));
    return allPrereqsMet ? 'unlocked' : 'locked';
  }, [progress.masteredIds]);

  // Recalculate SVG connector paths
  const updateConnections = useCallback(() => {
    if (!canvasRef.current) return;
    const newConnections: ConnectionLine[] = [];
    const canvasBounds = canvasRef.current.getBoundingClientRect();

    filteredExercises.forEach(targetEx => {
      const targetNode = nodeRefs.current.get(targetEx.id);
      if (!targetNode) return;

      targetEx.prerequisites.forEach(prereqId => {
        const sourceNode = nodeRefs.current.get(prereqId);
        if (!sourceNode) return;

        const sourceBounds = sourceNode.getBoundingClientRect();
        const targetBounds = targetNode.getBoundingClientRect();

        const x1 = (sourceBounds.left + sourceBounds.width / 2 - canvasBounds.left) / scale;
        const y1 = (sourceBounds.top + sourceBounds.height / 2 - canvasBounds.top) / scale;
        const x2 = (targetBounds.left + targetBounds.width / 2 - canvasBounds.left) / scale;
        const y2 = (targetBounds.top + targetBounds.height / 2 - canvasBounds.top) / scale;

        const isSourceMastered = progress.masteredIds.includes(prereqId);
        const isTargetMastered = progress.masteredIds.includes(targetEx.id);

        newConnections.push({
          id: `${prereqId}->${targetEx.id}`,
          x1,
          y1,
          x2,
          y2,
          isUnlocked: isSourceMastered,
          isMastered: isTargetMastered,
        });
      });
    });

    setConnections(newConnections);
  }, [filteredExercises, progress.masteredIds, scale]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateConnections();
    }, 120);
    return () => clearTimeout(timer);
  }, [updateConnections, scale, pan, selectedSwimlane, searchQuery, collapsedLevels]);

  // Pan canvas handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale(prevScale => Math.min(1.5, Math.max(0.4, prevScale * zoomFactor)));
  };

  const handleZoomIn = () => setScale(prev => Math.min(1.5, prev + 0.15));
  const handleZoomOut = () => setScale(prev => Math.max(0.4, prev - 0.15));
  const handleReset = () => {
    setScale(0.85);
    setPan({ x: 40, y: 30 });
  };

  // Toggle Level Collapsed State
  const toggleLevelCollapse = (swimlaneKey: string, level: number) => {
    const key = `${swimlaneKey}_${level}`;
    setCollapsedLevels(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Collapse All Levels
  const handleCollapseAll = () => {
    const newCollapsed: Record<string, boolean> = {};
    activeSwimlanes.forEach(s => {
      const swimlaneExercises = filteredExercises.filter(ex => ex.swimlane === s.key);
      swimlaneExercises.forEach(ex => {
        newCollapsed[`${s.key}_${ex.level}`] = true;
      });
    });
    setCollapsedLevels(newCollapsed);
  };

  // Expand All Levels
  const handleExpandAll = () => {
    setCollapsedLevels({});
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[550px] bg-dark-950 bg-grid-pattern overflow-hidden select-none">
      
      {/* Floating Toolbar (Zoom, Pan, Expand/Collapse All) */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2 bg-dark-900/90 border border-slate-800 backdrop-blur-xl p-1.5 rounded-2xl shadow-2xl">
        <button
          onClick={handleExpandAll}
          title="Expand All Levels"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ChevronsDown className="w-3.5 h-3.5 text-neon-cyan" />
          <span className="hidden sm:inline">Expand All</span>
        </button>

        <button
          onClick={handleCollapseAll}
          title="Collapse All Levels"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ChevronsUp className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Collapse All</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-800 my-auto" />

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Zoom & Position"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="px-2 text-xs font-mono text-slate-400 font-bold">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Instruction Tip Overlay */}
      <div className="absolute top-4 right-6 z-30 hidden lg:flex items-center gap-2 px-3 py-1.5 bg-dark-900/80 border border-slate-800/80 backdrop-blur-md rounded-xl text-xs text-slate-400">
        <Move className="w-3.5 h-3.5 text-neon-cyan" />
        <span>Drag to pan canvas • Click tier header to collapse level</span>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        <div
          ref={canvasRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="relative min-w-[2400px] min-h-[1600px] p-12 transition-transform"
        >
          {/* SVG Connection Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <linearGradient id="gradientUnlocked" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#00ff9d" />
              </linearGradient>
              <linearGradient id="gradientMastered" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ff9d" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>

            {connections.map(conn => {
              const controlPointOffset = Math.max(40, Math.abs(conn.y2 - conn.y1) * 0.4);
              const pathData = `M ${conn.x1} ${conn.y1} C ${conn.x1} ${conn.y1 + controlPointOffset}, ${conn.x2} ${conn.y2 - controlPointOffset}, ${conn.x2} ${conn.y2}`;

              let strokeColor = '#334155';
              let strokeWidth = 2;
              let strokeDash = '6 4';
              let className = '';

              if (conn.isMastered) {
                strokeColor = 'url(#gradientMastered)';
                strokeWidth = 3.5;
                strokeDash = 'none';
                className = 'connector-line-mastered';
              } else if (conn.isUnlocked) {
                strokeColor = 'url(#gradientUnlocked)';
                strokeWidth = 2.5;
                className = 'connector-line-unlocked';
              }

              return (
                <path
                  key={conn.id}
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  className={className}
                />
              );
            })}
          </svg>

          {/* Swimlanes Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 z-20 relative">
            {activeSwimlanes.map(swimlane => {
              const SwimlaneIcon = swimlane.icon;
              const swimlaneExercises = filteredExercises.filter(ex => ex.swimlane === swimlane.key);

              // Group exercises by Level
              const levelsGrouped: Record<number, Exercise[]> = {};
              swimlaneExercises.forEach(ex => {
                const lvl = ex.level;
                if (!levelsGrouped[lvl]) levelsGrouped[lvl] = [];
                levelsGrouped[lvl].push(ex);
              });

              const sortedLevelKeys = Object.keys(levelsGrouped).map(Number).sort((a, b) => a - b);

              return (
                <div 
                  key={swimlane.key} 
                  className={`flex flex-col bg-gradient-to-b ${swimlane.bgGlow} to-transparent border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl`}
                >
                  {/* Swimlane Header Banner */}
                  <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-800">
                    <div className={`p-2.5 rounded-2xl bg-dark-900 border border-slate-800 ${swimlane.color}`}>
                      <SwimlaneIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className={`text-base font-black tracking-wider uppercase ${swimlane.color}`}>
                        {swimlane.title}
                      </h2>
                      <p className="text-xs text-slate-400 font-medium">
                        {swimlaneExercises.length} Progression Nodes
                      </p>
                    </div>
                  </div>

                  {/* Nodes list grouped by level tiers */}
                  <div className="flex flex-col gap-6">
                    {sortedLevelKeys.length === 0 ? (
                      <div className="text-xs text-slate-500 italic p-6 text-center">
                        No exercises match current filter
                      </div>
                    ) : (
                      sortedLevelKeys.map(lvl => {
                        const isCollapsed = collapsedLevels[`${swimlane.key}_${lvl}`];
                        const nodes = levelsGrouped[lvl];

                        return (
                          <div key={lvl} className="flex flex-col gap-3">
                            
                            {/* Clickable Collapsible Level Tier Header */}
                            <button
                              onClick={() => toggleLevelCollapse(swimlane.key, lvl)}
                              className="flex items-center gap-2 group p-1.5 rounded-xl hover:bg-dark-900/80 border border-transparent hover:border-slate-800 transition text-left"
                            >
                              <div className="p-1 rounded-md bg-dark-900 text-slate-400 group-hover:text-neon-cyan border border-slate-800 transition">
                                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 group-hover:text-white uppercase">
                                TIER LEVEL {lvl}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                ({nodes.length} {nodes.length === 1 ? 'Node' : 'Nodes'})
                              </span>
                              <div className="h-[1px] flex-1 bg-slate-800/60" />
                            </button>

                            {/* Level Tier Exercise Nodes */}
                            {!isCollapsed ? (
                              <div className="flex flex-wrap gap-4 animate-in fade-in duration-200">
                                {nodes.map(ex => {
                                  const status = getExerciseStatus(ex);
                                  return (
                                    <div 
                                      key={ex.id} 
                                      ref={el => {
                                        if (el) nodeRefs.current.set(ex.id, el);
                                        else nodeRefs.current.delete(ex.id);
                                      }}
                                    >
                                      <ExerciseNodeCard
                                        exercise={ex}
                                        status={status}
                                        onClick={onSelectExercise}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* Collapsed Level Summary Badge */
                              <div className="px-3 py-2 rounded-xl bg-dark-950/60 border border-slate-800/60 text-xs text-slate-500 flex items-center justify-between">
                                <span className="italic">{nodes.length} exercises collapsed</span>
                                <button
                                  onClick={() => toggleLevelCollapse(swimlane.key, lvl)}
                                  className="text-[10px] text-neon-cyan font-semibold hover:underline"
                                >
                                  Expand Tier
                                </button>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
