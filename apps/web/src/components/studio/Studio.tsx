'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import savedProps from '../../data/propTuning.json';
import { useAccount } from '../../utils/accountStore';
import { ScreenHeader } from '../game/AppShell';
import { GearLook } from '../game/GearedFigure';
import { apparatusOf, stagesFor } from '../game/figureRig';
import type { NodeState } from '../game/kit';
import { PropChanges, withChanges } from '../game/propTuning';
import { PropTuningContext } from '../game/propTuningContext';
import type { FigureSpec, Pt } from '../skilltree/SkillFigure';
import { FigurePatch, SAVED_PATCHES, applyPatch, fingerprintOf } from '../skilltree/figureOverrides';
import { CATALOG, ENTRY_BY_ID, SOURCE_SNAPSHOT, TREE_LABEL, siblingsOf } from './catalog';
import { Finding, checkFigure, worstLevel } from './checks';
import { FigureBrowser, NO_FILTERS } from './FigureBrowser';
import { CodePanel, FixState, GearPanel, SelectionPanel, WarningsPanel } from './FigureInspector';
import { FigureStage, ViewOptions } from './FigureStage';
import { DragOptions, EditMode, PoseKey, diffPatch, handleAt, jointsOf, limbNames, moveHandle, poseOf, rigOf } from './geometry';
import { PropsSheet } from './PropsSheet';
import { Drafts, NO_DRAFTS, copyText, draftCount, fetchSources, loadDrafts, saveToRepo, storeDrafts } from './store';
import { Button, Segmented, Toggle } from './ui';
import { SCENE_LABEL } from '../skilltree/SkillFigure';

/**
 * The figure studio: every athlete figure in the app, playing, with its rig
 * and warnings, editable pose by pose; and every prop and worn piece on one
 * sheet, tunable. Open to anyone on a dev server and to the owner on the live
 * site. On a dev server "Save to the repo" writes the edits into the data
 * files; on the live site they stay in this browser and can be copied.
 */
export const Studio: React.FC = () => {
  const account = useAccount();
  const dev = process.env.NODE_ENV === 'development';
  if (dev || account.account?.role === 'admin') return <StudioReady dev={dev} />;
  return (
    <main className="w-full max-w-[720px] mx-auto px-4 pt-8 pb-10 flex flex-col gap-3">
      {account.status === 'loading' ? (
        <div className="h-40 rounded-card bg-ink-900 animate-pulse" aria-busy="true" aria-label="Loading" />
      ) : (
        <>
          <ScreenHeader eyebrow="Owner tools" title="Figure studio" />
          <p className="text-fg-3">The figure studio is for the owner of this Aura.</p>
        </>
      )}
    </main>
  );
};

type Tab = 'figures' | 'props';
type Draft = FigurePatch | null | undefined;

