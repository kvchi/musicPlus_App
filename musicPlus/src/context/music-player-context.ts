import { createContext, useContext } from "react";
import type { RefObject } from "react";

interface MusicContextType {
  currentIndex: number;
  isPlaying: boolean;
  togglePlay: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  audioRef: RefObject<HTMLAudioElement>;
}

export const MusicContext = createContext<MusicContextType | undefined>(
  undefined
);

export const useMusicPlayer = () => {
  const context = useContext(MusicContext);

  if (!context) {
    throw new Error(
      "useMusicPlayer must be used within a MusicContextProvider"
    );
  }

  return context;
};
