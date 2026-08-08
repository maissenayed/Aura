'use client';

import React from 'react';
import { Search, X, Filter, Flame, Zap, Shield, Dumbbell } from 'lucide-react';
import { Swimlane } from '@aura/types';

interface MuscleSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: 'All' | Swimlane;
  onCategoryChange: (category: 'All' | Swimlane) => void;
  onQuickSelectGroup: (baseGroup: string) => void;
}

export const MuscleSearchBar: React.FC<MuscleSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onQuickSelectGroup,
}) => {
  const categories: Array<{ label: string; value: 'All' | Swimlane; color: string; icon: React.ReactNode }> = [
    { label: 'All Regions', value: 'All', color: 'border-slate-700 bg-slate-800/40 text-slate-200', icon: <Filter className="w-3 h-3" /> },
    { label: 'Push Chain', value: 'Push', color: 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan', icon: <Zap className="w-3 h-3 text-neon-cyan" /> },
    { label: 'Pull Chain', value: 'Pull', color: 'border-neon-purple/40 bg-neon-purple/10 text-neon-purple shadow-neon-purple', icon: <Flame className="w-3 h-3 text-neon-purple" /> },
    { label: 'Core System', value: 'Core', color: 'border-neon-emerald/40 bg-neon-emerald/10 text-neon-emerald shadow-neon-emerald', icon: <Shield className="w-3 h-3 text-neon-emerald" /> },
    { label: 'Leg Power', value: 'Legs', color: 'border-neon-amber/40 bg-neon-amber/10 text-neon-amber shadow-neon-gold', icon: <Dumbbell className="w-3 h-3 text-neon-amber" /> },
  ];

  const quickGroups = [
    { name: 'Chest (Pecs)', id: 'chest-lower-left' },
    { name: 'Lats (Back)', id: 'lats-upper-left' },
    { name: 'Deltoids', id: 'shoulder-front-left' },
    { name: 'Biceps', id: 'biceps-left' },
    { name: 'Triceps', id: 'triceps-left' },
    { name: 'Abs (Core)', id: 'abs-upper-left' },
    { name: 'Quads', id: 'quads-left' },
    { name: 'Glutes', id: 'gluteus-maximus-left' },
  ];

  return (
    <div className="flex flex-col gap-3 w-full p-4 rounded-3xl bg-dark-900/90 border border-slate-800/80 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Search Input Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search muscles (e.g., Lats, Pecs, Quads, Biceps)..."
            className="w-full pl-10 pr-9 py-2 text-xs font-semibold rounded-2xl bg-dark-950/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all duration-200 shrink-0 ${
                  isSelected 
                    ? cat.color 
                    : 'border-slate-800/80 bg-dark-950/60 text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Select Muscle Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800/60 text-[10px]">
        <span className="font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Quick Focus:</span>
        {quickGroups.map((g) => (
          <button
            key={g.id}
            onClick={() => onQuickSelectGroup(g.id)}
            className="px-2.5 py-0.5 rounded-lg bg-dark-950 border border-slate-800/80 text-slate-300 hover:text-neon-cyan hover:border-neon-cyan/40 transition shrink-0 font-medium"
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>
  );
};
