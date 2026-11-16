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
        <defs>
          <linearGradient id="aura-web-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a77bff" stopOpacity=".55" />
            <stop offset="1" stopColor="#3ee8ff" stopOpacity=".35" />
          </linearGradient>
        </defs>
        {RINGS.map((fraction) => (
          <polygon
            key={fraction}
            points={ring(fraction)}
            fill={fraction === 1 ? '#0b0e17' : 'none'}
            stroke={fraction === 1 ? '#1d2335' : '#1a2031'}
            strokeWidth="1.1"
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
              stroke={i === selectedIndex ? '#3ee8ff' : '#1a2031'}
              strokeOpacity={i === selectedIndex ? 0.6 : 1}
              strokeDasharray={i === selectedIndex ? '3 4' : undefined}
              strokeWidth="1.2"
            />
          );
        })}
        <polygon
          points={shape}
          fill="url(#aura-web-fill)"
          stroke="#b99cff"
          strokeWidth="2.2"
          strokeLinejoin="round"
          style={{ transition: 'all .6s ease-out' }}
        />
        {selectedPoint && (
          <>
            <circle cx={selectedPoint[0]} cy={selectedPoint[1]} r="11" fill="#3ee8ff" fillOpacity=".22" />
            <circle cx={selectedPoint[0]} cy={selectedPoint[1]} r="5" fill="#3ee8ff" />
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
              <span className={`text-[10.5px] font-bold tracking-[0.06em] uppercase ${on ? 'text-act' : 'text-fg-4'}`}>
                {attribute.def.short}
              </span>
              <span className={`font-display font-bold text-base leading-none ${on ? 'text-fg' : 'text-fg-2'}`}>{value}</span>
            </>
          );
          const style = { left: x - 42, top: y - 22 };
          const box = `absolute w-[84px] h-11 rounded-[14px] border flex flex-col items-center justify-center gap-px ${
            on ? 'bg-[#08161d] border-act' : 'bg-ink-850 border-ink-700'
          }`;
          return onSelect ? (
            <button
              key={attribute.def.id}
              type="button"
              onClick={() => onSelect(attribute.def.id)}
              aria-pressed={on}
              aria-label={`${attribute.def.name} ${value} of ${ATTRIBUTE_MAX}`}
              className={`${box} cursor-pointer hover:border-ink-600 transition`}
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
