import { useEffect, useState } from "react";
import { fetchTopTags } from "@/api/lastFM";
import MusicCard from "./MusicCard";
import type { LastFmTag } from "@/types/types";
import { providerMessage } from "@/api/provider-response";

export default function TopTags() {
    const [tags, setTags] = useState<LastFmTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchTopTags(controller.signal)
          .then((data) => { if (!controller.signal.aborted) setTags(data); })
          .catch((error: unknown) => { if (!controller.signal.aborted) setError(providerMessage(error)); })
          .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();

    }, []);

if (loading) {
    return (
         <section className="p-4 text-center">
            <p className="text-gray-500">Loading top tags...</p>
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
                    subtitle={`${tag.taggings} taggings`}
                />
            ))}
        </div>
        </section>
)
}
