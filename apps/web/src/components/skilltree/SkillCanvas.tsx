'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  NodeTypes,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import {
  LAYOUT,
  LaneSummary,
  SkillGraph,
  TreeSkill,
  ancestorsOf,
  descendantsOf,
  layoutTree,
  statusOf,
} from '../../utils/skillTree';
import { SkillTreeDef, laneThemeOf } from './skillTrees';
import { LaneHeaderNode, LevelHeaderNode, LineLabelNode, SkillNode } from './SkillNodes';

const nodeTypes: NodeTypes = {
  skill: SkillNode,
  laneHeader: LaneHeaderNode,
  lineLabel: LineLabelNode,
  levelHeader: LevelHeaderNode,
};

const COLOUR = {
  mastered: '#00ff9d',
  ready: '#00f0ff',
  locked: '#334155',
  chain: '#f8fafc',
};

/**
 * Camera moves are animated only while the page is on screen. In a background
 * tab the animation timer is paused, which would leave the camera stranded
 * part-way until the tab is looked at again.
 */
const glide = (ms: number) => (typeof document !== 'undefined' && document.visibilityState === 'visible' ? ms : 0);

/** Labels are scenery: they cannot be selected, dragged or tabbed to. */
const SCENERY = { selectable: false, draggable: false, focusable: false, connectable: false } as const;

export interface FocusRequest {
  id: string;
  /** Changes on every request, so asking for the same exercise twice still moves the camera. */
  nonce: number;
}

interface SkillCanvasProps {
  tree: SkillTreeDef;
  graph: SkillGraph;
  visible: TreeSkill[];
  mastered: ReadonlySet<string>;
  /** The level columns to draw, in order. */
  levels: number[];
  lanes: LaneSummary[];
  selectedId: string | null;
  focusRequest: FocusRequest | null;
  /** Changes whenever the set of cards changes shape; the camera resets when it does. */
  viewKey: string;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  emptyState: React.ReactNode;
}

