"""Refresh every JSON file the site reads (public/data/*.json).

Each step is independent: if a source is down, its previous JSON stays in place
and the site keeps working with the last good data.

    python pipeline/build_all.py            # everything
    python pipeline/build_all.py wbc mlb    # only some steps
"""
import sys
import time
import traceback

import ligamx
import mlb
import seasons
import teams
import ucl
import wbc
import worldcup

STEPS = {
    "seasons": seasons.build,
    "mlb": mlb.build,
    "teams": teams.build,
    "wbc": wbc.build,
    "ligamx": ligamx.build,
    "ucl": ucl.build,
    "worldcup": worldcup.build,
}


def main(names):
    failed = []
    for name in names or STEPS:
        print(f"[{name}]")
        started = time.time()
        try:
            STEPS[name]()
            print(f"  done in {time.time() - started:.1f}s")
        except Exception:  # noqa: BLE001
            traceback.print_exc()
            failed.append(name)
    if failed:
        print(f"Kept previous data for: {', '.join(failed)}")
    # Partial failure is fine for the site, so only fail the run if nothing worked.
    return 1 if len(failed) == len(names or STEPS) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
