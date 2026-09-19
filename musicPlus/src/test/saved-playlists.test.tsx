import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SavedPlaylistsProvider } from "@/context/SavedPlaylistsProvider";
import Library from "@/pages/Library";
import { SaveTrackControl } from "@/components/SaveTrackControl";
import { MusicContextProvider } from "@/context/MusicContext";
import { localPlayableCatalog } from "@/lib/track-adapters";
import { useMusicPlayer } from "@/context/music-player-context";
import { fetchJamendoTrackById } from "@/api/jamendo";

vi.mock("@/api/jamendo", () => ({ fetchJamendoTrackById: vi.fn() }));
const jamendoApi = vi.mocked(fetchJamendoTrackById);

const auth = vi.hoisted(() => ({ signedIn: true, getToken: vi.fn(async (): Promise<string | null> => "verified-session") }));
vi.mock("@clerk/clerk-react", () => ({ useAuth: () => ({ isLoaded: true, isSignedIn: auth.signedIn,
  userId: auth.signedIn ? "user_a" : null, getToken: auth.getToken }) }));
const playlist = { id: "000000000000000000000001", name: "Favorites", tracks: [] as Array<{ id: string; source: string; title: string; artist: string }> };
function response(body: unknown, status = 200) { return { ok: status >= 200 && status < 300, status,
  json: async () => body } as Response; }
function PlayerReadout() { const { selectedTrack, upNext } = useMusicPlayer(); return <output data-testid="player-readout">{selectedTrack?.title}|{selectedTrack?.id}|{upNext.length}</output>; }
function view() { return render(<MemoryRouter><MusicContextProvider><SavedPlaylistsProvider><Library />
  <SaveTrackControl track={localPlayableCatalog[0]} /><PlayerReadout /></SavedPlaylistsProvider></MusicContextProvider></MemoryRouter>); }
beforeEach(() => { auth.signedIn = true; auth.getToken.mockClear(); vi.restoreAllMocks();
  jamendoApi.mockReset(); vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(); });

