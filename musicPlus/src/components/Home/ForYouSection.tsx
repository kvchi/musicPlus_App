import MusicCard from "../Card/MusicCard";
import { cover, headphones, woman } from "@/assets/images";

export function ForYouSection() {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-white font-semibold">Demo mixes</h3>
        <span className="text-gray-400 text-sm">Visual previews</span>
      </div>

      <p className="mb-4 text-sm text-neutral-400">These sample mix cards are visual previews and do not start playback.</p>
      <div className="grid grid-cols-3 gap-4">
        <MusicCard image={cover} title="Afrobeats Mix" subtitle="Bright and energetic" />
        <MusicCard image={headphones} title="Focus Mix" subtitle="For deep listening" />
        <MusicCard image={woman} title="Fresh Finds" subtitle="New discoveries" />
      </div>
    </section>
  );
}
