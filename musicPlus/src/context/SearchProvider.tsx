import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "../types/types";
import { SearchContext } from "./SearchContext";
import { fetchJamendoTracks } from "@/api/jamendo";
import { providerMessage } from "@/api/provider-response";

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [results, setResults] = useState<Track[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const cancelSearch = useCallback(() => {
    requestId.current += 1;
    controller.current?.abort();
    controller.current = null;
  }, []);

  useEffect(() => cancelSearch, [cancelSearch]);

  const searchTracks = useCallback(async (searchQuery: string) => {
    const normalizedQuery = searchQuery.trim();
    cancelSearch();
    const id = requestId.current;
    setQuery(normalizedQuery);
    setResults([]);
    setError(null);

    if (!normalizedQuery) {
      setIsLoading(false);
      return;
    }

    const activeController = new AbortController();
    controller.current = activeController;
    setIsLoading(true);

    try {
      const tracks = await fetchJamendoTracks(normalizedQuery, activeController.signal);
      if (id === requestId.current) setResults(tracks);
    } catch (searchError) {
      if (id === requestId.current && !activeController.signal.aborted) setError(providerMessage(searchError));
    } finally {
      if (id === requestId.current) {
        setIsLoading(false);
        controller.current = null;
      }
    }
  }, [cancelSearch]);

  return (
    <SearchContext.Provider
      value={{ results, query, isLoading, error, searchTracks, cancelSearch }}
    >
      {children}
    </SearchContext.Provider>
  );
};
