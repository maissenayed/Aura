'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, Castle, Check, CloudOff, Dumbbell, Hammer, Layers, Map, Moon, Skull, Star } from 'lucide-react';
import { ScreenHeader } from '../../../components/game/AppShell';
import { useGame } from '../../../components/game/GameProvider';
import { BossesEditor } from '../../../components/plan/BossesEditor';
import { ForgeWeek } from '../../../components/plan/ForgeWeek';
import { LiftsEditor } from '../../../components/plan/LiftsEditor';
import { MapEditor } from '../../../components/plan/MapEditor';
import { TowersEditor } from '../../../components/plan/TowersEditor';
import { BLUEPRINT_SPEC } from '../../../data/blueprintPlan';
import { CampaignPlan, DAY_NAMES, DayId, PlanSpec, blankSpec, resolvePlan } from '../../../utils/campaignPlan';
import { PlanSaveResult, savePlan, takeServerPlan } from '../../../utils/protocolStore';

type Section = 'week' | 'lifts' | 'bosses' | 'trees' | 'map';
type Notice = { tone: 'ok' | 'warn' | 'error'; text: string } | null;

/** Things that are allowed but probably not intended. */
function warningsFor(plan: CampaignPlan): string[] {
  const warnings: string[] = [];
  for (const day of plan.days) {
    if (day.kind !== 'rest' && day.exercises.length === 0) warnings.push(`${DAY_NAMES[day.id]} is a training day with no exercises.`);
  }
  for (const day of plan.days) {
    if (day.kind !== 'rest' && day.kind !== 'recovery' && day.exercises.length > 0 && day.warmUps.length === 0) warnings.push(`${DAY_NAMES[day.id]} has no warm-up.`);
  }
  for (const act of plan.acts) {
    if (act.goals.length === 0) warnings.push(`${act.name || 'An act'} has no goals and is skipped on the map.`);
  }
  return warnings;
}

/**
 * The Forge: where the campaign is configured. Everything is edited as a
 * draft that survives leaving the page; one bar saves it all.
 */
