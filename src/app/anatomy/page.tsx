'use client';

import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { AnatomyVisualizer } from '../../components/anatomy/AnatomyVisualizer';
import { MuscleInspectorCard } from '../../components/anatomy/MuscleInspectorCard';
import { MuscleSearchBar } from '../../components/anatomy/MuscleSearchBar';
import { ExerciseDetailModal } from '../../components/ExerciseDetailModal';
import { getMuscleInfo } from '../../data/muscleData';
import { Swimlane, Exercise } from '../../types/exercise';
import { Flame, Activity, Sparkles, Layers } from 'lucide-react';

export default function AnatomyPage() {
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'All' | Swimlane>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedExerciseModal, setSelectedExerciseModal] = useState<Exercise | null>(null);

  const selectedMeta = getMuscleInfo(selectedMuscleId);

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-neon-cyan selection:text-dark-950">
      
      {/* GLOBAL HEADER NAVIGATION */}
      <Header />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6">
        
        {/* PAGE HERO BANNER */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-900 to-dark-850 border border-slate-800/80 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-neon-cyan/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-neon-purple/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan shadow-neon-cyan">
                  <Activity className="w-4 h-4 animate-pulse" />
                </span>
                <span className="text-xs font-black tracking-widest uppercase text-neon-cyan">
                  Biomechanical Interactive Engine
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-neon-cyan bg-clip-text text-transparent">
                HUMAN MUSCLE <span className="text-neon-cyan">ANATOMY</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                Explore 70+ anatomical muscle regions in real-time vector format. Hover over any muscle to view live HUD tooltips, click to inspect biomechanical origins and insertions, and discover target calisthenics exercises.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-dark-950/80 border border-slate-800 text-xs font-bold text-slate-300">
                <Sparkles className="w-4 h-4 text-neon-emerald" />
                <span>70+ Vector SVG Paths</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-dark-950/80 border border-slate-800 text-xs font-bold text-slate-300">
                <Layers className="w-4 h-4 text-neon-purple" />
                <span>Anterior & Posterior</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH BAR & QUICK FILTERS */}
        <MuscleSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={filterCategory}
          onCategoryChange={setFilterCategory}
          onQuickSelectGroup={(id) => setSelectedMuscleId(id)}
        />

        {/* MAIN DUAL GRID: VISUALIZER & INSPECTOR */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT / MAIN COLUMN: VECTOR VISUALIZER */}
          <div className="lg:col-span-7 xl:col-span-7 w-full">
            <AnatomyVisualizer
              selectedMuscleId={selectedMuscleId}
              onSelectMuscle={setSelectedMuscleId}
              filterCategory={filterCategory}
              searchQuery={searchQuery}
            />
          </div>

          {/* RIGHT COLUMN: MUSCLE INSPECTOR CARD */}
          <div className="lg:col-span-5 xl:col-span-5 w-full min-h-[580px]">
            <MuscleInspectorCard
              muscle={selectedMeta}
              onSelectExercise={(ex) => setSelectedExerciseModal(ex)}
            />
          </div>

        </div>

      </main>

      {/* EXERCISE DETAIL MODAL */}
      {selectedExerciseModal && (
        <ExerciseDetailModal
          exercise={selectedExerciseModal}
          isOpen={Boolean(selectedExerciseModal)}
          onClose={() => setSelectedExerciseModal(null)}
          onSelectPrerequisite={(prereq) => setSelectedExerciseModal(prereq)}
          isMastered={false}
          isUnlocked={true}
          onToggleMastered={() => {}}
        />
      )}
    </div>
  );
}
