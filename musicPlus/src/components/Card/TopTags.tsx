import { useEffect, useState } from "react";
import { fetchTopTags } from "@/api/lastFM";
import MusicCard from "./MusicCard";
import { useNavigate } from "react-router-dom";

interface Tag {
  name: string;
  count: number;
}

export default function TopTags() {
    const navigate = useNavigate()

    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTopTags()
          .then((data) => setTags(data))
          .catch(() => setError("Failed to load top tags"))
          .finally(() => setLoading(false));
    
    }, []);

if (loading) {
    return (
         <section className="p-4 text-center">
            <p className="text-gray-500">Loading top tracks...</p>
        </section>
    )
}

if (error) {
    return (
        <section className="p-4 text-center text-red-500">
            <p>{error}</p>
        </section>
    )
}

if (tags.length === 0) {
    return (
        <section className="p-4 text-center">
            <p className="text-gray-500">No tags found.</p>
        </section>
    )
}

return (
    <section className="p-4">
        <h2 className="text-2xl font-bold mb-4 text-white">Top Tags</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {tags.slice(0,6).map((tag) => (
                <MusicCard
                    key={tag.name}
                    title={tag.name}
                    subtitle={`${tag.count} tracks`}
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