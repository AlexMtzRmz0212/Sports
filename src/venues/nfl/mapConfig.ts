// Ported from NFL/Map/NFL_Map.py. The original legend had East and South colors swapped.
import type { LegendItem, Region } from "../../components/TeamMap";
import type { SpreadOptions } from "../../lib/spreadMarkers";
import type { MapTeam } from "../../lib/types";

export const CONFERENCE_COLORS: Record<string, string> = { AFC: "#d50a0a", NFC: "#2f6fdb" };

export const spread: SpreadOptions = {
  minKm: 70,
  iterations: 2,
  divFactor: 70,
  custom: [
    ["New York Jets", "New York Giants", -60, 15],
    ["Washington Commanders", "Baltimore Ravens", -60, 50],
    ["Los Angeles Rams", "Los Angeles Chargers", 60, 15],
  ],
};

export const paths: Record<string, string[]> = {
  "AFC East": ["Miami Dolphins", "New England Patriots", "New York Jets", "Buffalo Bills"],
  "NFC East": ["Dallas Cowboys", "Washington Commanders", "Philadelphia Eagles", "New York Giants"],
  "AFC North": ["Baltimore Ravens", "Pittsburgh Steelers", "Cincinnati Bengals", "Pittsburgh Steelers", "Cleveland Browns"],
  "NFC North": ["Minnesota Vikings", "Green Bay Packers", "Chicago Bears", "Detroit Lions"],
  "AFC South": ["Houston Texans", "Tennessee Titans", "Indianapolis Colts", "Jacksonville Jaguars"],
  "NFC South": ["Atlanta Falcons", "Carolina Panthers", "Atlanta Falcons", "New Orleans Saints", "Atlanta Falcons", "Tampa Bay Buccaneers"],
  "AFC West": ["Kansas City Chiefs", "Denver Broncos", "Las Vegas Raiders", "Los Angeles Chargers"],
  "NFC West": ["Arizona Cardinals", "Los Angeles Rams", "San Francisco 49ers", "Seattle Seahawks"],
};

export const groupOf = (t: MapTeam) => `${t.conference} ${t.division}`;
export const lineColor = (group: string) => CONFERENCE_COLORS[group.split(" ")[0]];

const A: [number, number] = [32, -110];
const NE: [number, number] = [42.5, -81.5];
const NE2: [number, number] = [39.2, -75.8];
const NE3: [number, number] = [38.7, -84];

const WEST = "#7b4fd6", NORTH = "#e6c229", EAST = "#2e9e5b", SOUTH = "#22b5c9";

export const regions: Region[] = [
  { name: "West", color: WEST, coords: [[49, -125], [49, -95], [40.5, -95], [40.5, -92.5], [38, -92.5], A, [32, -125]] },
  { name: "North", color: NORTH, coords: [[49, -95], NE, NE2, NE3, [38.7, -85], [40.5, -85], [40.5, -95]] },
  { name: "East", color: EAST, coords: [NE, [43.5, -79], [43.5, -69.5], [25.5, -79], [25.5, -81.5], [37.8, -75], [31.9, -98], [32.8, -98], [36.5, -84], NE3, NE2] },
  { name: "South", color: SOUTH, coords: [[40.5, -92.5], [40.5, -85], [38.7, -85], NE3, [36.5, -84], [32.8, -98], [31.9, -98], [37.8, -75], [25.5, -81.5], A, [38, -92.5], [40.5, -92.5]] },
];

export const legend: LegendItem[] = [
  { label: "AFC division", color: CONFERENCE_COLORS.AFC, kind: "line" },
  { label: "NFC division", color: CONFERENCE_COLORS.NFC, kind: "line" },
  { label: "West", color: WEST, kind: "area" },
  { label: "North", color: NORTH, kind: "area" },
  { label: "East", color: EAST, kind: "area" },
  { label: "South", color: SOUTH, kind: "area" },
];

export const bounds: [[number, number], [number, number]] = [[48.5, -123], [25.5, -70]];
