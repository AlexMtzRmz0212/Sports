# The Locker Room

One site for eight competitions, served at https://sports.bittobyte.qzz.io (Vercel).
The hub is the locker room; each competition is its own venue: MLB ballpark, NFL gridiron,
NBA arena, NHL rink, Liga MX estadio, Champions League final night, World Cup world stage
and the WBC press box.

- `src/` React + Vite app. `npm install`, then `npm run dev`.
- `pipeline/` Python (standard library only) that writes `public/data/*.json`.
  Run `python pipeline/build_all.py`. A GitHub Action reruns it daily and commits
  changed data; Vercel redeploys on every push to `main`.
- `pipeline/ligamx_fetch.py` downloads raw Liga MX fixtures; needs `API_SPORTS_KEY`.
- `data/` hand-kept source CSVs and caches. `analysis/` notebooks and raw fixtures.
