# A-1 Map Pack Tracker

A standalone Google Local Pack rank-grid tracker for A-1 Drain Cleaning in Mason City, Iowa.

## What it measures

This version checks the **Google organic Local Pack** at each GPS grid point using DataForSEO's Google Organic Live Advanced endpoint. It reads individual `local_pack` result items and records the position of the A-1 Drain Cleaning listing when it appears.

This is distinct from the Google Maps results endpoint and from the expanded Google Local Finder list. A result not found means A-1 did not appear in the Local Pack returned for that coordinate and query; it does not prove the business is absent from Google Maps.

## Current implementation

- Leaflet/OpenStreetMap dashboard.
- 3×3 and 5×5 GPS grids centered on a configurable coordinate.
- Real Google organic Local Pack checks through DataForSEO.
- Per-point position, listing name, rating and review count.
- CSV export.
- Browser-local recent scan history (stored in the browser that ran the scan).

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

- A 3×3 grid runs 9 live Local Pack requests.
- A 5×5 grid runs 25 live Local Pack requests.
- Each request asks for 10 SERP results, which is enough to capture a typical Local Pack response.
- The app displays the returned task costs when DataForSEO supplies them. Every point is a paid live API request. Start with 3×3 while testing.

## Deploy

This app needs server-side functions to keep API credentials private. GitHub Pages cannot run the API route. Import this repository into Vercel and add the three environment variables above.

The dashboard stores recent scan summaries in the browser's local storage. It does not yet have shared, server-side historical storage; adding a persistent database is a later step.
