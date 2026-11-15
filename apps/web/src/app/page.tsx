'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '../components/Header';
import { Toast, ToastStack } from '../components/protocol/Toasts';
import { FocusRequest, SkillCanvas } from '../components/skilltree/SkillCanvas';
import { SkillPanel } from '../components/skilltree/SkillPanel';
import { SkillToolbar } from '../components/skilltree/SkillToolbar';
import { SKILL_TREES, SkillTreeDef } from '../components/skilltree/skillTrees';
import { GameEvent } from '../utils/protocolEngine';
import {
  SkillTreeId,
  isSkillTreeId,
  rememberTree,
  setMasteredIds,
  useExercises,
  useMasteredIds,
  useRememberedTree,
} from '../utils/skillProgressStore';
import { SkillStatus, ancestorsOf, bandForLevel, buildGraph, statusOf, summarize } from '../utils/skillTree';

const TOAST_LIMIT = 3;
const TOAST_MS = 5200;

const reportedDroppedLinks = new Set<SkillTreeId>();

/**
 * The skill tree page. Which tree is shown comes from `?tree=` when the link
 * says so, otherwise from the last one picked on this device. Reading the URL
 * needs a Suspense boundary: without it the static shell could not be prerendered.
 */
export default function SkillTreePage() {
  return (
    <Suspense fallback={<PageShell />}>
      <SkillTreeRoute />
    </Suspense>
  );
}

const PageShell: React.FC = () => (
  <div className="h-[100dvh] flex flex-col overflow-hidden bg-dark-950 text-slate-100">
    <Header />
  </div>
);

function SkillTreeRoute() {
  const params = useSearchParams();
  const remembered = useRememberedTree();
  const fromUrl = params.get('tree');
  const treeId: SkillTreeId = isSkillTreeId(fromUrl) ? fromUrl : remembered;

  // Opening a link to a tree counts as picking it.
  useEffect(() => {
    if (isSkillTreeId(fromUrl) && fromUrl !== remembered) rememberTree(fromUrl);
  }, [fromUrl, remembered]);

  const switchTree = (next: SkillTreeId) => {
    rememberTree(next);
    const query = new URLSearchParams(window.location.search);
    if (next === 'calisthenics') query.delete('tree');
    else query.set('tree', next);
    const search = query.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
  };

  // A new tree starts from a clean view: filters, selection and path belong to the tree they were set on.
  return <SkillTreeScreen key={treeId} tree={SKILL_TREES[treeId]} onTreeChange={switchTree} />;
}

interface SkillTreeScreenProps {
  tree: SkillTreeDef;
  onTreeChange: (tree: SkillTreeId) => void;
}

