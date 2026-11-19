import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { KEY_VALUE_STORE } from '../repositories/key-value.store.js';
import type { KeyValueStore } from '../repositories/key-value.store.js';
import { LOCAL_ACCOUNT, accountsEnabled } from '../auth/account.js';
import type { Account } from '../auth/account.js';
import { pool } from '../auth/auth.js';
import { CampaignService, serverToday } from './campaign.service.js';
import { ExercisesService } from './exercises.service.js';
import {
  addDays,
  cardOf,
  crewWeek,
  duelDay,
  feedOf,
  improvementOf,
  mondayOfDate,
  planOf,
  regularsOf,
  witnessed,
} from '../engine/aura-engine.mjs';
import type { CrewWeek, EnginePlan, EngineSave, FeedItem, PlayerCard } from '../engine/aura-engine.mjs';

/** Shown in full when the crew is this small; bigger boards show the top 3 and the athlete's neighbours. */
const FULL_BOARD = 8;
const RAID_SESSIONS_PER_MEMBER = 4;
const DUELS_AT_ONCE = 3;
const SPOTTERS_MAX = 5;
const SPOTTER_SHARE = 0.8;
const LEAGUE_FROM = 30;
const LEAGUE_SIZE = 30;
const LEAGUE_TIERS = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Emerald', 'Amethyst', 'Pearl', 'Obsidian', 'Diamond'];
const RAID_NAMES = ['The Iron Week', 'The Chalk Storm', 'The Long Hang', 'The Hollow Siege', 'The Bar Warden', 'The Rings of Dread'];

export interface CrewSettings {
  /** Off every board and feed; the athlete's own game is untouched. */
  trainPrivately: boolean;
  /** Share the numbers behind PRs, not only that there was one. */
  showNumbers: boolean;
}

const DEFAULT_SETTINGS: CrewSettings = { trainPrivately: false, showNumbers: false };

interface Duel {
  id: string;
  a: string;
  b: string;
  start: string;
}

interface Flag {
  id: string;
  by: string;
  target: string;
  /** The training week the flag holds off the board. */
  week: string;
  item: string | null;
  reason: string;
  at: string;
  status: 'open' | 'cleared' | 'upheld';
}

/** One athlete as the crew counts them: their save witnessed by the server, and their plan. */
interface Athlete {
  account: Pick<Account, 'id' | 'name'>;
  save: EngineSave;
  plan: EnginePlan;
  settings: CrewSettings;
  /** Whether they have saved a campaign at all. */
  started: boolean;
}

/**
 * One member as the owner sees them on the Team page. It holds nothing the
 * crew board does not already show: a member who trains privately is only
 * "private", with no training numbers.
 */
export interface RosterEntry {
  id: string;
  trainPrivately: boolean;
  showNumbers: boolean;
  /** Open flags against them, waiting for the owner. */
  openFlags: number;
  /** Null for a private member. */
  started: boolean | null;
  /** This week as the board counts it; null for a private member. */
  week: { xp: number; sessions: number; prs: number; held: boolean } | null;
}

export interface BoardRow {
  id: string;
  name: string;
  you: boolean;
  place: number | null;
  xp: number;
  prs: number;
  sessions: number;
  improvement: number | null;
  card: PlayerCard;
  /** Flagged this week and waiting for the owner. */
  held: boolean;
}

const settingsKey = (id: string) => `crew:settings:${id}`;
const spottersKey = (id: string) => `crew:spotters:${id}`;
const DUELS = 'crew:duels';
const CHALK = 'crew:chalk';
const WITNESS = 'crew:witness';
const FLAGS = 'crew:flags';
const LEAGUE = 'crew:league';

const short = (value: string) => createHash('sha256').update(value).digest('base64url').slice(0, 16);

/**
 * The crew: leaderboards and social play between the athletes the owner has
 * invited. Every number comes from the server's own copy of the engine,
 * reading each save as the server witnessed it.
 */
@Injectable()
export class CrewService {
  constructor(
    @Inject(KEY_VALUE_STORE) private readonly store: KeyValueStore,
    private readonly campaign: CampaignService,
    private readonly exercises: ExercisesService,
  ) {}

