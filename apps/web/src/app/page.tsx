'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '../components/game/AppShell';
import { useGame } from '../components/game/GameProvider';
import { ClimbBoard, FocusRequest, linesOf } from '../components/skilltree/ClimbBoard';
import { SkillPanel } from '../components/skilltree/SkillPanel';
import { SKILL_TREES, SkillTreeDef } from '../components/skilltree/skillTrees';
import { TreeBar } from '../components/skilltree/TreeBar';
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
import { ancestorsOf, buildGraph, statusOf, summarize } from '../utils/skillTree';

const reportedDroppedLinks = new Set<SkillTreeId>();

/**
 * The skill tree page. Which tree is shown comes from `?tree=` when the link
 * says so, otherwise from the last one picked on this device; `?skill=` opens
 * one skill. Reading the URL needs a Suspense boundary: without it the static
 * shell could not be prerendered.
 */
export default function SkillTreePage() {
  return (
    <Suspense fallback={<AppShell>{null}</AppShell>}>
      <SkillTreeRoute />
    </Suspense>
  );
}

function SkillTreeRoute() {
  const params = useSearchParams();
  const remembered = useRememberedTree();
  const fromUrl = params.get('tree');
  const treeId: SkillTreeId = isSkillTreeId(fromUrl) ? fromUrl : remembered;
  const skillFromUrl = params.get('skill');

  // Opening a link to a tree counts as picking it.
  useEffect(() => {
    if (isSkillTreeId(fromUrl) && fromUrl !== remembered) rememberTree(fromUrl);
  }, [fromUrl, remembered]);

  const switchTree = (next: SkillTreeId) => {
    rememberTree(next);
    const query = new URLSearchParams(window.location.search);
    query.delete('skill');
    if (next === 'calisthenics') query.delete('tree');
    else query.set('tree', next);
    const search = query.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
  };

  // A new tree starts from a clean view: lane, selection and path belong to the tree they were set on.
  return (
    <AppShell className="h-dvh lg:h-dvh overflow-hidden">
      <SkillTreeScreen key={treeId} tree={SKILL_TREES[treeId]} initialSkillId={skillFromUrl} onTreeChange={switchTree} />
    </AppShell>
  );
}

interface SkillTreeScreenProps {
  tree: SkillTreeDef;
  initialSkillId: string | null;
  onTreeChange: (tree: SkillTreeId) => void;
}

function SkillTreeScreen({ tree, initialSkillId, onTreeChange }: SkillTreeScreenProps) {
  const { announce } = useGame();
  const exercises = useExercises();
  const skills = tree.skills ?? exercises;
  const masteredIds = useMasteredIds(tree.id);
  const { noun, rules } = tree;

  const graph = useMemo(() => buildGraph(skills), [skills]);
  const mastered = useMemo(() => new Set(masteredIds), [masteredIds]);
  const summary = useMemo(() => summarize(graph, mastered, rules), [graph, mastered, rules]);

  const initial = initialSkillId ? graph.byId.get(initialSkillId) : undefined;
  const [lane, setLane] = useState<string>(
    () => initial?.swimlane ?? summary.lanes.find((entry) => entry.ready > 0)?.lane ?? summary.lanes[0]?.lane ?? '',
  );
  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null);
  const [pathTargetId, setPathTargetId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(initial ? { id: initial.id, nonce: 0 } : null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sequence = useRef(1);

  const selected = selectedId ? graph.byId.get(selectedId) ?? null : null;
  const pathTarget = pathTargetId ? graph.byId.get(pathTargetId) ?? null : null;

  const pathIds = useMemo(() => {
    if (!pathTarget) return null;
    const ids = ancestorsOf(graph, pathTarget.id);
    ids.add(pathTarget.id);
    return ids;
  }, [graph, pathTarget]);

  // A path shows every line it runs through, whatever the lane; otherwise the lane's lines.
  const lines = useMemo(() => {
    const all = linesOf(graph.exercises);
    if (pathIds) return all.filter((line) => line.skills.some((skill) => pathIds.has(skill.id)));
    return all.filter((line) => line.lane === lane);
  }, [graph, lane, pathIds]);

  const basicsRemaining = useMemo(
    () => graph.exercises.filter((exercise) => exercise.level <= tree.basicsMax && !mastered.has(exercise.id)).length,
    [graph, mastered, tree.basicsMax],
  );

  /** Select a skill and bring it into view, switching to its lane if needed. */
  const goTo = (id: string) => {
    const exercise = graph.byId.get(id);
    if (!exercise) return;
    if (pathIds && !pathIds.has(id)) setPathTargetId(null);
    if (!pathIds || !pathIds.has(id)) setLane(exercise.swimlane);
    setSelectedId(id);
    setSheetOpen(false);
    setFocusRequest({ id, nonce: (sequence.current += 1) });
  };

  /** Narrow the board to what leads to one skill, opening on the athlete's next step along it. */
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

  const select = useCallback((id: string) => setSelectedId(id), []);

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

  const firstLevel = rules.bands[0]?.min ?? 0;
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
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <TreeBar
        tree={tree}
        graph={graph}
        mastered={mastered}
        summary={summary}
        lane={lane}
        pathTarget={pathTarget}
        pathLength={pathIds ? pathIds.size - 1 : 0}
        onTreeChange={onTreeChange}
        onLaneChange={(next) => {
          setLane(next);
          setFocusRequest(null);
        }}
        onGoTo={goTo}
        onOpenProgress={() => setSheetOpen(true)}
        onExitPath={() => setPathTargetId(null)}
      />

      <div className="flex-1 min-h-0 flex">
        <main className="flex-1 min-w-0 min-h-0 flex flex-col" aria-label={`${tree.label} skill tree`}>
          <ClimbBoard
            tree={tree}
            graph={graph}
            lines={lines}
            mastered={mastered}
            selectedId={selectedId}
            pathIds={pathIds}
            focusRequest={focusRequest}
            onSelect={select}
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
            const first = summary.ready[0];
            if (first) goTo(first.id);
            else setSheetOpen(false);
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
    </div>
  );
}
