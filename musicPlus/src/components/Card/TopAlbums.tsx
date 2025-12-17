import { useEffect, useState } from "react";
import { fetchArtistTopAlbums } from "@/api/lastFM";
import MusicCard from "./MusicCard";
import { useNavigate } from "react-router-dom";

interface Album {
  name: string;
  playcount: string;
  artist: {
    name: string;
  };
  image: {
    "#text": string;
  }[];
}

interface TopAlbumsProps {
    artist: string;
}

export default function TopAlbums({artist} : TopAlbumsProps) {
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArtistTopAlbums(artist)
      .then((data) => setAlbums(data))
      .catch(() => setError("Failed to load top albums"))
      .finally(() => setLoading(false));
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {albums.slice(0, 6).map((album) => (
          <MusicCard
            key={`${album.name}-${album.artist.name}`}
            image={album.image?.[2]?.["#text"]}
            title={album.name}
            subtitle={album.artist.name}
          />
        ))}
      </div>

      <div className="text-right my-5">
        <button
          onClick={() => navigate("/topAlbums")}
          className="text-purple-600 underline hover:font-bold"
        >
          See More
        </button>
      </div>
    </section>
  );
}
