import { useMusicPlayer } from "@/context/MusicContext";
import { playlist } from "@/data/MusicData";
import { CiPause1, CiPlay1 } from "react-icons/ci";
import { IoPlayBackOutline, IoPlayForwardOutline } from "react-icons/io5";

export function NowPlayingMini() {
  const { currentIndex, isPlaying, togglePlay, handleNext, handlePrev } =
    useMusicPlayer();

  const track = playlist[currentIndex];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/10 ml-80">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">

        <div className="flex items-center gap-3 min-w-0">
          <img
            src={track.cover}
            alt={track.title}
            className="w-12 h-12 rounded-md object-cover"
          />
          <div className="truncate">
            <p className="text-sm text-white font-semibold truncate">{track.title}</p>
            <p className="text-xs text-gray-400 truncate">{track.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xl">
          <button className="text-white cursor-pointer hover:text-emerald-500" title="back" onClick={handlePrev}>
            <IoPlayBackOutline />
          </button>

          <button
            onClick={togglePlay}
            className="bg-emerald-500 cursor-pointer text-white rounded-full p-2 hover:bg-white hover:text-emerald-500"
          >
            {isPlaying ? <CiPause1 /> : <CiPlay1 />}
          </button>

          <button className="text-white cursor-pointer hover:text-emerald-500" title="forward" onClick={handleNext}>
            <IoPlayForwardOutline />
          </button>
        </div>

      </div>
    </div>
  );
}
