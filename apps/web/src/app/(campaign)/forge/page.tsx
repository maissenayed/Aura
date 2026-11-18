'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, Castle, CloudOff, Layers, Star } from 'lucide-react';
import { ScreenHeader } from '../../../components/game/AppShell';
import { useGame } from '../../../components/game/GameProvider';
import { BossIcon, CheckIcon, ForgeIcon, MapIcon, MoonIcon, PlateIcon } from '../../../components/game/icons';
import { BossesEditor } from '../../../components/plan/BossesEditor';
import { ForgeWeek } from '../../../components/plan/ForgeWeek';
import { LiftsEditor } from '../../../components/plan/LiftsEditor';
import { MapEditor } from '../../../components/plan/MapEditor';
import { TowersEditor } from '../../../components/plan/TowersEditor';
import { BLUEPRINT_SPEC } from '../../../data/blueprintPlan';
import { CAMPAIGN_TEMPLATES } from '../../../data/campaignTemplates';
import { useAccount } from '../../../utils/accountStore';
import { CampaignPlan, DAY_NAMES, DayId, PlanSpec, blankSpec, resolvePlan } from '../../../utils/campaignPlan';
import { PlanSaveResult, savePlan, takeServerPlan } from '../../../utils/protocolStore';

type Section = 'week' | 'lifts' | 'bosses' | 'trees' | 'map';
type Notice = { tone: 'ok' | 'warn' | 'error'; text: string } | null;

