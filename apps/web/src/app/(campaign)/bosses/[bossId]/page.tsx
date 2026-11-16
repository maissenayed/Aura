'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FightPanel } from '../../../../components/game/FightPanel';
import { useGame } from '../../../../components/game/GameProvider';

/** One boss, up close. On phones it has the screen to itself, with a way back to the gallery. */
export default function BossFightPage() {
  const { bossId } = useParams<{ bossId: string }>();
  const { derived } = useGame();
  const status = derived.bosses.find((entry) => entry.boss.id === bossId);

  if (!status) {
    return (
      <div className="p-6 rounded-3xl border border-ink-700 bg-ink-900 flex flex-col items-start gap-3">
        <p className="font-display font-bold text-lg">This boss isn&apos;t in your campaign.</p>
        <Link href="/bosses" className="text-act font-bold">
          Back to bosses
        </Link>
      </div>
    );
  }
  return <FightPanel status={status} showBack />;
}
