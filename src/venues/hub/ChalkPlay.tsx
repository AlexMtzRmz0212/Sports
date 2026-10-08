import type { ReactNode } from "react";
import type { LeagueKey } from "../../lib/types";

// Coach's whiteboard sketches, one per sport. O = our players, X = defense.
const O = (x: number, y: number) => <circle key={`o${x}-${y}`} cx={x} cy={y} r={9} />;
const X = (x: number, y: number) => <path key={`x${x}-${y}`} d={`M${x - 8} ${y - 8}l16 16M${x + 8} ${y - 8}l-16 16`} />;
const run = (d: string, dashed = false) => <path key={d} d={d} markerEnd="url(#chalk-arrow)" strokeDasharray={dashed ? "7 8" : undefined} />;

const PLAYS: Record<LeagueKey, { title: string; draw: ReactNode }> = {
  nba: {
    title: "Pick and roll from the top of the key",
    draw: (
      <>
        <path d="M30 40H370" />
        <rect x="140" y="40" width="120" height="130" />
        <path d="M150 170a50 50 0 0 0 100 0" />
        <path d="M58 40v60a142 142 0 0 0 284 0V40" />
        <circle cx="200" cy="62" r="8" />
        {O(200, 238)} {O(300, 200)} {O(95, 190)} {O(330, 80)} {O(70, 80)}
        {X(205, 210)} {X(290, 175)} {X(110, 168)}
        {run("M300 200C285 220 240 236 214 236")}
        {run("M200 238C190 205 165 160 180 110")}
        {run("M214 236C250 230 290 150 222 90", true)}
      </>
    ),
  },
  nfl: {
    title: "Play-action, deep post off a fake handoff",
    draw: (
      <>
        <path d="M20 170H380" strokeDasharray="3 6" />
        {[110, 150, 190, 230, 270].map((x) => O(x, 190))}
        {O(190, 228)} {O(190, 262)} {O(40, 190)} {O(360, 190)}
        {[120, 170, 210, 260].map((x) => X(x, 150))}
        {X(60, 110)} {X(330, 110)} {X(200, 70)}
        {run("M40 190V105L150 50")}
        {run("M360 190V130H290")}
        {run("M190 262C230 262 250 250 255 230", true)}
        {run("M190 228C150 240 120 260 100 262")}
      </>
    ),
  },
  mlb: {
    title: "Hit and run: the runner goes, the batter goes the other way",
    draw: (
      <>
        <path d="M200 280L320 160L200 40L80 160Z" />
        <path d="M200 280L20 100M200 280L380 100" strokeDasharray="2 7" />
        <circle cx="200" cy="168" r="12" />
        <rect x="314" y="154" width="12" height="12" />
        <rect x="194" y="34" width="12" height="12" />
        <rect x="74" y="154" width="12" height="12" />
        {O(330, 182)} {O(212, 266)}
        {X(200, 168)} {X(258, 92)} {X(140, 92)} {X(300, 136)} {X(100, 136)}
        {run("M330 182C320 120 280 80 216 46")}
        {run("M212 266C250 210 300 150 350 110", true)}
      </>
    ),
  },
  nhl: {
    title: "Cycle low, then hit the point for a one-timer",
    draw: (
      <>
        <path d="M30 40H310a60 60 0 0 1 60 60V200a60 60 0 0 1 -60 60H30" />
        <path d="M30 40V260" strokeWidth="5" />
        <path d="M300 150a18 18 0 0 1 0 0M318 132v36" />
        <circle cx="250" cy="95" r="30" />
        <circle cx="250" cy="205" r="30" />
        {O(330, 230)} {O(280, 70)} {O(110, 90)} {O(110, 210)} {O(230, 150)}
        {X(300, 205)} {X(255, 120)} {X(180, 150)}
        {run("M330 230C350 180 340 110 296 76")}
        {run("M280 70C220 60 160 70 122 86", true)}
        {run("M110 90C150 120 220 140 296 150", true)}
      </>
    ),
  },
  ligamx: {
    title: "Overlap down the right, cut back to the penalty spot",
    draw: (
      <>
        <path d="M20 40H380V270H20Z" />
        <path d="M110 40V130H290V40" />
        <path d="M160 40V75H240V40" />
        <path d="M150 130a55 55 0 0 0 100 0" />
        <circle cx="200" cy="106" r="3" />
        <path d="M20 270a40 40 0 0 1 80 0M300 270a40 40 0 0 1 80 0" />
        {O(330, 220)} {O(280, 190)} {O(200, 200)} {O(120, 175)} {O(200, 150)}
        {X(300, 150)} {X(230, 125)} {X(170, 125)} {X(250, 175)}
        {run("M330 220C350 160 345 110 330 80")}
        {run("M280 190C300 175 320 150 328 100", true)}
        {run("M330 80C290 95 240 105 206 106", true)}
        {run("M200 200C200 170 200 140 204 116")}
      </>
    ),
  },
  ucl: {
    title: "Corner to the near post, flick on for the back-post run",
    draw: (
      <>
        <path d="M20 40H380" />
        <path d="M80 40V150H320V40" />
        <path d="M150 40V80H250V40" />
        <path d="M165 150a40 40 0 0 0 70 0" />
        <circle cx="200" cy="118" r="3" />
        <path d="M368 40a12 12 0 0 1 12 12" />
        {O(372, 52)} {O(175, 92)} {O(150, 130)} {O(250, 125)} {O(205, 175)}
        {X(185, 75)} {X(215, 100)} {X(255, 95)} {X(160, 108)}
        {run("M372 52C330 90 230 100 182 90", true)}
        {run("M150 130C170 100 210 70 238 66")}
        {run("M182 90C200 80 220 72 236 68", true)}
        {run("M250 125C260 105 255 85 246 74")}
      </>
    ),
  },
};

export default function ChalkPlay({ league }: { league: LeagueKey }) {
  const play = PLAYS[league];
  return (
    <figure className="chalk-play">
      <svg viewBox="0 0 400 300" role="img" aria-label={play.title}>
        <defs>
          <filter id="chalk-line">
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" />
          </filter>
          <marker id="chalk-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </marker>
        </defs>
        <g filter="url(#chalk-line)" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {play.draw}
        </g>
      </svg>
      <figcaption>{play.title}</figcaption>
    </figure>
  );
}
