import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/scan.js";

const originalFetch = globalThis.fetch;
const originalEnv = {
  login: process.env.DATAFORSEO_LOGIN,
  password: process.env.DATAFORSEO_PASSWORD,
  access: process.env.MAPTRACKER_ACCESS_PASSWORD
};

process.env.DATAFORSEO_LOGIN = "test-login";
process.env.DATAFORSEO_PASSWORD = "test-password";
process.env.MAPTRACKER_ACCESS_PASSWORD = "test-access";

function responseStub() {
  return {
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };
}

function request(overrides = {}) {
  return {
    method: "POST",
    body: {
      accessPassword: "test-access",
      keyword: "drain cleaning",
      businessName: "A-1 Drain Cleaning",
      businessDomain: "a1draincleaning.github.io",
      centerLat: 43.15371,
      centerLng: -93.20016,
      gridSize: 3,
      radiusMiles: 5,
      device: "mobile",
      ...overrides
    }
  };
}

test("rejects an incorrect access password", async () => {
  const res = responseStub();
  await handler(request({ accessPassword: "wrong" }), res);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /password/i);
});

test("rejects unsupported grid sizes without calling DataForSEO", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("must not call API"); };
  const res = responseStub();
  await handler(request({ gridSize: 4 }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls, 0);
});

test("runs a 3x3 Google Local Pack scan and totals real task costs", async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.dataforseo.com/v3/serp/google/organic/live/advanced");
    const payload = JSON.parse(options.body);
    assert.match(payload[0].location_coordinate, /^43\./);
    assert.match(payload[0].location_coordinate, /,-?93\./);
    assert.ok(payload[0].location_coordinate.endsWith(",200"));
    calls++;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        tasks: [{
          status_code: 20000,
          cost: 0.0006,
          result: [{
            items: [{
              type: "local_pack",
              title: "A-1 Drain Cleaning",
              rank_group: 2,
              rank_absolute: 8,
              rating: { value: 4.8, votes_count: 22 }
            }]
          }]
        }]
      })
    };
  };

  const res = responseStub();
  await handler(request(), res);

  assert.equal(res.statusCode, 200);
  assert.equal(calls, 9);
  assert.equal(res.body.points.length, 9);
  assert.equal(res.body.searchSurface, "Google organic Local Pack");
  assert.ok(res.body.points.every(point => point.rank === 2));
  assert.ok(res.body.points.every(point => point.listing.title === "A-1 Drain Cleaning"));
  assert.ok(Math.abs(res.body.totalCost - 0.0054) < 1e-8);
});

test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalEnv.login === undefined) delete process.env.DATAFORSEO_LOGIN;
  else process.env.DATAFORSEO_LOGIN = originalEnv.login;
  if (originalEnv.password === undefined) delete process.env.DATAFORSEO_PASSWORD;
  else process.env.DATAFORSEO_PASSWORD = originalEnv.password;
  if (originalEnv.access === undefined) delete process.env.MAPTRACKER_ACCESS_PASSWORD;
  else process.env.MAPTRACKER_ACCESS_PASSWORD = originalEnv.access;
});
