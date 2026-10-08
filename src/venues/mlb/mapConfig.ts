// Ported from MLB/Map/MLB_Map.py.
import type { LegendItem, Region } from "../../components/TeamMap";
import type { SpreadOptions } from "../../lib/spreadMarkers";
import type { MapTeam } from "../../lib/types";

export const LEAGUE_COLORS: Record<string, string> = { American: "#c8102e", National: "#1f4fa8" };

export const spread: SpreadOptions = {
  minKm: 140,
  iterations: 2,
  divFactor: 60,
  custom: [
    ["Milwaukee Brewers", "Chicago Cubs", 150, 20],
    ["Chicago White Sox", "Chicago Cubs", 250, 10],
    ["New York Yankees", "New York Mets", 330, 20],
    ["Los Angeles Dodgers", "Los Angeles Angels", 90, 20],
    ["Los Angeles Dodgers", "San Diego Padres", 90, 300],
    ["San Francisco Giants", "Athletics", 100, 15],
    ["Baltimore Orioles", "Washington Nationals", 300, 15],
  ],
};

// Visiting order per division. Repeats are deliberate: the line doubles back to draw a hub.
export const paths: Record<string, string[]> = {
  "American Central": ["Minnesota Twins", "Chicago White Sox", "Kansas City Royals", "Chicago White Sox", "Cleveland Guardians", "Detroit Tigers"],
  "American East": ["Toronto Blue Jays", "New York Yankees", "Boston Red Sox", "New York Yankees", "Baltimore Orioles", "Tampa Bay Rays"],
  "American West": ["Texas Rangers", "Houston Astros", "Los Angeles Angels", "Athletics", "Seattle Mariners"],
  "National Central": ["Milwaukee Brewers", "Chicago Cubs", "Cincinnati Reds", "Pittsburgh Pirates", "Cincinnati Reds", "St. Louis Cardinals"],
  "National East": ["Miami Marlins", "Atlanta Braves", "Washington Nationals", "New York Mets", "Philadelphia Phillies"],
  "National West": ["Colorado Rockies", "Arizona Diamondbacks", "San Diego Padres", "Los Angeles Dodgers", "San Francisco Giants"],
};

export const groupOf = (t: MapTeam) => `${t.league} ${t.division}`;
export const lineColor = (group: string) => LEAGUE_COLORS[group.split(" ")[0]];

// Region vertices from the original script (a..g, N..N4).
const a = -125.5, b = 49, c = -96, d = 36, e = -90, f = 31.5, g = 27;
const N: [number, number] = [45, -83];
const N2: [number, number] = [41.5, -78.5];
const N3: [number, number] = [38.7, -80];
const N4: [number, number] = [34, -90];

export const regions: Region[] = [
  { name: "West", color: "#7b4fd6", coords: [[b, a], [b, c], [d, c], N4, [g, e], [f, a]] },
  { name: "Central", color: "#e6c229", coords: [[b, c], N, N2, N3, N4, [d, c]] },
  { name: "East", color: "#2e9e5b", coords: [N, [44, -68], [23, -79], [g, e], N4, N3, N2] },
];

export const legend: LegendItem[] = [
  { label: "American League division", color: LEAGUE_COLORS.American, kind: "line" },
  { label: "National League division", color: LEAGUE_COLORS.National, kind: "line" },
  { label: "West", color: "#7b4fd6", kind: "area" },
  { label: "Central", color: "#e6c229", kind: "area" },
  { label: "East", color: "#2e9e5b", kind: "area" },
];

export const bounds: [[number, number], [number, number]] = [[49, -124], [25.5, -70]];