const StudioReady: React.FC<{ dev: boolean }> = ({ dev }) => {
  const [tab, setTab] = useState<Tab>('figures');
  const [drafts, setDrafts] = useState<Drafts>(NO_DRAFTS);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<{ figures: Record<string, FigurePatch>; props: PropChanges }>({ figures: SAVED_PATCHES, props: savedProps as PropChanges });
  const [sources, setSources] = useState(SOURCE_SNAPSHOT);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Drafts live in this browser: read once after hydration, so the server's render and the first one here agree.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setDrafts(loadDrafts());
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // #props opens the props sheet; a figure's id opens the figures.
    const follow = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'props') setTab('props');
      else if (ENTRY_BY_ID.has(hash)) setTab('figures');
    };
    follow();
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);
  useEffect(() => {
    if (loaded) storeDrafts(drafts);
  }, [drafts, loaded]);
  useEffect(() => {
    if (dev) void fetchSources().then((fresh) => fresh && setSources(fresh));
  }, [dev]);

  const tuning = useMemo(() => withChanges(drafts.props ?? saved.props), [drafts.props, saved.props]);
  const count = draftCount(drafts);

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await saveToRepo(drafts);
      setSaved(result);
      setDrafts(NO_DRAFTS);
      setStatus('Saved into apps/web/src/data (figureOverrides.json, propTuning.json). Commit them to ship.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Saving failed.');
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    const ok = await copyText(JSON.stringify(drafts, null, 2));
    setStatus(ok ? 'Every unsaved edit is on the clipboard, as JSON: paste it to a session to put it in the code.' : 'The clipboard is not available here.');
  };

  const setProps = useCallback((props: PropChanges | null) => setDrafts((d) => ({ ...d, props })), []);

  return (
    <PropTuningContext.Provider value={tuning}>
      <main className="w-full max-w-[1640px] mx-auto px-4 pt-5 lg:px-6 lg:pt-7 pb-10 flex flex-col gap-4">
        <ScreenHeader
          eyebrow="Owner tools"
          title="Figure studio"
          right={
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[12.5px] text-fg-3">{count ? `${count} unsaved` : 'Nothing unsaved'}</span>
              {dev ? (
                <Button primary onClick={save} disabled={!count || busy}>
                  {busy ? 'Saving…' : 'Save to the repo'}
                </Button>
              ) : (
                <Button primary onClick={copyAll} disabled={!count}>
                  Copy edits
                </Button>
              )}
            </div>
          }
        />
        {status && (
          <p role="status" className="flex items-start gap-3 text-[13px] text-fg-2 bg-ink-900 border border-ink-700 rounded-card px-3 py-2">
            <span className="flex-1">{status}</span>
            <button type="button" onClick={() => setStatus(null)} aria-label="Dismiss" className="text-fg-4 hover:text-fg cursor-pointer leading-none text-[16px]">
              ×
            </button>
          </p>
        )}
        {!dev && (
          <p className="text-[12.5px] text-fg-4">
            On the live site edits stay in this browser. Copy them and hand them to a session, or open the studio on a dev server to save them into the code.
          </p>
        )}
        <Segmented<Tab>
          label="Studio section"
          value={tab}
          onChange={(next) => {
            setTab(next);
            window.history.replaceState(null, '', next === 'props' ? '#props' : window.location.pathname);
          }}
          options={[
            { value: 'figures', label: `Figures · ${CATALOG.length}` },
            { value: 'props', label: 'Props and wear' },
          ]}
        />
        {tab === 'figures' ? (
          <FiguresTab drafts={drafts} setDrafts={setDrafts} saved={saved.figures} sources={sources} />
        ) : (
          <PropsSheet changes={drafts.props ?? saved.props} saved={saved.props} onChange={setProps} />
        )}
      </main>
    </PropTuningContext.Provider>
  );
};

/* ---------------- the figures ---------------- */

const findingsOf = new WeakMap<FigureSpec, Finding[]>();
const checked = (spec: FigureSpec) => {
  let found = findingsOf.get(spec);
  if (!found) {
    found = checkFigure(spec);
    findingsOf.set(spec, found);
  }
  return found;
};

/** The figure with its fix, cached per fix so unchanged figures keep the same drawing. */
const appliedOf = new Map<string, { patch: FigurePatch; spec: FigureSpec }>();
function effective(id: string, patch: Draft): FigureSpec {
  const built = ENTRY_BY_ID.get(id)!.asBuilt();
  if (!patch || patch.fingerprint !== fingerprintOf(built)) return built;
  const hit = appliedOf.get(id);
  if (hit && hit.patch === patch) return hit.spec;
  const spec = applyPatch(built, patch);
  appliedOf.set(id, { patch, spec });
  return spec;
}

const POSE_LABEL: Record<PoseKey, string> = { start: 'Start pose', end: 'End pose' };
const fmt = (p: Pt) => `${Math.round(p[0] * 10) / 10}, ${Math.round(p[1] * 10) / 10}`;

