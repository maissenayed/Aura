'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Eye, Flag, HelpCircle, Swords, Users } from 'lucide-react';
import { CrewGuide, setGuideOpen, useGuideOpen } from '../../../components/game/CrewGuide';
import { ScreenHeader } from '../../../components/game/AppShell';
import { useGame } from '../../../components/game/GameProvider';
import { Chip } from '../../../components/game/kit';
import { PlayerCard, PlayerCardData } from '../../../components/game/PlayerCard';
import { api } from '../../../utils/accountStore';
import { refreshCrewAwards } from '../../../utils/crewStore';
import { gearCatalog } from '../../../data/gear';

interface Row {
  id: string;
  name: string;
  you: boolean;
  place: number | null;
  xp: number;
  prs: number;
  sessions: number;
  improvement: number | null;
  card: Omit<PlayerCardData, 'name'>;
  held: boolean;
}

interface Board {
  week: string;
  me: string;
  settings: { trainPrivately: boolean; showNumbers: boolean };
  board: Row[];
  hidden: number;
  improved: Row[];
  held: { id: string; name: string }[];
  raid: { name: string; hp: number; landed: number; down: boolean; fighters: { id: string; name: string; hits: number }[] };
  league: { enabled: false; active: number; needed: number } | { enabled: true; active: number; needed: number; tier: number; name: string };
}

interface FeedEntry {
  id: string;
  date: string;
  kind: string;
  title: string;
  detail: string;
  who: { id: string; name: string };
  you: boolean;
  chalk: number;
  chalked: boolean;
  witnessed: number;
  sawIt: boolean;
}

interface DuelView {
  id: string;
  start: string;
  end: string;
  rival: { id: string; name: string };
  mine: number;
  theirs: number;
  over: boolean;
  result: 'won' | 'lost' | 'tied' | 'both' | null;
}

type Tab = 'board' | 'feed' | 'duels' | 'crew';
const TABS: { id: Tab; label: string }[] = [
  { id: 'board', label: 'Board' },
  { id: 'feed', label: 'Feed' },
  { id: 'duels', label: 'Duels' },
  { id: 'crew', label: 'Spotters' },
];

/** One line under the tabs: what this tab is for. */
const TAB_INTRO: Record<Tab, string> = {
  board: 'Who trained most this week. Tap someone to see their card.',
  feed: 'What your crew did lately. Chalk is a like; I saw it vouches you saw it happen.',
  duels: 'Seven days, one on one, scored on how much of your own plan you did.',
  crew: 'Training partners and the regulars of each exercise.',
};

/** Growth on the athlete's own four-week average. A drop shows as a dash: nobody's bad week goes on the board. */
const improvementText = (improvement: number | null) =>
  improvement === null || improvement < 1 ? '—' : `${Math.round((improvement - 1) * 100)}%`;

const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** The crew: train with them, compete with last week. Every number here is worked out on the server. */
export default function CrewPage() {
  const [tab, setTab] = useState<Tab>('board');
  const guideOpen = useGuideOpen();
  return (
    <main className="w-full max-w-[880px] mx-auto px-4 pt-5 lg:px-8 lg:pt-8 pb-8 flex flex-col gap-5">
      <ScreenHeader
        eyebrow="Train with your crew, compete with last week"
        title="Crew"
        right={
          !guideOpen && (
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="h-10 px-3 rounded-card border border-ink-600 text-fg-2 text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-ink-850"
            >
              <HelpCircle className="w-4 h-4" /> How it works
            </button>
          )
        }
      />
      <CrewGuide />
      <div role="tablist" aria-label="Crew" className="grid grid-cols-4 gap-1 p-1 rounded-card bg-ink-900">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={`h-10 rounded-tag text-[13px] font-bold transition cursor-pointer ${tab === entry.id ? 'bg-ink-800 raised text-fg' : 'text-fg-4 hover:text-fg'}`}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <p className="-mt-2 text-[13px] text-fg-3">{TAB_INTRO[tab]}</p>
      {tab === 'board' && <BoardTab />}
      {tab === 'feed' && <FeedTab />}
      {tab === 'duels' && <DuelsTab />}
      {tab === 'crew' && <CrewTab />}
    </main>
  );
}

function useLoad<T>(path: string): { data: T | null; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let live = true;
    void api<T>('GET', path).then((result) => {
      if (!live) return;
      if (result.data) {
        setData(result.data);
        setError(null);
      } else setError(result.error ?? 'Could not load.');
    });
    return () => {
      live = false;
    };
  }, [path, nonce]);
  return { data, error, reload: useCallback(() => setNonce((n) => n + 1), []) };
}

