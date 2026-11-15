'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Crown,
  ExternalLink,
  Lightbulb,
  Lock,
  Play,
  Route,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react';
import { Exercise, Swimlane } from '@aura/types';
import {
  SkillGraph,
  SkillStatus,
  SkillSummary,
  ancestorsOf,
  hasWrittenGuide,
  statusOf,
  tutorialSearchUrl,
  videoIdOf,
} from '../../utils/skillTree';
import { LANE_THEME } from './laneTheme';

const UP_NEXT_LIMIT = 8;

interface SkillPanelProps {
  graph: SkillGraph;
  mastered: ReadonlySet<string>;
  summary: SkillSummary;
  selected: Exercise | null;
  pathTargetId: string | null;
  /** On small screens the panel is a sheet; this says whether it is showing. */
  open: boolean;
  /** Level 1–3 exercises not mastered yet. */
  basicsRemaining: number;
  onGoTo: (id: string) => void;
  onBack: () => void;
  onClose: () => void;
  onToggleMastered: (id: string) => void;
  onTogglePath: (id: string) => void;
  onShowReady: () => void;
  onLaneFilter: (lane: Swimlane) => void;
  onSkipBasics: () => void;
  onReset: () => void;
}

export const SkillPanel: React.FC<SkillPanelProps> = (props) => {
  const { selected, open, onClose } = props;

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 z-30 bg-black/60" onClick={onClose} aria-hidden />}

      <aside
        aria-label={selected ? 'Exercise details' : 'Your progress'}
        className={`${
          open ? 'flex' : 'hidden'
        } lg:flex flex-col fixed lg:static inset-x-0 bottom-0 z-40 lg:z-auto w-full lg:w-[380px] lg:shrink-0 max-h-[84dvh] lg:max-h-none lg:h-full rounded-t-3xl lg:rounded-none border-t lg:border-t-0 lg:border-l border-slate-800 bg-dark-900 shadow-2xl lg:shadow-none`}
      >
        <div className="lg:hidden flex justify-center pt-2.5 pb-1" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-slate-700" />
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

  return (
    <div className="p-5 space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your progress</p>
          <h2 className="text-xl font-black text-white tracking-tight">{summary.rank}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className="font-mono font-bold text-white">{summary.mastered}</span> of {summary.total} mastered ·{' '}
            <span className="font-mono font-bold text-neon-gold">{summary.xp.toLocaleString()} XP</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="lg:hidden flex items-center justify-center w-10 h-10 -mr-2 -mt-1 rounded-xl text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {summary.nextRank && (
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
            <span>
              Next rank: <strong className="text-slate-200">{summary.nextRank.title}</strong>
            </span>
            <span className="font-mono">{summary.nextRank.remaining} to go</span>
          </div>
          <Bar value={summary.nextRank.progress} bar="from-amber-500 to-neon-gold" />
        </div>
      )}

      <section aria-label="Branches">
        <ul className="space-y-1.5">
          {summary.lanes.map((lane) => {
            const theme = LANE_THEME[lane.lane];
            return (
              <li key={lane.lane}>
                <button
                  type="button"
                  onClick={() => onLaneFilter(lane.lane)}
                  title={`Show only ${theme.label}`}
                  className="w-full p-2.5 rounded-xl bg-dark-950/60 border border-slate-800 hover:border-slate-600 text-left transition cursor-pointer"
                >
                  <span className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${theme.text}`}>
                      {theme.icon}
                      {theme.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      <span className="font-bold text-slate-200">{lane.mastered}</span>/{lane.total}
                      {lane.ready > 0 && <span className="ml-2 font-bold text-neon-cyan">{lane.ready} ready</span>}
                    </span>
                  </span>
                  <Bar value={lane.total ? lane.mastered / lane.total : 0} bar={theme.bar} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="up-next-heading">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 id="up-next-heading" className="text-sm font-black text-white">
            Up next
          </h3>
          <span className="text-[11px] font-mono text-slate-500">{summary.ready.length} ready</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">Unlocked and waiting for you — easiest first.</p>

        {upNext.length === 0 ? (
          <p className="p-3 rounded-xl bg-dark-950/60 border border-slate-800 text-xs text-slate-400">
            Nothing is waiting: everything you have unlocked is mastered.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {upNext.map((exercise) => (
              <li key={exercise.id}>
                <ExerciseRow exercise={exercise} status="ready" onClick={() => onGoTo(exercise.id)} />
              </li>
            ))}
          </ul>
        )}

        {summary.ready.length > UP_NEXT_LIMIT && (
          <button
            type="button"
            onClick={onShowReady}
            className="mt-2 w-full h-10 rounded-xl text-xs font-bold text-neon-cyan border border-cyan-500/30 hover:bg-cyan-950/40 transition cursor-pointer"
          >
            Show all {summary.ready.length} on the tree
          </button>
        )}
      </section>

      {summary.mastered === 0 && (
        <p className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed">
          <strong className="text-neon-cyan">New here?</strong> Pick anything marked Ready, learn it, and mark it mastered
          when you meet its standard. That unlocks the next step in its progression.
        </p>
      )}

      <section aria-label="Manage progress" className="pt-4 border-t border-slate-800 space-y-2">
        {basicsRemaining > 0 &&
          (confirmSkip ? (
            <Confirm
              message={`Mark all ${basicsRemaining} remaining Level 1–3 exercises as mastered?`}
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
              className="w-full h-10 rounded-xl text-xs font-bold text-slate-300 border border-slate-800 hover:border-slate-600 transition cursor-pointer"
            >
              I already own the basics (Levels 1–3)
            </button>
          ))}

        {summary.mastered > 0 &&
          (confirmReset ? (
            <Confirm
              message="Clear every mastered exercise on this device?"
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
              className="w-full h-10 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-300 transition cursor-pointer"
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

const DetailView: React.FC<SkillPanelProps & { exercise: Exercise }> = ({
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
  const theme = LANE_THEME[exercise.swimlane];
  const prerequisites = exercise.prerequisites.map((id) => graph.byId.get(id)).filter((entry): entry is Exercise => Boolean(entry));
  const unlocks = (graph.children.get(exercise.id) ?? []).map((id) => graph.byId.get(id)).filter((entry): entry is Exercise => Boolean(entry));
  const ancestors = ancestorsOf(graph, exercise.id);
  const stepsBefore = [...ancestors].filter((id) => !mastered.has(id)).length;
  const missing = prerequisites.filter((entry) => !mastered.has(entry.id));
  const videoId = videoIdOf(exercise);
  const onPath = pathTargetId === exercise.id;

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 h-10 -ml-2 px-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Progress
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex items-center justify-center w-10 h-10 -mr-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <header>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold">
          <span className={`flex items-center gap-1 uppercase tracking-wider ${theme.text}`}>
            {theme.icon}
            {theme.label}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300">{exercise.subCategory}</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-300">Level {exercise.level}</span>
          {exercise.proStatus && (
            <span className="flex items-center gap-1 text-neon-gold">
              <Crown className="w-3 h-3" />
              Pro
            </span>
          )}
        </p>
        <h2 ref={heading} tabIndex={-1} className="mt-1.5 text-xl font-black text-white tracking-tight outline-none">
          {exercise.name}
        </h2>
      </header>

      {/* Status and the one thing to do about it */}
      {status === 'ready' && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neon-cyan">
            <Sparkles className="w-4 h-4" />
            Ready to train
          </p>
          <Standard text={exercise.unlockRequirements} />
          <button
            type="button"
            onClick={() => onToggleMastered(exercise.id)}
            className="w-full h-11 rounded-xl bg-neon-cyan text-dark-950 text-sm font-black hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
          >
            Mark as mastered · +{exercise.xpReward} XP
          </button>
        </div>
      )}

      {status === 'locked' && (
        <div className="p-3.5 rounded-2xl bg-dark-950/70 border border-slate-700 space-y-3">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
            <Lock className="w-4 h-4" />
            Locked · master {missing.length === 1 ? 'this' : `these ${missing.length}`} first
          </p>
          <ul className="space-y-1.5">
            {missing.map((entry) => (
              <li key={entry.id}>
                <ExerciseRow exercise={entry} status={statusOf(entry, mastered)} onClick={() => onGoTo(entry.id)} />
              </li>
            ))}
          </ul>
          <Standard text={exercise.unlockRequirements} />
          <button
            type="button"
            onClick={() => onToggleMastered(exercise.id)}
            className="w-full min-h-10 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 hover:border-slate-500 transition cursor-pointer"
          >
            I can already do this — mark it and the {stepsBefore} {stepsBefore === 1 ? 'step' : 'steps'} before it as mastered
          </button>
        </div>
      )}

      {status === 'mastered' && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300">
              <Check className="w-4 h-4" strokeWidth={3} />
              Mastered · +{exercise.xpReward} XP
            </p>
            <button
              type="button"
              onClick={() => onToggleMastered(exercise.id)}
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition cursor-pointer"
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
          className={`flex items-center gap-3 w-full p-3 rounded-xl border text-left transition cursor-pointer ${
            onPath ? 'bg-cyan-950/40 border-cyan-500/50' : 'bg-dark-950/60 border-slate-800 hover:border-slate-600'
          }`}
        >
          <Route className={`w-4 h-4 shrink-0 ${onPath ? 'text-neon-cyan' : 'text-slate-400'}`} />
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-white">{onPath ? 'Showing the path to this' : 'Show the path to this'}</span>
            <span className="block text-[11px] text-slate-400">
              {ancestors.size} {ancestors.size === 1 ? 'exercise leads' : 'exercises lead'} here
              {stepsBefore > 0 ? ` · ${stepsBefore} still to master` : ' · all mastered'}
            </span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{onPath ? 'On' : 'Off'}</span>
        </button>
      )}

      {status !== 'locked' && (
        <Section title={`Comes after (${prerequisites.length})`}>
          {prerequisites.length === 0 ? (
            <p className="text-xs text-slate-400">Nothing — this is a starting point.</p>
          ) : (
            <ul className="space-y-1.5">
              {prerequisites.map((entry) => (
                <li key={entry.id}>
                  <ExerciseRow exercise={entry} status={statusOf(entry, mastered)} onClick={() => onGoTo(entry.id)} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title={`Unlocks next (${unlocks.length})`}>
        {unlocks.length === 0 ? (
          <p className="text-xs text-slate-400">Nothing further — this is the end of its progression.</p>
        ) : (
          <ul className="space-y-1.5">
            {unlocks.map((entry) => (
              <li key={entry.id}>
                <ExerciseRow exercise={entry} status={statusOf(entry, mastered)} onClick={() => onGoTo(entry.id)} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="How to do it">
        {hasWrittenGuide(exercise) ? (
          <ol className="space-y-2">
            {exercise.description.map((step, index) => (
              <li key={index} className="flex gap-2.5 text-sm text-slate-200 leading-relaxed">
                <span className="flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-dark-700 text-[11px] font-mono font-bold text-neon-cyan shrink-0">
                  {index + 1}
                </span>
                <span>{step.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-400">No written guide for this one yet — the tutorial below is the best place to learn it.</p>
        )}

        {exercise.expertTip && (
          <p className="mt-3 flex gap-2.5 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-sm text-amber-100 leading-relaxed">
            <Lightbulb className="w-4 h-4 mt-0.5 text-neon-gold shrink-0" />
            <span>{exercise.expertTip}</span>
          </p>
        )}
      </Section>

      <Section title="Tutorial">
        {videoId ? (
          videoOpen ? (
            <div className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
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
              className="group relative flex items-center justify-center w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-dark-950 bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)` }}
            >
              <span className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition" />
              <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white/95 text-dark-950">
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
              </span>
            </button>
          )
        ) : (
          <a
            href={tutorialSearchUrl(exercise)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 min-h-11 px-3 py-2 rounded-xl bg-dark-950/60 border border-slate-800 hover:border-slate-600 text-xs font-bold text-slate-200 transition"
          >
            Find a tutorial on YouTube
            <ExternalLink className="w-4 h-4 text-neon-cyan shrink-0" />
          </a>
        )}
      </Section>

      <Section title="Trains">
        <ul className="flex flex-wrap gap-1.5">
          {exercise.musclesTargeted.map((muscle) => (
            <li key={muscle} className="px-2 py-1 rounded-lg bg-dark-950/60 border border-slate-800 text-[11px] text-slate-300">
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
  <section>
    <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
    {children}
  </section>
);

/** What it takes to call the exercise mastered. */
const Standard: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm text-slate-200 leading-relaxed">
    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Mastered when</span>
    {text}
  </p>
);

const Bar: React.FC<{ value: number; bar: string }> = ({ value, bar }) => (
  <span className="block h-1.5 rounded-full bg-dark-950 border border-slate-800 overflow-hidden">
    <span
      className={`block h-full rounded-full bg-gradient-to-r ${bar} transition-[width] duration-500`}
      style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
    />
  </span>
);

const ROW_STATUS: Record<SkillStatus, { icon: React.ReactNode; tone: string }> = {
  mastered: { icon: <Check className="w-3.5 h-3.5" strokeWidth={3} />, tone: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40' },
  ready: { icon: <Sparkles className="w-3.5 h-3.5" />, tone: 'text-neon-cyan border-cyan-500/40 bg-cyan-950/40' },
  locked: { icon: <Lock className="w-3.5 h-3.5" />, tone: 'text-slate-500 border-slate-700 bg-dark-950' },
};

const ExerciseRow: React.FC<{ exercise: Exercise; status: SkillStatus; onClick: () => void }> = ({ exercise, status, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-3 w-full min-h-11 px-2.5 py-2 rounded-xl bg-dark-950/60 border border-slate-800 hover:border-slate-600 text-left transition cursor-pointer"
  >
    <span className={`flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 ${ROW_STATUS[status].tone}`}>
      {ROW_STATUS[status].icon}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[13px] font-bold text-white truncate">{exercise.name}</span>
      <span className="block text-[11px] text-slate-400 truncate">
        Level {exercise.level} · {exercise.subCategory}
      </span>
    </span>
    <span className={`w-1.5 h-6 rounded-full shrink-0 ${LANE_THEME[exercise.swimlane].solid}`} aria-hidden />
    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
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
  <div className="p-3 rounded-xl bg-dark-950/70 border border-slate-700 space-y-2.5">
    <p className="text-xs text-slate-200">{message}</p>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onConfirm}
        className={`flex-1 h-10 rounded-lg text-xs font-black border transition cursor-pointer ${
          danger
            ? 'bg-rose-950/50 text-rose-200 border-rose-700/60 hover:bg-rose-900/50'
            : 'bg-cyan-950/50 text-neon-cyan border-cyan-500/50 hover:bg-cyan-900/50'
        }`}
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 h-10 rounded-lg text-xs font-bold text-slate-300 border border-slate-700 hover:border-slate-500 transition cursor-pointer"
      >
        Cancel
      </button>
    </div>
  </div>
);
