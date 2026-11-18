'use client';

import React from 'react';
import { ATTRIBUTE_MAX, AttributeStatus } from '../../utils/attributes';

/**
 * The attribute web: one axis per attribute shown, each out of 999. Axis 0
 * points straight up. Labels are buttons laid over the drawing when
 * `onSelect` is given, so tapping an axis can open its breakdown.
 */

const RINGS = [0.25, 0.5, 0.75, 1];

interface RadarWebProps {
  attributes: AttributeStatus[];
  size: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Hide the axis labels (for small previews). */
  bare?: boolean;
}

export const RadarWeb: React.FC<RadarWebProps> = ({ attributes, size, selectedId, onSelect, bare = false }) => {
  const count = attributes.length;
  const pad = bare ? 6 : 52;
  const center = size / 2;
  const radius = center - pad;
  const labelRadius = radius + 30;
  const at = (index: number, fraction: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(count, 1);
    return [center + Math.cos(angle) * radius * fraction, center + Math.sin(angle) * radius * fraction] as const;
  };
  const ring = (fraction: number) => attributes.map((_, i) => at(i, fraction).map((n) => n.toFixed(1)).join(',')).join(' ');
  const shape = attributes
    .map((attribute, i) => at(i, Math.max(0.04, (attribute.value ?? 0) / ATTRIBUTE_MAX)).map((n) => n.toFixed(1)).join(','))
    .join(' ');
  const selectedIndex = attributes.findIndex((attribute) => attribute.def.id === selectedId);
  const selectedPoint =
    selectedIndex >= 0 ? at(selectedIndex, Math.max(0.04, (attributes[selectedIndex].value ?? 0) / ATTRIBUTE_MAX)) : null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="absolute inset-0">
        {RINGS.map((fraction) => (
          <polygon
            key={fraction}
            points={ring(fraction)}
            strokeWidth="1.1"
            style={{ fill: fraction === 1 ? 'var(--color-ink-850)' : 'none', stroke: fraction === 1 ? 'var(--color-ink-600)' : 'var(--color-ink-700)' }}
          />
        ))}
        {attributes.map((attribute, i) => {
          const [x, y] = at(i, 1);
          return (
            <line
              key={attribute.def.id}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              strokeOpacity={i === selectedIndex ? 0.7 : 1}
              strokeDasharray={i === selectedIndex ? '3 4' : undefined}
              strokeWidth="1.2"
              style={{ stroke: i === selectedIndex ? 'var(--color-act)' : 'var(--color-ink-700)' }}
            />
          );
        })}
        <polygon
          points={shape}
          fillOpacity="0.22"
          strokeWidth="2.2"
          strokeLinejoin="round"
          style={{ fill: 'var(--color-earned)', stroke: 'var(--color-earned)', transition: 'all .6s var(--ease-lift)' }}
        />
        {selectedPoint && (
          <>
            <circle cx={selectedPoint[0]} cy={selectedPoint[1]} r="9" fillOpacity=".25" style={{ fill: 'var(--color-act)' }} />
            <circle cx={selectedPoint[0]} cy={selectedPoint[1]} r="4.5" style={{ fill: 'var(--color-act)' }} />
          </>
        )}
      </svg>

      {!bare &&
        attributes.map((attribute, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / count;
          const x = center + Math.cos(angle) * labelRadius;
          const y = center + Math.sin(angle) * labelRadius;
          const on = attribute.def.id === selectedId;
          const value = attribute.display ?? (attribute.value === null ? '–' : String(attribute.value));
          const body = (
            <>
              <span className={`eyebrow ${on ? 'text-fg' : 'text-fg-4'}`}>
                {attribute.def.short}
              </span>
              <span className={`num font-bold text-[17px] leading-none ${on ? 'text-fg' : 'text-fg-2'}`}>{value}</span>
            </>
          );
          const style = { left: x - 42, top: y - 22 };
          const box = `absolute w-[84px] h-11 rounded-card flex flex-col items-center justify-center gap-px ${
            on ? 'bg-ink-800 raised outline-2 outline-act' : 'bg-ink-850'
          }`;
          return onSelect ? (
            <button
              key={attribute.def.id}
              type="button"
              onClick={() => onSelect(attribute.def.id)}
              aria-pressed={on}
              aria-label={`${attribute.def.name} ${value} of ${ATTRIBUTE_MAX}`}
              className={`${box} cursor-pointer hover:bg-ink-800 transition`}
              style={style}
            >
              {body}
            </button>
          ) : (
            <div key={attribute.def.id} className={box} style={style}>
              {body}
            </div>
          );
        })}
    </div>
  );
};
