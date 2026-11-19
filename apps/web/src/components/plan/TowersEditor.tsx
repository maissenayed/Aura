'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CampaignPlan, PlanSpec, newId, normalizeSpec, usesOf } from '../../utils/campaignPlan';
import { TowerSpec } from '../../utils/campaignV3';
import { floorsOf, masteredIn, skillOf } from '../../utils/treeIndex';
import { figureForExercise, heldPose } from '../game/figures';
import { useGame } from '../game/GameProvider';
import { CheckIcon } from '../game/icons';
import { Figure } from '../game/kit';
import { DeleteButton, EditCard, Group, MoveButtons, TextField, moveBy, removeAt, setAt } from './fields';
import { SkillField, laneOf } from './pickers';
import { SKILL_TREES } from '../skilltree/skillTrees';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

/**
 * Towers: a summit skill from the real skill tree and every skill below it,
 * climbed floor by floor. A floor is cleared by mastering its skill on the
 * tree, wherever that happens.
 */
export const TowersEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const { save } = useGame();
  const [openId, setOpenId] = useState<string | null>(null);
  /** Summits already raised, tagged in the picker. */
  const summits = useMemo(() => new Map(spec.trees.map((tower) => [`${tower.tree}:${tower.summit}`, 'Tower'])), [spec.trees]);

  const setTower = (index: number, next: TowerSpec) => onChange({ ...spec, trees: setAt(spec.trees, index, next) });

  return (
    <div className="space-y-6">
      <Group
        title={`Towers · ${spec.trees.length}`}
        hint="Pick a summit on the skill tree: the tower is that skill and every skill it needs, easiest at the bottom. Master them on the tree to climb."
      >
        <ul className="space-y-2">
          {spec.trees.map((tower, index) => {
            const summit = skillOf(tower.tree, tower.summit);
            const floors = floorsOf(tower.tree, tower.summit);
            const owned = masteredIn(save.skills, tower.tree);
            const climbed = floors.filter((floor) => owned.has(floor.id)).length;
            // Gold only once the summit is actually climbed.
            const topped = floors.length > 0 && climbed === floors.length;

            return (
              <EditCard
                key={tower.id}
                title={tower.name}
                meta={`${climbed}/${floors.length} floors · summit ${summit?.name ?? '?'}`}
                badge={
                  <span className={`w-10 h-10 rounded-tag shrink-0 flex items-center justify-center ${topped ? 'bg-earned-deep' : 'bg-ink-950'}`} aria-hidden>
                    <Figure spec={heldPose(figureForExercise(tower.summit, laneOf(summit?.swimlane)))} state={topped ? 'mastered' : 'ready'} className="w-9 h-9" />
                  </span>
                }
                open={openId === tower.id}
                onToggle={() => setOpenId(openId === tower.id ? null : tower.id)}
              >
                <TextField label="Name" value={tower.name} maxLength={60} onChange={(name) => setTower(index, { ...tower, name })} />
                <SkillField
                  label="Summit"
                  tree={tower.tree}
                  value={tower.summit}
                  aside="floors"
                  tags={summits}
                  sheetEyebrow={tower.name || 'Tower'}
                  sheetTitle="Pick the summit"
                  onPick={(tree, id) => setTower(index, { ...tower, tree, summit: id })}
                />
                <ol className="flex flex-col-reverse gap-1" aria-label="Floors, summit at the top">
                  {floors.map((floor) => {
                    const done = owned.has(floor.id);
                    return (
                      <li key={floor.id} className="list-none">
                        <Link
                          href={`/?tree=${tower.tree}&skill=${encodeURIComponent(floor.id)}`}
                          className={`flex items-center gap-2 h-9 px-2.5 rounded-card text-[13px] transition-colors ${
                            done ? 'bg-earned-deep text-earned-soft' : 'bg-ink-850 text-fg-3 hover:bg-ink-800 hover:text-fg'
                          }`}
                        >
                          <span className={`num font-bold w-8 shrink-0 ${done ? 'text-earned' : 'text-fg-4'}`}>{SKILL_TREES[tower.tree].levelTag(floor.level)}</span>
                          <span className="flex-1 truncate font-semibold">{floor.name}</span>
                          {done && <CheckIcon className="w-3.5 h-3.5 text-earned" strokeWidth={3} />}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <MoveButtons label={tower.name} index={index} count={spec.trees.length} onMove={(delta) => onChange({ ...spec, trees: moveBy(spec.trees, index, delta) })} />
                  <span className="ml-auto">
                    <DeleteButton
                      label={tower.name}
                      uses={usesOf(plan, 'tower', tower.id)}
                      onDelete={() => onChange(normalizeSpec({ ...spec, trees: removeAt(spec.trees, index) }, spec))}
                    />
                  </span>
                </div>
              </EditCard>
            );
          })}
        </ul>
      </Group>

      {spec.trees.length < 12 && (
        <Group title="Raise a tower">
          <SkillField
            label="Raise a tower"
            hideLabel
            tree="calisthenics"
            aside="floors"
            tags={summits}
            placeholder="Pick the summit"
            placeholderNote="From the calisthenics, bouldering or yoga tree"
            sheetEyebrow="Raise a tower"
            sheetTitle="Pick the summit"
            onPick={(tree, summit) => {
              const id = newId('tower');
              onChange(normalizeSpec({ ...spec, trees: [...spec.trees, { id, name: '', tree, summit }] }, spec));
              setOpenId(id);
            }}
          />
        </Group>
      )}
    </div>
  );
};
