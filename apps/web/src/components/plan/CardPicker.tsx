'use client';

import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronRight, Plus, Search, X } from 'lucide-react';
import { Figure, NodeState } from '../game/kit';
import { CheckIcon } from '../game/icons';
import type { FigureSpec } from '../skilltree/SkillFigure';

/**
 * The Forge's picker: every choice is a card with its drawing, name, level
 * and what it trains. A field shows the current choice; tapping it opens a
 * sheet (from the bottom on a phone, a drawer on the right on desktop) with
 * search, scope chips, grouping by line or level, and a strip that jumps
 * down long lists. One tap picks and closes.
 */

export interface PickOption {
  id: string;
  name: string;
  figure: FigureSpec;
  /** How the drawing is tinted: chalk, gold once earned, crimson for a boss. */
  tone?: Extract<NodeState, 'ready' | 'mastered' | 'boss' | 'slain'>;
  /** The lead on the second line: "L8", "V4", "Boss 2". */
  lead?: string;
  leadTone?: 'boss' | 'earned';
  /** What follows the lead when grouped by line (defaults to the line). */
  meta?: string;
  /** The third line: what it trains, or what a boss asks for. */
  sub?: string;
  /** Its group when grouped by line. */
  line?: string;
  /** Where that group sits; groups with the same rank go alphabetically. */
  lineRank?: number;
  /** Its group when grouped by level, and the group's order. */
  level?: { label: string; rank: number };
  /** Bottom right, quiet: "10 floors", "5 hits". */
  aside?: string;
  /** Bottom right as a small tag: what it logs ("kg", "reps"). */
  unit?: string;
  tag?: { label: string; tone: 'earned' | 'muted' };
  /** Shown, dimmed, but not pickable (already tracked). */
  disabled?: boolean;
  /** More words search finds it by. */
  keywords?: string;
}

export interface ScopeRow {
  label: string;
  value: string;
  options: { id: string; label: string; count?: number }[];
  onChange: (id: string) => void;
}

export type GroupMode = 'line' | 'level';

const NOUN = { one: 'option', many: 'options' };
const MATCH_NOUN = { one: 'match', many: 'matches' };

/** Lists this short skip the search and the grouping. */
const SHORT_LIST = 12;

/* ------------------------------------------------------------------ */
/* The card                                                            */
/* ------------------------------------------------------------------ */

const FigureBox: React.FC<{ option: PickOption; size?: 'md' | 'sm' }> = ({ option, size = 'md' }) => {
  const box = option.tone === 'boss' ? 'bg-boss-deep' : option.tone === 'slain' || option.tone === 'mastered' ? 'bg-earned-deep' : 'bg-ink-950';
  return (
    <span className={`${size === 'md' ? 'w-14 h-14' : 'w-10 h-10'} shrink-0 rounded-tag flex items-center justify-center ${box}`} aria-hidden>
      <Figure spec={option.figure} state={option.tone ?? 'ready'} className={size === 'md' ? 'w-[52px] h-[52px]' : 'w-9 h-9'} />
    </span>
  );
};

const LEAD_TONE = { boss: 'text-boss-soft', earned: 'text-earned' } as const;

/** Name, level and line, what it trains: the three lines every card reads the same way. */
const CardText: React.FC<{ option: PickOption; mode?: GroupMode }> = ({ option, mode = 'line' }) => {
  const after = mode === 'level' ? (option.line ?? option.meta) : (option.meta ?? option.line);
  const earned = option.tone === 'mastered' || option.tone === 'slain';
  return (
    <span className="flex-1 min-w-0 flex flex-col gap-0.5">
      <span className={`text-[14.5px] font-semibold leading-snug truncate ${earned ? 'text-earned-soft' : 'text-fg'}`}>{option.name}</span>
      {(option.lead || after) && (
        <span className="text-[12px] text-fg-4 truncate">
          {option.lead && <span className={`num font-bold text-[13px] ${option.leadTone ? LEAD_TONE[option.leadTone] : 'text-fg-2'}`}>{option.lead}</span>}
          {option.lead && after && ' · '}
          {after}
        </span>
      )}
      {option.sub && <span className="text-[12px] text-fg-4 truncate">{option.sub}</span>}
    </span>
  );
};

