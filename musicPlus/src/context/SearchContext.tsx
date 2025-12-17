import { createContext, useContext } from "react";
import type { Track } from "../types/types";

interface SearchContextType {
  results: Track[];
  setResults: (tracks: Track[]) => void;
}

export const SearchContext = createContext<SearchContextType | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
