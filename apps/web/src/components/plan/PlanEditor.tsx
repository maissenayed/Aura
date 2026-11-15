'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, Check, CloudOff, Dumbbell, GitBranch, Map, RotateCcw, Skull, SlidersHorizontal } from 'lucide-react';
import { BLUEPRINT_SPEC } from '../../data/blueprintPlan';
import { CampaignPlan, DAY_NAMES, PlanSpec, blankSpec, resolvePlan } from '../../utils/campaignPlan';
import { PlanSaveResult, savePlan, takeServerPlan } from '../../utils/protocolStore';
import { Panel, PanelHead } from '../protocol/primitives';
import { BossesEditor } from './BossesEditor';
import { LiftsEditor } from './LiftsEditor';
import { MapEditor } from './MapEditor';
import { TreesEditor } from './TreesEditor';
import { WeekEditor } from './WeekEditor';
import { TextField } from './fields';

type Section = 'week' | 'lifts' | 'bosses' | 'trees' | 'map';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'week', label: 'Week', icon: <CalendarRange className="w-4 h-4" /> },
  { id: 'lifts', label: 'Lifts', icon: <Dumbbell className="w-4 h-4" /> },
  { id: 'bosses', label: 'Bosses', icon: <Skull className="w-4 h-4" /> },
  { id: 'trees', label: 'Skill trees', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'map', label: 'Map', icon: <Map className="w-4 h-4" /> },
];

type Notice = { tone: 'ok' | 'warn' | 'error'; text: string } | null;

/** Things that are allowed but probably not intended. */
function warningsFor(plan: CampaignPlan): string[] {
  const warnings: string[] = [];
  for (const day of plan.days) {
    if (day.kind !== 'rest' && day.exercises.length === 0) warnings.push(`${DAY_NAMES[day.id]} is a training day with no exercises.`);
  }
  for (const tree of plan.trees) {
    const stuck = tree.tiers.filter((tier) => tier.gates.length === 0 && !tier.preCleared).length;
    if (stuck) warnings.push(`${tree.name} has ${stuck} tier${stuck === 1 ? '' : 's'} with no lift gates — mark ${stuck === 1 ? 'it' : 'them'} as owned when you get there.`);
  }
  for (const act of plan.acts) {
    if (act.goals.length === 0) warnings.push(`${act.name || 'An act'} has no goals and is skipped on the map.`);
  }
  return warnings;
}

interface PlanEditorProps {
  /** The plan as saved. */
  spec: PlanSpec;
  /** Unsaved edits, or null. */
  draft: PlanSpec | null;
  bodyWeightKg: number;
  onDraftChange: (draft: PlanSpec | null) => void;
}

