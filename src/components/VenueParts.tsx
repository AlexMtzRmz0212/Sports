import { useMemo, useState, type ReactNode } from "react";
import { daysBetween, formatDay, inDays, leagueStatus, today } from "../lib/seasons";
import type { LeagueKey, MapTeam, SeasonsFile } from "../lib/types";
import "./VenueParts.css";

/** The big painted sign at the top of each venue. */
export function VenueSign({ league, place, children }: { league: string; place: string; children?: ReactNode }) {
  return (
    <header className="venue-sign wrap">
      <p className="venue-league">{league}</p>
      <h1>{place}</h1>
      {children}
    </header>
  );
}

export interface Reading {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
}

/** Status readings for a league: what is on now, what is next. */
export function seasonReadings(file: SeasonsFile, league: LeagueKey): Reading[] {
  const { live, next } = leagueStatus(file, league);
  const now = today();
  const out: Reading[] = [];
  if (live) {
    const day = daysBetween(live.start, now) + 1;
    out.push({ label: "On now", value: live.phase.name, detail: `Day ${day}, runs through ${formatDay(live.end, true)}` });
  } else {
    out.push({ label: "On now", value: "Offseason" });
  }
  if (next) {
    out.push({ label: "Next", value: next.phase.name, detail: `${formatDay(next.start, true)}, ${inDays(daysBetween(now, next.start))}` });
  }
  return out;
}

/** A row of status panels; each venue skins .readings differently. */
export function Readings({ items, className = "" }: { items: Reading[]; className?: string }) {
  return (
    <dl className={`readings ${className}`}>
      {items.map((r) => (
        <div key={r.label} className="reading">
          <dt>{r.label}</dt>
          <dd>
            <span className="reading-value">{r.value}</span>
            {r.detail && <span className="reading-detail">{r.detail}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Conferences and divisions with their teams. */
export function DivisionGrid({ teams, conferenceOf, divisionOf }: { teams: MapTeam[]; conferenceOf: (t: MapTeam) => string; divisionOf: (t: MapTeam) => string }) {
  const grouped = useMemo(() => {
    const conf = new Map<string, Map<string, MapTeam[]>>();
    for (const t of teams) {
      const c = conf.get(conferenceOf(t)) ?? new Map();
      c.set(divisionOf(t), [...(c.get(divisionOf(t)) ?? []), t]);
      conf.set(conferenceOf(t), c);
    }
    return [...conf].sort(([a], [b]) => a.localeCompare(b));
  }, [teams, conferenceOf, divisionOf]);
  return (
    <div className="divisions">
      {grouped.map(([conf, divs]) => (
        <section key={conf} className="division-conf">
          <h3>{conf}</h3>
          <div className="division-list">
            {[...divs].sort(([a], [b]) => a.localeCompare(b)).map(([div, list]) => (
              <div key={div} className="division">
                <h4>{div}</h4>
                <ul>
                  {list
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((t) => (
                      <li key={t.name}>
                        {t.logo ? <img src={t.logo} alt="" width={22} height={22} loading="lazy" referrerPolicy="no-referrer" /> : <span className="dot" />}
                        <span>{t.name}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export interface Column<T> {
  key: string;
  label: string;
  value: (row: T) => string | number | null;
  render?: (row: T) => ReactNode;
  numeric?: boolean;
}

/** A table that sorts when you click a column header. */
export function SortableTable<T>({ rows, columns, initial, caption }: { rows: T[]; columns: Column<T>[]; initial: { key: string; dir: 1 | -1 }; caption: string }) {
  const [sort, setSort] = useState(initial);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key)!;
    return rows.slice().sort((a, b) => {
      const va = col.value(a);
      const vb = col.value(b);
      if (va === vb) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return (va > vb ? 1 : -1) * sort.dir;
    });
  }, [rows, columns, sort]);
  return (
    <div className="scroll-x">
      <table className="data-table">
        <caption className="visually-hidden">{caption}. Select a column header to sort.</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.numeric ? "is-num" : ""} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                <button type="button" onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? ((-s.dir) as 1 | -1) : c.numeric ? -1 : 1 }))}>
                  {c.label}
                  <span aria-hidden className="sort-mark">
                    {sort.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : ""}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className={c.numeric ? "is-num num" : ""}>
                  {c.render ? c.render(r) : c.value(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Loading({ what }: { what: string }) {
  return <p className="wrap loading">{what}</p>;
}

export function LoadError({ error }: { error: string }) {
  return <p className="wrap load-error">This venue's data did not load ({error}). Refresh to try again.</p>;
}
