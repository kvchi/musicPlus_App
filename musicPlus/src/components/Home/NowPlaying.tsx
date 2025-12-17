import { useMusicPlayer } from "@/context/MusicContext";
import { playlist } from "@/data/MusicData";
import { useEffect, useState } from "react";
import { CiPause1, CiPlay1 } from "react-icons/ci";
import { IoPlayBackOutline, IoPlayForwardOutline } from "react-icons/io5";

export function NowPlaying() {
  const { currentIndex, isPlaying, togglePlay, handleNext, handlePrev, audioRef } =
    useMusicPlayer();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bgGradient, setBgGradient] = useState(
    "linear-gradient(135deg, #1a1a1a, #2c2c2c)"
  );


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const setAudioDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      handleNext();
      setTimeout(() => audio.play(), 0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, handleNext, audioRef]);

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

  


  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="p-6 rounded-2xl text-white" style={{ background: bgGradient }}>
      <h3 className="text-xl font-semibold mb-4">Now Playing</h3>

      <img
        src={playlist[currentIndex].cover}
        alt={playlist[currentIndex].title}
        className="rounded-xl mb-4"
      />

      <h4 className="font-semibold">{playlist[currentIndex].title}</h4>
      <p className="text-gray-400 text-sm mb-4">{playlist[currentIndex].artist}</p>

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
        <button onClick={handlePrev} title="back" className="cursor-pointer">
          <IoPlayBackOutline />
        </button>
        <button
          onClick={togglePlay}
          title="play/pause"
          className="bg-emerald-600 p-3 rounded-full cursor-pointer hover:bg-white hover:text-emerald-500"
        >
          {isPlaying ? <CiPause1 /> : <CiPlay1 />}
        </button>
        <button onClick={handleNext} title="forward" className="cursor-pointer">
          <IoPlayForwardOutline />
        </button>
      </div>
    </div>
  );
}

function formatTime(time: number) {
  if (!time) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
