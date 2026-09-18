import { StrictMode } from "react";
import type { ReactNode } from "react";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, Link, MemoryRouter, Outlet, Route, RouterProvider, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MusicContextProvider } from "@/context/MusicContext";
import { useMusicPlayer } from "@/context/music-player-context";
import { NowPlaying } from "@/components/Home/NowPlaying";
import { NowPlayingMini } from "@/components/Home/NowPlayingMini";
import Songs from "@/pages/Songs";
import Search from "@/pages/Search";
import Header from "@/components/Header";
import { SearchProvider } from "@/context/SearchProvider";
import { fetchJamendoTracks } from "@/api/jamendo";
import type { PlayableTrack } from "@/types/playable-track";

vi.mock("@/api/jamendo", () => ({ fetchJamendoTracks: vi.fn() }));
vi.mock("@clerk/clerk-react", () => ({ SignedIn: () => null, SignedOut: ({ children }: { children: ReactNode }) => children, UserButton: () => null }));
const remoteQueue: PlayableTrack[] = [1, 2].map(id => ({
  id: `jamendo:${id}`, source: "jamendo", title: `Remote ${id}`, artist: "Remote artist",
  audioUrl: `https://example.invalid/${id}.mp3`, artworkUrl: "", durationSeconds: 100,
}));
const mediaErrorDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "error");
afterEach(() => {
  if (mediaErrorDescriptor) Object.defineProperty(HTMLMediaElement.prototype, "error", mediaErrorDescriptor);
  else Reflect.deleteProperty(HTMLMediaElement.prototype, "error");
});

vi.mock("@/data/MusicData", () => ({
  playlist: ["one", "two", "three"].map((name, index) => ({
    id: index, title: name, artist: "Demo artist", src: `/${name}.mp3`, cover: "/cover.png",
  })),
}));

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

let media: WeakMap<HTMLMediaElement, { paused: boolean; ended: boolean; readyState: number; error: { code: number } | null; currentSrc: string }>;
function state(audio: HTMLMediaElement) {
  let value = media.get(audio);
  if (!value) { value = { paused: true, ended: false, readyState: 4, error: null, currentSrc: "" }; media.set(audio, value); }
  return value;
}
function start(audio: HTMLMediaElement, promise = Promise.resolve()) {
  Object.assign(state(audio), { paused: false, ended: false });
  fireEvent.play(audio);
  fireEvent.playing(audio);
  return promise;
}
beforeEach(() => {
  media = new WeakMap();
  vi.mocked(fetchJamendoTracks).mockReset();
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(function (this: HTMLMediaElement) { return state(this).paused; });
  vi.spyOn(HTMLMediaElement.prototype, "ended", "get").mockImplementation(function (this: HTMLMediaElement) { return state(this).ended; });
  vi.spyOn(HTMLMediaElement.prototype, "duration", "get").mockReturnValue(180);
  vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockImplementation(function (this: HTMLMediaElement) { return state(this).readyState; });
  // jsdom does not implement MediaError; keep this shim confined to this file.
  Object.defineProperty(HTMLMediaElement.prototype, "error", { configurable: true,
    get: function (this: HTMLMediaElement) { return state(this).error; } });
  vi.spyOn(HTMLMediaElement.prototype, "currentSrc", "get").mockImplementation(function (this: HTMLMediaElement) { return state(this).currentSrc; });
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(function (this: HTMLMediaElement) {
    Object.assign(state(this), { paused: true, ended: false, readyState: 0, error: null, currentSrc: this.src });
    this.currentTime = 0;
    fireEvent.emptied(this);
    state(this).readyState = 4;
    fireEvent.loadedMetadata(this);
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) { return start(this); });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
    const wasPlaying = !state(this).paused;
    state(this).paused = true;
    if (wasPlaying) fireEvent.pause(this);
  });
});

