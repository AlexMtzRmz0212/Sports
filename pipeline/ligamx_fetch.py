"""Download raw Liga MX fixtures from API-Football (api-sports.io) into analysis/ligamx/fixtures.

Manual only: the free plan has a small daily quota, so CI never runs this.

    API_SPORTS_KEY=... python pipeline/ligamx_fetch.py 2024 2025
    python pipeline/ligamx_fetch.py 2024 --force   # overwrite an existing file

Season 2024 means Apertura 2024 + Clausura 2025.
"""
import json
import os
import sys
import urllib.parse
import urllib.request

from common import ROOT

LEAGUE_ID = 262  # Liga MX
FIXTURES = ROOT / "analysis" / "ligamx" / "fixtures"


def fetch(season, key):
    url = "https://v3.football.api-sports.io/fixtures?" + urllib.parse.urlencode({"league": LEAGUE_ID, "season": season})
    req = urllib.request.Request(url, headers={"x-apisports-key": key})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    if data.get("errors"):
        raise RuntimeError(f"API-Sports error for {season}: {data['errors']}")
    return data


def main(argv):
    key = os.environ.get("API_SPORTS_KEY")
    if not key:
        sys.exit("Set API_SPORTS_KEY to your api-sports.io key first.")
    force = "--force" in argv
    seasons = [int(a) for a in argv if a.isdigit()]
    if not seasons:
        sys.exit(__doc__)
    FIXTURES.mkdir(parents=True, exist_ok=True)
    for season in seasons:
        path = FIXTURES / f"fixtures_{season}.json"
        if path.exists() and not force:
            print(f"{path.name} exists, skipping (use --force to overwrite)")
            continue
        data = fetch(season, key)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"saved {data.get('results', 0)} fixtures to {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
