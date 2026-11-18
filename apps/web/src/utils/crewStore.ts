'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { api } from './accountStore';
import type { CrewAwards } from './badgeFamilies';

/**
 * What the crew has given this athlete (duels won, raids, spotter weeks), as
 * the server counts it. Fetched once per visit and on demand; null until it
 * arrives, or when the server cannot be reached.
 */

let awards: CrewAwards | null = null;
let loading = false;
const listeners = new Set<() => void>();

export async function refreshCrewAwards(): Promise<void> {
  if (loading) return;
  loading = true;
  const result = await api<CrewAwards>('GET', '/crew/me');
  loading = false;
  if (result.data) {
    awards = result.data;
    listeners.forEach((listener) => listener());
  }
}

export function useCrewAwards(): CrewAwards | null {
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => awards,
    () => null,
  );
  useEffect(() => {
    if (!awards) void refreshCrewAwards();
  }, []);
  return value;
}
