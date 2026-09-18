import { playlist } from "@/data/MusicData";

export function RecentSection() {
  return (
    <section className="bg-[#1a1a1a] p-6 rounded-2xl text-white">
      <h3 className="text-xl font-semibold mb-4">From the demo playlist</h3>
      <div className="space-y-3">
        {playlist.slice(0, 3).map((track) => (
          <div key={track.id} className="flex items-center gap-3">
            <img
              src={track.cover}
              alt=""
              className="h-10 w-10 rounded-md object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{track.title}</p>
              <p className="truncate text-xs text-neutral-400">{track.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