const FiguresTab: React.FC<{
  drafts: Drafts;
  setDrafts: React.Dispatch<React.SetStateAction<Drafts>>;
  saved: Record<string, FigurePatch>;
  sources: Record<string, import('./sources').FigureSource>;
}> = ({ drafts, setDrafts, saved, sources }) => {
  const [id, setId] = useState('ex_23');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [pose, setPose] = useState<PoseKey>('start');
  const [mode, setMode] = useState<EditMode>('joints');
  const [view, setView] = useState<ViewOptions>({ onion: true, rig: true, trails: true, marks: true });
  const [options, setOptions] = useState<DragOptions & { snap: boolean }>({ ik: true, carry: true, snap: true });
  const [selection, setSelection] = useState<string | null>(null);
  const [look, setLook] = useState<GearLook>({});
  const [tint, setTint] = useState<NodeState>('ready');
  const [history, setHistory] = useState<Record<string, { past: Draft[]; future: Draft[] }>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // A link to one figure (#ex_27) opens it, on arrival and when the address changes.
  useEffect(() => {
    const follow = () => {
      const fromHash = window.location.hash.slice(1);
      if (ENTRY_BY_ID.has(fromHash)) {
        setId(fromHash);
        setSelection(null);
        setPose('start');
      }
    };
    follow();
    window.addEventListener('hashchange', follow);
    return () => window.removeEventListener('hashchange', follow);
  }, []);

  const open = useCallback((next: string) => {
    setId(next);
    setSelection(null);
    setPose('start');
    window.history.replaceState(null, '', `#${next}`);
  }, []);

  /** The fix each figure is drawn with here: an unsaved edit, else the saved one. */
  const patchOf = useCallback((fid: string): Draft => (fid in drafts.figures ? drafts.figures[fid] : saved[fid]), [drafts.figures, saved]);
  const specOf = useCallback((fid: string) => effective(fid, patchOf(fid)), [patchOf]);

  const levels = useMemo(() => new Map(CATALOG.map((entry) => [entry.id, worstLevel(checked(specOf(entry.id)))])), [specOf]);
  const codes = useMemo(
    () => new Map(CATALOG.map((entry) => [entry.id, new Set(checked(specOf(entry.id)).filter((f) => f.level !== 'info').map((f) => f.code))])),
    [specOf],
  );
  const edited = useMemo(() => new Set([...Object.keys(saved), ...Object.keys(drafts.figures)].filter((fid) => patchOf(fid))), [saved, drafts.figures, patchOf]);

  const entry = ENTRY_BY_ID.get(id)!;
  const built = entry.asBuilt();
  const fingerprint = useMemo(() => fingerprintOf(built), [built]);
  const savedPatch = saved[id];
  const hasDraft = id in drafts.figures;
  const draft = drafts.figures[id];
  const current = specOf(id);
  const rig = useMemo(() => rigOf(built), [built]);
  const names = useMemo(() => (rig ? limbNames(rig, built) : []), [rig, built]);
  const savedFits = savedPatch && savedPatch.fingerprint === fingerprint ? savedPatch : undefined;
  const state: FixState = hasDraft ? (draft ? 'draft' : 'removed') : savedPatch ? (savedFits ? 'saved' : 'stale') : 'built';
  const patch = (hasDraft ? draft : savedFits) ?? null;
  const [note, setNote] = useState('');
  const [noteFor, setNoteFor] = useState<string | null>(null);
  if (noteFor !== id) {
    setNoteFor(id);
    setNote(patch?.note ?? '');
  }

  const findings = useMemo(() => {
    const extra: Finding[] = [];
    if (savedPatch && !savedFits) extra.push({ level: 'warn', code: 'stale', text: 'A saved fix was made on an older drawing of this figure. The builder changed since, so the app leaves the fix out. Redo it here, or delete it.' });
    if (draft && draft.fingerprint !== fingerprint) extra.push({ level: 'warn', code: 'stale', text: 'An unsaved edit in this browser was made on an older drawing, so it is left out.' });
    return [...extra, ...checked(current)];
  }, [current, savedPatch, savedFits, draft, fingerprint]);

  /* ---------- editing ---------- */

  const writeDraft = useCallback(
    (fid: string, value: Draft) =>
      setDrafts((d) => {
        const figures = { ...d.figures };
        if (value === undefined) delete figures[fid];
        else figures[fid] = value;
        return { ...d, figures };
      }),
    [setDrafts],
  );

  const currentDraft = (): Draft => (id in drafts.figures ? drafts.figures[id] : undefined);

  const remember = () =>
    setHistory((h) => ({ ...h, [id]: { past: [...(h[id]?.past ?? []), currentDraft()].slice(-100), future: [] } }));

  const edit = (next: FigureSpec, withNote = note) => {
    const value = diffPatch(built, next, fingerprint, withNote);
    if (!value) writeDraft(id, savedFits ? null : undefined);
    else if (savedFits && JSON.stringify(value) === JSON.stringify(savedFits)) writeDraft(id, undefined);
    else writeDraft(id, value);
  };
  const editOnce = (next: FigureSpec) => {
    remember();
    edit(next);
  };

  const undo = () => {
    const h = history[id];
    if (!h?.past.length) return;
    const previous = h.past[h.past.length - 1];
    setHistory({ ...history, [id]: { past: h.past.slice(0, -1), future: [currentDraft(), ...h.future] } });
    writeDraft(id, previous);
  };
  const redo = () => {
    const h = history[id];
    if (!h?.future.length) return;
    const [next, ...rest] = h.future;
    setHistory({ ...history, [id]: { past: [...h.past, currentDraft()], future: rest } });
    writeDraft(id, next);
  };

  // Keys: undo and redo, arrows nudge the selected handle, Escape lets go of it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (event.key === 'Escape') setSelection(null);
      const step = event.shiftKey ? 2 : 0.5;
      const delta: Record<string, Pt> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (selection && delta[event.key]) {
        event.preventDefault();
        const at = handleAt(current, rig, names, pose, selection);
        if (at) editOnce(moveHandle(current, rig, names, pose, selection, [at[0] + delta[event.key][0], at[1] + delta[event.key][1]], options));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const reshaping = Boolean(look.stage && stagesFor(current).includes(look.stage) && (look.stage === 'parallettes' || (look.stage === 'rings' && apparatusOf(current) === 'bar')));
  const locked = reshaping ? 'Editing is off: this stage moves the body (parallettes lift it, rings replace the bar). Pick the floor stage to edit.' : null;

  const siblings = useMemo(() => siblingsOf(id, sources), [id, sources]);

  const fixNote = () => {
    const source = sources[id];
    const lines = [`Figure fix: ${id} · ${entry.name} (${TREE_LABEL[entry.tree]})`];
    if (source) lines.push(`Built by ${source.call} at ${source.file}:${source.line}`);
    if (source?.family) lines.push(`Family ${source.family}: ${siblings.length + 1} figures`);
    if (note.trim()) lines.push(`What was wrong: ${note.trim()}`);
    lines.push('Changes:');
    const poses: PoseKey[] = current.motion ? ['start', 'end'] : ['start'];
    if (rig) {
      poses.forEach((key) => {
        const before = jointsOf(rig, names, poseOf(built, key));
        const after = jointsOf(rig, names, poseOf(current, key));
        before.forEach((joint, i) => {
          const now = after[i].at;
          if (Math.abs(now[0] - joint.at[0]) > 0.05 || Math.abs(now[1] - joint.at[1]) > 0.05) lines.push(`- ${POSE_LABEL[key]} · ${joint.label}: ${fmt(joint.at)} → ${fmt(now)}`);
        });
      });
    }
    const p = patch;
    if (p?.holds) Object.entries(p.holds).forEach(([i, at]) => lines.push(`- Hold ${i}: ${fmt(built.holds![Number(i)].at)} → ${fmt(at)}`));
    if (p?.wall) lines.push(`- Scenery: ${p.wall}`);
    lines.push('', 'Fix data:', JSON.stringify({ [id]: p }));
    return lines.join('\n');
  };

  const flash = async (text: string, what: string) => setCopied((await copyText(text)) ? what : 'The clipboard is not available here.');

  const h = history[id];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_340px] xl:grid-cols-[300px_minmax(0,1fr)_360px] gap-4 items-start">
      <aside className="order-3 lg:order-1 lg:sticky lg:top-4">
        <details open className="group lg:[&>summary]:hidden">
          <summary className="cursor-pointer text-[13px] font-bold text-fg-2 mb-2 lg:hidden">Every figure</summary>
          <FigureBrowser filters={filters} onFilters={setFilters} selected={id} onSelect={open} specOf={specOf} levels={levels} codes={codes} edited={edited} sources={sources} />
        </details>
      </aside>

      <section className="order-1 lg:order-2 flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display font-extrabold uppercase text-[26px] leading-none">{entry.name}</h2>
          <span className="text-[12.5px] text-fg-4">
            {id} · {TREE_LABEL[entry.tree]}
            {entry.level ? ` · level ${entry.level}` : ''} · {SCENE_LABEL[current.scene]}
            {current.motion ? ` · ${current.motion.seconds} s${current.motion.tempo === 'slow-return' ? ', slow there, quick back' : ''}` : ' · holds still'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Segmented<EditMode>
            label="Edit"
            value={mode}
            onChange={(next) => {
              setMode(next);
              setSelection(null);
            }}
            options={[
              { value: 'joints', label: 'Joints', disabled: !rig, title: rig ? undefined : 'No rig on this figure' },
              { value: 'points', label: 'Points' },
            ]}
          />
          <Toggle on={view.onion} onChange={(onion) => setView({ ...view, onion })} title="The other pose, dashed">
            Onion skin
          </Toggle>
          <Toggle on={view.rig} onChange={(rigOn) => setView({ ...view, rig: rigOn })} title="The joints gear is placed on">
            Rig
          </Toggle>
          <Toggle on={view.trails} onChange={(trails) => setView({ ...view, trails })} title="Where each hand and foot travels">
            Paths
          </Toggle>
          <Toggle on={view.marks} onChange={(marks) => setView({ ...view, marks })} title="Circle what the warnings point at">
            Marks
          </Toggle>
          <span className="w-px h-6 bg-ink-700 mx-0.5" />
          <Toggle on={options.ik} onChange={(ik) => setOptions({ ...options, ik })} title="Keep bone lengths: elbows and knees re-solve">
            Keep lengths
          </Toggle>
          <Toggle on={options.carry} onChange={(carry) => setOptions({ ...options, carry })} title="Plates, rings and straps move with the hand">
            Carry props
          </Toggle>
          <Toggle on={options.snap} onChange={(snap) => setOptions({ ...options, snap })} title="Snap hands to the bar or rings, feet to the floor, or to the other pose">
            Snap
          </Toggle>
        </div>
        <div className="max-w-[640px] w-full">
          <FigureStage
            spec={current}
            rig={rig}
            names={names}
            look={look}
            tint={tint}
            pose={pose}
            onPose={(next) => {
              setPose(next);
            }}
            mode={mode}
            view={view}
            options={options}
            selection={selection}
            onSelect={setSelection}
            findings={findings}
            locked={locked}
            onEditStart={remember}
            onEdit={(next) => edit(next)}
            onEditEnd={() => undefined}
            title={id}
          />
        </div>
      </section>

      <aside className="order-2 lg:order-3 flex flex-col gap-3 min-w-0">
        <SelectionPanel spec={current} rig={rig} names={names} pose={pose} mode={mode} selection={selection} options={options} onChange={editOnce} />
        <WarningsPanel
          findings={findings}
          onPick={(finding) => {
            if (finding.pose && current.motion) setPose(finding.pose);
          }}
        />
        <GearPanel spec={current} look={look} onLook={setLook} tint={tint} onTint={setTint} />
        <CodePanel
          id={id}
          source={sources[id]}
          siblings={siblings}
          state={state}
          note={note}
          onNote={(text) => {
            setNote(text);
            if (patch) edit(current, text);
          }}
          onOpen={open}
          canUndo={Boolean(h?.past.length)}
          canRedo={Boolean(h?.future.length)}
          onUndo={undo}
          onRedo={redo}
          onResetToBuilt={() => {
            remember();
            writeDraft(id, savedPatch ? null : undefined);
          }}
          onDiscardDraft={() => {
            remember();
            writeDraft(id, undefined);
          }}
          onCopyPatch={() => flash(JSON.stringify({ [id]: patch }, null, 2), 'The fix is on the clipboard.')}
          onCopyNote={() => flash(fixNote(), 'The fix note is on the clipboard.')}
          patch={patch}
        />
        {copied && <p className="text-[12.5px] text-fg-3">{copied}</p>}
      </aside>
    </div>
  );
};