/** Secondary buttons in the toolbar: an iron outline that lifts on hover. */
const SECONDARY = 'rounded-card border flex items-center gap-2 font-semibold transition active:scale-[.97] cursor-pointer';
/** The two-tap "replace everything" state: danger reads as crimson text, never a red slab. */
const CONFIRMING = 'border-boss text-boss';

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
  const [confirm, setConfirm] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const { account } = useAccount();

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
    { id: 'lifts', label: 'Lifts', count: resolved.lifts.length, icon: PlateIcon },
    { id: 'bosses', label: 'Bosses', count: working.bosses.length, icon: BossIcon },
    { id: 'trees', label: 'Towers', count: working.trees.length, icon: Castle },
    { id: 'map', label: 'Map', count: working.acts.length, icon: MapIcon },
  ];

  return (
    <main className="w-full max-w-[1180px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-32 lg:pb-10 flex flex-col gap-4">
      <ScreenHeader
        back={{ href: '/camp', label: 'Back to camp' }}
        title={
          <span className="flex items-center gap-2.5">
            <ForgeIcon className="w-7 h-7 text-fg-3" /> Forge
          </span>
        }
      />

      <div className="flex flex-wrap items-end gap-2.5">
        <label className="flex-1 min-w-[240px] flex flex-col gap-1.5">
          <span className="eyebrow text-fg-4">Plan</span>
          <input
            type="text"
            value={working.name}
            maxLength={60}
            onChange={(event) => edit({ ...working, name: event.target.value })}
            className="h-11 w-full min-w-0 px-3.5 rounded-card bg-ink-900 border border-ink-700 text-fg text-[16px] font-semibold placeholder:text-fg-5 focus:border-act outline-none transition-colors"
          />
        </label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setTemplatesOpen((open) => !open);
              setConfirm(null);
            }}
            aria-expanded={templatesOpen}
            title="Start again from a ready-made campaign"
            className={`h-11 px-3.5 text-[14px] ${SECONDARY} ${templatesOpen ? 'bg-ink-800 border-act text-fg' : 'border-ink-600 text-fg hover:bg-ink-850'}`}
          >
            <Star className="w-4 h-4" />
            Templates
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm !== 'blank') return setConfirm('blank');
              edit(blankSpec(Math.round(save.bodyWeightKg)));
              setConfirm(null);
              setSection('lifts');
            }}
            title="Start again from seven rest days"
            className={`h-11 px-3.5 text-[14px] ${SECONDARY} ${confirm === 'blank' ? CONFIRMING : 'border-ink-600 text-fg hover:bg-ink-850'}`}
          >
            {confirm === 'blank' ? <Layers className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            {confirm === 'blank' ? 'Replace?' : 'Blank'}
          </button>
        </div>
      </div>
      {templatesOpen && (
        <div className="flex flex-wrap gap-1.5" aria-label="Templates">
          {[
            ...CAMPAIGN_TEMPLATES.map((template) => ({
              id: template.id,
              label: `${template.sport} · ${template.name}`,
              build: () => template.build(Math.round(save.bodyWeightKg), working.bodyweight.goal),
            })),
            // The owner's own campaign stays on hand for the owner; everyone else starts from the templates.
            ...(account?.role === 'admin' ? [{ id: 'blueprint', label: 'Master Blueprint', build: () => BLUEPRINT_SPEC }] : []),
          ].map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => {
                if (confirm !== choice.id) return setConfirm(choice.id);
                edit(choice.build());
                setConfirm(null);
                setTemplatesOpen(false);
                setSection('week');
              }}
              className={`h-10 px-3 text-[13px] ${SECONDARY} ${confirm === choice.id ? CONFIRMING : 'border-ink-600 text-fg-2 hover:bg-ink-850 hover:text-fg'}`}
            >
              {confirm === choice.id && <Layers className="w-4 h-4" />}
              {confirm === choice.id ? `Replace with ${choice.label}?` : choice.label}
            </button>
          ))}
        </div>
      )}
      {confirm !== null && confirm !== 'reset' && (
        <p className="text-[13px] text-fg-4 -mt-1">Tap again to replace the whole plan. Logged lifts, ticks and weigh-ins stay.</p>
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
              className={`h-[58px] lg:h-12 lg:px-4 rounded-card border-[1.5px] flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-2.5 transition active:scale-[.97] cursor-pointer ${
                on ? 'bg-ink-800 border-act text-fg' : 'bg-ink-900 border-transparent text-fg-4 hover:bg-ink-850 hover:text-fg'
              }`}
            >
              <span className="flex items-center gap-1">
                <Icon className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
                <span className="num font-bold text-base leading-none lg:hidden">{count}</span>
              </span>
              <span className="text-[10px] lg:text-[14px] font-semibold">{label}</span>
              <span className={`hidden lg:inline num font-bold text-[15px] ${on ? 'text-fg-3' : 'text-fg-5'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {conflict && (
        <div role="alert" className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-card bg-ink-900">
          <AlertTriangle className="w-4 h-4 text-fg" />
          <span className="flex-1 min-w-[200px] text-[14px] text-fg-2">Your plan changed on another device. Which version stays?</span>
          <button
            type="button"
            disabled={saving}
            onClick={() => void store(true)}
            className="h-12 px-4 rounded-card bg-act text-act-deep font-display font-extrabold uppercase text-lg tracking-[0.02em] transition active:scale-[.97] cursor-pointer disabled:opacity-50"
          >
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
            className="h-12 px-4 rounded-card border border-ink-600 text-fg hover:bg-ink-850 font-display font-extrabold uppercase text-lg tracking-[0.02em] transition active:scale-[.97] cursor-pointer"
          >
            Use the other
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className={`flex items-center gap-2 text-[14px] font-semibold ${notice.tone === 'ok' ? 'text-fg' : notice.tone === 'warn' ? 'text-fg-3' : 'text-boss'}`}>
          {notice.tone === 'ok' ? <CheckIcon className="w-4 h-4" strokeWidth={2.6} /> : notice.tone === 'warn' ? <CloudOff className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {notice.text}
        </p>
      )}
      {warnings.length > 0 && (
        <details className="rounded-card bg-ink-900 px-3.5 py-2.5">
          <summary className="flex items-center gap-2 text-[14px] font-semibold text-fg-2 cursor-pointer">
            <AlertTriangle className="w-4 h-4 text-fg-3" /> {warnings.length} thing{warnings.length === 1 ? '' : 's'} worth a look
          </summary>
          <ul className="mt-2 pt-2 border-t border-ink-700 flex flex-col gap-1">
            {warnings.map((warning) => (
              <li key={warning} className="text-[13px] text-fg-3">
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

      <section aria-label="Danger zone" className="mt-4 flex flex-wrap items-center gap-3 p-3.5 rounded-card bg-ink-900">
        <span className="flex-1 min-w-[200px] flex flex-col gap-1">
          <span className="font-display font-extrabold uppercase text-[22px] leading-none text-fg">Reset campaign</span>
          <span className="text-[13px] text-fg-4">Clears logged lifts, ticks and weigh-ins on this account. The plan stays.</span>
        </span>
        <button
          type="button"
          onClick={() => {
            if (confirm !== 'reset') return setConfirm('reset');
            resetCampaign();
            setConfirm(null);
            setNotice({ tone: 'warn', text: 'Campaign reset. Week 1 starts today.' });
          }}
          className={`h-11 px-4 rounded-card border font-display font-extrabold uppercase text-lg tracking-[0.02em] text-boss transition active:scale-[.97] cursor-pointer ${
            confirm === 'reset' ? 'border-boss' : 'border-transparent hover:bg-ink-850'
          }`}
        >
          {confirm === 'reset' ? 'Tap again to reset' : 'Reset'}
        </button>
      </section>

      {planDirty && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="fixed z-40 inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] lg:inset-x-auto lg:bottom-6 lg:right-8 lg:w-[420px] h-16 bg-ink-900 border-t border-ink-700 lg:border lg:border-ink-600 lg:rounded-card flex items-center gap-2 pl-4 pr-2 anim-rise"
        >
          <span className="w-2 h-2 rounded-[2px] bg-act" aria-hidden="true" />
          <span className="flex-1 eyebrow text-fg-3">Unsaved</span>
          <button
            type="button"
            onClick={() => setPlanDraft(null)}
            className="h-12 px-4 rounded-card border border-ink-600 text-fg hover:bg-ink-850 font-display font-extrabold uppercase text-lg tracking-[0.02em] transition active:scale-[.97] cursor-pointer"
          >
            Undo
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void store()}
            className="h-12 px-6 rounded-card bg-act text-act-deep font-display font-extrabold uppercase text-lg tracking-[0.02em] transition active:scale-[.97] cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </main>
  );
}
