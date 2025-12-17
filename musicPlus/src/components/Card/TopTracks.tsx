import { useEffect, useState } from "react";
import { fetchTopTracks } from "@/api/lastFM";
import MusicCard from "./MusicCard";
import { useNavigate } from "react-router-dom";

interface Track {
  name: string;
  listeners: string;
  image: {
    "#text": string;
  }[];
}

export default function TopTracks() {
    const navigate = useNavigate()

    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTopTracks()
          .then((data) => setTracks(data))
          .catch(() => setError("Failed to load top tracks"))
          .finally(() => setLoading(false));
    
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {tracks.slice(0,6).map((track) => (
                <MusicCard
                    key={track.name}
                    image={track.image?.[2]?.["#text"]}
                    title={track.name}
                    subtitle={`${track.listeners} listeners`}
                />
            ))}
        </div>
         <div className="text-right my-5">
        <button
        onClick={() => navigate("/topTracks")}
        className="text-purple-600 underline hover:font-bold">
            See More
        </button>
      </div>
    </section>
)
}