import SeasonTimeline from "../../components/SeasonTimeline";
import TeamMap from "../../components/TeamMap";
import { DivisionGrid, LoadError, Loading, Readings, VenueSign, seasonReadings } from "../../components/VenueParts";
import { useData } from "../../lib/data";
import { daysBetween, leagueStatus, today } from "../../lib/seasons";
import type { MapTeam, SeasonsFile, TeamsFile } from "../../lib/types";
import { venueById } from "../../lib/venues";
import * as map from "./mapConfig";
import "./Nfl.css";

const venue = venueById("nfl");

export default function Nfl() {
  const seasons = useData<SeasonsFile>("seasons");
  const teams = useData<TeamsFile>("nfl_teams");
  const error = seasons.error ?? teams.error;
  if (error) return <LoadError error={error} />;
  if (!seasons.data || !teams.data) return <Loading what="Lining the field…" />;

  const { live } = leagueStatus(seasons.data, "nfl");
  const week = live?.phase.key === "reg" ? Math.floor(daysBetween(live.start, today()) / 7) + 1 : null;
  const readings = seasonReadings(seasons.data, "nfl");
  if (week) readings.unshift({ label: "Regular season", value: `Week ${Math.min(week, 18)}`, detail: `of 18, ${live!.season} season` });

  return (
    <div className="nfl">
      <VenueSign league={venue.league} place={venue.place}>
        <Readings items={readings} className="jumbotron" />
      </VenueSign>

      <section className="wrap section" aria-labelledby="nfl-map">
        <div className="section-head">
          <h2 id="nfl-map">32 stadiums</h2>
          <p>Red lines join AFC divisions and blue lines NFC. MetLife and SoFi each host two teams.</p>
        </div>
        <TeamMap label="Map of NFL stadiums" teams={teams.data.teams} groupOf={map.groupOf} lineColor={map.lineColor} paths={map.paths} spread={map.spread} regions={map.regions} legend={map.legend} bounds={map.bounds} tiles={venue.tiles} />
      </section>

      <section className="wrap section" aria-labelledby="nfl-divisions">
        <div className="section-head">
          <h2 id="nfl-divisions">Conferences and divisions</h2>
        </div>
        <DivisionGrid teams={teams.data.teams} conferenceOf={(t: MapTeam) => t.conference!} divisionOf={(t: MapTeam) => `${t.conference} ${t.division}`} />
      </section>

      <section className="wrap section" aria-labelledby="nfl-calendar">
        <div className="section-head">
          <h2 id="nfl-calendar">Season calendar</h2>
          <p>Preseason in August, eighteen weeks of football, then the road to the Super Bowl.</p>
        </div>
        <div className="jumbotron-panel">
          <SeasonTimeline file={seasons.data} leagues={[{ key: "nfl", label: "NFL", color: "#ffc72c" }]} monthsBack={6} monthsAhead={12} />
        </div>
      </section>
    </div>
  );
}
