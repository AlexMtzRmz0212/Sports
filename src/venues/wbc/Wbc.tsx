import { useState } from "react";
import { Link } from "react-router-dom";
import "@fontsource/dm-serif-display/400";
import "@fontsource/libre-baskerville/400";
import "@fontsource/libre-baskerville/700";
import { LoadError, Loading, SortableTable, type Column } from "../../components/VenueParts";
import { useData } from "../../lib/data";
import { formatDay, parseDay } from "../../lib/seasons";
import type { WbcEdition, WbcFile, WbcNation } from "../../lib/types";
import Flag from "./Flag";
import { STORIES } from "./stories";
import "./Wbc.css";

const avg = (n: number) => n.toFixed(3).replace(/^0/, "");

const nationColumns: Column<WbcNation>[] = [
  {
    key: "name",
    label: "Nation",
    value: (n) => n.name,
    render: (n) => (
      <span className="team-cell">
        <Flag team={n} size={16} />
        {n.name}
      </span>
    ),
  },
  { key: "apps", label: "Classics", value: (n) => n.apps, numeric: true },
  { key: "w", label: "W", value: (n) => n.w, numeric: true },
  { key: "l", label: "L", value: (n) => n.l, numeric: true },
  { key: "pct", label: "Win %", value: (n) => n.pct, render: (n) => avg(n.pct), numeric: true },
  { key: "diff", label: "Run diff", value: (n) => n.rf - n.ra, render: (n) => (n.rf - n.ra > 0 ? `+${n.rf - n.ra}` : n.rf - n.ra), numeric: true },
  { key: "titles", label: "Titles", value: (n) => n.titles, numeric: true },
  { key: "best", label: "Best finish", value: (n) => n.bestFinish, render: (n) => `${n.bestFinish} (${n.bestYears.join(", ")})` },
];

function EditionDetail({ ed, nations }: { ed: WbcEdition; nations: WbcNation[] }) {
  const f = ed.final!;
  const team = (abbr: string) => nations.find((n) => n.abbr === abbr);
  const champRecord = ed.records[ed.champion!.abbr];
  return (
    <article className="edition" aria-labelledby={`ed-${ed.year}`}>
      <header className="edition-head">
        <p className="edition-kicker">
          Edition {ed.edition}, {formatDay(parseDay(ed.start), true)} to {formatDay(parseDay(ed.end), true)}
        </p>
        <h3 id={`ed-${ed.year}`}>
          <Flag team={ed.champion!} size={30} /> {ed.champion!.name}
        </h3>
        <p className="edition-final">
          {f.away.name} {f.awayScore}, {f.home.name} {f.homeScore} in the final at {f.venue}
        </p>
      </header>

      <div className="edition-grid">
        <div className="edition-story">
          <p className="dropcap">{STORIES[ed.year] ?? ""}</p>
          <Link to={`/wbc/${ed.year}`} className="press-link">
            Every game of {ed.year}
          </Link>
        </div>

        <dl className="edition-facts">
          <div>
            <dt>Champion's record</dt>
            <dd className="num">
              {champRecord.w}-{champRecord.l}
            </dd>
          </div>
          <div>
            <dt>Nations</dt>
            <dd className="num">{ed.nations}</dd>
          </div>
          <div>
            <dt>Runs per game</dt>
            <dd className="num">{(ed.runs / ed.games).toFixed(1)}</dd>
          </div>
          {ed.mvp && (
            <div>
              <dt>MVP</dt>
              <dd>
                {ed.mvp.name} <span className="muted">{team(ed.mvp.team)?.name ?? ed.mvp.team}</span>
              </dd>
            </div>
          )}
          <div>
            <dt>Most hits</dt>
            <dd>
              {ed.leaders.hits.name} <span className="muted num">{ed.leaders.hits.h}</span>
            </dd>
          </div>
          <div>
            <dt>Most home runs</dt>
            <dd>
              {ed.leaders.homeRuns.name} <span className="muted num">{ed.leaders.homeRuns.hr}</span>
            </dd>
          </div>
        </dl>
      </div>

      <h4 className="press-subhead">Top hitters by OPS, at least 15 plate appearances</h4>
      <div className="scroll-x">
        <table className="press-table">
          <thead>
            <tr>
              <th scope="col">Player</th>
              <th scope="col" className="is-num">PA</th>
              <th scope="col" className="is-num">AVG</th>
              <th scope="col" className="is-num">HR</th>
              <th scope="col" className="is-num">RBI</th>
              <th scope="col" className="is-num">OPS</th>
            </tr>
          </thead>
          <tbody>
            {ed.topHitters.map((h) => (
              <tr key={h.name + h.team}>
                <td>
                  {h.name} <span className="muted">{h.team}</span>
                </td>
                <td className="is-num num">{h.pa}</td>
                <td className="is-num num">{avg(h.avg)}</td>
                <td className="is-num num">{h.hr}</td>
                <td className="is-num num">{h.rbi}</td>
                <td className="is-num num">{avg(h.ops)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default function Wbc() {
  const { data, error } = useData<WbcFile>("wbc");
  const decided = data?.editions.filter((e) => e.champion) ?? [];
  const [year, setYear] = useState<number | null>(null);
  if (error) return <LoadError error={error} />;
  if (!data) return <Loading what="Warming up the press box…" />;

  const selected = decided.find((e) => e.year === year) ?? decided.at(-1)!;
  const titles = data.nations.filter((n) => n.titles > 0);
  const totalGames = data.editions.reduce((s, e) => s + e.games, 0);

  return (
    <div className="wbc">
      <div className="bunting" aria-hidden />
      <header className="wrap masthead">
        <p className="masthead-dateline">The press box, World Baseball Classic desk</p>
        <h1>The Classic</h1>
        <p className="masthead-deck">
          {data.editions.length} tournaments, {totalGames} games, {titles.length} different champions. Scores and stats are counted from the official game logs.
        </p>
      </header>

      <section className="wrap section-tight" aria-label="Champions by year">
        <div className="champ-strip" role="tablist" aria-label="Choose an edition">
          {decided.map((e) => (
            <button key={e.year} role="tab" type="button" aria-selected={e.year === selected.year} className="champ-tab" onClick={() => setYear(e.year)}>
              <span className="champ-year num">{e.year}</span>
              <Flag team={e.champion!} size={22} />
              <span className="champ-name">{e.champion!.name}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel">
          <EditionDetail ed={selected} nations={data.nations} />
        </div>
      </section>

      <section className="wrap section" aria-labelledby="wbc-nations">
        <div className="section-head">
          <h2 id="wbc-nations">The nations</h2>
          <p>All-time records across every Classic. Select a column to sort.</p>
        </div>
        <SortableTable rows={data.nations} columns={nationColumns} initial={{ key: "titles", dir: -1 }} caption="WBC nations" />
      </section>

      <section className="wrap section" aria-labelledby="wbc-records">
        <div className="section-head">
          <h2 id="wbc-records">Record book</h2>
        </div>
        <ul className="records">
          {data.records.map((r) => (
            <li key={r.label + r.who}>
              <span className="record-value num">{r.value}</span>
              <span className="record-label">{r.label}</span>
              <span className="record-who">
                {r.who}
                {r.team ? `, ${data.nations.find((n) => n.abbr === r.team)?.name ?? r.team}` : ""}, {r.year}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