function Controls() {
  const { currentIndex, selectedTrack, queue, isPlaying, isLoading, error, togglePlay, handleNext, handlePrev, playQueue, playTrack } = useMusicPlayer();
  return <>
    <output data-testid="index">{currentIndex}</output>
    <output data-testid="intent">{String(isPlaying)}</output>
    <output data-testid="selected">{selectedTrack?.id ?? "none"}</output>
    <output data-testid="queue">{queue.map(track => track.id).join(",")}</output>
    <output data-testid="loading">{String(isLoading)}</output>
    <output data-testid="playback-error">{error}</output>
    <button onClick={togglePlay}>Toggle playback</button>
    <button onClick={handleNext}>Test next</button>
    <button onClick={handlePrev}>Test previous</button>
    <button onClick={() => playQueue(remoteQueue, 0)}>Remote queue</button>
    <button onClick={() => playQueue(remoteQueue, 1)}>Remote second</button>
    <button onClick={() => playTrack(remoteQueue[1])}>Single remote</button>
    <button onClick={() => playQueue([], 0)}>Empty queue</button>
    <button onClick={() => playQueue(remoteQueue, Number.NaN)}>Invalid index</button>
    <button onClick={() => playQueue([{ ...remoteQueue[0], audioUrl: "" }], 0)}>Invalid audio</button>
  </>;
}
function player(strict = false) {
  const tree = <MusicContextProvider><Controls /><NowPlaying /></MusicContextProvider>;
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { ...view, audio: view.container.querySelector("audio")! };
}
const toggle = () => fireEvent.click(screen.getByRole("button", { name: "Toggle playback" }));
const next = () => fireEvent.click(screen.getByRole("button", { name: "Test next" }));
const previous = () => fireEvent.click(screen.getByRole("button", { name: "Test previous" }));
const expectIntent = (playing: boolean) => expect(screen.getByTestId("intent").textContent).toBe(String(playing));
const expectIndex = (index: number) => expect(screen.getByTestId("index").textContent).toBe(String(index));
function ended(audio: HTMLAudioElement) {
  Object.assign(state(audio), { paused: true, ended: true });
  fireEvent.pause(audio);
  fireEvent.ended(audio);
}