const Loading: React.FC<{ error: string | null }> = ({ error }) =>
  error ? (
    <p className="p-4 rounded-card bg-ink-900 text-sm text-fg-3">{error}</p>
  ) : (
    <div className="h-40 rounded-card bg-ink-900 animate-pulse" aria-busy="true" aria-label="Loading" />
  );

/* ------------------------------------------------------------------ */
/* Board                                                               */
/* ------------------------------------------------------------------ */

function BoardTab() {
  const { data, error, reload } = useLoad<Board>('/crew/board');
  const [view, setView] = useState<'week' | 'improved'>('week');
  const [open, setOpen] = useState<string | null>(null);
  const { save, plan, derived } = useGame();
  const names = useMemo(
    () => Object.fromEntries(gearCatalog(save, plan, derived.level.level, derived.level.rank).map((item) => [item.id, item.name])),
    [save, plan, derived.level.level, derived.level.rank],
  );

  if (!data) return <Loading error={error} />;
  const rows = view === 'week' ? data.board : data.improved;
  const alone = data.board.length <= 1 && data.held.length === 0;

  const setSetting = async (patch: Partial<Board['settings']>) => {
    await api('PUT', '/crew/settings', patch);
    reload();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 p-1 rounded-card bg-ink-900 text-center">
        {(['week', 'improved'] as const).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
            className={`h-9 rounded-tag text-[13px] font-semibold cursor-pointer ${view === id ? 'bg-ink-800 text-fg' : 'text-fg-4'}`}
          >
            {id === 'week' ? 'This week' : 'Most improved'}
          </button>
        ))}
      </div>

      <section aria-label={view === 'week' ? 'This week' : 'Most improved'} className="flex flex-col gap-1.5">
        <p className="eyebrow text-fg-4">
          Week of {shortDate(data.week)} · resets Monday · {view === 'week' ? 'training XP' : 'against your own last 4 weeks'}
        </p>
        {rows.length === 0 && <p className="p-4 rounded-card bg-ink-900 text-sm text-fg-3">Nobody has trained enough weeks to compare yet.</p>}
        {rows.map((row, index) => {
          const shown = view === 'week' ? row.place : index + 1;
          return (
            <div key={row.id} className={`rounded-card ${row.you ? 'bg-ink-850 ring-1 ring-fg-3' : 'bg-ink-900'}`}>
              <button
                type="button"
                onClick={() => setOpen(open === row.id ? null : row.id)}
                aria-expanded={open === row.id}
                className="w-full flex items-center gap-3 p-2.5 text-left cursor-pointer"
              >
                <span className="w-6 text-center num font-bold text-fg-4">{shown}</span>
                <span className="flex-1 min-w-0">
                  <PlayerCard compact card={{ ...row.card, name: row.you && row.name !== 'You' ? `${row.name} (you)` : row.name }} gearNames={names} />
                </span>
                {row.prs > 0 && (
                  <span className="hidden sm:inline-flex">
                    <Chip tone="earned">
                      {row.prs} PR{row.prs === 1 ? '' : 's'}
                    </Chip>
                  </span>
                )}
                <span className="num font-bold text-[18px] text-fg w-16 text-right">
                  {view === 'week' ? row.xp.toLocaleString() : improvementText(row.improvement)}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-fg-5 transition ${open === row.id ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {open === row.id && <RowDetail row={row} names={names} onFlagged={reload} />}
            </div>
          );
        })}
        {data.hidden > 0 && <p className="text-center text-[12.5px] text-fg-4">{data.hidden} more training this week</p>}
        {data.held.length > 0 && (
          <p className="text-[12.5px] text-fg-4">Under review by the owner: {data.held.map((entry) => entry.name).join(', ')}.</p>
        )}
        {alone && (
          <p className="p-3 rounded-card bg-ink-900 text-[13px] text-fg-3">
            Just you so far. The owner can invite people from <Link href="/team" className="underline">Team</Link>; everyone they invite shares this board.
          </p>
        )}
      </section>

      <RaidCard raid={data.raid} />

      <section className="p-4 rounded-card bg-ink-900 flex flex-col gap-1">
        <span className="eyebrow text-fg-4">Leagues</span>
        {data.league.enabled ? (
          <p className="text-sm text-fg-2">
            You are in the <strong className="text-fg">{data.league.name}</strong> league. Up to 30 at a similar pace; one tier up or down each Monday.
          </p>
        ) : (
          <p className="text-sm text-fg-3">
            Leagues open once {data.league.needed} athletes train in a week ({data.league.active} this week). Until then, the crew board.
          </p>
        )}
      </section>

      <section className="p-4 rounded-card bg-ink-900 flex flex-col gap-3" aria-label="Privacy">
        <span className="eyebrow text-fg-4">Privacy</span>
        <Toggle
          label="Train privately"
          detail="Off every board and feed. Your own game is untouched."
          on={data.settings.trainPrivately}
          onChange={(on) => void setSetting({ trainPrivately: on })}
        />
        <Toggle
          label="Show the numbers behind my PRs"
          detail="Off: the crew sees that you set a PR, not the number."
          on={data.settings.showNumbers}
          onChange={(on) => void setSetting({ showNumbers: on })}
        />
        <p className="text-[12px] text-fg-4">Bodyweight, weigh-ins and the Mass axis are never shared. Bodyweight and raw strength are never ranked.</p>
      </section>
    </div>
  );
}

