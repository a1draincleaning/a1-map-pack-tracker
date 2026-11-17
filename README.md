# A-1 Map Pack Tracker

A standalone local Google Maps rank-grid tracker for A-1 Drain Cleaning.

## Planned functionality
- GPS-based Google Maps ranking checks through the DataForSEO Google Maps Live Advanced API.
- 3×3 and 5×5 grids centered on a business location.
- Track A-1 Drain Cleaning and competing listings at each grid point.
- Color-coded ranking results, scan history, and CSV export.
- Server-side API credentials; never expose DataForSEO credentials in browser code.

## Deployment requirements
This application requires a server runtime. GitHub Pages is static hosting and cannot safely run the DataForSEO requests. Deploy to a server platform such as Vercel.

Configure these server-only environment variables:
- DATAFORSEO_LOGIN
- DATAFORSEO_PASSWORD
- MAPTRACKER_ACCESS_PASSWORD
- DATABASE_URL (persistent PostgreSQL for scan history)

Do not commit a real .env file or API credentials.

## Current status
Repository initialized. Application source and live API verification still need to be added before this is ready to deploy or use for real ranking scans.
