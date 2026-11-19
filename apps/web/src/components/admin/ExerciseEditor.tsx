'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';
import type { RawExercise, Swimlane } from '@aura/types';
import { DANGER_BUTTON, FormMessage, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../account/ui';
import { getSwimlane } from '../../data/exercisesData';
import { api } from '../../utils/accountStore';

/**
 * One exercise, opened from the Exercises page: every field the skill tree
 * reads. Saving sends it to the database; the answer is the whole list, which
 * the page puts in use for the entire app.
 *
 * A built-in exercise follows fixes to the app's own list until the owner
 * saves a change to it; from then on it is theirs, and stays as they made it
 * until they put it back to the built-in version.
 */

/** What every change answers with: the list, and which parts of it are the owner's own. */
export interface SavedList {
  version: string;
  exercises: RawExercise[];
  /** Built-in exercises the owner edited. */
  edited: string[];
  /** Exercises the owner added; the built-in list has no version of them. */
  added: string[];
  /** Built-in exercises the owner deleted. */
  deleted: { id: string; name: string; level: number }[];
}

/** Whose version a row is: the app's (built-in), or the owner's edit of it, or one the owner added. */
export type Ownership = 'built-in' | 'edited' | 'added';

const INPUT =
  'w-full h-11 px-3 rounded-card bg-ink-950 border border-ink-700 text-fg placeholder:text-fg-5 focus:border-act outline-none transition-colors';
const AREA = `${INPUT} h-auto py-2.5 leading-relaxed resize-y`;
const LANES: Swimlane[] = ['Push', 'Pull', 'Core', 'Legs'];

interface Draft {
  id: string;
  name: string;
  level: string;
  category: string;
  subCategory: string;
  swimlane: '' | Swimlane;
  gym: boolean;
  prerequisites: string[];
  standard: string;
  summary: string;
  focus: string;
  steps: string;
  expertTip: string;
  videoSearchUrl: string;
  youtubeQuery: string;
  muscles: string;
}

/** The next free `ex_` number, for a new exercise's id. */
function nextId(all: RawExercise[]): string {
  const top = all.reduce((max, exercise) => Math.max(max, Number(/^ex_(\d+)$/.exec(exercise.id)?.[1] ?? -1)), -1);
  return `ex_${top + 1}`;
}

function draftOf(exercise: RawExercise | null, all: RawExercise[]): Draft {
  return {
    id: exercise?.id ?? nextId(all),
    name: exercise?.name ?? '',
    level: String(exercise?.level ?? 1),
    category: exercise?.category ?? '',
    subCategory: exercise?.subCategory ?? '',
    swimlane: exercise?.swimlane ?? '',
    gym: exercise?.discipline === 'gym',
    prerequisites: exercise?.prerequisites ?? [],
    standard: exercise?.standard ?? '',
    summary: exercise?.summary ?? '',
    focus: exercise?.focus ?? '',
    steps: (exercise?.steps ?? []).join('\n'),
    expertTip: exercise?.expertTip ?? '',
    videoSearchUrl: exercise?.videoSearchUrl ?? '',
    youtubeQuery: exercise?.youtubeQuery ?? '',
    muscles: (exercise?.muscles ?? []).join(', '),
  };
}

/** What the server is sent: empty text stays empty, and the server leaves it out. */
const payloadOf = (draft: Draft) => ({
  id: draft.id.trim(),
  name: draft.name,
  level: Number(draft.level),
  category: draft.category,
  subCategory: draft.subCategory,
  swimlane: draft.swimlane || undefined,
  discipline: draft.gym ? 'gym' : undefined,
  prerequisites: draft.prerequisites,
  standard: draft.standard,
  summary: draft.summary,
  focus: draft.focus,
  steps: draft.steps.split('\n').map((line) => line.trim()).filter(Boolean),
  expertTip: draft.expertTip,
  videoSearchUrl: draft.videoSearchUrl,
  youtubeQuery: draft.youtubeQuery,
  muscles: draft.muscles.split(',').map((muscle) => muscle.trim()).filter(Boolean),
});

const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

/** The fields as the editor names them, in its order. */
const FIELDS: [keyof RawExercise, string][] = [
  ['name', 'Name'],
  ['level', 'Level'],
  ['discipline', 'Kind'],
  ['category', 'Category'],
  ['subCategory', 'Branch'],
  ['swimlane', 'Lane'],
  ['prerequisites', 'Needs first'],
  ['standard', 'Standard'],
  ['summary', 'Summary'],
  ['focus', 'Focus'],
  ['steps', 'Steps'],
  ['expertTip', 'Tip'],
  ['muscles', 'Muscles'],
  ['videoSearchUrl', 'Video link'],
  ['youtubeQuery', 'Video search'],
];

/** Where the owner's version differs from the built-in one (which needs only exercises still in the list). */
function differences(mine: RawExercise, builtIn: RawExercise, all: RawExercise[]): string[] {
  const present = new Set(all.map((entry) => entry.id));
  const base = { ...builtIn, prerequisites: builtIn.prerequisites?.filter((id) => present.has(id)) };
  return FIELDS.filter(([key]) => JSON.stringify(mine[key] ?? null) !== JSON.stringify(base[key] ?? null)).map(([, label]) => label);
}

export const ExerciseEditor: React.FC<{
  /** Null for a new exercise. */
  exercise: RawExercise | null;
  /** The version the app ships with, if it has one. */
  builtIn: RawExercise | null;
  ownership: Ownership;
  all: RawExercise[];
  onClose: () => void;
  onSaved: (list: SavedList, message: string) => void;
}> = ({ exercise, builtIn, ownership, all, onClose, onSaved }) => {
  const isNew = exercise === null;
  const [draft, setDraft] = useState<Draft>(() => draftOf(exercise, all));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBuiltIn, setConfirmBuiltIn] = useState(false);
  const differs = useMemo(() => (exercise && builtIn && ownership === 'edited' ? differences(exercise, builtIn, all) : []), [exercise, builtIn, ownership, all]);
  const titleId = useId();
  const firstField = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const byId = useMemo(() => new Map(all.map((entry) => [entry.id, entry])), [all]);
  const categories = useMemo(() => unique(all.map((entry) => entry.category)), [all]);
  const branches = useMemo(() => unique(all.map((entry) => entry.subCategory)), [all]);
  const dependents = useMemo(() => (exercise ? all.filter((entry) => entry.prerequisites?.includes(exercise.id)) : []), [all, exercise]);
  const autoLane = draft.category || draft.subCategory ? getSwimlane(draft.category, draft.subCategory) : null;

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const path = isNew ? '/admin/exercises' : `/admin/exercises/${encodeURIComponent(exercise.id)}`;
    const result = await api<SavedList>(isNew ? 'POST' : 'PUT', path, payloadOf(draft));
    setBusy(false);
    if (result.data) onSaved(result.data, isNew ? `${draft.name.trim()} is in the list.` : `${draft.name.trim()} is saved.`);
    else setError(result.error ?? 'The exercise was not saved.');
  };

  const putBackBuiltIn = async () => {
    if (!exercise) return;
    setBusy(true);
    setError(null);
    const result = await api<SavedList>('POST', `/admin/exercises/${encodeURIComponent(exercise.id)}/restore`);
    setBusy(false);
    if (result.data) onSaved(result.data, `${builtIn?.name ?? exercise.name} is back to its built-in version.`);
    else setError(result.error ?? 'The built-in version was not put back.');
  };

  const remove = async () => {
    if (!exercise) return;
    setBusy(true);
    setError(null);
    const result = await api<SavedList>('DELETE', `/admin/exercises/${encodeURIComponent(exercise.id)}`);
    setBusy(false);
    if (result.data) onSaved(result.data, `${exercise.name} is deleted.`);
    else setError(result.error ?? 'The exercise was not deleted.');
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-ink-950/70" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={save}
        className="w-full sm:max-w-[560px] h-full flex flex-col bg-ink-900 border-l border-ink-700 lift-shadow"
      >
        <header className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-ink-800">
          <div className="flex-1 min-w-0">
            <span className="eyebrow text-fg-4">
              {isNew ? 'New exercise' : `Edit · ${exercise.id} · ${ownership === 'built-in' ? 'built-in' : ownership === 'edited' ? 'your edit' : 'yours'}`}
            </span>
            <h2 id={titleId} className="font-display font-extrabold uppercase text-[26px] leading-[0.95] truncate mt-1">
              {draft.name.trim() || 'Untitled'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-11 h-11 shrink-0 rounded-card bg-ink-850 raised text-fg-2 flex items-center justify-center hover:bg-ink-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {!isNew && (
            <Provenance
              ownership={ownership}
              differs={differs}
              confirming={confirmBuiltIn}
              busy={busy}
              onAsk={() => setConfirmBuiltIn(true)}
              onCancel={() => setConfirmBuiltIn(false)}
              onConfirm={putBackBuiltIn}
            />
          )}
          <Group title="The exercise">
            {isNew && (
              <Text label="Id" hint="Permanent: saves and plans point at it. Lowercase letters, digits, - or _." value={draft.id} onChange={(value) => set('id', value)} mono />
            )}
            <Text label="Name" value={draft.name} onChange={(value) => set('name', value)} inputRef={firstField} required />
            <div className="grid grid-cols-2 gap-3">
              <Text label="Level" type="number" min={1} max={20} value={draft.level} onChange={(value) => set('level', value)} required />
              <Choice
                label="Kind"
                value={draft.gym ? 'gym' : 'bodyweight'}
                options={[
                  { value: 'bodyweight', label: 'Bodyweight' },
                  { value: 'gym', label: 'Gym lift' },
                ]}
                onChange={(value) => set('gym', value === 'gym')}
              />
            </div>
            <Text label="Category" value={draft.category} onChange={(value) => set('category', value)} list={categories} required />
            <Text label="Branch" hint="Exercises in the same branch form one progression line in the tree." value={draft.subCategory} onChange={(value) => set('subCategory', value)} list={branches} required />
            <Choice
              label="Lane"
              value={draft.swimlane}
              options={[{ value: '', label: autoLane ? `Automatic (${autoLane})` : 'Automatic' }, ...LANES.map((lane) => ({ value: lane, label: lane }))]}
              onChange={(value) => set('swimlane', value as Draft['swimlane'])}
            />
          </Group>

          <Group title="Needs first">
            <Prerequisites
              chosen={draft.prerequisites}
              all={all}
              selfId={draft.id}
              byId={byId}
              onChange={(ids) => set('prerequisites', ids)}
            />
            {dependents.length > 0 && (
              <p className="text-[12px] text-fg-4">
                Needed by {dependents.length === 1 ? '' : `${dependents.length} exercises: `}
                {dependents
                  .slice(0, 6)
                  .map((entry) => entry.name)
                  .join(', ')}
                {dependents.length > 6 ? ` and ${dependents.length - 6} more` : ''}.
              </p>
            )}
          </Group>

          <Group title="What it takes">
            <Text label="Standard" hint={'What mastering it looks like: "3×10", "10 s hold".'} value={draft.standard} onChange={(value) => set('standard', value)} />
            <Text label="Summary" hint="One sentence on what it is." value={draft.summary} onChange={(value) => set('summary', value)} />
            <Text label="Focus" hint={'What it builds, e.g. "Upper chest".'} value={draft.focus} onChange={(value) => set('focus', value)} />
            <Area label="Steps" hint="One step per line. Left empty, the panel says there is no written guide yet." value={draft.steps} onChange={(value) => set('steps', value)} rows={5} />
            <Area label="Tip" value={draft.expertTip} onChange={(value) => set('expertTip', value)} rows={2} />
            <Text label="Muscles" hint="Comma separated. Left empty, they are worked out from the lane." value={draft.muscles} onChange={(value) => set('muscles', value)} />
          </Group>

          <Group title="Tutorial">
            <Text label="Video link" hint="A YouTube address. It plays in the skill panel." value={draft.videoSearchUrl} onChange={(value) => set('videoSearchUrl', value)} type="url" />
            <Text label="Video search" hint="Without a link, the panel offers a YouTube search for this." value={draft.youtubeQuery} onChange={(value) => set('youtubeQuery', value)} />
          </Group>
        </div>

        <footer className="px-5 py-4 border-t border-ink-800 flex flex-col gap-3">
          {error && <FormMessage tone="error">{error}</FormMessage>}
          {confirmDelete && exercise ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-fg-2">
                Delete <b className="text-fg">{exercise.name}</b>? It leaves the tree for everyone
                {dependents.length ? `, and ${dependents.length} ${dependents.length === 1 ? 'exercise stops' : 'exercises stop'} needing it` : ''}.{' '}
                {builtIn
                  ? 'Fixes to the built-in list will not bring it back; you can, from the deleted exercises at the bottom of the page.'
                  : 'The built-in list has no version of it, so it is gone for good.'}
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={remove} className={`${DANGER_BUTTON} h-11 px-4 text-sm flex-1 border border-boss/50`}>
                  {busy ? 'Deleting…' : 'Delete it'}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={`${SECONDARY_BUTTON} h-11 px-4 text-sm flex-1`}>
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button type="submit" disabled={busy} className={`${PRIMARY_BUTTON} h-11 px-5 flex-1`}>
                {busy ? 'Saving…' : isNew ? 'Add exercise' : 'Save'}
              </button>
              <button type="button" onClick={onClose} className={`${SECONDARY_BUTTON} h-11 px-4 text-sm`}>
                Cancel
              </button>
              {!isNew && (
                <button type="button" onClick={() => setConfirmDelete(true)} className={`${DANGER_BUTTON} h-11 px-3 text-sm`}>
                  Delete
                </button>
              )}
            </div>
          )}
        </footer>
      </form>
    </div>
  );
};

