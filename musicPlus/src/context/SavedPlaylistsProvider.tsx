import { useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { SavedPlaylistsContext } from "./saved-playlists-context";
import type { SavedPlaylist } from "./saved-playlists-context";
import type { PlayableTrack } from "@/types/playable-track";

function message(status: number) {
  if (status === 401) return "Could not verify your sign-in. Refresh the page or sign in again.";
  if (status === 503) return "Saved playlists are temporarily unavailable. Try again later.";
  if (status === 404) return "Playlist or track not found. Refresh your library.";
  if (status === 409) return "This track is already in that playlist.";
  if (status === 413) return "That request is too large.";
  return "Could not save this change. Check your input and try again.";
}
export function SavedPlaylistsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const identity = useRef(userId);
  const mutationPending = useRef(false);
  identity.current = userId;
  useEffect(() => { setPlaylists([]); setNotice(null); setError(null); }, [userId]);
  const request = useCallback(async (path: string, init?: RequestInit) => {
    const token = await getToken();
    if (!token) throw new Error("Your sign-in is not ready yet. Try again in a moment.");
    let response: Response;
    try {
      response = await fetch(`/api/playlists${path}`, { ...init, headers: {
        Authorization: `Bearer ${token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}),
      } });
    } catch { throw new Error(message(503)); }
    if (!response.ok) throw new Error(message(response.status));
    return response.json();
  }, [getToken]);
  const reload = useCallback(async () => {
    if (!isLoaded || !isSignedIn) { setPlaylists([]); setError(null); setNotice(null); return; }
    const owner = userId;
    setLoading(true); setError(null);
    try { const data = await request(""); if (identity.current === owner) setPlaylists(data.playlists); }
    catch (caught) { if (identity.current === owner) setError(caught instanceof Error ? caught.message : message(503)); }
    finally { if (identity.current === owner) setLoading(false); }
  }, [isLoaded, isSignedIn, request, userId]);
  useEffect(() => { void reload(); }, [reload, userId]);
  const mutate = useCallback(async (path: string, init: RequestInit, success: string) => {
    if (mutationPending.current) return false;
    mutationPending.current = true;
    const owner = userId;
    setBusy(true); setError(null); setNotice(null);
    try {
      const data = await request(path, init);
      const playlist = data.playlist as SavedPlaylist;
      if (identity.current !== owner) return false;
      setPlaylists(current => [playlist, ...current.filter(item => item.id !== playlist.id)]);
      setNotice(success);
      return true;
    } catch (caught) {
      if (identity.current === owner) setError(caught instanceof Error ? caught.message : message(503));
      return false;
    } finally { mutationPending.current = false; if (identity.current === owner) setBusy(false); }
  }, [request, userId]);
  const create = useCallback(async (name: string) => {
    if (!name.trim() || name.trim().length > 80) { setError("Playlist name must be 1–80 characters."); return false; }
    return mutate("", { method: "POST", body: JSON.stringify({ name: name.trim() }) }, "Playlist created.");
  }, [mutate]);
  const addTrack = useCallback((playlistId: string, track: PlayableTrack) => mutate(
    `/${encodeURIComponent(playlistId)}/tracks`, { method: "POST", body: JSON.stringify({ track: {
      id: track.id, source: track.source, title: track.title, artist: track.artist,
      ...(track.attributionUrl ? { attributionUrl: track.attributionUrl } : {}),
      ...(track.licenseUrl ? { licenseUrl: track.licenseUrl } : {}),
    } }) }, `${track.title} saved to playlist.`), [mutate]);
  const removeTrack = useCallback((playlistId: string, trackId: string) => mutate(
    `/${encodeURIComponent(playlistId)}/tracks/${encodeURIComponent(trackId)}`,
    { method: "DELETE" }, "Track removed from playlist."), [mutate]);
  return <SavedPlaylistsContext.Provider value={{ authReady: isLoaded, signedIn: Boolean(isLoaded && isSignedIn), loading, busy, error, notice,
    playlists, reload, create, addTrack, removeTrack }}>{children}</SavedPlaylistsContext.Provider>;
}
