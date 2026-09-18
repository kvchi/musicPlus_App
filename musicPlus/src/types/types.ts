/** Fields consumed from Jamendo's tracks response. */
export interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  duration: number;
  image?: string;
  audio?: string;
  shareurl?: string;
  license_ccurl?: string;
  audiodownload_allowed?: boolean;
}

export type Track = JamendoTrack;
export interface JamendoResponse {
  headers: { status: string; code: number; error_message?: string };
  results: JamendoTrack[];
}
export interface LastFmImage { "#text": string; size?: string }
export interface LastFmArtist { name: string; listeners: string; image?: LastFmImage[] }
export interface LastFmTrack extends LastFmArtist { artist: { name: string } }
export interface LastFmTag { name: string; reach: string | number; taggings: string | number }
export interface LastFmAlbum { name: string; artist?: { name: string }; image?: LastFmImage[] }