/** Whose version this is, and for the owner's edit of a built-in exercise, the way back. */
const Provenance: React.FC<{
  ownership: Ownership;
  differs: string[];
  confirming: boolean;
  busy: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ ownership, differs, confirming, busy, onAsk, onCancel, onConfirm }) => {
  if (ownership === 'built-in') {
    return <p className="text-[12.5px] text-fg-4">Built-in: it takes fixes to the app&rsquo;s own list when the app is deployed, until you save a change to it.</p>;
  }
  if (ownership === 'added') {
    return <p className="text-[12.5px] text-fg-4">You added this one. The built-in list has no version of it.</p>;
  }
  return (
    <section className="flex flex-col gap-2.5 p-3 rounded-card border border-ink-600" aria-label="Your edit">
      <p className="text-[13px] text-fg-2">
        <b className="text-fg">Your edit.</b> Fixes to the built-in list do not reach it.
        {differs.length > 0 && <> It differs from the built-in version in {listOf(differs)}.</>}
      </p>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-fg-2 w-full">Replace your version with the built-in one?</span>
          <button type="button" disabled={busy} onClick={onConfirm} className={`${SECONDARY_BUTTON} h-10 px-3 text-sm`}>
            <RotateCcw className="w-4 h-4" />
            {busy ? 'Putting it back…' : 'Use the built-in version'}
          </button>
          <button type="button" onClick={onCancel} className="h-10 px-3 text-sm font-semibold text-fg-3 hover:text-fg cursor-pointer">
            Keep mine
          </button>
        </div>
      ) : (
        <button type="button" onClick={onAsk} className={`${SECONDARY_BUTTON} h-10 px-3 text-sm self-start`}>
          <RotateCcw className="w-4 h-4" />
          Use the built-in version
        </button>
      )}
    </section>
  );
};

