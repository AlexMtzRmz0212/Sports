import IndoorVenue from "../shared/IndoorVenue";
import "../shared/IndoorVenue.css";
import "./Nhl.css";

const BOUNDS: [[number, number], [number, number]] = [[54, -124], [25.5, -70]];

export default function Nhl() {
  return (
    <IndoorVenue
      id="nhl"
      dataFile="nhl_teams"
      loading="Flooding the ice…"
      conferenceColors={{ Eastern: "#1d4f91", Western: "#c8102e" }}
      spread={{
        minKm: 70,
        iterations: 2,
        divFactor: 70,
        custom: [
          ["New York Rangers", "New York Islanders", 300, 12],
          ["New York Rangers", "New Jersey Devils", 60, 12],
          ["Anaheim Ducks", "Los Angeles Kings", 120, 15],
        ],
      }}
      bounds={BOUNDS}
      mapNote="Seven of the 32 clubs play in Canada, from Montreal to Vancouver. Lines connect each division."
      calendarNote="Training camp in September, 82 games to April, then four rounds for the Stanley Cup."
      clockLabel={(phase) => (phase === "Regular season" ? "Days to puck drop" : `Days to the ${phase.toLowerCase()}`)}
    />
  );
}
