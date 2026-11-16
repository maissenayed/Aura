'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Branch, CampaignPlan, PlanSpec, newId, normalizeSpec, usesOf } from '../../utils/campaignPlan';
import { SkillTreeRef, TowerSpec } from '../../utils/campaignV3';
import { floorsOf, masteredIn, skillOf } from '../../utils/treeIndex';
import { useGame } from '../game/GameProvider';
import { themeFor } from '../protocol/primitives';
import { DeleteButton, EditCard, Group, MoveButtons, TextField, moveBy, removeAt, setAt } from './fields';
import { CategoryChips, SkillSelect, laneOf } from './pickers';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

const TREES: { id: SkillTreeRef; label: string }[] = [
  { id: 'calisthenics', label: 'Calisthenics & Gym' },
  { id: 'bouldering', label: 'Bouldering' },
];

/**
 * Towers: a summit skill from the real skill tree and every skill below it,
 * climbed floor by floor. A floor is cleared by mastering its skill on the
 * tree, wherever that happens.
 */
export const TowersEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const { save } = useGame();
  const [openId, setOpenId] = useState<string | null>(null);
  const [tree, setTree] = useState<SkillTreeRef>('calisthenics');
  const [lane, setLane] = useState<Branch>('push');

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
            const theme = themeFor(tower.tree === 'calisthenics' ? laneOf(summit?.swimlane) : 'pull');

            return (
              <EditCard
                key={tower.id}
                title={tower.name}
                meta={`${climbed}/${floors.length} floors · summit ${summit?.name ?? '?'}`}
                badge={<span className={`w-2.5 h-2.5 rounded-full shrink-0 bg-gradient-to-br ${theme.bar}`} aria-hidden />}
                open={openId === tower.id}
                onToggle={() => setOpenId(openId === tower.id ? null : tower.id)}
              >
                <TextField label="Name" value={tower.name} maxLength={60} onChange={(name) => setTower(index, { ...tower, name })} />
                <SkillSelect
                  tree={tower.tree}
                  lane={tower.tree === 'calisthenics' ? laneOf(summit?.swimlane) : undefined}
                  label="Summit"
                  value={tower.summit}
                  onChange={(id) => setTower(index, { ...tower, summit: id })}
                />
                <ol className="flex flex-col-reverse gap-1" aria-label="Floors, summit at the top">
                  {floors.map((floor) => {
                    const done = owned.has(floor.id);
                    return (
                      <li key={floor.id} className="list-none">
                        <Link
                          href={`/?tree=${tower.tree}&skill=${encodeURIComponent(floor.id)}`}
                          className={`flex items-center gap-2 h-9 px-2.5 rounded-[10px] border text-[12px] ${
                            done ? 'border-[#4a3a18] bg-[#14100a] text-earned' : 'border-ink-700 bg-ink-850 text-fg-3'
                          }`}
                        >
                          <span className="font-display font-bold w-8 shrink-0">{tower.tree === 'calisthenics' ? `L${floor.level}` : `V${floor.level}`}</span>
                          <span className="flex-1 truncate font-semibold">{floor.name}</span>
                          {done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
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
        <Group title="Raise a tower" hint="Choose the tree and the lane, then the skill at the top.">
          <div role="radiogroup" aria-label="Tree" className="grid grid-cols-2 gap-1.5">
            {TREES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="radio"
                aria-checked={entry.id === tree}
                onClick={() => setTree(entry.id)}
                className={`h-11 rounded-[14px] border-[1.5px] text-[13px] font-bold cursor-pointer ${
                  entry.id === tree ? 'bg-[#08161d] border-act text-act' : 'bg-ink-850 border-ink-700 text-fg-3'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          {tree === 'calisthenics' && <CategoryChips label="Lane" value={lane} onChange={setLane} />}
          <SkillSelect
            tree={tree}
            lane={tree === 'calisthenics' ? lane : undefined}
            label="Summit"
            value=""
            placeholder="Pick the summit…"
            onChange={(summit) => {
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