const listOf = (words: string[]) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`);

/* ---------------- fields ---------------- */

const Group: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="flex flex-col gap-3">
    <h3 className="font-display font-extrabold uppercase text-lg leading-none text-fg-2">{title}</h3>
    {children}
  </section>
);

const FieldShell: React.FC<{ id: string; label: string; hint?: string; children: React.ReactNode }> = ({ id, label, hint, children }) => (
  <div>
    <label htmlFor={id} className="eyebrow block mb-1.5 text-fg-4">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-[11px] text-fg-5">{hint}</p>}
  </div>
);

const Text: React.FC<{
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  required?: boolean;
  mono?: boolean;
  list?: string[];
  inputRef?: React.Ref<HTMLInputElement>;
}> = ({ label, hint, value, onChange, type = 'text', min, max, required, mono, list, inputRef }) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <input
        id={id}
        ref={inputRef}
        type={type}
        min={min}
        max={max}
        required={required}
        value={value}
        list={list ? `${id}-list` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${INPUT} ${mono ? 'font-mono text-sm' : ''}`}
      />
      {list && (
        <datalist id={`${id}-list`}>
          {list.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </FieldShell>
  );
};

const Area: React.FC<{ label: string; hint?: string; value: string; onChange: (value: string) => void; rows: number }> = ({ label, hint, value, onChange, rows }) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <textarea id={id} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className={AREA} />
    </FieldShell>
  );
};