describe("playback lifecycle", () => {
  it.each([false, true])("advances once with the full player mounted (Strict Mode: %s)", async (strict) => {
    const { audio } = player(strict);
    toggle();
    ended(audio);
    await act(async () => { await Promise.resolve(); });
    expectIndex(1);
    expect(audio.getAttribute("src")).toBe("/two.mp3");
    expect(audio.play).toHaveBeenCalledTimes(2);
    expectIntent(true);
  });

  it("keeps rapid Next/Next/Previous operations in order", () => {
    const { audio } = player();
    toggle();
    act(() => { next(); next(); previous(); });
    expectIndex(1);
    expect(audio.getAttribute("src")).toBe("/two.mp3");
    expectIntent(true);
  });

  it("starts a fresh operation when batched Next/Previous returns to the same track", async () => {
    const old = deferred(); const latest = deferred();
    vi.mocked(HTMLMediaElement.prototype.play)
      .mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, old.promise); })
      .mockImplementationOnce(function (this: HTMLMediaElement) { return start(this); })
      .mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, latest.promise); });
    const { audio } = player();
    toggle();
    act(() => { next(); previous(); });
    expectIndex(0);
    expect(audio.play).toHaveBeenCalledTimes(3);
    await act(async () => { old.reject(new Error("Interrupted old request")); });
    expectIntent(true);
    await act(async () => { latest.reject(new Error("Current request failed")); });
    expectIntent(false);
    expect(audio.paused).toBe(true);
  });

  it("preserves paused intent across rapid track selections and playlist wrapping", () => {
    const { audio } = player();
    previous(); expectIndex(2);
    next(); expectIndex(0);
    act(() => { next(); next(); previous(); });
    expectIndex(1); expectIntent(false);
    expect(audio.play).not.toHaveBeenCalled();
  });

  it("preserves Previous restarting a track after two seconds", () => {
    const { audio } = player();
    toggle(); audio.currentTime = 5;
    previous();
    expectIndex(0); expect(audio.currentTime).toBe(0); expectIntent(true);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("pauses pending play intent even before the audio has emitted play", async () => {
    const pending = deferred();
    vi.mocked(HTMLMediaElement.prototype.play).mockReturnValueOnce(pending.promise);
    const { audio } = player();
    toggle(); expectIntent(false); // Pending intent is not actual playback.
    toggle(); expectIntent(false);
    expect(audio.pause).toHaveBeenCalled();
    await act(async () => { pending.resolve(); });
    expectIntent(false); expect(audio.paused).toBe(true);
  });

  it.each([false, true])("ignores an old rejection while newer playback is pending/resolved (%s)", async (resolved) => {
    const old = deferred(); const latest = deferred();
    vi.mocked(HTMLMediaElement.prototype.play)
      .mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, old.promise); })
      .mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, latest.promise); });
    const { audio } = player();
    toggle(); next();
    if (resolved) await act(async () => { latest.resolve(); });
    await act(async () => { old.reject(new Error("Old source interrupted")); });
    expectIndex(1); expectIntent(true); expect(audio.paused).toBe(false);
    if (!resolved) await act(async () => { latest.reject(new Error("Latest source failed")); });
    expectIntent(resolved);
  });

  it("ignores a rejected request after Pause then a new Play", async () => {
    const old = deferred();
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, old.promise); });
    const { audio } = player();
    toggle(); toggle(); toggle();
    await act(async () => { old.reject(new Error("Paused old request")); });
    expectIntent(true); expect(audio.paused).toBe(false);
  });

  it("handles current synchronous play failures without leaving playing intent", () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(() => { throw new Error("Unavailable media"); });
    const { audio } = player();
    toggle();
    expectIntent(false); expect(audio.paused).toBe(true);
  });

  it("synchronizes media events and ignores queued events that contradict the element", () => {
    const { audio } = player();
    toggle(); fireEvent.pause(audio); expectIntent(true);
    act(() => { audio.pause(); }); expectIntent(false);
    fireEvent.play(audio); expectIntent(false);
    act(() => { void audio.play(); }); expectIntent(true);
  });

  it("keeps the same audio and playback through full/mini player route changes", () => {
    const view = render(<MusicContextProvider><Controls /><MemoryRouter>
      <Link to="/">Full player</Link><Link to="/catalog">Catalog</Link>
      <Routes><Route path="/" element={<NowPlaying />} /><Route path="/catalog" element={<NowPlayingMini />} /></Routes>
    </MemoryRouter></MusicContextProvider>);
    const audio = view.container.querySelector("audio")!;
    toggle(); audio.currentTime = 12;
    fireEvent.click(screen.getByRole("link", { name: "Catalog" }));
    expect(view.container.querySelector("audio")).toBe(audio);
    expectIntent(true); expect(audio.currentTime).toBe(12);
    expect(audio.play).toHaveBeenCalledTimes(1);
    ended(audio); expectIndex(1);
    fireEvent.click(screen.getByRole("link", { name: "Full player" }));
    ended(audio); expectIndex(2); expectIntent(true);
    expect(audio.play).toHaveBeenCalledTimes(3);
  });

  it("restores paused progress when the full player mounts again and clears unloaded progress", () => {
    const view = render(<MusicContextProvider><Controls /><MemoryRouter>
      <Link to="/">Full player</Link><Link to="/catalog">Catalog</Link>
      <Routes><Route path="/" element={<NowPlaying />} /><Route path="/catalog" element={<NowPlayingMini />} /></Routes>
    </MemoryRouter></MusicContextProvider>);
    const audio = view.container.querySelector("audio")!;
    toggle(); audio.currentTime = 12; toggle();
    fireEvent.click(screen.getByRole("link", { name: "Catalog" }));
    fireEvent.click(screen.getByRole("link", { name: "Full player" }));
    expectIntent(false);
    expect(screen.getByText("0:12")).toBeTruthy();
    expect(screen.getByText("3:00")).toBeTruthy();
    state(audio).readyState = 0;
    fireEvent.emptied(audio);
    expect(screen.getAllByText("0:00")).toHaveLength(2);
  });

  it("cleans listeners in Strict Mode, stops on unmount, and ignores late rejections", async () => {
    const add = vi.spyOn(HTMLMediaElement.prototype, "addEventListener");
    const remove = vi.spyOn(HTMLMediaElement.prototype, "removeEventListener");
    // React itself installs media-event delegates. Compare app subscriptions
    // against a bare audio element rather than counting framework listeners.
    const baseline = render(<audio />);
    const baselineAudio = baseline.container.querySelector("audio")!;
    const frameworkCount = (type: string) => add.mock.calls.filter(
      (call, index) => call[0] === type && add.mock.contexts[index] === baselineAudio,
    ).length;
    baseline.unmount();
    const pending = deferred();
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, pending.promise); });
    const { audio, unmount } = player(true);
    toggle();
    unmount();
    for (const type of ["play", "playing", "pause", "ended", "waiting", "error", "timeupdate", "loadedmetadata", "durationchange", "emptied"]) {
      const attached = add.mock.calls.filter((call, index) => call[0] === type && add.mock.contexts[index] === audio);
      const removed = remove.mock.calls.filter((call, index) => call[0] === type && remove.mock.contexts[index] === audio);
      expect(attached.length).toBeGreaterThan(0);
      expect(removed.map(call => call[1])).toEqual(attached.slice(frameworkCount(type)).map(call => call[1]));
    }
    expect(audio.paused).toBe(true);
    const playCalls = vi.mocked(audio.play).mock.calls.length;
    fireEvent.ended(audio);
    await act(async () => { pending.reject(new Error("Unmounted request")); });
    expect(audio.play).toHaveBeenCalledTimes(playCalls);
  });
});

