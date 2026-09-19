import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function fakeModel() {
  const rows = [];
  let next = 1;
  const findOne = async filter => rows.find(row => row._id === filter._id && row.ownerId === filter.ownerId) ?? null;
  return {
    rows,
    find: filter => ({ sort: () => ({ limit: async () => rows.filter(row => row.ownerId === filter.ownerId) }) }),
    countDocuments: async filter => rows.filter(row => row.ownerId === filter.ownerId).length,
    create: async value => { const row = { ...value, _id: next.toString(16).padStart(24, "0") }; next++; rows.push(row); return row; },
    findOne,
    findOneAndUpdate: async (filter, update) => {
      const row = await findOne(filter);
      if (!row) return null;
      if (update.$push) {
        if (row.tracks.some(track => track.id === update.$push.tracks.id) || row.tracks.length >= 200) return null;
        row.tracks.push(update.$push.tracks);
      } else if (update.$pull) {
        if (!row.tracks.some(track => track.id === update.$pull.tracks.id)) return null;
        row.tracks = row.tracks.filter(track => track.id !== update.$pull.tracks.id);
      }
      return row;
    },
  };
}
async function fixture(ready = () => true, model = fakeModel()) {
  const app = createApp({ model, isDatabaseReady: ready,
    authMiddleware: (request, _response, next) => { request.testUser = request.get("x-test-user"); next(); },
    ownerFromRequest: request => request.testUser || null });
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/playlists`;
  return { model, close: () => new Promise(resolve => server.close(resolve)),
    call: async (path = "", method = "GET", body, user = "user_a") => {
      const response = await fetch(`${base}${path}`, { method, headers: {
        ...(user ? { "x-test-user": user } : {}), ...(body ? { "content-type": "application/json" } : {}),
      }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, body: await response.json() };
    },
    health: async () => (await fetch(`http://127.0.0.1:${server.address().port}/health`)).json(),
  };
}
const local = { id: "local:1", source: "local", title: "Spoofed", artist: "Spoofed", audioUrl: "https://evil.invalid/a.mp3" };
const jamendo = { id: "jamendo:123", source: "jamendo", title: "Remote", artist: "Artist",
  attributionUrl: "https://www.jamendo.com/track/123", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" };

test("create, list, add, duplicate, remove; server derives owner and discards audio URLs", async () => {
  const f = await fixture();
  try {
    const created = await f.call("", "POST", { name: "  My music  ", ownerId: "user_b" });
    assert.equal(created.status, 400);
    const good = await f.call("", "POST", { name: "  My music  " });
    assert.equal(good.status, 201);
    const id = good.body.playlist.id;
    assert.equal(good.body.playlist.name, "My music");
    assert.equal(f.model.rows[0].ownerId, "user_a");
    const added = await f.call(`/${id}/tracks`, "POST", { track: local });
    assert.equal(added.status, 400); // Unknown keys, including audioUrl, are rejected.
    assert.equal(await f.call(`/${id}/tracks`, "POST", { track: { id: local.id, source: local.source, title: "Spoofed" } }).then(r => r.status), 400);
    const accepted = await f.call(`/${id}/tracks`, "POST", { track: { id: local.id, source: local.source } });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.playlist.tracks[0].title, "Luv");
    assert.equal(await f.call(`/${id}/tracks`, "POST", { track: { id: local.id, source: local.source } }).then(r => r.status), 409);
    assert.equal(await f.call(`/${id}/tracks`, "POST", { track: jamendo }).then(r => r.status), 200);
    assert.equal(f.model.rows[0].tracks[1].licenseUrl, jamendo.licenseUrl);
    assert.equal((await f.call()).body.playlists[0].tracks.length, 2);
    assert.equal(await f.call(`/${id}/tracks/local%3A1`, "DELETE").then(r => r.status), 200);
    assert.equal(await f.call(`/${id}/tracks/local%3A1`, "DELETE").then(r => r.status), 404);
  } finally { await f.close(); }
});

test("every route rejects unauthenticated access and does not reveal another owner's playlist", async () => {
  const f = await fixture();
  try {
    const id = (await f.call("", "POST", { name: "Private" })).body.playlist.id;
    for (const [path, method, body] of [["", "GET"], ["", "POST", { name: "Other" }],
      [`/${id}/tracks`, "POST", { track: jamendo }], [`/${id}/tracks/jamendo%3A123`, "DELETE"]]) {
      assert.equal(await f.call(path, method, body, "").then(r => r.status), 401);
    }
    assert.deepEqual((await f.call("", "GET", undefined, "user_b")).body.playlists, []);
    assert.equal(await f.call(`/${id}/tracks`, "POST", { track: jamendo }, "user_b").then(r => r.status), 404);
    assert.equal(await f.call(`/${id}/tracks/jamendo%3A123`, "DELETE", undefined, "user_b").then(r => r.status), 404);
    assert.equal((await f.call()).body.playlists[0].tracks.length, 0);
  } finally { await f.close(); }
});

