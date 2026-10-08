import { useEffect, useMemo, type CSSProperties } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { nearestChain, spreadMarkers, type SpreadOptions } from "../lib/spreadMarkers";
import type { MapTeam } from "../lib/types";
import "./TeamMap.css";

export interface Region {
  name: string;
  color: string;
  coords: [number, number][];
}

export interface LegendItem {
  label: string;
  color: string;
  kind: "line" | "area" | "dot";
}

interface Props {
  label: string;
  teams: MapTeam[];
  /** Teams sharing a group are joined by a line, e.g. "American East". */
  groupOf?: (t: MapTeam) => string;
  lineColor?: (group: string) => string;
  /** Hand-drawn visiting orders per group (teams may repeat to draw a hub), or "auto". */
  paths?: Record<string, string[]> | "auto";
  spread: SpreadOptions;
  regions?: Region[];
  legend: LegendItem[];
  bounds: [[number, number], [number, number]];
  tiles: "light" | "dark";
}

// Esri's gray canvas basemaps: quiet enough for logos to read, and no API key needed.
const TILE_URL = {
  light: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
};
const TILE_ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors";

function icon(team: MapTeam) {
  const ring = team.color ?? "currentColor";
  const face = team.logo
    ? `<img src="${team.logo}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : `<b>${team.abbr ?? team.name.slice(0, 3)}</b>`;
  return L.divIcon({
    className: "pin",
    html: `<span class="pin-face" style="--ring:${ring}">${face}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

/** Leaflet measures its box once; re-measure and re-fit when the box settles or resizes. */
function FitOnResize({ bounds }: { bounds: Props["bounds"] }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [28, 28] });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, bounds]);
  return null;
}

export default function TeamMap({ label, teams, groupOf, lineColor, paths, spread, regions = [], legend, bounds, tiles }: Props) {
  const dot = tiles === "dark" ? "#f2f2ee" : "#111";
  const positions = useMemo(() => spreadMarkers(teams, spread), [teams, spread]);

  const lines = useMemo(() => {
    if (!groupOf || !paths) return [];
    const groups = new Map<string, string[]>();
    for (const t of teams) groups.set(groupOf(t), [...(groups.get(groupOf(t)) ?? []), t.name]);
    return [...groups].map(([group, names]) => {
      const order = paths === "auto" ? nearestChain(names, positions) : (paths[group] ?? names);
      return { group, points: order.filter((n) => positions.has(n)).map((n) => positions.get(n)!) };
    });
  }, [teams, groupOf, paths, positions]);

  return (
    <figure className="team-map" aria-label={label}>
      <MapContainer bounds={bounds} boundsOptions={{ padding: [28, 28] }} zoomSnap={0.25} scrollWheelZoom={false} className="team-map-canvas" attributionControl>
        <TileLayer url={TILE_URL[tiles]} attribution={TILE_ATTRIBUTION} maxZoom={16} />
        <FitOnResize bounds={bounds} />
        {regions.map((r) => (
          <Polygon key={r.name} positions={r.coords} pathOptions={{ color: r.color, fillColor: r.color, fillOpacity: 0.22, weight: 1 }} />
        ))}
        {lines.map((l) => (
          <Polyline key={l.group} positions={l.points} pathOptions={{ color: lineColor?.(l.group) ?? "#888", weight: 2.5, opacity: 0.85 }} />
        ))}
        {teams.map((t) => (
          <CircleMarker key={`dot-${t.name}`} center={[t.lat, t.lon]} radius={3} pathOptions={{ color: dot, fillColor: dot, fillOpacity: 0.6, weight: 2 }}>
            <Tooltip>{t.stadium ?? t.name}</Tooltip>
          </CircleMarker>
        ))}
        {teams.map((t) => (
          <Marker key={t.name} position={positions.get(t.name)!} icon={icon(t)} title={t.name} alt={t.name}>
            <Popup>
              <strong>{t.name}</strong>
              <br />
              {[t.stadium, t.city].filter(Boolean).join(", ")}
              {groupOf && (
                <>
                  <br />
                  {groupOf(t)}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <figcaption className="map-legend">
        <ul>
          {legend.map((item) => (
            <li key={item.label}>
              <span className={`swatch swatch-${item.kind}`} style={{ "--c": item.color } as CSSProperties} aria-hidden />
              {item.label}
            </li>
          ))}
          <li>
            <span className="swatch swatch-dot" style={{ "--c": dot } as CSSProperties} aria-hidden />
            Actual stadium location
          </li>
        </ul>
        <p>Logos are nudged apart where teams share a city. Click a logo for details.</p>
      </figcaption>
    </figure>
  );
}