function SkillTreeScreen({ tree, onTreeChange }: SkillTreeScreenProps) {
  const exercises = useExercises();
  const skills = tree.skills ?? exercises;
  const masteredIds = useMasteredIds(tree.id);
  const { noun, rules } = tree;

  const graph = useMemo(() => buildGraph(skills), [skills]);
  const mastered = useMemo(() => new Set(masteredIds), [masteredIds]);
  const summary = useMemo(() => summarize(graph, mastered, rules), [graph, mastered, rules]);

  const [lane, setLane] = useState<string>('All');
  const [bandOverride, setBandOverride] = useState<string | null>(null);
  const [status, setStatus] = useState<SkillStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pathTargetId, setPathTargetId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sequence = useRef(0);

  const firstLevel = rules.bands[0]?.min ?? 0;

  // Until the athlete picks a range, open on the levels where their next skill is.
  const bandId = bandOverride ?? bandForLevel(summary.ready[0]?.level ?? firstLevel, rules.bands).id;
  const band = rules.bands.find((entry) => entry.id === bandId) ?? rules.bands[0];

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
    () => graph.exercises.filter((exercise) => exercise.level <= tree.basicsMax && !mastered.has(exercise.id)).length,
    [graph, mastered, tree.basicsMax],
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

  /** Select a skill and bring it into view, widening the filters if they were hiding it. */
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
      if (exercise.level < band.min || exercise.level > band.max) setBandOverride(bandForLevel(exercise.level, rules.bands).id);
      setStatus('all');
    }

    setSelectedId(id);
    setSheetOpen(false);
    setFocusRequest({ id, nonce: (sequence.current += 1) });
  };

  /** Narrow the canvas to what leads to one skill, opening on the athlete's next step along it. */
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

  // Tell whoever maintains the dataset, once per tree, about links the tree had to ignore.
  useEffect(() => {
    if (graph.dropped.length > 0 && process.env.NODE_ENV !== 'production' && !reportedDroppedLinks.has(tree.id)) {
      reportedDroppedLinks.add(tree.id);
      console.info(`${tree.label} skill tree ignored ${graph.dropped.length} impossible prerequisite links:`, graph.dropped);
    }
  }, [graph, tree]);

  /* ---------------------------------------------------------------- */
  /* Progress                                                          */
  /* ---------------------------------------------------------------- */

  const toggleMastered = (id: string) => {
    const exercise = graph.byId.get(id);
    if (!exercise) return;

    if (mastered.has(id)) {
      setMasteredIds(
        tree.id,
        masteredIds.filter((other) => other !== id),
      );
      return;
    }

    // Owning a harder skill means owning what leads to it, so the steps before it come along.
    const added = [id, ...[...ancestorsOf(graph, id)].filter((other) => !mastered.has(other))];
    const next = new Set([...masteredIds, ...added]);
    const unlocked = graph.exercises.filter(
      (other) => !next.has(other.id) && statusOf(other, mastered) === 'locked' && statusOf(other, next) === 'ready',
    );
    const before = summary.rank;
    const after = summarize(graph, next, rules);
    setMasteredIds(tree.id, [...next]);

    const details = [`+${added.reduce((sum, other) => sum + (graph.byId.get(other)?.xpReward ?? 0), 0)} XP`];
    if (added.length > 1) details.push(`with the ${added.length - 1} before it`);
    if (unlocked.length > 0) {
      details.push(
        unlocked.length <= 2
          ? `unlocked ${unlocked.map((other) => other.name).join(' and ')}`
          : `unlocked ${unlocked.length} ${noun.many}`,
      );
    }

    const events: GameEvent[] = [{ kind: 'skill', title: `Mastered — ${exercise.name}`, detail: details.join(' · ') }];
    if (after.rank !== before) events.push({ kind: 'level', title: after.rank, detail: `${after.mastered} ${noun.many} mastered` });
    announce(events);
  };

  const skipBasics = () => {
    const basics = graph.exercises.filter((exercise) => exercise.level <= tree.basicsMax && !mastered.has(exercise.id));
    setMasteredIds(tree.id, [...masteredIds, ...basics.map((exercise) => exercise.id)]);
    announce([
      {
        kind: 'skill',
        title: `${tree.levelRange(firstLevel, tree.basicsMax)} marked as mastered`,
        detail: `${basics.length} ${noun.many} added to your progress`,
      },
    ]);
  };

  const reset = () => {
    setMasteredIds(tree.id, []);
    setSelectedId(null);
    setPathTargetId(null);
    setBandOverride(null);
  };

  const viewKey = pathTargetId ? `path:${pathTargetId}` : `${lane}|${bandId}|${status}`;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-dark-950 text-slate-100">
      <Header />

      <SkillToolbar
        tree={tree}
        graph={graph}
        mastered={mastered}
        lanes={summary.lanes}
        lane={lane}
        bandId={bandId}
        status={status}
        pathTarget={pathTarget}
        pathLength={pathIds ? pathIds.size - 1 : 0}
        readyCount={summary.ready.length}
        onTreeChange={onTreeChange}
        onLaneChange={setLane}
        onBandChange={setBandOverride}
        onStatusChange={setStatus}
        onExitPath={() => setPathTargetId(null)}
        onGoTo={goTo}
        onOpenProgress={() => setSheetOpen(true)}
      />

      <div className="flex-1 min-h-0 flex">
        <main className="flex-1 min-w-0 min-h-0" aria-label={`${tree.label} skill tree`}>
          <SkillCanvas
            tree={tree}
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
                  No {status === 'all' ? '' : `${status} `}
                  {noun.many} in this branch and {tree.levelWord} range.
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
          tree={tree}
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
