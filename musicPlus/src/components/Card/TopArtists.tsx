import { useEffect, useState } from "react";
import { fetchTopArtist } from "@/api/lastFM";
import MusicCard from "./MusicCard";
import type { LastFmArtist } from "@/types/types";
import { providerMessage } from "@/api/provider-response";

export default function TopArtists() {
  const [artists, setArtists] = useState<LastFmArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchTopArtist(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setArtists(data); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setError(providerMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <section className="p-4 text-center">
        <p className="text-gray-500">Loading top artists...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-4 text-center text-red-500">
        <p>{error}</p>
      </section>
    );
  }

  if (artists.length === 0) {
    return (
      <section className="p-4 text-center">
        <p className="text-gray-500">No artists found.</p>
      </section>
    );
  }

  return (
    <section className="p-4 ">
      <h2 className="text-2xl font-bold mb-4 text-white">Top Artists</h2>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {artists.slice(0,6).map((artist) => (
          <MusicCard
            key={artist.name}
            image={artist.image?.[2]?.["#text"]}
            title={artist.name}
            subtitle={`${artist.listeners} listeners`}
          />
        ))}
      </div>
    </section>
  );
}

