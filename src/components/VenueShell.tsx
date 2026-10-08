import { Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { useData } from "../lib/data";
import { formatDay, parseDay } from "../lib/seasons";
import type { SeasonsFile } from "../lib/types";
import { VENUES, venueFor, type Venue } from "../lib/venues";
import Tunnel from "./Tunnel";
import "./VenueShell.css";

export default function VenueShell() {
  const { pathname } = useLocation();
  const venue = venueFor(pathname);
  const reduceMotion = useReducedMotion();
  const previous = useRef<Venue["id"] | null>(null);
  const [walkout, setWalkout] = useState<{ venue: Venue; key: number } | null>(null);
  const { data: seasons } = useData<SeasonsFile>("seasons");

  useLayoutEffect(() => {
    document.documentElement.dataset.venue = venue.theme;
    document.title = venue.id === "hub" ? "The Locker Room" : `${venue.league} | The Locker Room`;
    if (previous.current && previous.current !== venue.id && !reduceMotion) {
      setWalkout({ venue, key: Date.now() });
    }
    previous.current = venue.id;
  }, [venue, reduceMotion]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="shell-head">
        <div className="wrap shell-bar">
          <NavLink to="/" className="brand" end>
            The Locker Room
          </NavLink>
          <nav aria-label="Venues" className="shell-nav scroll-x">
            {VENUES.filter((v) => v.id !== "hub").map((v) => (
              <NavLink key={v.id} to={v.path} style={{ "--tape": v.color } as CSSProperties}>
                {v.league}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<p className="wrap loading">Opening the gates…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="shell-foot">
        <div className="wrap">
          <p>
            Schedules and results come from the MLB Stats API and ESPN. The Liga MX archive comes from API-Football. Map tiles are by Esri, with © OpenStreetMap contributors. Team and league logos belong to their owners.
          </p>
          {seasons && <p className="muted">Schedules last refreshed {formatDay(parseDay(seasons.generated.slice(0, 10)), true)}.</p>}
        </div>
      </footer>
      {walkout && <Tunnel key={walkout.key} venue={walkout.venue} onDone={() => setWalkout(null)} />}
    </>
  );
}