describe("saved playlist UI", () => {
  it("blocks rapid duplicate saves and keeps other playlist choices available", async () => {
    const second = { ...playlist, id: "000000000000000000000002", name: "Later" };
    let finish!: (value: Response) => void;
    let posts = 0;
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        posts++;
        if (posts === 1) return new Promise<Response>(resolve => { finish = resolve; });
        return response({ playlist: { ...second, tracks: [{ id: "local:1", source: "local", title: "Luv", artist: "Tory Lanez" }] } });
      }
      return response({ playlists: [playlist, second] });
    }));
    view();
    await screen.findByRole("button", { name: "Favorites (0)" });
    fireEvent.click(screen.getByLabelText("Save Luv to a playlist"));
    const save = screen.getByRole("button", { name: "Save Luv to Favorites" });
    fireEvent.click(save); fireEvent.click(save);
    await waitFor(() => expect(posts).toBe(1));
    finish(response({ playlist: { ...playlist, tracks: [{ id: "local:1", source: "local", title: "Luv", artist: "Tory Lanez" }] } }));
    await screen.findByText("Luv saved to Favorites.");
    fireEvent.click(screen.getByLabelText("Save Luv to a playlist"));
    expect(screen.getByRole("button", { name: "Luv already saved to Favorites" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Save Luv to Later" }));
    await screen.findByText("Luv saved to Later.");
    expect(posts).toBe(2);
  });
  it("loads an empty library, creates a playlist, saves and removes a track without touching audio", async () => {
    const requests: Array<{ url: string; method: string; body?: unknown; authorization: string }> = [];
    let saved = { ...playlist, tracks: [] as typeof playlist.tracks };
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined,
        authorization: String((init?.headers as Record<string, string>)?.Authorization) });
      if (!init?.method) return response({ playlists: [] });
      if (init.method === "POST" && url === "/api/playlists") return response({ playlist: saved = { ...saved, name: "Favorites" } }, 201);
      if (init.method === "POST") { saved = { ...saved, tracks: [{ id: "local:1", source: "local", title: "Luv", artist: "Tory Lanez" }] }; return response({ playlist: saved }); }
      saved = { ...saved, tracks: [] }; return response({ playlist: saved });
    }));
    const rendered = view();
    const audio = rendered.container.querySelector("audio")!;
    audio.currentTime = 35;
    const source = audio.src;
    await screen.findByText(/No saved playlists yet/);
    fireEvent.change(screen.getByLabelText("New playlist name"), { target: { value: "Favorites" } });
    fireEvent.click(screen.getByRole("button", { name: "Create playlist" }));
    await screen.findByRole("button", { name: "Favorites (0)" });
    fireEvent.click(screen.getByLabelText("Save Luv to a playlist"));
    fireEvent.click(screen.getByRole("button", { name: "Save Luv to Favorites" }));
    await screen.findByRole("button", { name: "Remove Luv from Favorites" });
    await waitFor(() => expect(screen.getByLabelText("Save Luv to a playlist").closest("details")?.open).toBe(false));
    expect(screen.getByText("Luv saved to Favorites.").getAttribute("role")).toBe("status");
    fireEvent.click(screen.getByLabelText("Save Luv to a playlist"));
    const alreadySaved = screen.getByRole("button", { name: "Luv already saved to Favorites" });
    expect(alreadySaved.hasAttribute("disabled")).toBe(true);
    fireEvent.click(alreadySaved);
    expect(requests.filter(item => item.method === "POST")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Remove Luv from Favorites" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Remove Luv from Favorites" })).toBeNull());
    expect(audio.src).toBe(source); expect(audio.currentTime).toBe(35);
    expect(audio.paused).toBe(true);
    expect(requests.every(item => item.authorization === "Bearer verified-session")).toBe(true);
    expect(requests[2].body).toEqual({ track: { id: "local:1", source: "local", title: "Luv", artist: "Tory Lanez" } });
  });
  it.each([[401, /could not verify your sign-in/i], [503, /temporarily unavailable/i], [400, /Could not save/i]])("shows API error %s", async (status, expected) => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ error: "server detail" }, status)));
    view();
    expect((await screen.findAllByRole("alert"))[0].textContent).toMatch(expected);
  });
  it("distinguishes an unavailable session token from an API rejection", async () => {
    auth.getToken.mockResolvedValueOnce(null);
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    view();
    expect((await screen.findAllByRole("alert"))[0].textContent).toMatch(/sign-in is not ready yet/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("shows signed-out guidance and does not request playlists", () => {
    auth.signedIn = false;
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    view();
    expect(screen.getByText(/Sign in to create and view/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("requires a fresh Jamendo availability check before offering Play", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ playlists: [{ ...playlist, tracks: [{ id: "jamendo:123", source: "jamendo", title: "Remote", artist: "Artist" }] }] })));
    view();
    await screen.findByText(/Check Jamendo for current audio/);
    expect(screen.queryByRole("button", { name: "Play Remote from Artist" })).toBeNull();
    jamendoApi.mockResolvedValueOnce({ id: "123", name: "Fresh Remote", artist_name: "Artist", album_name: "Album", duration: 65,
      audio: "https://example.invalid/current.mp3", shareurl: "https://www.jamendo.com/track/123" });
    fireEvent.click(screen.getByRole("button", { name: "Check playback availability for Remote" }));
    const play = await screen.findByRole("button", { name: "Play Remote from Artist" });
    fireEvent.click(play);
    expect(screen.getByTestId("player-readout").textContent).toContain("Fresh Remote|jamendo:123");
    expect(jamendoApi).toHaveBeenCalledWith("123", expect.any(AbortSignal));
  });
  it("keeps unavailable Jamendo and missing local audio honest", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ playlists: [{ ...playlist, tracks: [
      { id: "jamendo:123", source: "jamendo", title: "Remote", artist: "Artist" },
      { id: "local:999", source: "local", title: "Missing", artist: "Artist" },
    ] }] })));
    jamendoApi.mockResolvedValueOnce(null);
    view();
    await screen.findByText(/Local audio unavailable/);
    expect(screen.queryByRole("button", { name: "Play Missing from Artist" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Check playback availability for Remote" }));
    expect(await screen.findByText(/Audio currently unavailable from Jamendo/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Play Remote from Artist" })).toBeNull();
  });
  it("plays a saved local track through the shared player and keeps it on route change", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ playlists: [{ ...playlist, tracks: [
      { id: "local:2", source: "local", title: "Lose", artist: "Wizkid" },
    ] }] })));
    const rendered = render(<MemoryRouter initialEntries={["/library"]}><MusicContextProvider><SavedPlaylistsProvider>
      <Routes><Route path="/library" element={<Library />} /><Route path="/other" element={<p>Other route</p>} /></Routes>
      <Link to="/other">Other</Link><PlayerReadout />
    </SavedPlaylistsProvider></MusicContextProvider></MemoryRouter>);
    await screen.findByRole("button", { name: "Play Lose from Wizkid" });
    const audio = rendered.container.querySelector("audio")!;
    expect(rendered.container.querySelectorAll("audio")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Play Lose from Wizkid" }));
    expect(audio.src).toBe(new URL(localPlayableCatalog[1].audioUrl, document.baseURI).href);
    expect(screen.getByTestId("player-readout").textContent).toContain("Lose|local:2");
    fireEvent.click(screen.getByRole("link", { name: "Other" }));
    expect(screen.getByText("Other route")).toBeTruthy();
    expect(audio.src).toBe(new URL(localPlayableCatalog[1].audioUrl, document.baseURI).href);
    expect(screen.getByTestId("player-readout").textContent).toContain("Lose|local:2");
  });
  it("requests the user's saved playlists again after a fresh mount", async () => {
    const fetchMock = vi.fn(async () => response({ playlists: [playlist] }));
    vi.stubGlobal("fetch", fetchMock);
    const first = view();
    await screen.findByRole("button", { name: "Favorites (0)" });
    first.unmount();
    view();
    await screen.findByRole("button", { name: "Favorites (0)" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
