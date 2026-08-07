import assert from "node:assert/strict";
import test from "node:test";

import app from "../src/index.js";

test("health route identifies the service", async () => {
  const response = await app.request("http://local.test/health");

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: "wloc" });
});

test("parse route returns JSON for plain coordinates", async () => {
  const input = encodeURIComponent("31.2304,121.4737");
  const response = await app.request(
    `http://local.test/api/parse?format=json&cs=none&u=${input}`
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.deepEqual(await response.json(), {
    lat: 31.2304,
    lon: 121.4737,
    name: "",
  });
});

test("parse route keeps the shortcut-compatible text response", async () => {
  const input = encodeURIComponent("31.2304,121.4737");
  const response = await app.request(
    `http://local.test/api/parse?cs=none&u=${input}`
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "lat=31.2304&lon=121.4737");
});

test("parse route extracts Apple coordinate links and names", async () => {
  const input = encodeURIComponent(
    "https://maps.apple.com/?coordinate=31.2304,121.4737&name=Shanghai"
  );
  const response = await app.request(
    `http://local.test/api/parse?format=json&cs=none&u=${input}`
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    lat: 31.2304,
    lon: 121.4737,
    name: "Shanghai",
  });
});

test("parse route extracts AMap q links", async () => {
  const input = encodeURIComponent(
    "https://uri.amap.com/search?q=31.2304,121.4737,Shanghai"
  );
  const response = await app.request(
    `http://local.test/api/parse?format=json&cs=none&u=${input}`
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    lat: 31.2304,
    lon: 121.4737,
    name: "Shanghai",
  });
});

test("mainland Apple coordinates are converted by default", async () => {
  const input = encodeURIComponent(
    "https://maps.apple.com/?coordinate=31.2304,121.4737"
  );
  const response = await app.request(
    `http://local.test/api/parse?format=json&u=${input}`
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.notEqual(result.lat, 31.2304);
  assert.notEqual(result.lon, 121.4737);
});

test("parse route rejects input without coordinates", async () => {
  const response = await app.request(
    "http://local.test/api/parse?format=json&u=not-a-map-link"
  );

  assert.equal(response.status, 422);
  assert.match((await response.json()).error, /未能从链接中解析出经纬度/);
});

test("parse preflight returns CORS headers", async () => {
  const response = await app.request("http://local.test/api/parse", {
    method: "OPTIONS",
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, OPTIONS");
});

test("selection page uses the same-origin parse API", async () => {
  const response = await app.request("http://local.test/");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /fetch\('\/api\/parse\?format=json&u='/);
  assert.doesNotMatch(html, /workers\.dev|pages\.dev/);
});
