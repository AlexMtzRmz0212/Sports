import LeagueTable from "../../components/LeagueTable";
import SeasonTimeline from "../../components/SeasonTimeline";
import TeamMap from "../../components/TeamMap";
import { LoadError, Loading, Readings, VenueSign, seasonReadings } from "../../components/VenueParts";
import { useData } from "../../lib/data";
import { formatDay, parseDay } from "../../lib/seasons";
import type { LigaMxFile, SeasonsFile } from "../../lib/types";
import type { SpreadOptions } from "../../lib/spreadMarkers";
import { venueById } from "../../lib/venues";
import "./LigaMx.css";

const venue = venueById("ligamx");
const BOUNDS: [[number, number], [number, number]] = [[32.6, -116.8], [17.6, -95.8]];


// América, Cruz Azul and Atlante share Estadio Banorte, so they need fixed angles to separate.
const spread: SpreadOptions = {
  minKm: 40,
  iterations: 2,
  divFactor: 90,
  custom: [
    ["América", "Atlante", 300, 9],
    ["América", "Cruz Azul", 60, 9],
    ["Atlante", "Cruz Azul", 180, 9],
  ],
};

// Liguilla bands: places 1-6 go straight to the quarterfinals, 7-10 play in.
const zone = (rank: number) => (rank <= 6 ? "a" : rank <= 10 ? "b" : null);

export default function LigaMx() {
  const seasons = useData<SeasonsFile>("seasons");
  const liga = useData<LigaMxFile>("ligamx");
  const error = seasons.error ?? liga.error;
  if (error) return <LoadError error={error} />;
  if (!seasons.data || !liga.data) return <Loading what="Lighting the bengalas…" />;

  const { live, archive, teams } = liga.data;
  const readings = seasonReadings(seasons.data, "ligamx");
  if (live?.rows[0]) readings.push({ label: "Top of the table", value: live.rows[0].team, detail: `${live.rows[0].pts} points from ${live.rows[0].gp} games` });

  return (
    <div className="ligamx">
      <VenueSign league={venue.league} place={venue.place}>
        <Readings items={readings} className="stands" />
      </VenueSign>

      {live && (
        <section className="wrap section" aria-labelledby="mx-table">
          <div className="section-head">
            <h2 id="mx-table">La tabla</h2>
            <p>
              {live.name.replace(/^(\d{4}) Torneo (\w+)$/, "$2 $1")}. Green rows go straight to the quarterfinals; amber rows play in.
            </p>
          </div>
          <LeagueTable rows={live.rows} zone={zone} label="Liga MX table" />
        </section>
      )}

      <section className="wrap section" aria-labelledby="mx-liguilla">
        <div className="section-head">
          <h2 id="mx-liguilla">How the Liguilla works</h2>
          <p>Each short tournament ends in its own playoff and crowns its own champion.</p>
        </div>
        <ol className="liguilla">
          <li>
            <h3>Top six go through</h3>
            <p>Places 1 to 6 after the 17 matchdays go straight to the quarterfinals.</p>
          </li>
          <li>
            <h3>Play-in</h3>
            <p>7th hosts 8th, and the winner takes the 7th seed. 9th hosts 10th, and the loser is out.</p>
          </li>
          <li>
            <h3>Last ticket</h3>
            <p>The loser of 7th v 8th hosts the winner of 9th v 10th for the 8th seed.</p>
          </li>
          <li>
            <h3>Two legs, twice</h3>
            <p>Quarterfinals and semifinals are home and away. Level on aggregate, the better-placed team goes through.</p>
          </li>
          <li>
            <h3>The final</h3>
            <p>Two legs again, but a tie on aggregate goes to extra time and penalties.</p>
          </li>
        </ol>
      </section>

      <section className="wrap section" aria-labelledby="mx-map">
        <div className="section-head">
          <h2 id="mx-map">{teams.length} clubs, {new Set(teams.map((t) => t.stadium)).size} stadiums</h2>
          <p>América, Cruz Azul and Atlante share Estadio Banorte, the old Azteca, this season.</p>
        </div>
        <TeamMap
          label="Map of Liga MX stadiums"
          teams={teams}
          spread={spread}
          legend={[]}
          bounds={BOUNDS}
          tiles={venue.tiles}
        />
      </section>

      <section className="wrap section" aria-labelledby="mx-archive">
        <div className="section-head">
          <h2 id="mx-archive">Champions 2021 to 2024</h2>
          <p>Rebuilt from every match of six tournaments. Open one to see its final and its table.</p>
        </div>
        <div className="archive">
          {archive
            .slice()
            .reverse()
            .map((t) => (
              <details key={t.name} className="archive-card">
                <summary>
                  <span className="archive-name">{t.name}</span>
                  <span className="archive-champ">{t.champion}</span>
                  <span className="archive-detail muted">
                    beat {t.runnerUp} {t.aggregate} on aggregate{t.onPenalties ? ", won on penalties" : ""}
                  </span>
                </summary>
                <div className="archive-body">
                  <h3>The final</h3>
                  <ul className="legs">
                    {t.finalLegs.map((leg) => (
                      <li key={leg.date}>
                        <span className="muted num">{formatDay(parseDay(leg.date), true)}</span>
                        <span>
                          {leg.home} <strong className="num">{leg.homeGoals}-{leg.awayGoals}</strong> {leg.away}
                          {leg.penHome !== null && <span className="muted"> ({leg.penHome}-{leg.penAway} on penalties)</span>}
                        </span>
                        <span className="muted">{leg.venue}</span>
                      </li>
                    ))}
                  </ul>
                  <h3>Regular-season table</h3>
                  <LeagueTable rows={t.table} label={`${t.name} regular-season table`} />
                </div>
              </details>
            ))}
        </div>
      </section>

      <section className="wrap section" aria-labelledby="mx-calendar">
        <div className="section-head">
          <h2 id="mx-calendar">Season calendar</h2>
          <p>Apertura from summer to December, Clausura from January to May, each closing with a Liguilla.</p>
        </div>
        <div className="stands-panel">
          <SeasonTimeline file={seasons.data} leagues={[{ key: "ligamx", label: "Liga MX", color: "#3fbf74" }]} monthsBack={6} monthsAhead={12} />
        </div>
      </section>
    </div>
  );
}