const Tag: React.FC<{ tag: NonNullable<PickOption['tag']> }> = ({ tag }) => (
  <span className={`flex items-center gap-1 eyebrow ${tag.tone === 'earned' ? 'text-earned' : 'text-fg-4'}`}>
    {tag.tone === 'earned' && <CheckIcon className="w-3 h-3" strokeWidth={3} />}
    {tag.label}
  </span>
);

/* ------------------------------------------------------------------ */
/* The field                                                           */
/* ------------------------------------------------------------------ */

/** The closed picker: the current choice as a card, or a dashed "pick" card when nothing is chosen yet. */
export const CardField: React.FC<{
  label: string;
  hideLabel?: boolean;
  hint?: string;
  option?: PickOption;
  /** For an add field: what tapping it does, and a line under it. */
  placeholder: string;
  placeholderNote?: string;
  onOpen: () => void;
  disabled?: boolean;
}> = ({ label, hideLabel, hint, option, placeholder, placeholderNote, onOpen, disabled }) => {
  const id = useId();
  return (
    <div className="min-w-0">
      <span className={hideLabel ? 'sr-only' : 'block mb-1.5 eyebrow text-fg-4'}>
        {label}
      </span>
      {option ? (
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-label={`${label}: ${option.name}. Change`}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="w-full flex items-center gap-3 p-2 rounded-card bg-ink-900 border border-ink-600 text-left hover:bg-ink-850 focus-visible:border-act outline-none transition active:scale-[.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FigureBox option={option} />
          <CardText option={option} />
          <span className="flex items-center gap-0.5 pr-1 eyebrow text-fg-3" aria-hidden>
            Change
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.4} />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled}
          aria-haspopup="dialog"
          className="w-full flex items-center gap-3 p-2 rounded-card border-[1.5px] border-dashed border-ink-600 text-left hover:bg-ink-900 hover:border-ink-500 transition active:scale-[.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="w-14 h-14 shrink-0 rounded-tag border-[1.5px] border-dashed border-ink-600 flex items-center justify-center text-fg-3" aria-hidden>
            <Plus className="w-5 h-5" strokeWidth={2.4} />
          </span>
          <span className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold text-fg-2">{placeholder}</span>
            {placeholderNote && <span className="text-[12px] text-fg-5">{placeholderNote}</span>}
          </span>
        </button>
      )}
      {hint && (
        <span id={`${id}-hint`} className="block mt-1 text-[12px] text-fg-4 leading-snug">
          {hint}
        </span>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Drawings drawn once they scroll near                                */
/* ------------------------------------------------------------------ */

type Watch = (element: Element, onSeen: () => void) => () => void;
const WatchContext = createContext<Watch | null>(null);

/** A card in a long list draws its figure only once it comes near the view: 600 drawings at once are slow on a phone. */
const LazyFigureBox: React.FC<{ option: PickOption }> = ({ option }) => {
  const watch = useContext(WatchContext);
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen || !ref.current) return;
    if (!watch) {
      const frame = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(frame);
    }
    return watch(ref.current, () => setSeen(true));
  }, [watch, seen]);

  if (seen) return <FigureBox option={option} />;
  return <span ref={ref} className="w-14 h-14 shrink-0 rounded-tag bg-ink-950" aria-hidden />;
};

/* ------------------------------------------------------------------ */
/* The sheet                                                           */
/* ------------------------------------------------------------------ */

interface Group {
  key: string;
  label: string;
  /** "8 skills · L3–L14" */
  detail: string;
  options: PickOption[];
}

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);
const haystack = (option: PickOption) =>
  [option.name, option.line, option.meta, option.sub, option.lead, option.level?.label, option.keywords].filter(Boolean).join(' ').toLowerCase();

