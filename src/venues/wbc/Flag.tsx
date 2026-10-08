import type { WbcTeam } from "../../lib/types";

/** National flag from flagcdn; teams without one (Chinese Taipei) get their code instead. */
export default function Flag({ team, size = 28 }: { team: Pick<WbcTeam, "abbr" | "iso2" | "name">; size?: number }) {
  if (!team.iso2) {
    return (
      <span className="flag flag-code" style={{ width: size * 1.4, height: size }} aria-hidden>
        {team.abbr}
      </span>
    );
  }
  return <img className="flag" src={`https://flagcdn.com/w80/${team.iso2}.png`} alt="" width={size * 1.4} height={size} loading="lazy" />;
}
