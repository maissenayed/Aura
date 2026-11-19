'use client';

import React, { memo, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Figure } from '../game/kit';
import { SCENE_LABEL, Scene } from '../skilltree/SkillFigure';
import type { FigureSpec } from '../skilltree/SkillFigure';
import { CATALOG, Entry, TREE_LABEL, Tree } from './catalog';
import { CODE_LABEL, Level } from './checks';
import type { FigureSource } from './sources';

export interface BrowserFilters {
  query: string;
  tree: Tree | 'all';
  scene: Scene | 'all';
  family: string;
  /** 'code:stretch' and the like: figures with that kind of check. */
  only: 'all' | 'warnings' | 'edited' | `code:${string}`;
}

export const NO_FILTERS: BrowserFilters = { query: '', tree: 'all', scene: 'all', family: '', only: 'all' };

const SELECT = 'h-8 px-2 rounded-tag bg-ink-800 border border-ink-700 text-[12.5px] text-fg min-w-0';

export const FigureBrowser: React.FC<{
  filters: BrowserFilters;
  onFilters: (filters: BrowserFilters) => void;
  selected: string;
  onSelect: (id: string) => void;
  specOf: (id: string) => FigureSpec;
  levels: Map<string, Level | null>;
  /** The kinds of check (warn or worse) each figure has. */
  codes: Map<string, Set<string>>;
  edited: Set<string>;
  sources: Record<string, FigureSource>;
}> = ({ filters, onFilters, selected, onSelect, specOf, levels, codes, edited, sources }) => {
  const byCode = useMemo(() => {
    const counts = new Map<string, number>();
    codes.forEach((set) => set.forEach((code) => counts.set(code, (counts.get(code) ?? 0) + 1)));
    return Object.keys(CODE_LABEL).filter((code) => counts.get(code)).map((code) => [code, counts.get(code)!] as const);
  }, [codes]);
  const flagged = useMemo(() => [...levels.values()].filter((level) => level === 'error' || level === 'warn').length, [levels]);
  const families = useMemo(() => {
    const counts = new Map<string, number>();
    CATALOG.forEach((entry) => {
      const family = sources[entry.id]?.family;
      if (family) counts.set(family, (counts.get(family) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [sources]);

  const list = useMemo(() => {
    const words = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return CATALOG.filter((entry) => {
      if (filters.tree !== 'all' && entry.tree !== filters.tree) return false;
      if (filters.scene !== 'all' && entry.asBuilt().scene !== filters.scene) return false;
      if (filters.family && sources[entry.id]?.family !== filters.family) return false;
      if (filters.only === 'warnings' && !(levels.get(entry.id) === 'error' || levels.get(entry.id) === 'warn')) return false;
      if (filters.only === 'edited' && !edited.has(entry.id)) return false;
      if (filters.only.startsWith('code:') && !codes.get(entry.id)?.has(filters.only.slice(5))) return false;
      const hay = `${entry.id} ${entry.name} ${sources[entry.id]?.call ?? ''}`.toLowerCase();
      return words.every((word) => hay.includes(word));
    });
  }, [filters, levels, codes, edited, sources]);

  const set = (patch: Partial<BrowserFilters>) => onFilters({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      <label className="relative block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-4" aria-hidden="true" />
        <input
          type="search"
          value={filters.query}
          onChange={(event) => set({ query: event.target.value })}
          placeholder="ex_27, front lever, dip("
          aria-label="Search figures by id, name or builder"
          className="w-full h-9 pl-8 pr-2 rounded-card bg-ink-800 border border-ink-700 text-[13px] text-fg placeholder:text-fg-5"
        />
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        <select aria-label="Tree" value={filters.tree} onChange={(event) => set({ tree: event.target.value as BrowserFilters['tree'] })} className={SELECT}>
          <option value="all">Every tree</option>
          {(Object.keys(TREE_LABEL) as Tree[]).map((tree) => (
            <option key={tree} value={tree}>
              {TREE_LABEL[tree]}
            </option>
          ))}
        </select>
        <select aria-label="Scene" value={filters.scene} onChange={(event) => set({ scene: event.target.value as BrowserFilters['scene'] })} className={SELECT}>
          <option value="all">Every scene</option>
          {(Object.keys(SCENE_LABEL) as Scene[]).map((scene) => (
            <option key={scene} value={scene}>
              {SCENE_LABEL[scene]}
            </option>
          ))}
        </select>
        <select aria-label="Family" value={filters.family} onChange={(event) => set({ family: event.target.value })} className={SELECT}>
          <option value="">Every family</option>
          {families.map(([family, count]) => (
            <option key={family} value={family}>
              {family} ({count})
            </option>
          ))}
        </select>
        <select aria-label="Show" value={filters.only} onChange={(event) => set({ only: event.target.value as BrowserFilters['only'] })} className={SELECT}>
          <option value="all">All figures</option>
          <option value="warnings">With checks ({flagged})</option>
          <option value="edited">Edited ({edited.size})</option>
          {byCode.map(([code, count]) => (
            <option key={code} value={`code:${code}`}>
              {CODE_LABEL[code]} ({count})
            </option>
          ))}
        </select>
      </div>
      <span className="text-[12px] text-fg-4">
        {list.length} of {CATALOG.length}
      </span>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-1.5 max-h-[70dvh] lg:max-h-[calc(100dvh-260px)] overflow-y-auto pr-0.5">
        {list.map((entry) => (
          <Thumb key={entry.id} entry={entry} spec={specOf(entry.id)} level={levels.get(entry.id) ?? null} edited={edited.has(entry.id)} on={entry.id === selected} onSelect={onSelect} />
        ))}
      </ul>
    </div>
  );
};

/** One figure in the list; drawn again only when its own drawing, marks or selection change. */
const Thumb = memo(function Thumb({ entry, spec, level, edited, on, onSelect }: { entry: Entry; spec: FigureSpec; level: Level | null; edited: boolean; on: boolean; onSelect: (id: string) => void }) {
  return (
    <li style={{ contentVisibility: 'auto', containIntrinsicSize: '84px 108px' }}>
      <button
        type="button"
        onClick={() => onSelect(entry.id)}
        aria-current={on ? 'true' : undefined}
        title={`${entry.name} · ${entry.id}`}
        className={`relative w-full flex flex-col items-center gap-0.5 p-1 rounded-tag cursor-pointer border ${on ? 'border-act bg-ink-800' : 'border-transparent bg-ink-900 hover:bg-ink-850'}`}
      >
        <Figure spec={spec} className="w-full aspect-square" />
        <span className="w-full truncate text-[10.5px] text-fg-3 text-center">{entry.name}</span>
        {(level === 'error' || level === 'warn') && (
          <span className={`absolute top-1 left-1 w-2 h-2 rounded-full ${level === 'error' ? 'bg-fg' : 'border border-fg-3'}`} aria-label={level === 'error' ? 'Breaks' : 'Has warnings'} />
        )}
        {edited && <span className="absolute top-1 right-1 px-1 rounded-tag bg-act text-act-deep text-[9px] font-bold">EDIT</span>}
      </button>
    </li>
  );
});