const RowDetail: React.FC<{ row: Row; names: Record<string, string>; onFlagged: () => void }> = ({ row, names, onFlagged }) => {
  const [flagging, setFlagging] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <div className="px-3 pb-3 flex flex-col gap-2">
      <PlayerCard card={{ ...row.card, name: row.name }} gearNames={names} />
      <p className="text-[12.5px] text-fg-3">
        {row.sessions} {row.sessions === 1 ? 'session' : 'sessions'} finished this week · {row.prs} {row.prs === 1 ? 'PR' : 'PRs'} · {row.xp.toLocaleString()} XP
      </p>
      {!row.you &&
        (sent ? (
          <p className="text-[12.5px] text-fg-3">Flag sent. Their week stays off the board until the owner looks at it.</p>
        ) : flagging ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!reason.trim()) return;
              await api('POST', '/crew/flags', { target: row.id, reason });
              setSent(true);
              onFlagged();
            }}
          >
            <label htmlFor={`flag-${row.id}`} className="text-[12.5px] text-fg-3">
              What looks wrong? The owner sees this.
            </label>
            <input
              id={`flag-${row.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={280}
              className="h-11 px-3 rounded-card bg-ink-950 border border-ink-600 text-fg text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" className="h-10 px-4 rounded-card bg-boss text-ink-950 text-sm font-bold cursor-pointer">
                Send flag
              </button>
              <button type="button" onClick={() => setFlagging(false)} className="h-10 px-4 rounded-card border border-ink-600 text-fg text-sm cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setFlagging(true)} className="self-start h-9 px-3 rounded-card border border-ink-600 text-fg-3 text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer">
            <Flag className="w-3.5 h-3.5" /> Flag this week
          </button>
        ))}
    </div>
  );
};

const RaidCard: React.FC<{ raid: Board['raid'] }> = ({ raid }) => {
  const left = Math.max(0, raid.hp - raid.landed);
  return (
    <section className={`p-4 rounded-card flex flex-col gap-2 ${raid.down ? 'bg-earned-deep' : 'bg-boss-deep'}`} aria-label="Crew raid">
      <div className="flex items-baseline justify-between gap-2">
        <span className="eyebrow text-boss-soft">Crew raid · this week</span>
        <span className="num font-bold text-fg">
          {raid.landed} / {raid.hp}
        </span>
      </div>
      <h2 className="font-display font-extrabold uppercase text-[24px] leading-none text-fg">{raid.name}</h2>
      <div className="h-2.5 rounded-[2px] bg-ink-950/60 overflow-hidden" role="progressbar" aria-valuenow={raid.landed} aria-valuemin={0} aria-valuemax={raid.hp}>
        <div className="h-full bg-boss" style={{ width: `${(left / raid.hp) * 100}%` }} />
      </div>
      <p className="text-[12.5px] text-fg-2">
        {raid.down
          ? `Down. Everyone who landed a hit gets the raid badge: ${raid.fighters.map((entry) => entry.name).join(', ')}.`
          : `${left} ${left === 1 ? 'hit' : 'hits'} to go. Each finished session is a hit, each PR another. A missed week costs nobody anything.`}
      </p>
      {!raid.down && (
        <Link href="/quest" className="self-start h-10 px-3 rounded-card bg-boss text-ink-950 text-[13px] font-bold flex items-center">
          Land a hit: train on Quest
        </Link>
      )}
    </section>
  );
};

const Toggle: React.FC<{ label: string; detail: string; on: boolean; onChange: (on: boolean) => void }> = ({ label, detail, on, onChange }) => (
  <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-3 text-left cursor-pointer">
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-semibold text-fg">{label}</span>
      <span className="block text-[12px] text-fg-4">{detail}</span>
    </span>
    <span className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition ${on ? 'bg-fg' : 'bg-ink-700'}`}>
      <span className={`block w-5 h-5 rounded-full transition ${on ? 'translate-x-5 bg-ink-950' : 'bg-fg-3'}`} />
    </span>
  </button>
);

