import { useId } from "react";
import { useMusicPlayer } from "@/context/music-player-context";

const rangeClass = "min-h-11 w-full min-w-0 cursor-pointer accent-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 rounded";

export function SeekControl({ label }: { label: string }) {
  const { seek, progress, duration, canSeek, selectedTrack } = useMusicPlayer();
  const id = useId();
  const usableDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  return <div className="min-w-0">
    <label htmlFor={id} className="text-xs text-neutral-300">Seek</label>
    <input key={selectedTrack?.id ?? "empty"} id={id} type="range" min={0}
      max={usableDuration || 1} step={1} value={Math.max(0, Math.min(progress, usableDuration))}
      disabled={!selectedTrack || !canSeek} aria-label={`${label} seek`}
      aria-valuetext={`${formatTime(progress)} of ${formatTime(usableDuration)}`}
      aria-describedby={!canSeek ? `${id}-help` : undefined}
      onChange={event => seek(Number(event.currentTarget.value))} className={rangeClass} />
    {!canSeek && <p id={`${id}-help`} className="text-xs text-neutral-400">Seeking is currently unavailable.</p>}
  </div>;
}

export function VolumeControls({ label }: { label: string }) {
  const { volume, isMuted, setVolume, toggleMute } = useMusicPlayer();
  const id = useId();
  const effectiveVolume = isMuted ? 0 : volume;
  return <div className="min-w-0">
    <label htmlFor={id} className="text-xs text-neutral-300">Volume {Math.round(effectiveVolume * 100)}%</label>
    <div className="flex items-center gap-2">
      <button type="button" aria-label={`${label} ${isMuted ? "unmute" : "mute"}`}
        aria-pressed={isMuted} onClick={toggleMute}
        className="min-h-11 min-w-11 shrink-0 rounded-lg px-2 text-xs text-white hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
        {isMuted ? "Unmute" : "Mute"}
      </button>
      <input id={id} type="range" min={0} max={1} step={0.05} value={effectiveVolume}
        aria-label={`${label} volume`} aria-valuetext={isMuted ? "Muted" : `${Math.round(volume * 100)} percent`}
        onChange={event => setVolume(Number(event.currentTarget.value))} className={rangeClass} />
    </div>
  </div>;
}

function formatTime(time: number) {
  const seconds = Number.isFinite(time) ? Math.max(0, Math.floor(time)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
