# A-1 Map Pack Tracker

A standalone GPS-grid tracker for A-1 Drain Cleaning in Mason City, Iowa.

## Current implementation

- Static dashboard with an OpenStreetMap/Leaflet map.
- 3×3 and 5×5 GPS grids centered on a configurable coordinate.
- Server-side DataForSEO Google Maps Live Advanced requests.
- Per-point position, listing name, rating and review count.
- CSV export.
- Browser-local recent scan history (stored in the browser that ran the scan).

**Important measurement note:** this version tracks positions in Google Maps results returned by DataForSEO's Google Maps endpoint. It does not currently measure the separate Google Search organic Local Pack/Local Finder surface. Those are different result types and should not be compared as if they were the same ranking.

## Run locally

Requirements: Node.js 20+ and the Vercel CLI.

```bash
npm install -g vercel
cp .env.example .env
# Fill in the server-only credentials in .env
vercel dev
```

Open the local URL printed by Vercel.

## Required server environment variables

Set these in Vercel → Project Settings → Environment Variables:

- `DATAFORSEO_LOGIN` — API login from DataForSEO API Access.
- `DATAFORSEO_PASSWORD` — DataForSEO API password.
- `MAPTRACKER_ACCESS_PASSWORD` — a strong password required before scans can run.

Do not use a `VITE_` prefix. Do not commit `.env` or real credentials.

## Cost and scan size

- A 3×3 grid runs 9 separate live Maps requests.
- A 5×5 grid runs 25 separate live Maps requests.
- The app displays the returned task costs when DataForSEO supplies them.
- Each point is a real paid API request. Start with 3×3 while testing.

## Deploy

This app needs server-side functions to keep API credentials private. GitHub Pages cannot run the API route. Import this repository into Vercel and add the three environment variables above.

The dashboard stores recent scan summaries in the browser's local storage. It does not yet have shared, server-side historical storage; adding a persistent database is a later step.
