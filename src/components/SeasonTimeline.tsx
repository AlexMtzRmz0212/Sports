import { daysBetween, formatDay, moments, parseDay, today } from "../lib/seasons";
import type { LeagueKey, SeasonsFile } from "../lib/types";
import "./SeasonTimeline.css";

interface Props {
  file: SeasonsFile;
  leagues: { key: LeagueKey; label: string; color: string }[];
  /** "chalk" draws with a rough chalk edge for the locker room board. */
  variant?: "chalk" | "plain";
  monthsBack?: number;
  monthsAhead?: number;
}

const W = 1000;
const LABEL_W = 92;
const LANE_H = 46;
const AXIS_H = 34;
const OPACITY = { pre: 0.45, reg: 0.9, playin: 0.65, post: 1 } as const;

export default function SeasonTimeline({ file, leagues: requested, variant = "plain", monthsBack = 3, monthsAhead = 12 }: Props) {
  // A stale cached seasons.json may predate a league; draw only what the file has.
  const leagues = requested.filter((l) => file.leagues[l.key]);
  const now = today();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthsAhead + 1, 1);
  const span = daysBetween(start, end);
  const x = (d: Date) => LABEL_W + (Math.min(Math.max(daysBetween(start, d), 0), span) / span) * (W - LABEL_W - 8);
  const height = AXIS_H + leagues.length * LANE_H + 8;

  const months: Date[] = [];
  for (let m = new Date(start); m < end; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) months.push(m);

  const chalk = variant === "chalk";
  const todayX = x(now);

  return (
    <div className={`timeline timeline-${variant} scroll-x`}>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`Season calendar from ${formatDay(start, true)} to ${formatDay(end, true)}`}>
        {chalk && (
          <defs>
            <filter id="chalk-edge">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" />
            </filter>
          </defs>
        )}
        {months.map((m) => (
          <g key={m.toISOString()} className="tl-month">
            <line x1={x(m)} x2={x(m)} y1={AXIS_H - 8} y2={height} />
            <text x={x(m) + 4} y={AXIS_H - 14}>
              {m.toLocaleDateString("en-US", { month: "short" })}
              {m.getMonth() === 0 ? ` ${m.getFullYear()}` : ""}
            </text>
          </g>
        ))}
        {leagues.map((lg, i) => {
          const y = AXIS_H + i * LANE_H;
          const ms = moments(file, lg.key).filter((mo) => mo.end >= start && mo.start <= end);
          const events = file.leagues[lg.key].events.map((e) => parseDay(e.date)).filter((d) => d >= start && d <= end);
          return (
            <g key={lg.key} className="tl-lane">
              <text className="tl-league" x={0} y={y + LANE_H / 2 + 6}>
                {lg.label}
              </text>
              <g filter={chalk ? "url(#chalk-edge)" : undefined}>
                {ms.map((mo) => {
                  const x1 = x(mo.start);
                  const x2 = Math.max(x(mo.end), x1 + 2);
                  const live = mo.start <= now && now <= mo.end;
                  return (
                    <g key={`${mo.season}-${mo.phase.key}-${mo.phase.name}`}>
                      <rect
                        x={x1}
                        y={y + 9}
                        width={x2 - x1}
                        height={LANE_H - 18}
                        rx={3}
                        fill={lg.color}
                        fillOpacity={chalk ? OPACITY[mo.phase.key] * 0.55 : OPACITY[mo.phase.key]}
                        stroke={chalk ? lg.color : "none"}
                        strokeWidth={live ? 2.5 : 1.5}
                      >
                        <title>{`${lg.label} ${mo.season}: ${mo.phase.name}, ${formatDay(mo.start, true)} to ${formatDay(mo.end, true)}`}</title>
                      </rect>
                    </g>
                  );
                })}
                {events.map((d) => (
                  <path key={d.toISOString()} className="tl-event" d={`M${x(d)} ${y + 4} l6 6 l-6 6 l-6 -6 z`}>
                    <title>{`${lg.label}: ${file.leagues[lg.key].events.find((e) => parseDay(e.date).getTime() === d.getTime())?.name}, ${formatDay(d, true)}`}</title>
                  </path>
                ))}
              </g>
              {/* Labels stay outside the chalk filter so the text is not distorted */}
              {ms.map((mo) => {
                const x1 = x(mo.start);
                const fits = x(mo.end) - x1 > mo.phase.name.length * 7.2 + 14;
                return (
                  fits && (
                    <text key={`label-${mo.season}-${mo.phase.name}`} className="tl-phase" x={x1 + 8} y={y + LANE_H / 2 + 5}>
                      {mo.phase.name}
                    </text>
                  )
                );
              })}
            </g>
          );
        })}
        <g className="tl-today">
          <line x1={todayX} x2={todayX} y1={AXIS_H - 6} y2={height} />
          <text x={todayX} y={height - 2} textAnchor="middle">
            Today
          </text>
        </g>
      </svg>
    </div>
  );
}
