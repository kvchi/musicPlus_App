import { createContext, useContext } from "react";
import type { RefObject } from "react";
import type { PlayableTrack } from "@/types/playable-track";
import type { RepeatMode } from "@/lib/queue-traversal";

interface MusicContextType {
  repeatMode: RepeatMode;
  setRepeatMode: (mode: RepeatMode) => void;
  cycleRepeatMode: () => void;
  isShuffled: boolean;
  toggleShuffle: () => void;
  selectedTrack: PlayableTrack | null;
  queue: readonly PlayableTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  canSeek: boolean;
  volume: number;
  isMuted: boolean;
  controlsError: string | null;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  error: string | null;
  playTrack: (track: PlayableTrack) => void;
  playQueue: (tracks: readonly PlayableTrack[], startIndex: number) => void;
  retryPlayback: () => void;
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
