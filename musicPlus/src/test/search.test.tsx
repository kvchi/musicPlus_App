import type { ReactNode } from "react";
import { StrictMode } from "react";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJamendoTracks } from "@/api/jamendo";
import { ProviderError } from "@/api/provider-response";
import Header from "@/components/Header";
import { SearchProvider } from "@/context/SearchProvider";
import { MusicContextProvider } from "@/context/MusicContext";
import { useSearch } from "@/context/SearchContext";
import Search from "@/pages/Search";
import Home from "@/pages/Home";
import type { JamendoTrack } from "@/types/types";

vi.mock("@/api/jamendo", () => ({ fetchJamendoTracks: vi.fn() }));
vi.mock("@clerk/clerk-react", () => ({ SignedIn: () => null, SignedOut: ({ children }: { children: ReactNode }) => children, UserButton: () => null }));
const api = vi.mocked(fetchJamendoTracks);
const song = (name: string): JamendoTrack => ({ id: name, name, artist_name: "Artist", album_name: "Album", duration: 65 });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const wrapper = ({ children }: { children: ReactNode }) => <SearchProvider>{children}</SearchProvider>;
function page(initial = "/search?q=first", strict = false) {
  const router = createMemoryRouter([{ element: <><Header /><Outlet /></>, children: [{ path: "/", element: <Home /> }, { path: "/search", element: <Search /> }, { path: "/other", element: <p>Other page</p> }] }], { initialEntries: [initial] });
  const tree = <MusicContextProvider><SearchProvider><RouterProvider router={router} /></SearchProvider></MusicContextProvider>;
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { router, ...view };
}
beforeEach(() => {
  api.mockReset();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

describe("race-safe search state", () => {
  it("ignores superseded responses and keeps the newer request loading", async () => {
    const old = deferred<JamendoTrack[]>(); const latest = deferred<JamendoTrack[]>();
    api.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
    const { result } = renderHook(useSearch, { wrapper });
    let a!: Promise<void>; let b!: Promise<void>;
    act(() => { a = result.current.searchTracks("old"); });
    act(() => { b = result.current.searchTracks("latest"); });
    expect(api.mock.calls[0][1]?.aborted).toBe(true);
    await act(async () => { old.resolve([song("Old")]); await a; });
    expect(result.current.query).toBe("latest");
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    await act(async () => { latest.resolve([song("Latest")]); await b; });
    expect(result.current.results[0].name).toBe("Latest");
    expect(result.current.isLoading).toBe(false);
  });
  it("ignores stale errors and finalizers both before and after a newer success", async () => {
    const old = deferred<JamendoTrack[]>(); const latest = deferred<JamendoTrack[]>();
    api.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
    const { result } = renderHook(useSearch, { wrapper });
    let a!: Promise<void>; let b!: Promise<void>;
    act(() => { a = result.current.searchTracks("old"); b = result.current.searchTracks("latest"); });
    await act(async () => { latest.resolve([song("Latest")]); await b; old.reject(new ProviderError("provider")); await a; });
    expect(result.current.error).toBeNull();
    expect(result.current.results[0].name).toBe("Latest");
    expect(result.current.isLoading).toBe(false);
  });
  it("a stale failure does not stop a pending newer request", async () => {
    const old = deferred<JamendoTrack[]>(); const latest = deferred<JamendoTrack[]>();
    api.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise);
    const { result } = renderHook(useSearch, { wrapper });
    let a!: Promise<void>; let b!: Promise<void>;
    act(() => { a = result.current.searchTracks("old"); b = result.current.searchTracks("latest"); });
    await act(async () => { old.reject(new Error("secret")); await a; });
    expect(result.current.error).toBeNull(); expect(result.current.isLoading).toBe(true);
    await act(async () => { latest.resolve([]); await b; });
  });
  it("empty queries cancel and reset results, loading, query and errors", async () => {
    const old = deferred<JamendoTrack[]>();
    api.mockReturnValueOnce(old.promise);
    const { result } = renderHook(useSearch, { wrapper });
    let pending!: Promise<void>;
    act(() => { pending = result.current.searchTracks("old"); });
    await act(async () => { await result.current.searchTracks("   "); old.resolve([song("Old")]); await pending; });
    expect(result.current).toMatchObject({ query: "", results: [], error: null, isLoading: false });
    expect(api).toHaveBeenCalledTimes(1);
  });
  it("clears previous results immediately on a new search and clears errors on reset", async () => {
    api.mockResolvedValueOnce([song("Old")]).mockRejectedValueOnce(new ProviderError("provider"));
    const { result } = renderHook(useSearch, { wrapper });
    await act(async () => { await result.current.searchTracks("old"); });
    await act(async () => { await result.current.searchTracks("new"); });
    expect(result.current.results).toEqual([]); expect(result.current.error).toBeTruthy();
    await act(async () => { await result.current.searchTracks(""); });
    expect(result.current.error).toBeNull();
  });
});

describe("URL ownership and rendered results", () => {
  it("keeps Home's demo list stable after searching without another provider request", async () => {
    api.mockResolvedValue([song("Remote search match")]);
    const { router } = page("/");
    expect(screen.getAllByText("From the demo playlist")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Play Luv" })).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "rock" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Remote search match");
    await act(async () => { await router.navigate("/"); });
    expect(screen.getByRole("button", { name: "Play Luv" })).toBeTruthy();
    expect(screen.queryByText("Remote search match")).toBeNull();
    expect(api).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll("audio")).toHaveLength(1);
  });
  it("header submission starts one page-owned request, renders album_name, and empty submission resets", async () => {
    api.mockResolvedValue([song("Result")]);
    const { router } = page("/search");
    expect(api).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "  rock & pop  " } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Result");
    expect(router.state.location.search).toBe("?q=rock%20%26%20pop");
    expect(api).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Artist · Album")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: " " } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("Use the search box above to explore the Jamendo catalog.");
    expect(screen.queryByText("Result")).toBeNull(); expect(api).toHaveBeenCalledTimes(1);
  });
  it("offers working retry for the same URL and distinguishes an error from an empty success", async () => {
    api.mockRejectedValueOnce(new ProviderError("provider")).mockResolvedValueOnce([]);
    const { router } = page();
    fireEvent.click(await screen.findByRole("button", { name: "Retry search" }));
    await screen.findByText("No tracks matched your search. Try an artist, song, or genre.");
    expect(router.state.location.search).toBe("?q=first"); expect(api).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("rapid URL changes and back/forward navigation stay associated with the current query", async () => {
    const old = deferred<JamendoTrack[]>();
    api.mockReturnValueOnce(old.promise).mockResolvedValueOnce([song("Second result")]).mockResolvedValueOnce([song("First result")]).mockResolvedValueOnce([song("Second result")]);
    const { router } = page();
    await act(async () => { await router.navigate("/search?q=second"); });
    await screen.findByText("Second result");
    await act(async () => { old.resolve([song("Stale result")]); await old.promise; });
    expect(screen.queryByText("Stale result")).toBeNull();
    await act(async () => { await router.navigate(-1); });
    await screen.findByText("First result");
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("first");
    await act(async () => { await router.navigate(1); });
    await screen.findByText("Second result");
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("second");
  });
  it("cancels on page unmount", async () => {
    const pending = deferred<JamendoTrack[]>(); api.mockReturnValueOnce(pending.promise);
    const { router } = page();
    await act(async () => { await router.navigate("/other"); });
    expect(api.mock.calls[0][1]?.aborted).toBe(true);
    await act(async () => { pending.reject(new Error("late error")); await Promise.resolve(); });
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("StrictMode cleanup aborts its first effect request without publishing a stale failure", async () => {
    const old = deferred<JamendoTrack[]>();
    api.mockReturnValueOnce(old.promise).mockResolvedValueOnce([song("Current result")]);
    page(undefined, true);
    await screen.findByText("Current result");
    expect(api.mock.calls[0][1]?.aborted).toBe(true);
    await act(async () => { old.reject(new Error("stale")); await Promise.resolve(); });
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});


describe("immediate input clearing", () => {
  it.each(["", "   "])("clears the URL and results without submission for input %j", async (value) => {
    api.mockResolvedValue([song("Existing result")]);
    const { router } = page("/search?q=x&view=compact#catalog");
    await screen.findByText("Existing result");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value } });
    await screen.findByText("Use the search box above to explore the Jamendo catalog.");
    expect(router.state.location.search).toBe("?view=compact");
    expect(router.state.location.hash).toBe("#catalog");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(screen.queryByText("Existing result")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("the clear control empties the input, replaces the URL, and retains focus", async () => {
    api.mockResolvedValue([song("Existing result")]);
    const { router } = page();
    await screen.findByText("Existing result");
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    input.focus();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(router.state.location.search).toBe("");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(screen.queryByText("Existing result")).toBeNull();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it.each(["success", "failure"])("clearing aborts a pending request and ignores its late %s", async (outcome) => {
    const pending = deferred<JamendoTrack[]>();
    api.mockReturnValueOnce(pending.promise);
    const { router } = page();
    expect(screen.getByRole("status")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    expect(router.state.location.search).toBe("");
    expect(api.mock.calls[0][1]?.aborted).toBe(true);
    expect(screen.queryByRole("status")).toBeNull();
    await act(async () => {
      if (outcome === "success") pending.resolve([song("Late result")]);
      else pending.reject(new ProviderError("provider"));
      await Promise.resolve();
    });
    expect(screen.queryByText("Late result")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(api).toHaveBeenCalledTimes(1);
  });

  it("clearing removes an existing provider error", async () => {
    api.mockRejectedValueOnce(new ProviderError("provider"));
    page();
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Retry search" })).toBeNull();
  });

  it("nonempty typing waits for submission; clearing replaces only the current history entry", async () => {
    api.mockImplementation(async (query) => [song(query + " result")]);
    const { router } = page("/search");
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "first" } });
    expect(api).not.toHaveBeenCalled();
    expect(router.state.location.search).toBe("");
    fireEvent.submit(input.closest("form")!);
    await screen.findByText("first result");
    expect(router.state.historyAction).toBe("PUSH");
    fireEvent.change(input, { target: { value: "second" } });
    expect(api).toHaveBeenCalledTimes(1);
    expect(router.state.location.search).toBe("?q=first");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByText("second result");
    expect(router.state.historyAction).toBe("PUSH");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(router.state.historyAction).toBe("REPLACE");
    await act(async () => { await router.navigate(-1); });
    await screen.findByText("first result");
    expect((input as HTMLInputElement).value).toBe("first");
    await act(async () => { await router.navigate(1); });
    expect(router.state.location.search).toBe("");
    expect((input as HTMLInputElement).value).toBe("");
    expect(screen.queryByText("second result")).toBeNull();
    expect(api).toHaveBeenCalledTimes(3);
  });

  it("clearing on an unrelated route never changes its URL or starts search", () => {
    const { router } = page("/other?q=keep&view=compact");
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    expect(router.state.location.pathname).toBe("/other");
    expect(router.state.location.search).toBe("?q=keep&view=compact");
    fireEvent.change(input, { target: { value: "draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(router.state.location.search).toBe("?q=keep&view=compact");
    expect(api).not.toHaveBeenCalled();
  });
});
