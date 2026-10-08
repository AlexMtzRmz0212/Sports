import type { LeagueKey, Phase, SeasonsFile } from "./types";

const DAY = 86_400_000;

/** "2026-10-20" -> local midnight, so day counts never drift by timezone. */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

export function formatDay(d: Date, withYear = d.getFullYear() !== today().getFullYear()): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });
}

export function inDays(n: number): string {
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  return `in ${n} days`;
}

export interface Moment {
  league: LeagueKey;
  leagueName: string;
  season: string;
  phase: Phase;
  start: Date;
  end: Date;
}

export function moments(file: SeasonsFile, league?: LeagueKey): Moment[] {
  const out: Moment[] = [];
  for (const [key, l] of Object.entries(file.leagues) as [LeagueKey, SeasonsFile["leagues"][LeagueKey]][]) {
    if (league && key !== league) continue;
    for (const s of l.seasons) {
      for (const p of s.phases) {
        out.push({ league: key, leagueName: l.name, season: s.label, phase: p, start: parseDay(p.start), end: parseDay(p.end) });
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export interface LeagueStatus {
  live: Moment | null;
  next: Moment | null;
}

/** What a league is doing today, and the next phase that starts after today. */
export function leagueStatus(file: SeasonsFile, league: LeagueKey, now = today()): LeagueStatus {
  const ms = moments(file, league);
  const live = ms.filter((m) => m.start <= now && now <= m.end).pop() ?? null;
  const next = ms.find((m) => m.start > now) ?? null;
  return { live, next };
}

export interface BoardRow {
  league: LeagueKey;
  leagueName: string;
  event: string;
  season: string;
  date: Date;
  live: boolean;
  days: number;
}

/** The departures board: everything live now, then what starts in the next year. */
export function boardRows(file: SeasonsFile, now = today()): BoardRow[] {
  const ms = moments(file);
  const live: BoardRow[] = ms
    .filter((m) => m.start <= now && now <= m.end)
    .map((m) => ({ league: m.league, leagueName: m.leagueName, event: m.phase.name, season: m.season, date: m.end, live: true, days: daysBetween(now, m.end) }));
  const upcoming: BoardRow[] = ms
    .filter((m) => m.start > now && daysBetween(now, m.start) <= 365)
    .map((m) => ({ league: m.league, leagueName: m.leagueName, event: m.phase.name, season: m.season, date: m.start, live: false, days: daysBetween(now, m.start) }));
  for (const [key, l] of Object.entries(file.leagues) as [LeagueKey, SeasonsFile["leagues"][LeagueKey]][]) {
    for (const e of l.events) {
      const d = parseDay(e.date);
      const days = daysBetween(now, d);
      if (days >= 0 && days <= 365) upcoming.push({ league: key, leagueName: l.name, event: e.name, season: String(d.getFullYear()), date: d, live: days === 0, days });
    }
  }
  upcoming.sort((a, b) => a.days - b.days);
  return [...live.sort((a, b) => a.days - b.days), ...upcoming];
}

/** The sport the locker room is getting ready for: the next regular season or postseason to start. */
export function nextUp(file: SeasonsFile, now = today()): Moment | null {
  return moments(file).find((m) => m.start > now && (m.phase.key === "reg" || m.phase.key === "post")) ?? null;
}
