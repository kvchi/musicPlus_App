import { localPlayableCatalog } from "@/lib/track-adapters";
import { useMusicPlayer } from "@/context/music-player-context";

export default function Songs() {
  const { playQueue, selectedTrack, isPlaying, isLoading, togglePlay } = useMusicPlayer();
  return (
    <section className="text-white">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
        Local catalog
      </p>
      <h1 className="mt-2 text-3xl font-bold">Demo songs</h1>
      <p className="mt-2 text-neutral-400">
        Select a bundled song to play the local catalog queue.
      </p>

      <div className="mt-6 grid gap-3">
        {localPlayableCatalog.map((track, index) => (
          <article
            key={track.id}
            aria-current={selectedTrack?.id === track.id ? "true" : undefined}
            className="flex items-center gap-4 rounded-xl bg-neutral-900 p-4"
          >
            <span className="w-6 text-right text-sm text-neutral-500">
              {index + 1}
            </span>
            <img
              src={track.artworkUrl}
              alt=""
              className="h-12 w-12 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold">{track.title}</h2>
              <p className="truncate text-sm text-neutral-400">{track.artist}</p>
            </div>
            <button type="button"
              aria-label={`${selectedTrack?.id === track.id && (isPlaying || isLoading) ? "Pause" : "Play"} ${track.title}`}
              aria-pressed={selectedTrack?.id === track.id && isPlaying}
              onClick={() => selectedTrack?.id === track.id && (isPlaying || isLoading)
                ? togglePlay() : playQueue(localPlayableCatalog, index)}
              className="rounded-full bg-emerald-600 px-3 py-2 text-sm shrink-0">
              {selectedTrack?.id === track.id ? isLoading ? "Loading…" : isPlaying ? "Pause" : "Play · selected" : "Play"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