const Canvas: React.FC<SkillCanvasProps> = ({
  tree,
  graph,
  visible,
  mastered,
  levels,
  lanes,
  selectedId,
  focusRequest,
  viewKey,
  onSelect,
  onClearSelection,
  emptyState,
}) => {
  const flow = useReactFlow();
  const container = useRef<HTMLDivElement>(null);
  const handledFocus = useRef<number | null>(null);
  // The camera can only be moved once React Flow has set itself up.
  const [ready, setReady] = useState(false);

  const layout = useMemo(
    () => layoutTree(visible, graph, mastered, levels, tree.rules.lanes),
    [visible, graph, mastered, levels, tree],
  );

  /** The selected exercise plus everything that leads to it and everything it leads to. */
  const chain = useMemo(() => {
    if (!selectedId) return null;
    const members = new Set<string>([selectedId]);
    ancestorsOf(graph, selectedId).forEach((id) => members.add(id));
    descendantsOf(graph, selectedId).forEach((id) => members.add(id));
    return members;
  }, [graph, selectedId]);

  const nodes = useMemo(() => {
    const visibleIds = new Set(visible.map((exercise) => exercise.id));
    const list: Node[] = [];

    for (const { level, x } of layout.levels) {
      list.push({
        id: `level-${level}`,
        type: 'levelHeader',
        position: { x, y: -LAYOUT.levelHeaderHeight },
        width: LAYOUT.cardWidth,
        height: 28,
        data: { label: tree.levelName(level) },
        ...SCENERY,
      });
    }

    for (const { lane, y } of layout.lanes) {
      const summary = lanes.find((entry) => entry.lane === lane);
      list.push({
        id: `lane-${lane}`,
        type: 'laneHeader',
        position: { x: 0, y },
        width: layout.width,
        height: LAYOUT.laneHeaderHeight - 12,
        data: {
          theme: laneThemeOf(tree, lane),
          mastered: summary?.mastered ?? 0,
          total: summary?.total ?? 0,
          ready: summary?.ready ?? 0,
        },
        ...SCENERY,
      });
    }

    for (const line of layout.lines) {
      list.push({
        id: `line-${line.key}`,
        type: 'lineLabel',
        position: { x: 0, y: line.y },
        width: LAYOUT.gutter - 18,
        height: line.height,
        data: { label: line.label, mastered: line.mastered, total: line.total },
        ...SCENERY,
      });
    }

    for (const card of layout.cards) {
      const exercise = graph.byId.get(card.id);
      if (!exercise) continue;
      list.push({
        id: card.id,
        type: 'skill',
        position: { x: card.x, y: card.y },
        width: LAYOUT.cardWidth,
        height: LAYOUT.cardHeight,
        draggable: false,
        connectable: false,
        selectable: false,
        focusable: false,
        data: {
          exercise,
          lane: laneThemeOf(tree, exercise.swimlane),
          levelTag: tree.levelTag(exercise.level),
          levelName: tree.levelName(exercise.level),
          hiddenHint: `Needs ${tree.noun.one === 'exercise' ? 'an' : 'a'} ${tree.noun.one} from an easier ${tree.levelWord} that is filtered out`,
          figure: tree.figureFor?.(exercise.id),
          status: statusOf(exercise, mastered),
          selected: card.id === selectedId,
          dimmed: chain !== null && !chain.has(card.id),
          hiddenPrerequisites: exercise.prerequisites.filter((id) => !visibleIds.has(id)).length,
          onSelect,
        },
      });
    }

    return list;
  }, [layout, lanes, graph, visible, mastered, selectedId, chain, onSelect, tree]);

  const edges = useMemo(() => {
    const visibleIds = new Set(visible.map((exercise) => exercise.id));
    const list: Edge[] = [];

    for (const target of visible) {
      for (const sourceId of target.prerequisites) {
        const source = graph.byId.get(sourceId);
        if (!source || !visibleIds.has(sourceId)) continue;

        const onChain = chain !== null && chain.has(sourceId) && chain.has(target.id);
        const colour = onChain
          ? COLOUR.chain
          : mastered.has(target.id)
            ? COLOUR.mastered
            : mastered.has(sourceId)
              ? COLOUR.ready
              : COLOUR.locked;

        list.push({
          id: `${sourceId}->${target.id}`,
          source: sourceId,
          target: target.id,
          type: 'default',
          selectable: false,
          focusable: false,
          zIndex: onChain ? 2 : 0,
          style: {
            stroke: colour,
            strokeWidth: onChain ? 2.5 : 1.75,
            opacity: chain !== null && !onChain ? 0.12 : 1,
            // A link that crosses from one branch into another is drawn dashed.
            strokeDasharray: source.swimlane !== target.swimlane ? '6 5' : undefined,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: colour, width: 14, height: 14 },
        });
      }
    }

    return list;
  }, [visible, graph, mastered, chain]);

  // A new set of cards: put the camera where reading starts — top-left, zoomed to fit the
  // columns when that keeps the cards readable, otherwise at the smallest readable size.
  useEffect(() => {
    if (!ready) return;
    const width = container.current?.clientWidth ?? 1000;
    const floor = width < 640 ? 0.55 : 0.7;
    const zoom = Math.min(1, Math.max(floor, (width - 32) / (layout.width + 32)));
    void flow.setViewport({ x: 16, y: 12 + LAYOUT.levelHeaderHeight * zoom, zoom });
    // The camera should move when the view changes shape, not on every re-layout (mastering re-lays out).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey, flow, ready]);

  // "Take me there": centre on an exercise picked from search or a list. Declared after the
  // reset above so that, when one action triggers both, this one has the last word.
  useEffect(() => {
    if (!ready || !focusRequest || handledFocus.current === focusRequest.nonce) return;
    const card = layout.cards.find((entry) => entry.id === focusRequest.id);
    if (!card) return;
    handledFocus.current = focusRequest.nonce;

    void flow.setCenter(card.x + LAYOUT.cardWidth / 2, card.y + LAYOUT.cardHeight / 2, {
      zoom: Math.max(flow.getZoom(), 0.85),
      duration: glide(450),
    });
  }, [focusRequest, layout, flow, ready]);

  return (
    <div ref={container} className="relative w-full h-full bg-dark-950 select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onPaneClick={onClearSelection}
        onInit={() => setReady(true)}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        minZoom={0.25}
        maxZoom={1.5}
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={32} size={1} />

        <Controls position="bottom-left" showInteractive={false} className="!z-30" />

        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => {
            if (node.type !== 'skill') return 'transparent';
            const status = (node.data as { status?: string }).status;
            return status === 'mastered' ? COLOUR.mastered : status === 'ready' ? COLOUR.ready : '#1e293b';
          }}
          nodeStrokeWidth={0}
          maskColor="rgba(6, 7, 10, 0.8)"
          className="!z-30 max-md:!hidden"
        />

        <Panel position="bottom-center" className="!mb-3">
          <ul
            aria-label="Legend"
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-dark-900/90 border border-slate-800 backdrop-blur text-[10px] font-bold uppercase tracking-wider"
          >
            <li className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-neon-emerald" />
              Mastered
            </li>
            <li className="flex items-center gap-1.5 text-neon-cyan">
              <span className="w-2 h-2 rounded-full bg-neon-cyan" />
              Ready
            </li>
            <li className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              Locked
            </li>
          </ul>
        </Panel>
      </ReactFlow>

      {visible.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none">
          <div className="pointer-events-auto max-w-sm text-center">{emptyState}</div>
        </div>
      )}
    </div>
  );
};

export const SkillCanvas: React.FC<SkillCanvasProps> = (props) => (
  <ReactFlowProvider>
    <Canvas {...props} />
  </ReactFlowProvider>
);
