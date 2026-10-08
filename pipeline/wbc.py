"""World Baseball Classic archive, built from real game data (statsapi sportId=51).

For every edition: champion, final, dates, nations, games, runs, hitting leaders
(aggregated from box scores) and every game. Across editions: a nations table and
records. Finished editions are cached in data/wbc/<year>.json so the daily run
only re-fetches an edition that is still being played.

Also writes every edition's games to public/data/wbc<year>_games.json, and
public/wbc<year>_schedule.ics for the latest edition (rescued from
WBC/scheduler.py, now with the correct pool letters and venues straight from the API).
"""
import json
from datetime import date, datetime, timedelta, timezone

from common import DATA, OUT, get_json, read_json, write_json

EDITIONS = [2006, 2009, 2013, 2017, 2023, 2026]
CACHE = DATA / "wbc"
CACHE.mkdir(parents=True, exist_ok=True)

# Tournament MVPs, verified against MLB.com coverage of each edition.
MVPS = {
    2006: ("Daisuke Matsuzaka", "JPN"),
    2009: ("Daisuke Matsuzaka", "JPN"),
    2013: ("Robinson Canó", "DOM"),
    2017: ("Marcus Stroman", "USA"),
    2023: ("Shohei Ohtani", "JPN"),
    2026: ("Maikel Garcia", "VEN"),
}

# For flag images (flagcdn.com). Chinese Taipei plays under its own Olympic flag, so it gets none.
ISO2 = {
    "AUS": "au", "BRA": "br", "CAN": "ca", "CHN": "cn", "COL": "co", "CUB": "cu", "CZE": "cz",
    "DOM": "do", "ESP": "es", "GBR": "gb", "ISR": "il", "ITA": "it", "JPN": "jp", "KOR": "kr",
    "MEX": "mx", "NCA": "ni", "NED": "nl", "PAN": "pa", "PUR": "pr", "RSA": "za", "USA": "us",
    "VEN": "ve",
}
NAME_FIXES = {"Kingdom of the Netherlands": "Netherlands", "Korea": "South Korea"}
STAGES = {"F": 1, "D": 2, "L": 3, "W": 4}


def stage_name(game_type, year):
    if game_type == "D":
        return "Quarterfinals" if year >= 2023 else "Second round"
    return {"F": "Pool play", "L": "Semifinals", "W": "Final"}[game_type]


def team_info(t):
    abbr = t.get("abbreviation") or t["name"][:3].upper()
    return {"abbr": abbr, "name": NAME_FIXES.get(t["name"], t["name"]), "iso2": ISO2.get(abbr)}


def fetch_edition(year):
    sched = get_json("https://statsapi.mlb.com/api/v1/schedule", sportId=51, season=year, hydrate="venue(location),team")
    raw, seen = [], set()
    for g in (g for d in sched.get("dates", []) for g in d["games"]):
        # Games moved between dates are listed under both; keep each gamePk once.
        if g["gameType"] in STAGES and g["gamePk"] not in seen:
            seen.add(g["gamePk"])
            raw.append(g)
    games, teams = [], {}
    for g in raw:
        a, h = g["teams"]["away"], g["teams"]["home"]
        ta, th = team_info(a["team"]), team_info(h["team"])
        if g["gameType"] == "F":  # knockout placeholders ("Pool A Winner") are not nations
            teams[ta["abbr"]], teams[th["abbr"]] = ta, th
        loc = g["venue"].get("location", {})
        games.append({
            "pk": g["gamePk"],
            "date": g["officialDate"],
            "start": g["gameDate"],
            "stage": stage_name(g["gameType"], year),
            "type": g["gameType"],
            "label": g.get("description") or stage_name(g["gameType"], year),
            "venue": g["venue"]["name"],
            "city": loc.get("city"),
            "away": ta, "home": th,
            "awayScore": a.get("score"), "homeScore": h.get("score"),
            "final": g["status"]["abstractGameState"] == "Final",
            "status": g["status"]["detailedState"],
        })
    complete = bool(games) and all(x["final"] for x in games if x["type"] == "W") and any(x["type"] == "W" and x["final"] for x in games)
    hitters = batting_leaders(games) if any(x["final"] for x in games) else []
    return {"year": year, "complete": complete, "teams": list(teams.values()), "games": games, "hitters": hitters}


