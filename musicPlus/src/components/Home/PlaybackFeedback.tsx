import { useMusicPlayer } from "@/context/music-player-context";
import type { PlayableTrack } from "@/types/playable-track";

export function PlaybackFeedback() {
  const { isLoading, error, controlsError, selectedTrack, retryPlayback } = useMusicPlayer();
  return <>
    {controlsError && <p role="status" className="mt-2 text-sm text-neutral-300">{controlsError}</p>}
    {isLoading && <p role="status" className="mt-2 text-sm text-neutral-300">Loading audio…</p>}
    {error && <div role="alert" className="mt-2 text-sm text-red-300">
      <p>{error}</p>
      {selectedTrack && <button type="button" onClick={retryPlayback} className="mt-1 underline">Retry playback</button>}
    </div>}
  </>;
}

export function TrackAttribution({ track }: { track: PlayableTrack }) {
  if (track.source !== "jamendo") return null;
  return <p className="mt-1 text-xs text-neutral-400">
    {track.attributionUrl
      ? <a href={track.attributionUrl} target="_blank" rel="noopener noreferrer" className="underline">Audio via Jamendo</a>
      : "Audio via Jamendo"}
    {track.licenseUrl && <> · <a href={track.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline" aria-label={`View license for ${track.title}`}>License</a></>}
  </p>;
}
