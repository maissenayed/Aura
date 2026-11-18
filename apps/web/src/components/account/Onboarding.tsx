'use client';

import React, { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { CAMPAIGN_TEMPLATES, CampaignTemplate, TemplateId } from '../../data/campaignTemplates';
import { useAccount } from '../../utils/accountStore';
import { blankSpec } from '../../utils/campaignPlan';
import { signOutOfCampaign, startCampaign } from '../../utils/protocolStore';
import { Chip } from '../game/kit';
import { BossIcon, CheckIcon, ForgeIcon, HoldIcon, PlateIcon, RingsIcon } from '../game/icons';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './ui';

/** A discipline is a glyph, not a colour. */
const ICON: Record<TemplateId, React.ComponentType<{ className?: string }>> = {
  calisthenics: RingsIcon,
  bodybuilding: PlateIcon,
  bouldering: HoldIcon,
};

const MIN_KG = 30;
const MAX_KG = 250;

const kgOf = (text: string): number | null => {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value >= MIN_KG && value <= MAX_KG ? Math.round(value * 10) / 10 : null;
};

const TemplateCard: React.FC<{ template: CampaignTemplate; selected: boolean; onSelect: () => void }> = ({ template, selected, onSelect }) => {
  const Icon = ICON[template.id];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative w-full text-left flex flex-col gap-3 p-4 rounded-card border-2 transition active:scale-[.99] cursor-pointer ${
        selected ? 'border-act bg-ink-850' : 'border-transparent bg-ink-900 hover:bg-ink-850'
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={`flex items-center justify-center w-11 h-11 rounded-card ${selected ? 'bg-act text-act-deep' : 'bg-ink-800 text-fg-2'}`}>
          <Icon className="w-6 h-6" />
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="eyebrow text-fg-4">{template.sport}</span>
          <span className="font-display font-extrabold uppercase text-[22px] text-fg leading-none">{template.name}</span>
        </span>
        {selected && <CheckIcon className="w-6 h-6 text-act shrink-0" strokeWidth={2.6} />}
      </span>
      <span className="text-sm text-fg-2 leading-snug">{template.tagline}</span>
      <span className="text-[12px] text-fg-3 leading-snug">
        <span className="font-semibold text-fg-2">{template.trainingDays} training days</span> · {template.split}
      </span>
      <span className="flex flex-wrap gap-1.5">
        <Chip tone="boss">
          <BossIcon className="w-4 h-4" />
          10 bosses
        </Chip>
        {template.bossNames.map((name) => (
          <Chip key={name} tone="dim">
            {name}
          </Chip>
        ))}
      </span>
    </button>
  );
};

const KgField: React.FC<{ label: string; hint: string; value: string; onChange: (value: string) => void; required?: boolean }> = ({ label, hint, value, onChange, required }) => {
  const id = useId();
  return (
    <div className="flex-1 min-w-0">
      <label htmlFor={id} className="eyebrow block mb-1.5 text-fg-4">
        {label}
      </label>
      <span className="flex items-center h-12 px-3 rounded-card bg-ink-900 border border-ink-700 focus-within:border-act transition">
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder="70"
          className="flex-1 min-w-0 bg-transparent outline-none num font-bold text-xl text-fg placeholder:text-fg-5"
        />
        <span className="text-sm font-semibold text-fg-3">kg</span>
      </span>
      <span className="block mt-1 text-[11px] text-fg-4">{hint}</span>
    </div>
  );
};

/**
 * A new account's first screen: pick the campaign to start with — calisthenics,
 * bodybuilding or bouldering, each a full week, ten bosses and a map — or a
 * blank plan to build in the Forge. Nothing is saved until one is chosen.
 */
export const Onboarding: React.FC = () => {
  const router = useRouter();
  const { account } = useAccount();
  const [picked, setPicked] = useState<TemplateId>('calisthenics');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const template = CAMPAIGN_TEMPLATES.find((entry) => entry.id === picked) ?? CAMPAIGN_TEMPLATES[0];

  /** The body weight to start with, or null (and a message) when it is missing or out of range. */
  const weights = (): { bodyWeight: number; goalWeight: number } | null => {
    const bodyWeight = kgOf(weight);
    if (bodyWeight === null) {
      setProblem(`Enter your body weight in kg (${MIN_KG}–${MAX_KG}). The bodyweight bosses are measured against it.`);
      return null;
    }
    const goalWeight = goal.trim() ? kgOf(goal) : bodyWeight;
    if (goalWeight === null) {
      setProblem(`Enter a goal weight between ${MIN_KG} and ${MAX_KG} kg, or leave it empty.`);
      return null;
    }
    return { bodyWeight, goalWeight };
  };

  const start = async (event: React.FormEvent) => {
    event.preventDefault();
    const chosen = weights();
    if (!chosen || busy) return;
    setBusy(true);
    await startCampaign(template.build(chosen.bodyWeight, chosen.goalWeight), chosen.bodyWeight);
    window.scrollTo(0, 0);
    router.push('/camp');
  };

  const buildOwn = async () => {
    const chosen = weights();
    if (!chosen || busy) return;
    setBusy(true);
    const blank = blankSpec(chosen.bodyWeight);
    await startCampaign({ ...blank, bodyweight: { ...blank.bodyweight, goal: chosen.goalWeight } }, chosen.bodyWeight);
    window.scrollTo(0, 0);
    router.push('/forge');
  };

  return (
    <form onSubmit={start} className="w-full max-w-xl flex flex-col gap-6">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display font-extrabold uppercase text-[32px] leading-[0.95] text-fg">{account ? `Welcome, ${account.name.split(' ')[0]}` : 'Welcome'}</h1>
        <p className="text-sm text-fg-2 leading-relaxed">
          Pick the campaign you start with: a full week of training, ten bosses to beat and a map to climb. You can change any of it later in
          the Forge.
        </p>
      </header>

      <div role="radiogroup" aria-label="Campaign templates" className="flex flex-col gap-3">
        {CAMPAIGN_TEMPLATES.map((entry) => (
          <TemplateCard key={entry.id} template={entry} selected={entry.id === picked} onSelect={() => setPicked(entry.id)} />
        ))}
      </div>

      <div className="flex gap-3">
        <KgField label="Body weight" hint="Today, on the scale." value={weight} onChange={(value) => (setWeight(value), setProblem(null))} required />
        <KgField label="Goal weight" hint="Optional. Leave empty to hold it." value={goal} onChange={(value) => (setGoal(value), setProblem(null))} />
      </div>

      {problem && (
        <p role="alert" className="text-sm font-semibold text-boss">
          {problem}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={busy}
          className={`${PRIMARY_BUTTON} h-12`}
        >
          {busy ? 'Setting up your campaign…' : `Start ${template.name}`}
        </button>
        <button
          type="button"
          onClick={buildOwn}
          disabled={busy}
          className={`${SECONDARY_BUTTON} h-11 text-sm`}
        >
          <ForgeIcon className="w-[18px] h-[18px]" />
          Or build my own plan in the Forge
        </button>
      </div>

      {account && (
        <button
          type="button"
          onClick={() => void signOutOfCampaign()}
          className="self-center flex items-center gap-1.5 h-9 px-2 text-xs font-semibold text-fg-4 hover:text-fg cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Not {account.name.split(' ')[0]}? Sign out
        </button>
      )}
    </form>
  );
};
