import { useMusicPlayer } from "@/context/music-player-context";
import { headphones } from "@/assets/images";
import { PlaybackFeedback, TrackAttribution } from "./PlaybackFeedback";
import { useEffect, useState } from "react";
import { CiPause1, CiPlay1 } from "react-icons/ci";
import { IoPlayBackOutline, IoPlayForwardOutline } from "react-icons/io5";

export function NowPlaying() {
  const { selectedTrack: track, isPlaying, isLoading, togglePlay, handleNext, handlePrev, progress: currentTime, duration } =
    useMusicPlayer();
  const [bgGradient, setBgGradient] = useState(
    "linear-gradient(135deg, #1a1a1a, #2c2c2c)"
  );


  useEffect(() => {
    if (!isPlaying) return;

    let angle = 0;
    const interval = setInterval(() => {
      angle += 1;
      const color1 = `hsl(${angle % 360}, 70%, 30%)`;
      const color2 = `hsl(${(angle + 60) % 360}, 70%, 30%)`;
      setBgGradient(`linear-gradient(${angle}deg, ${color1}, ${color2})`);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  


  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  if (!track) return <div className="p-6 rounded-2xl text-white bg-neutral-900">
    <h3 className="text-xl font-semibold mb-4">Now Playing</h3>
    <p>Choose a track from Songs or search.</p><PlaybackFeedback />
  </div>;

  return (
    <div className="p-6 rounded-2xl text-white" style={{ background: bgGradient } as React.CSSProperties}>
      <h3 className="text-xl font-semibold mb-4">Now Playing</h3>

      <img
        src={track.artworkUrl || headphones}
        alt={track.title}
        className="rounded-xl mb-4"
      />

      <h4 className="font-semibold">{track.title}</h4>
      <p className="text-gray-400 text-sm mb-4">{track.artist}</p>
      <TrackAttribution track={track} />

      <div className="h-2 bg-gray-600 rounded-full mb-1">
        <div
          className="bg-emerald-500 h-full rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs opacity-80 mb-6">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex justify-center gap-6">
        <button type="button" onClick={handlePrev} title="back" aria-label="Previous track" className="cursor-pointer">
          <IoPlayBackOutline />
        </button>
        <button
          onClick={togglePlay}
          type="button"
          aria-label={isLoading ? "Cancel loading" : isPlaying ? "Pause playback" : "Play playback"}
          title="play/pause"
          className="bg-emerald-600 p-3 rounded-full cursor-pointer hover:bg-white hover:text-emerald-500"
        >
          {isPlaying || isLoading ? <CiPause1 /> : <CiPlay1 />}
        </button>
        <button type="button" onClick={handleNext} title="forward" aria-label="Next track" className="cursor-pointer">
          <IoPlayForwardOutline />
        </button>
      </div>
      <PlaybackFeedback />
    </div>
  );
}

function formatTime(time: number) {
  if (!time) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
