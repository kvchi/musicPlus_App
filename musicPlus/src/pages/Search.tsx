import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSearch } from "@/context/SearchContext";
import { useMusicPlayer } from "@/context/music-player-context";
import { adaptJamendoTrack } from "@/lib/track-adapters";
import { TrackAttribution } from "@/components/Home/PlaybackFeedback";

export default function Search() {
  const { playQueue, selectedTrack, isPlaying, isLoading: playbackLoading, togglePlay } = useMusicPlayer();
  const { results, query, isLoading, error, searchTracks, cancelSearch } = useSearch();
  const [retry, setRetry] = useState(0);
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim() ?? "";

  useEffect(() => {
    void searchTracks(urlQuery);
    return cancelSearch;
  }, [cancelSearch, retry, searchTracks, urlQuery]);
  const matchesQuery = query === urlQuery;
  const visibleResults = matchesQuery && urlQuery && !isLoading && !error ? results : [];
  const loading = Boolean(urlQuery) && (!matchesQuery || isLoading);
  const playableResults = visibleResults.map(adaptJamendoTrack).filter(track => track !== null);

  return (
    <section className="text-white">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Search
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {urlQuery ? `Results for “${urlQuery}”` : "Find your next favorite track"}
        </h1>
      </div>

      {loading && (
        <p className="rounded-xl bg-neutral-900 p-5 text-neutral-300" role="status">
          Searching the catalog...
        </p>
      )}

      {matchesQuery && urlQuery && error && (
        <div className="rounded-xl border border-red-900 bg-red-950/50 p-5 text-red-200" role="alert">
          <p>{error}</p>
          <button type="button" className="mt-3 rounded-full bg-emerald-600 px-4 py-2 text-white" onClick={() => setRetry((value) => value + 1)}>Retry search</button>
        </div>
      )}

      {!loading && matchesQuery && !error && urlQuery && results.length === 0 && (
        <p className="rounded-xl bg-neutral-900 p-5 text-neutral-300">
          No tracks matched your search. Try an artist, song, or genre.
        </p>
      )}

      {!urlQuery && (
        <p className="rounded-xl bg-neutral-900 p-5 text-neutral-300">
          Use the search box above to explore the Jamendo catalog.
        </p>
      )}

      <div className="grid gap-3">
        {visibleResults.map((track) => {
          const playable = adaptJamendoTrack(track);
          const active = playable?.id === selectedTrack?.id;
          return (
          <article
            key={track.id}
            aria-current={active ? "true" : undefined}
            className="flex items-center gap-4 rounded-xl bg-neutral-900 p-4"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
              {track.image && (
                <img
                  src={track.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold">{track.name}</h2>
              <p className="truncate text-sm text-neutral-400">
                {track.artist_name}
                {track.album_name ? ` · ${track.album_name}` : ""}
              </p>
              {playable && <TrackAttribution track={playable} />}
              {!playable && <p className="text-xs text-neutral-400">Audio unavailable</p>}
            </div>
            <span className="text-sm tabular-nums text-neutral-400">
              {formatDuration(track.duration)}
            </span>
            <button type="button" disabled={!playable}
              aria-label={`${active && (isPlaying || playbackLoading) ? "Pause" : "Play"} ${track.name}`}
              aria-pressed={active && isPlaying}
              onClick={() => {
                if (!playable) return;
                if (active && (isPlaying || playbackLoading)) togglePlay();
                else playQueue(playableResults, playableResults.findIndex(item => item.id === playable.id));
              }}
              className="rounded-full bg-emerald-600 px-3 py-2 text-sm shrink-0 disabled:bg-neutral-700 disabled:opacity-60">
              {!playable ? "Unavailable" : active && playbackLoading ? "Loading…" : active && isPlaying ? "Pause" : "Play"}
            </button>
          </article>
        ); })}
      </div>
    </section>
  );
}

function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
