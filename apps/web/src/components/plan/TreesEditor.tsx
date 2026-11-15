'use client';

import React, { useState } from 'react';
import { LIFT_BY_ID, TREE_BY_ID } from '../../data/campaignCatalog';
import { CampaignPlan, PlanSpec, SpecTree, normalizeSpec, usesOf } from '../../utils/campaignPlan';
import { themeFor } from '../protocol/primitives';
import { treeGroups } from './catalogOptions';
import { TargetFields } from './TargetFields';
import { DeleteButton, EditCard, Group, GroupedSelect, MoveButtons, Toggle, moveBy, removeAt, setAt } from './fields';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

export const TreesEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const setTrees = (trees: SpecTree[]) => onChange({ ...spec, trees });
  const chosen = new Set(spec.trees.map((entry) => entry.tree));

  return (
    <Group
      title={`Skill trees · ${spec.trees.length}`}
      hint="Chosen from the skill-tree library and climbed from the bottom. A tier clears when its lift gates are met. Mark the tiers you already own, and tune the gates to your level."
    >
      <ul className="space-y-2">
        {spec.trees.map((entry, index) => {
          const tree = TREE_BY_ID.get(entry.tree);
          if (!tree) return null;
          const theme = themeFor(tree.branch);
          const cleared = new Set(entry.cleared ?? []);
          const uses = tree.tiers.flatMap((tier) => usesOf(plan, 'tier', tier.id));

          return (
            <EditCard
              key={tree.id}
              title={tree.name}
              meta={`${tree.tiers.length} tiers · ${cleared.size} marked as owned · ${tree.tagline}`}
              badge={<span className={`w-2.5 h-2.5 rounded-full shrink-0 bg-gradient-to-br ${theme.bar}`} aria-hidden />}
              open={openId === tree.id}
              onToggle={() => setOpenId(openId === tree.id ? null : tree.id)}
            >
              <ol className="space-y-2">
                {tree.tiers.map((tier, tierIndex) => (
                  <li key={tier.id} className="p-3 rounded-xl border border-slate-800 bg-dark-950/70 space-y-2">
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Rung {tierIndex + 1} · {tier.rung}
                      </span>
                      <span className="block text-sm font-bold text-white">{tier.name}</span>
                      <span className="block text-[11px] text-slate-500">{tier.subtitle}</span>
                    </div>

                    {tier.gates.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {tier.gates.map((gate, gateIndex) => {
                          const key = `${tier.id}:${gateIndex}`;
                          const value = entry.targets?.[key] ?? { target: gate.target, ...(gate.atGoal !== undefined ? { atGoal: gate.atGoal } : {}) };
                          return (
                            <TargetFields
                              key={key}
                              label={LIFT_BY_ID.get(gate.lift)?.name ?? gate.lift}
                              unit={LIFT_BY_ID.get(gate.lift)?.unit}
                              value={value}
                              scales={gate.atGoal !== undefined}
                              bodyweight={spec.bodyweight}
                              onChange={(next) => setTrees(setAt(spec.trees, index, { ...entry, targets: { ...entry.targets, [key]: next } }))}
                            />
                          );
                        })}
                      </div>
                    )}

                    <Toggle
                      label="I already own this"
                      checked={cleared.has(tier.id)}
                      hint={tier.gates.length === 0 ? 'This tier has no lift gates — it only clears when you mark it.' : 'Counts as cleared whatever the numbers say. Earns no tier XP.'}
                      onChange={(on) => {
                        const next = new Set(cleared);
                        if (on) next.add(tier.id);
                        else next.delete(tier.id);
                        setTrees(setAt(spec.trees, index, { ...entry, cleared: tree.tiers.map((t) => t.id).filter((id) => next.has(id)) }));
                      }}
                    />
                  </li>
                ))}
              </ol>

              {entry.targets && (
                <button
                  type="button"
                  onClick={() => setTrees(setAt(spec.trees, index, { tree: entry.tree, ...(entry.cleared ? { cleared: entry.cleared } : {}) }))}
                  className="text-[11px] font-bold text-neon-cyan hover:underline cursor-pointer"
                >
                  Reset gates to the library’s numbers
                </button>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <MoveButtons label={tree.name} index={index} count={spec.trees.length} onMove={(delta) => setTrees(moveBy(spec.trees, index, delta))} />
                <span className="ml-auto">
                  <DeleteButton
                    label={tree.name}
                    uses={uses}
                    onDelete={() => onChange(normalizeSpec({ ...spec, trees: removeAt(spec.trees, index) }, spec))}
                  />
                </span>
              </div>
            </EditCard>
          );
        })}
      </ul>
      <GroupedSelect
        label="Add a skill tree"
        hideLabel
        value=""
        placeholder="+ Add a skill tree…"
        groups={treeGroups(chosen)}
        onChange={(id) => {
          onChange(normalizeSpec({ ...spec, trees: [...spec.trees, { tree: id }] }, spec));
          setOpenId(id);
        }}
      />
    </Group>
  );
};
