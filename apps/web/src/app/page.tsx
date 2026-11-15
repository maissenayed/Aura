'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Swimlane } from '@aura/types';
import { Header } from '../components/Header';
import { Toast, ToastStack } from '../components/protocol/Toasts';
import { FocusRequest, SkillCanvas } from '../components/skilltree/SkillCanvas';
import { SkillPanel } from '../components/skilltree/SkillPanel';
import { SkillToolbar } from '../components/skilltree/SkillToolbar';
import { GameEvent } from '../utils/protocolEngine';
import { setMasteredIds, useExercises, useMasteredIds } from '../utils/skillProgressStore';
import {
  LEVEL_BANDS,
  SkillStatus,
  ancestorsOf,
  bandForLevel,
  buildGraph,
  statusOf,
  summarize,
} from '../utils/skillTree';

const TOAST_LIMIT = 3;
const TOAST_MS = 5200;

let reportedDroppedLinks = false;

export default function SkillTreePage() {
  const exercises = useExercises();
  const masteredIds = useMasteredIds();

  const graph = useMemo(() => buildGraph(exercises), [exercises]);
  const mastered = useMemo(() => new Set(masteredIds), [masteredIds]);
  const summary = useMemo(() => summarize(graph, mastered), [graph, mastered]);

  const [lane, setLane] = useState<Swimlane | 'All'>('All');
  const [bandOverride, setBandOverride] = useState<string | null>(null);
  const [status, setStatus] = useState<SkillStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pathTargetId, setPathTargetId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sequence = useRef(0);

  // Until the athlete picks a range, open on the levels where their next exercise is.
  const bandId = bandOverride ?? bandForLevel(summary.ready[0]?.level ?? 1).id;
  const band = LEVEL_BANDS.find((entry) => entry.id === bandId) ?? LEVEL_BANDS[0];

  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null;
  const pathTarget = pathTargetId ? graph.byId.get(pathTargetId) ?? null : null;

  const pathIds = useMemo(() => {
    if (!pathTarget) return null;
    const ids = ancestorsOf(graph, pathTarget.id);
    ids.add(pathTarget.id);
    return ids;
  }, [graph, pathTarget]);

  const { visible, levels } = useMemo(() => {
    if (pathIds) {
      // A path only uses some levels; drawing just those keeps it short enough to read.
      const onPath = graph.exercises.filter((exercise) => pathIds.has(exercise.id));
      return { visible: onPath, levels: [...new Set(onPath.map((exercise) => exercise.level))].sort((a, b) => a - b) };
    }
    return {
      visible: graph.exercises.filter(
        (exercise) =>
          (lane === 'All' || exercise.swimlane === lane) &&
          exercise.level >= band.min &&
          exercise.level <= band.max &&
          (status === 'all' || statusOf(exercise, mastered) === status),
      ),
      levels: Array.from({ length: band.max - band.min + 1 }, (_, index) => band.min + index),
    };
  }, [graph, pathIds, lane, band, status, mastered]);

  const basicsRemaining = useMemo(
    () => graph.exercises.filter((exercise) => exercise.level <= 3 && !mastered.has(exercise.id)).length,
    [graph, mastered],
  );

  /* ---------------------------------------------------------------- */
  /* Feedback                                                          */
  /* ---------------------------------------------------------------- */

  const dismissToast = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));

  const announce = (events: GameEvent[]) => {
    const fresh = events.map((event) => ({ ...event, id: (sequence.current += 1) }));
    setToasts((current) => [...current, ...fresh].slice(-TOAST_LIMIT));
    fresh.forEach((toast) => window.setTimeout(() => dismissToast(toast.id), TOAST_MS));
  };

  /* ---------------------------------------------------------------- */
  /* Navigation                                                        */
  /* ---------------------------------------------------------------- */

  /** Select an exercise and bring it into view, widening the filters if they were hiding it. */
  const goTo = (id: string) => {
    const exercise = graph.byId.get(id);
    if (!exercise) return;

    if (pathIds) {
      if (!pathIds.has(id)) setPathTargetId(null);
    }
    const hiddenByFilters =
      (lane !== 'All' && exercise.swimlane !== lane) ||
      exercise.level < band.min ||
      exercise.level > band.max ||
      (status !== 'all' && statusOf(exercise, mastered) !== status);

    if ((!pathIds || !pathIds.has(id)) && hiddenByFilters) {
      if (lane !== 'All' && exercise.swimlane !== lane) setLane('All');
      if (exercise.level < band.min || exercise.level > band.max) setBandOverride(bandForLevel(exercise.level).id);
      setStatus('all');
    }

    setSelectedId(id);
    setSheetOpen(false);
    setFocusRequest({ id, nonce: (sequence.current += 1) });
  };

  /** Narrow the canvas to what leads to one exercise, opening on the athlete's next step along it. */
  const togglePath = (id: string) => {
    if (pathTargetId === id) {
      setPathTargetId(null);
      setFocusRequest({ id, nonce: (sequence.current += 1) });
      return;
    }
    const leading = ancestorsOf(graph, id);
    const steps = graph.exercises
      .filter((exercise) => leading.has(exercise.id) && !mastered.has(exercise.id))
      .sort((a, b) => a.level - b.level);
    setPathTargetId(id);
    setFocusRequest({ id: steps[0]?.id ?? id, nonce: (sequence.current += 1) });
  };

  const selectOnCanvas = useCallback((id: string) => setSelectedId(id), []);
  const clearSelection = useCallback(() => setSelectedId(null), []);

  const closePanel = () => {
    setSelectedId(null);
    setSheetOpen(false);
  };

  // Escape steps back out: details first, then the sheet.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSelectedId((current) => {
        if (current === null) setSheetOpen(false);
        return null;
      });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Tell whoever maintains the dataset, once, about links the tree had to ignore.
  useEffect(() => {
    if (graph.dropped.length > 0 && process.env.NODE_ENV !== 'production' && !reportedDroppedLinks) {
      reportedDroppedLinks = true;
      console.info(`Skill tree ignored ${graph.dropped.length} impossible prerequisite links:`, graph.dropped);
    }
  }, [graph]);

  /* ---------------------------------------------------------------- */
  /* Progress                                                          */
  /* ---------------------------------------------------------------- */

  const toggleMastered = (id: string) => {
    const exercise = graph.byId.get(id);
    if (!exercise) return;

    if (mastered.has(id)) {
      setMasteredIds(masteredIds.filter((other) => other !== id));
      return;
    }

    // Owning a harder skill means owning what leads to it, so the steps before it come along.
    const added = [id, ...[...ancestorsOf(graph, id)].filter((other) => !mastered.has(other))];
    const next = new Set([...masteredIds, ...added]);
    const unlocked = graph.exercises.filter(
      (other) => !next.has(other.id) && statusOf(other, mastered) === 'locked' && statusOf(other, next) === 'ready',
    );
    const before = summary.rank;
    const after = summarize(graph, next);
    setMasteredIds([...next]);

    const details = [`+${added.reduce((sum, other) => sum + (graph.byId.get(other)?.xpReward ?? 0), 0)} XP`];
    if (added.length > 1) details.push(`with the ${added.length - 1} before it`);
    if (unlocked.length > 0) {
      details.push(
        unlocked.length <= 2
          ? `unlocked ${unlocked.map((other) => other.name).join(' and ')}`
          : `unlocked ${unlocked.length} exercises`,
      );
    }

    const events: GameEvent[] = [{ kind: 'skill', title: `Mastered — ${exercise.name}`, detail: details.join(' · ') }];
    if (after.rank !== before) events.push({ kind: 'level', title: after.rank, detail: `${after.mastered} exercises mastered` });
    announce(events);
  };

  const skipBasics = () => {
    const basics = graph.exercises.filter((exercise) => exercise.level <= 3 && !mastered.has(exercise.id));
    setMasteredIds([...masteredIds, ...basics.map((exercise) => exercise.id)]);
    announce([{ kind: 'skill', title: 'Levels 1–3 marked as mastered', detail: `${basics.length} exercises added to your progress` }]);
  };

  const reset = () => {
    setMasteredIds([]);
    setSelectedId(null);
    setPathTargetId(null);
    setBandOverride(null);
  };

  const viewKey = pathTargetId ? `path:${pathTargetId}` : `${lane}|${bandId}|${status}`;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-dark-950 text-slate-100">
      <Header />

      <SkillToolbar
        graph={graph}
        mastered={mastered}
        lanes={summary.lanes}
        lane={lane}
        bandId={bandId}
        status={status}
        pathTarget={pathTarget}
        pathLength={pathIds ? pathIds.size - 1 : 0}
        readyCount={summary.ready.length}
        onLaneChange={setLane}
        onBandChange={setBandOverride}
        onStatusChange={setStatus}
        onExitPath={() => setPathTargetId(null)}
        onGoTo={goTo}
        onOpenProgress={() => setSheetOpen(true)}
      />

      <div className="flex-1 min-h-0 flex">
        <main className="flex-1 min-w-0 min-h-0" aria-label="Skill tree">
          <SkillCanvas
            graph={graph}
            visible={visible}
            mastered={mastered}
            levels={levels}
            lanes={summary.lanes}
            selectedId={selectedId}
            focusRequest={focusRequest}
            viewKey={viewKey}
            onSelect={selectOnCanvas}
            onClearSelection={clearSelection}
            emptyState={
              <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800">
                <p className="text-sm font-bold text-white">Nothing matches these filters</p>
                <p className="mt-1 text-xs text-slate-400">
                  No {status === 'all' ? '' : `${status} `}exercises in this branch and level range.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLane('All');
                    setStatus('all');
                  }}
                  className="mt-3 h-10 px-4 rounded-xl text-xs font-bold text-neon-cyan border border-cyan-500/40 hover:bg-cyan-950/40 transition cursor-pointer"
                >
                  Clear branch and status filters
                </button>
              </div>
            }
          />
        </main>

        <SkillPanel
          graph={graph}
          mastered={mastered}
          summary={summary}
          selected={selected}
          pathTargetId={pathTargetId}
          open={selected !== null || sheetOpen}
          basicsRemaining={basicsRemaining}
          onGoTo={goTo}
          onBack={() => setSelectedId(null)}
          onClose={closePanel}
          onToggleMastered={toggleMastered}
          onTogglePath={togglePath}
          onShowReady={() => {
            setPathTargetId(null);
            setLane('All');
            setBandOverride('all');
            setStatus('ready');
            setSheetOpen(false);
          }}
          onLaneFilter={(next) => {
            setPathTargetId(null);
            setLane(next);
            setSheetOpen(false);
          }}
          onSkipBasics={skipBasics}
          onReset={reset}
        />
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
