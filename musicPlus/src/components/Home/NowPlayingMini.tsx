import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CiPause1, CiPlay1 } from "react-icons/ci";
import { IoPlayBackOutline, IoPlayForwardOutline } from "react-icons/io5";
import { useMusicPlayer } from "@/context/music-player-context";
import { headphones } from "@/assets/images";
import { PlaybackFeedback, TrackAttribution } from "./PlaybackFeedback";
import { SeekControl, VolumeControls } from "./MediaControls";
import { PlaybackModes } from "./PlaybackModes";

const iconButton = "flex min-h-11 min-w-11 items-center justify-center rounded text-white hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:opacity-50";

export function NowPlayingMini({ onHeightChange }: { onHeightChange?: (height: number) => void }) {
  const { selectedTrack: track, upNext, isPlaying, isLoading, togglePlay, handleNext, handlePrev } = useMusicPlayer();
  const [moreOpen, setMoreOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreId = useId();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || !onHeightChange) return;
    const update = () => onHeightChange(bar.getBoundingClientRect().height);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [onHeightChange]);

  const previous = <button type="button" disabled={!track} aria-label="Previous track"
    className={iconButton} onClick={handlePrev}><IoPlayBackOutline aria-hidden="true" /></button>;
  const next = <button type="button" disabled={!track} aria-label="Next track"
    className={iconButton} onClick={handleNext}><IoPlayForwardOutline aria-hidden="true" /></button>;
  const play = <button type="button" disabled={!track}
    aria-label={isLoading ? "Cancel loading" : isPlaying ? "Pause playback" : "Play playback"}
    onClick={togglePlay}
    className={`${iconButton} rounded-full bg-emerald-500 hover:bg-white hover:text-emerald-600`}>
    {isPlaying || isLoading ? <CiPause1 aria-hidden="true" /> : <CiPlay1 aria-hidden="true" />}
  </button>;

  return <div ref={barRef} role="region" aria-label="Mini player"
    className="fixed inset-x-0 bottom-0 z-50 max-h-[70dvh] overflow-y-auto border-t border-white/20 bg-black/95 pb-[env(safe-area-inset-bottom)] text-white backdrop-blur-md">
    <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-1 px-3 pt-1 sm:px-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1.2fr)_minmax(320px,1.2fr)] lg:gap-x-4">
      <div className="row-start-1 flex min-w-0 items-center gap-2 lg:row-span-2 lg:gap-3">
        {track && <img src={track.artworkUrl || headphones} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover lg:h-12 lg:w-12" />}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{track?.title ?? "Choose a track"}</p>
          <p className="truncate text-xs text-neutral-300">{track?.artist ?? "Songs or search"}</p>
          {track && <TrackAttribution track={track} />}
        </div>
      </div>

      <div className="col-start-2 row-start-1 flex items-center justify-center gap-1 lg:h-11 lg:gap-2">
        <span className="hidden lg:inline-flex">{previous}</span>
        {play}
        <span className="hidden lg:inline-flex">{next}</span>
      </div>
      <button ref={moreButtonRef} type="button" aria-label="More controls" aria-expanded={moreOpen}
          aria-controls={moreId} onClick={() => setMoreOpen(open => !open)}
          className={`${iconButton} col-start-3 row-start-1 text-xs font-semibold text-emerald-300 lg:hidden`}>
          More
      </button>
      <div className="col-span-3 row-start-2 min-w-0 lg:col-span-1 lg:col-start-2"><SeekControl label="Mini player" compact /></div>

      <div className="col-start-3 row-span-2 row-start-1 hidden min-w-0 lg:block">
        <div className="flex items-center justify-end gap-2">
          <PlaybackModes label="Mini player" compact />
          <Link to="/queue" className="inline-flex min-h-11 items-center rounded px-2 text-xs font-semibold text-emerald-300 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Up Next ({upNext.length})</Link>
        </div>
        <div className="ml-auto max-w-52"><VolumeControls label="Mini player" compact /></div>
      </div>

    </div>

    {moreOpen && <div id={moreId} className="mx-auto max-w-7xl space-y-2 border-t border-white/20 px-3 pb-2 sm:px-4 lg:hidden"
      onKeyDown={event => { if (event.key === "Escape") { setMoreOpen(false); moreButtonRef.current?.focus(); } }}>
      <div className="flex items-center justify-center gap-2">{previous}{next}
        <Link to="/queue" className="inline-flex min-h-11 items-center rounded px-3 text-sm font-semibold text-emerald-300 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Up Next ({upNext.length})</Link>
      </div>
      <VolumeControls label="Mini player" />
      <PlaybackModes label="Mini player" />
    </div>}
    <div className="mx-auto max-w-7xl px-3 sm:px-4"><PlaybackFeedback /></div>
  </div>;
}
