'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronRight, ExternalLink, Lightbulb, Play, Sparkles, Undo2, X } from 'lucide-react';
import {
  SkillGraph,
  SkillStatus,
  SkillSummary,
  TreeSkill,
  ancestorsOf,
  hasWrittenGuide,
  statusOf,
  tutorialSearchUrl,
  videoIdOf,
} from '../../utils/skillTree';
import { CheckIcon, CrownIcon, LockIcon, RouteIcon } from '../game/icons';
import { Meter } from '../game/kit';
import { SCENE_LABEL, SkillFigure } from './SkillFigure';
import { SkillTreeDef, laneThemeOf } from './skillTrees';

const UP_NEXT_LIMIT = 8;

interface SkillPanelProps {
  tree: SkillTreeDef;
  graph: SkillGraph;
  mastered: ReadonlySet<string>;
  summary: SkillSummary;
  selected: TreeSkill | null;
  pathTargetId: string | null;
  /** On small screens the panel is a sheet; this says whether it is showing. */
  open: boolean;
  /** Skills up to the tree's basics level not mastered yet. */
  basicsRemaining: number;
  onGoTo: (id: string) => void;
  onBack: () => void;
  onClose: () => void;
  onToggleMastered: (id: string) => void;
  onTogglePath: (id: string) => void;
  onShowReady: () => void;
  onLaneFilter: (lane: string) => void;
  onSkipBasics: () => void;
  onReset: () => void;
}

