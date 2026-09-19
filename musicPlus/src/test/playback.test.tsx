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
import Queue from "@/pages/Queue";
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

let media: WeakMap<HTMLMediaElement, { paused: boolean; ended: boolean; readyState: number; error: { code: number } | null; currentSrc: string; ranges: [number, number][] }>;
function state(audio: HTMLMediaElement) {
  let value = media.get(audio);
  if (!value) { value = { paused: true, ended: false, readyState: 4, error: null, currentSrc: "", ranges: [[0, 180]] }; media.set(audio, value); }
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
  vi.spyOn(HTMLMediaElement.prototype, "seekable", "get").mockImplementation(function (this: HTMLMediaElement) {
    const ranges = state(this).ranges;
    return { length: ranges.length, start: index => ranges[index][0], end: index => ranges[index][1] };
  });
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
  const { currentIndex, selectedTrack, queue, upNext, queueNotice, playNext, addToQueue, editUpNext, isPlaying, isLoading, error, togglePlay, handleNext, handlePrev, playQueue, playTrack, repeatMode, cycleRepeatMode, isShuffled, toggleShuffle } = useMusicPlayer();
  return <>
    <output data-testid="index">{currentIndex}</output>
    <output data-testid="intent">{String(isPlaying)}</output>
    <output data-testid="selected">{selectedTrack?.id ?? "none"}</output>
    <output data-testid="queue">{queue.map(track => track.id).join(",")}</output>
    <output data-testid="up-next">{upNext.map(track => track.id).join(",")}</output>
    <output data-testid="queue-notice">{queueNotice}</output>
    <output data-testid="loading">{String(isLoading)}</output>
    <output data-testid="playback-error">{error}</output>
    <output data-testid="repeat">{repeatMode}</output>
    <output data-testid="shuffle">{String(isShuffled)}</output>
    <button onClick={cycleRepeatMode}>Cycle repeat</button>
    <button onClick={toggleShuffle}>Toggle shuffle</button>
    <button onClick={togglePlay}>Toggle playback</button>
    <button onClick={handleNext}>Test next</button>
    <button onClick={handlePrev}>Test previous</button>
    <button onClick={() => playQueue(remoteQueue, 0)}>Remote queue</button>
    <button onClick={() => playQueue([remoteQueue[0], remoteQueue[0], remoteQueue[1]], 0)}>Duplicate queue</button>
    <button onClick={() => editUpNext(1, "remove")}>Remove slot 1</button>
    <button onClick={() => editUpNext(2, "up")}>Move slot 2 up</button>
    <button onClick={() => playNext(remoteQueue[0])}>Play next remote 1</button>
    <button onClick={() => playNext(remoteQueue[1])}>Play next remote 2</button>
    <button onClick={() => addToQueue(remoteQueue[0])}>Add remote 1</button>
    <button onClick={() => addToQueue(remoteQueue[1])}>Add remote 2</button>
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
    for (const type of ["play", "playing", "pause", "ended", "waiting", "error", "timeupdate", "loadedmetadata", "durationchange", "emptied", "progress", "canplay", "seeking", "seeked", "volumechange"]) {
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
    const view = render(<MusicContextProvider><Controls /><MemoryRouter>{mini ? <NowPlayingMini /> : <NowPlaying />}</MemoryRouter></MusicContextProvider>);
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
    const view = render(<MusicContextProvider><Controls /><MemoryRouter><Songs /><NowPlaying /><NowPlayingMini /></MemoryRouter></MusicContextProvider>);
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
      { path: "/search", element: <Search /> }, { path: "/songs", element: <Songs /> }, { path: "/queue", element: <Queue /> },
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

describe("shared seek and volume", () => {
  function controls() {
    const hook = renderHook(useMusicPlayer, { wrapper: ({ children }) => <MusicContextProvider>{children}</MusicContextProvider> });
    return { ...hook, audio: hook.result.current.audioRef.current };
  }

  it.each([[-20, 0], [900, 180], [Number.NaN, 0], [Number.POSITIVE_INFINITY, 0]])("bounds seek input %s to %s without autoplay", (input, expected) => {
    const { result, audio } = controls();
    act(() => result.current.seek(input));
    expect(audio.currentTime).toBe(expected);
    expect(result.current.progress).toBe(0);
    fireEvent.seeked(audio);
    expect(result.current.progress).toBe(expected);
    expect(audio.play).not.toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it("clamps to partial/disjoint seekable ranges rather than unavailable gaps", () => {
    const { result, audio } = controls();
    state(audio).ranges = [[10, 40], [60, 150]];
    for (const [input, expected] of [[0, 10], [48, 40], [52, 60], [900, 150]]) {
      act(() => result.current.seek(input));
      expect(audio.currentTime).toBe(expected);
    }
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0, -1])("disables seeking for unusable duration %s", duration => {
    vi.spyOn(HTMLMediaElement.prototype, "duration", "get").mockReturnValue(duration);
    const view = render(<MusicContextProvider><MemoryRouter><NowPlaying /><NowPlayingMini /></MemoryRouter></MusicContextProvider>);
    expect(screen.getByRole("slider", { name: "Full player seek" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("slider", { name: "Mini player seek" }).hasAttribute("disabled")).toBe(true);
    expect(view.container.querySelector("audio")!.play).not.toHaveBeenCalled();
  });

  it("does not queue a seek when metadata or seekable ranges are unavailable", () => {
    const { result, audio } = controls();
    state(audio).readyState = 0;
    fireEvent.emptied(audio);
    act(() => result.current.seek(70));
    expect(result.current.canSeek).toBe(false);
    state(audio).readyState = 4; state(audio).ranges = [];
    fireEvent.loadedMetadata(audio);
    act(() => result.current.seek(70));
    expect(result.current.canSeek).toBe(false);
    state(audio).ranges = [[0, 180]];
    fireEvent.progress(audio);
    expect(result.current.canSeek).toBe(true);
    expect(audio.currentTime).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it("ignores old seek callbacks and stale events after a track/source changes", () => {
    const { result, audio } = controls();
    const oldSeek = result.current.seek;
    const oldSource = audio.src;
    act(() => { result.current.seek(60); result.current.playQueue(remoteQueue, 1); oldSeek(90); });
    expect(audio.currentTime).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(result.current.selectedTrack?.id).toBe("jamendo:2");
    state(audio).currentSrc = oldSource; audio.currentTime = 60;
    fireEvent.seeked(audio); fireEvent.timeUpdate(audio);
    expect(result.current.progress).toBe(0);
    state(audio).currentSrc = audio.src; audio.currentTime = 0;
    fireEvent.seeked(audio);
    act(() => result.current.seek(35));
    fireEvent.seeking(audio);
    expect(result.current.progress).toBe(35);
    const beforeReload = result.current.seek;
    act(() => { result.current.retryPlayback(); beforeReload(100); });
    expect(audio.currentTime).toBe(0);
  });

  it("handles rejected seek writes and unavailable ranges without stopping playback", () => {
    const { result, audio } = controls();
    act(() => result.current.togglePlay());
    const setter = vi.spyOn(audio, "currentTime", "set").mockImplementation(() => { throw new Error("sensitive media failure"); });
    act(() => result.current.seek(50));
    expect(result.current.controlsError).toBe("Seeking is unavailable for this audio. Playback can continue.");
    expect(result.current.canSeek).toBe(false);
    expect(result.current.isPlaying).toBe(true);
    expect(audio.paused).toBe(false);
    setter.mockRestore();
    vi.spyOn(audio, "seekable", "get").mockImplementation(() => { throw new Error("unsupported"); });
    fireEvent.progress(audio);
    expect(result.current.canSeek).toBe(false);
  });

  it("synchronizes both seek/volume controls from the shared element", () => {
    const view = render(<MusicContextProvider><MemoryRouter><NowPlaying /><NowPlayingMini /></MemoryRouter></MusicContextProvider>);
    const audio = view.container.querySelector("audio")!;
    const fullSeek = screen.getByRole("slider", { name: "Full player seek" }) as HTMLInputElement;
    const miniSeek = screen.getByRole("slider", { name: "Mini player seek" }) as HTMLInputElement;
    fireEvent.change(fullSeek, { target: { value: "44" } });
    expect(audio.currentTime).toBe(44);
    expect(miniSeek.value).toBe("0");
    fireEvent.seeked(audio);
    expect(fullSeek.value).toBe("44"); expect(miniSeek.value).toBe("44");
    fireEvent.change(screen.getByRole("slider", { name: "Mini player volume" }), { target: { value: "0.4" } });
    expect(audio.volume).toBe(0.4);
    expect((screen.getByRole("slider", { name: "Full player volume" }) as HTMLInputElement).value).toBe("0.4");
    fireEvent.click(screen.getByRole("button", { name: "Full player mute" }));
    expect(audio.muted).toBe(true);
    expect((screen.getByRole("slider", { name: "Mini player volume" }) as HTMLInputElement).value).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "Mini player unmute" }));
    expect(audio.muted).toBe(false); expect(audio.volume).toBe(0.4);
    expect(view.container.querySelectorAll("audio")).toHaveLength(1);
  });

  it.each([[-1, 0], [2, 1], [0.25, 0.25], [Number.NaN, 1], [Number.POSITIVE_INFINITY, 1]])("clamps volume %s to %s without playing", (input, expected) => {
    const { result, audio } = controls();
    act(() => result.current.setVolume(input));
    expect(audio.volume).toBe(expected); expect(result.current.volume).toBe(expected);
    expect(audio.play).not.toHaveBeenCalled();
  });

  it("restores the previous nonzero volume after mute or a zero slider value", () => {
    const { result, audio } = controls();
    act(() => result.current.setVolume(0.35));
    act(() => result.current.toggleMute());
    expect(result.current.isMuted).toBe(true);
    act(() => result.current.toggleMute());
    expect(audio.volume).toBe(0.35); expect(result.current.isMuted).toBe(false);
    act(() => result.current.setVolume(0));
    act(() => result.current.toggleMute());
    expect(audio.volume).toBe(0.35); expect(result.current.isMuted).toBe(false);
    act(() => result.current.toggleMute());
    act(() => result.current.setVolume(0.7));
    expect(audio.muted).toBe(false); expect(result.current.volume).toBe(0.7);
  });

  it("follows external volumechange and safely reports unsupported property writes", () => {
    const { result, audio } = controls();
    audio.volume = 0.6; fireEvent.volumeChange(audio);
    expect(result.current.volume).toBe(0.6);
    audio.muted = true; fireEvent.volumeChange(audio);
    expect(result.current.isMuted).toBe(true);
    const setter = vi.spyOn(audio, "volume", "set").mockImplementation(() => {});
    act(() => result.current.setVolume(0.2));
    expect(result.current.volume).toBe(0.6);
    expect(result.current.controlsError).toContain("device volume controls");
    setter.mockImplementation(() => { throw new Error("sensitive volume failure"); });
    act(() => { audio.muted = true; });
    act(() => result.current.toggleMute());
    expect(result.current.controlsError).toBe("Your browser cannot change audio volume here. Use your device volume controls.");
    expect(result.current.isPlaying).toBe(false);
    setter.mockRestore();
  });

  it("preserves seek/volume and the audio element through route changes and advances once", () => {
    const view = render(<MusicContextProvider><Controls /><MemoryRouter>
      <Link to="/">Full player</Link><Link to="/mini">Mini player</Link>
      <Routes><Route path="/" element={<NowPlaying />} /><Route path="/mini" element={<NowPlayingMini />} /></Routes>
    </MemoryRouter></MusicContextProvider>);
    const audio = view.container.querySelector("audio")!;
    toggle();
    fireEvent.change(screen.getByRole("slider", { name: "Full player seek" }), { target: { value: "60" } });
    fireEvent.seeked(audio);
    fireEvent.change(screen.getByRole("slider", { name: "Full player volume" }), { target: { value: "0.3" } });
    fireEvent.click(screen.getByRole("link", { name: "Mini player" }));
    expect(view.container.querySelector("audio")).toBe(audio);
    expect((screen.getByRole("slider", { name: "Mini player seek" }) as HTMLInputElement).value).toBe("60");
    expect((screen.getByRole("slider", { name: "Mini player volume" }) as HTMLInputElement).value).toBe("0.3");
    expectIntent(true);
    ended(audio); expectIndex(1); expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.currentTime).toBe(0); expect(audio.volume).toBe(0.3);
    fireEvent.click(screen.getByRole("link", { name: "Full player" }));
    expectIntent(true);
    expect((screen.getByRole("slider", { name: "Full player seek" }) as HTMLInputElement).value).toBe("0");
  });

  it("rearms natural completion when seeking back from a completed final track", () => {
    const { result, audio } = controls();
    act(() => result.current.playTrack(remoteQueue[0]));
    ended(audio); expect(result.current.isPlaying).toBe(false);
    act(() => result.current.seek(20));
    state(audio).ended = false; fireEvent.seeked(audio);
    act(() => result.current.togglePlay());
    expect(result.current.isPlaying).toBe(true);
    ended(audio); expect(result.current.isPlaying).toBe(false);
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it("ignores retained control callbacks after provider unmount", () => {
    const { result, unmount, audio } = controls();
    const old = result.current;
    unmount();
    expect(() => { old.seek(50); old.setVolume(0.2); old.toggleMute(); }).not.toThrow();
    expect(audio.currentTime).toBe(0); expect(audio.volume).toBe(1);
    expect(audio.play).not.toHaveBeenCalled();
  });

  it("allows unmuting when volume writes are restricted but mute is supported", () => {
    const { result, audio } = controls();
    act(() => { result.current.setVolume(0.4); result.current.toggleMute(); });
    const setter = vi.spyOn(audio, "volume", "set").mockImplementation(() => { throw new Error("restricted volume"); });
    act(() => result.current.toggleMute());
    expect(audio.muted).toBe(false); expect(result.current.isMuted).toBe(false);
    expect(result.current.volume).toBe(0.4);
    expect(result.current.controlsError).toContain("device volume controls");
    act(() => result.current.toggleMute());
    act(() => result.current.setVolume(0.5));
    expect(audio.muted).toBe(false); expect(result.current.isMuted).toBe(false);
    expect(result.current.volume).toBe(0.4);
    expect(audio.play).not.toHaveBeenCalled();
    setter.mockRestore();
  });
});

describe("repeat and shuffle modes", () => {
  beforeEach(() => { vi.spyOn(Math, "random").mockReturnValue(0); });
  const cycle = () => fireEvent.click(screen.getByRole("button", { name: "Cycle repeat" }));
  const shuffle = () => fireEvent.click(screen.getByRole("button", { name: "Toggle shuffle" }));
  it.each(["off", "all", "one"] as const)("applies repeat-%s only to natural completion", mode => {
    const { audio } = player();
    if (mode !== "off") cycle();
    if (mode === "one") cycle();
    next(); next(); toggle();
    ended(audio);
    expectIndex(mode === "all" ? 0 : 2);
    expectIntent(mode !== "off");
    expect(audio.play).toHaveBeenCalledTimes(mode === "off" ? 1 : 2);
    next(); expectIndex(mode === "all" ? 1 : 0);
  });
  it("repeat-one retains its traversal slot and manual Next still changes tracks", () => {
    const { audio } = player(); cycle(); cycle(); shuffle(); toggle();
    ended(audio); ended(audio); expectIndex(0);
    next(); expect(screen.getByTestId("selected").textContent).not.toBe("local:0");
    audio.currentTime = 5; previous();
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(4);
  });
  it("visits each shuffled track once, stops, and manually wraps without repeating the boundary", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { audio } = player(); shuffle(); toggle();
    const visited = [screen.getByTestId("selected").textContent];
    ended(audio); visited.push(screen.getByTestId("selected").textContent);
    ended(audio); visited.push(screen.getByTestId("selected").textContent);
    expect(new Set(visited).size).toBe(3);
    expect(screen.getByTestId("queue").textContent).toBe("local:0,local:1,local:2");
    ended(audio); expectIntent(false);
    const last = screen.getByTestId("selected").textContent;
    next(); expect(screen.getByTestId("selected").textContent).not.toBe(last);
    expectIntent(false);
  });
  it("repeat-all reshuffles whole cycles without adjacent boundary duplicates", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { audio } = player(); shuffle(); cycle(); toggle();
    ended(audio); ended(audio);
    const last = screen.getByTestId("selected").textContent;
    ended(audio);
    const cycleTracks = [screen.getByTestId("selected").textContent];
    expect(cycleTracks[0]).not.toBe(last);
    ended(audio); cycleTracks.push(screen.getByTestId("selected").textContent);
    ended(audio); cycleTracks.push(screen.getByTestId("selected").textContent);
    expect(new Set(cycleTracks).size).toBe(3); expectIntent(true);
  });
  it("Previous follows shuffle history and Next retraces it before advancing", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    player(); shuffle(); previous(); expectIndex(0);
    next(); expectIndex(2); next(); expectIndex(1);
    previous(); expectIndex(2); previous(); expectIndex(0);
    next(); expectIndex(2); next(); expectIndex(1);
    expectIntent(false);
  });
  it.each([false, true])("toggling modes preserves source, time, intent, and media operations (playing: %s)", playing => {
    const { audio } = player(); next(); if (playing) toggle();
    audio.currentTime = 12;
    const playCalls = vi.mocked(audio.play).mock.calls.length;
    const pauseCalls = vi.mocked(audio.pause).mock.calls.length;
    const loadCalls = vi.mocked(audio.load).mock.calls.length;
    shuffle(); cycle(); cycle(); shuffle();
    expectIndex(1); expect(audio.currentTime).toBe(12);
    expect(audio.getAttribute("src")).toBe("/two.mp3");
    expect(audio.play).toHaveBeenCalledTimes(playCalls);
    expect(audio.pause).toHaveBeenCalledTimes(pauseCalls);
    expect(audio.load).toHaveBeenCalledTimes(loadCalls);
    expectIntent(playing);
  });
  it("does not invalidate an outstanding play operation when modes change", async () => {
    const pending = deferred();
    vi.mocked(HTMLMediaElement.prototype.play).mockReturnValueOnce(pending.promise);
    player(); toggle(); shuffle(); cycle();
    expect(screen.getByTestId("loading").textContent).toBe("true");
    await act(async () => pending.reject(new Error("synthetic failure")));
    expectIntent(false);
    expect(screen.getByTestId("playback-error").textContent).toContain("Unable to play");
  });
  it("retains modes but resets traversal and history when replacing the queue", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    player(); shuffle(); cycle(); next(); next();
    fireEvent.click(screen.getByRole("button", { name: "Remote second" }));
    previous(); expect(screen.getByTestId("selected").textContent).toBe("jamendo:2");
    next(); expect(screen.getByTestId("selected").textContent).toBe("jamendo:1");
    expect(screen.getByTestId("repeat").textContent).toBe("all");
    expect(screen.getByTestId("shuffle").textContent).toBe("true");
    expect(screen.getByTestId("queue").textContent).toBe("jamendo:1,jamendo:2");
  });
  it.each(["off", "all", "one"] as const)("handles a singleton and empty queue in repeat-%s", mode => {
    const { audio } = player(); shuffle();
    if (mode !== "off") cycle(); if (mode === "one") cycle();
    fireEvent.click(screen.getByRole("button", { name: "Single remote" }));
    ended(audio); expectIntent(mode !== "off");
    next(); expect(screen.getByTestId("selected").textContent).toBe("jamendo:2");
    fireEvent.click(screen.getByRole("button", { name: "Empty queue" }));
    next(); previous(); shuffle(); cycle(); ended(audio);
    expect(screen.getByTestId("selected").textContent).toBe("none"); expectIntent(false);
  });
  it("synchronizes labelled, pressed-state controls in both player views", () => {
    render(<MusicContextProvider><MemoryRouter><NowPlaying /><NowPlayingMini /></MemoryRouter></MusicContextProvider>);
    for (const view of ["Full player", "Mini player"]) {
      for (const mode of ["repeat", "shuffle"]) {
        const button = screen.getByRole("button", { name: `${view} ${mode}: off` });
        expect(button.getAttribute("aria-pressed")).toBe("false");
        expect(button.className).toContain("text-neutral-200");
        expect(button.className).toContain("focus-visible:outline-2");
        button.focus();
        expect(document.activeElement).toBe(button);
      }
    }
    fireEvent.click(screen.getByRole("button", { name: "Full player repeat: off" }));
    expect(screen.getByRole("button", { name: "Mini player repeat: all" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Mini player repeat: all" }));
    expect(screen.getByRole("button", { name: "Full player repeat: one" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mini player shuffle: off" }));
    expect(screen.getByRole("button", { name: "Full player shuffle: on" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Mini player shuffle: on" }).className).toContain("aria-pressed:bg-emerald-950");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
  it("keeps the selected Songs action compact on mobile with a full accessible label", () => {
    render(<MusicContextProvider><Songs /></MusicContextProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Play one" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause one" }));
    const selected = screen.getByRole("button", { name: "Play one" });
    expect(selected.querySelector(".sm\\:hidden")?.textContent).toBe("Play");
    expect(selected.querySelector(".sm\\:inline")?.textContent).toContain("selected");
  });
  it("preserves modes and playback across route changes", () => {
    render(<MusicContextProvider><Controls /><MemoryRouter><Link to="/songs">Navigate songs</Link>
      <Routes><Route path="/" element={<NowPlaying />} /><Route path="/songs" element={<NowPlayingMini />} /></Routes>
    </MemoryRouter></MusicContextProvider>);
    cycle(); shuffle(); toggle();
    const audio = document.querySelector("audio")!;
    fireEvent.click(screen.getByRole("link", { name: "Navigate songs" }));
    expect(document.querySelector("audio")).toBe(audio);
    expect(screen.getByRole("button", { name: "Mini player repeat: all" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mini player shuffle: on" })).toBeTruthy();
    expectIntent(true); expect(audio.play).toHaveBeenCalledTimes(1);
  });
  it.each([false, true])("ignores duplicate ended events and stale play rejection after repeat-one (Strict Mode: %s)", async strict => {
    const old = deferred();
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, old.promise); });
    const { audio, unmount } = player(strict); cycle(); cycle(); toggle();
    ended(audio); fireEvent.ended(audio);
    expectIndex(0); expect(audio.play).toHaveBeenCalledTimes(2);
    await act(async () => old.reject(new Error("old interrupted play")));
    expectIntent(true); expect(screen.getByTestId("playback-error").textContent).toBe("");
    unmount(); expect(audio.paused).toBe(true);
    fireEvent.ended(audio); expect(audio.play).toHaveBeenCalledTimes(2);
  });
  it("does not repeat failed media or transition on an old source's ended event", () => {
    const { audio } = player(); cycle(); toggle();
    fireEvent.click(screen.getByRole("button", { name: "Remote queue" }));
    state(audio).currentSrc = "http://localhost/one.mp3";
    ended(audio); expect(screen.getByTestId("selected").textContent).toBe("jamendo:1");
    state(audio).currentSrc = audio.src; state(audio).error = { code: 2 };
    fireEvent.ended(audio); expect(screen.getByTestId("selected").textContent).toBe("jamendo:1");
    fireEvent.error(audio); expectIntent(false);
    expect(screen.getByTestId("playback-error").textContent).toContain("Check your connection");
  });
});

describe("Phase 4A Up Next actions", () => {
  const upNext = () => screen.getByTestId("up-next").textContent;
  it.each([false, true])("edits upcoming tracks without touching current media (playing: %s)", playing => {
    const { audio } = player();
    if (playing) toggle();
    audio.currentTime = 37;
    const src = audio.src;
    const calls = [vi.mocked(audio.play).mock.calls.length, vi.mocked(audio.pause).mock.calls.length, vi.mocked(audio.load).mock.calls.length];
    fireEvent.click(screen.getByRole("button", { name: "Add remote 1" }));
    expect(upNext()).toBe("local:1,local:2,jamendo:1");
    fireEvent.click(screen.getByRole("button", { name: "Play next remote 2" }));
    expect(upNext()).toBe("jamendo:2,local:1,local:2,jamendo:1");
    fireEvent.click(screen.getByRole("button", { name: "Play next remote 1" }));
    expect(upNext()).toBe("jamendo:1,jamendo:2,local:1,local:2");
    fireEvent.click(screen.getByRole("button", { name: "Add remote 1" }));
    expect(upNext()).toBe("jamendo:1,jamendo:2,local:1,local:2");
    expect(screen.getByTestId("queue-notice").textContent).toContain("already in Up Next");
    expect(audio.src).toBe(src);
    expect(audio.currentTime).toBe(37);
    expect([vi.mocked(audio.play).mock.calls.length, vi.mocked(audio.pause).mock.calls.length, vi.mocked(audio.load).mock.calls.length]).toEqual(calls);
    expectIntent(playing);
  });
  it("keeps repeat-one on the current track until manual Next consumes Play Next", () => {
    const { audio } = player();
    fireEvent.click(screen.getByRole("button", { name: "Cycle repeat" }));
    fireEvent.click(screen.getByRole("button", { name: "Cycle repeat" }));
    fireEvent.click(screen.getByRole("button", { name: "Play next remote 1" }));
    toggle(); ended(audio);
    expect(screen.getByTestId("selected").textContent).toBe("local:0");
    expect(upNext()?.split(",")[0]).toBe("jamendo:1");
    next(); expect(screen.getByTestId("selected").textContent).toBe("jamendo:1");
    expect(upNext()).not.toContain("jamendo:1");
  });
  it("initializes an empty queue paused and ignores queueing the current track", () => {
    const { audio } = player();
    fireEvent.click(screen.getByRole("button", { name: "Empty queue" }));
    fireEvent.click(screen.getByRole("button", { name: "Add remote 1" }));
    expect(screen.getByTestId("selected").textContent).toBe("jamendo:1");
    expect(upNext()).toBe("");
    expectIntent(false);
    expect(audio.play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Play next remote 1" }));
    expect(screen.getByTestId("queue").textContent).toBe("jamendo:1");
    expect(screen.getByTestId("queue-notice").textContent).toContain("current track");
  });
  it.each([false, true])("uses one listener owner when a queued song advances (Strict Mode: %s)", strict => {
    const { audio, container, unmount } = player(strict);
    fireEvent.click(screen.getByRole("button", { name: "Play next remote 1" }));
    toggle(); ended(audio); fireEvent.ended(audio);
    expect(screen.getByTestId("selected").textContent).toBe("jamendo:1");
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(container.querySelectorAll("audio")).toHaveLength(1);
    unmount(); fireEvent.ended(audio);
    expect(audio.play).toHaveBeenCalledTimes(2);
  });
  it("queues only playable Jamendo results and retains them across search clearing and navigation", async () => {
    const api = vi.mocked(fetchJamendoTracks);
    api.mockResolvedValueOnce([
      { id: "missing", name: "Missing", artist_name: "Artist", album_name: "Album", duration: 90 },
      { id: "1", name: "Catalog 1", artist_name: "Artist", album_name: "Album", duration: 90,
        audio: "https://example.invalid/1.mp3", shareurl: "https://example.invalid/track/1", license_ccurl: "https://example.invalid/license/1" },
      { id: "2", name: "Catalog 2", artist_name: "Artist", album_name: "Album", duration: 90,
        audio: "https://example.invalid/2.mp3" },
    ]);
    const router = createMemoryRouter([{ element: <><Header /><Controls /><Outlet /><NowPlayingMini /></>, children: [
      { path: "/search", element: <Search /> }, { path: "/songs", element: <Songs /> }, { path: "/queue", element: <Queue /> },
    ] }], { initialEntries: ["/search?q=first"] });
    const view = render(<MusicContextProvider><SearchProvider><RouterProvider router={router} /></SearchProvider></MusicContextProvider>);
    await screen.findByRole("button", { name: "Play Catalog 2 next" });
    expect(screen.getByRole("button", { name: "Play Missing next" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Add Missing to queue" }).hasAttribute("disabled")).toBe(true);
    const audio = view.container.querySelector("audio")!;
    const originalSource = audio.src;
    audio.currentTime = 23;
    fireEvent.click(screen.getByRole("button", { name: "Play Catalog 2 next" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Catalog 1 to queue" }));
    expect(upNext()).toBe("jamendo:2,local:1,local:2,jamendo:1");
    expect(audio.src).toBe(originalSource);
    expect(audio.currentTime).toBe(23);
    expect(audio.play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("link", { name: "Up Next (4)" }));
    expect(router.state.location.pathname).toBe("/queue");
    const panel = screen.getByLabelText("Queue page Up Next, 4 upcoming tracks");
    panel.focus(); expect(document.activeElement).toBe(panel);
    expect(screen.getByRole("link", { name: "View license for Catalog 1" }).getAttribute("href")).toBe("https://example.invalid/license/1");
    api.mockResolvedValueOnce([]);
    await act(async () => { await router.navigate("/search?q=first"); });
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    await waitFor(() => expect(router.state.location.search).toBe(""));
    await act(async () => { await router.navigate("/songs"); });
    expect(upNext()).toBe("jamendo:2,local:1,local:2,jamendo:1");
    expect(view.container.querySelector("audio")).toBe(audio);
    fireEvent.click(screen.getByRole("button", { name: "Play two" }));
    expect(upNext()).toBe("local:2");
    expect(screen.getByTestId("queue-notice").textContent).toContain("replaced Up Next");
  });
});

describe("Phase 4B Up Next controls", () => {
  it.each([false, true])("keeps media and intent while editing the current queue (playing: %s)", playing => {
    const { audio } = player();
    if (playing) toggle();
    audio.currentTime = 29;
    const source = audio.src;
    const calls = [vi.mocked(audio.play).mock.calls.length, vi.mocked(audio.pause).mock.calls.length, vi.mocked(audio.load).mock.calls.length];
    fireEvent.click(screen.getByRole("button", { name: "Move slot 2 up" }));
    expect(screen.getByTestId("up-next").textContent).toBe("local:2,local:1");
    fireEvent.click(screen.getByRole("button", { name: "Remove slot 1" }));
    expect(screen.getByTestId("up-next").textContent).toBe("local:2");
    expect(audio.src).toBe(source);
    expect(audio.currentTime).toBe(29);
    expect([vi.mocked(audio.play).mock.calls.length, vi.mocked(audio.pause).mock.calls.length, vi.mocked(audio.load).mock.calls.length]).toEqual(calls);
    expectIntent(playing);
    next(); expect(screen.getByTestId("selected").textContent).toBe("local:2");
  });
  it("edits one duplicate queue occurrence by slot and keeps the other", () => {
    player();
    fireEvent.click(screen.getByRole("button", { name: "Duplicate queue" }));
    expect(screen.getByTestId("up-next").textContent).toBe("jamendo:1,jamendo:2");
    fireEvent.click(screen.getByRole("button", { name: "Remove slot 1" }));
    expect(screen.getByTestId("up-next").textContent).toBe("jamendo:2");
    expect(screen.getByTestId("selected").textContent).toBe("jamendo:1");
  });
  it("natural completion follows edited order and repeat-one leaves it pending", () => {
    const { audio } = player();
    fireEvent.click(screen.getByRole("button", { name: "Move slot 2 up" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove slot 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Cycle repeat" }));
    fireEvent.click(screen.getByRole("button", { name: "Cycle repeat" }));
    toggle(); ended(audio);
    expect(screen.getByTestId("selected").textContent).toBe("local:0");
    expect(screen.getByTestId("up-next").textContent).toBe("local:2");
    fireEvent.click(screen.getByRole("button", { name: "Cycle repeat" }));
    ended(audio);
    expect(screen.getByTestId("selected").textContent).toBe("local:2");
  });
  it("exposes labelled mobile-friendly edit buttons and keeps edits through mini route changes", () => {
    const view = render(<MusicContextProvider><Controls /><MemoryRouter>
      <Link to="/mini">Mini route</Link><Link to="/">Home route</Link>
      <Routes><Route path="/" element={<NowPlaying />} /><Route path="/mini" element={<NowPlayingMini />} /></Routes>
    </MemoryRouter></MusicContextProvider>);
    fireEvent.click(screen.getByLabelText("Full player Up Next, 2 upcoming tracks"));
    const move = screen.getByRole("button", { name: "Move three up from position 2" });
    expect(move.className).toContain("focus-visible:outline-2");
    fireEvent.click(move);
    expect(screen.getByTestId("up-next").textContent).toBe("local:2,local:1");
    fireEvent.click(screen.getByRole("button", { name: "Remove two from Up Next position 2" }));
    fireEvent.click(screen.getByRole("link", { name: "Mini route" }));
    expect(screen.getByRole("link", { name: "Up Next (1)" })).toBeTruthy();
    expect(view.container.querySelectorAll("audio")).toHaveLength(1);
    fireEvent.click(screen.getByRole("link", { name: "Home route" }));
    expect(screen.getByTestId("up-next").textContent).toBe("local:2");
  });
});
