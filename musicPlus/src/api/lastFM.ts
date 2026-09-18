import type { LastFmAlbum, LastFmArtist, LastFmImage, LastFmTag, LastFmTrack } from "@/types/types";
import { isRecord, ProviderError, providerUrl, requestJson, safeAssetUrl } from "./provider-response";

const metric = (value: unknown): value is string | number =>
  (typeof value === "string" && /^\d+$/.test(value)) ||
  (typeof value === "number" && Number.isFinite(value) && value >= 0);
const images = (value: unknown): value is LastFmImage[] | undefined =>
  value === undefined || (Array.isArray(value) && value.every((image) =>
    isRecord(image) && typeof image["#text"] === "string" &&
    (image.size === undefined || typeof image.size === "string")));
const named = (value: unknown): value is Record<string, unknown> & { name: string } => isRecord(value) && typeof value.name === "string";
const artist = (value: unknown): value is LastFmArtist =>
  named(value) && isRecord(value) && typeof value.listeners === "string" && metric(value.listeners) && images(value.image);
const track = (value: unknown): value is LastFmTrack => artist(value) && isRecord(value) && named(value.artist);
const tag = (value: unknown): value is LastFmTag =>
  named(value) && isRecord(value) && metric(value.reach) && metric(value.taggings);
const album = (value: unknown): value is LastFmAlbum =>
  named(value) && isRecord(value) && images(value.image) && (value.artist === undefined || named(value.artist));

function parseCollection<T>(value: unknown, root: string, child: string, guard: (item: unknown) => item is T): T[] {
  if (!isRecord(value)) throw new ProviderError("shape");
  if ("error" in value) throw new ProviderError("provider");
  const collection = value[root];
  if (!isRecord(collection) || !Array.isArray(collection[child]) || !collection[child].every(guard)) {
    throw new ProviderError("shape");
  }
  return collection[child];
}
const cleanImages = (value: LastFmImage[] | undefined) => value?.map((image) => ({
  "#text": safeAssetUrl(image["#text"]) ?? "", size: image.size,
}));
export const parseTopArtists = (value: unknown) => parseCollection(value, "artists", "artist", artist).map((item) => ({
  name: item.name, listeners: item.listeners, image: cleanImages(item.image),
}));
export const parseTopTracks = (value: unknown) => parseCollection(value, "tracks", "track", track).map((item) => ({
  name: item.name, listeners: item.listeners, artist: { name: item.artist.name }, image: cleanImages(item.image),
}));
export const parseTopTags = (value: unknown) => parseCollection(value, "tags", "tag", tag).map((item) => ({
  name: item.name, reach: item.reach, taggings: item.taggings,
}));
export const parseTopAlbums = (value: unknown) => parseCollection(value, "topalbums", "album", album).map((item) => ({
  name: item.name, artist: item.artist && { name: item.artist.name }, image: cleanImages(item.image),
}));

async function request(method: string, signal?: AbortSignal, extra: Record<string, string> = {}) {
  const url = providerUrl(import.meta.env.VITE_BASE_URL);
  const apiKey = import.meta.env.VITE_LASTFM_API_KEY;
  if (!apiKey) throw new ProviderError("configuration");
  url.search = new URLSearchParams({ method, ...extra, api_key: apiKey, format: "json" }).toString();
  return requestJson(url, signal);
}
export async function fetchTopArtist(signal?: AbortSignal) {
  return parseTopArtists(await request("chart.gettopartists", signal));
}
export async function fetchTopTracks(signal?: AbortSignal) {
  return parseTopTracks(await request("chart.gettoptracks", signal));
}
export async function fetchTopTags(signal?: AbortSignal) {
  return parseTopTags(await request("chart.gettoptags", signal));
}
export async function fetchArtistTopAlbums(artist: string, signal?: AbortSignal) {
  return parseTopAlbums(await request("artist.getTopAlbums", signal, { artist }));
}