describe("shared queues and track selection", () => {
  const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
  const selected = (id: string) => expect(screen.getByTestId("selected").textContent).toBe(id);

  it("does not autoplay the initial local selection", () => {
    const { audio } = player();
    selected("local:0"); expectIndex(0); expectIntent(false);
    expect(audio.play).not.toHaveBeenCalled();
    expect(screen.getByTestId("loading").textContent).toBe("false");
  });

  it.each([false, true])("explicit Play starts the default and a paused selection (mini: %s)", mini => {
    const view = render(<MusicContextProvider><Controls />{mini ? <NowPlayingMini /> : <NowPlaying />}</MusicContextProvider>);
    const audio = view.container.querySelector("audio")!;
    selected("local:0"); expectIntent(false);
    expect(audio.play).not.toHaveBeenCalled();
    click("Play playback"); expectIntent(true);
    expect(audio.getAttribute("src")).toBe("/one.mp3");
    click("Pause playback"); next(); selected("local:1"); expectIntent(false);
    expect(audio.play).toHaveBeenCalledTimes(1);
    click("Play playback"); expectIntent(true);
    expect(audio.getAttribute("src")).toBe("/two.mp3");
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.paused).toBe(false);
  });

  it("supports singleton playTrack without natural-end looping", () => {
    const { audio } = player();
    click("Single remote"); selected("jamendo:2"); expectIndex(0);
    expect(screen.getByTestId("queue").textContent).toBe("jamendo:2");
    ended(audio); expectIntent(false);
    expect(audio.play).toHaveBeenCalledTimes(1);
    toggle(); expectIntent(true);
    ended(audio); expectIntent(false);
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it("keeps selected queue order, wraps manual controls, and stops at the natural end", () => {
    const { audio } = player();
    click("Remote queue"); selected("jamendo:1");
    ended(audio); selected("jamendo:2"); expectIntent(true);
    ended(audio); selected("jamendo:2"); expectIntent(false);
    expect(audio.play).toHaveBeenCalledTimes(2);
    next(); selected("jamendo:1"); expectIntent(false);
    previous(); selected("jamendo:2");
    toggle(); next(); selected("jamendo:1"); expectIntent(true);
    expect(screen.getByTestId("queue").textContent).toBe("jamendo:1,jamendo:2");
  });

  it("clears an empty queue and safely leaves invalid selections unapplied", () => {
    const { audio } = player();
    click("Remote second"); selected("jamendo:2");
    click("Invalid index"); selected("jamendo:2"); expectIntent(true);
    expect(screen.getByTestId("playback-error").textContent).toBe("Choose a valid track to start playback.");
    click("Invalid audio"); selected("jamendo:2"); expectIntent(true);
    click("Empty queue"); selected("none"); expectIndex(-1); expectIntent(false);
    expect(screen.getByTestId("queue").textContent).toBe("");
    expect(screen.getByTestId("playback-error").textContent).toBe("");
    expect(audio.getAttribute("src")).toBeNull();
    next(); previous(); toggle(); selected("none");
  });

  it("copies queue objects so callers cannot mutate selected audio or ordering", () => {
    const original = remoteQueue.map(track => ({ ...track }));
    try {
      const { audio } = player();
      click("Remote queue");
      remoteQueue[0].title = "Changed caller title";
      remoteQueue.reverse();
      selected("jamendo:1");
      expect(screen.getByRole("heading", { name: "Remote 1" })).toBeTruthy();
      next(); selected("jamendo:2");
      expect(audio.getAttribute("src")).toBe("https://example.invalid/2.mp3");
    } finally { remoteQueue.splice(0, remoteQueue.length, ...original); }
  });

  it.each([-1, 2, 0.5, Number.NaN])("rejects invalid starting indexes without changing selection (%s)", index => {
    const { result } = renderHook(useMusicPlayer, { wrapper: ({ children }) => <MusicContextProvider>{children}</MusicContextProvider> });
    act(() => result.current.playQueue(remoteQueue, index));
    expect(result.current.selectedTrack?.id).toBe("local:0");
    expect(result.current.error).toBe("Choose a valid track to start playback.");
    expect(result.current.isPlaying).toBe(false);
  });

  it("does not claim playing when play resolves without a playing event", async () => {
    const pending = deferred();
    vi.mocked(HTMLMediaElement.prototype.play).mockReturnValueOnce(pending.promise);
    player(); click("Remote queue"); expectIntent(false);
    expect(screen.getByTestId("loading").textContent).toBe("true");
    await act(async () => { pending.resolve(); });
    expectIntent(false);
    toggle(); expect(screen.getByTestId("loading").textContent).toBe("false");
  });

  it("ignores stale resolution/rejection while switching local and remote sources", async () => {
    const old = deferred(); const latest = deferred();
    vi.mocked(HTMLMediaElement.prototype.play)
      .mockReturnValueOnce(old.promise)
      .mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, latest.promise); });
    const { audio } = player();
    toggle(); click("Remote second");
    await act(async () => { old.resolve(); });
    selected("jamendo:2"); expectIntent(true);
    await act(async () => { latest.reject(new Error("sensitive-provider-error")); });
    expectIntent(false);
    expect(screen.getByRole("alert").textContent).not.toContain("sensitive-provider-error");
    expect(audio.paused).toBe(true);
  });

  it("ignores media events whose currentSrc still belongs to an older source", () => {
    const { audio } = player(); toggle(); const oldSource = audio.src;
    click("Remote queue");
    state(audio).currentSrc = oldSource;
    state(audio).error = { code: 2 };
    fireEvent.error(audio); fireEvent.waiting(audio);
    expectIntent(true); expect(screen.getByTestId("playback-error").textContent).toBe("");
    state(audio).currentSrc = audio.src; state(audio).error = null;
    fireEvent.emptied(audio); // A late emptied event with buffered media is ignored.
    expect(screen.getByText("3:00")).toBeTruthy();
  });

  it("shows media failures safely and retries the selected source", () => {
    const { audio } = player(); click("Remote queue");
    state(audio).error = { code: 2 }; fireEvent.error(audio);
    expectIntent(false);
    expect(screen.getByRole("alert").textContent).toContain("Check your connection");
    click("Retry playback"); selected("jamendo:1"); expectIntent(true);
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.waiting(audio); expectIntent(false);
    expect(screen.getByText("Loading audio…").getAttribute("role")).toBe("status");
    fireEvent.playing(audio); expectIntent(true);
  });

  it("resets stale progress/errors when a different queue is selected", () => {
    const { audio } = player(); toggle(); audio.currentTime = 90; fireEvent.timeUpdate(audio);
    state(audio).error = { code: 3 }; fireEvent.error(audio);
    click("Remote second");
    expect(screen.getByText("0:00")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull(); selected("jamendo:2"); expectIntent(true);
  });

  it("plays the chosen local row and synchronizes full and mini views", () => {
    const view = render(<MusicContextProvider><Controls /><Songs /><NowPlaying /><NowPlayingMini /></MusicContextProvider>);
    click("Play three"); selected("local:2"); expectIndex(2); expectIntent(true);
    const audio = view.container.querySelector("audio")!;
    expect(view.container.querySelectorAll("audio")).toHaveLength(1);
    expect(audio.getAttribute("src")).toBe("/three.mp3");
    expect(screen.getAllByRole("button", { name: "Pause playback" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Pause three" }).getAttribute("aria-pressed")).toBe("true");
    click("Pause three"); expectIntent(false);
    expect(screen.getAllByRole("button", { name: "Play playback" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Play three" }).getAttribute("aria-pressed")).toBe("false");
    click("Play one"); selected("local:0");
    expect(screen.getByTestId("queue").textContent).toBe("local:0,local:1,local:2");
  });

  it("plays the Jamendo stream/result queue and keeps it while search clears or changes", async () => {
    const api = vi.mocked(fetchJamendoTracks);
    const result = (id: string, audio?: string) => ({ id, name: `Catalog ${id}`, artist_name: "Catalog artist", album_name: "Album", duration: 100, audio });
    api.mockResolvedValueOnce([result("missing"), result("1", "https://example.invalid/j1.mp3"), result("2", "https://example.invalid/j2.mp3")]);
    const router = createMemoryRouter([{ element: <><Header /><Controls /><Outlet /><NowPlayingMini /></>, children: [
      { path: "/search", element: <Search /> }, { path: "/songs", element: <Songs /> },
    ] }], { initialEntries: ["/search?q=first"] });
    const view = render(<MusicContextProvider><SearchProvider><RouterProvider router={router} /></SearchProvider></MusicContextProvider>);
    await screen.findByRole("button", { name: "Play Catalog 2" });
    expect(screen.getByRole("button", { name: "Play Catalog missing" }).hasAttribute("disabled")).toBe(true);
    click("Play Catalog 2"); selected("jamendo:2"); expectIndex(1);
    const audio = view.container.querySelector("audio")!;
    expect(audio.getAttribute("src")).toBe("https://example.invalid/j2.mp3");
    expect(screen.getByTestId("queue").textContent).toBe("jamendo:1,jamendo:2");
    click("Clear search");
    await waitFor(() => expect(router.state.location.search).toBe(""));
    expect(screen.queryByRole("button", { name: "Play Catalog 1" })).toBeNull();
    selected("jamendo:2"); expectIntent(true);
    next(); selected("jamendo:1"); expect(audio.getAttribute("src")).toBe("https://example.invalid/j1.mp3");
    api.mockResolvedValueOnce([result("new", "https://example.invalid/new.mp3")]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "new" } }); click("Search");
    await screen.findByRole("button", { name: "Play Catalog new" });
    selected("jamendo:1"); expectIntent(true);
    await act(async () => { await router.navigate("/songs"); });
    selected("jamendo:1"); expectIntent(true); expect(view.container.querySelector("audio")).toBe(audio);
    click("Play two"); selected("local:1"); expect(audio.getAttribute("src")).toBe("/two.mp3");
  });
});
