import type { LeagueKey } from "./types";

export type VenueTheme = "locker" | "ballpark" | "gridiron" | "worldpark" | "estadio" | "arena" | "rink" | "starball" | "worldstage";

export interface Venue {
  id: "hub" | LeagueKey | "wbc" | "worldcup";
  path: string;
  theme: VenueTheme;
  /** Short league name, used on lockers, the nav and calendar lanes. */
  league: string;
  /** Full competition name where the short one is an abbreviation. */
  fullName?: string;
  /** What you walk out into. */
  place: string;
  /** Which season data drives this venue (WBC and the World Cup have none). */
  seasons?: LeagueKey;
  tiles: "light" | "dark";
  /** Locker tape color, also the league's line on the hub calendar. */
  color: string;
}

export const VENUES: Venue[] = [
  { id: "hub", path: "/", theme: "locker", league: "Hub", place: "The Locker Room", tiles: "dark", color: "#f2c230" },
  { id: "mlb", path: "/mlb", theme: "ballpark", league: "MLB", place: "The Ballpark", seasons: "mlb", tiles: "light", color: "#e07a45" },
  { id: "nfl", path: "/nfl", theme: "gridiron", league: "NFL", place: "The Gridiron", seasons: "nfl", tiles: "dark", color: "#ffc72c" },
  { id: "nba", path: "/nba", theme: "arena", league: "NBA", place: "The Arena", seasons: "nba", tiles: "light", color: "#ff6a3d" },
  { id: "nhl", path: "/nhl", theme: "rink", league: "NHL", place: "The Rink", seasons: "nhl", tiles: "light", color: "#8fc3e6" },
  { id: "ligamx", path: "/ligamx", theme: "estadio", league: "Liga MX", place: "El Estadio", seasons: "ligamx", tiles: "dark", color: "#3fbf74" },
  { id: "ucl", path: "/ucl", theme: "starball", league: "UCL", fullName: "Champions League", place: "Final Night", seasons: "ucl", tiles: "dark", color: "#9fb4ff" },
  { id: "worldcup", path: "/worldcup", theme: "worldstage", league: "World Cup", place: "The World Stage", tiles: "dark", color: "#e2b33c" },
  { id: "wbc", path: "/wbc", theme: "worldpark", league: "WBC", place: "The Press Box", tiles: "light", color: "#e8d9b0" },
];

export function venueFor(pathname: string): Venue {
  const first = "/" + (pathname.split("/").filter(Boolean)[0] ?? "");
  return VENUES.find((v) => v.path === first) ?? VENUES[0];
}

export function venueById(id: Venue["id"]): Venue {
  return VENUES.find((v) => v.id === id)!;
}