/* ------------------------------------------------------------------ */
/* Feed                                                                */
/* ------------------------------------------------------------------ */

function FeedTab() {
  const { data, error } = useLoad<{ items: FeedEntry[] }>('/crew/feed');
  // Chalk and witness taps answer at once; the server's counts come back in the reply.
  const [patches, setPatches] = useState<Record<string, Partial<FeedEntry>>>({});
  if (!data) return <Loading error={error} />;
  const items = data.items.map((item) => ({ ...item, ...patches[item.id] }));

  const update = (id: string, patch: Partial<FeedEntry>) => setPatches((current) => ({ ...current, [id]: { ...current[id], ...patch } }));

  return (
    <ul className="flex flex-col gap-2" aria-label="Crew feed">
      {items.length === 0 && (
        <li className="p-4 rounded-card bg-ink-900 text-sm text-fg-3">
          Nothing in the last three weeks yet. PRs, skills, bosses and level-ups show up here by themselves when your crew trains.
        </li>
      )}
      {items.map((item) => (
        <li key={item.id} className="p-3 rounded-card bg-ink-900 flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-fg">{item.you ? 'You' : item.who.name}</span>
            <span className="text-[11.5px] text-fg-4">{shortDate(item.date)}</span>
          </div>
          <span className={`text-[14px] font-semibold ${item.kind === 'boss' ? 'text-boss-soft' : 'text-fg-2'}`}>{item.title}</span>
          {item.detail && <span className="text-[12.5px] text-fg-3">{item.detail}</span>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={item.chalked}
              title="Chalk: a like. Tap again to take it back."
              onClick={async () => {
                const result = await api<{ chalk: number; chalked: boolean }>('POST', '/crew/chalk', { id: item.id });
                if (result.data) update(item.id, result.data);
              }}
              className={`h-9 px-3 rounded-card text-[12.5px] font-semibold cursor-pointer ${item.chalked ? 'bg-fg text-ink-950' : 'border border-ink-600 text-fg-2'}`}
            >
              Chalk{item.chalk ? ` · ${item.chalk}` : ''}
            </button>
            {!item.you && (item.kind === 'boss' || item.kind === 'skill' || item.kind === 'pr') && (
              <button
                type="button"
                disabled={item.sawIt}
                title="Vouch that you saw it happen. It adds a seal, not XP."
                onClick={async () => {
                  const result = await api<{ witnessed: number; sawIt: boolean }>('POST', '/crew/witness', { id: item.id });
                  if (result.data) update(item.id, result.data);
                }}
                className="h-9 px-3 rounded-card border border-ink-600 text-fg-2 text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Eye className="w-3.5 h-3.5" /> {item.sawIt ? 'You saw it' : 'I saw it'}
                {item.witnessed ? ` · ${item.witnessed}` : ''}
              </button>
            )}
            {item.you && item.witnessed > 0 && <Chip tone="dim">Witnessed by {item.witnessed}</Chip>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Duels                                                               */
/* ------------------------------------------------------------------ */

function DuelsTab() {
  const { data, error, reload } = useLoad<{ duels: DuelView[]; rivals: { id: string; name: string }[]; atOnce: number }>('/crew/duels');
  const [rival, setRival] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  if (!data) return <Loading error={error} />;

  return (
    <div className="flex flex-col gap-4">
      <section className="p-4 rounded-card bg-ink-900 flex flex-col gap-2.5" aria-label="Start a duel">
        <span className="eyebrow text-fg-4">Seven days, one on one</span>
        <p className="text-[13px] text-fg-3">
          Each day scores the share of your own day&apos;s plan you earned, up to 100, so a beginner and a veteran duel on equal terms. Both at 700 both win.
        </p>
        {data.rivals.length === 0 ? (
          <p className="text-[13px] text-fg-3">Nobody to duel yet: the owner can invite people from Team.</p>
        ) : (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!rival) return;
              const result = await api<{ ok: boolean; message?: string }>('POST', '/crew/duels', { rival });
              setMessage(result.data?.ok ? 'Duel on. It starts today.' : (result.data?.message ?? result.error ?? 'Could not start it.'));
              reload();
              void refreshCrewAwards();
            }}
          >
            <label htmlFor="duel-rival" className="sr-only">
              Rival
            </label>
            <select id="duel-rival" value={rival} onChange={(event) => setRival(event.target.value)} className="h-11 px-3 rounded-card bg-ink-950 border border-ink-600 text-fg text-sm flex-1 min-w-[160px]">
              <option value="">Pick a rival</option>
              {data.rivals.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            <button type="submit" className="h-11 px-4 rounded-card bg-fg text-ink-950 font-display font-extrabold uppercase text-lg flex items-center gap-2 cursor-pointer">
              <Swords className="w-4 h-4" /> Duel
            </button>
          </form>
        )}
        {message && <p className="text-[12.5px] text-fg-2">{message}</p>}
      </section>

      <ul className="flex flex-col gap-2" aria-label="Your duels">
        {data.duels.map((duel) => (
          <li key={duel.id} className="p-3 rounded-card bg-ink-900 flex items-center gap-3">
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-fg">You vs {duel.rival.name}</span>
              <span className="block text-[12px] text-fg-4">
                {shortDate(duel.start)} to {shortDate(duel.end)}
                {duel.over ? '' : ' · on'}
              </span>
            </span>
            <span className="num font-bold text-fg">
              {duel.mine} <span className="text-fg-5">–</span> {duel.theirs}
            </span>
            {duel.result && (
              <Chip tone={duel.result === 'won' || duel.result === 'both' ? 'earned' : 'dim'}>
                {duel.result === 'both' ? 'Both won' : duel.result === 'won' ? 'Won' : duel.result === 'lost' ? 'Lost' : 'Tied'}
              </Chip>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Crew: spotters and regulars                                         */
/* ------------------------------------------------------------------ */

function CrewTab() {
  const spotters = useLoad<{ spotters: { id: string; name: string; streak: number }[]; options: { id: string; name: string }[]; max: number }>('/crew/spotters');
  const regulars = useLoad<{ regulars: { exercise: string; id: string; name: string; count: number }[] }>('/crew/regulars');

  const toggle = async (id: string) => {
    if (!spotters.data) return;
    const picked = spotters.data.spotters.map((entry) => entry.id);
    const next = picked.includes(id) ? picked.filter((other) => other !== id) : [...picked, id];
    await api('PUT', '/crew/spotters', { ids: next });
    spotters.reload();
    void refreshCrewAwards();
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="p-4 rounded-card bg-ink-900 flex flex-col gap-2.5" aria-label="Spotters">
        <span className="eyebrow text-fg-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> Spotters
        </span>
        <p className="text-[13px] text-fg-3">Up to five. A spotter streak counts the weeks in which both of you closed at least 80% of your missions.</p>
        {!spotters.data ? (
          <Loading error={spotters.error} />
        ) : spotters.data.options.length === 0 ? (
          <p className="text-[13px] text-fg-3">Nobody to spot yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {spotters.data.options.map((option) => {
              const picked = spotters.data!.spotters.find((entry) => entry.id === option.id);
              const full = !picked && spotters.data!.spotters.length >= spotters.data!.max;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={Boolean(picked)}
                    disabled={full}
                    onClick={() => void toggle(option.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-card text-left cursor-pointer disabled:opacity-50 ${picked ? 'bg-ink-800' : 'bg-ink-850'}`}
                  >
                    <span className="flex-1 text-sm font-semibold text-fg">{option.name}</span>
                    {picked ? <Chip tone={picked.streak > 0 ? 'earned' : 'dim'}>{picked.streak} wk streak</Chip> : <span className="text-[12px] text-fg-4">Add</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="p-4 rounded-card bg-ink-900 flex flex-col gap-2.5" aria-label="Regulars">
        <span className="eyebrow text-fg-4">Regulars · last 90 days</span>
        <p className="text-[13px] text-fg-3">Whoever logged the most sessions of an exercise wears its laurel. Consistency, not talent.</p>
        {!regulars.data ? (
          <Loading error={regulars.error} />
        ) : regulars.data.regulars.length === 0 ? (
          <p className="text-[13px] text-fg-3">No laurels yet: three logged sessions of an exercise claim one.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {regulars.data.regulars.map((entry) => (
              <li key={entry.exercise} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-fg-2">{entry.exercise} regular</span>
                <span className="text-fg font-semibold">
                  {entry.name} <span className="num text-fg-4">· {entry.count}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