def batting_leaders(games):
    totals = {}
    for g in games:
        if not g["final"]:
            continue
        try:
            box = get_json(f"https://statsapi.mlb.com/api/v1/game/{g['pk']}/boxscore")
        except Exception as e:  # noqa: BLE001
            print(f"  boxscore {g['pk']}: {e}")
            continue
        for side in ("away", "home"):
            abbr = g[side]["abbr"]
            for p in box["teams"][side]["players"].values():
                b = p.get("stats", {}).get("batting") or {}
                if not b.get("plateAppearances"):
                    continue
                key = (p["person"]["id"], abbr)
                t = totals.setdefault(key, {"name": p["person"].get("fullName") or p["person"].get("boxscoreName") or "Unknown", "team": abbr, "pa": 0, "ab": 0, "h": 0, "hr": 0, "rbi": 0, "bb": 0, "hbp": 0, "sf": 0, "tb": 0})
                for k, src in (("pa", "plateAppearances"), ("ab", "atBats"), ("h", "hits"), ("hr", "homeRuns"), ("rbi", "rbi"), ("bb", "baseOnBalls"), ("hbp", "hitByPitch"), ("sf", "sacFlies"), ("tb", "totalBases")):
                    t[k] += b.get(src, 0)
    out = []
    for t in totals.values():
        ab, obp_den = t["ab"], t["ab"] + t["bb"] + t["hbp"] + t["sf"]
        avg = t["h"] / ab if ab else 0
        obp = (t["h"] + t["bb"] + t["hbp"]) / obp_den if obp_den else 0
        slg = t["tb"] / ab if ab else 0
        out.append({**t, "avg": round(avg, 3), "obp": round(obp, 3), "slg": round(slg, 3), "ops": round(obp + slg, 3)})
    return out


def load_edition(year):
    path = CACHE / f"{year}.json"
    cached = read_json(path)
    if cached and cached.get("complete"):
        return cached
    if year > date.today().year:
        return None
    ed = fetch_edition(year)
    if not ed["games"]:
        return None
    if ed["complete"]:
        path.write_text(json.dumps(ed, ensure_ascii=False, indent=1), encoding="utf-8")
    return ed


def summarize(ed):
    year, games = ed["year"], ed["games"]
    played = [g for g in games if g["final"]]
    final = next((g for g in games if g["type"] == "W"), None)
    champ = runner = None
    if final and final["final"]:
        away_won = final["awayScore"] > final["homeScore"]
        champ, runner = (final["away"], final["home"]) if away_won else (final["home"], final["away"])
    record = {}
    for g in played:
        for side, other in (("away", "home"), ("home", "away")):
            r = record.setdefault(g[side]["abbr"], {"w": 0, "l": 0, "rf": 0, "ra": 0, "stage": 1})
            won = g[f"{side}Score"] > g[f"{other}Score"]
            r["w" if won else "l"] += 1
            r["rf"] += g[f"{side}Score"]
            r["ra"] += g[f"{other}Score"]
            r["stage"] = max(r["stage"], STAGES[g["type"]])
    if champ:
        record[champ["abbr"]]["stage"] = 5
    qualified = sorted((h for h in ed["hitters"] if h["pa"] >= 15), key=lambda h: -h["ops"])
    mvp = MVPS.get(year)
    return {
        "year": year,
        "edition": EDITIONS.index(year) + 1 if year in EDITIONS else None,
        "complete": ed["complete"],
        "start": min(g["date"] for g in games),
        "end": max(g["date"] for g in games),
        "nations": len(ed["teams"]),
        "games": len(played),
        "runs": sum(g["awayScore"] + g["homeScore"] for g in played),
        "venues": sorted({f"{g['venue']}, {g['city']}" for g in games if g["city"]}),
        "champion": champ,
        "runnerUp": runner,
        "final": final,
        "mvp": {"name": mvp[0], "team": mvp[1]} if mvp else None,
        "topHitters": qualified[:5],
        "leaders": {
            "hits": max(ed["hitters"], key=lambda h: (h["h"], h["ops"]), default=None),
            "homeRuns": max(ed["hitters"], key=lambda h: (h["hr"], h["ops"]), default=None),
            "rbi": max(ed["hitters"], key=lambda h: (h["rbi"], h["ops"]), default=None),
        },
        "records": record,
    }


FINISH = {5: "Champion", 4: "Runner-up", 3: "Semifinals", 2: "Second round / QF", 1: "Pool play"}


def nations_table(summaries, editions):
    names = {t["abbr"]: t for ed in editions for t in ed["teams"]}
    table = {}
    for s in summaries:
        for abbr, r in s["records"].items():
            if abbr not in names:
                continue
            n = table.setdefault(abbr, {**names[abbr], "apps": 0, "w": 0, "l": 0, "rf": 0, "ra": 0, "titles": 0, "best": 0, "bestYears": []})
            n["apps"] += 1
            for k in ("w", "l", "rf", "ra"):
                n[k] += r[k]
            n["titles"] += r["stage"] == 5
            if r["stage"] > n["best"]:
                n["best"], n["bestYears"] = r["stage"], [s["year"]]
            elif r["stage"] == n["best"]:
                n["bestYears"].append(s["year"])
    rows = []
    for n in table.values():
        gp = n["w"] + n["l"]
        rows.append({**n, "pct": round(n["w"] / gp, 3) if gp else 0, "bestFinish": FINISH[n["best"]]})
    return sorted(rows, key=lambda r: (-r["titles"], -r["best"], -r["pct"]))


