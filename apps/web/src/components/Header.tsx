'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Flame, 
  Shield, 
  Trophy, 
  RotateCcw, 
  Sparkles, 
  Dumbbell, 
  LayoutGrid,
  Zap,
  BarChart2,
  Activity
} from 'lucide-react';
import { UserProgress, ViewMode } from '@aura/types';
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
    rankColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40 shadow-neon-cyan';
  } else if (masteredCount >= 5) {
    rankTitle = 'Intermediate Gymnast';
    rankColor = 'text-yellow-400 border-yellow-500/40 bg-yellow-950/40';
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-dark-950/95 backdrop-blur-2xl border-b border-slate-800/80 px-4 py-2.5 sm:px-8 shadow-2xl space-y-2.5">
      <div className="max-w-7xl mx-auto space-y-2.5">
        
        {/* ROW 1: Brand & Primary Route Navigation Links */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-neon-cyan/20 via-neon-purple/20 to-transparent border border-neon-cyan/40 shadow-neon-cyan group-hover:scale-105 transition-transform duration-300">
              <Flame className="w-5 h-5 text-neon-cyan animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-neon-cyan bg-clip-text text-transparent">
                AURA <span className="text-neon-cyan">CALISTHENICS</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                RPG Master Skill Tree & Hypertrophy Protocol
              </p>
            </div>
          </Link>

          {/* Primary Route Navigation Links */}
          <nav className="flex items-center bg-dark-900/90 border border-slate-800/90 rounded-2xl p-1 shadow-inner">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-200 ${
                pathname === '/' 
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Skill Tree</span>
            </Link>

            <Link
              href="/anatomy"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-200 ${
                pathname === '/anatomy' 
                  ? 'bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/40 shadow-neon-emerald' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-neon-emerald" />
              <span>Muscle Anatomy</span>
            </Link>

            <Link
              href="/tracker"
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-200 ${
                pathname === '/tracker' 
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50 shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
              <span>14kg Protocol</span>
            </Link>

            <a
              href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-extrabold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Database</span>
            </a>
          </nav>

        </div>

        {/* ROW 2: Gamified XP & Mastery Sub-Bar + Canvas View Switchers */}
        {pathname === '/' && progress && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-dark-900/60 border border-slate-800/80 rounded-2xl px-4 py-2 shadow-inner">
            
            {/* Left Side: XP & Mastery Meter */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 shrink-0">
                <Shield className="w-4 h-4 text-neon-emerald" />
                <span className="text-xs font-black text-white">Lvl {progress.currentLevel}</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${rankColor}`}>
                  {rankTitle}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-28 sm:w-48 h-2 bg-dark-950 rounded-full overflow-hidden border border-slate-800/80 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-emerald via-neon-cyan to-neon-purple transition-all duration-500 rounded-full"
                    style={{ width: `${masteryPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-300 font-mono font-bold whitespace-nowrap">
                  {masteredCount}/{totalExercises} <span className="text-slate-500">({masteryPercentage}%)</span>
                </span>
              </div>
            </div>

            {/* Right Side: View Switcher (Tree Canvas / RPG Stats), Demo Unlock & Reset */}
            {onViewChange && (
              <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                <div className="flex items-center bg-dark-950/80 border border-slate-800/90 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => onViewChange('tree')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-lg transition-all duration-200 ${
                      activeView === 'tree' 
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Tree Canvas</span>
                  </button>

                  <button
                    onClick={() => onViewChange('stats')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-lg transition-all duration-200 ${
                      activeView === 'stats' 
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-neon-emerald" />
                    <span>RPG Stats</span>
                  </button>
                </div>

                {onUnlockAllDemo && (
                  <button
                    onClick={onUnlockAllDemo}
                    title="Unlock foundation demo set"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/50 hover:bg-purple-900/60 transition shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5 text-neon-purple animate-pulse" />
                    <span>Demo Unlock</span>
                  </button>
                )}

                {onResetProgress && (
                  <button
                    onClick={onResetProgress}
                    title="Reset progress"
                    className="flex items-center justify-center p-1.5 rounded-xl bg-dark-950 text-slate-400 border border-slate-800 hover:text-rose-400 hover:border-rose-900 transition shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </header>
  );
};
