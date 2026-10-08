"""Shared helpers for the data pipeline. Standard library only, so CI needs no installs."""
import csv
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "public" / "data"
OUT.mkdir(parents=True, exist_ok=True)


def get_json(url, retries=3, **params):
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "sports-hub-pipeline"})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))


def read_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_json(name, payload):
    """Write public/data/<name>.json with a generated timestamp."""
    if isinstance(payload, dict):
        payload = {"generated": now_iso(), **payload}
    path = OUT / f"{name}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}")
    return path


def read_json(path, default=None):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def espn_table(league):
    """Current standings table from ESPN's site API, e.g. league="mex.1" or "uefa.champions"."""
    s = get_json(f"https://site.api.espn.com/apis/v2/sports/soccer/{league}/standings")
    group = s["children"][0]
    rows = []
    for e in group["standings"]["entries"]:
        stat = {x["name"]: x.get("value") for x in e["stats"]}
        rows.append({
            "id": e["team"]["id"],
            "team": e["team"]["displayName"],
            "logo": (e["team"].get("logos") or [{}])[0].get("href"),
            "rank": int(stat.get("rank") or 0),
            "gp": int(stat.get("gamesPlayed") or 0),
            "w": int(stat.get("wins") or 0),
            "d": int(stat.get("ties") or 0),
            "l": int(stat.get("losses") or 0),
            "gf": int(stat.get("pointsFor") or 0),
            "ga": int(stat.get("pointsAgainst") or 0),
            "pts": int(stat.get("points") or 0),
        })
    rows.sort(key=lambda r: r["rank"] or 99)
    return {"name": group["name"], "season": group["standings"].get("seasonDisplayName"), "rows": rows}


def espn_day(stamp, end=False):
    """ESPN season boundaries are local-midnight instants in UTC (e.g. 2026-09-06T07:00Z).
    Shifting by +12h lands on the intended calendar day for every US/MX timezone.
    End stamps are exclusive (xx:59 the next day), so step back one day."""
    dt = datetime.strptime(stamp, "%Y-%m-%dT%H:%MZ") + timedelta(hours=12)
    day = dt.date() - timedelta(days=1 if end else 0)
    return day.isoformat()
