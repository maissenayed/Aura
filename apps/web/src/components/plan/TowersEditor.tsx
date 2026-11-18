'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Branch, CampaignPlan, PlanSpec, newId, normalizeSpec, usesOf } from '../../utils/campaignPlan';
import { SkillTreeRef, TowerSpec } from '../../utils/campaignV3';
import { floorsOf, masteredIn, skillOf } from '../../utils/treeIndex';
import { useGame } from '../game/GameProvider';
import { CheckIcon, HoldIcon, RingsIcon } from '../game/icons';
import { DeleteButton, EditCard, Group, MoveButtons, TextField, moveBy, removeAt, setAt } from './fields';
import { CategoryChips, SkillSelect, laneOf } from './pickers';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

/** Trees get a glyph and a label, never a colour of their own. */
const TREES: { id: SkillTreeRef; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'calisthenics', label: 'Calisthenics & Gym', icon: RingsIcon },
  { id: 'bouldering', label: 'Bouldering', icon: HoldIcon },
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
            const TreeIcon = tower.tree === 'bouldering' ? HoldIcon : RingsIcon;
            // Gold only once the summit is actually climbed.
            const topped = floors.length > 0 && climbed === floors.length;

            return (
              <EditCard
                key={tower.id}
                title={tower.name}
                meta={`${climbed}/${floors.length} floors · summit ${summit?.name ?? '?'}`}
                badge={
                  <span className={`w-8 h-8 rounded-tag shrink-0 flex items-center justify-center ${topped ? 'bg-earned-deep text-earned' : 'bg-ink-800 text-fg-3'}`} aria-hidden>
                    <TreeIcon className="w-4 h-4" />
                  </span>
                }
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
                          className={`flex items-center gap-2 h-9 px-2.5 rounded-card text-[13px] transition-colors ${
                            done ? 'bg-earned-deep text-earned-soft' : 'bg-ink-850 text-fg-3 hover:bg-ink-800 hover:text-fg'
                          }`}
                        >
                          <span className={`num font-bold w-8 shrink-0 ${done ? 'text-earned' : 'text-fg-4'}`}>{tower.tree === 'calisthenics' ? `L${floor.level}` : `V${floor.level}`}</span>
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
        <Group title="Raise a tower" hint="Choose the tree and the lane, then the skill at the top.">
          <div role="radiogroup" aria-label="Tree" className="grid grid-cols-2 gap-1.5">
            {TREES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={id === tree}
                onClick={() => setTree(id)}
                className={`h-11 rounded-card border-[1.5px] text-[14px] font-semibold flex items-center justify-center gap-2 transition active:scale-[.97] cursor-pointer ${
                  id === tree ? 'bg-ink-800 border-act text-fg' : 'bg-ink-850 border-transparent text-fg-3 hover:bg-ink-800 hover:text-fg'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
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
