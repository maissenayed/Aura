'use client';

import { useEffect } from 'react';
import type { RawExercise } from '@aura/types';
import { exerciseListSource, setExerciseList } from '../data/exercisesData';
import { useAccount } from './accountStore';

/**
 * Brings the database's exercise list into the app. This device's last copy
 * goes in at once (so a start is instant and works offline), then the server
 * is asked whether the list changed since; only a changed list is downloaded.
 * Signed out or offline, the app keeps what it has: the last copy, or the
 * built-in list.
 */

const CACHE_KEY = 'aura_exercise_list_v1';

interface Cached {
  version: string;
  exercises: RawExercise[];
}

export interface ExerciseListResponse {
  version: string;
  /** Null when the version sent is still current. */
  exercises: RawExercise[] | null;
}

function readCache(): Cached | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? 'null') as Cached | null;
    return parsed && typeof parsed.version === 'string' && Array.isArray(parsed.exercises) && parsed.exercises.length ? parsed : null;
  } catch {
    return null;
  }
}

/** Puts a list from the server in use and keeps a copy on this device for the next start. */
export function adoptExerciseList(version: string, exercises: RawExercise[]): void {
  setExerciseList(exercises, version);
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ version, exercises } satisfies Cached));
  } catch {
    // A full storage only costs the next start its head start.
  }
}

let inFlight: Promise<void> | null = null;

/** Asks the server for the list if it changed. Concurrent callers share one request. */
export function refreshExerciseList(): Promise<void> {
  inFlight ??= (async () => {
    try {
      const response = await fetch(`/api/v1/exercises?version=${encodeURIComponent(exerciseListSource())}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) return;
      const { data } = (await response.json()) as { data?: ExerciseListResponse };
      if (data?.exercises) adoptExerciseList(data.version, data.exercises);
    } catch {
      // Offline: keep the list in use.
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

let started = false;

/** Mounted once near the root: loads the list at start and again when someone signs in. */
export function ExerciseListLoader(): null {
  const { status, account } = useAccount();

  useEffect(() => {
    if (started) return;
    started = true;
    const cached = readCache();
    if (cached) setExerciseList(cached.exercises, cached.version);
  }, []);

  useEffect(() => {
    if (status === 'ready') void refreshExerciseList();
  }, [status, account?.id]);

  return null;
}
