import { useMusicPlayer } from "@/context/music-player-context";
import { headphones } from "@/assets/images";
import { PlaybackFeedback, TrackAttribution } from "./PlaybackFeedback";
import { CiPause1, CiPlay1 } from "react-icons/ci";
import { IoPlayBackOutline, IoPlayForwardOutline } from "react-icons/io5";

export function NowPlayingMini() {
  const { selectedTrack: track, isPlaying, isLoading, togglePlay, handleNext, handlePrev } =
    useMusicPlayer();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/10 ">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">

        <div className="flex items-center gap-3 min-w-0">
          {track && <img
            src={track.artworkUrl || headphones}
            alt={track.title}
            className="w-12 h-12 rounded-md object-cover"
          />}
          <div className="truncate">
            <p className="text-sm text-white font-semibold truncate">{track?.title ?? "Choose a track"}</p>
            <p className="text-xs text-gray-400 truncate">{track?.artist ?? "Songs or search"}</p>
            {track && <TrackAttribution track={track} />}
          </div>
        </div>

        <div className="flex items-center gap-5 text-xl">
          <button type="button" disabled={!track} aria-label="Previous track" className="text-white cursor-pointer hover:text-emerald-500 disabled:opacity-50" title="back" onClick={handlePrev}>
            <IoPlayBackOutline />
          </button>

          <button
            type="button"
            disabled={!track}
            aria-label={isLoading ? "Cancel loading" : isPlaying ? "Pause playback" : "Play playback"}
            onClick={togglePlay}
            className="bg-emerald-500 cursor-pointer text-white rounded-full p-2 hover:bg-white hover:text-emerald-500"
          >
            {isPlaying || isLoading ? <CiPause1 /> : <CiPlay1 />}
          </button>

          <button type="button" disabled={!track} aria-label="Next track" className="text-white cursor-pointer hover:text-emerald-500 disabled:opacity-50" title="forward" onClick={handleNext}>
            <IoPlayForwardOutline />
          </button>
        </div>

      </div>
      <div className="max-w-7xl mx-auto px-4 pb-2"><PlaybackFeedback /></div>
    </div>
  );
}
