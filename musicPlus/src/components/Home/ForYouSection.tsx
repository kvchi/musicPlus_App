import MusicCard from "../Card/MusicCard";

export function ForYouSection() {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl text-white font-semibold">For You</h3>
        <button className="text-gray-400 text-sm">View more</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MusicCard image="/mix1.jpg" title="#Mix 1" subtitle="Listening day 1" />
        <MusicCard image="/mix2.jpg" title="#Mix 2" subtitle="Listening day 2" />
        <MusicCard image="/mix3.jpg" title="#Mix 3" subtitle="Listening day 3" />
      </div>
    </section>
  );
}
