export type ProviderFailure = "configuration" | "http" | "provider" | "shape" | "network";
const messages: Record<ProviderFailure, string> = {
  configuration: "Music service is not configured correctly.",
  http: "Music service is temporarily unavailable. Please try again.",
  provider: "Music service could not complete the request. Please try again.",
  shape: "Music service returned an unexpected response. Please try again.",
  network: "Unable to reach the music service. Please try again.",
};
/** Retain only fixed public errors, never provider messages or credential-bearing URLs. */
export class ProviderError extends Error {
  readonly kind: ProviderFailure;
  constructor(kind: ProviderFailure) {
    super(messages[kind]);
    this.name = "ProviderError";
    this.kind = kind;
  }
}
export function providerMessage(error: unknown): string {
  return messages[error instanceof ProviderError ? error.kind : "network"];
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function providerUrl(base: string | undefined): URL {
  try {
    if (!base) throw new Error();
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error();
    return url;
  } catch { throw new ProviderError("configuration"); }
}
export function safeAssetUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const sensitive = /^(api[_-]?key|key|token|access[_-]?token|client[_-]?secret|password|signature|authorization)$/i;
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
        [...url.searchParams.keys()].some((key) => sensitive.test(key))) return undefined;
    return value;
  } catch { return undefined; }
}
export async function requestJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new ProviderError("http");
    try { return await response.json(); }
    catch {
      if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
      throw new ProviderError("shape");
    }
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("network");
  }
}
