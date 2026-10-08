import type { TableRow } from "../lib/types";

/** A football league table. `zone` marks qualification bands by rank ("a" = through, "b" = play-off). */
export default function LeagueTable({ rows, zone, label }: { rows: TableRow[]; zone?: (rank: number) => "a" | "b" | null; label: string }) {
  return (
    <div className="scroll-x">
      <table className="data-table league-table">
        <caption className="visually-hidden">{label}</caption>
        <thead>
          <tr>
            <th scope="col" className="is-num">
              <span>#</span>
            </th>
            <th scope="col">
              <span>Club</span>
            </th>
            {["P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h) => (
              <th key={h} scope="col" className="is-num">
                <span>{h}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const z = zone?.(r.rank);
            return (
              <tr key={r.team} className={z ? `zone-${z}` : ""}>
                <td className="is-num num">{r.rank}</td>
                <td>
                  <span className="team-cell">
                    {r.logo && <img src={r.logo} alt="" loading="lazy" referrerPolicy="no-referrer" />}
                    {r.team}
                  </span>
                </td>
                {[r.gp, r.w, r.d, r.l, r.gf, r.ga, r.gf - r.ga, r.pts].map((v, i) => (
                  <td key={i} className={`is-num num ${i === 7 ? "pts" : ""}`}>
                    {i === 6 && v > 0 ? `+${v}` : v}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