test("rejects invalid names, IDs, metadata and oversized requests", async () => {
  const f = await fixture();
  try {
    assert.equal(await f.call("", "POST", { name: "  " }).then(r => r.status), 400);
    assert.equal(await f.call("", "POST", { name: "x".repeat(81) }).then(r => r.status), 400);
    const id = (await f.call("", "POST", { name: "Good" })).body.playlist.id;
    assert.equal(await f.call("/bad/tracks", "POST", { track: jamendo }).then(r => r.status), 400);
    assert.equal(await f.call(`/${id}/tracks`, "POST", { track: { ...jamendo, id: "lastfm:1" } }).then(r => r.status), 400);
    assert.equal(await f.call(`/${id}/tracks`, "POST", { track: { ...jamendo, licenseUrl: "https://evil.invalid/license" } }).then(r => r.status), 400);
    assert.equal(await f.call(`/${id}/tracks`, "POST", { track: { ...jamendo, title: "x".repeat(161) } }).then(r => r.status), 400);
    assert.equal(await f.call(`/${id}/tracks`, "POST", { track: { ...jamendo, id: "jamendo:0123" } }).then(r => r.status), 400);
    assert.equal(await f.call(`/${id}/tracks/bad`, "DELETE").then(r => r.status), 400);
    assert.equal(await f.call("", "POST", { name: "x".repeat(9000) }).then(r => r.status), 413);
  } finally { await f.close(); }
});

test("returns 503 on disconnected or failed database but keeps health available", async () => {
  const offline = await fixture(() => false);
  try {
    assert.deepEqual(await offline.health(), { status: "ok" });
    assert.equal(await offline.call().then(r => r.status), 503);
    assert.equal(await offline.call("", "POST", { name: "Unavailable" }).then(r => r.status), 503);
    const id = "000000000000000000000001";
    assert.equal(await offline.call(`/${id}/tracks`, "POST", { track: jamendo }).then(r => r.status), 503);
    assert.equal(await offline.call(`/${id}/tracks/jamendo%3A123`, "DELETE").then(r => r.status), 503);
  } finally { await offline.close(); }
  const broken = fakeModel(); broken.find = () => ({ sort: () => { throw new Error("database down"); } });
  const f = await fixture(() => true, broken);
  try { assert.equal(await f.call().then(r => r.status), 503); }
  finally { await f.close(); }
});

test("playlist routes use the identity supplied by Clerk middleware", async () => {
  const previousPublic = process.env.CLERK_PUBLISHABLE_KEY;
  const previousSecret = process.env.CLERK_SECRET_KEY;
  process.env.CLERK_PUBLISHABLE_KEY = "test-publishable";
  process.env.CLERK_SECRET_KEY = "test-secret";
  let verifiedUser = null;
  let middlewareCalls = 0;
  let authReads = 0;
  const clerkAuth = {
    clerkMiddleware: () => (request, _response, next) => {
      middlewareCalls++;
      request.verifiedIdentity = verifiedUser;
      next();
    },
    getAuth: request => {
      authReads++;
      return { isAuthenticated: Boolean(request.verifiedIdentity), userId: request.verifiedIdentity };
    },
  };
  let app;
  try { app = createApp({ clerkAuth, model: fakeModel(), isDatabaseReady: () => true }); }
  finally {
    if (previousPublic === undefined) delete process.env.CLERK_PUBLISHABLE_KEY;
    else process.env.CLERK_PUBLISHABLE_KEY = previousPublic;
    if (previousSecret === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = previousSecret;
  }
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/playlists`;
  try {
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base, { method: "POST", body: JSON.stringify({ name: "Rejected" }),
      headers: { "content-type": "application/json" } })).status, 401);
    verifiedUser = "verified_user";
    const created = await fetch(base, { method: "POST", body: JSON.stringify({ name: "Accepted" }),
      headers: { "content-type": "application/json" } });
    assert.equal(created.status, 201);
    const listed = await fetch(base);
    assert.equal(listed.status, 200);
    assert.equal((await listed.json()).playlists.length, 1);
    assert.equal(middlewareCalls, 4);
    assert.equal(authReads, 4);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("Clerk setup fails closed when a required server key is missing", () => {
  const previousPublic = process.env.CLERK_PUBLISHABLE_KEY;
  const previousSecret = process.env.CLERK_SECRET_KEY;
  delete process.env.CLERK_PUBLISHABLE_KEY;
  process.env.CLERK_SECRET_KEY = "test-secret";
  try {
    assert.throws(() => createApp({ clerkAuth: {} }), /Clerk server keys are not configured/);
  } finally {
    if (previousPublic === undefined) delete process.env.CLERK_PUBLISHABLE_KEY;
    else process.env.CLERK_PUBLISHABLE_KEY = previousPublic;
    if (previousSecret === undefined) delete process.env.CLERK_SECRET_KEY;
    else process.env.CLERK_SECRET_KEY = previousSecret;
  }
});
