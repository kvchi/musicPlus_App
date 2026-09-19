import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSavedPlaylists } from "@/context/saved-playlists-context";
import type { SavedTrack } from "@/context/saved-playlists-context";
import { useMusicPlayer } from "@/context/music-player-context";
import { fetchJamendoTrackById } from "@/api/jamendo";
import { providerMessage } from "@/api/provider-response";
import { adaptJamendoTrack, hasPlayableAudio, localPlayableCatalog } from "@/lib/track-adapters";
import type { PlayableTrack } from "@/types/playable-track";

function SavedJamendoPlayback({ track }: { track: SavedTrack }) {
  const { playTrack } = useMusicPlayer();
  const controller = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "ready" | "unavailable" | "error">("idle");
  const [available, setAvailable] = useState<PlayableTrack | null>(null);
  const [error, setError] = useState("");
  useEffect(() => () => { controller.current?.abort(); }, []);
  const check = async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setStatus("checking"); setAvailable(null); setError("");
    try {
      const remote = await fetchJamendoTrackById(track.id.slice("jamendo:".length), next.signal);
      if (next.signal.aborted) return;
      const playable = remote ? adaptJamendoTrack(remote) : null;
      if (!playable || playable.id !== track.id || !hasPlayableAudio(playable)) { setStatus("unavailable"); return; }
      setAvailable({ ...playable, attributionUrl: playable.attributionUrl ?? track.attributionUrl,
        licenseUrl: playable.licenseUrl ?? track.licenseUrl });
      setStatus("ready");
    } catch (reason) {
      if (!next.signal.aborted) { setError(providerMessage(reason)); setStatus("error"); }
    }
  };
  return <div className="flex flex-wrap items-center gap-2">
    {status === "ready" && available
      ? <button type="button" aria-label={`Play ${track.title} from ${track.artist}`}
          onClick={() => playTrack(available)} className="min-h-11 rounded border border-emerald-400 px-3 text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Play</button>
      : <button type="button" disabled={status === "checking"} onClick={() => { void check(); }}
          aria-label={`Check playback availability for ${track.title}`}
          className="min-h-11 rounded border border-white/40 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-50">{status === "checking" ? "Checking…" : "Check availability"}</button>}
    {status === "ready" && <button type="button" onClick={() => { void check(); }} className="min-h-11 text-sm text-emerald-300 underline focus-visible:outline-2 focus-visible:outline-emerald-400">Check again</button>}
    {status === "unavailable" && <p role="status" className="text-xs text-amber-200">Audio currently unavailable from Jamendo.</p>}
    {status === "error" && <p role="alert" className="text-xs text-amber-200">{error}</p>}
  </div>;
}

export default function Library() {
  const library = useSavedPlaylists();
  const { playTrack } = useMusicPlayer();
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (library && !library.authReady) return <p role="status" className="text-white">Checking your session...</p>;
  if (!library || !library.signedIn) return <section className="text-white"><h1 className="text-3xl font-bold">Your Library</h1>
    <p className="mt-3">Sign in to create and view your saved playlists.</p><Link to="/sign-in" className="mt-3 inline-block text-emerald-300 underline">Sign in</Link></section>;
  const selected = library.playlists.find(item => item.id === selectedId) ?? library.playlists[0];
  return <section className="mx-auto max-w-4xl min-w-0 text-white">
    <h1 className="text-3xl font-bold">Your Library</h1>
    <p className="mt-2 text-neutral-300">Saved playlists stay separate from Up Next. Creating or editing one will not change playback. Playing a saved track starts a new queue.</p>
    <form className="mt-5 flex flex-wrap gap-2" onSubmit={async event => { event.preventDefault(); if (await library.create(name)) setName(""); }}>
      <label htmlFor="playlist-name" className="w-full text-sm font-semibold">New playlist name</label>
      <input id="playlist-name" value={name} onChange={event => setName(event.target.value)} maxLength={80} required
        className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/40 bg-neutral-900 px-3 text-white focus-visible:outline-2 focus-visible:outline-emerald-400" />
      <button disabled={library.busy} className="min-h-11 rounded-lg bg-emerald-600 px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-50">Create playlist</button>
    </form>
    {library.loading && <p role="status" className="mt-5">Loading your playlists...</p>}
    {library.error && <div role="alert" className="mt-5 rounded-lg border border-rose-500 p-3 text-rose-200">{library.error}
      <button type="button" onClick={() => { void library.reload(); }} className="ml-3 underline">Retry</button></div>}
    {library.notice && <p role="status" className="mt-4 text-emerald-300">{library.notice}</p>}
    {!library.loading && library.playlists.length === 0 && <p className="mt-5 rounded-lg bg-neutral-900 p-4">No saved playlists yet. Create one above, then save tracks from Songs or Search.</p>}
    {library.playlists.length > 0 && <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <nav aria-label="Saved playlists" className="flex flex-wrap gap-2 md:block md:space-y-2">
        {library.playlists.map(playlist => <button type="button" key={playlist.id} aria-current={selected?.id === playlist.id ? "true" : undefined}
          onClick={() => setSelectedId(playlist.id)} className="min-h-11 max-w-full rounded-lg border border-white/25 px-3 text-left focus-visible:outline-2 focus-visible:outline-emerald-400">{playlist.name} ({playlist.tracks.length})</button>)}
      </nav>
      {selected && <div className="min-w-0 rounded-xl bg-neutral-900 p-4">
        <h2 className="break-words text-xl font-bold">{selected.name}</h2>
        {selected.tracks.length === 0 && <p className="mt-3 text-neutral-300">No tracks saved. Add a song from Songs or a playable Jamendo result from Search.</p>}
        <ol className="mt-3 space-y-2">{selected.tracks.map(track => {
          const local = track.source === "local" ? localPlayableCatalog.find(item => item.id === track.id && hasPlayableAudio(item)) : null;
          return <li key={track.id} className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="min-w-0 flex-1"><p className="break-words font-semibold">{track.title}</p><p className="break-words text-sm text-neutral-300">{track.artist}</p>
              {local ? <p className="text-xs text-emerald-300">Local audio available</p> :
                track.source === "local" ? <p className="text-xs text-amber-200">Local audio unavailable in this build.</p> :
                  <p className="text-xs text-neutral-300">Check Jamendo for current audio before playing.</p>}
              {track.attributionUrl && <a href={track.attributionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-300 underline">Jamendo attribution</a>}
              {track.licenseUrl && <a href={track.licenseUrl} target="_blank" rel="noopener noreferrer" className="ml-3 text-xs text-emerald-300 underline">License</a>}
            </div>
            {local && <button type="button" aria-label={`Play ${track.title} from ${track.artist}`} onClick={() => playTrack(local)}
              className="min-h-11 rounded border border-emerald-400 px-3 text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Play</button>}
            {track.source === "jamendo" && <SavedJamendoPlayback key={track.id} track={track} />}
            <button type="button" disabled={library.busy} aria-label={`Remove ${track.title} from ${selected.name}`}
              onClick={() => { void library.removeTrack(selected.id, track.id); }} className="min-h-11 rounded border border-rose-300/50 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-50">Remove</button>
          </li>;
        })}</ol>
      </div>}
    </div>}
  </section>;
}