function groupsOf(options: PickOption[], mode: GroupMode | null, noun: { one: string; many: string }): Group[] {
  if (!mode) return [{ key: 'all', label: '', detail: '', options }];
  const map = new Map<string, { label: string; rank: number; options: PickOption[] }>();
  for (const option of options) {
    const label = mode === 'level' ? (option.level?.label ?? 'No level') : (option.line ?? 'Other');
    const rank = mode === 'level' ? (option.level?.rank ?? Number.MAX_SAFE_INTEGER) : (option.lineRank ?? 0);
    const entry = map.get(label) ?? { label, rank, options: [] };
    entry.options.push(option);
    map.set(label, entry);
  }
  return [...map.values()]
    .sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label))
    .map((entry) => {
      // Easiest first inside a group; the sort is stable, so equal levels keep their order.
      entry.options.sort((a, b) => (a.level?.rank ?? Number.MAX_SAFE_INTEGER) - (b.level?.rank ?? Number.MAX_SAFE_INTEGER));
      const levels = entry.options.map((option) => option.level).filter((level): level is NonNullable<PickOption['level']> => Boolean(level));
      const low = levels.reduce<PickOption['level']>((min, level) => (!min || level.rank < min.rank ? level : min), undefined);
      const high = levels.reduce<PickOption['level']>((max, level) => (!max || level.rank > max.rank ? level : max), undefined);
      const tag = (option?: PickOption) => option?.lead;
      const lowTag = tag(entry.options.find((option) => option.level === low));
      const highTag = tag(entry.options.find((option) => option.level === high));
      const count = `${entry.options.length} ${entry.options.length === 1 ? noun.one : noun.many}`;
      const range = mode === 'line' && lowTag && highTag ? (lowTag === highTag ? lowTag : `${lowTag}–${highTag}`) : '';
      return { key: entry.label, label: entry.label, detail: range ? `${count} · ${range}` : count, options: entry.options };
    });
}

export interface PickerSheetProps {
  eyebrow?: string;
  title: string;
  /** A line under the title. */
  note?: string;
  /** What is listed in the current scope. */
  options: PickOption[];
  /** What a search looks through; defaults to `options`. Lets a search reach past the scope chips. */
  searchPool?: PickOption[];
  value?: string;
  scopes?: ScopeRow[];
  /** How the list can be grouped; the first is the default. Empty: one plain list. */
  groupModes?: GroupMode[];
  /** "push skills", for "Search 173 push skills". */
  noun?: { one: string; many: string };
  /** How far a search reaches past the scope chips: "across every category". */
  searchScope?: string;
  /** What the whole search pool is called: "skills", "exercises". */
  poolNoun?: string;
  onPick: (option: PickOption) => void;
  onClose: () => void;
}

