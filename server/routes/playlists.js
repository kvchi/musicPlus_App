import { Router } from "express";
import mongoose from "mongoose";
import Playlist from "../models/Playlist.js";

const localTracks = new Map([
  ["local:1", ["Luv", "Tory Lanez"]], ["local:2", ["Lose", "Wizkid"]],
  ["local:3", ["Balance", "Wizkid"]], ["local:4", ["Stutter", "Chris Brown"]],
  ["local:5", ["Fiesta", "Dj Maphorisa, Dj Tunez, Wizkid, Zaba, Zeh McGeba"]],
  ["local:6", ["Higher Life", "Kranium ft Chronic Law"]],
]);
const text = (value, max) => typeof value === "string" && value.trim().length > 0 &&
  value.trim().length <= max && !/[\u0000-\u001f\u007f]/.test(value) ? value.trim() : null;
const keysOnly = (value, keys) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).every(key => keys.includes(key));
function safeLink(value, hosts) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
      !hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)) ||
      [...url.searchParams.keys()].some(key => /^(key|token|password|secret|authorization|signature)$/i.test(key))) return null;
    url.protocol = "https:";
    return url.href;
  } catch { return null; }
}
function validTrack(input) {
  if (!keysOnly(input, ["id", "source", "title", "artist", "attributionUrl", "licenseUrl"])) return null;
  if (input.source === "local" && localTracks.has(input.id)) {
    const [title, artist] = localTracks.get(input.id);
    if ((input.title !== undefined && input.title !== title) ||
      (input.artist !== undefined && input.artist !== artist) ||
      input.attributionUrl !== undefined || input.licenseUrl !== undefined) return null;
    return { id: input.id, source: "local", title, artist };
  }
  if (input.source !== "jamendo" || !/^jamendo:[1-9][0-9]{0,19}$/.test(input.id)) return null;
  const title = text(input.title, 160); const artist = text(input.artist, 160);
  const attributionUrl = safeLink(input.attributionUrl, ["jamendo.com"]);
  const licenseUrl = safeLink(input.licenseUrl, ["creativecommons.org"]);
  if (!title || !artist || attributionUrl === null || licenseUrl === null) return null;
  return { id: input.id, source: "jamendo", title, artist,
    ...(attributionUrl ? { attributionUrl } : {}), ...(licenseUrl ? { licenseUrl } : {}) };
}
const exposed = playlist => ({ id: String(playlist._id), name: playlist.name,
  tracks: playlist.tracks.map(track => ({ id: track.id, source: track.source, title: track.title,
    artist: track.artist, ...(track.attributionUrl ? { attributionUrl: track.attributionUrl } : {}),
    ...(track.licenseUrl ? { licenseUrl: track.licenseUrl } : {}) })) });

export function playlistsRouter({ model = Playlist, ownerFromRequest, isDatabaseReady = () => mongoose.connection.readyState === 1 } = {}) {
  const router = Router();
  router.use((request, response, next) => {
    const ownerId = ownerFromRequest?.(request);
    if (!ownerId) return response.status(401).json({ error: "Sign in to use saved playlists." });
    if (!isDatabaseReady()) return response.status(503).json({ error: "Saved playlists are temporarily unavailable." });
    request.playlistOwnerId = ownerId;
    next();
  });
  router.get("/", async (request, response) => {
    try {
      const playlists = await model.find({ ownerId: request.playlistOwnerId }).sort({ createdAt: -1 }).limit(50);
      response.json({ playlists: playlists.map(exposed) });
    } catch { response.status(503).json({ error: "Saved playlists are temporarily unavailable." }); }
  });
  router.post("/", async (request, response) => {
    if (!keysOnly(request.body, ["name"])) return response.status(400).json({ error: "Invalid playlist request." });
    const name = text(request.body.name, 80);
    if (!name) return response.status(400).json({ error: "Playlist name must be 1–80 characters." });
    try {
      if (await model.countDocuments({ ownerId: request.playlistOwnerId }) >= 50)
        return response.status(400).json({ error: "Playlist limit reached." });
      const playlist = await model.create({ ownerId: request.playlistOwnerId, name, tracks: [] });
      response.status(201).json({ playlist: exposed(playlist) });
    } catch { response.status(503).json({ error: "Saved playlists are temporarily unavailable." }); }
  });
  router.post("/:playlistId/tracks", async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.playlistId)) return response.status(400).json({ error: "Invalid playlist ID." });
    if (!keysOnly(request.body, ["track"])) return response.status(400).json({ error: "Invalid track request." });
    const track = validTrack(request.body.track);
    if (!track) return response.status(400).json({ error: "Invalid playable track metadata." });
    try {
      const filter = { _id: request.params.playlistId, ownerId: request.playlistOwnerId };
      const playlist = await model.findOne(filter);
      if (!playlist) return response.status(404).json({ error: "Playlist not found." });
      if (playlist.tracks.some(item => item.id === track.id)) return response.status(409).json({ error: "Track is already saved." });
      if (playlist.tracks.length >= 200) return response.status(400).json({ error: "Playlist track limit reached." });
      const updated = await model.findOneAndUpdate({ ...filter, "tracks.id": { $ne: track.id },
        $expr: { $lt: [{ $size: "$tracks" }, 200] } }, { $push: { tracks: track } }, { new: true });
      if (!updated) return response.status(409).json({ error: "Track is already saved or the playlist is full." });
      response.json({ playlist: exposed(updated) });
    } catch { response.status(503).json({ error: "Saved playlists are temporarily unavailable." }); }
  });
  router.delete("/:playlistId/tracks/:trackId", async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.playlistId)) return response.status(400).json({ error: "Invalid playlist ID." });
    const trackId = request.params.trackId;
    if (!/^(local:[1-6]|jamendo:[1-9][0-9]{0,19})$/.test(trackId)) return response.status(400).json({ error: "Invalid track ID." });
    try {
      const filter = { _id: request.params.playlistId, ownerId: request.playlistOwnerId };
      const playlist = await model.findOne(filter);
      if (!playlist) return response.status(404).json({ error: "Playlist not found." });
      if (!playlist.tracks.some(item => item.id === trackId)) return response.status(404).json({ error: "Track not found in playlist." });
      const updated = await model.findOneAndUpdate({ ...filter, "tracks.id": trackId },
        { $pull: { tracks: { id: trackId } } }, { new: true });
      if (!updated) return response.status(404).json({ error: "Track not found in playlist." });
      response.json({ playlist: exposed(updated) });
    } catch { response.status(503).json({ error: "Saved playlists are temporarily unavailable." }); }
  });
  return router;
}
