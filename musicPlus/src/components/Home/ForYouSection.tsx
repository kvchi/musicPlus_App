import MusicCard from "../Card/MusicCard";
import { cover, headphones, woman } from "@/assets/images";
import { hasPlayableAudio, localPlayableCatalog } from "@/lib/track-adapters";
import { useMusicPlayer } from "@/context/music-player-context";

export function ForYouSection() {
  const { playQueue } = useMusicPlayer();
  const mixes = [
    { title: "Wizkid demo mix", subtitle: "Two bundled Wizkid tracks", image: cover, ids: ["local:2", "local:3"] },
    { title: "Full demo mix", subtitle: "All bundled local tracks", image: headphones, ids: localPlayableCatalog.map(track => track.id) },
    { title: "More demo tracks", subtitle: "Three tracks from the local catalog", image: woman, ids: ["local:1", "local:4", "local:6"] },
  ];
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-white font-semibold">Demo mixes</h3>
      </div>

      <p className="mb-4 text-sm text-neutral-400">Play a mix of bundled tracks. Starting one replaces Up Next.</p>
      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-4">
        {mixes.map(mix => {
          const tracks = mix.ids.map(id => localPlayableCatalog.find(track => track.id === id)).filter(track => track !== undefined);
          return <MusicCard key={mix.title} image={mix.image} title={mix.title} subtitle={mix.subtitle}
            onPlay={tracks.length === mix.ids.length && tracks.length > 0 && tracks.every(hasPlayableAudio)
              ? () => playQueue(tracks, 0) : undefined} />;
        })}
      </div>
    </section>
  );
}
