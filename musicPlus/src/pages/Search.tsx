
import { useSearch } from "@/context/SearchContext";


export default function Search() {
  const { results } = useSearch();
  return (
    <section>
            <div>
              {results.map((track) => (
                <div key={track.id} className="py-2 px-6 bg-emerald-300 ">
                  {track.name} - {track.artist_name}-{track.album} -{" "}
                  {track.duration}
                </div>
              ))}
            </div>
          </section>
  )
}
