import { describe, expect, it } from "vitest";
import { adaptJamendoTrack, adaptLocalTrack, hasPlayableAudio } from "@/lib/track-adapters";
import { parseJamendoResponse } from "@/api/jamendo";

const local = { id: 1, title: "Local", artist: "Artist", src: "/local.mp3", cover: "/cover.png" };
const remote = { id: "1", name: "Remote", artist_name: "Artist", album_name: "", duration: 45, audio: "https://example.invalid/stream.mp3" };
const response = (track: unknown) => ({ headers: { status: "success", code: 0 }, results: [track] });

describe("playable track adapters", () => {
  it("maps bundled fields and prevents collisions with provider IDs", () => {
    expect(adaptLocalTrack(local)).toEqual({ id: "local:1", source: "local", title: "Local", artist: "Artist", audioUrl: "/local.mp3", artworkUrl: "/cover.png" });
    expect(adaptJamendoTrack(remote)?.id).toBe("jamendo:1");
    expect(hasPlayableAudio(adaptLocalTrack(local))).toBe(true);
  });
  it("maps stream, singles, duration and supplied attribution/license information", () => {
    const fields = { ...remote, image: "https://example.invalid/art.png", shareurl: "https://www.jamendo.com/track/1", license_ccurl: "https://creativecommons.org/licenses/by/4.0/", audiodownload_allowed: false };
    const parsed = parseJamendoResponse(response(fields))[0];
    const track = adaptJamendoTrack(parsed);
    expect(track).toMatchObject({ audioUrl: remote.audio, title: "Remote", durationSeconds: 45, artworkUrl: fields.image, attributionUrl: fields.shareurl, licenseUrl: fields.license_ccurl, downloadAllowed: false });
    expect(track?.albumTitle).toBeUndefined();
  });
  it.each([undefined, "", "javascript:alert(1)", "https://user:password@example.invalid/audio", "https://example.invalid/audio?token=synthetic"])("rejects missing/unsafe audio (%s)", audio => {
    expect(adaptJamendoTrack({ ...remote, audio })).toBeNull();
  });
  it("never substitutes audiodownload for a missing stream", () => {
    const parsed = parseJamendoResponse(response({ ...remote, audio: "", audiodownload: "https://example.invalid/download.mp3", audiodownload_allowed: true }))[0];
    expect(adaptJamendoTrack(parsed)).toBeNull();
  });
  it("validates provider metadata shapes and drops unsafe attribution URLs", () => {
    expect(() => parseJamendoResponse(response({ ...remote, audiodownload_allowed: "yes" }))).toThrow();
    expect(() => parseJamendoResponse(response({ ...remote, license_ccurl: 1 }))).toThrow();
    const parsed = parseJamendoResponse(response({ ...remote, license_ccurl: "javascript:alert(1)", shareurl: "https://example.invalid/?key=synthetic" }))[0];
    expect(adaptJamendoTrack(parsed)?.licenseUrl).toBeUndefined();
    expect(adaptJamendoTrack(parsed)?.attributionUrl).toBeUndefined();
  });
});
