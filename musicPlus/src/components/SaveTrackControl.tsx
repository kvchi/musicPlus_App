import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSavedPlaylists } from "@/context/saved-playlists-context";
import type { PlayableTrack } from "@/types/playable-track";

export function SaveTrackControl({ track }: { track: PlayableTrack }) {
  const library = useSavedPlaylists();
  const picker = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const pending = useRef(false);
  const [feedback, setFeedback] = useState<{ playlistId: string; message: string } | null>(null);
  const [attempted, setAttempted] = useState(false);
  if (!library) return null;
  if (!library.signedIn) return <Link to="/sign-in" className="inline-flex min-h-11 items-center text-sm text-emerald-300 underline">Sign in to save</Link>;
  return <div className="min-w-0 text-sm"><details ref={picker} className="relative">
    <summary ref={summary} onClick={() => { setAttempted(false); setFeedback(null); }} className="flex min-h-11 cursor-pointer items-center rounded-full border border-white/30 px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      aria-label={`Save ${track.title} to a playlist`}>Save to playlist</summary>
    <div className="mt-2 rounded-lg border border-white/20 bg-neutral-950 p-2 sm:absolute sm:right-0 sm:z-20 sm:min-w-48">
      {library.loading && <p role="status">Loading playlists...</p>}
      {!library.loading && library.playlists.length === 0 && <Link to="/library" className="text-emerald-300 underline">Create a playlist</Link>}
      {library.playlists.map(playlist => {
        const saved = playlist.tracks.some(item => item.id === track.id);
        return <button type="button" key={playlist.id} disabled={library.busy || saved}
          aria-label={saved ? `${track.title} already saved to ${playlist.name}` : `Save ${track.title} to ${playlist.name}`}
          onClick={async () => {
            if (pending.current || saved) return;
            pending.current = true;
            setAttempted(true);
            const success = await library.addTrack(playlist.id, track);
            pending.current = false;
            if (success) {
              picker.current?.removeAttribute("open");
              summary.current?.focus();
              setAttempted(false);
              setFeedback({ playlistId: playlist.id, message: `${track.title} saved to ${playlist.name}.` });
            }
          }}
          className="block min-h-11 w-full rounded px-2 text-left hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:opacity-70">{playlist.name}{saved ? " — Saved" : ""}</button>;
      })}
      {attempted && library.error && <p role="alert" className="text-rose-200">{library.error}</p>}
    </div>
  </details>{feedback && library.playlists.some(playlist => playlist.id === feedback.playlistId &&
    playlist.tracks.some(item => item.id === track.id)) &&
    <p role="status" className="mt-1 text-emerald-300">{feedback.message}</p>}</div>;
}
