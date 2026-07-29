'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Shield, Trophy, RotateCcw, Sparkles, Dumbbell, LayoutGrid } from 'lucide-react';
import { UserProgress, ViewMode } from '../types/exercise';
import { EXERCISES } from '../data/exercisesData';

interface HeaderProps {
  progress?: UserProgress;
  onResetProgress?: () => void;
  onUnlockAllDemo?: () => void;
  activeView?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  progress,
  onResetProgress,
  onUnlockAllDemo,
  activeView,
  onViewChange,
}) => {
  const pathname = usePathname();
  const isTrackerRoute = pathname === '/tracker';

  const totalExercises = EXERCISES.length;
  const masteredCount = progress?.masteredIds.length || 0;
  const masteryPercentage = Math.round((masteredCount / totalExercises) * 100);

  // Calculate rank based on total mastered XP
  let rankTitle = 'Novice Athlete';
  let rankColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';

  if (masteredCount >= 60) {
    rankTitle = 'Calisthenics Titan';
    rankColor = 'text-amber-400 border-amber-500/40 bg-amber-950/40 shadow-neon-gold';
  } else if (masteredCount >= 35) {
    rankTitle = 'Static Hold Master';
    rankColor = 'text-purple-400 border-purple-500/40 bg-purple-950/40 shadow-neon-purple';
  } else if (masteredCount >= 15) {
    rankTitle = 'Advanced Practitioner';
    rankColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40';
  } else if (masteredCount >= 5) {
    rankTitle = 'Intermediate Gymnast';
    rankColor = 'text-yellow-400 border-yellow-500/40 bg-yellow-950/40';
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-dark-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Main Route Links */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/40 shadow-neon-cyan group-hover:scale-105 transition">
              <Flame className="w-6 h-6 text-neon-cyan animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-neon-cyan bg-clip-text text-transparent">
                AURA <span className="text-neon-cyan font-black">CALISTHENICS</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">RPG Skill Tree & Hypertrophy Tracker</p>
            </div>
          </Link>

          {/* Navigation Links between Skill Tree and Hypertrophy Tracker */}
          <nav className="flex items-center bg-dark-900 border border-slate-800 rounded-xl p-1">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                !isTrackerRoute 
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Skill Tree</span>
            </Link>
            <Link
              href="/tracker"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                isTrackerRoute 
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50 shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
              <span>14kg Tracker</span>
            </Link>
          </nav>
        </div>

        {/* Gamified Progress Bar (only shown on Skill Tree page) */}
        {!isTrackerRoute && progress && (
          <div className="flex items-center gap-4 w-full md:w-auto bg-dark-900/80 border border-slate-800/90 rounded-2xl px-4 py-2 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-neon-emerald" />
                  <span className="text-xs font-bold text-slate-300">Level {progress.currentLevel}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${rankColor}`}>
                    {rankTitle}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 sm:w-44 h-2 bg-dark-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-neon-emerald via-neon-cyan to-neon-purple transition-all duration-500"
                      style={{ width: `${masteryPercentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    {masteredCount}/{totalExercises} ({masteryPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls (only shown on Skill Tree page) */}
        {!isTrackerRoute && onViewChange && (
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="hidden md:flex items-center bg-dark-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => onViewChange('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === 'tree' 
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Skill Tree
              </button>
              <button
                onClick={() => onViewChange('stats')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === 'stats' 
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                RPG Stats
              </button>
            </div>

            {onUnlockAllDemo && (
              <button
                onClick={onUnlockAllDemo}
                title="Unlock beginner demo set"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/50 hover:bg-purple-900/50 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                <span className="hidden sm:inline">Demo Unlock</span>
              </button>
            )}

            {onResetProgress && (
              <button
                onClick={onResetProgress}
                title="Reset progress"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-dark-900 text-slate-400 border border-slate-800 hover:text-rose-400 hover:border-rose-900 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};
