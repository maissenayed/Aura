'use client';

import { AppShell } from '../../components/game/AppShell';
import { Studio } from '../../components/studio/Studio';

/** The figure studio: every athlete figure and prop, to watch, check and fix. The owner's tool. */
export default function StudioPage() {
  return (
    <AppShell>
      <Studio />
    </AppShell>
  );
}
