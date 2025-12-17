import { useEffect, useState } from "react";
import { fetchTopArtist } from "@/api/lastFM";
import MusicCard from "./MusicCard";
import { useNavigate } from "react-router-dom";

interface Artist {
  name: string;
  listeners: string;
  image: {
    "#text": string;
  }[];
}

export default function TopArtists() {
  const navigate = useNavigate()
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopArtist()
      .then((data) => setArtists(data))
      .catch(() => setError("Failed to load top artists"))
      .finally(() => setLoading(false));
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {artists.slice(0,6).map((artist) => (
          <MusicCard
            key={artist.name}
            image={artist.image?.[2]?.["#text"]}
            title={artist.name}
            subtitle={`${artist.listeners} listeners`}
          />
        ))}
      </div>
      <div className="text-right my-5">
        <button
        onClick={() => navigate("/topArtists")}
        className="text-purple-600 underline hover:font-bold">
            See More
        </button>
      </div>
    </section>
  );
}

