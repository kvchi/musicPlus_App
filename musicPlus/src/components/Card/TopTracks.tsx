import { useEffect, useState } from "react";
import { fetchTopTracks } from "@/api/lastFM";
import MusicCard from "./MusicCard";
import type { LastFmTrack } from "@/types/types";
import { providerMessage } from "@/api/provider-response";

export default function TopTracks() {
    const [tracks, setTracks] = useState<LastFmTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchTopTracks(controller.signal)
          .then((data) => { if (!controller.signal.aborted) setTracks(data); })
          .catch((error: unknown) => { if (!controller.signal.aborted) setError(providerMessage(error)); })
          .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();

    }, []);

   if (loading) {
    return (
        <section className="p-4 text-center">
            <p className="text-gray-500">Loading top tracks...</p>
        </section>
    );
   }

   if (error) {
    return (
        <section className="p-4 text-center text-red-500">
            <p>{error}</p>
        </section>
    )
   };

   if (tracks.length === 0) {
    return (
        <section className="p-4 text-center">
            <p className="text-gray-500">No tracks found.</p>
        </section>
    )
}

return (
    <section className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Top Tracks</h2>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {tracks.slice(0,6).map((track) => (
                <MusicCard
                    key={`${track.name}-${track.artist.name}`}
                    image={track.image?.[2]?.["#text"]}
                    title={track.name}
                    subtitle={`${track.listeners} listeners`}
                />
            ))}
        </div>
    </section>
)
}
