"""NFL, NBA and NHL teams for the venue maps.

- NFL: data/nfl/teams.csv (coords, stadiums, nfl.com logos) is the full source.
- NBA/NHL: coordinates from data/stadiums.csv; logo, arena, color and record from
  ESPN's keyless team endpoint. Divisions are listed here because stadiums.csv only
  has NBA conferences.
"""
from common import DATA, get_json, read_csv, write_json

NBA_DIVISIONS = {
    "Eastern": {
        "Atlantic": ["BOS", "BKN", "NY", "PHI", "TOR"],
        "Central": ["CHI", "CLE", "DET", "IND", "MIL"],
        "Southeast": ["ATL", "CHA", "MIA", "ORL", "WSH"],
    },
    "Western": {
        "Northwest": ["DEN", "MIN", "OKC", "POR", "UTAH"],
        "Pacific": ["GS", "LAC", "LAL", "PHX", "SAC"],
        "Southwest": ["DAL", "HOU", "MEM", "NO", "SA"],
    },
}
NHL_CONFERENCES = {"Atlantic": "Eastern", "Metropolitan": "Eastern", "Central": "Western", "Pacific": "Western"}
ALIASES = {"LA Clippers": "Los Angeles Clippers", "Montréal Canadiens": "Montreal Canadiens", "St Louis Blues": "St. Louis Blues"}
# ESPN's venue records lag behind arena moves; these match the stadiums.csv coordinates.
ARENA_FIXES = {
    ("NBA", "BKN"): ("Barclays Center", "Brooklyn"),
    ("NBA", "GS"): ("Chase Center", "San Francisco"),
    ("NBA", "LAC"): ("Intuit Dome", "Inglewood"),
    ("NBA", "MIL"): ("Fiserv Forum", "Milwaukee"),
    ("NBA", "SAC"): ("Golden 1 Center", "Sacramento"),
    ("NHL", "NJ"): ("Prudential Center", "Newark"),
    ("NHL", "WPG"): ("Canada Life Centre", "Winnipeg"),
}


def nfl():
    out = []
    for row in read_csv(DATA / "nfl" / "teams.csv"):
        out.append({
            "name": row["Team"],
            "abbr": row["LogoURL"].rsplit("/", 1)[-1],
            "conference": row["Conference"],
            "division": row["Division"],
            "city": row["City"],
            "state": row["State"],
            "stadium": row["Stadium"],
            "lat": float(row["Latitude"]),
            "lon": float(row["Longitude"]),
            "logo": row["LogoURL"],
        })
    assert len(out) == 32, f"expected 32 NFL teams, got {len(out)}"
    write_json("nfl_teams", {"teams": out})


def espn_teams(sport, league):
    listing = get_json(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams")
    teams = []
    for entry in listing["sports"][0]["leagues"][0]["teams"]:
        t = get_json(f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams/{entry['team']['id']}")["team"]
        teams.append(t)
    return teams


def arena_league(code, sport, league, division_of):
    coords = {r["Team"]: r for r in read_csv(DATA / "stadiums.csv") if r["Sport"] == code}
    out = []
    for t in espn_teams(sport, league):
        name = ALIASES.get(t["displayName"], t["displayName"])
        row = coords.get(name)
        if not row:
            raise KeyError(f"{code}: no coordinates in stadiums.csv for '{name}'")
        conference, division = division_of(t["abbreviation"], row)
        venue = (t.get("franchise") or {}).get("venue") or {}
        stadium = venue.get("fullName", "").replace("crypto.com", "Crypto.com")
        city = (venue.get("address") or {}).get("city") or t.get("location")
        stadium, city = ARENA_FIXES.get((code, t["abbreviation"]), (stadium, city))
        out.append({
            "name": name,
            "abbr": t["abbreviation"],
            "conference": conference,
            "division": division,
            "city": city,
            "stadium": stadium,
            "lat": float(row["Latitude"]),
            "lon": float(row["Longitude"]),
            "logo": (t.get("logos") or [{}])[0].get("href"),
            "color": "#" + t["color"] if t.get("color") else None,
        })
    return out


def nba_division(abbr, row):
    for conf, divs in NBA_DIVISIONS.items():
        for div, members in divs.items():
            if abbr in members:
                return conf, div
    raise KeyError(f"NBA: {abbr} not in any division")


def nhl_division(abbr, row):
    return NHL_CONFERENCES[row["Division"]], row["Division"]


def build():
    nfl()
    nba = arena_league("NBA", "basketball", "nba", nba_division)
    assert len(nba) == 30, f"expected 30 NBA teams, got {len(nba)}"
    write_json("nba_teams", {"teams": nba})
    nhl = arena_league("NHL", "hockey", "nhl", nhl_division)
    assert len(nhl) == 32, f"expected 32 NHL teams, got {len(nhl)}"
    write_json("nhl_teams", {"teams": nhl})


if __name__ == "__main__":
    build()
