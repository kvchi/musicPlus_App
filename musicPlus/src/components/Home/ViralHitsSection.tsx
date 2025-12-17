import type { Track } from "@/types/types"
import { CiPlay1 } from "react-icons/ci";

interface ViralHitsProps {
  tracks: Track[];
}

export function ViralHitsSection({ tracks = [] }: ViralHitsProps) {
  return (
    <section>
      <h3 className="text-xl text-white font-semibold mb-4">Viral and Hits</h3>

      <div className="space-y-3">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-xl text-white"
          >
            <div>
              <p className="font-semibold">{index + 1}. {track.name}</p>
              <p className="text-gray-400 text-sm">{track.artist_name}</p>
            </div>

            <button title="play" className="p-2 bg-emerald-600 rounded-full"><CiPlay1 /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
