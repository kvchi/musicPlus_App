import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForYouSection } from "@/components/Home/ForYouSection";
import Album from "@/pages/Album";
import { MusicContextProvider } from "@/context/MusicContext";
import { useMusicPlayer } from "@/context/music-player-context";
import { localPlayableCatalog } from "@/lib/track-adapters";
import { fetchArtistTopAlbums } from "@/api/lastFM";

vi.mock("@/api/lastFM", () => ({ fetchArtistTopAlbums: vi.fn() }));

function PlayerState() {
  const { selectedTrack, queue } = useMusicPlayer();
  return <output data-testid="selection">{selectedTrack?.title}|{queue.map(track => track.id).join(",")}</output>;
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.mocked(fetchArtistTopAlbums).mockReset();
});

describe("Home mixes and album previews", () => {
  it("plays each demo mix with the correct local audio and ordered shared queue", () => {
    const view = render(<MusicContextProvider><ForYouSection /><PlayerState /></MusicContextProvider>);
    const audio = view.container.querySelector("audio")!;
    expect(view.container.querySelectorAll("audio")).toHaveLength(1);
    const cases = [
      ["Wizkid demo mix", ["local:2", "local:3"]],
      ["Full demo mix", localPlayableCatalog.map(track => track.id)],
      ["More demo tracks", ["local:1", "local:4", "local:6"]],
    ] as const;
    for (const [name, ids] of cases) {
      const control = screen.getByRole("button", { name: `Play ${name}` });
      expect(control.className).toContain("focus-visible:outline");
      fireEvent.click(control);
      const first = localPlayableCatalog.find(track => track.id === ids[0])!;
      expect(audio.src).toBe(new URL(first.audioUrl, document.baseURI).href);
      expect(screen.getByTestId("selection").textContent).toBe(`${first.title}|${ids.join(",")}`);
    }
  });

  it("presents the featured album and Last.fm records without playback controls", async () => {
    vi.mocked(fetchArtistTopAlbums).mockResolvedValue([{ name: "Metadata album", artist: { name: "Artist" }, image: undefined }]);
    render(<Album />);
    expect(screen.getByRole("heading", { name: "Album previews" })).toBeTruthy();
    expect(screen.getByText(/No playable audio has been verified/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /play all|shuffle|more|play/i })).toBeNull();
    expect(await screen.findByText("Metadata album")).toBeTruthy();
    expect(screen.getByText(/Last.fm album metadata previews/)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