export default function ForgePage() {
  const { spec, planDraft, setPlanDraft, planDirty, save, resetCampaign, todayDayId } = useGame();
  const [section, setSection] = useState<Section>('week');
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [confirm, setConfirm] = useState<'blueprint' | 'blank' | 'reset' | null>(null);

  const working = planDraft ?? spec;
  const resolved = useMemo(() => resolvePlan(working), [working]);
  const warnings = useMemo(() => warningsFor(resolved), [resolved]);
  const exerciseCount = working.days.reduce((sum, day) => sum + day.exercises.length, 0);

  const edit = (next: PlanSpec) => {
    setNotice(null);
    setPlanDraft(next);
  };

  const report = (result: PlanSaveResult) => {
    if (result === 'saved') {
      setPlanDraft(null);
      setConflict(false);
      setNotice({ tone: 'ok', text: 'Campaign forged. Every screen now follows it, on every device.' });
    } else if (result === 'offline') {
      setPlanDraft(null);
      setConflict(false);
      setNotice({ tone: 'warn', text: 'Saved on this device. It reaches the server once you are back online.' });
    } else if (result === 'conflict') {
      setConflict(true);
      setNotice(null);
    } else if (result === 'outdated') {
      setNotice({ tone: 'warn', text: 'A newer version of Aura saved your campaign. Reload the app, then make this change again.' });
    } else {
      setNotice({ tone: 'error', text: 'The server refused this plan. Undo your last addition and save again.' });
    }
  };

  const store = async (overwrite = false) => {
    if (!planDraft) return;
    setSaving(true);
    report(await savePlan(planDraft, { overwrite }));
    setSaving(false);
  };

  const sections: { id: Section; label: string; count: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'week', label: 'Week', count: exerciseCount, icon: CalendarRange },
    { id: 'lifts', label: 'Lifts', count: resolved.lifts.length, icon: Dumbbell },
    { id: 'bosses', label: 'Bosses', count: working.bosses.length, icon: Skull },
    { id: 'trees', label: 'Towers', count: working.trees.length, icon: Castle },
    { id: 'map', label: 'Map', count: working.acts.length, icon: Map },
  ];

  return (
    <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-32 lg:pb-10 flex flex-col gap-4">
      <ScreenHeader
        back={{ href: '/camp', label: 'Back to camp' }}
        title={
          <span className="flex items-center gap-2.5">
            <Hammer className="w-6 h-6 text-earned" /> Forge
          </span>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex-1 min-w-[240px] flex items-center gap-2.5 h-12 px-3.5 rounded-[14px] bg-ink-850 border border-ink-700 focus-within:border-act">
          <span className="text-[11px] font-extrabold tracking-[0.1em] text-fg-5">PLAN</span>
          <input
            type="text"
            value={working.name}
            maxLength={60}
            onChange={(event) => edit({ ...working, name: event.target.value })}
            className="flex-1 min-w-0 bg-transparent outline-none font-display font-bold text-[17px]"
          />
        </label>
        <div className="flex gap-1.5">
          {([
            ['blueprint', 'Blueprint', Star],
            ['blank', 'Blank', Moon],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (confirm !== id) return setConfirm(id);
                edit(id === 'blueprint' ? BLUEPRINT_SPEC : blankSpec(Math.round(save.bodyWeightKg)));
                setConfirm(null);
                setSection(id === 'blueprint' ? 'week' : 'lifts');
              }}
              title={id === 'blueprint' ? 'Start again from the Master Blueprint' : 'Start again from seven rest days'}
              className={`h-12 px-3.5 rounded-[14px] border flex items-center gap-2 text-[13px] font-bold transition cursor-pointer ${
                confirm === id ? 'bg-boss border-boss text-boss-deep' : 'bg-ink-850 border-ink-700 text-fg-3 hover:text-fg'
              }`}
            >
              {confirm === id ? <Layers className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              {confirm === id ? 'Replace?' : label}
            </button>
          ))}
        </div>
      </div>
      {(confirm === 'blueprint' || confirm === 'blank') && (
        <p className="text-xs text-fg-4 -mt-1">Tap again to replace the whole plan. Logged lifts, ticks and weigh-ins stay.</p>
      )}

      <div role="tablist" aria-label="Plan sections" className="grid grid-cols-5 gap-1.5 lg:flex lg:flex-wrap">
        {sections.map(({ id, label, count, icon: Icon }) => {
          const on = id === section;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${label}, ${count}`}
              onClick={() => setSection(id)}
              className={`h-[58px] lg:h-12 lg:px-4 rounded-[14px] border-[1.5px] flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-2.5 transition cursor-pointer ${
                on ? 'bg-[#08161d] border-act text-act' : 'bg-ink-850 border-ink-700 text-[#8a94ad] hover:text-fg'
              }`}
            >
              <span className="flex items-center gap-1">
                <Icon className="w-3.5 h-3.5 lg:w-[18px] lg:h-[18px]" />
                <span className="font-display font-bold text-base lg:hidden">{count}</span>
              </span>
              <span className="text-[10px] lg:text-[13.5px] font-bold">{label}</span>
              <span className="hidden lg:inline font-display font-bold text-[15px] opacity-85">{count}</span>
            </button>
          );
        })}
      </div>

      {conflict && (
        <div role="alert" className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-2xl border border-earned/50 bg-[#14100a]">
          <AlertTriangle className="w-4 h-4 text-earned" />
          <span className="flex-1 min-w-[200px] text-[13px] text-fg-2">Your plan changed on another device. Which version stays?</span>
          <button type="button" disabled={saving} onClick={() => void store(true)} className="h-10 px-3.5 rounded-xl bg-act text-act-deep font-display font-bold text-sm cursor-pointer disabled:opacity-50">
            Keep mine
          </button>
          <button
            type="button"
            onClick={() => {
              takeServerPlan();
              setPlanDraft(null);
              setConflict(false);
              setNotice({ tone: 'ok', text: 'Loaded the version from your other device.' });
            }}
            className="h-10 px-3.5 rounded-xl border border-ink-600 text-fg-2 font-display font-bold text-sm cursor-pointer"
          >
            Use the other
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className={`flex items-center gap-2 text-[13px] font-semibold ${notice.tone === 'ok' ? 'text-earned' : notice.tone === 'warn' ? 'text-earned-soft' : 'text-boss-soft'}`}>
          {notice.tone === 'ok' ? <Check className="w-4 h-4" /> : notice.tone === 'warn' ? <CloudOff className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {notice.text}
        </p>
      )}
      {warnings.length > 0 && (
        <details className="rounded-2xl border border-ink-700 bg-ink-900 px-3.5 py-2.5">
          <summary className="flex items-center gap-2 text-[13px] font-semibold text-earned-soft cursor-pointer">
            <AlertTriangle className="w-4 h-4" /> {warnings.length} thing{warnings.length === 1 ? '' : 's'} worth a look
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {warnings.map((warning) => (
              <li key={warning} className="text-xs text-fg-3">
                {warning}
              </li>
            ))}
          </ul>
        </details>
      )}

      {section === 'week' && <ForgeWeek spec={working} onChange={edit} initialDay={(todayDayId as DayId | null) ?? 'mon'} />}
      {section === 'lifts' && <LiftsEditor spec={working} plan={resolved} onChange={edit} />}
      {section === 'bosses' && <BossesEditor spec={working} plan={resolved} onChange={edit} />}
      {section === 'trees' && <TowersEditor spec={working} plan={resolved} onChange={edit} />}
      {section === 'map' && <MapEditor spec={working} plan={resolved} onChange={edit} />}

      <section aria-label="Danger zone" className="mt-4 flex flex-wrap items-center gap-3 p-3.5 rounded-2xl border border-[#4a1a28] bg-[#16090d]">
        <span className="flex-1 min-w-[200px] flex flex-col">
          <span className="font-display font-bold text-boss-soft">Reset campaign</span>
          <span className="text-xs text-fg-4">Clears logged lifts, ticks and weigh-ins on this account. The plan stays.</span>
        </span>
        <button
          type="button"
          onClick={() => {
            if (confirm !== 'reset') return setConfirm('reset');
            resetCampaign();
            setConfirm(null);
            setNotice({ tone: 'warn', text: 'Campaign reset. Week 1 starts today.' });
          }}
          className={`h-11 px-4 rounded-xl font-display font-bold text-sm cursor-pointer ${confirm === 'reset' ? 'bg-boss text-boss-deep' : 'border border-[#4a1a28] text-boss-soft'}`}
        >
          {confirm === 'reset' ? 'Tap again to reset' : 'Reset'}
        </button>
      </section>

      {planDirty && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="fixed z-40 left-3 right-3 bottom-[96px] lg:bottom-6 lg:left-auto lg:right-8 lg:w-[420px] h-[62px] rounded-[22px] bg-[#0c0f18] border border-[#17566a] flex items-center gap-2 pl-4 pr-2 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] anim-rise"
        >
          <span className="w-2 h-2 rounded-full bg-act shadow-[0_0_8px_#3ee8ff]" />
          <span className="flex-1 text-[13px] font-bold text-fg-2">Unsaved</span>
          <button type="button" onClick={() => setPlanDraft(null)} className="h-11 px-3.5 rounded-[14px] border border-ink-600 text-fg-3 font-display font-bold text-sm cursor-pointer">
            UNDO
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void store()}
            className="h-11 px-5 rounded-[14px] bg-act text-act-deep font-display font-bold tracking-[0.05em] cursor-pointer disabled:opacity-60"
          >
            {saving ? 'SAVING…' : 'SAVE'}
          </button>
        </div>
      )}
    </main>
  );
}
