/** Application audio model; provider response types remain separate. */
export interface PlayableTrack {
  id: `${"local" | "jamendo"}:${string}`;
  source: "local" | "jamendo";
  title: string;
  artist: string;
  audioUrl: string;
  artworkUrl: string;
  albumTitle?: string;
  durationSeconds?: number;
  attributionUrl?: string;
  licenseUrl?: string;
  downloadAllowed?: boolean;
}
