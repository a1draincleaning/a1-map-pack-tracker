const ENDPOINT = "https://api.dataforseo.com/v3/serp/google/maps/live/advanced";

function clean(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function makeGrid(lat, lng, size, radiusMiles) {
  const step = (radiusMiles * 2) / (size - 1);
  const latStep = step / 69;
  const lngStep = step / (69 * Math.max(0.15, Math.cos((lat * Math.PI) / 180)));
  return Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    return {
      index,
      lat: Number((lat + (row - (size - 1) / 2) * latStep).toFixed(7)),
      lng: Number((lng + (col - (size - 1) / 2) * lngStep).toFixed(7))
    };
  });
}

function listingMatches(item, businessName, businessDomain) {
  const title = clean(item.title);
  const target = clean(businessName);
  const domain = clean(item.domain || item.url);
  const wantedDomain = clean(businessDomain);
  return title === target ||
    (target.length >= 8 && title.includes(target)) ||
    Boolean(wantedDomain && domain.includes(wantedDomain));
}

async function lookupPoint(point, input, authorization) {
  const payload = [{
    keyword: input.keyword,
    location_coordinate: `${point.lat},${point.lng},14z`,
    language_code: "en",
    device: input.device,
    depth: 20,
    search_this_area: true,
    search_places: false
  }];

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.status_message || `DataForSEO returned HTTP ${response.status}`);
  }

  const task = data?.tasks?.[0];
  if (!task || (task.status_code && task.status_code !== 20000)) {
    throw new Error(task?.status_message || data?.status_message || "DataForSEO did not return a successful task.");
  }

  const items = task?.result?.[0]?.items || [];
  const found = items.find(item => listingMatches(item, input.businessName, input.businessDomain));
  return {
    ...point,
    rank: found ? (found.rank_group || found.rank_absolute || null) : null,
    found: Boolean(found),
    listing: found ? {
      title: found.title || "",
      domain: found.domain || "",
      address: found.address || "",
      rating: found.rating?.value ?? null,
      reviews: found.rating?.votes_count ?? null
    } : null,
    resultCount: items.length,
    cost: Number(task.cost || 0)
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const expectedPassword = process.env.MAPTRACKER_ACCESS_PASSWORD;
  const { DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD } = process.env;
  if (!expectedPassword || !DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    return res.status(503).json({ error: "Server setup is incomplete. Add the three required environment variables in Vercel." });
  }

  const body = req.body || {};
  if (typeof body.accessPassword !== "string" || body.accessPassword !== expectedPassword) {
    return res.status(401).json({ error: "Incorrect tracker password." });
  }

  const keyword = String(body.keyword || "").trim();
  const businessName = String(body.businessName || "").trim();
  const businessDomain = String(body.businessDomain || "").trim();
  const centerLat = Number(body.centerLat);
  const centerLng = Number(body.centerLng);
  const size = Number(body.gridSize);
  const radiusMiles = Number(body.radiusMiles);
  const device = body.device === "desktop" ? "desktop" : "mobile";

  if (!keyword || keyword.length > 120 || !businessName || businessName.length > 120) {
    return res.status(400).json({ error: "Enter a search phrase and the exact Google Business Profile name (120 characters max)." });
  }
  if (![3, 5].includes(size)) return res.status(400).json({ error: "Grid size must be 3 or 5." });
  if (!Number.isFinite(centerLat) || centerLat < -90 || centerLat > 90 ||
      !Number.isFinite(centerLng) || centerLng < -180 || centerLng > 180) {
    return res.status(400).json({ error: "Enter valid center coordinates." });
  }
  if (!Number.isFinite(radiusMiles) || radiusMiles < 0.5 || radiusMiles > 20) {
    return res.status(400).json({ error: "Grid radius must be between 0.5 and 20 miles." });
  }

  const input = { keyword, businessName, businessDomain, device };
  const points = makeGrid(centerLat, centerLng, size, radiusMiles);
  const authorization = "Basic " + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64");

  try {
    // Keep concurrency bounded so a larger grid does not create a sudden request burst.
    const results = [];
    for (let start = 0; start < points.length; start += 3) {
      const batch = points.slice(start, start + 3);
      results.push(...await Promise.all(batch.map(point => lookupPoint(point, input, authorization))));
    }
    const totalCost = results.reduce((sum, point) => sum + point.cost, 0);
    return res.status(200).json({
      scannedAt: new Date().toISOString(),
      keyword,
      businessName,
      center: { lat: centerLat, lng: centerLng },
      gridSize: size,
      radiusMiles,
      device,
      points: results,
      totalCost
    });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : "The ranking scan failed." });
  }
}
