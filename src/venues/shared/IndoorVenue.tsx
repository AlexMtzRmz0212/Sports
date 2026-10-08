import type { ReactNode } from "react";
import SeasonTimeline from "../../components/SeasonTimeline";
import TeamMap, { type LegendItem } from "../../components/TeamMap";
import { DivisionGrid, LoadError, Loading, Readings, VenueSign, seasonReadings } from "../../components/VenueParts";
import { useData } from "../../lib/data";
import { daysBetween, leagueStatus, today } from "../../lib/seasons";
import type { MapTeam, SeasonsFile, TeamsFile } from "../../lib/types";
import type { SpreadOptions } from "../../lib/spreadMarkers";
import { venueById } from "../../lib/venues";

interface Props {
  id: "nba" | "nhl";
  dataFile: string;
  loading: string;
  conferenceColors: Record<string, string>;
  spread: SpreadOptions;
  bounds: [[number, number], [number, number]];
  mapNote: string;
  calendarNote: string;
  /** Label for the big countdown, e.g. "Days to tip-off". */
  clockLabel: (phase: string) => string;
  extra?: ReactNode;
}

const groupOf = (t: MapTeam) => `${t.conference} ${t.division}`;

/** NBA arena and NHL rink: same building blocks, different floor. */
export default function IndoorVenue({ id, dataFile, loading, conferenceColors, spread, bounds, mapNote, calendarNote, clockLabel, extra }: Props) {
  const venue = venueById(id);
  const seasons = useData<SeasonsFile>("seasons");
  const teams = useData<TeamsFile>(dataFile);
  const error = seasons.error ?? teams.error;
  if (error) return <LoadError error={error} />;
  if (!seasons.data || !teams.data) return <Loading what={loading} />;

  const { next } = leagueStatus(seasons.data, id);
  const days = next ? daysBetween(today(), next.start) : null;
  const showClock = next !== null && days !== null && days <= 99;
  const legend: LegendItem[] = Object.entries(conferenceColors).map(([conf, color]) => ({ label: `${conf} Conference division`, color, kind: "line" }));

  return (
    <div className={`indoor indoor-${id}`}>
      <VenueSign league={venue.league} place={venue.place}>
        <div className={`indoor-hero ${showClock ? "has-clock" : ""}`}>
          {showClock && (
            <div className="clock" role="timer" aria-label={`${days} days until ${next!.phase.name}`}>
              <span className="clock-digits num">{String(days).padStart(2, "0")}</span>
              <span className="clock-label">{clockLabel(next!.phase.name)}</span>
            </div>
          )}
          <Readings items={seasonReadings(seasons.data, id)} className="boards" />
        </div>
      </VenueSign>

      <section className="wrap section" aria-labelledby={`${id}-map`}>
        <div className="section-head">
          <h2 id={`${id}-map`}>{teams.data.teams.length} home buildings</h2>
          <p>{mapNote}</p>
        </div>
        <TeamMap label={`Map of ${venue.league} arenas`} teams={teams.data.teams} groupOf={groupOf} lineColor={(g) => conferenceColors[g.split(" ")[0]]} paths="auto" spread={spread} legend={legend} bounds={bounds} tiles={venue.tiles} />
      </section>

      <section className="wrap section" aria-labelledby={`${id}-divisions`}>
        <div className="section-head">
          <h2 id={`${id}-divisions`}>Conferences and divisions</h2>
        </div>
        <DivisionGrid teams={teams.data.teams} conferenceOf={(t) => `${t.conference} Conference`} divisionOf={(t) => t.division!} />
      </section>

      {extra}

      <section className="wrap section" aria-labelledby={`${id}-calendar`}>
        <div className="section-head">
          <h2 id={`${id}-calendar`}>Season calendar</h2>
          <p>{calendarNote}</p>
        </div>
        <div className="indoor-panel">
          <SeasonTimeline file={seasons.data} leagues={[{ key: id, label: venue.league, color: venue.color }]} monthsBack={6} monthsAhead={12} />
        </div>
      </section>
    </div>
  );
}
