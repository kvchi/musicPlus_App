import { createContext, useContext } from "react";
import type { PlayableTrack } from "@/types/playable-track";

export interface SavedTrack {
  id: string;
  source: "local" | "jamendo";
  title: string;
  artist: string;
  attributionUrl?: string;
  licenseUrl?: string;
}
export interface SavedPlaylist { id: string; name: string; tracks: SavedTrack[] }
export interface SavedPlaylistsState {
  authReady: boolean;
  signedIn: boolean;
  loading: boolean;
  busy: boolean;
  error: string | null;
  notice: string | null;
  playlists: SavedPlaylist[];
  reload: () => Promise<void>;
  create: (name: string) => Promise<boolean>;
  addTrack: (playlistId: string, track: PlayableTrack) => Promise<boolean>;
  removeTrack: (playlistId: string, trackId: string) => Promise<boolean>;
}
export const SavedPlaylistsContext = createContext<SavedPlaylistsState | null>(null);
export const useSavedPlaylists = () => useContext(SavedPlaylistsContext);