export const PlanEditor: React.FC<PlanEditorProps> = ({ spec, draft, bodyWeightKg, onDraftChange }) => {
  const [section, setSection] = useState<Section>('week');
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmStart, setConfirmStart] = useState<'blueprint' | 'blank' | null>(null);

  const working = draft ?? spec;
  const resolved = useMemo(() => resolvePlan(working), [working]);
  const dirty = useMemo(() => draft !== null && JSON.stringify(draft) !== JSON.stringify(spec), [draft, spec]);
  const warnings = useMemo(() => warningsFor(resolved), [resolved]);
  const exerciseCount = working.days.reduce((sum, day) => sum + day.exercises.length, 0);

  const edit = (next: PlanSpec) => {
    setNotice(null);
    onDraftChange(next);
  };

  const report = (result: PlanSaveResult) => {
    if (result === 'saved') {
      onDraftChange(null);
      setConflict(false);
      setNotice({ tone: 'ok', text: 'Plan saved. Every tab now follows it, on every device you sign in on.' });
    } else if (result === 'offline') {
      onDraftChange(null);
      setConflict(false);
      setNotice({ tone: 'warn', text: 'Saved on this device. It reaches the server by itself once you are back online.' });
    } else if (result === 'conflict') {
      setConflict(true);
      setNotice(null);
    } else {
      setNotice({ tone: 'error', text: 'The server refused this plan. Try removing something you just added, then save again.' });
    }
  };

  const save = async (overwrite = false) => {
    if (!draft) return;
    setSaving(true);
    report(await savePlan(draft, { overwrite }));
    setSaving(false);
  };

  return (
    <div className="space-y-5 pb-24">
      <Panel className="p-4 sm:p-6">
        <PanelHead
          icon={<SlidersHorizontal className="w-4 h-4" />}
          title="Your Plan"
          subtitle="Everything the campaign is built from, picked from our library: your week's exercises with their sets and reps, the lifts it measures, the bosses, the skill trees and the map. Edit freely — nothing changes until you save."
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-end">
          <TextField label="Plan name" value={working.name} maxLength={60} onChange={(name) => edit({ ...working, name })} />
          <p className="text-[11px] text-slate-400 lg:text-right">
            {resolved.lifts.length} lifts · {exerciseCount} exercises · {resolved.bosses.length} bosses · {resolved.trees.length} skill trees ·{' '}
            {working.acts.length} acts
          </p>
        </div>

        {conflict && (
          <div role="alert" className="mt-4 p-3 rounded-xl border border-amber-500/50 bg-amber-950/30 space-y-2">
            <p className="flex items-start gap-2 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
              Your plan was changed on another device since you opened it. Which version should stay?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save(true)}
                className="h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-cyan-950/50 text-neon-cyan border border-cyan-500/50 hover:bg-cyan-900/50 transition cursor-pointer disabled:opacity-50"
              >
                Keep mine
              </button>
              <button
                type="button"
                onClick={() => {
                  takeServerPlan();
                  onDraftChange(null);
                  setConflict(false);
                  setNotice({ tone: 'ok', text: 'Loaded the version from your other device.' });
                }}
                className="h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-dark-950 text-slate-300 border border-slate-700 hover:border-slate-500 transition cursor-pointer"
              >
                Use the other device’s
              </button>
            </div>
          </div>
        )}

        {notice && (
          <p
            role="status"
            className={`mt-4 flex items-start gap-2 text-xs font-semibold ${
              notice.tone === 'ok' ? 'text-emerald-300' : notice.tone === 'warn' ? 'text-amber-300' : 'text-rose-300'
            }`}
          >
            {notice.tone === 'ok' ? <Check className="w-4 h-4 shrink-0" /> : notice.tone === 'warn' ? <CloudOff className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {notice.text}
          </p>
        )}
      </Panel>

      <nav aria-label="Plan sections" className="flex items-center gap-1 p-1 rounded-2xl bg-dark-900/80 border border-slate-800/90 overflow-x-auto no-scrollbar">
        {SECTIONS.map((entry) => {
          const active = entry.id === section;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSection(entry.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                active ? 'bg-neon-purple/15 text-purple-200 border border-purple-500/40' : 'text-slate-400 border border-transparent hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {entry.icon}
              {entry.label}
            </button>
          );
        })}
      </nav>

      <Panel className="p-4 sm:p-6">
        {section === 'week' && <WeekEditor spec={working} plan={resolved} onChange={edit} />}
        {section === 'lifts' && <LiftsEditor spec={working} plan={resolved} onChange={edit} />}
        {section === 'bosses' && <BossesEditor spec={working} plan={resolved} onChange={edit} />}
        {section === 'trees' && <TreesEditor spec={working} plan={resolved} onChange={edit} />}
        {section === 'map' && <MapEditor spec={working} plan={resolved} onChange={edit} />}
      </Panel>

      {warnings.length > 0 && (
        <Panel className="p-4 sm:p-5">
          <PanelHead icon={<AlertTriangle className="w-4 h-4" />} title="Worth a look" subtitle="Allowed, but probably not what you meant." />
          <ul className="space-y-1">
            {warnings.map((warning) => (
              <li key={warning} className="text-xs text-amber-200/90">
                · {warning}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel className="p-4 sm:p-6">
        <PanelHead
          icon={<RotateCcw className="w-4 h-4" />}
          title="Start From"
          subtitle="Replace the whole plan, then review and save. Your logged lifts, ticks and weigh-ins are kept either way."
        />
        {confirmStart ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300">
              {confirmStart === 'blueprint'
                ? 'Replace everything in the editor with the Master Blueprint?'
                : 'Clear the editor down to seven rest days and nothing else?'}
            </span>
            <button
              type="button"
              onClick={() => {
                edit(confirmStart === 'blueprint' ? BLUEPRINT_SPEC : blankSpec(Math.round(bodyWeightKg)));
                setConfirmStart(null);
                setSection(confirmStart === 'blueprint' ? 'week' : 'lifts');
              }}
              className="h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-950/50 text-rose-200 border border-rose-700/60 hover:bg-rose-900/50 transition cursor-pointer"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => setConfirmStart(null)}
              className="h-9 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-dark-950 text-slate-300 border border-slate-700 hover:border-slate-500 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirmStart('blueprint')}
              className="h-10 px-4 rounded-xl text-xs font-bold bg-dark-950 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 transition cursor-pointer"
            >
              The Master Blueprint
            </button>
            <button
              type="button"
              onClick={() => setConfirmStart('blank')}
              className="h-10 px-4 rounded-xl text-xs font-bold bg-dark-950 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 transition cursor-pointer"
            >
              A blank plan
            </button>
          </div>
        )}
      </Panel>

      {dirty && (
        <div
          role="region"
          aria-label="Unsaved plan changes"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl flex items-center gap-3 p-3 rounded-2xl border border-purple-500/50 bg-dark-900/95 backdrop-blur-xl shadow-2xl shadow-black/60"
        >
          <span className="flex-1 text-xs font-bold text-slate-200">
            Unsaved changes<span className="hidden sm:inline"> to your plan</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onDraftChange(null);
              setConflict(false);
              setNotice(null);
            }}
            className="h-10 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-dark-950 text-slate-300 border border-slate-700 hover:border-slate-500 transition cursor-pointer"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/25 transition cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save plan'}
          </button>
        </div>
      )}
    </div>
  );
};
