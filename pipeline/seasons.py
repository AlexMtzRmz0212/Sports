"""Season phases for every league, from ESPN's keyless core API.

Writes public/data/seasons.json. The site computes "today", "live now" and
"next up" in the browser, so this file only needs refreshing when schedules change.
"""
from datetime import date

from common import espn_day, get_json, write_json

LEAGUES = {
    "mlb": ("baseball", "mlb", "MLB"),
    "nfl": ("football", "nfl", "NFL"),
    "nba": ("basketball", "nba", "NBA"),
    "nhl": ("hockey", "nhl", "NHL"),
    "ligamx": ("soccer", "mex.1", "Liga MX"),
    "ucl": ("soccer", "uefa.champions", "Champions League"),
}

# ESPN type abbreviations we chart, in display order. "off" (offseason) is skipped.
PHASE_NAMES = {
    "pre": "Preseason",
    "reg": "Regular season",
    "playin": "Play-in",
    "post": "Postseason",
}
MLB_PHASE_NAMES = {"pre": "Spring training"}


def us_league_season(sport, slug, year, key):
    s = get_json(f"https://sports.core.api.espn.com/v2/sports/{sport}/leagues/{slug}/seasons/{year}")
    phases = []
    for t in s["types"]["items"]:
        abbr = t.get("abbreviation")
        if abbr not in PHASE_NAMES:
            continue
        name = (MLB_PHASE_NAMES if key == "mlb" else {}).get(abbr, PHASE_NAMES[abbr])
        phases.append({"key": abbr, "name": name, "start": espn_day(t["startDate"]), "end": espn_day(t["endDate"], end=True)})
    phases.sort(key=lambda p: p["start"])
    return {"label": s.get("displayName") or str(year), "phases": phases}


def ligamx_season(year):
    """Liga MX runs two short tournaments a year. ESPN lists the torneo plus one type per
    playoff round; collapse the rounds into a single Liguilla phase per tournament."""
    s = get_json(f"https://sports.core.api.espn.com/v2/sports/soccer/leagues/mex.1/seasons/{year}")
    phases = []
    for torneo in ("Apertura", "Clausura"):
        types = [t for t in s["types"]["items"] if torneo in (t.get("name") or "") or torneo in (t.get("abbreviation") or "")]
        league = [t for t in types if (t.get("name") or "").startswith("Torneo")]
        playoff = [t for t in types if t not in league]
        if league:
            t = league[0]
            phases.append({"key": "reg", "name": torneo, "start": espn_day(t["startDate"]), "end": espn_day(t["endDate"], end=True)})
        if playoff:
            phases.append({
                "key": "post",
                "name": f"{torneo} Liguilla",
                "start": min(espn_day(t["startDate"]) for t in playoff),
                "end": max(espn_day(t["endDate"], end=True) for t in playoff),
            })
    # The torneo window ESPN reports overlaps its own Liguilla; trim it so bars do not stack.
    for i, p in enumerate(phases):
        if p["key"] == "reg" and i + 1 < len(phases) and phases[i + 1]["key"] == "post":
            p["end"] = min(p["end"], phases[i + 1]["start"])
    phases.sort(key=lambda p: p["start"])
    return {"label": s.get("displayName", str(year)).replace(" Liga BBVA MX", ""), "phases": phases}


def ucl_season(year):
    """League phase, then one knockout bar from the playoff round to the semifinals.
    ESPN's "Final" type is a month-long window, not the match date, so it is left out."""
    s = get_json(f"https://sports.core.api.espn.com/v2/sports/soccer/leagues/uefa.champions/seasons/{year}")
    types = {t.get("name"): t for t in s["types"]["items"]}
    phases = []
    if "League Phase" in types:
        t = types["League Phase"]
        phases.append({"key": "reg", "name": "League phase", "start": espn_day(t["startDate"]), "end": espn_day(t["endDate"], end=True)})
    knockout = [types[n] for n in ("Knockout Round Playoffs", "Round of 16", "Quarterfinals", "Semifinals") if n in types]
    if knockout:
        phases.append({
            "key": "post",
            "name": "Knockout rounds",
            "start": espn_day(knockout[0]["startDate"]),
            "end": espn_day(knockout[-1]["endDate"], end=True),
        })
    label = s.get("displayName", str(year)).replace(" UEFA Champions League", "")
    return {"label": label, "phases": phases}


def mlb_events(years):
    """The one MLB date ESPN does not carry: the All-Star Game."""
    events = []
    for y in years:
        try:
            found = get_json("https://statsapi.mlb.com/api/v1/seasons", sportId=1, season=y)["seasons"]
            if found and found[0].get("allStarDate"):
                events.append({"name": "All-Star Game", "date": found[0]["allStarDate"]})
        except Exception as e:  # noqa: BLE001
            print(f"  mlb all-star {y}: {e}")
    return events


def build():
    this_year = date.today().year
    years = range(this_year - 1, this_year + 3)
    leagues = {}
    for key, (sport, slug, name) in LEAGUES.items():
        seasons = []
        for y in years:
            try:
                if key == "ligamx":
                    seasons.append(ligamx_season(y))
                elif key == "ucl":
                    seasons.append(ucl_season(y))
                else:
                    seasons.append(us_league_season(sport, slug, y, key))
            except Exception as e:  # noqa: BLE001 - future seasons 404 until ESPN publishes them
                print(f"  {key} {y}: skipped ({e})")
        if not seasons:
            raise RuntimeError(f"no seasons for {key}")
        leagues[key] = {"name": name, "seasons": seasons, "events": []}
    leagues["mlb"]["events"] = mlb_events(years)
    write_json("seasons", {"leagues": leagues})


if __name__ == "__main__":
    build()
