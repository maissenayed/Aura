'use client';

import React from 'react';
import { Swimlane } from '../types/exercise';
import { 
  Search, 
  SlidersHorizontal, 
  Flame, 
  Dumbbell, 
  ShieldAlert, 
  Target, 
  Layers
} from 'lucide-react';

interface FilterBarProps {
  selectedSwimlane: Swimlane | 'All';
  onSelectSwimlane: (swimlane: Swimlane | 'All') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minLevel: number;
  maxLevel: number;
  onLevelRangeChange: (min: number, max: number) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedSwimlane,
  onSelectSwimlane,
  searchQuery,
  onSearchChange,
  minLevel,
  maxLevel,
  onLevelRangeChange,
}) => {
  const swimlanes: { 
    key: Swimlane | 'All'; 
    label: string; 
    icon?: any; 
    activeStyles: string;
    iconColor: string;
  }[] = [
    { 
      key: 'All', 
      label: 'All Branches', 
      icon: Layers,
      activeStyles: 'bg-gradient-to-r from-slate-800 to-slate-900 text-white border-slate-600 shadow-md',
      iconColor: 'text-slate-300'
    },
    { 
      key: 'Push', 
      label: 'Push Branch', 
      icon: Flame,
      activeStyles: 'bg-cyan-950/80 text-neon-cyan border-cyan-500/60 shadow-neon-cyan',
      iconColor: 'text-neon-cyan'
    },
    { 
      key: 'Pull', 
      label: 'Pull Branch', 
      icon: Dumbbell,
      activeStyles: 'bg-emerald-950/80 text-neon-emerald border-emerald-500/60 shadow-neon-emerald',
      iconColor: 'text-neon-emerald'
    },
    { 
      key: 'Core', 
      label: 'Core Branch', 
      icon: ShieldAlert,
      activeStyles: 'bg-purple-950/80 text-neon-purple border-purple-500/60 shadow-neon-purple',
      iconColor: 'text-neon-purple'
    },
    { 
      key: 'Legs', 
      label: 'Legs Branch', 
      icon: Target,
      activeStyles: 'bg-amber-950/80 text-amber-400 border-amber-500/60 shadow-neon-gold',
      iconColor: 'text-amber-400'
    },
  ];

  const levelPresets = [
    { label: 'Lvl 1 - 3 (Beginner)', min: 1, max: 3 },
    { label: 'Lvl 3 - 5 (Intermediate)', min: 3, max: 5 },
    { label: 'Lvl 5 - 10 (Advanced)', min: 5, max: 10 },
    { label: 'Lvl 10 - 16 (Pro)', min: 10, max: 16 },
    { label: 'All Tiers (1 - 16)', min: 1, max: 16 },
  ];

  return (
    <div className="w-full bg-dark-900/95 border-b border-slate-800/80 px-4 py-3 sm:px-8 backdrop-blur-xl z-30 shadow-2xl space-y-3">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* ROW 1: Branch Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/50">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mr-1 hidden md:inline">
              Skill Branch:
            </span>

            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              {swimlanes.map(s => {
                const Icon = s.icon;
                const isSelected = selectedSwimlane === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => onSelectSwimlane(s.key)}
                    className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 border flex-1 sm:flex-initial whitespace-nowrap ${
                      isSelected
                        ? s.activeStyles
                        : 'bg-dark-950/80 border-slate-800/90 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? s.iconColor : 'text-slate-500'}`} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span>Horizontal RPG Progression Canvas</span>
          </div>
        </div>

        {/* ROW 2: Level Tier Presets & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Level Tiers Selector */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-dark-950/80 p-1 rounded-2xl border border-slate-800/80 overflow-x-auto scrollbar-none w-full sm:w-auto">
              {levelPresets.map((preset, idx) => {
                const isActive = minLevel === preset.min && maxLevel === preset.max;
                return (
                  <button
                    key={idx}
                    onClick={() => onLevelRangeChange(preset.min, preset.max)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-200 ${
                      isActive 
                        ? 'bg-neon-emerald/20 text-neon-emerald border border-neon-emerald/40 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Min / Max Selectors */}
            <div className="flex items-center gap-1.5 bg-dark-950/80 border border-slate-800/80 rounded-2xl px-3 py-1 text-xs text-slate-400 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neon-cyan shrink-0" />
              <span className="font-mono text-[11px]">Lvl</span>
              <select
                value={minLevel}
                onChange={e => onLevelRangeChange(Number(e.target.value), Math.max(Number(e.target.value), maxLevel))}
                className="bg-dark-900 border border-slate-800 text-white font-mono text-xs rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-neon-cyan cursor-pointer"
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <span className="font-mono text-[11px] text-slate-500">➜</span>
              <select
                value={maxLevel}
                onChange={e => onLevelRangeChange(Math.min(minLevel, Number(e.target.value)), Number(e.target.value))}
                className="bg-dark-900 border border-slate-800 text-white font-mono text-xs rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-neon-cyan cursor-pointer"
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search exercise..."
              className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-dark-950/80 border border-slate-800/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-neon-cyan/50 transition shadow-inner"
            />
          </div>

        </div>

      </div>
    </div>
  );
};
