'use client';

import React from 'react';
import { Swimlane } from '../types/exercise';
import { Search, Filter, SlidersHorizontal, Flame, Dumbbell, ShieldAlert, Target } from 'lucide-react';

interface FilterBarProps {
  selectedSwimlane: Swimlane | 'All';
  onSelectSwimlane: (swimlane: Swimlane | 'All') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  levelFilter: number;
  onLevelFilterChange: (level: number) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedSwimlane,
  onSelectSwimlane,
  searchQuery,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
}) => {
  const swimlanes: { key: Swimlane | 'All'; label: string; icon?: any }[] = [
    { key: 'All', label: 'All Branches' },
    { key: 'Push', label: 'Push', icon: Flame },
    { key: 'Pull', label: 'Pull', icon: Dumbbell },
    { key: 'Core', label: 'Core', icon: ShieldAlert },
    { key: 'Legs', label: 'Legs', icon: Target },
  ];

  return (
    <div className="w-full bg-dark-900/90 border-b border-slate-800/80 px-4 py-3 sm:px-8 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Swimlanes Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {swimlanes.map(s => {
            const Icon = s.icon;
            const isSelected = selectedSwimlane === s.key;
            return (
              <button
                key={s.key}
                onClick={() => onSelectSwimlane(s.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-neon-cyan'
                    : 'bg-dark-950/60 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Level Slider */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-dark-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-neon-cyan/50 transition"
            />
          </div>

          {/* Level Filter Slider */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-dark-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neon-emerald" />
            <span>Max Level: <strong className="text-white font-mono">{levelFilter}</strong></span>
            <input
              type="range"
              min={1}
              max={20}
              value={levelFilter}
              onChange={e => onLevelFilterChange(Number(e.target.value))}
              className="w-20 accent-neon-emerald cursor-pointer"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
