import { MusicContext } from "./music-player-context";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { playlist } from "@/data/MusicData";



export const MusicContextProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement>(null!);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);


  const togglePlay = () => {
    const audio = audioRef.current;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === playlist.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrev = () => {
    const audio = audioRef.current;

    if (audio.currentTime > 2) {
      audio.currentTime = 0;
    } else {
      setCurrentIndex((prev) =>
        prev === 0 ? playlist.length - 1 : prev - 1
      );
    }
  };

 

  useEffect(() => {
    const audio = audioRef.current;
    audio.src = playlist[currentIndex].src;

    if (isPlaying) {
      audio.play();
    }
  }, [currentIndex]);



  useEffect(() => {
    const audio = audioRef.current;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
        setIsPlaying(true)
        handleNext();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <MusicContext.Provider
      value={{
        currentIndex,
        isPlaying,
        togglePlay,
        handleNext,
        handlePrev,
        audioRef,
      }}
    >
      
      <audio ref={audioRef} />
      {children}
    </MusicContext.Provider>
  );
};
