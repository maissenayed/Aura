'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BodyChart, ViewSide, BodyState, MuscleId } from 'body-muscles';
import { RotateCw, Eye, Sparkles, Activity } from 'lucide-react';
import { MUSCLE_DICTIONARY, getMuscleInfo, MuscleMetadata } from '../../data/muscleData';

interface AnatomyVisualizerProps {
  selectedMuscleId: string | null;
  onSelectMuscle: (muscleId: string | null) => void;
  filterCategory: 'All' | 'Push' | 'Pull' | 'Core' | 'Legs';
  searchQuery: string;
}

export const AnatomyVisualizer: React.FC<AnatomyVisualizerProps> = ({
  selectedMuscleId,
  onSelectMuscle,
  filterCategory,
  searchQuery,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<BodyChart | null>(null);
  
  const selectedMuscleIdRef = useRef(selectedMuscleId);
  useEffect(() => {
    selectedMuscleIdRef.current = selectedMuscleId;
  }, [selectedMuscleId]);

  const [viewSide, setViewSide] = useState<ViewSide>(ViewSide.FRONT);
  const [hoveredMuscleId, setHoveredMuscleId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute active bodyState based on selection, search, and category filters
  const computeBodyState = (): BodyState => {
    const state: BodyState = {};

    const hasSpecificFilter = filterCategory !== 'All';
    const hasSearchQuery = Boolean(searchQuery.toLowerCase().trim());

    Object.keys(MUSCLE_DICTIONARY).forEach((id) => {
      const meta = MUSCLE_DICTIONARY[id];
      let intensity = 0; // Default resting intensity (neutral dark slate)
      let selected = false;

      // Category matching
      const matchesCategory = filterCategory === 'All' || meta.category === filterCategory;

      // Search matching
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        meta.name.toLowerCase().includes(query) || 
        meta.latinName.toLowerCase().includes(query) ||
        meta.baseGroup.toLowerCase().includes(query);

      // Only boost intensity (orange highlight) when actively filtering by category or searching
      if ((hasSpecificFilter || hasSearchQuery) && matchesCategory && matchesSearch) {
        intensity = 6;
      }

      // Highlight active selection & matching base group (bright focus)
      if (selectedMuscleId) {
        const selectedMeta = getMuscleInfo(selectedMuscleId);
        if (selectedMeta && (id === selectedMuscleId || meta.baseGroup === selectedMeta.baseGroup)) {
          selected = true;
          intensity = 10;
        }
      }

      state[id] = { intensity, selected };
    });

    return state;
  };

  // Initialize & Manage BodyChart
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing instance before re-initializing for viewSide change
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const initialState = computeBodyState();

    chartInstanceRef.current = new BodyChart(containerRef.current, {
      view: viewSide,
      bodyState: initialState,
      className: 'body-chart-wrapper',
      enableTransitions: true,
      showViewLabel: false,
      onMuscleClick: (id: MuscleId) => {
        onSelectMuscle(selectedMuscleIdRef.current === id ? null : id);
      },
      onMuscleHover: (id: MuscleId | null) => {
        setHoveredMuscleId(id);
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [viewSide]);

  // Update bodyState dynamically when props change
  useEffect(() => {
    if (chartInstanceRef.current) {
      const updatedState = computeBodyState();
      chartInstanceRef.current.update({ bodyState: updatedState });
    }
  }, [selectedMuscleId, filterCategory, searchQuery]);

  const hoveredMeta: MuscleMetadata | null = getMuscleInfo(hoveredMuscleId);
  const selectedMeta: MuscleMetadata | null = getMuscleInfo(selectedMuscleId);

  return (
    <div 
      className="relative flex flex-col items-center justify-center w-full min-h-[580px] p-6 rounded-3xl bg-dark-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-hidden group"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      {/* Background Cyber Glow & Grid Effect */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-neon-cyan/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-neon-purple/10 blur-[100px] pointer-events-none" />

      {/* Top Header Deck Controls */}
      <div className="z-10 flex flex-wrap items-center justify-between w-full mb-4 px-2 gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-cyan animate-pulse" />
          <h2 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-white via-slate-200 to-neon-cyan bg-clip-text text-transparent">
            {viewSide === ViewSide.FRONT ? 'Anterior (Front) Anatomy' : 'Posterior (Back) Anatomy'}
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan font-mono font-bold">
            70+ Vector Regions
          </span>
        </div>

        {/* View Switcher Controls (FRONT / BACK) */}
        <div className="flex items-center gap-1.5 p-1 bg-dark-950/90 border border-slate-800 rounded-2xl shadow-inner">
          <button
            onClick={() => setViewSide(ViewSide.FRONT)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-200 ${
              viewSide === ViewSide.FRONT
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Anterior (Front)</span>
          </button>

          <button
            onClick={() => setViewSide(ViewSide.BACK)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-200 ${
              viewSide === ViewSide.BACK
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40 shadow-neon-purple'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Posterior (Back)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Chart Container */}
      <div className="relative z-10 w-full flex items-center justify-center my-2">
        <div 
          ref={containerRef} 
          className="w-full flex justify-center items-center select-none"
        />
      </div>

      {/* Floating HUD Tooltip when hovering over a muscle */}
      {hoveredMeta && (
        <div 
          className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full mb-3 px-4 py-2.5 rounded-2xl bg-dark-950/95 border border-neon-cyan/50 text-white shadow-neon-cyan backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${hoverPos.x + 30}px`,
            top: `${hoverPos.y + 120}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
            <h4 className="text-xs font-black text-white">{hoveredMeta.name}</h4>
          </div>
          <p className="text-[10px] text-neon-cyan font-mono italic">{hoveredMeta.latinName}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-300">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 font-semibold">{hoveredMeta.category}</span>
            <span className="text-slate-400">{hoveredMeta.region}</span>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div className="z-10 flex items-center justify-between w-full mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-neon-emerald" />
          <span>Click any muscle to open full biomechanics & exercise breakdown.</span>
        </div>

        {selectedMeta && (
          <div className="flex items-center gap-2 bg-neon-emerald/10 border border-neon-emerald/30 text-neon-emerald px-3 py-1 rounded-xl font-bold font-mono">
            <span>Selected: {selectedMeta.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
