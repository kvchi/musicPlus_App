import { describe, expect, it, vi } from "vitest";
import { fetchJamendoTracks, parseJamendoResponse } from "@/api/jamendo";
import { fetchTopArtist, fetchTopTags, parseTopAlbums, parseTopArtists, parseTopTags, parseTopTracks } from "@/api/lastFM";
import { ProviderError, providerMessage } from "@/api/provider-response";

const song = { id: "1", name: "Song", artist_name: "Artist", album_name: "Album", duration: 65 };
const jamendo = (results: unknown = []) => ({ headers: { status: "success", code: 0 }, results });
const response = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

describe("provider boundaries", () => {
  it("retains Jamendo album_name and accepts genuine empty results", () => {
    expect(parseJamendoResponse(jamendo([song]))[0].album_name).toBe("Album");
    expect(parseJamendoResponse(jamendo())).toEqual([]);
  });
  it.each([{}, { results: [] }, jamendo(null), jamendo([{}]), jamendo([{ ...song, duration: -1 }]), jamendo([{ ...song, album_name: undefined }])])("rejects malformed Jamendo shapes", (body) => {
    expect(() => parseJamendoResponse(body)).toThrow(new ProviderError("shape"));
  });
  it("does not mistake a Jamendo provider error for empty results or expose its message", () => {
    expect(() => parseJamendoResponse({ headers: { status: "failed", code: 5, error_message: "secret synthetic-key https://example.invalid/?api_key=secret" }, results: [] }))
      .toThrow(new ProviderError("provider"));
  });
  it("retains Last.fm taggings without inventing a track count", () => {
    expect(parseTopTags({ tags: { tag: [{ name: "rock", reach: "10", taggings: "20" }] } }))
      .toEqual([{ name: "rock", reach: "10", taggings: "20" }]);
  });
  it.each([
    [parseTopArtists, { artists: { artist: [] } }],
    [parseTopTracks, { tracks: { track: [] } }],
    [parseTopTags, { tags: { tag: [] } }],
    [parseTopAlbums, { topalbums: { album: [] } }],
  ])("accepts each Last.fm empty collection but rejects missing collections and provider failures", (parse, empty) => {
    expect(parse(empty)).toEqual([]);
    expect(() => parse({})).toThrow(new ProviderError("shape"));
    expect(() => parse({ error: 10, message: "synthetic-secret" })).toThrow(new ProviderError("provider"));
  });
  it("checks Last.fm records and supports absent album artist/artwork", () => {
    expect(parseTopArtists({ artists: { artist: [{ name: "Artist", listeners: "10" }] } })[0].name).toBe("Artist");
    expect(parseTopTracks({ tracks: { track: [{ name: "Song", listeners: "5", artist: { name: "Artist" } }] } })[0].artist.name).toBe("Artist");
    expect(parseTopAlbums({ topalbums: { album: [{ name: "Album" }] } })[0].name).toBe("Album");
    expect(() => parseTopTags({ tags: { tag: [{ name: "rock", count: 5 }] } })).toThrow(new ProviderError("shape"));
    expect(() => parseTopTracks({ tracks: { track: [{ name: "Song", listeners: "5" }] } })).toThrow(new ProviderError("shape"));
  });
  it("drops credential-bearing asset URLs", () => {
    const result = parseJamendoResponse(jamendo([{ ...song, image: "https://example.invalid/image?api_key=secret", audio: "https://user:secret@example.invalid/audio" }]));
    expect(result[0].image).toBeUndefined();
    expect(result[0].audio).toBeUndefined();
    expect(parseTopArtists({ artists: { artist: [{ name: "Artist", listeners: "10", image: [{ "#text": "https://example.invalid/image?token=secret" }] }] } })[0].image?.[0]["#text"]).toBe("");
  });
  it.each([fetchJamendoTracks.bind(null, "rock"), fetchTopArtist])("checks HTTP, network and JSON failures with safe messages", async (fetchTracks) => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}, false));
    await expect(fetchTracks()).rejects.toThrow(new ProviderError("http"));
    vi.mocked(fetch).mockRejectedValueOnce(new Error("secret URL https://example.invalid/?api_key=secret"));
    await expect(fetchTracks()).rejects.toThrow(new ProviderError("network"));
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => { throw new Error("secret JSON"); } } as unknown as Response);
    await expect(fetchTracks()).rejects.toThrow(new ProviderError("shape"));
    expect(providerMessage(new Error("secret"))).not.toContain("secret");
  });
  it("rejects missing and credential-bearing configuration without a request", async () => {
    vi.stubEnv("VITE_JAMENDO_CLIENT_ID", "");
    await expect(fetchJamendoTracks("rock")).rejects.toThrow(new ProviderError("configuration"));
    vi.stubEnv("VITE_BASE_URL", "https://user:secret@example.invalid/2.0/");
    await expect(fetchTopTags()).rejects.toThrow(new ProviderError("configuration"));
    expect(fetch).not.toHaveBeenCalled();
  });
  it("checks provider errors after an HTTP-success response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({ headers: { status: "failed", code: 5 }, results: [] }));
    await expect(fetchJamendoTracks("rock")).rejects.toThrow(new ProviderError("provider"));
    vi.mocked(fetch).mockResolvedValueOnce(response({ error: 10, message: "secret" }));
    await expect(fetchTopTags()).rejects.toThrow(new ProviderError("provider"));
  });
});