  /* ---------------- storage helpers ---------------- */

  private async read<T>(key: string, fallback: T): Promise<T> {
    return (await this.store.get<T>(key))?.value ?? fallback;
  }

  /** Read, change, write, retried when another request wrote in between. */
  private async change<T>(key: string, fallback: T, fn: (value: T) => T): Promise<T> {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const doc = await this.store.get<T>(key);
      const next = fn(doc?.value ?? fallback);
      if (await this.store.put(key, next, doc?.rev ?? 0)) return next;
    }
    throw new Error(`Busy: ${key}`);
  }

  /* ---------------- who is in the crew ---------------- */

  async members(): Promise<Pick<Account, 'id' | 'name'>[]> {
    if (!accountsEnabled() || !pool) return [{ id: LOCAL_ACCOUNT.id, name: LOCAL_ACCOUNT.name }];
    const { rows } = await pool.query<{ id: string; name: string }>('SELECT id, name FROM "user" ORDER BY "createdAt" ASC');
    return rows;
  }

  async settings(id: string): Promise<CrewSettings> {
    return { ...DEFAULT_SETTINGS, ...(await this.read<Partial<CrewSettings>>(settingsKey(id), {})) };
  }

  async saveSettings(id: string, patch: Partial<CrewSettings>): Promise<CrewSettings> {
    const clean: Partial<CrewSettings> = {};
    if (typeof patch.trainPrivately === 'boolean') clean.trainPrivately = patch.trainPrivately;
    if (typeof patch.showNumbers === 'boolean') clean.showNumbers = patch.showNumbers;
    const next = await this.change<Partial<CrewSettings>>(settingsKey(id), {}, (value) => ({ ...value, ...clean }));
    return { ...DEFAULT_SETTINGS, ...next };
  }

  private async athlete(account: Pick<Account, 'id' | 'name'>): Promise<Athlete> {
    // Plans and saves are read against the exercise list in the database.
    await this.exercises.syncEngine();
    const [saveDoc, planDoc, seen, settings] = await Promise.all([
      this.campaign.load(account.id),
      this.campaign.loadPlan(account.id),
      this.campaign.seen(account.id),
      this.settings(account.id),
    ]);
    return {
      account,
      save: witnessed(saveDoc?.value ?? null, seen ?? {}),
      plan: planOf(planDoc?.value ?? null),
      settings,
      started: Boolean(saveDoc?.value),
    };
  }

  private async athletes(): Promise<Athlete[]> {
    return Promise.all((await this.members()).map((member) => this.athlete(member)));
  }

  /* ---------------- the board ---------------- */

  async board(me: Account, weekOf?: string) {
    const today = serverToday();
    const monday = mondayOfDate(weekOf && /^\d{4}-\d{2}-\d{2}$/.test(weekOf) ? weekOf : today);
    const [everyone, flags] = await Promise.all([this.athletes(), this.read<Flag[]>(FLAGS, [])]);
    const held = new Set(flags.filter((flag) => flag.status === 'open' && flag.week === monday).map((flag) => flag.target));
    const upheld = new Set(flags.filter((flag) => flag.status === 'upheld' && flag.week === monday).map((flag) => flag.target));

    const rows = everyone
      .filter((athlete) => athlete.account.id === me.id || !athlete.settings.trainPrivately)
      .map((athlete): BoardRow & { week: CrewWeek } => {
        const week = crewWeek(athlete.save, athlete.plan, monday, today);
        const xp = upheld.has(athlete.account.id) ? 0 : week.xp;
        return {
          id: athlete.account.id,
          name: athlete.account.name || 'Athlete',
          you: athlete.account.id === me.id,
          place: null,
          xp,
          prs: week.prs,
          sessions: week.sessions,
          improvement: improvementOf(athlete.save, athlete.plan, monday, today),
          card: cardOf(athlete.save, athlete.plan, today),
          held: held.has(athlete.account.id),
          week,
        };
      });

    const ranked = rows.filter((row) => !row.held).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
    ranked.forEach((row, index) => (row.place = index + 1));
    const byImprovement = [...ranked]
      .filter((row) => row.improvement !== null)
      .sort((a, b) => (b.improvement ?? 0) - (a.improvement ?? 0));

    // The bottom of a big board stays private: the top 3, you, and the people either side of you.
    const visible = (list: BoardRow[]) => {
      if (list.length <= FULL_BOARD) return list;
      const mine = list.findIndex((row) => row.you);
      return list.filter((_, index) => index < 3 || (mine >= 0 && Math.abs(index - mine) <= 1));
    };
    const strip = ({ week: _week, ...row }: BoardRow & { week?: CrewWeek }) => row;

    return {
      week: monday,
      me: me.id,
      settings: await this.settings(me.id),
      board: visible(ranked).map(strip),
      hidden: Math.max(0, ranked.length - visible(ranked).length),
      improved: visible(byImprovement).map(strip),
      held: rows.filter((row) => row.held).map((row) => ({ id: row.id, name: row.name })),
      raid: this.raidOf(rows.map((row) => ({ id: row.id, name: row.name, week: row.week })), monday),
      league: await this.league(everyone, monday, today, me.id),
    };
  }

  /* ---------------- the weekly raid ---------------- */

  private raidOf(rows: { id: string; name: string; week: CrewWeek }[], monday: string) {
    const active = rows.filter((row) => row.week.activeDays > 0);
    const hp = Math.max(1, active.length) * RAID_SESSIONS_PER_MEMBER;
    const hits = rows.map((row) => ({ id: row.id, name: row.name, hits: row.week.sessions + row.week.prs }));
    const landed = hits.reduce((sum, row) => sum + row.hits, 0);
    const index = Math.abs(Number(monday.replace(/-/g, ''))) % RAID_NAMES.length;
    return {
      name: RAID_NAMES[index],
      hp,
      landed: Math.min(hp, landed),
      down: landed >= hp,
      fighters: hits.filter((row) => row.hits > 0).map((row) => ({ id: row.id, name: row.name, hits: row.hits })),
    };
  }

  /* ---------------- leagues, once there are enough athletes ---------------- */

  private async league(everyone: Athlete[], monday: string, today: string, me: string) {
    const weeks = new Map(everyone.map((athlete) => [athlete.account.id, crewWeek(athlete.save, athlete.plan, monday, today)]));
    const active = [...weeks.values()].filter((week) => week.activeDays > 0).length;
    if (active < LEAGUE_FROM) return { enabled: false as const, active, needed: LEAGUE_FROM };

    // Tiers move once a week: last week's groups promote their top third and drop their bottom five.
    const state = await this.change<{ week: string; tiers: Record<string, number> }>(LEAGUE, { week: '', tiers: {} }, (value) => {
      if (value.week === monday) return value;
      const lastMonday = addDays(monday, -7);
      const tiers = { ...value.tiers };
      const last = new Map(everyone.map((athlete) => [athlete.account.id, crewWeek(athlete.save, athlete.plan, lastMonday, today).xp]));
      for (let tier = 0; tier < LEAGUE_TIERS.length; tier += 1) {
        const ids = everyone.map((athlete) => athlete.account.id).filter((id) => (tiers[id] ?? 0) === tier);
        ids.sort((a, b) => (last.get(b) ?? 0) - (last.get(a) ?? 0));
        for (let start = 0; start < ids.length; start += LEAGUE_SIZE) {
          const group = ids.slice(start, start + LEAGUE_SIZE);
          const up = Math.floor(group.length / 3);
          group.forEach((id, place) => {
            if (place < up && tier < LEAGUE_TIERS.length - 1 && (last.get(id) ?? 0) > 0) tiers[id] = tier + 1;
            else if (place >= group.length - 5 && tier > 0) tiers[id] = tier - 1;
          });
        }
      }
      return { week: monday, tiers };
    });
    const tier = state.tiers[me] ?? 0;
    return { enabled: true as const, active, needed: LEAGUE_FROM, tier, name: LEAGUE_TIERS[tier] };
  }

  /* ---------------- feed, chalk, witness ---------------- */

  async feed(me: Account) {
    const since = addDays(serverToday(), -21);
    const [everyone, chalk, witness] = await Promise.all([
      this.athletes(),
      this.read<Record<string, string[]>>(CHALK, {}),
      this.read<Record<string, string[]>>(WITNESS, {}),
    ]);
    const items = everyone
      .filter((athlete) => athlete.account.id === me.id || !athlete.settings.trainPrivately)
      .flatMap((athlete) =>
        feedOf(athlete.save, athlete.settings.showNumbers || athlete.account.id === me.id, since).map((item: FeedItem) => {
          const id = short(`${athlete.account.id}|${item.id}`);
          return {
            ...item,
            id,
            who: { id: athlete.account.id, name: athlete.account.name || 'Athlete' },
            you: athlete.account.id === me.id,
            chalk: (chalk[id] ?? []).length,
            chalked: (chalk[id] ?? []).includes(me.id),
            witnessed: (witness[id] ?? []).length,
            sawIt: (witness[id] ?? []).includes(me.id),
          };
        }),
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 80);
    return { items };
  }

  /** One chalk per item per person: a second tap takes it back. */
  async chalk(me: Account, itemId: string) {
    const next = await this.change<Record<string, string[]>>(CHALK, {}, (value) => {
      const set = new Set(value[itemId] ?? []);
      if (set.has(me.id)) set.delete(me.id);
      else set.add(me.id);
      return { ...value, [itemId]: [...set] };
    });
    return { chalk: (next[itemId] ?? []).length, chalked: (next[itemId] ?? []).includes(me.id) };
  }

  /** "I saw it": a seal on someone else's feat. It pays no XP, so vouching for a friend gains nothing. */
  async witness(me: Account, itemId: string) {
    const feed = await this.feed(me);
    const item = feed.items.find((entry) => entry.id === itemId);
    if (!item || item.you) return { witnessed: item?.witnessed ?? 0, sawIt: false };
    const next = await this.change<Record<string, string[]>>(WITNESS, {}, (value) => ({
      ...value,
      [itemId]: [...new Set([...(value[itemId] ?? []), me.id])],
    }));
    return { witnessed: (next[itemId] ?? []).length, sawIt: true };
  }

  /* ---------------- flags (the owner decides) ---------------- */

  async flag(me: Account, target: string, reason: string, item: string | null) {
    const flag: Flag = {
      id: randomUUID(),
      by: me.id,
      target,
      week: mondayOfDate(serverToday()),
      item,
      reason: reason.slice(0, 280),
      at: new Date().toISOString(),
      status: 'open',
    };
    await this.change<Flag[]>(FLAGS, [], (value) => [...value, flag].slice(-500));
    return { ok: true };
  }

  async flags() {
    const [flags, members] = await Promise.all([this.read<Flag[]>(FLAGS, []), this.members()]);
    const names = new Map(members.map((member) => [member.id, member.name]));
    return flags
      .filter((flag) => flag.status === 'open')
      .map((flag) => ({
        ...flag,
        byName: names.get(flag.by) ?? 'A former member',
        targetName: names.get(flag.target) ?? 'A former member',
      }));
  }

  async resolveFlag(id: string, action: 'clear' | 'uphold') {
    await this.change<Flag[]>(FLAGS, [], (value) =>
      value.map((flag) => (flag.id === id ? { ...flag, status: action === 'clear' ? 'cleared' : 'upheld' } : flag)),
    );
    return { ok: true };
  }

  /* ---------------- the owner's roster ---------------- */

  /** Where each member stands in the crew this week, for the Team page. */
  async roster(): Promise<RosterEntry[]> {
    const today = serverToday();
    const monday = mondayOfDate(today);
    const [everyone, flags] = await Promise.all([this.athletes(), this.read<Flag[]>(FLAGS, [])]);
    const open = flags.filter((flag) => flag.status === 'open');
    return everyone.map((athlete) => {
      const id = athlete.account.id;
      const base = {
        id,
        trainPrivately: athlete.settings.trainPrivately,
        showNumbers: athlete.settings.showNumbers,
        openFlags: open.filter((flag) => flag.target === id).length,
      };
      if (athlete.settings.trainPrivately) return { ...base, started: null, week: null };
      const week = crewWeek(athlete.save, athlete.plan, monday, today);
      const upheld = flags.some((flag) => flag.status === 'upheld' && flag.week === monday && flag.target === id);
      return {
        ...base,
        started: athlete.started,
        week: {
          xp: upheld ? 0 : week.xp,
          sessions: week.sessions,
          prs: week.prs,
          held: open.some((flag) => flag.week === monday && flag.target === id),
        },
      };
    });
  }

  /**
   * Takes a removed member out of the crew: their switches and spotter picks,
   * their chalk and "I saw it" seals, and the flags raised against them. Duels
   * stay, so nobody loses a duel they already won. Flags they raised stay open
   * for the owner to decide.
   */
  async forget(id: string) {
    await Promise.all([this.store.delete(settingsKey(id)), this.store.delete(spottersKey(id))]);
    const without = (value: Record<string, string[]>) =>
      Object.fromEntries(Object.entries(value).map(([item, ids]) => [item, ids.filter((other) => other !== id)]));
    await this.change<Record<string, string[]>>(CHALK, {}, without);
    await this.change<Record<string, string[]>>(WITNESS, {}, without);
    await this.change<Flag[]>(FLAGS, [], (value) =>
      value.map((flag) => (flag.status === 'open' && flag.target === id ? { ...flag, status: 'cleared' } : flag)),
    );
  }

  /* ---------------- duels ---------------- */

  async duels(me: Account) {
    const today = serverToday();
    const [duels, members] = await Promise.all([this.read<Duel[]>(DUELS, []), this.members()]);
    const mine = duels.filter((duel) => duel.a === me.id || duel.b === me.id);
    const cache = new Map<string, Athlete>();
    const athleteOf = async (id: string) => {
      if (!cache.has(id)) {
        // A rival the owner has since removed keeps the duel, without a name.
        const member = members.find((entry) => entry.id === id) ?? { id, name: 'A former member' };
        cache.set(id, await this.athlete(member));
      }
      return cache.get(id) as Athlete;
    };
    const views = await Promise.all(
      mine.map(async (duel) => {
        const end = addDays(duel.start, 6);
        const [a, b] = await Promise.all([athleteOf(duel.a), athleteOf(duel.b)]);
        const days = Array.from({ length: 7 }, (_, index) => addDays(duel.start, index)).filter((date) => date <= today);
        const score = (athlete: Athlete) => days.reduce((sum, date) => sum + duelDay(athlete.save, athlete.plan, date), 0);
        const [mineScore, theirs] = duel.a === me.id ? [score(a), score(b)] : [score(b), score(a)];
        const rival = duel.a === me.id ? b : a;
        const over = today > end;
        return {
          id: duel.id,
          start: duel.start,
          end,
          rival: { id: rival.account.id, name: rival.account.name || 'Athlete' },
          mine: mineScore,
          theirs,
          over,
          // Both at the top both win.
          result: !over ? null : mineScore >= 700 && theirs >= 700 ? 'both' : mineScore > theirs ? 'won' : mineScore < theirs ? 'lost' : 'tied',
        };
      }),
    );
    return {
      duels: views.sort((a, b) => (a.start < b.start ? 1 : -1)),
      rivals: members.filter((member) => member.id !== me.id).map((member) => ({ id: member.id, name: member.name || 'Athlete' })),
      atOnce: DUELS_AT_ONCE,
    };
  }

  async challenge(me: Account, rival: string) {
    const today = serverToday();
    const members = await this.members();
    if (rival === me.id || !members.some((member) => member.id === rival)) return { ok: false, message: 'Pick someone in your crew.' };
    let refused: string | null = null;
    await this.change<Duel[]>(DUELS, [], (value) => {
      const active = value.filter((duel) => (duel.a === me.id || duel.b === me.id) && addDays(duel.start, 6) >= today);
      if (active.length >= DUELS_AT_ONCE) {
        refused = `Three duels at once is the limit.`;
        return value;
      }
      if (active.some((duel) => duel.a === rival || duel.b === rival)) {
        refused = 'You are already in a duel with them.';
        return value;
      }
      return [...value, { id: randomUUID(), a: me.id, b: rival, start: today }];
    });
    return refused ? { ok: false, message: refused } : { ok: true };
  }

  /* ---------------- spotters and regulars ---------------- */

  async spotters(me: Account) {
    const today = serverToday();
    const [picked, members] = await Promise.all([this.read<string[]>(spottersKey(me.id), []), this.members()]);
    const mine = await this.athlete(members.find((member) => member.id === me.id) ?? { id: me.id, name: me.name });
    const thisMonday = mondayOfDate(today);
    const views = await Promise.all(
      picked.map(async (id) => {
        const member = members.find((entry) => entry.id === id);
        if (!member) return null;
        const them = await this.athlete(member);
        // Weeks in a row in which both closed 80% of their missions, counting this week once both have.
        let streak = 0;
        const both = (monday: string) =>
          crewWeek(mine.save, mine.plan, monday, today).completion >= SPOTTER_SHARE &&
          crewWeek(them.save, them.plan, monday, today).completion >= SPOTTER_SHARE;
        if (both(thisMonday)) streak += 1;
        for (let back = 1; back <= 104; back += 1) {
          if (!both(addDays(thisMonday, -7 * back))) break;
          streak += 1;
        }
        return { id, name: member.name || 'Athlete', streak };
      }),
    );
    return {
      spotters: views.filter(Boolean),
      options: members.filter((member) => member.id !== me.id).map((member) => ({ id: member.id, name: member.name || 'Athlete' })),
      max: SPOTTERS_MAX,
    };
  }

  async setSpotters(me: Account, ids: string[]) {
    const members = new Set((await this.members()).map((member) => member.id));
    const clean = [...new Set(ids.filter((id) => typeof id === 'string' && id !== me.id && members.has(id)))].slice(0, SPOTTERS_MAX);
    await this.change<string[]>(spottersKey(me.id), [], () => clean);
    return this.spotters(me);
  }

  /** Whoever finished the most logged sessions of an exercise in 90 days wears its laurel (three at least). */
  async regulars() {
    const today = serverToday();
    const everyone = (await this.athletes()).filter((athlete) => !athlete.settings.trainPrivately);
    const best = new Map<string, { exercise: string; id: string; name: string; count: number }>();
    for (const athlete of everyone) {
      for (const [exercise, count] of Object.entries(regularsOf(athlete.save, athlete.plan, today))) {
        if (count < 3) continue;
        const current = best.get(exercise);
        if (!current || count > current.count) best.set(exercise, { exercise, id: athlete.account.id, name: athlete.account.name || 'Athlete', count });
      }
    }
    return { regulars: [...best.values()].sort((a, b) => b.count - a.count) };
  }

  /* ---------------- what the crew has given an athlete ---------------- */

  async awards(me: Account) {
    const today = serverToday();
    const [duels, raids, spotters] = await Promise.all([this.duels(me), this.raidsWon(me.id, today), this.spotters(me)]);
    return {
      duelsWon: duels.duels.filter((duel) => duel.result === 'won' || duel.result === 'both').length,
      raids,
      spotterWeeks: Math.max(0, ...spotters.spotters.map((entry) => entry?.streak ?? 0)),
    };
  }

  /** Weekly raids brought down in which this athlete landed a hit, over the last year. */
  private async raidsWon(id: string, today: string): Promise<number> {
    const everyone = await this.athletes();
    let count = 0;
    const thisMonday = mondayOfDate(today);
    for (let back = 1; back <= 52; back += 1) {
      const monday = addDays(thisMonday, -7 * back);
      const rows = everyone.map((athlete) => ({ id: athlete.account.id, name: athlete.account.name, week: crewWeek(athlete.save, athlete.plan, monday, today) }));
      if (!rows.some((row) => row.week.activeDays > 0)) continue;
      const raid = this.raidOf(rows, monday);
      if (raid.down && raid.fighters.some((fighter) => fighter.id === id)) count += 1;
    }
    return count;
  }

  async card(id: string) {
    const member = (await this.members()).find((entry) => entry.id === id);
    if (!member) return null;
    const athlete = await this.athlete(member);
    if (athlete.settings.trainPrivately) return null;
    return { id, name: member.name || 'Athlete', ...cardOf(athlete.save, athlete.plan, serverToday()) };
  }
}
