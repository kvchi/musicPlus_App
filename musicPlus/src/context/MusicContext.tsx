import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { playlist } from "@/data/MusicData";

interface MusicContextType {
  currentIndex: number;
  isPlaying: boolean;
  togglePlay: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

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

export const useMusicPlayer = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error(
      "useMusicPlayer must be used within a MusicContextProvider"
    );
  }
  return context;
};
