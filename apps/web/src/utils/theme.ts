'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { LIGHT_QUERY, THEME_KEY as KEY } from './themeBoot';

/**
 * Dark is home (OLED phones, gym lighting); Daylight is the paper theme for
 * outdoor sessions. The choice lives on this device only. "system" follows the
 * phone's light/dark setting.
 */
export type ThemeChoice = 'dark' | 'light' | 'system';

const BAR = { dark: '#0e0d0b', light: '#eeece7' } as const;

function readChoice(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === 'light' || value === 'system' ? value : 'dark';
  } catch {
    return 'dark';
  }
}

function apply(choice: ThemeChoice) {
  const light = choice === 'light' || (choice === 'system' && window.matchMedia(LIGHT_QUERY).matches);
  const root = document.documentElement;
  if (light) root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? BAR.light : BAR.dark);
}

const listeners = new Set<() => void>();
const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};

/** The saved choice, and a setter that applies it at once. */
export function useThemeChoice(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const choice = useSyncExternalStore(subscribe, readChoice, () => 'dark' as ThemeChoice);

  // Follow the phone while the choice is "system".
  useEffect(() => {
    apply(choice);
    if (choice !== 'system') return;
    const query = window.matchMedia(LIGHT_QUERY);
    const onChange = () => apply('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [choice]);

  const set = (next: ThemeChoice) => {
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    apply(next);
    listeners.forEach((listener) => listener());
  };
  return [choice, set];
}
