import TeamMap from "../../components/TeamMap";
import { LoadError, Loading, Readings, VenueSign } from "../../components/VenueParts";
import { useData } from "../../lib/data";
import type { MapTeam, WcMatch, WcSide, WorldCupFile } from "../../lib/types";
import type { SpreadOptions } from "../../lib/spreadMarkers";
import { venueById } from "../../lib/venues";
import "./WorldCup.css";

const venue = venueById("worldcup");
const BOUNDS: [[number, number], [number, number]] = [[49.5, -123.5], [19, -71]];

const KNOCKOUTS = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final"];
const COUNTRY_COLORS: Record<string, string> = { "United States": "#3c5bd6", Canada: "#d52b1e", Mexico: "#1f9d55" };
const spread: SpreadOptions = { minKm: 60, iterations: 2, divFactor: 70 };
const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function Side({ s, won }: { s: WcSide; won: boolean }) {
  return (
    <span className={`wc-side ${won ? "won" : ""}`}>
      {s.flag && <img src={s.flag} alt="" width={22} height={22} loading="lazy" referrerPolicy="no-referrer" />}
      <span className="wc-name">{s.name}</span>
      <span className="wc-score num">
        {s.score ?? ""}
        {s.shootout !== null && s.shootout !== undefined && <sup> ({s.shootout})</sup>}
      </span>
    </span>
  );
}

function Tie({ m }: { m: WcMatch }) {
  return (
    <li className="wc-tie">
      <span className="wc-meta muted">
        {dayFmt.format(new Date(m.start))}, {m.city?.split(",")[0]}
        {m.status && m.status !== "FT" ? `, ${m.status}` : ""}
      </span>
      <Side s={m.home} won={m.home.winner} />
      <Side s={m.away} won={m.away.winner} />
    </li>
  );
}

export default function WorldCup() {
  const { data, error } = useData<WorldCupFile>("worldcup");
  if (error) return <LoadError error={error} />;
  if (!data) return <Loading what="Polishing the trophy…" />;

  const { champion, runnerUp, final } = data;
  const titles = data.byNation.find((n) => n.nation === champion?.name);
  const readings = [
    ...(champion ? [{ label: "Champions", value: champion.name, detail: `${data.year}, title number ${titles?.titles ?? 1}` }] : []),
    ...(final && champion && runnerUp
      ? [{ label: "The final", value: `${champion.score}-${runnerUp.score}`, detail: `over ${runnerUp.name}${final.status === "AET" ? " after extra time" : ""}, ${final.venue}` }]
      : []),
    { label: "In numbers", value: `${data.goals} goals`, detail: `${data.matches} matches, ${(data.goals / Math.max(data.matches, 1)).toFixed(2)} a game, ${data.nations} nations` },
    { label: "Next", value: "2030", detail: "Morocco, Portugal and Spain, with centenary games in South America" },
  ];
  const stadiums: MapTeam[] = data.venues.map((v) => ({
    name: v.name,
    abbr: v.abbr,
    lat: v.lat,
    lon: v.lon,
    city: v.city,
    stadium: `${v.matches} matches${v.final ? ", including the final" : ""}`,
    color: COUNTRY_COLORS[v.country],
  }));

  return (
    <div className="worldcup">
      <VenueSign league={`World Cup ${data.year}`} place={venue.place}>
        <Readings items={readings} className="trophy" />
      </VenueSign>

      <section className="wrap section" aria-labelledby="wc-bracket">
        <div className="section-head">
          <h2 id="wc-bracket">The knockout rounds</h2>
          <p>32 teams left after the groups, in kickoff order. Scroll sideways on small screens.</p>
        </div>
        <div className="bracket scroll-x">
          {KNOCKOUTS.map((round) => (
            <section key={round} className="bracket-round" aria-label={round}>
              <h3>{round}</h3>
              <ol>
                {data.games
                  .filter((m) => m.round === round)
                  .map((m) => (
                    <Tie key={m.id} m={m} />
                  ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <section className="wrap section" aria-labelledby="wc-groups">
        <div className="section-head">
          <h2 id="wc-groups">Twelve groups</h2>
          <p>The top two in each group went through, plus the eight best third-placed teams. Highlighted rows advanced.</p>
        </div>
        <div className="wc-groups">
          {data.groups.map((g) => (
            <table key={g.name} className="wc-group">
              <caption>{g.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Team</th>
                  <th scope="col" className="is-num">P</th>
                  <th scope="col" className="is-num">GD</th>
                  <th scope="col" className="is-num">Pts</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.team} className={r.advanced ? "advanced" : ""}>
                    <td>
                      <span className="team-cell">
                        {r.flag && <img src={r.flag} alt="" loading="lazy" referrerPolicy="no-referrer" />}
                        {r.team}
                      </span>
                    </td>
                    <td className="is-num num">{r.gp}</td>
                    <td className="is-num num">{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</td>
                    <td className="is-num num pts">{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </section>

      <section className="wrap section" aria-labelledby="wc-map">
        <div className="section-head">
          <h2 id="wc-map">16 stadiums, three countries</h2>
          <p>Rings show the host country. Click a stadium for its match count.</p>
        </div>
        <TeamMap
          label="Map of 2026 World Cup stadiums"
          teams={stadiums}
          spread={spread}
          legend={Object.entries(COUNTRY_COLORS).map(([label, color]) => ({ label, color, kind: "dot" as const }))}
          bounds={BOUNDS}
          tiles={venue.tiles}
        />
      </section>

      <section className="wrap section" aria-labelledby="wc-history">
        <div className="section-head">
          <h2 id="wc-history">Every winner since 1930</h2>
          <p>West Germany's titles count toward Germany, as FIFA records them.</p>
        </div>
        <ul className="wc-stars">
          {data.byNation.map((n) => (
            <li key={n.nation}>
              <span className="wc-star-row" aria-label={`${n.titles} titles`}>
                {"★".repeat(n.titles)}
              </span>
              <span className="wc-star-nation">{n.nation}</span>
              <span className="wc-star-years num">{n.years.join(" ")}</span>
            </li>
          ))}
        </ul>
        <ol className="wc-history">
          {data.history
            .slice()
            .reverse()
            .map((h) => (
              <li key={h.year}>
                <span className="num wc-year">{h.year}</span>
                <span>
                  <strong>{h.champion}</strong> <span className="muted">over {h.runnerUp}, in {h.host}</span>
                </span>
              </li>
            ))}
        </ol>
      </section>
    </div>
  );
}
