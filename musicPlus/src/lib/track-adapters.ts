import { playlist } from "@/data/MusicData";
import type { Track as LocalTrack } from "@/data/MusicData";
import type { JamendoTrack } from "@/types/types";
import type { PlayableTrack } from "@/types/playable-track";
import { safeAssetUrl } from "@/api/provider-response";

export function hasPlayableAudio(track: PlayableTrack): boolean {
  if (track.source === "local" && /^\/(?!\/)/.test(track.audioUrl)) {
    const url = new URL(track.audioUrl, "https://local.invalid");
    return !url.search && !url.hash;
  }
  return Boolean(safeAssetUrl(track.audioUrl));
}

export function adaptLocalTrack(track: LocalTrack): PlayableTrack {
  return { id: `local:${track.id}`, source: "local", title: track.title,
    artist: track.artist, audioUrl: track.src, artworkUrl: track.cover };
}

/** No stream is invented, and a download URL never substitutes for audio. */
export function adaptJamendoTrack(track: JamendoTrack): PlayableTrack | null {
  const audioUrl = safeAssetUrl(track.audio);
  if (!audioUrl) return null;
  return { id: `jamendo:${track.id}`, source: "jamendo", title: track.name,
    artist: track.artist_name, audioUrl, artworkUrl: safeAssetUrl(track.image) ?? "",
    albumTitle: track.album_name || undefined, durationSeconds: track.duration,
    attributionUrl: safeAssetUrl(track.shareurl), licenseUrl: safeAssetUrl(track.license_ccurl),
    downloadAllowed: track.audiodownload_allowed };
}

export const localPlayableCatalog = playlist.map(adaptLocalTrack);
