import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MusicContext } from "./music-player-context";
import { hasPlayableAudio, localPlayableCatalog } from "@/lib/track-adapters";
import type { PlayableTrack } from "@/types/playable-track";

type Selection = { queue: readonly PlayableTrack[]; index: number };
const copyQueue = (tracks: readonly PlayableTrack[]) => Object.freeze(
  tracks.map((track) => Object.freeze({ ...track })),
);

export const MusicContextProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement>(null!);
  const [selection, setSelection] = useState<Selection>(() => ({
    queue: copyQueue(localPlayableCatalog), index: localPlayableCatalog.length ? 0 : -1,
  }));
  const selectionRef = useRef(selection);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intentRef = useRef(false);
  const operationRef = useRef(0);
  const sourceVersionRef = useRef(0);
  const endedVersionRef = useRef(-1);
  const activeRef = useRef(false);
  const invalidateOperation = useCallback(() => ++operationRef.current, []);

  const fail = useCallback((message: string) => {
    invalidateOperation();
    intentRef.current = false;
    setIsPlaying(false);
    setIsLoading(false);
    setError(message);
    audioRef.current.pause();
  }, [invalidateOperation]);

  const requestPlay = useCallback(() => {
    const audio = audioRef.current;
    const operation = invalidateOperation();
    if (audio.ended) endedVersionRef.current = -1;
    intentRef.current = true;
    setIsLoading(true);
    setError(null);
    // Successful promises do not assert playback: media events own actual state.
    void (async () => {
      try {
        await audio.play();
      } catch (reason: unknown) {
        if (!activeRef.current || operation !== operationRef.current) return;
        fail(reason instanceof DOMException && reason.name === "NotAllowedError"
          ? "Playback was blocked by your browser. Try playing again."
          : "Unable to play this audio. Retry or choose another track.");
      }
    })();
  }, [fail, invalidateOperation]);

  const select = useCallback((queue: readonly PlayableTrack[], index: number, shouldPlay: boolean) => {
    const audio = audioRef.current;
    invalidateOperation();
    intentRef.current = false;
    audio.pause();
    ++sourceVersionRef.current;
    const next = { queue, index };
    selectionRef.current = next;
    setSelection(next);
    setIsPlaying(false);
    setIsLoading(false);
    setProgress(0);
    setDuration(0);
    setError(null);
    const track = queue[index];
    if (!track) {
      audio.removeAttribute("src");
      audio.load();
      return;
    }
    audio.src = track.audioUrl;
    audio.load();
    if (shouldPlay) requestPlay();
  }, [invalidateOperation, requestPlay]);

  const playQueue = useCallback((tracks: readonly PlayableTrack[], startIndex: number) => {
    if (!tracks.length) { select(copyQueue([]), -1, false); return; }
    if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= tracks.length) {
      setError("Choose a valid track to start playback.");
      return;
    }
    if (!tracks.every(hasPlayableAudio)) {
      setError("This selection contains audio that is unavailable.");
      return;
    }
    // Neither later search results nor caller mutations can replace this queue.
    select(copyQueue(tracks), startIndex, true);
  }, [select]);
  const playTrack = useCallback((track: PlayableTrack) => playQueue([track], 0), [playQueue]);
  const retryPlayback = useCallback(() => {
    const { queue, index } = selectionRef.current;
    if (queue[index]) select(queue, index, true);
  }, [select]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!selectionRef.current.queue[selectionRef.current.index]) return;
    if (intentRef.current || !audio.paused) {
      invalidateOperation();
      intentRef.current = false;
      setIsPlaying(false);
      setIsLoading(false);
      setProgress(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
      audio.pause();
    } else if (audio.error) {
      retryPlayback();
    } else {
      requestPlay();
    }
  }, [invalidateOperation, requestPlay, retryPlayback]);

  const handleNext = useCallback(() => {
    const { queue, index } = selectionRef.current;
    if (queue.length) select(queue, (index + 1) % queue.length, intentRef.current);
  }, [select]);
  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    const { queue, index } = selectionRef.current;
    if (!queue.length) return;
    if (audio.currentTime > 2) {
      audio.currentTime = 0;
      setProgress(0);
    } else {
      select(queue, (index + queue.length - 1) % queue.length, intentRef.current);
    }
  }, [select]);

  // One event owner survives all route changes; listeners are removed on cleanup.
  useEffect(() => {
    const audio = audioRef.current;
    activeRef.current = true;
    const matchesSource = () => {
      const { queue, index } = selectionRef.current;
      const track = queue[index];
      return Boolean(track && audio.src === new URL(track.audioUrl, document.baseURI).href &&
        (!audio.currentSrc || audio.currentSrc === audio.src));
    };
    const updateTime = () => {
      if (matchesSource()) setProgress(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    };
    const updateMetadata = () => {
      if (!matchesSource()) return;
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      updateTime();
    };
    const onPlay = () => {
      if (matchesSource() && !audio.paused) {
        intentRef.current = true;
        setIsLoading(true);
      }
    };
    const onPlaying = () => {
      if (!matchesSource() || audio.paused || !intentRef.current || audio.readyState < 2) return;
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };
    const onPause = () => {
      if (!matchesSource() || !audio.paused || audio.ended) return;
      invalidateOperation();
      intentRef.current = false;
      setIsPlaying(false);
      setIsLoading(false);
      updateTime();
    };
    const onWaiting = () => {
      if (matchesSource() && intentRef.current) { setIsLoading(true); setIsPlaying(false); }
    };
    const onEnded = () => {
      if (!matchesSource() || !audio.ended || !intentRef.current || endedVersionRef.current === sourceVersionRef.current) return;
      endedVersionRef.current = sourceVersionRef.current;
      const { queue, index } = selectionRef.current;
      if (index + 1 < queue.length) select(queue, index + 1, true);
      else {
        invalidateOperation();
        intentRef.current = false;
        setIsPlaying(false);
        setIsLoading(false);
        updateTime();
      }
    };
    const onError = () => {
      if (!matchesSource() || !audio.error) return;
      fail(audio.error.code === 2
        ? "Unable to load audio. Check your connection and retry."
        : "This audio could not be played. Retry or choose another track.");
    };
    const onEmptied = () => {
      if (matchesSource() && audio.readyState === 0) { setProgress(0); setDuration(0); }
    };
    const listeners = {
      play: onPlay, playing: onPlaying, pause: onPause, ended: onEnded,
      waiting: onWaiting, error: onError, timeupdate: updateTime,
      loadedmetadata: updateMetadata, durationchange: updateMetadata, emptied: onEmptied,
    };
    for (const [name, listener] of Object.entries(listeners)) audio.addEventListener(name, listener);
    updateMetadata();
    return () => {
      activeRef.current = false;
      invalidateOperation();
      for (const [name, listener] of Object.entries(listeners)) audio.removeEventListener(name, listener);
      audio.pause();
    };
  }, [fail, invalidateOperation, select]);

  // Initial local selection is paused. All later source changes occur in controls,
  // allowing play() to run synchronously within the explicit user interaction.
  useEffect(() => {
    const audio = audioRef.current;
    const { queue, index } = selectionRef.current;
    if (queue[index]) audio.src = queue[index].audioUrl;
    const sync = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setProgress(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    };
    sync();
  }, []);

  return <MusicContext.Provider value={{
    selectedTrack: selection.queue[selection.index] ?? null, queue: selection.queue,
    currentIndex: selection.index, isPlaying, isLoading, progress, duration, error,
    playTrack, playQueue, retryPlayback, togglePlay, handleNext, handlePrev, audioRef,
  }}><audio ref={audioRef} preload="metadata" />{children}</MusicContext.Provider>;
};
