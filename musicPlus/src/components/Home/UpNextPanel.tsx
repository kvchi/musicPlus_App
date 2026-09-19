import { useMusicPlayer } from "@/context/music-player-context";
import { TrackAttribution } from "./PlaybackFeedback";

export function UpNextPanel({ label, defaultOpen = false }: { label: string; defaultOpen?: boolean }) {
  const { selectedTrack, upNext, repeatMode, isShuffled, queueNotice } = useMusicPlayer();
  return <details open={defaultOpen} className="mt-3 rounded-xl border border-white/20 bg-neutral-900/80 text-white">
    <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      aria-label={`${label} Up Next, ${upNext.length} upcoming ${upNext.length === 1 ? "track" : "tracks"}`}>
      Up Next ({upNext.length})
    </summary>
    <div className="border-t border-white/15 px-3 pb-3 pt-2 text-sm">
      <p className="text-neutral-300">Repeat: {repeatMode} · Shuffle: {isShuffled ? "on" : "off"}</p>
      {repeatMode === "one" && selectedTrack && <p className="mt-1 text-amber-200">Repeat one replays the current track. Next moves to Up Next.</p>}
      {repeatMode === "all" && <p className="mt-1 text-neutral-300">The queue repeats after this cycle.</p>}
      <div className="mt-3 min-w-0 rounded-lg bg-white/5 p-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Current</p>
        {selectedTrack ? <>
          <p className="break-words font-medium">{selectedTrack.title}</p>
          <p className="break-words text-neutral-300">{selectedTrack.artist}</p>
          <TrackAttribution track={selectedTrack} />
        </> : <p className="text-neutral-300">No track selected.</p>}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-300">Playing next</p>
      {upNext.length ? <ol className="mt-1 max-h-48 space-y-1 overflow-y-auto pr-1">
        {upNext.map((track, index) => <li key={`${track.id}-${index}`} className="min-w-0 rounded-lg bg-white/5 p-2">
          <p className="break-words font-medium">{index + 1}. {track.title}</p>
          <p className="break-words text-neutral-300">{track.artist}</p>
          <TrackAttribution track={track} />
        </li>)}
      </ol> : <p className="mt-1 text-neutral-300">No upcoming tracks in this cycle.</p>}
      {queueNotice && <p className="mt-3 text-emerald-300">{queueNotice}</p>}
      <p className="mt-3 text-xs text-neutral-400">Selecting Play on a song starts a new queue and replaces Up Next.</p>
    </div>
  </details>;
}
