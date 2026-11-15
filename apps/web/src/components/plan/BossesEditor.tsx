'use client';

import React, { useState } from 'react';
import { BOSS_BY_ID, LIFT_BY_ID, MILESTONE_BY_ID } from '../../data/campaignCatalog';
import { CampaignPlan, PlanSpec, SpecBoss, normalizeSpec, usesOf } from '../../utils/campaignPlan';
import { themeFor } from '../protocol/primitives';
import { bossGroups } from './catalogOptions';
import { TargetFields } from './TargetFields';
import { DeleteButton, EditCard, Group, GroupedSelect, MoveButtons, moveBy, removeAt, setAt } from './fields';

interface Props {
  spec: PlanSpec;
  plan: CampaignPlan;
  onChange: (spec: PlanSpec) => void;
}

export const BossesEditor: React.FC<Props> = ({ spec, plan, onChange }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const setBosses = (bosses: SpecBoss[]) => onChange({ ...spec, bosses });
  const chosen = new Set(spec.bosses.map((entry) => entry.boss));

  return (
    <div className="space-y-8">
      <Group
        title={`Bosses · ${spec.bosses.length}`}
        hint="Chosen from the boss library. A boss falls when every requirement is met; each PR on a linked lift chips at its HP. Adding a boss brings the lifts and earlier bosses it needs. Tune the numbers to your own level."
      >
        <ul className="space-y-2">
          {spec.bosses.map((entry, index) => {
            const boss = BOSS_BY_ID.get(entry.boss);
            if (!boss) return null;
            const theme = themeFor(boss.branch);
            const requiredBy = spec.bosses
              .filter((other) => BOSS_BY_ID.get(other.boss)?.requirements.some((req) => req.kind === 'boss' && req.boss === boss.id))
              .map((other) => BOSS_BY_ID.get(other.boss)!.name);

            return (
              <EditCard
                key={boss.id}
                title={boss.name}
                meta={`${boss.requirements.length} requirement${boss.requirements.length === 1 ? '' : 's'} · ${boss.epithet}`}
                badge={
                  <span className={`flex items-center justify-center min-w-7 h-7 px-1 rounded-lg border text-[11px] font-black font-mono shrink-0 ${theme.bg} ${theme.text} ${theme.border}`}>
                    {index + 1}
                  </span>
                }
                open={openId === boss.id}
                onToggle={() => setOpenId(openId === boss.id ? null : boss.id)}
              >
                <p className="text-[11px] text-slate-400">
                  {theme.label} · {boss.epithet}
                </p>

                <div className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Requirements</span>
                  {boss.requirements.map((req, reqIndex) => {
                    if (req.kind === 'lift') {
                      const value = entry.targets?.[reqIndex] ?? { target: req.target, ...(req.atGoal !== undefined ? { atGoal: req.atGoal } : {}) };
                      return (
                        <TargetFields
                          key={reqIndex}
                          label={req.label}
                          unit={LIFT_BY_ID.get(req.lift)?.unit}
                          value={value}
                          scales={req.atGoal !== undefined}
                          bodyweight={spec.bodyweight}
                          onChange={(next) =>
                            setBosses(setAt(spec.bosses, index, { ...entry, targets: { ...entry.targets, [reqIndex]: next } }))
                          }
                        />
                      );
                    }
                    return (
                      <p key={reqIndex} className="px-2.5 py-2 rounded-xl border border-slate-800 bg-dark-950/70 text-xs text-slate-300">
                        {req.kind === 'milestone' ? (
                          <>
                            <span className="font-bold text-slate-200">Milestone:</span> {MILESTONE_BY_ID.get(req.milestone)?.name} — claimed on the Bosses tab
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-200">Defeat first:</span> {BOSS_BY_ID.get(req.boss)?.name}
                          </>
                        )}
                      </p>
                    );
                  })}
                  {entry.targets && (
                    <button
                      type="button"
                      onClick={() => setBosses(setAt(spec.bosses, index, { boss: entry.boss }))}
                      className="text-[11px] font-bold text-neon-cyan hover:underline cursor-pointer"
                    >
                      Reset to the library’s numbers
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <MoveButtons label={boss.name} index={index} count={spec.bosses.length} onMove={(delta) => setBosses(moveBy(spec.bosses, index, delta))} />
                  <span className="ml-auto">
                    {requiredBy.length ? (
                      <span className="text-[11px] text-slate-500">Required by {requiredBy.join(', ')} — remove that first.</span>
                    ) : (
                      <DeleteButton
                        label={boss.name}
                        uses={usesOf(plan, 'boss', boss.id)}
                        onDelete={() => onChange(normalizeSpec({ ...spec, bosses: removeAt(spec.bosses, index) }, spec))}
                      />
                    )}
                  </span>
                </div>
              </EditCard>
            );
          })}
        </ul>
        <GroupedSelect
          label="Add a boss"
          hideLabel
          value=""
          placeholder="+ Add a boss…"
          groups={bossGroups(chosen)}
          onChange={(id) => {
            onChange(normalizeSpec({ ...spec, bosses: [...spec.bosses, { boss: id }] }, spec));
            setOpenId(id);
          }}
        />
      </Group>

      {plan.milestones.length > 0 && (
        <Group title={`Milestones · ${plan.milestones.length}`} hint="Gates your bosses ask you to judge yourself. Claim them on the Bosses tab when you own them.">
          <ul className="space-y-1.5">
            {plan.milestones.map((milestone) => (
              <li key={milestone.id} className="p-2.5 rounded-xl border border-slate-800 bg-dark-950/60">
                <span className="block text-xs font-bold text-slate-200">{milestone.name}</span>
                <span className="block text-[11px] text-slate-500">{milestone.description}</span>
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
};
