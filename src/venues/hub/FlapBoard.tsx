import { formatDay, type BoardRow } from "../../lib/seasons";

/** Split-flap tiles: one cell per word, flipping into place once on load. */
function Flap({ text, delay, tone }: { text: string; delay: number; tone?: "live" | "soon" }) {
  return (
    <span className={`flap ${tone ? `flap-${tone}` : ""}`} style={{ animationDelay: `${delay}ms` }}>
      {text}
    </span>
  );
}

function status(r: BoardRow): string {
  if (r.live) return r.days === 0 ? "Ends today" : `${r.days}d left`;
  return r.days === 0 ? "Today" : `${r.days}d`;
}

export default function FlapBoard({ rows }: { rows: BoardRow[] }) {
  const live = rows.filter((r) => r.live);
  const next = rows.filter((r) => !r.live).slice(0, 7);
  const groups: [string, BoardRow[]][] = [
    ["On now", live],
    ["Coming up", next],
  ];
  let i = 0;
  return (
    <div className="board">
      {groups.map(([title, list]) => (
        <section key={title} className="board-group" aria-label={title}>
          <h3>{title}</h3>
          <table>
            <thead className="visually-hidden">
              <tr>
                <th>League</th>
                <th>Event</th>
                <th>{title === "On now" ? "Ends" : "Starts"}</th>
                <th>Countdown</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const d = 60 * i++;
                return (
                  <tr key={`${r.league}-${r.event}-${r.season}`}>
                    <td>
                      <Flap text={r.leagueName} delay={d} />
                    </td>
                    <td className="board-event">
                      <Flap text={r.event} delay={d + 40} />
                    </td>
                    <td className="board-date">
                      <Flap text={formatDay(r.date)} delay={d + 80} />
                    </td>
                    <td className="board-odds">
                      <Flap text={status(r)} delay={d + 120} tone={r.live ? "live" : r.days <= 14 ? "soon" : undefined} />
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    Nothing on the board.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
