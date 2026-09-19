import { useMusicPlayer } from "@/context/music-player-context";

export function PlaybackModes({ label }: { label: string }) {
  const { repeatMode, cycleRepeatMode, isShuffled, toggleShuffle } = useMusicPlayer();
  const buttonClass = "min-h-11 min-w-11 rounded border border-white/30 px-3 text-sm font-medium text-neutral-200 aria-pressed:border-emerald-400 aria-pressed:bg-emerald-950 aria-pressed:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400";
  return <div className="flex flex-wrap justify-center gap-2 py-1">
    <button type="button" className={buttonClass} onClick={cycleRepeatMode}
      aria-label={`${label} repeat: ${repeatMode}`} aria-pressed={repeatMode !== "off"}>
      Repeat: {repeatMode}
    </button>
    <button type="button" className={buttonClass} onClick={toggleShuffle}
      aria-label={`${label} shuffle: ${isShuffled ? "on" : "off"}`} aria-pressed={isShuffled}>
      Shuffle: {isShuffled ? "on" : "off"}
    </button>
  </div>;
}
