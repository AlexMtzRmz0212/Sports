"""Liga MX: live table (ESPN, keyless) and the 2021-24 archive (saved API-Football fixtures).

- Teams: data/ligamx/stadiums.csv (hand-checked coords) + ESPN logos/colors.
- Live table: ESPN standings for the tournament being played now.
- Archive: analysis/ligamx/fixtures/fixtures_<season>.json, fetched once with
  ligamx_fetch.py (needs an API-Sports key, so it never runs in CI).
  Each tournament's table is rebuilt from its matchdays and the champion is
  decided by the two-leg final (aggregate, then penalties).
"""
import re

from common import DATA, ROOT, espn_table, get_json, read_csv, read_json, write_json

FIXTURES = ROOT / "analysis" / "ligamx" / "fixtures"


def teams():
    espn = {}
    listing = get_json("https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/teams")
    for entry in listing["sports"][0]["leagues"][0]["teams"]:
        t = entry["team"]
        espn[t["id"]] = t
    out = []
    for row in read_csv(DATA / "ligamx" / "stadiums.csv"):
        t = espn.get(row["EspnId"], {})
        out.append({
            "id": row["EspnId"],
            "name": row["Team"],
            "abbr": t.get("abbreviation"),
            "city": row["City"],
            "state": row["State"],
            "stadium": row["Stadium"],
            "lat": float(row["Latitude"]),
            "lon": float(row["Longitude"]),
            "logo": (t.get("logos") or [{}])[0].get("href"),
            "color": "#" + t["color"] if t.get("color") else None,
        })
    missing = set(espn) - {t["id"] for t in out}
    if missing:
        print(f"  ligamx: ESPN lists teams without stadium rows: {[espn[m]['displayName'] for m in missing]}")
    return out


def archive():
    tournaments = {}
    for path in sorted(FIXTURES.glob("fixtures_*.json")):
        season = int(re.search(r"(\d{4})", path.name).group(1))
        for f in read_json(path)["response"]:
            torneo, stage = f["league"]["round"].split(" - ", 1)
            year = season if torneo == "Apertura" else season + 1
            key = f"{torneo} {year}"
            t = tournaments.setdefault(key, {"name": key, "torneo": torneo, "year": year, "table": {}, "final": []})
            home, away = f["teams"]["home"], f["teams"]["away"]
            gh, ga = f["goals"]["home"], f["goals"]["away"]
            if gh is None:
                continue
            if stage.isdigit():
                for team, gf, gc in ((home, gh, ga), (away, ga, gh)):
                    r = t["table"].setdefault(team["name"], {"team": team["name"], "logo": team["logo"], "gp": 0, "w": 0, "d": 0, "l": 0, "gf": 0, "ga": 0, "pts": 0})
                    r["gp"] += 1
                    r["gf"] += gf
                    r["ga"] += gc
                    res = "w" if gf > gc else "d" if gf == gc else "l"
                    r[res] += 1
                    r["pts"] += {"w": 3, "d": 1, "l": 0}[res]
            elif stage in ("Final", "Finals"):
                t["final"].append({
                    "date": f["fixture"]["date"][:10],
                    "venue": f["fixture"]["venue"]["name"],
                    "home": home["name"], "away": away["name"],
                    "homeLogo": home["logo"], "awayLogo": away["logo"],
                    "homeGoals": gh, "awayGoals": ga,
                    "penHome": f["score"]["penalty"]["home"], "penAway": f["score"]["penalty"]["away"],
                })
    out = []
    for t in tournaments.values():
        table = sorted(t["table"].values(), key=lambda r: (-r["pts"], -(r["gf"] - r["ga"]), -r["gf"]))
        for i, r in enumerate(table, 1):
            r["rank"] = i
        legs = sorted(t["final"], key=lambda x: x["date"])
        champion = runner_up = None
        if len(legs) == 2:
            a, b = legs[0]["home"], legs[0]["away"]
            agg = {a: 0, b: 0}
            for leg in legs:
                agg[leg["home"]] += leg["homeGoals"]
                agg[leg["away"]] += leg["awayGoals"]
            if agg[a] != agg[b]:
                champion = a if agg[a] > agg[b] else b
            elif legs[1]["penHome"] is not None:
                champion = legs[1]["home"] if legs[1]["penHome"] > legs[1]["penAway"] else legs[1]["away"]
            runner_up = b if champion == a else a
            aggregate = f"{agg[champion]}-{agg[runner_up]}"
        out.append({
            "name": t["name"], "torneo": t["torneo"], "year": t["year"],
            "champion": champion, "runnerUp": runner_up,
            "aggregate": aggregate if champion else None,
            "onPenalties": bool(champion and legs[1]["penHome"] is not None),
            "finalLegs": legs, "table": table,
        })
    return sorted(out, key=lambda t: (t["year"], t["torneo"] == "Apertura"))


def build():
    payload = {"teams": teams(), "archive": archive()}
    try:
        payload["live"] = espn_table("mex.1")
    except Exception as e:  # noqa: BLE001
        print(f"  ligamx live table: {e}")
        payload["live"] = None
    write_json("ligamx", payload)


if __name__ == "__main__":
    build()
