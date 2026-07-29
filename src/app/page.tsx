'use client';

import React, { useState, useEffect } from 'react';
import { EXERCISES as DEFAULT_EXERCISES } from '../data/exercisesData';
import { getStoredExercises } from '../utils/exerciseStorage';
import { Exercise, Swimlane, UserProgress, ViewMode } from '../types/exercise';
import { Header } from '../components/Header';
import { FilterBar } from '../components/FilterBar';
import { SkillTreeCanvas } from '../components/SkillTreeCanvas';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { StatsDashboard } from '../components/StatsDashboard';

export default function Home() {
  // Local storage key for user progress
  const STORAGE_KEY = 'aura_calisthenics_skill_tree_progress_v1';

  // Exercises State
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);

  // Load exercises from local storage on mount
  useEffect(() => {
    setExercises(getStoredExercises());
  }, []);

  // State
  const [progress, setProgress] = useState<UserProgress>({
    masteredIds: ['ex_0', 'ex_4', 'ex_7', 'ex_11'], // Default beginner mastered set
    currentLevel: 3,
    totalXp: 900,
  });

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSwimlane, setSelectedSwimlane] = useState<Swimlane | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Level Range State (Default Level 1 to 3)
  const [minLevel, setMinLevel] = useState<number>(1);
  const [maxLevel, setMaxLevel] = useState<number>(3);
  
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.masteredIds)) {
          setProgress(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load progress from localStorage', e);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress to localStorage', e);
    }
  }, [progress]);

  // Open exercise detail modal
  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  // Toggle exercise mastered status
  const handleToggleMastered = (exerciseId: string) => {
    setProgress(prev => {
      const isAlreadyMastered = prev.masteredIds.includes(exerciseId);
      let updatedMasteredIds: string[];

      if (isAlreadyMastered) {
        updatedMasteredIds = prev.masteredIds.filter(id => id !== exerciseId);
      } else {
        updatedMasteredIds = [...prev.masteredIds, exerciseId];
      }

      // Calculate total XP & level
      const totalXp = updatedMasteredIds.reduce((sum, id) => {
        const ex = exercises.find(e => e.id === id);
        return sum + (ex ? ex.xpReward : 100);
      }, 0);

      const maxLevelMastered = updatedMasteredIds.reduce((max, id) => {
        const ex = exercises.find(e => e.id === id);
        return Math.max(max, ex ? ex.level : 1);
      }, 1);

      return {
        masteredIds: updatedMasteredIds,
        currentLevel: Math.max(1, maxLevelMastered),
        totalXp,
      };
    });
  };

  // Switch modal data when clicking prerequisite badge
  const handleSelectPrerequisite = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  // Reset user progress
  const handleResetProgress = () => {
    if (window.confirm('Reset all mastered exercises and XP progress?')) {
      const initial = { masteredIds: [], currentLevel: 1, totalXp: 0 };
      setProgress(initial);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Demo unlock set (Level 1-3 foundation exercises)
  const handleUnlockAllDemo = () => {
    const demoIds = exercises.filter(ex => ex.level <= 3).map(ex => ex.id);
    const uniqueIds = Array.from(new Set([...progress.masteredIds, ...demoIds]));
    
    const totalXp = uniqueIds.reduce((sum, id) => {
      const ex = exercises.find(e => e.id === id);
      return sum + (ex ? ex.xpReward : 100);
    }, 0);

    setProgress({
      masteredIds: uniqueIds,
      currentLevel: 4,
      totalXp,
    });
  };

  const handleLevelRangeChange = (min: number, max: number) => {
    setMinLevel(min);
    setMaxLevel(max);
  };

  const isCurrentMastered = selectedExercise ? progress.masteredIds.includes(selectedExercise.id) : false;
  
  const isCurrentUnlocked = selectedExercise ? (
    selectedExercise.prerequisites.length === 0 ||
    selectedExercise.prerequisites.every(id => progress.masteredIds.includes(id))
  ) : false;

  return (
    <main className="min-h-screen bg-dark-950 text-slate-100 flex flex-col selection:bg-neon-cyan selection:text-dark-950">
      
      {/* Gamified Header */}
      <Header
        progress={progress}
        onResetProgress={handleResetProgress}
        onUnlockAllDemo={handleUnlockAllDemo}
        activeView={viewMode}
        onViewChange={setViewMode}
      />

      {/* Main View Area */}
      {viewMode === 'tree' ? (
        <div className="flex-1 flex flex-col">
          {/* Filtering Bar */}
          <FilterBar
            selectedSwimlane={selectedSwimlane}
            onSelectSwimlane={setSelectedSwimlane}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            minLevel={minLevel}
            maxLevel={maxLevel}
            onLevelRangeChange={handleLevelRangeChange}
          />

          {/* Interactive RPG Pan & Zoom Skill Tree Canvas */}
          <div className="flex-1">
            <SkillTreeCanvas
              exercises={exercises}
              progress={progress}
              onSelectExercise={handleSelectExercise}
              selectedSwimlane={selectedSwimlane}
              searchQuery={searchQuery}
              minLevel={minLevel}
              maxLevel={maxLevel}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 py-8">
          <StatsDashboard progress={progress} />
        </div>
      )}

      {/* Exercise Detail Modal (shadcn Dialog replacement) */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPrerequisite={handleSelectPrerequisite}
        isMastered={isCurrentMastered}
        isUnlocked={isCurrentUnlocked}
        onToggleMastered={handleToggleMastered}
      />

    </main>
  );
}
