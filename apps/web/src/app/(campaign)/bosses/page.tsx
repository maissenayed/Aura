'use client';

import { FightPanel } from '../../../components/game/FightPanel';
import { useGame } from '../../../components/game/GameProvider';
import { closestKill } from '../../../components/game/helpers';

/** With no boss picked, desktop shows the one closest to falling; phones show only the gallery. */
export default function BossesIndexPage() {
  const { derived } = useGame();
  const featured = closestKill(derived.bosses) ?? derived.bosses[0];
  if (!featured) return null;
  return (
    <div className="hidden lg:block">
      <FightPanel status={featured} />
    </div>
  );
}
