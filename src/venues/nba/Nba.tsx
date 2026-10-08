import IndoorVenue from "../shared/IndoorVenue";
import "../shared/IndoorVenue.css";
import "./Nba.css";

const BOUNDS: [[number, number], [number, number]] = [[48.5, -123], [25.5, -70]];

export default function Nba() {
  return (
    <IndoorVenue
      id="nba"
      dataFile="nba_teams"
      loading="Sweeping the hardwood…"
      conferenceColors={{ Eastern: "#1d428a", Western: "#c8102e" }}
      spread={{
        minKm: 70,
        iterations: 2,
        divFactor: 70,
        custom: [
          ["Los Angeles Clippers", "Los Angeles Lakers", 120, 15],
          ["Brooklyn Nets", "New York Knicks", 120, 15],
        ],
      }}
      bounds={BOUNDS}
      mapNote="Lines connect each division, nearest neighbour to nearest neighbour. Toronto is the only arena outside the US."
      calendarNote="Preseason in October, 82 games to mid-April, the play-in, then two months of playoffs."
      clockLabel={(phase) => (phase === "Regular season" ? "Days to opening night" : `Days to the ${phase.toLowerCase()}`)}
      extra={
        <section className="wrap section" aria-labelledby="nba-lab">
          <div className="section-head">
            <h2 id="nba-lab">From the film room</h2>
          </div>
          <div className="film-room">
            <p>
              The lab notebook <code>analysis/nba/game_flow.ipynb</code> rebuilds a playoff game from play-by-play data: the score margin minute by minute, who led when, and each team's scoring runs. Game-flow charts like that are the next thing headed for this arena.
            </p>
          </div>
        </section>
      }
    />
  );
}