export const PickerSheet: React.FC<PickerSheetProps> = ({
  eyebrow,
  title,
  note,
  options,
  searchPool,
  value,
  scopes = [],
  groupModes = ['line', 'level'],
  noun = NOUN,
  searchScope,
  poolNoun = 'options',
  onPick,
  onClose,
}) => {
  const titleId = useId();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<GroupMode | null>(groupModes[0] ?? null);
  const [active, setActive] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const anchors = useRef(new Map<string, HTMLElement>());
  const chips = useRef(new Map<string, HTMLElement>());
  const chosenRef = useRef<HTMLLIElement>(null);

  const pool = searchPool ?? options;
  const searchable = pool.length > SHORT_LIST;
  const searching = query.trim().length > 0;
  const shown = useMemo(() => {
    const needles = words(query);
    if (!needles.length) return options;
    // The phrase in a name or line first ("front lever"); every word anywhere only when nothing has the phrase.
    const phrase = needles.join(' ');
    const named = pool.filter((option) => [option.name, option.line, option.meta].join(' ').toLowerCase().includes(phrase));
    if (named.length) return named;
    return pool.filter((option) => {
      const text = haystack(option);
      return needles.every((needle) => text.includes(needle));
    });
  }, [options, pool, query]);
  const grouped = options.length > SHORT_LIST || searching;
  const groups = useMemo(() => groupsOf(shown, grouped ? mode : null, searching ? MATCH_NOUN : noun), [shown, grouped, mode, noun, searching]);
  const jumpable = grouped && groups.length > 1;
  const current = active && groups.some((group) => group.key === active) ? active : groups[0]?.key;

  // Focus lands on Close, not the search box: on a phone that would throw the keyboard over the list.
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Opens at the current choice.
  useEffect(() => {
    const list = listRef.current;
    const chosen = chosenRef.current;
    if (list && chosen) list.scrollTop = Math.max(0, chosen.offsetTop - list.clientHeight / 2 + chosen.offsetHeight / 2);
  }, []);

  // The jump strip keeps the group being read in view.
  useEffect(() => {
    const strip = stripRef.current;
    const chip = current ? chips.current.get(current) : undefined;
    if (strip && chip) strip.scrollTo({ left: Math.max(0, chip.offsetLeft - 16), behavior: 'smooth' });
  }, [current]);

  // One observer for the whole list: each card draws its figure once it is near.
  const observer = useRef<IntersectionObserver | null>(null);
  const seen = useRef(new Map<Element, () => void>());
  const watch = useCallback<Watch>((element, onSeen) => {
    if (typeof IntersectionObserver === 'undefined') {
      onSeen();
      return () => {};
    }
    if (!observer.current) {
      observer.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            seen.current.get(entry.target)?.();
            seen.current.delete(entry.target);
            observer.current?.unobserve(entry.target);
          }
        },
        { root: listRef.current, rootMargin: '400px 0px' },
      );
    }
    seen.current.set(element, onSeen);
    observer.current.observe(element);
    return () => {
      seen.current.delete(element);
      observer.current?.unobserve(element);
    };
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);

  const frame = useRef(0);
  const onScroll = () => {
    if (!jumpable || frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const list = listRef.current;
      if (!list) return;
      let reading = groups[0]?.key ?? null;
      for (const group of groups) {
        const anchor = anchors.current.get(group.key);
        if (anchor && anchor.offsetTop <= list.scrollTop + 4) reading = group.key;
      }
      setActive(reading);
    });
  };

  const jumpTo = (key: string) => {
    const list = listRef.current;
    const anchor = anchors.current.get(key);
    // Straight there: a smooth scroll past a few hundred cards takes seconds on a phone.
    if (list && anchor) list.scrollTop = anchor.offsetTop;
    setActive(key);
  };

  const count = options.length;

  return (
    <>
      <div className="fixed inset-0 z-[45] bg-[var(--scrim)] anim-fade" onClick={onClose} aria-hidden />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed z-50 inset-x-0 bottom-0 h-[92dvh] lg:inset-x-auto lg:right-0 lg:top-0 lg:h-auto lg:w-[440px] flex flex-col rounded-t-card lg:rounded-none border-t lg:border-t-0 lg:border-l border-ink-700 bg-ink-900 lift-shadow anim-sheet"
      >
        <div className="lg:hidden flex justify-center pt-2.5" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-ink-600" />
        </div>

        <div className="px-4 pt-2 lg:pt-5 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              {eyebrow && <span className="eyebrow text-fg-4">{eyebrow}</span>}
              <h2 id={titleId} className="font-display font-extrabold uppercase text-[28px] leading-none text-fg">
                {title}
              </h2>
              {note && <p className="text-[12px] text-fg-5">{note}</p>}
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-11 h-11 shrink-0 rounded-card border border-ink-600 text-fg-2 hover:bg-ink-850 flex items-center justify-center transition active:scale-[.97] cursor-pointer"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>

          {!searching &&
            scopes.map((scope) => (
              <div
                key={scope.label}
                role="radiogroup"
                aria-label={scope.label}
                className={scope.options.length <= 4 ? 'grid gap-1.5' : 'flex gap-1.5 overflow-x-auto no-scrollbar -mr-4 pr-4'}
                style={scope.options.length <= 4 ? { gridTemplateColumns: `repeat(${scope.options.length}, minmax(0, 1fr))` } : undefined}
              >
                {scope.options.map((option) => {
                  const on = option.id === scope.value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        scope.onChange(option.id);
                        setActive(null);
                        listRef.current?.scrollTo({ top: 0 });
                      }}
                      className={`h-9 shrink-0 px-2 rounded-card border-[1.5px] text-[14px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition active:scale-[.97] cursor-pointer ${
                        on ? 'bg-ink-800 border-act text-fg' : 'bg-ink-850 border-transparent text-fg-3 hover:bg-ink-800 hover:text-fg'
                      }`}
                    >
                      {option.label}
                      {option.count !== undefined && <span className={`num font-bold text-[13px] ${on ? 'text-fg-3' : 'text-fg-5'}`}>{option.count}</span>}
                    </button>
                  );
                })}
              </div>
            ))}

          {(searchable || groupModes.length > 1) && (
            <div className="flex gap-1.5">
              {searchable && (
                <label className="flex-1 min-w-0 h-11 flex items-center gap-2 pl-3 pr-1.5 rounded-card bg-ink-950 border border-ink-700 focus-within:border-act transition-colors">
                  <Search className="w-4 h-4 text-fg-5 shrink-0" />
                  <span className="sr-only">Search</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActive(null);
                      listRef.current?.scrollTo({ top: 0 });
                    }}
                    placeholder={searchScope && pool !== options ? `Search all ${pool.length} ${poolNoun}` : `Search ${count} ${count === 1 ? noun.one : noun.many}`}
                    className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-fg placeholder:text-fg-5 [&::-webkit-search-cancel-button]:hidden"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="w-8 h-8 shrink-0 rounded-tag bg-ink-800 text-fg-2 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.4} />
                    </button>
                  )}
                </label>
              )}
              {groupModes.length > 1 && grouped && (
                <div role="radiogroup" aria-label="Group by" className="flex p-[3px] gap-[3px] rounded-card bg-ink-950 border border-ink-700 shrink-0">
                  {groupModes.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      role="radio"
                      aria-checked={mode === entry}
                      onClick={() => {
                        setMode(entry);
                        setActive(null);
                        listRef.current?.scrollTo({ top: 0 });
                      }}
                      className={`w-[54px] rounded-[7px] text-[13px] font-semibold capitalize transition cursor-pointer ${
                        mode === entry ? 'bg-ink-700 text-fg' : 'text-fg-4 hover:text-fg'
                      }`}
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {searching && (
            <p role="status" className="text-[12px] text-fg-4">
              {shown.length === 0 ? 'No matches' : `${shown.length} ${shown.length === 1 ? 'match' : 'matches'}`}
              {searchScope ? ` ${searchScope}` : ''}
            </p>
          )}

          {jumpable && (
            <nav aria-label={`Jump to a ${mode}`} ref={stripRef} className="flex gap-1.5 overflow-x-auto no-scrollbar -mr-4 pr-4 pb-0.5">
              {groups.map((group) => {
                const on = group.key === current;
                return (
                  <button
                    key={group.key}
                    ref={(element) => {
                      if (element) chips.current.set(group.key, element);
                      else chips.current.delete(group.key);
                    }}
                    type="button"
                    onClick={() => jumpTo(group.key)}
                    aria-current={on ? 'true' : undefined}
                    className={`h-8 shrink-0 px-2.5 rounded-tag flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap transition active:scale-[.97] cursor-pointer ${
                      on ? 'bg-act text-act-deep' : 'bg-ink-850 text-fg-3 hover:bg-ink-800 hover:text-fg'
                    }`}
                  >
                    {group.label}
                    <span className={`num font-bold ${on ? 'text-ink-600' : 'text-fg-5'}`}>{group.options.length}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        <div
          ref={listRef}
          onScroll={onScroll}
          className="relative flex-1 min-h-0 mt-2.5 overflow-y-auto overscroll-contain border-t border-ink-700 pb-[calc(16px+env(safe-area-inset-bottom))]"
        >
          <WatchContext.Provider value={watch}>
            {shown.length === 0 && (
              <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
                <p className="text-[14px] font-semibold text-fg-2">Nothing matches “{query.trim()}”.</p>
                <p className="text-[12px] text-fg-4">Search by name, line or what it trains.</p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-1 h-10 px-4 rounded-card border border-ink-600 text-[13px] font-semibold text-fg hover:bg-ink-850 cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            )}
            {groups.map((group) => (
              <section key={group.key} aria-label={group.label || undefined}>
                <span
                  ref={(element) => {
                    if (element) anchors.current.set(group.key, element);
                    else anchors.current.delete(group.key);
                  }}
                  className="block h-0"
                  aria-hidden
                />
                {group.label && (
                  <div className="sticky top-0 z-[1] px-4 pt-2.5 pb-1.5 flex items-baseline gap-2 bg-ink-900">
                    <h3 className="flex-1 min-w-0 truncate eyebrow text-fg-2">{group.label}</h3>
                    <span className="num font-bold text-[13px] text-fg-5 shrink-0">{group.detail}</span>
                  </div>
                )}
                <ul className={`px-4 flex flex-col gap-1.5 ${group.label ? '' : 'pt-2.5'}`}>
                  {group.options.map((option) => {
                    const chosen = option.id === value;
                    return (
                      <li key={option.id} ref={chosen ? chosenRef : undefined} className="list-none">
                        <button
                          type="button"
                          disabled={option.disabled}
                          aria-pressed={chosen}
                          onClick={() => onPick(option)}
                          className={`w-full flex items-center gap-3 p-2 rounded-card border-[1.5px] text-left transition active:scale-[.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 ${
                            chosen ? 'bg-ink-800 border-act' : 'bg-ink-850 border-transparent hover:bg-ink-800'
                          }`}
                        >
                          <LazyFigureBox option={option} />
                          <CardText option={option} mode={grouped ? (mode ?? 'line') : 'line'} />
                          <span className="shrink-0 self-stretch flex flex-col items-end justify-between py-0.5 pr-0.5">
                            {chosen ? (
                              <span className="h-[22px] px-[7px] rounded-tag bg-act text-act-deep eyebrow flex items-center">Chosen</span>
                            ) : option.tag ? (
                              <Tag tag={option.tag} />
                            ) : (
                              <span />
                            )}
                            {option.unit ? (
                              <span className="h-[22px] px-[7px] rounded-tag bg-ink-800 text-fg-2 num font-bold text-[13px] flex items-center">{option.unit}</span>
                            ) : option.aside ? (
                              <span className="num font-bold text-[13px] text-fg-5">{option.aside}</span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </WatchContext.Provider>
        </div>
      </section>
    </>
  );
};

/** A field and its sheet, for a list that needs no scope of its own (the plan's bosses, towers or lifts). */
export const CardPicker: React.FC<
  Omit<PickerSheetProps, 'onClose' | 'onPick'> & {
    label: string;
    hideLabel?: boolean;
    hint?: string;
    placeholder?: string;
    placeholderNote?: string;
    /** The current choice when it is not among `options`. */
    selected?: PickOption;
    onPick: (id: string) => void;
  }
> = ({ label, hideLabel, hint, placeholder = 'Choose…', placeholderNote, selected, onPick, ...sheet }) => {
  const [open, setOpen] = useState(false);
  const option = selected ?? sheet.options.find((entry) => entry.id === sheet.value);
  return (
    <>
      <CardField label={label} hideLabel={hideLabel} hint={hint} option={option} placeholder={placeholder} placeholderNote={placeholderNote} onOpen={() => setOpen(true)} />
      {open && (
        <PickerSheet
          {...sheet}
          onPick={(picked) => {
            setOpen(false);
            onPick(picked.id);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};
