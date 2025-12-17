import type { ReactNode } from "react";
import { useState } from "react";
import type { Track } from "../types/types";
import { SearchContext } from "./SearchContext";

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [results, setResults] = useState<Track[]>([]);

  return (
    <SearchContext.Provider value={{ results, setResults }}>
      {children}
    </SearchContext.Provider>
  );
};
