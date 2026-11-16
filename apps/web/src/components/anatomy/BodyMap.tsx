'use client';

import React, { useEffect, useRef } from 'react';
import { BodyChart, BodyState, ViewSide } from 'body-muscles';
import { BODY_PATHS, BodySide, MuscleGroup, groupOfPath } from './muscleGroups';

/** How a group is lit: to train today, trained today, or neither. */
export type GroupStatus = 'todo' | 'done';

/**
 * The library colours a path by an intensity from 0 to 10; globals.css maps
 * the three used here onto the game palette (cyan, gold, violet).
 */
const INTENSITY = { todo: 3, done: 6, selected: 10 } as const;

interface BodyMapProps {
  side: BodySide;
  status: Partial<Record<MuscleGroup, GroupStatus>>;
  selected: MuscleGroup | null;
  onSelect: (group: MuscleGroup, pathId: string) => void;
  onHover?: (group: MuscleGroup | null) => void;
  className?: string;
}

function stateFor(status: BodyMapProps['status'], selected: MuscleGroup | null): BodyState {
  const state: BodyState = {};
  for (const path of BODY_PATHS) {
    const isSelected = path.group !== null && path.group === selected;
    const lit = path.group ? status[path.group] : undefined;
    state[path.id] = {
      intensity: isSelected ? INTENSITY.selected : lit ? INTENSITY[lit] : 0,
      selected: isSelected,
    };
  }
  return state;
}

/** The front or back of the body, muscles tappable, lit by today's training. */
export const BodyMap: React.FC<BodyMapProps> = ({ side, status, selected, onSelect, onHover, className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<BodyChart | null>(null);
  // The chart is built once per side; its callbacks read the latest props through refs.
  const latest = useRef({ status, selected, onSelect, onHover });
  useEffect(() => {
    latest.current = { status, selected, onSelect, onHover };
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = new BodyChart(containerRef.current, {
      view: side === 'front' ? ViewSide.FRONT : ViewSide.BACK,
      bodyState: stateFor(latest.current.status, latest.current.selected),
      className: 'body-chart-wrapper',
      enableTransitions: true,
      showViewLabel: false,
      ariaLabel: side === 'front' ? 'Front of the body' : 'Back of the body',
      onMuscleClick: (id) => {
        const group = groupOfPath(id);
        if (group) latest.current.onSelect(group, id);
      },
      onMuscleHover: (id) => latest.current.onHover?.(id ? groupOfPath(id) : null),
    });
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [side]);

  useEffect(() => {
    chartRef.current?.update({ bodyState: stateFor(status, selected) });
  }, [status, selected]);

  return <div ref={containerRef} className={`w-full flex justify-center items-center select-none ${className}`} />;
};
