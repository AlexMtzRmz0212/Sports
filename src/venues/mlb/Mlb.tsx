import SeasonTimeline from "../../components/SeasonTimeline";
import TeamMap from "../../components/TeamMap";
import { DivisionGrid, LoadError, Loading, Readings, SortableTable, VenueSign, seasonReadings, type Column } from "../../components/VenueParts";
import { useData } from "../../lib/data";
import type { MlbTeam, SeasonsFile, TeamsFile, WorldSeriesFile } from "../../lib/types";
import { venueById } from "../../lib/venues";
import * as map from "./mapConfig";
import "./Mlb.css";

const venue = venueById("mlb");

const teamColumns: Column<MlbTeam>[] = [
  {
    key: "name",
    label: "Team",
    value: (t) => t.name,
    render: (t) => (
      <span className="team-cell">
        <img src={t.logo!} alt="" loading="lazy" referrerPolicy="no-referrer" />
        {t.name}
      </span>
    ),
  },
  { key: "league", label: "League", value: (t) => t.league },
  { key: "division", label: "Division", value: (t) => t.division },
  { key: "stadium", label: "Ballpark", value: (t) => t.stadium ?? "" },
  { key: "city", label: "City", value: (t) => `${t.city}, ${t.state}` },
  { key: "firstYear", label: "First season", value: (t) => t.firstYear, numeric: true },
];

export default function Mlb() {
  const seasons = useData<SeasonsFile>("seasons");
  const teams = useData<TeamsFile<MlbTeam>>("mlb_teams");
  const ws = useData<WorldSeriesFile>("mlb_world_series");
  const error = seasons.error ?? teams.error ?? ws.error;
  if (error) return <LoadError error={error} />;
  if (!seasons.data || !teams.data || !ws.data) return <Loading what="Mowing the outfield…" />;

  const played = ws.data.series.filter((s) => s.champion);
  const last = played.at(-1)!;
  const leader = ws.data.byFranchise[0];
  const readings = [
    ...seasonReadings(seasons.data, "mlb"),
    { label: "Last champion", value: last.franchise, detail: `${last.year}, beat the ${last.runnerUpFranchise} ${last.wins}-${last.losses}` },
    { label: "Most titles", value: leader.franchise, detail: `${leader.titles} World Series, last in ${leader.years.at(-1)}` },
  ];

  return (
    <div className="mlb">
      <VenueSign league={venue.league} place={venue.place}>
        <Readings items={readings} className="scoreboard" />
      </VenueSign>

      <section className="wrap section" aria-labelledby="mlb-map">
        <div className="section-head">
          <h2 id="mlb-map">30 ballparks</h2>
          <p>Lines join the teams in each division; shading splits the league into its three regions.</p>
        </div>
        <TeamMap label="Map of MLB ballparks" teams={teams.data.teams} groupOf={map.groupOf} lineColor={map.lineColor} paths={map.paths} spread={map.spread} regions={map.regions} legend={map.legend} bounds={map.bounds} tiles={venue.tiles} />
      </section>

      <section className="wrap section" aria-labelledby="mlb-pennants">
        <div className="section-head">
          <h2 id="mlb-pennants">The pennant wall</h2>
          <p>World Series titles by franchise, counting every name a club has played under.</p>
        </div>
        <ul className="pennants">
          {ws.data.byFranchise.map((f) => (
            <li key={f.franchise} className="pennant" title={f.years.join(", ")}>
              <span className="pennant-count num">{f.titles}</span>
              <span className="pennant-name">{f.franchise}</span>
              <span className="pennant-years">{f.years.join(" ")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap section" aria-labelledby="mlb-roll">
        <div className="section-head">
          <h2 id="mlb-roll">Every World Series</h2>
          <p>{played.length} Fall Classics since 1903. Two years had none.</p>
        </div>
        <ol className="roll">
          {ws.data.series
            .slice()
            .reverse()
            .map((s) => (
              <li key={s.year} className={s.champion ? "" : "roll-none"}>
                <span className="roll-year num">{s.year}</span>
                {s.champion ? (
                  <span>
                    <strong>{s.champion}</strong>
                    <span className="muted">
                      {" "}
                      over {s.runnerUp}, {s.wins}-{s.losses}
                      {s.ties ? `-${s.ties}` : ""}
                    </span>
                  </span>
                ) : (
                  <span className="muted">{s.note}</span>
                )}
              </li>
            ))}
        </ol>
      </section>

      <section className="wrap section" aria-labelledby="mlb-divisions">
        <div className="section-head">
          <h2 id="mlb-divisions">Leagues and divisions</h2>
        </div>
        <DivisionGrid teams={teams.data.teams} conferenceOf={(t) => `${t.league} League`} divisionOf={(t) => t.division!} />
      </section>

      <section className="wrap section" aria-labelledby="mlb-teams">
        <div className="section-head">
          <h2 id="mlb-teams">Team register</h2>
          <p>From the MLB Stats API.</p>
        </div>
        <SortableTable rows={teams.data.teams} columns={teamColumns} initial={{ key: "name", dir: 1 }} caption="MLB teams" />
      </section>

      <section className="wrap section" aria-labelledby="mlb-calendar">
        <div className="section-head">
          <h2 id="mlb-calendar">Season calendar</h2>
          <p>Spring training, the long season, October. The diamond marks the All-Star Game.</p>
        </div>
        <div className="scoreboard-panel">
          <SeasonTimeline file={seasons.data} leagues={[{ key: "mlb", label: "MLB", color: "#d9753f" }]} monthsBack={6} monthsAhead={14} />
        </div>
      </section>
    </div>
  );
}