export const SkillPanel: React.FC<SkillPanelProps> = (props) => {
  const { tree, selected, open, onClose } = props;

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 z-[45] bg-[var(--scrim)] anim-fade" onClick={onClose} aria-hidden />}

      <aside
        aria-label={selected ? `${capitalise(tree.noun.one)} details` : 'Your progress'}
        className={`${
          open ? 'flex' : 'hidden'
        } lg:flex flex-col fixed lg:static inset-x-0 bottom-0 z-50 lg:z-auto w-full lg:w-[380px] lg:shrink-0 max-h-[88dvh] lg:max-h-none lg:h-full rounded-t-card lg:rounded-none lg:border-l border-ink-700 bg-ink-900 lift-shadow lg:shadow-none anim-sheet lg:animate-none`}
      >
        <div className="lg:hidden flex justify-center pt-2.5 pb-1" aria-hidden>
          <span className="w-10 h-1 rounded-[2px] bg-ink-600" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {selected ? <DetailView key={selected.id} {...props} exercise={selected} /> : <ProgressView {...props} />}
        </div>
      </aside>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Nothing selected: where you stand and what to train next            */
/* ------------------------------------------------------------------ */

const ProgressView: React.FC<SkillPanelProps> = ({
  tree,
  summary,
  basicsRemaining,
  onGoTo,
  onClose,
  onShowReady,
  onLaneFilter,
  onSkipBasics,
  onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const upNext = summary.ready.slice(0, UP_NEXT_LIMIT);
  const basics = tree.levelRange(tree.rules.bands[0]?.min ?? 0, tree.basicsMax);

  return (
    <div className="p-5 space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-fg-4">Your {tree.label.toLowerCase()} progress</p>
          <h2 className="mt-1 font-display font-extrabold uppercase text-[26px] leading-none text-fg">{summary.rank}</h2>
          <p className="text-[13px] text-fg-4 mt-1.5">
            <span className="num font-bold text-[15px] text-fg">{summary.mastered}</span> of {summary.total} mastered ·{' '}
            <span className="num font-bold text-[15px] text-earned">{summary.xp.toLocaleString()} XP</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="lg:hidden flex items-center justify-center w-10 h-10 -mr-2 -mt-1 rounded-card text-fg-4 hover:text-fg hover:bg-ink-850 active:scale-[.97] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {summary.nextRank && (
        <div>
          <div className="flex justify-between text-xs text-fg-4 mb-1.5">
            <span>
              Next rank: <strong className="text-fg-2">{summary.nextRank.title}</strong>
            </span>
            <span>
              <span className="num font-bold text-[14px] text-fg-2">{summary.nextRank.remaining}</span> to go
            </span>
          </div>
          <Meter value={summary.nextRank.progress} tone="earned" className="h-1.5" label="Progress to the next rank" />
        </div>
      )}

      <section aria-label="Branches">
        <ul className="space-y-1.5">
          {summary.lanes.map((lane) => {
            const theme = laneThemeOf(tree, lane.lane);
            return (
              <li key={lane.lane}>
                <button
                  type="button"
                  onClick={() => onLaneFilter(lane.lane)}
                  title={`Show only ${theme.label}`}
                  className="block w-full p-3 rounded-card bg-ink-850 hover:bg-ink-800 text-left active:scale-[.97] transition cursor-pointer"
                >
                  <span className="flex items-center justify-between gap-2 mb-2">
                    <span className={`eyebrow flex items-center gap-1.5 ${theme.text}`}>
                      {theme.icon}
                      {theme.label}
                    </span>
                    <span className="num font-bold text-[14px] text-fg-4">
                      <span className="text-fg-2">{lane.mastered}</span>/{lane.total}
                      {lane.ready > 0 && <span className="ml-2 text-act">{lane.ready} ready</span>}
                    </span>
                  </span>
                  {/* Spans, not the Meter's divs: this sits inside a button. */}
                  <span className="block h-1.5 rounded-[1px] bg-ink-700 overflow-hidden">
                    <span
                      className="block h-full bg-earned transition-[width] duration-500"
                      style={{ width: `${lane.total ? (lane.mastered / lane.total) * 100 : 0}%` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="up-next-heading">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 id="up-next-heading" className="eyebrow text-fg-4">
            Up next
          </h3>
          <span className="text-xs text-fg-4">
            <span className="num font-bold text-[14px] text-fg-2">{summary.ready.length}</span> ready
          </span>
        </div>
        <p className="text-xs text-fg-4 mb-3">Unlocked and waiting for you — easiest first.</p>

        {upNext.length === 0 ? (
          <p className="p-3 rounded-card bg-ink-850 text-xs text-fg-4">
            Nothing is waiting: everything you have unlocked is mastered.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {upNext.map((exercise) => (
              <li key={exercise.id}>
                <ExerciseRow tree={tree} exercise={exercise} status="ready" onClick={() => onGoTo(exercise.id)} />
              </li>
            ))}
          </ul>
        )}

        {summary.ready.length > UP_NEXT_LIMIT && (
          <button
            type="button"
            onClick={onShowReady}
            className="mt-2 w-full h-11 rounded-card border border-ink-600 text-fg text-[13px] font-bold hover:bg-ink-850 active:scale-[.97] transition cursor-pointer"
          >
            Show all {summary.ready.length} on the tree
          </button>
        )}
      </section>

      {summary.mastered === 0 && (
        <p className="p-3 rounded-card bg-ink-850 text-xs text-fg-2 leading-relaxed">
          <strong className="text-fg">New here?</strong> Pick anything marked Ready, learn it, and mark it mastered
          when you meet its standard. That unlocks the next step in its progression.
        </p>
      )}

      <section aria-label="Manage progress" className="pt-4 border-t border-ink-700 space-y-2">
        {basicsRemaining > 0 &&
          (confirmSkip ? (
            <Confirm
              message={`Mark all ${basicsRemaining} remaining ${basics} ${tree.noun.many} as mastered?`}
              confirmLabel="Yes, mark them"
              onConfirm={() => {
                setConfirmSkip(false);
                onSkipBasics();
              }}
              onCancel={() => setConfirmSkip(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setConfirmSkip(true)}
              className="w-full h-11 rounded-card border border-ink-600 text-fg text-[13px] font-bold hover:bg-ink-850 active:scale-[.97] transition cursor-pointer"
            >
              I already own the basics ({basics})
            </button>
          ))}

        {summary.mastered > 0 &&
          (confirmReset ? (
            <Confirm
              message={`Clear every mastered ${tree.noun.one} in this tree on this device?`}
              confirmLabel="Yes, reset"
              danger
              onConfirm={() => {
                setConfirmReset(false);
                onReset();
              }}
              onCancel={() => setConfirmReset(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full h-11 rounded-card text-[13px] font-bold text-fg-4 hover:text-boss active:scale-[.97] transition cursor-pointer"
            >
              Reset progress
            </button>
          ))}
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* An exercise is selected                                             */
/* ------------------------------------------------------------------ */

const DetailView: React.FC<SkillPanelProps & { exercise: TreeSkill }> = ({
  tree,
  graph,
  mastered,
  exercise,
  pathTargetId,
  onGoTo,
  onBack,
  onClose,
  onToggleMastered,
  onTogglePath,
}) => {
  const heading = useRef<HTMLHeadingElement>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  // Selecting a card moves reading (and screen-reader) focus to its details.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const status = statusOf(exercise, mastered);
  const theme = laneThemeOf(tree, exercise.swimlane);
  const prerequisites = exercise.prerequisites.map((id) => graph.byId.get(id)).filter((entry): entry is TreeSkill => Boolean(entry));
  const unlocks = (graph.children.get(exercise.id) ?? []).map((id) => graph.byId.get(id)).filter((entry): entry is TreeSkill => Boolean(entry));
  const ancestors = ancestorsOf(graph, exercise.id);
  const stepsBefore = [...ancestors].filter((id) => !mastered.has(id)).length;
  const missing = prerequisites.filter((entry) => !mastered.has(entry.id));
  const videoId = videoIdOf(exercise);
  const onPath = pathTargetId === exercise.id;
  const figure = tree.figureFor?.(exercise.id);
  const summaryLine = 'summary' in exercise && typeof exercise.summary === 'string' ? exercise.summary : null;

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 h-10 -ml-2 px-2 rounded-card text-[13px] font-bold text-fg-4 hover:text-fg hover:bg-ink-850 active:scale-[.97] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Progress
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex items-center justify-center w-10 h-10 -mr-2 rounded-card text-fg-4 hover:text-fg hover:bg-ink-850 active:scale-[.97] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <header>
        <p className="eyebrow flex flex-wrap items-center gap-x-2 gap-y-1 text-fg-4">
          <span className={`flex items-center gap-1 ${theme.text}`}>
            {theme.icon}
            {theme.label}
          </span>
          <span className="text-fg-5">·</span>
          <span>{exercise.subCategory}</span>
          <span className="text-fg-5">·</span>
          <span>{tree.levelName(exercise.level)}</span>
          {exercise.proStatus && (
            <span className="flex items-center gap-1 text-fg-2">
              <CrownIcon className="w-3.5 h-3.5" />
              Pro
            </span>
          )}
        </p>
        <h2 ref={heading} tabIndex={-1} className="mt-2 font-display font-extrabold uppercase text-[26px] leading-none text-fg outline-none">
          {exercise.name}
        </h2>
        {summaryLine && <p className="mt-1.5 text-sm text-fg-3 leading-relaxed">{summaryLine}</p>}
      </header>

      {figure && (
        <figure className="relative mx-auto w-full max-w-[280px] rounded-card bg-ink-850 overflow-hidden">
          <SkillFigure
            spec={figure}
            accent={theme.hex}
            animate
            title={`Illustration of ${exercise.name}`}
            className="block w-full aspect-square"
          />
          <figcaption className="eyebrow absolute left-3 top-3 px-2 py-0.5 rounded-tag bg-ink-900 text-fg-4">
            {SCENE_LABEL[figure.scene]}
          </figcaption>
        </figure>
      )}

      {/* Status and the one thing to do about it */}
      {status === 'ready' && (
        <div className="p-4 rounded-card bg-ink-850 space-y-3">
          <p className="eyebrow flex items-center gap-2 text-act">
            <Sparkles className="w-4 h-4" />
            Ready to train
          </p>
          <Standard text={exercise.unlockRequirements} />
          <button
            type="button"
            onClick={() => onToggleMastered(exercise.id)}
            className="w-full h-12 rounded-card bg-earned text-earned-deep font-display font-extrabold uppercase text-lg tracking-[0.02em] active:scale-[.97] transition cursor-pointer"
          >
            Mark as mastered · +{exercise.xpReward} XP
          </button>
        </div>
      )}

      {status === 'locked' && (
        <div className="p-4 rounded-card bg-ink-850 space-y-3">
          <p className="eyebrow flex items-center gap-2 text-fg-3">
            <LockIcon className="w-4 h-4" />
            Locked · master {missing.length === 1 ? 'this' : `these ${missing.length}`} first
          </p>
          <ul className="space-y-1.5">
            {missing.map((entry) => (
              <li key={entry.id}>
                <ExerciseRow tree={tree} exercise={entry} status={statusOf(entry, mastered)} raised onClick={() => onGoTo(entry.id)} />
              </li>
            ))}
          </ul>
          <Standard text={exercise.unlockRequirements} />
          <button
            type="button"
            onClick={() => onToggleMastered(exercise.id)}
            className="w-full min-h-11 px-3 py-2 rounded-card border border-ink-600 text-fg text-[13px] font-bold hover:bg-ink-800 active:scale-[.97] transition cursor-pointer"
          >
            I can already do this — mark it and the {stepsBefore} {stepsBefore === 1 ? 'step' : 'steps'} before it as mastered
          </button>
        </div>
      )}

      {status === 'mastered' && (
        <div className="p-4 rounded-card bg-earned-deep space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow flex items-center gap-2 text-earned-soft">
              <CheckIcon className="w-4 h-4" strokeWidth={3} />
              Mastered · +{exercise.xpReward} XP
            </p>
            <button
              type="button"
              onClick={() => onToggleMastered(exercise.id)}
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-card border border-earned-line text-earned-soft text-xs font-bold hover:border-earned-dim active:scale-[.97] transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
          </div>
          <Standard text={exercise.unlockRequirements} />
        </div>
      )}

      {ancestors.size > 0 && (
        <button
          type="button"
          onClick={() => onTogglePath(exercise.id)}
          aria-pressed={onPath}
          className={`relative flex items-center gap-3 w-full p-3 rounded-card text-left active:scale-[.97] transition cursor-pointer ${
            onPath ? 'bg-ink-800' : 'bg-ink-850 hover:bg-ink-800'
          }`}
        >
          {onPath && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-[2px] bg-act" aria-hidden />}
          <RouteIcon className={`w-5 h-5 shrink-0 ${onPath ? 'text-act' : 'text-fg-4'}`} />
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-bold text-fg">{onPath ? 'Showing the path to this' : 'Show the path to this'}</span>
            <span className="block text-xs text-fg-4">
              {ancestors.size} {ancestors.size === 1 ? `${tree.noun.one} leads` : `${tree.noun.many} lead`} here
              {stepsBefore > 0 ? ` · ${stepsBefore} still to master` : ' · all mastered'}
            </span>
          </span>
          <span className={`eyebrow ${onPath ? 'text-fg' : 'text-fg-4'}`}>{onPath ? 'On' : 'Off'}</span>
        </button>
      )}

      {status !== 'locked' && (
        <Section title={`Comes after (${prerequisites.length})`}>
          {prerequisites.length === 0 ? (
            <p className="text-xs text-fg-4">Nothing — this is a starting point.</p>
          ) : (
            <ul className="space-y-1.5">
              {prerequisites.map((entry) => (
                <li key={entry.id}>
                  <ExerciseRow tree={tree} exercise={entry} status={statusOf(entry, mastered)} onClick={() => onGoTo(entry.id)} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title={`Unlocks next (${unlocks.length})`}>
        {unlocks.length === 0 ? (
          <p className="text-xs text-fg-4">Nothing further — this is the end of its progression.</p>
        ) : (
          <ul className="space-y-1.5">
            {unlocks.map((entry) => (
              <li key={entry.id}>
                <ExerciseRow tree={tree} exercise={entry} status={statusOf(entry, mastered)} onClick={() => onGoTo(entry.id)} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="How to do it">
        {hasWrittenGuide(exercise) ? (
          <ol className="space-y-2">
            {exercise.description.map((step, index) => (
              <li key={index} className="flex gap-2.5 text-sm text-fg-2 leading-relaxed">
                <span className="flex items-center justify-center w-6 h-6 rounded-tag bg-ink-850 num font-bold text-[13px] text-fg shrink-0">
                  {index + 1}
                </span>
                <span>{step.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-fg-4">No written guide for this one yet — the tutorial below is the best place to learn it.</p>
        )}

        {exercise.expertTip && (
          <p className="mt-3 flex gap-2.5 p-3 rounded-card bg-ink-850 text-sm text-fg-2 leading-relaxed">
            <Lightbulb className="w-4 h-4 mt-0.5 text-act shrink-0" />
            <span>{exercise.expertTip}</span>
          </p>
        )}
      </Section>

      <Section title="Tutorial">
        {videoId ? (
          videoOpen ? (
            <div className="aspect-video rounded-card overflow-hidden bg-ink-950">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                title={`${exercise.name} tutorial`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              aria-label={`Play the ${exercise.name} tutorial`}
              className="group relative flex items-center justify-center w-full aspect-video rounded-card overflow-hidden bg-ink-950 bg-cover bg-center active:scale-[.97] transition cursor-pointer"
              style={{ backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)` }}
            >
              <span className="absolute inset-0 bg-[var(--scrim)] group-hover:opacity-70 transition" />
              <span className="relative flex items-center justify-center w-14 h-14 rounded-card bg-act text-act-deep">
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
              </span>
            </button>
          )
        ) : (
          <a
            href={tutorialSearchUrl(exercise, tree.tutorialTopic)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 min-h-11 px-3 py-2 rounded-card border border-ink-600 text-fg text-[13px] font-bold hover:bg-ink-850 active:scale-[.97] transition"
          >
            Find a tutorial on YouTube
            <ExternalLink className="w-4 h-4 text-fg-3 shrink-0" />
          </a>
        )}
      </Section>

      <Section title="Trains">
        <ul className="flex flex-wrap gap-1.5">
          {exercise.musclesTargeted.map((muscle) => (
            <li key={muscle} className="flex items-center h-7 px-2 rounded-tag bg-ink-850 text-xs font-semibold text-fg-3">
              {muscle}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="pt-4 border-t border-ink-700">
    <h3 className="eyebrow mb-2.5 text-fg-4">{title}</h3>
    {children}
  </section>
);

/** What it takes to call the exercise mastered. */
const Standard: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm text-fg-2 leading-relaxed">
    <span className="eyebrow block text-fg-4 mb-1">Mastered when</span>
    {text}
  </p>
);

/** The same marks as the nodes on the board: gold once mastered, a chalk outline when ready, dashed while locked. */
const ROW_STATUS: Record<SkillStatus, { icon: React.ReactNode; tone: string }> = {
  mastered: { icon: <CheckIcon className="w-3.5 h-3.5" strokeWidth={3} />, tone: 'bg-earned-deep text-earned-soft' },
  ready: { icon: <Sparkles className="w-3.5 h-3.5" />, tone: 'border border-act text-act' },
  locked: { icon: <LockIcon className="w-3.5 h-3.5" />, tone: 'border border-dashed border-ink-500 text-fg-4' },
};

const ExerciseRow: React.FC<{
  tree: SkillTreeDef;
  exercise: TreeSkill;
  status: SkillStatus;
  /** On a card already: one step lighter, so the row still reads as its own surface. */
  raised?: boolean;
  onClick: () => void;
}> = ({ tree, exercise, status, raised = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 w-full min-h-11 px-2.5 py-2 rounded-card text-left active:scale-[.97] transition cursor-pointer ${
      raised ? 'bg-ink-800 hover:bg-ink-750' : 'bg-ink-850 hover:bg-ink-800'
    }`}
  >
    <span className={`flex items-center justify-center w-7 h-7 rounded-tag shrink-0 ${ROW_STATUS[status].tone}`}>
      {ROW_STATUS[status].icon}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-bold text-fg truncate">{exercise.name}</span>
      <span className="block text-[11px] text-fg-4 truncate">
        {tree.levelName(exercise.level)} · {exercise.subCategory}
      </span>
    </span>
    <span className="shrink-0 text-fg-4" aria-hidden>
      {laneThemeOf(tree, exercise.swimlane).icon}
    </span>
    <ChevronRight className="w-4 h-4 text-fg-5 shrink-0" />
  </button>
);

interface ConfirmProps {
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const Confirm: React.FC<ConfirmProps> = ({ message, confirmLabel, danger, onConfirm, onCancel }) => (
  <div className="p-3 rounded-card bg-ink-850 space-y-3">
    <p className="text-[13px] text-fg-2">{message}</p>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onConfirm}
        className={`flex-1 h-11 rounded-card active:scale-[.97] transition cursor-pointer ${
          danger
            ? 'border border-ink-600 text-boss text-[13px] font-bold hover:bg-ink-800'
            : 'bg-act text-act-deep font-display font-extrabold uppercase text-base tracking-[0.02em]'
        }`}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 h-11 rounded-card border border-ink-600 text-fg text-[13px] font-bold hover:bg-ink-800 active:scale-[.97] transition cursor-pointer"
      >
        Cancel
      </button>
    </div>
  </div>
);

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
