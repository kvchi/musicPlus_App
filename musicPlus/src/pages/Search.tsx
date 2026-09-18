import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSearch } from "@/context/SearchContext";

export default function Search() {
  const { results, query, isLoading, error, searchTracks, cancelSearch } = useSearch();
  const [retry, setRetry] = useState(0);
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim() ?? "";

  useEffect(() => {
    void searchTracks(urlQuery);
    return cancelSearch;
  }, [cancelSearch, retry, searchTracks, urlQuery]);
  const matchesQuery = query === urlQuery;
  const visibleResults = matchesQuery && urlQuery && !isLoading && !error ? results : [];
  const loading = Boolean(urlQuery) && (!matchesQuery || isLoading);

  return (
    <section>
      <h1>{urlQuery ? `Results for “${urlQuery}”` : "Find your next favorite track"}</h1>
      {loading && <p role="status">Searching the catalog...</p>}
      {matchesQuery && urlQuery && error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Retry search</button></div>}
      {!loading && matchesQuery && !error && urlQuery && results.length === 0 && <p>No tracks matched your search. Try an artist, song, or genre.</p>}
      {!urlQuery && <p>Use the search box above to explore the Jamendo catalog.</p>}
      <div>{visibleResults.map(track => <div key={track.id} className="py-2 px-6 bg-emerald-300 "><h2>{track.name}</h2><p>{track.artist_name}{track.album_name ? ` · ${track.album_name}` : ""}</p><span>{track.duration}</span></div>)}</div>
    </section>
  );
}
