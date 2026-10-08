import { lazy } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import VenueShell from "./components/VenueShell";
import Hub from "./venues/hub/Hub";

// Venues load on demand so the locker room does not ship Leaflet.
const Mlb = lazy(() => import("./venues/mlb/Mlb"));
const Nfl = lazy(() => import("./venues/nfl/Nfl"));
const Nba = lazy(() => import("./venues/nba/Nba"));
const Nhl = lazy(() => import("./venues/nhl/Nhl"));
const LigaMx = lazy(() => import("./venues/ligamx/LigaMx"));
const Ucl = lazy(() => import("./venues/ucl/Ucl"));
const WorldCup = lazy(() => import("./venues/worldcup/WorldCup"));
const Wbc = lazy(() => import("./venues/wbc/Wbc"));
const WbcEdition = lazy(() => import("./venues/wbc/WbcEdition"));

function NotFound() {
  return (
    <div className="wrap section">
      <h1 style={{ fontFamily: "var(--f-chalk)", fontSize: "var(--fs-2xl)" }}>Wrong tunnel.</h1>
      <p>There's no venue at this address. Head back to the locker room and pick a door.</p>
      <Link to="/">Back to the locker room</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Routes>
        <Route element={<VenueShell />}>
          <Route index element={<Hub />} />
          <Route path="mlb" element={<Mlb />} />
          <Route path="nfl" element={<Nfl />} />
          <Route path="nba" element={<Nba />} />
          <Route path="nhl" element={<Nhl />} />
          <Route path="ligamx" element={<LigaMx />} />
          <Route path="ucl" element={<Ucl />} />
          <Route path="worldcup" element={<WorldCup />} />
          <Route path="wbc" element={<Wbc />} />
          <Route path="wbc/:year" element={<WbcEdition />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
