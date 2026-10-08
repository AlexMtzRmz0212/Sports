// Shapes of the JSON files in public/data, written by pipeline/*.py.

export type LeagueKey = "mlb" | "nfl" | "nba" | "nhl" | "ligamx" | "ucl";

export interface Phase {
  key: "pre" | "reg" | "playin" | "post";
  name: string;
  start: string;
  end: string;
}

export interface Season {
  label: string;
  phases: Phase[];
}

export interface LeagueSeasons {
  name: string;
  seasons: Season[];
  events: { name: string; date: string }[];
}

export interface SeasonsFile {
  generated: string;
  leagues: Record<LeagueKey, LeagueSeasons>;
}

export interface MapTeam {
  name: string;
  abbr?: string | null;
  lat: number;
  lon: number;
  stadium?: string | null;
  city?: string | null;
  logo?: string | null;
  color?: string | null;
  conference?: string;
  league?: string;
  division?: string;
}

export interface TeamsFile<T = MapTeam> {
  generated: string;
  teams: T[];
}

export interface MlbTeam extends MapTeam {
  id: number;
  league: "American" | "National";
  division: "East" | "Central" | "West";
  state: string;
  firstYear: number | null;
  franchise: string;
}

export interface WorldSeries {
  year: number;
  champion: string | null;
  runnerUp?: string;
  wins?: number;
  losses?: number;
  ties?: number;
  franchise?: string;
  runnerUpFranchise?: string;
  note?: string;
}

export interface WorldSeriesFile {
  generated: string;
  series: WorldSeries[];
  byFranchise: { franchise: string; titles: number; years: number[] }[];
}

export interface WbcTeam {
  abbr: string;
  name: string;
  iso2: string | null;
}

export interface WbcGame {
  pk: number;
  date: string;
  start: string;
  stage: string;
  type: "F" | "D" | "L" | "W";
  label: string;
  venue: string;
  city: string | null;
  away: WbcTeam;
  home: WbcTeam;
  awayScore: number | null;
  homeScore: number | null;
  final: boolean;
  status: string;
}

export interface WbcHitter {
  name: string;
  team: string;
  pa: number;
  ab: number;
  h: number;
  hr: number;
  rbi: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface WbcEdition {
  year: number;
  edition: number;
  complete: boolean;
  start: string;
  end: string;
  nations: number;
  games: number;
  runs: number;
  venues: string[];
  champion: WbcTeam | null;
  runnerUp: WbcTeam | null;
  final: WbcGame | null;
  mvp: { name: string; team: string } | null;
  topHitters: WbcHitter[];
  leaders: { hits: WbcHitter; homeRuns: WbcHitter; rbi: WbcHitter };
  records: Record<string, { w: number; l: number; rf: number; ra: number; stage: number }>;
}

export interface WbcNation extends WbcTeam {
  apps: number;
  w: number;
  l: number;
  rf: number;
  ra: number;
  titles: number;
  pct: number;
  bestFinish: string;
  bestYears: number[];
}

export interface WbcFile {
  generated: string;
  editions: WbcEdition[];
  nations: WbcNation[];
  records: { label: string; value: string | number; who: string; team?: string; year: number }[];
}

export interface WbcGamesFile {
  generated: string;
  year: number;
  games: WbcGame[];
  teams: WbcTeam[];
}

export interface TableRow {
  team: string;
  logo?: string | null;
  rank: number;
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
}

export interface LigaMxFinalLeg {
  date: string;
  venue: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  homeGoals: number;
  awayGoals: number;
  penHome: number | null;
  penAway: number | null;
}

export interface LigaMxTournament {
  name: string;
  torneo: "Apertura" | "Clausura";
  year: number;
  champion: string | null;
  runnerUp: string | null;
  aggregate: string | null;
  onPenalties: boolean;
  finalLegs: LigaMxFinalLeg[];
  table: TableRow[];
}

export interface LigaMxFile {
  generated: string;
  teams: MapTeam[];
  archive: LigaMxTournament[];
  live: { name: string; season: string; rows: TableRow[] } | null;
}

export interface UclFile {
  generated: string;
  finals: { year: number; champion: string; runnerUp: string }[];
  byClub: { club: string; titles: number; years: number[] }[];
  live: { name: string; season: string; rows: TableRow[] } | null;
}

export interface WcSide {
  name: string;
  abbr: string;
  flag: string | null;
  score: number | null;
  shootout: number | null;
  winner: boolean;
}

export interface WcMatch {
  id: string;
  start: string;
  round: string;
  group?: string;
  home: WcSide;
  away: WcSide;
  status: string;
  final: boolean;
  venue: string;
  city: string;
}

export interface WcGroupRow extends Omit<TableRow, "logo"> {
  abbr: string;
  flag: string | null;
  advanced: boolean;
}

export interface WorldCupFile {
  generated: string;
  year: number;
  hosts: string;
  complete: boolean;
  champion: WcSide | null;
  runnerUp: WcSide | null;
  final: WcMatch | null;
  matches: number;
  goals: number;
  nations: number;
  games: WcMatch[];
  groups: { name: string; rows: WcGroupRow[] }[];
  venues: { name: string; abbr: string; city: string; country: string; lat: number; lon: number; matches: number; final: boolean }[];
  history: { year: number; host: string; champion: string; runnerUp: string }[];
  byNation: { nation: string; titles: number; years: number[] }[];
}
