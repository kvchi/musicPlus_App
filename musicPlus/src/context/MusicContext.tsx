import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MusicContext } from "./music-player-context";
import { hasPlayableAudio, localPlayableCatalog } from "@/lib/track-adapters";
import type { PlayableTrack } from "@/types/playable-track";
import { createTraversal, editTraversal, nextTraversal, previousTraversal, toggleTraversal, upcomingIndices } from "@/lib/queue-traversal";
import type { RepeatMode } from "@/lib/queue-traversal";

type Selection = { queue: readonly PlayableTrack[]; index: number };
const copyQueue = (tracks: readonly PlayableTrack[]) => Object.freeze(
  tracks.map((track) => Object.freeze({ ...track })),
);

function seekRanges(audio: HTMLAudioElement): [number, number][] {
  if (audio.error || audio.readyState < 1 || !Number.isFinite(audio.duration) || audio.duration <= 0) return [];
  try {
    const ranges = audio.seekable;
    const result: [number, number][] = [];
    for (let index = 0; index < ranges.length; index++) {
      const start = Math.max(0, ranges.start(index));
      const end = Math.min(audio.duration, ranges.end(index));
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) result.push([start, end]);
    }
    return result;
  } catch { return []; }
}

export const MusicContextProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement>(null!);
  const [selection, setSelection] = useState<Selection>(() => ({
    queue: copyQueue(localPlayableCatalog), index: localPlayableCatalog.length ? 0 : -1,
  }));
  const selectionRef = useRef(selection);
  const [repeatMode, updateRepeatMode] = useState<RepeatMode>("off");
  const repeatRef = useRef<RepeatMode>("off");
  const [isShuffled, setIsShuffled] = useState(false);
  const shuffleRef = useRef(false);
  const traversalRef = useRef(createTraversal(selection.queue.length, selection.index, false));
  const setRepeatMode = useCallback((mode: RepeatMode) => {
    if (!["off", "all", "one"].includes(mode)) return;
    repeatRef.current = mode;
    updateRepeatMode(mode);
  }, []);
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode(repeatRef.current === "off" ? "all" : repeatRef.current === "all" ? "one" : "off");
  }, [setRepeatMode]);
  const toggleShuffle = useCallback(() => {
    shuffleRef.current = !shuffleRef.current;
    traversalRef.current = toggleTraversal(traversalRef.current, selectionRef.current.index, shuffleRef.current);
    setIsShuffled(shuffleRef.current);
  }, []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [canSeek, setCanSeek] = useState(false);
  const [volume, updateVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [controlsError, setControlsError] = useState<string | null>(null);
  const lastNonzeroVolumeRef = useRef(1);
  const [error, setError] = useState<string | null>(null);
  const [queueNotice, setQueueNotice] = useState<string | null>(null);
  const intentRef = useRef(false);
  const operationRef = useRef(0);
  const sourceVersionRef = useRef(0);
  const endedVersionRef = useRef(-1);
  const activeRef = useRef(false);
  const invalidateOperation = useCallback(() => ++operationRef.current, []);

  const matchesSource = useCallback(() => {
    const { queue, index } = selectionRef.current;
    const track = queue[index];
    const audio = audioRef.current;
    return Boolean(track && audio.src === new URL(track.audioUrl, document.baseURI).href &&
      (!audio.currentSrc || audio.currentSrc === audio.src));
  }, []);

  // The rendered selection is a token: an old control callback cannot seek a
  // newly selected source, even before React has rendered that selection.
  const seek = useCallback((seconds: number) => {
    if (!activeRef.current || selection !== selectionRef.current || !matchesSource() || !Number.isFinite(seconds)) return;
    const audio = audioRef.current;
    const ranges = seekRanges(audio);
    if (!ranges.length) { setCanSeek(false); return; }
    const bounded = Math.max(0, Math.min(seconds, audio.duration));
    let target = ranges[0][0];
    for (const [start, end] of ranges) {
      const candidate = Math.max(start, Math.min(bounded, end));
      if (Math.abs(candidate - bounded) < Math.abs(target - bounded)) target = candidate;
    }
    try {
      audio.currentTime = target;
      if (target < audio.duration) endedVersionRef.current = -1;
      setControlsError(null);
      // No optimistic progress and no deferred seek to apply to another source.
    } catch {
      setCanSeek(false);
      setControlsError("Seeking is unavailable for this audio. Playback can continue.");
    }
  }, [matchesSource, selection]);

  const syncVolume = useCallback(() => {
    const audio = audioRef.current;
    updateVolume(audio.volume);
    setIsMuted(audio.muted || audio.volume === 0);
    if (!audio.muted && audio.volume > 0) lastNonzeroVolumeRef.current = audio.volume;
  }, []);
  const setVolume = useCallback((value: number) => {
    if (!activeRef.current || !Number.isFinite(value)) return;
    const audio = audioRef.current;
    const target = Math.max(0, Math.min(1, value));
    if (!audio.muted && audio.volume > 0) lastNonzeroVolumeRef.current = audio.volume;
    try {
      if (target > 0) audio.muted = false;
      audio.volume = target;
      setControlsError(Math.abs(audio.volume - target) > 0.001 || (target > 0 && audio.muted)
        ? "Your browser cannot adjust audio volume here. Use your device volume controls."
        : null);
    } catch {
      setControlsError("Your browser cannot adjust audio volume here. Use your device volume controls.");
    }
    syncVolume();
  }, [syncVolume]);
  const toggleMute = useCallback(() => {
    if (!activeRef.current) return;
    const audio = audioRef.current;
    try {
      if (audio.muted || audio.volume === 0) {
        const target = lastNonzeroVolumeRef.current;
        audio.muted = false;
        audio.volume = target;
        setControlsError(audio.muted || Math.abs(audio.volume - target) > 0.001
          ? "Your browser cannot restore audio volume here. Use your device volume controls." : null);
      } else {
        lastNonzeroVolumeRef.current = audio.volume;
        audio.muted = true;
        setControlsError(audio.muted ? null : "Your browser cannot mute audio here. Use your device volume controls.");
      }
    } catch {
      setControlsError("Your browser cannot change audio volume here. Use your device volume controls.");
    }
    syncVolume();
  }, [syncVolume]);

  const fail = useCallback((message: string) => {
    invalidateOperation();
    intentRef.current = false;
    setIsPlaying(false);
    setIsLoading(false);
    setError(message);
    setCanSeek(false);
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
    setCanSeek(false);
    setControlsError(null);
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
    if (!tracks.length) { traversalRef.current = createTraversal(0, -1, shuffleRef.current); select(copyQueue([]), -1, false); setQueueNotice(null); return; }
    if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= tracks.length) {
      setError("Choose a valid track to start playback.");
      return;
    }
    if (!tracks.every(hasPlayableAudio)) {
      setError("This selection contains audio that is unavailable.");
      return;
    }
    // Neither later search results nor caller mutations can replace this queue.
    traversalRef.current = createTraversal(tracks.length, startIndex, shuffleRef.current);
    select(copyQueue(tracks), startIndex, true);
    setQueueNotice("Playing this selection replaced Up Next.");
  }, [select]);
  const playTrack = useCallback((track: PlayableTrack) => playQueue([track], 0), [playQueue]);
  const queueTrack = useCallback((track: PlayableTrack, action: "next" | "end") => {
    if (!hasPlayableAudio(track)) {
      setQueueNotice("Audio unavailable. This track cannot be queued.");
      return;
    }
    const { queue, index } = selectionRef.current;
    if (!queue.length) {
      const first = copyQueue([track]);
      traversalRef.current = createTraversal(1, 0, shuffleRef.current);
      select(first, 0, false);
      setQueueNotice(`${track.title} is selected and ready to play.`);
      return;
    }
    if (queue[index]?.id === track.id) {
      setQueueNotice(`${track.title} is already the current track.`);
      return;
    }
    const existing = queue.findIndex(item => item.id === track.id);
    const upcoming = upcomingIndices(traversalRef.current);
    if (existing >= 0 && !upcoming.includes(existing)) {
      setQueueNotice(`${track.title} has already played in this queue. Select Play to start a new queue.`);
      return;
    }
    if (existing >= 0 && action === "end") {
      setQueueNotice(`${track.title} is already in Up Next.`);
      return;
    }
    const nextQueue = existing < 0 ? copyQueue([...queue, track]) : queue;
    const target = existing < 0 ? queue.length : existing;
    traversalRef.current = editTraversal(traversalRef.current, target, action, existing < 0);
    if (nextQueue !== queue) {
      const updated = { queue: nextQueue, index };
      selectionRef.current = updated;
      setSelection(updated);
    } else {
      // A promoted entry still needs a render to publish the new Up Next order.
      const updated = { queue, index };
      selectionRef.current = updated;
      setSelection(updated);
    }
    setQueueNotice(action === "next" ? `${track.title} will play next.` : `${track.title} was added to Up Next.`);
  }, [select]);
  const playNext = useCallback((track: PlayableTrack) => queueTrack(track, "next"), [queueTrack]);
  const addToQueue = useCallback((track: PlayableTrack) => queueTrack(track, "end"), [queueTrack]);
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
    const { queue } = selectionRef.current;
    const step = nextTraversal(traversalRef.current, false, repeatRef.current, shuffleRef.current);
    if (step) { traversalRef.current = step.traversal; select(queue, step.index, intentRef.current); }
  }, [select]);
  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    const { queue } = selectionRef.current;
    if (!queue.length) return;
    if (audio.currentTime > 2) {
      try {
        audio.currentTime = 0;
        endedVersionRef.current = -1;
      } catch {
        setControlsError("Seeking is unavailable for this audio. Playback can continue.");
      }
    } else {
      const step = previousTraversal(traversalRef.current, shuffleRef.current);
      if (step) { traversalRef.current = step.traversal; select(queue, step.index, intentRef.current); }
    }
  }, [select]);

  // One event owner survives all route changes; listeners are removed on cleanup.
  useEffect(() => {
    const audio = audioRef.current;
    activeRef.current = true;
    const updateTime = () => {
      if (matchesSource() && audio.readyState >= 1) setProgress(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    };
    const updateMetadata = () => {
      if (!matchesSource()) return;
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setCanSeek(seekRanges(audio).length > 0);
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
      if (!matchesSource() || audio.error || !audio.ended || !intentRef.current || endedVersionRef.current === sourceVersionRef.current) return;
      endedVersionRef.current = sourceVersionRef.current;
      const { queue, index } = selectionRef.current;
      const step = repeatRef.current === "one" ? null : nextTraversal(traversalRef.current, true, repeatRef.current, shuffleRef.current);
      if (repeatRef.current === "one") select(queue, index, true);
      else if (step) { traversalRef.current = step.traversal; select(queue, step.index, true); }
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
      if (matchesSource() && audio.readyState === 0) { setProgress(0); setDuration(0); setCanSeek(false); }
    };
    const listeners = {
      play: onPlay, playing: onPlaying, pause: onPause, ended: onEnded,
      waiting: onWaiting, error: onError, timeupdate: updateTime,
      loadedmetadata: updateMetadata, durationchange: updateMetadata, emptied: onEmptied,
      progress: updateMetadata, canplay: updateMetadata, seeking: updateTime,
      seeked: updateMetadata, volumechange: syncVolume,
    };
    for (const [name, listener] of Object.entries(listeners)) audio.addEventListener(name, listener);
    updateMetadata();
    syncVolume();
    return () => {
      activeRef.current = false;
      invalidateOperation();
      for (const [name, listener] of Object.entries(listeners)) audio.removeEventListener(name, listener);
      audio.pause();
    };
  }, [fail, invalidateOperation, matchesSource, select, syncVolume]);

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
    upNext: upcomingIndices(traversalRef.current).map(index => selection.queue[index]).filter((track): track is PlayableTrack => Boolean(track)),
    queueNotice, playNext, addToQueue,
    currentIndex: selection.index, isPlaying, isLoading, progress, duration, error,
    canSeek, volume, isMuted, controlsError, seek, setVolume, toggleMute,
    repeatMode, setRepeatMode, cycleRepeatMode, isShuffled, toggleShuffle,
    playTrack, playQueue, retryPlayback, togglePlay, handleNext, handlePrev, audioRef,
  }}><audio ref={audioRef} preload="metadata" /><span aria-live="polite" className="sr-only">{queueNotice}</span>{children}</MusicContext.Provider>;
};