const Choice: React.FC<{ label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }> = ({ label, value, options, onChange }) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label}>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${INPUT} cursor-pointer`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
};

/** The exercises this one needs: chips to remove, and a search to add more. */
const Prerequisites: React.FC<{
  chosen: string[];
  all: RawExercise[];
  selfId: string;
  byId: Map<string, RawExercise>;
  onChange: (ids: string[]) => void;
}> = ({ chosen, all, selfId, byId, onChange }) => {
  const id = useId();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? all
        .filter((entry) => entry.id !== selfId && !chosen.includes(entry.id) && (entry.name.toLowerCase().includes(needle) || entry.id.toLowerCase().includes(needle)))
        .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
        .slice(0, 8)
    : [];

  return (
    <div className="flex flex-col gap-2.5">
      {chosen.length === 0 ? (
        <p className="text-[12px] text-fg-4">Nothing: it starts a line in the tree.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5" aria-label="Needs first">
          {chosen.map((need) => (
            <li key={need} className="list-none">
              <button
                type="button"
                onClick={() => onChange(chosen.filter((other) => other !== need))}
                aria-label={`Remove ${byId.get(need)?.name ?? need}`}
                className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-2 rounded-tag bg-ink-800 border border-ink-600 text-[12.5px] font-semibold text-fg-2 hover:text-fg cursor-pointer"
              >
                {byId.get(need)?.name ?? need}
                <span className="num text-fg-4">L{byId.get(need)?.level ?? '?'}</span>
                <X className="w-3.5 h-3.5 text-fg-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <label htmlFor={id} className="sr-only">
          Add a prerequisite
        </label>
        <input id={id} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Add one: search by name or id" className={INPUT} autoComplete="off" />
        {matches.length > 0 && (
          <ul className="mt-1.5 rounded-card bg-ink-950 border border-ink-700 overflow-hidden" aria-label="Matching exercises">
            {matches.map((entry) => (
              <li key={entry.id} className="list-none border-b border-ink-800 last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onChange([...chosen, entry.id]);
                    setQuery('');
                  }}
                  className="w-full flex items-center gap-2.5 h-10 px-3 text-left text-sm text-fg-2 hover:bg-ink-850 hover:text-fg cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-fg-4 shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{entry.name}</span>
                  <span className="num text-[12px] text-fg-4">L{entry.level}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
