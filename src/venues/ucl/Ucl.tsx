import LeagueTable from "../../components/LeagueTable";
import SeasonTimeline from "../../components/SeasonTimeline";
import { LoadError, Loading, Readings, VenueSign, seasonReadings } from "../../components/VenueParts";
import { useData } from "../../lib/data";
import type { SeasonsFile, UclFile } from "../../lib/types";
import { venueById } from "../../lib/venues";
import "./Ucl.css";

const venue = venueById("ucl");

// League-phase bands: top 8 go to the round of 16, 9th to 24th play a knockout play-off.
const zone = (rank: number) => (rank <= 8 ? "a" : rank <= 24 ? "b" : null);

export default function Ucl() {
  const seasons = useData<SeasonsFile>("seasons");
  const ucl = useData<UclFile>("ucl");
  const error = seasons.error ?? ucl.error;
  if (error) return <LoadError error={error} />;
  if (!seasons.data || !ucl.data) return <Loading what="Cueing the anthem…" />;

  const { finals, byClub, live } = ucl.data;
  const holder = finals.at(-1)!;
  const repeat = finals.at(-2)?.champion === holder.champion;
  const readings = [
    ...seasonReadings(seasons.data, "ucl"),
    { label: "Holders", value: holder.champion, detail: `${holder.year} final, beat ${holder.runnerUp}${repeat ? ", back to back" : ""}` },
    { label: "Most titles", value: byClub[0].club, detail: `${byClub[0].titles} European Cups, last in ${byClub[0].years.at(-1)}` },
  ];

  return (
    <div className="ucl">
      <VenueSign league={venue.fullName!} place={venue.place}>
        <Readings items={readings} className="silverware" />
      </VenueSign>

      {live && (
        <section className="wrap section" aria-labelledby="ucl-table">
          <div className="section-head">
            <h2 id="ucl-table">The league phase</h2>
            <p>{live.season.replace(" UEFA Champions League", "")}, all 36 clubs in one table. Green goes straight to the round of 16; blue plays off for a place.</p>
          </div>
          <LeagueTable rows={live.rows} zone={zone} label="Champions League league-phase table" />
        </section>
      )}

      <section className="wrap section" aria-labelledby="ucl-format">
        <div className="section-head">
          <h2 id="ucl-format">From September to the final</h2>
          <p>The format in use since 2024-25.</p>
        </div>
        <ol className="ucl-steps">
          <li>
            <h3>League phase</h3>
            <p>36 clubs, eight matches each against eight different opponents, four at home and four away.</p>
          </li>
          <li>
            <h3>The cut</h3>
            <p>The top eight go straight to the round of 16. 9th to 24th meet in two-legged play-offs. 25th and below are out.</p>
          </li>
          <li>
            <h3>Knockouts</h3>
            <p>Round of 16, quarterfinals and semifinals are all home and away.</p>
          </li>
          <li>
            <h3>Final night</h3>
            <p>One match at a neutral stadium chosen years ahead, settled by extra time and penalties if needed.</p>
          </li>
        </ol>
      </section>

      <section className="wrap section" aria-labelledby="ucl-honours">
        <div className="section-head">
          <h2 id="ucl-honours">Roll of honour</h2>
          <p>
            {finals.length} finals since 1956, won by {byClub.length} clubs.
          </p>
        </div>
        <ul className="honours">
          {byClub.map((c) => (
            <li key={c.club}>
              <span className="honours-count num">{c.titles}</span>
              <span className="honours-club">{c.club}</span>
              <span className="honours-years">{c.years.join(" ")}</span>
            </li>
          ))}
        </ul>
        <ol className="finals-roll">
          {finals
            .slice()
            .reverse()
            .map((f) => (
              <li key={f.year}>
                <span className="num finals-year">{f.year}</span>
                <span>
                  <strong>{f.champion}</strong> <span className="muted">beat {f.runnerUp}</span>
                </span>
              </li>
            ))}
        </ol>
      </section>

      <section className="wrap section" aria-labelledby="ucl-calendar">
        <div className="section-head">
          <h2 id="ucl-calendar">Season calendar</h2>
          <p>League phase in autumn and winter, knockouts from February, the final at the end of May.</p>
        </div>
        <div className="ucl-panel">
          <SeasonTimeline file={seasons.data} leagues={[{ key: "ucl", label: "UCL", color: "#9fb4ff" }]} monthsBack={6} monthsAhead={12} />
        </div>
      </section>
    </div>
  );
}
