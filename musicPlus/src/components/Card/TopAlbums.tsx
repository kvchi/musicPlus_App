import { useEffect, useState } from "react";
import { fetchArtistTopAlbums } from "@/api/lastFM";
import MusicCard from "./MusicCard";
import type { LastFmAlbum } from "@/types/types";
import { providerMessage } from "@/api/provider-response";

interface TopAlbumsProps {
    artist: string;
}

export default function TopAlbums({artist} : TopAlbumsProps) {
  const [albums, setAlbums] = useState<LastFmAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setAlbums([]);
    fetchArtistTopAlbums(artist, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setAlbums(data); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setError(providerMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [artist]);

  if (loading) {
    return (
      <section className="p-4 text-center">
        <p className="text-gray-500">Loading top albums...</p>
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

  if (!albums || albums.length === 0) {
    return (
      <section className="p-4 text-center">
        <p className="text-gray-500">No albums found.</p>
      </section>
    );
  }

  return (
    <section className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-white">Top Albums</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {albums.slice(0, 6).map((album) => (
          <MusicCard
            key={`${album.name}-${album.artist?.name ?? artist}`}
            image={album.image?.[2]?.["#text"]}
            title={album.name}
            subtitle={album.artist?.name ?? artist}
          />
        ))}
      </div>
    </section>
  );
}
