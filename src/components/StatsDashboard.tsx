'use client';

import React from 'react';
import { UserProgress, Swimlane } from '../types/exercise';
import { EXERCISES } from '../data/exercisesData';
import { Flame, Dumbbell, ShieldAlert, Target, Trophy, Award, Zap, CheckCircle2, Crown } from 'lucide-react';

interface StatsDashboardProps {
  progress: UserProgress;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ progress }) => {
  const totalCount = EXERCISES.length;
  const masteredCount = progress.masteredIds.length;
  const totalXp = progress.totalXp;

  // Calculate swimlane mastery counts
  const getSwimlaneStats = (swimlane: Swimlane) => {
    const total = EXERCISES.filter(ex => ex.swimlane === swimlane).length;
    const mastered = EXERCISES.filter(ex => ex.swimlane === swimlane && progress.masteredIds.includes(ex.id)).length;
    const percent = Math.round((mastered / Math.max(1, total)) * 100);
    return { total, mastered, percent };
  };

  const pushStats = getSwimlaneStats('Push');
  const pullStats = getSwimlaneStats('Pull');
  const coreStats = getSwimlaneStats('Core');
  const legsStats = getSwimlaneStats('Legs');

  const proHoldsMastered = EXERCISES.filter(ex => ex.proStatus && progress.masteredIds.includes(ex.id)).length;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Trophy className="w-7 h-7 text-neon-gold" />
          <span>ATHLETE RPG SKILL STATS</span>
        </h2>
        <p className="text-sm text-slate-400 font-medium">
          Comprehensive breakdown of strength mastery across all 4 bodyweight movement branches
        </p>
      </div>

      {/* Main Stats Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Strength Score */}
        <div className="p-6 rounded-3xl bg-dark-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-neon-cyan/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Strength Score</span>
            <Zap className="w-5 h-5 text-neon-cyan" />
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {totalXp.toLocaleString()} <span className="text-xs text-neon-cyan font-bold">XP</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Earned through skill mastery</p>
        </div>

        {/* Mastered Movements */}
        <div className="p-6 rounded-3xl bg-dark-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-neon-emerald/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mastered Movements</span>
            <CheckCircle2 className="w-5 h-5 text-neon-emerald" />
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {masteredCount} <span className="text-xs text-slate-400 font-normal">/ {totalCount}</span>
          </div>
          <p className="text-xs text-emerald-400 mt-2 font-semibold">
            {Math.round((masteredCount / totalCount) * 100)}% Roadmap Complete
          </p>
        </div>

        {/* Pro Static Holds */}
        <div className="p-6 rounded-3xl bg-dark-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-neon-purple/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pro Static Holds</span>
            <Crown className="w-5 h-5 text-neon-purple" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-300 tracking-tight">
            {proHoldsMastered} <span className="text-xs text-slate-400 font-normal">Holds</span>
          </div>
          <p className="text-xs text-purple-400 mt-2 font-semibold">Level 15+ Elite Status</p>
        </div>

        {/* Current Athlete Rank */}
        <div className="p-6 rounded-3xl bg-dark-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-neon-gold/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Rank</span>
            <Award className="w-5 h-5 text-neon-gold" />
          </div>
          <div className="text-xl font-extrabold text-neon-gold tracking-tight">
            {masteredCount >= 60 ? 'TITAN' : masteredCount >= 35 ? 'STATIC MASTER' : masteredCount >= 15 ? 'ADVANCED' : 'NOVICE'}
          </div>
          <p className="text-xs text-slate-400 mt-2">Level {progress.currentLevel} Calisthenics Practitioner</p>
        </div>

      </div>

      {/* 4 Swimlanes Breakdown Bars */}
      <div className="p-8 rounded-3xl bg-dark-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6">
        <h3 className="text-lg font-bold tracking-tight text-white">Branch Progress Breakdown</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Push */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2 text-neon-cyan">
                <Flame className="w-4 h-4" /> PUSH BRANCH
              </span>
              <span className="text-slate-300 font-mono">{pushStats.mastered} / {pushStats.total} ({pushStats.percent}%)</span>
            </div>
            <div className="h-4 w-full bg-dark-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-neon-cyan transition-all duration-500" style={{ width: `${pushStats.percent}%` }} />
            </div>
          </div>

          {/* Pull */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2 text-neon-emerald">
                <Dumbbell className="w-4 h-4" /> PULL BRANCH
              </span>
              <span className="text-slate-300 font-mono">{pullStats.mastered} / {pullStats.total} ({pullStats.percent}%)</span>
            </div>
            <div className="h-4 w-full bg-dark-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-neon-emerald transition-all duration-500" style={{ width: `${pullStats.percent}%` }} />
            </div>
          </div>

          {/* Core */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2 text-neon-purple">
                <ShieldAlert className="w-4 h-4" /> CORE & STATICS
              </span>
              <span className="text-slate-300 font-mono">{coreStats.mastered} / {coreStats.total} ({coreStats.percent}%)</span>
            </div>
            <div className="h-4 w-full bg-dark-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-neon-purple transition-all duration-500" style={{ width: `${coreStats.percent}%` }} />
            </div>
          </div>

          {/* Legs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2 text-neon-amber">
                <Target className="w-4 h-4" /> LEGS & LOWER
              </span>
              <span className="text-slate-300 font-mono">{legsStats.mastered} / {legsStats.total} ({legsStats.percent}%)</span>
            </div>
            <div className="h-4 w-full bg-dark-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-600 to-neon-amber transition-all duration-500" style={{ width: `${legsStats.percent}%` }} />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
