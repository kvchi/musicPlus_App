import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MusicContextProvider } from "@/context/MusicContext";
import { useMusicPlayer } from "@/context/music-player-context";
import { NowPlaying } from "@/components/Home/NowPlaying";
import { NowPlayingMini } from "@/components/Home/NowPlayingMini";

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

let media: WeakMap<HTMLMediaElement, { paused: boolean; ended: boolean }>;
function state(audio: HTMLMediaElement) {
  let value = media.get(audio);
  if (!value) { value = { paused: true, ended: false }; media.set(audio, value); }
  return value;
}
function start(audio: HTMLMediaElement, promise = Promise.resolve()) {
  Object.assign(state(audio), { paused: false, ended: false });
  fireEvent.play(audio);
  return promise;
}
beforeEach(() => {
  media = new WeakMap();
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(function (this: HTMLMediaElement) { return state(this).paused; });
  vi.spyOn(HTMLMediaElement.prototype, "ended", "get").mockImplementation(function (this: HTMLMediaElement) { return state(this).ended; });
  vi.spyOn(HTMLMediaElement.prototype, "duration", "get").mockReturnValue(180);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) { return start(this); });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
    const wasPlaying = !state(this).paused;
    state(this).paused = true;
    if (wasPlaying) fireEvent.pause(this);
  });
});

function Controls() {
  const { currentIndex, isPlaying, togglePlay, handleNext, handlePrev } = useMusicPlayer();
  return <>
    <output data-testid="index">{currentIndex}</output>
    <output data-testid="intent">{String(isPlaying)}</output>
    <button onClick={togglePlay}>Toggle playback</button>
    <button onClick={handleNext}>Next track</button>
    <button onClick={handlePrev}>Previous track</button>
  </>;
}
function player(strict = false) {
  const tree = <MusicContextProvider><Controls /><NowPlaying /></MusicContextProvider>;
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { ...view, audio: view.container.querySelector("audio")! };
}
const toggle = () => fireEvent.click(screen.getByRole("button", { name: "Toggle playback" }));
const next = () => fireEvent.click(screen.getByRole("button", { name: "Next track" }));
const previous = () => fireEvent.click(screen.getByRole("button", { name: "Previous track" }));
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
      .mockImplementationOnce(function (this: HTMLMediaElement) { return start(this, latest.promise); });
    const { audio } = player();
    toggle();
    act(() => { next(); previous(); });
    expectIndex(0);
    expect(audio.play).toHaveBeenCalledTimes(2);
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
    toggle(); expectIntent(true);
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
    for (const type of ["play", "pause", "ended", "timeupdate", "loadedmetadata", "emptied"]) {
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