def records(summaries, editions):
    out = []
    games = [(ed["year"], g) for ed in editions for g in ed["games"] if g["final"]]
    if games:
        y, g = max(games, key=lambda x: x[1]["awayScore"] + x[1]["homeScore"])
        out.append({"label": "Most runs in a game", "value": g["awayScore"] + g["homeScore"], "who": f"{g['away']['name']} {g['awayScore']}, {g['home']['name']} {g['homeScore']}", "year": y})
        y, g = max(games, key=lambda x: abs(x[1]["awayScore"] - x[1]["homeScore"]))
        out.append({"label": "Biggest winning margin", "value": abs(g["awayScore"] - g["homeScore"]), "who": f"{g['away']['name']} {g['awayScore']}, {g['home']['name']} {g['homeScore']}", "year": y})
    unbeaten = [(s["year"], s["champion"], s["records"][s["champion"]["abbr"]]) for s in summaries if s["champion"]]
    perfect = [u for u in unbeaten if u[2]["l"] == 0]
    for y, team, r in perfect:
        out.append({"label": "Unbeaten champion", "value": f"{r['w']}-0", "who": team["name"], "year": y})
    hitters = [(ed["year"], h) for ed in editions for h in ed["hitters"]]
    for label, key in (("Most hits in one Classic", "h"), ("Most home runs in one Classic", "hr"), ("Most RBI in one Classic", "rbi")):
        best = max(h[key] for _, h in hitters)
        for y, h in hitters:
            if h[key] == best:
                out.append({"label": label, "value": best, "who": h["name"], "team": h["team"], "year": y})
    q = [(y, h) for y, h in hitters if h["pa"] >= 20]
    if q:
        y, h = max(q, key=lambda x: x[1]["avg"])
        out.append({"label": "Best average in one Classic (min. 20 PA)", "value": f"{h['avg']:.3f}".lstrip("0"), "who": h["name"], "team": h["team"], "year": y})
    return out


def ics(edition):
    """Calendar for one edition. Lines are folded at 75 octets as RFC 5545 asks."""
    def esc(s):
        return str(s).replace("\\", "\\\\").replace(";", r"\;").replace(",", r"\,").replace("\n", r"\n")

    def fold(line):
        raw, parts = line.encode("utf-8"), []
        while len(raw) > 75:
            cut = 75 if not parts else 74
            while (raw[cut] & 0xC0) == 0x80:
                cut -= 1
            parts.append(raw[:cut].decode("utf-8"))
            raw = raw[cut:]
        parts.append(raw.decode("utf-8"))
        return "\r\n ".join(parts)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sports Locker Room//WBC//EN", "CALSCALE:GREGORIAN",
             f"X-WR-CALNAME:World Baseball Classic {edition['year']}"]
    for g in edition["games"]:
        start = datetime.strptime(g["start"], "%Y-%m-%dT%H:%M:%SZ")
        end = start + timedelta(hours=3)
        title = f"{g['away']['name']} vs {g['home']['name']}"
        if g["final"]:
            title += f" ({g['awayScore']}-{g['homeScore']})"
        lines += ["BEGIN:VEVENT", f"UID:wbc-{g['pk']}@sports-locker-room", f"DTSTAMP:{stamp}",
                  f"DTSTART:{start:%Y%m%dT%H%M%SZ}", f"DTEND:{end:%Y%m%dT%H%M%SZ}",
                  f"SUMMARY:{esc('WBC ' + g['label'] + ': ' + title)}",
                  f"LOCATION:{esc(g['venue'] + (', ' + g['city'] if g['city'] else ''))}",
                  f"DESCRIPTION:{esc(g['stage'] + ' - ' + g['status'])}", "END:VEVENT"]
    lines.append("END:VCALENDAR")
    path = OUT.parent / f"wbc{edition['year']}_schedule.ics"
    path.write_text("\r\n".join(fold(line) for line in lines) + "\r\n", encoding="utf-8", newline="")
    print(f"  wrote public/{path.name}")


def build():
    editions = [e for e in (load_edition(y) for y in EDITIONS) if e]
    summaries = [summarize(e) for e in editions]
    write_json("wbc", {
        "editions": summaries,
        "nations": nations_table(summaries, editions),
        "records": records(summaries, editions),
    })
    for ed in editions:
        write_json(f"wbc{ed['year']}_games", {"year": ed["year"], "games": ed["games"], "teams": ed["teams"]})
    ics(editions[-1])


if __name__ == "__main__":
    build()
