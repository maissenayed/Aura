'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Exercise } from '@aura/types';
import { EXERCISES } from '../data/exercisesData';
import { getStoredExercises } from './exerciseStorage';
import { resolveExerciseId } from '../data/exerciseAliases';

/**
 * Which skills are mastered, kept in localStorage — one entry per skill tree —
 * and read through `useSyncExternalStore` so the server render and the first
 * client render agree. A new athlete starts with nothing mastered.
 */

export type SkillTreeId = 'calisthenics' | 'bouldering' | 'gym';

export const SKILL_TREE_IDS: readonly SkillTreeId[] = ['calisthenics', 'bouldering', 'gym'];

/** The calisthenics key predates the other trees and stays as it was, so existing progress keeps loading. */
const PROGRESS_KEYS: Record<SkillTreeId, string> = {
  calisthenics: 'aura_calisthenics_skill_tree_progress_v1',
  bouldering: 'aura_bouldering_skill_tree_progress_v1',
  gym: 'aura_gym_skill_tree_progress_v1',
};

const EMPTY: readonly string[] = Object.freeze([]);

const cache = new Map<SkillTreeId, readonly string[]>();
const listeners = new Set<() => void>();

function read(tree: SkillTreeId): readonly string[] {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEYS[tree]);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as { masteredIds?: unknown };
    if (!Array.isArray(parsed.masteredIds)) return EMPTY;
    const ids = parsed.masteredIds.filter((id): id is string => typeof id === 'string');
    // Calisthenics skills merged in the rebuild count for the skill they were merged into.
    return tree === 'calisthenics' ? [...new Set(ids.map(resolveExerciseId))] : ids;
  } catch (error) {
    console.error('Could not read skill tree progress on this device:', error);
    return EMPTY;
  }
}

function getSnapshot(tree: SkillTreeId): readonly string[] {
  let ids = cache.get(tree);
  if (ids === undefined) {
    ids = read(tree);
    cache.set(tree, ids);
  }
  return ids;
}

const getServerSnapshot = (): readonly string[] => EMPTY;

/** One listener for every key this module owns; another tab changing any of them refreshes the cache. */
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    const tree = SKILL_TREE_IDS.find((id) => PROGRESS_KEYS[id] === event.key);
    if (tree) cache.delete(tree);
    else if (event.key === CHOICE_KEY) choice = undefined;
    else return;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function setMasteredIds(tree: SkillTreeId, ids: string[]): void {
  const next = Object.freeze([...new Set(ids)]);
  cache.set(tree, next);
  try {
    window.localStorage.setItem(PROGRESS_KEYS[tree], JSON.stringify({ masteredIds: next }));
  } catch (error) {
    console.error('Could not save skill tree progress on this device:', error);
  }
  listeners.forEach((listener) => listener());
}

export function useMasteredIds(tree: SkillTreeId): readonly string[] {
  const snapshot = useCallback(() => getSnapshot(tree), [tree]);
  return useSyncExternalStore(subscribe, snapshot, getServerSnapshot);
}

/* ------------------------------------------------------------------ */
/* Which tree the athlete looked at last                               */
/* ------------------------------------------------------------------ */

const CHOICE_KEY = 'aura_skill_tree_choice_v1';
const DEFAULT_TREE: SkillTreeId = 'calisthenics';

/** Undefined until read; null when nothing is stored. */
let choice: SkillTreeId | null | undefined;

export function isSkillTreeId(value: unknown): value is SkillTreeId {
  return typeof value === 'string' && (SKILL_TREE_IDS as readonly string[]).includes(value);
}

function getChoice(): SkillTreeId {
  if (choice === undefined) {
    try {
      const stored = window.localStorage.getItem(CHOICE_KEY);
      choice = isSkillTreeId(stored) ? stored : null;
    } catch {
      choice = null;
    }
  }
  return choice ?? DEFAULT_TREE;
}

const getServerChoice = (): SkillTreeId => DEFAULT_TREE;

/** The tree picked last on this device; calisthenics until one is picked. */
export function useRememberedTree(): SkillTreeId {
  return useSyncExternalStore(subscribe, getChoice, getServerChoice);
}

export function rememberTree(tree: SkillTreeId): void {
  choice = tree;
  try {
    window.localStorage.setItem(CHOICE_KEY, tree);
  } catch (error) {
    console.error('Could not remember the skill tree on this device:', error);
  }
  listeners.forEach((listener) => listener());
}

/* The exercise list: the built-in dataset, or a custom one saved on this device. */

let exerciseCache: Exercise[] | null = null;
const subscribeNever = () => () => {};
const getExercises = () => (exerciseCache ??= getStoredExercises());
const getServerExercises = () => EXERCISES;

export function useExercises(): Exercise[] {
  return useSyncExternalStore(subscribeNever, getExercises, getServerExercises);
}
