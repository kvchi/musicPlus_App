import { localPlayableCatalog } from "@/lib/track-adapters";
import { useMusicPlayer } from "@/context/music-player-context";

export default function Songs() {
  const { playQueue, playNext, addToQueue, queueNotice, selectedTrack, isPlaying, isLoading, togglePlay } = useMusicPlayer();
  return (
    <section className="text-white">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
        Local catalog
      </p>
      <h1 className="mt-2 text-3xl font-bold">Demo songs</h1>
      <p className="mt-2 text-neutral-400">
        Select a bundled song to play the local catalog queue.
      </p>
      <p className="mt-1 text-xs text-neutral-400">Play starts a new queue. Play Next and Add to Queue keep the current track playing.</p>
      {queueNotice && <p className="mt-2 text-sm text-emerald-300">{queueNotice}</p>}

      <div className="mt-6 grid gap-3">
        {localPlayableCatalog.map((track, index) => (
          <article
            key={track.id}
            aria-current={selectedTrack?.id === track.id ? "true" : undefined}
            className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4 rounded-xl bg-neutral-900 p-4"
          >
            <span className="w-6 text-right text-sm text-neutral-500">
              {index + 1}
            </span>
            <img
              src={track.artworkUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold">{track.title}</h2>
              <p className="truncate text-sm text-neutral-400">{track.artist}</p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button"
              aria-label={`${selectedTrack?.id === track.id && (isPlaying || isLoading) ? "Pause" : "Play"} ${track.title}`}
              aria-pressed={selectedTrack?.id === track.id && isPlaying}
              onClick={() => selectedTrack?.id === track.id && (isPlaying || isLoading)
                ? togglePlay() : playQueue(localPlayableCatalog, index)}
              className="min-h-11 shrink-0 rounded-full bg-emerald-600 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
              {selectedTrack?.id === track.id ? isLoading ? "Loading…" : isPlaying ? "Pause" : <><span className="sm:hidden">Play</span><span className="hidden sm:inline">Play · selected</span></> : "Play"}
            </button>
            <button type="button" aria-label={`Play ${track.title} next`} onClick={() => playNext(track)}
              className="min-h-11 rounded-full border border-white/30 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Play Next</button>
            <button type="button" aria-label={`Add ${track.title} to queue`} onClick={() => addToQueue(track)}
              className="min-h-11 rounded-full border border-white/30 px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Add to Queue</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
