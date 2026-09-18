import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { playlist } from "@/data/MusicData";
import { MusicContext } from "./music-player-context";

export const MusicContextProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement>(null!);
  // A revision also records rapid selections that return to the same index.
  const [track, setTrack] = useState({ index: 0, revision: 0 });
  const currentIndex = track.index;
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const operationRef = useRef(0);
  const activeRef = useRef(false);

  const invalidateOperation = useCallback(() => ++operationRef.current, []);

  const setPlaybackIntent = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
    setIsPlaying(playing);
  }, []);

  const requestPlay = useCallback(() => {
    const audio = audioRef.current;
    const operation = invalidateOperation();
    setPlaybackIntent(true);

    // Catch synchronous failures too. Only this operation may clear its intent.
    void (async () => {
      try {
        await audio.play();
      } catch {
        if (!activeRef.current || operation !== operationRef.current) return;
        setPlaybackIntent(false);
        audio.pause();
      }
    })();
  }, [invalidateOperation, setPlaybackIntent]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (isPlayingRef.current || !audio.paused) {
      invalidateOperation();
      setPlaybackIntent(false);
      audio.pause();
    } else {
      requestPlay();
    }
  }, [invalidateOperation, requestPlay, setPlaybackIntent]);

  const handleNext = useCallback(() => {
    invalidateOperation();
    setTrack((previous) => ({
      index: (previous.index + 1) % playlist.length,
      revision: previous.revision + 1,
    }));
  }, [invalidateOperation]);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;

    if (audio.currentTime > 2) {
      audio.currentTime = 0;
    } else {
      invalidateOperation();
      setTrack((previous) => ({
        index: (previous.index + playlist.length - 1) % playlist.length,
        revision: previous.revision + 1,
      }));
    }
  }, [invalidateOperation]);

  // The provider owns media events; route-level players only display/control it.
  useEffect(() => {
    const audio = audioRef.current;
    activeRef.current = true;

    const onPlay = () => {
      // Queued events from an older operation must reflect the current element.
      if (!audio.paused) setPlaybackIntent(true);
    };
    const onPause = () => {
      // Natural completion can emit pause before ended; retain autoplay intent.
      if (!audio.paused || audio.ended) return;
      invalidateOperation();
      setPlaybackIntent(false);
    };
    const onEnded = () => {
      if (isPlayingRef.current) handleNext();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      activeRef.current = false;
      invalidateOperation();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, [handleNext, invalidateOperation, setPlaybackIntent]);

  useEffect(() => {
    const audio = audioRef.current;
    invalidateOperation();
    audio.src = playlist[track.index].src;
    if (isPlayingRef.current) requestPlay();
  }, [track, invalidateOperation, requestPlay]);

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
