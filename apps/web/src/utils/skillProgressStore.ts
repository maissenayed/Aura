'use client';

import { useSyncExternalStore } from 'react';
import { Exercise } from '@aura/types';
import { EXERCISES } from '../data/exercisesData';
import { getStoredExercises } from './exerciseStorage';

/**
 * Which exercises are mastered, kept in localStorage and read through
 * `useSyncExternalStore` so the server render and the first client render
 * agree. A new athlete starts with nothing mastered.
 */

const STORAGE_KEY = 'aura_calisthenics_skill_tree_progress_v1';
const EMPTY: readonly string[] = Object.freeze([]);

let cache: readonly string[] | null = null;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as { masteredIds?: unknown };
    return Array.isArray(parsed.masteredIds) ? parsed.masteredIds.filter((id): id is string => typeof id === 'string') : EMPTY;
  } catch (error) {
    console.error('Could not read skill tree progress on this device:', error);
    return EMPTY;
  }
}

function getSnapshot(): readonly string[] {
  if (cache === null) cache = read();
  return cache;
}

const getServerSnapshot = (): readonly string[] => EMPTY;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function setMasteredIds(ids: string[]): void {
  cache = Object.freeze([...new Set(ids)]);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ masteredIds: cache }));
  } catch (error) {
    console.error('Could not save skill tree progress on this device:', error);
  }
  listeners.forEach((listener) => listener());
}

export function useMasteredIds(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* The exercise list: the built-in dataset, or a custom one saved on this device. */

let exerciseCache: Exercise[] | null = null;
const subscribeNever = () => () => {};
const getExercises = () => (exerciseCache ??= getStoredExercises());
const getServerExercises = () => EXERCISES;

export function useExercises(): Exercise[] {
  return useSyncExternalStore(subscribeNever, getExercises, getServerExercises);
}
