"""MLB teams and World Series history.

- Teams: data/mlb/teams_map.csv (stadium coords, logos) joined with
  data/mlb/teams_info.csv (Stats API team info) on the team id inside LogoURL.
- World Series: statsapi /schedule/postseason/series, one call per season.
  Finished seasons are cached in data/mlb/world_series.json, so the daily
  run only asks about the current season.
"""
import json
import re
from datetime import date

from common import DATA, get_json, read_csv, read_json, write_json

# Historical names -> franchise lineage (rescued from MLB/World Series/4MLB_World_Series.py)
FRANCHISES = {
    "Anaheim Angels": "Angels",
    "Arizona Diamondbacks": "Diamondbacks",
    "Atlanta Braves": "Braves",
    "Boston Braves": "Braves",
    "Milwaukee Braves": "Braves",
    "Baltimore Orioles": "Orioles",
    "Boston Americans": "Red Sox",
    "Boston Red Sox": "Red Sox",
    "Brooklyn Dodgers": "Dodgers",
    "Brooklyn Robins": "Dodgers",
    "Los Angeles Dodgers": "Dodgers",
    "Chicago Cubs": "Cubs",
    "Chicago White Sox": "White Sox",
    "Cincinnati Reds": "Reds",
    "Cleveland Indians": "Guardians",
    "Cleveland Naps": "Guardians",
    "Cleveland Guardians": "Guardians",
    "Detroit Tigers": "Tigers",
    "Florida Marlins": "Marlins",
    "Miami Marlins": "Marlins",
    "Houston Astros": "Astros",
    "Kansas City Royals": "Royals",
    "Minnesota Twins": "Twins",
    "Washington Senators": "Twins",
    "New York Giants": "Giants",
    "San Francisco Giants": "Giants",
    "New York Mets": "Mets",
    "New York Yankees": "Yankees",
    "New York Highlanders": "Yankees",
    "Philadelphia Athletics": "Athletics",
    "Kansas City Athletics": "Athletics",
    "Oakland Athletics": "Athletics",
    "Athletics": "Athletics",
    "Philadelphia Phillies": "Phillies",
    "Pittsburgh Pirates": "Pirates",
    "St. Louis Cardinals": "Cardinals",
    "St. Louis Browns": "Orioles",
    "Texas Rangers": "Rangers",
    "Toronto Blue Jays": "Blue Jays",
    "Montreal Expos": "Nationals",
    "Washington Nationals": "Nationals",
    "San Diego Padres": "Padres",
    "Seattle Pilots": "Brewers",
    "Milwaukee Brewers": "Brewers",
    "Tampa Bay Rays": "Rays",
    "Tampa Bay Devil Rays": "Rays",
    "Colorado Rockies": "Rockies",
    "Seattle Mariners": "Mariners",
    "California Angels": "Angels",
    "Los Angeles Angels": "Angels",
}

NO_SERIES = {1904: "Not played: the NL champion Giants refused to face the AL champion", 1994: "Cancelled by the players' strike"}
CACHE = DATA / "mlb" / "world_series.json"


def teams():
    info = {row["id"]: row for row in read_csv(DATA / "mlb" / "teams_info.csv")}
    out = []
    for row in read_csv(DATA / "mlb" / "teams_map.csv"):
        team_id = re.search(r"/(\d+)\.svg$", row["LogoURL"]).group(1)
        i = info.get(team_id, {})
        out.append({
            "id": int(team_id),
            "name": row["Team"],
            "abbr": i.get("abbreviation"),
            "league": row["League"],
            "division": row["Division"],
            "city": row["City"],
            "state": row["State"],
            "stadium": row["Stadium"],
            "lat": float(row["Latitude"]),
            "lon": float(row["Longitude"]),
            "logo": row["LogoURL"],
            "firstYear": int(i["firstYearOfPlay"]) if i.get("firstYearOfPlay") else None,
            "franchise": FRANCHISES.get(row["Team"], i.get("clubName")),
        })
    assert len(out) == 30, f"expected 30 MLB teams, got {len(out)}"
    write_json("mlb_teams", {"teams": out})


def series_result(year):
    """Return the World Series for a season, or None if it is not decided yet."""
    data = get_json("https://statsapi.mlb.com/api/v1/schedule/postseason/series", season=year, sportId=1)
    for s in data.get("series", []):
        if s.get("series", {}).get("gameType") != "W":
            continue
        games = [g for g in s.get("games", []) if g["status"]["detailedState"] not in ("Cancelled", "Postponed")]
        finals = [g for g in games if g["status"]["abstractGameState"] == "Final"]
        # Unplayed "if necessary" games drop off the list once a series ends,
        # so the series is decided when every remaining game is final.
        if not finals or len(finals) < len(games):
            return None
        last = finals[-1]["teams"]
        a, h = last["away"], last["home"]
        winner, loser = (a, h) if a["leagueRecord"]["wins"] > h["leagueRecord"]["wins"] else (h, a)
        ties = sum(1 for g in finals if g["teams"]["away"].get("score") == g["teams"]["home"].get("score"))
        return {
            "year": year,
            "champion": winner["team"]["name"],
            "runnerUp": loser["team"]["name"],
            "wins": winner["leagueRecord"]["wins"],
            "losses": loser["leagueRecord"]["wins"],
            "ties": ties,
            "decidedOn": finals[-1]["officialDate"],
        }
    return None


def world_series():
    cache = {int(k): v for k, v in (read_json(CACHE, {}) or {}).items()}
    this_year = date.today().year
    for year in range(1903, this_year + 1):
        if year in cache or year in NO_SERIES:
            continue
        try:
            result = series_result(year)
        except Exception as e:  # noqa: BLE001
            print(f"  world series {year}: {e}")
            continue
        if result:
            cache[year] = result
    CACHE.write_text(json.dumps({str(k): cache[k] for k in sorted(cache)}, indent=1), encoding="utf-8")

    rows = []
    for year in range(1903, this_year + 1):
        if year in NO_SERIES:
            rows.append({"year": year, "champion": None, "note": NO_SERIES[year]})
        elif year in cache:
            r = dict(cache[year])
            r["franchise"] = FRANCHISES.get(r["champion"], r["champion"])
            r["runnerUpFranchise"] = FRANCHISES.get(r["runnerUp"], r["runnerUp"])
            rows.append(r)

    titles = {}
    for r in rows:
        if r.get("champion"):
            titles.setdefault(r["franchise"], []).append(r["year"])
    by_franchise = sorted(
        ({"franchise": f, "titles": len(y), "years": y} for f, y in titles.items()),
        key=lambda x: (-x["titles"], -x["years"][-1]),
    )
    write_json("mlb_world_series", {"series": rows, "byFranchise": by_franchise})


def build():
    teams()
    world_series()


if __name__ == "__main__":
    build()
