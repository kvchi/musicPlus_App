import type { JamendoTrack } from "@/types/types";
import { isRecord, ProviderError, providerUrl, requestJson, safeAssetUrl } from "./provider-response";
function providerLink(value: string | undefined, host: string): string | undefined {
  const safe = safeAssetUrl(value);
  if (!safe) return undefined;
  const url = new URL(safe);
  return url.protocol === "https:" && (url.hostname === host || url.hostname.endsWith(`.${host}`)) ? safe : undefined;
}
function isTrack(value: unknown): value is JamendoTrack {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" &&
    typeof value.artist_name === "string" && typeof value.album_name === "string" &&
    typeof value.duration === "number" && Number.isFinite(value.duration) && value.duration >= 0 &&
    (value.image === undefined || typeof value.image === "string") &&
    (value.audio === undefined || typeof value.audio === "string") &&
    (value.shareurl === undefined || typeof value.shareurl === "string") &&
    (value.license_ccurl === undefined || typeof value.license_ccurl === "string") &&
    (value.audiodownload_allowed === undefined || typeof value.audiodownload_allowed === "boolean");
}
export function parseJamendoResponse(value: unknown): JamendoTrack[] {
  if (!isRecord(value) || !isRecord(value.headers) ||
      typeof value.headers.status !== "string" || typeof value.headers.code !== "number") throw new ProviderError("shape");
  if (value.headers.status !== "success" || value.headers.code !== 0) throw new ProviderError("provider");
  if (!Array.isArray(value.results) || !value.results.every(isTrack)) throw new ProviderError("shape");
  return value.results.map((track) => ({
    id: track.id, name: track.name, artist_name: track.artist_name,
    album_name: track.album_name, duration: track.duration,
    image: safeAssetUrl(track.image), audio: safeAssetUrl(track.audio),
    shareurl: providerLink(track.shareurl, "jamendo.com"),
    license_ccurl: providerLink(track.license_ccurl, "creativecommons.org"),
    audiodownload_allowed: track.audiodownload_allowed,
  }));
}
export async function fetchJamendoTracks(query: string, signal?: AbortSignal) {
  const base = providerUrl(import.meta.env.VITE_JAMENDO_API_URL);
  const clientId = import.meta.env.VITE_JAMENDO_CLIENT_ID;
  if (!clientId) throw new ProviderError("configuration");
  const url = new URL("tracks/", `${base.href.replace(/\/$/, "")}/`);
  url.search = new URLSearchParams({ client_id: clientId, format: "json", limit: "10", search: query }).toString();
  return parseJamendoResponse(await requestJson(url, signal));
}

/** Resolve a saved identity afresh; saved playlists never contain stream URLs. */
export async function fetchJamendoTrackById(id: string, signal?: AbortSignal): Promise<JamendoTrack | null> {
  if (!/^[1-9][0-9]{0,19}$/.test(id)) return null;
  const base = providerUrl(import.meta.env.VITE_JAMENDO_API_URL);
  const clientId = import.meta.env.VITE_JAMENDO_CLIENT_ID;
  if (!clientId) throw new ProviderError("configuration");
  const url = new URL("tracks/", `${base.href.replace(/\/$/, "")}/`);
  url.search = new URLSearchParams({ client_id: clientId, format: "json", limit: "1", id, type: "single albumtrack" }).toString();
  return parseJamendoResponse(await requestJson(url, signal)).find(track => track.id === id) ?? null;
}
