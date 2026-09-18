import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("VITE_JAMENDO_API_URL", "https://example.invalid/v3.0");
  vi.stubEnv("VITE_JAMENDO_CLIENT_ID", "synthetic-client");
  vi.stubEnv("VITE_BASE_URL", "https://example.invalid/2.0/");
  vi.stubEnv("VITE_LASTFM_API_KEY", "synthetic-key");
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Unexpected network request in test"))));
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
