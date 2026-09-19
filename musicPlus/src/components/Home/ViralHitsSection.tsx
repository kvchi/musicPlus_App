import { localPlayableCatalog } from "@/lib/track-adapters";
import { useMusicPlayer } from "@/context/music-player-context";
import { CiPlay1 } from "react-icons/ci";

export function ViralHitsSection() {
  const { playQueue, selectedTrack, isPlaying, isLoading, togglePlay } = useMusicPlayer();
  return (
    <section>
      <h3 className="text-xl text-white font-semibold mb-4">From the demo playlist</h3>

      <div className="space-y-3">
        {localPlayableCatalog.map((track, index) => (
          <div
            key={track.id}
            className="flex min-w-0 justify-between items-center gap-3 bg-[#1a1a1a] p-4 rounded-xl text-white"
          >
            <div className="min-w-0">
              <p className="font-semibold truncate">{index + 1}. {track.title}</p>
              <p className="text-gray-400 text-sm truncate">{track.artist}</p>
            </div>

            <button type="button" aria-label={`${selectedTrack?.id === track.id && (isPlaying || isLoading) ? "Pause" : "Play"} ${track.title}`}
              aria-pressed={selectedTrack?.id === track.id && isPlaying}
              onClick={() => selectedTrack?.id === track.id && (isPlaying || isLoading) ? togglePlay() : playQueue(localPlayableCatalog, index)}
              className="shrink-0 p-3 bg-emerald-600 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"><CiPlay1 aria-hidden="true" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
