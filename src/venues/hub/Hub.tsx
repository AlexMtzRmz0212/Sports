import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import SeasonTimeline from "../../components/SeasonTimeline";
import { useData } from "../../lib/data";
import { boardRows, formatDay, inDays, leagueStatus, nextUp, today, daysBetween } from "../../lib/seasons";
import type { SeasonsFile, WbcFile, WorldCupFile } from "../../lib/types";
import { VENUES, venueById, type Venue } from "../../lib/venues";
import ChalkPlay from "./ChalkPlay";
import FlapBoard from "./FlapBoard";
import "./Hub.css";

function lockerNote(v: Venue, seasons: SeasonsFile, wbc: WbcFile | null, wc: WorldCupFile | null): { now: string; next: string } {
  if (v.id === "worldcup") {
    return {
      now: wc?.champion ? `${wc.year} champions: ${wc.champion.name}` : "Between tournaments",
      next: "Next up in 2030",
    };
  }
  if (!v.seasons) {
    const last = wbc?.editions.at(-1);
    return {
      now: last?.champion ? `${last.year} champions: ${last.champion.name}` : "Between Classics",
      next: `${wbc?.editions.length ?? 6} editions in the archive`,
    };
  }
  const { live, next } = leagueStatus(seasons, v.seasons);
  return {
    now: live ? `${live.phase.name}, through ${formatDay(live.end)}` : "Offseason",
    next: next ? `${next.phase.name} ${inDays(daysBetween(today(), next.start))}` : "Dates to come",
  };
}

export default function Hub() {
  const { data: seasons, error } = useData<SeasonsFile>("seasons");
  const { data: wbc } = useData<WbcFile>("wbc");
  const { data: wc } = useData<WorldCupFile>("worldcup");
  if (error) return <p className="wrap load-error">The schedule board did not load ({error}). Refresh to try again.</p>;
  if (!seasons) return <p className="wrap loading">Chalking up the board…</p>;

  const featured = nextUp(seasons);
  const featuredVenue = featured ? venueById(featured.league) : venueById("mlb");
  const days = featured ? daysBetween(today(), featured.start) : 0;
  const lockers = VENUES.filter((v) => v.id !== "hub");
  const calendarLeagues = lockers.filter((v) => v.seasons).map((v) => ({ key: v.seasons!, label: v.league, color: v.color }));

  return (
    <div className="hub" style={{ "--featured": featuredVenue.color } as CSSProperties}>
      <section className="wrap hub-hero">
        <div className="chalkboard">
          <div className="chalk-copy">
            <p className="chalk-kicker">Tonight's talk in the locker room</p>
            <h1>
              {featured
                ? `${featured.leagueName} ${featured.phase.key === "post" ? "playoffs start" : `${featured.phase.name.toLowerCase()} starts`} ${inDays(days)}`
                : "Season's quiet. Study the tape."}
            </h1>
            {featured && (
              <p className="chalk-sub">
                The {featured.season} {featured.phase.name.toLowerCase()} opens {formatDay(featured.start, true)}.
              </p>
            )}
            <Link className="chalk-cta" to={featuredVenue.path}>
              Walk out to {featuredVenue.place.replace(/^The |^El /, "the ")}
            </Link>
          </div>
          <ChalkPlay league={featured?.league ?? "mlb"} />
        </div>
      </section>

      <section className="wrap section hub-board" aria-labelledby="board-title">
        <div className="section-head">
          <h2 id="board-title">The board</h2>
          <p>What's live and what's next across {calendarLeagues.length} competitions, counted from today.</p>
        </div>
        <FlapBoard rows={boardRows(seasons)} />
      </section>

      <section className="wrap section" aria-labelledby="lockers-title">
        <div className="section-head">
          <h2 id="lockers-title">Pick a locker</h2>
          <p>Each one opens onto its own venue.</p>
        </div>
        <ul className="lockers">
          {lockers.map((v) => {
            const note = lockerNote(v, seasons, wbc, wc);
            const isFeatured = v.id === featuredVenue.id;
            return (
              <li key={v.id}>
                <Link to={v.path} className={`locker ${isFeatured ? "locker-featured" : ""}`} style={{ "--tape": v.color } as CSSProperties}>
                  <span className="locker-door">
                    <span className="locker-vents" aria-hidden />
                    <span className="locker-tape">{v.league}</span>
                    <span className="locker-place">{v.place}</span>
                    <span className="locker-note">
                      <span>{note.now}</span>
                      <span className="muted">{note.next}</span>
                    </span>
                    <span className="locker-handle" aria-hidden />
                  </span>
                  {isFeatured && <span className="locker-flag">Next up</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="wrap section" aria-labelledby="calendar-title">
        <div className="section-head">
          <h2 id="calendar-title">Season calendar</h2>
          <p>Three months back, a year ahead. Brighter bars are playoffs; faint ones are preseason.</p>
        </div>
        <div className="chalkboard chalkboard-wide">
          <SeasonTimeline file={seasons} leagues={calendarLeagues} variant="chalk" />
        </div>
      </section>
    </div>
  );
}
