import { Link, useParams } from "react-router-dom";
import "@fontsource/dm-serif-display/400";
import "@fontsource/libre-baskerville/400";
import "@fontsource/libre-baskerville/700";
import { LoadError, Loading } from "../../components/VenueParts";
import { useData } from "../../lib/data";
import type { WbcFile, WbcGame, WbcGamesFile } from "../../lib/types";
import Flag from "./Flag";
import "./Wbc.css";

const timeFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function GameRow({ g }: { g: WbcGame }) {
  const awayWon = g.final && g.awayScore! > g.homeScore!;
  const homeWon = g.final && g.homeScore! > g.awayScore!;
  return (
    <li className="game">
      <span className="game-when muted">{timeFmt.format(new Date(g.start))}</span>
      <span className={`game-team ${awayWon ? "won" : ""}`}>
        <Flag team={g.away} size={16} /> {g.away.name}
      </span>
      <span className="game-score num">{g.final ? `${g.awayScore}-${g.homeScore}` : "vs"}</span>
      <span className={`game-team ${homeWon ? "won" : ""}`}>
        <Flag team={g.home} size={16} /> {g.home.name}
      </span>
      <span className="game-where muted">{g.venue}</span>
    </li>
  );
}

function PoolTable({ games }: { games: WbcGame[] }) {
  const rows = new Map<string, { team: WbcGame["away"]; w: number; l: number; rf: number; ra: number }>();
  for (const g of games.filter((x) => x.final)) {
    for (const [side, other] of [["away", "home"], ["home", "away"]] as const) {
      const r = rows.get(g[side].abbr) ?? { team: g[side], w: 0, l: 0, rf: 0, ra: 0 };
      if (g[`${side}Score`]! > g[`${other}Score`]!) r.w++;
      else r.l++;
      r.rf += g[`${side}Score`]!;
      r.ra += g[`${other}Score`]!;
      rows.set(g[side].abbr, r);
    }
  }
  const sorted = [...rows.values()].sort((a, b) => b.w - a.w || b.rf - b.ra - (a.rf - a.ra));
  return (
    <table className="press-table pool-table">
      <thead>
        <tr>
          <th scope="col">Team</th>
          <th scope="col" className="is-num">W</th>
          <th scope="col" className="is-num">L</th>
          <th scope="col" className="is-num">RF</th>
          <th scope="col" className="is-num">RA</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => (
          <tr key={r.team.abbr}>
            <td>
              <span className="team-cell">
                <Flag team={r.team} size={14} />
                {r.team.name}
              </span>
            </td>
            <td className="is-num num">{r.w}</td>
            <td className="is-num num">{r.l}</td>
            <td className="is-num num">{r.rf}</td>
            <td className="is-num num">{r.ra}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** One edition's full slate: pool tables, every game, and the knockout rounds. */
export default function WbcEdition() {
  const { year: param } = useParams();
  const year = Number(param);
  const archive = useData<WbcFile>("wbc");
  const latest = useData<WbcGamesFile>(`wbc${year}_games`);
  if (archive.error) return <LoadError error={archive.error} />;
  if (!archive.data || (!latest.data && !latest.error)) return <Loading what="Pulling the box scores…" />;

  const ed = archive.data.editions.find((e) => e.year === year);
  if (!ed || !latest.data) {
    return (
      <div className="wbc wrap section">
        <h1 className="masthead-small">No game log for {param}</h1>
        <p>
          The Classic was played in 2006, 2009, 2013, 2017, 2023 and 2026. Pick one from the <Link to="/wbc">archive</Link>.
        </p>
      </div>
    );
  }

  const games = latest.data.games;
  // Labels vary by year ("Pool A Game 1", "Pool B - Game 1", "Pool A, Tokyo Dome"); the pool name is the stable part.
  // Until 2017 the second round (type D) was also played in pools; since 2023 it is single quarterfinals.
  const poolOf = (g: WbcGame) => (g.type === "F" || (g.type === "D" && year < 2023) ? (g.label.match(/Pool \w+/)?.[0] ?? null) : null);
  const pools = [...new Set(games.filter(poolOf).map((g) => `${g.type}|${poolOf(g)}`))].sort((a, b) => (a[0] === b[0] ? a.localeCompare(b) : a[0] === "F" ? -1 : 1));
  const knockouts = games.filter((g) => !poolOf(g));

  return (
    <div className="wbc">
      <div className="bunting" aria-hidden />
      <header className="wrap masthead">
        <p className="masthead-dateline">
          <Link to="/wbc">The Classic</Link>, edition {ed.edition}
        </p>
        <h1>{year}, game by game</h1>
        <p className="masthead-deck">
          {ed.games} games across {ed.venues.length} ballparks. Times are shown in your time zone.
        </p>
        {year === archive.data.editions.at(-1)!.year && (
          <a className="press-link" href={`${import.meta.env.BASE_URL}wbc${year}_schedule.ics`} download>
            Download the {year} calendar (.ics)
          </a>
        )}
      </header>

      <section className="wrap section-tight" aria-labelledby="ko">
        <h2 id="ko" className="press-h2">
          {knockouts.length > 3 ? "Knockout rounds" : "Semifinals and final"}
        </h2>
        <ul className="games">
          {knockouts.map((g) => (
            <GameRow key={g.pk} g={g} />
          ))}
        </ul>
      </section>

      {pools.map((key) => {
        const [type, pool] = key.split("|");
        const list = games.filter((g) => g.type === type && poolOf(g) === pool);
        const id = `pool-${type}-${pool.replace(" ", "")}`;
        return (
          <section key={key} className="wrap section-tight pool" aria-labelledby={id}>
            <h2 id={id} className="press-h2">
              {type === "D" ? "Second round, " : ""}
              {pool}, {list[0].city}
            </h2>
            <div className="pool-grid">
              <PoolTable games={list} />
              <ul className="games">
                {list.map((g) => (
                  <GameRow key={g.pk} g={g} />
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
