"""FIFA World Cup: the 2026 tournament from ESPN (every match, group tables, venues)
plus the roll of champions since 1930.

ESPN's scoreboard caps a date-range query at 100 events, so matches are fetched one
day at a time. A finished tournament is cached in data/worldcup/<year>.json.
"""
import json
from datetime import date, timedelta

from common import DATA, get_json, read_csv, read_json, write_json

YEAR = 2026
START, END = date(2026, 6, 11), date(2026, 7, 19)
CACHE = DATA / "worldcup"
CACHE.mkdir(parents=True, exist_ok=True)

ROUNDS = {
    "group-stage": "Group stage",
    "round-of-32": "Round of 32",
    "round-of-16": "Round of 16",
    "quarterfinals": "Quarterfinals",
    "semifinals": "Semifinals",
    "3rd-place-match": "Third-place match",
    "final": "Final",
}

# (year, host, champion, runner-up). 1950 had no final; Uruguay won the deciding match of the final round.
HISTORY = [
    (1930, "Uruguay", "Uruguay", "Argentina"), (1934, "Italy", "Italy", "Czechoslovakia"),
    (1938, "France", "Italy", "Hungary"), (1950, "Brazil", "Uruguay", "Brazil"),
    (1954, "Switzerland", "West Germany", "Hungary"), (1958, "Sweden", "Brazil", "Sweden"),
    (1962, "Chile", "Brazil", "Czechoslovakia"), (1966, "England", "England", "West Germany"),
    (1970, "Mexico", "Brazil", "Italy"), (1974, "West Germany", "West Germany", "Netherlands"),
    (1978, "Argentina", "Argentina", "Netherlands"), (1982, "Spain", "Italy", "West Germany"),
    (1986, "Mexico", "Argentina", "West Germany"), (1990, "Italy", "West Germany", "Argentina"),
    (1994, "United States", "Brazil", "Italy"), (1998, "France", "France", "Brazil"),
    (2002, "South Korea and Japan", "Brazil", "Germany"), (2006, "Germany", "Italy", "France"),
    (2010, "South Africa", "Spain", "Netherlands"), (2014, "Brazil", "Germany", "Argentina"),
    (2018, "Russia", "France", "Croatia"), (2022, "Qatar", "Argentina", "France"),
]
HOSTS_2026 = "United States, Canada and Mexico"
# West Germany's titles count for Germany, as FIFA records them.
NATION = {"West Germany": "Germany"}


def side(c):
    t = c["team"]
    return {
        "name": t["displayName"],
        "abbr": t.get("abbreviation"),
        "flag": t.get("logo"),
        "score": int(c["score"]) if c.get("score") not in (None, "") else None,
        "shootout": c.get("shootoutScore"),
        "winner": bool(c.get("winner")),
    }


def fetch_matches():
    matches, day = [], START
    while day <= END:
        sb = get_json("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard", dates=day.strftime("%Y%m%d"))
        for e in sb.get("events", []):
            c = e["competitions"][0]
            home = next(x for x in c["competitors"] if x["homeAway"] == "home")
            away = next(x for x in c["competitors"] if x["homeAway"] == "away")
            slug = e["season"].get("slug", "")
            venue = c.get("venue") or {}
            matches.append({
                "id": e["id"],
                "start": e["date"],
                "round": ROUNDS.get(slug, slug.replace("-", " ").capitalize()),
                "home": side(home),
                "away": side(away),
                "status": c["status"]["type"].get("shortDetail"),
                "final": c["status"]["type"].get("completed", False),
                "venue": venue.get("fullName"),
                "city": (venue.get("address") or {}).get("city"),
            })
        day += timedelta(days=1)
    return matches


def fetch_groups():
    st = get_json("https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings")
    groups = []
    for g in st.get("children", []):
        rows = []
        for e in g["standings"]["entries"]:
            stat = {x["name"]: x.get("value") for x in e["stats"]}
            rows.append({
                "team": e["team"]["displayName"],
                "abbr": e["team"].get("abbreviation"),
                "flag": (e["team"].get("logos") or [{}])[0].get("href"),
                "rank": int(stat.get("rank") or 0),
                "gp": int(stat.get("gamesPlayed") or 0),
                "w": int(stat.get("wins") or 0),
                "d": int(stat.get("ties") or 0),
                "l": int(stat.get("losses") or 0),
                "gf": int(stat.get("pointsFor") or 0),
                "ga": int(stat.get("pointsAgainst") or 0),
                "pts": int(stat.get("points") or 0),
                "advanced": bool(stat.get("advanced")),
            })
        groups.append({"name": g["name"], "rows": sorted(rows, key=lambda r: r["rank"])})
    return groups


def load_tournament():
    path = CACHE / f"{YEAR}.json"
    cached = read_json(path)
    if cached and cached.get("complete"):
        return cached
    matches, groups = fetch_matches(), fetch_groups()
    complete = any(m["round"] == "Final" and m["final"] for m in matches)
    data = {"complete": complete, "matches": matches, "groups": groups}
    if complete:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    return data


def build():
    t = load_tournament()
    matches, groups = t["matches"], t["groups"]
    group_of = {r["abbr"]: g["name"] for g in groups for r in g["rows"]}
    for m in matches:
        if m["round"] == "Group stage":
            m["group"] = group_of.get(m["home"]["abbr"])

    played = [m for m in matches if m["final"]]
    final = next((m for m in matches if m["round"] == "Final"), None)
    champion = runner_up = None
    if final and final["final"]:
        champion, runner_up = (final["home"], final["away"]) if final["home"]["winner"] else (final["away"], final["home"])

    coords = {r["Venue"]: r for r in read_csv(DATA / "worldcup" / "venues.csv")}
    venues = {}
    for m in matches:
        v = venues.setdefault(m["venue"], {"name": m["venue"], "city": m["city"], "matches": 0, "final": False})
        v["matches"] += 1
        v["final"] = v["final"] or m["round"] == "Final"
    venue_rows = []
    for v in venues.values():
        c = coords.get(v["name"])
        if not c:
            print(f"  worldcup: no coordinates for venue '{v['name']}'")
            continue
        venue_rows.append({**v, "city": c["City"], "country": c["Country"], "abbr": c["Short"], "lat": float(c["Latitude"]), "lon": float(c["Longitude"])})

    history = [{"year": y, "host": h, "champion": c, "runnerUp": r} for y, h, c, r in HISTORY]
    if champion:
        history.append({"year": YEAR, "host": HOSTS_2026, "champion": champion["name"], "runnerUp": runner_up["name"]})
    titles = {}
    for h in history:
        titles.setdefault(NATION.get(h["champion"], h["champion"]), []).append(h["year"])
    by_nation = sorted(({"nation": n, "titles": len(y), "years": y} for n, y in titles.items()), key=lambda x: (-x["titles"], -x["years"][-1]))

    write_json("worldcup", {
        "year": YEAR,
        "hosts": HOSTS_2026,
        "complete": t["complete"],
        "champion": champion,
        "runnerUp": runner_up,
        "final": final,
        "matches": len(played),
        "goals": sum((m["home"]["score"] or 0) + (m["away"]["score"] or 0) for m in played),
        "nations": len(group_of),
        "games": matches,
        "groups": groups,
        "venues": venue_rows,
        "history": history,
        "byNation": by_nation,
    })


if __name__ == "__main__":
    build()
