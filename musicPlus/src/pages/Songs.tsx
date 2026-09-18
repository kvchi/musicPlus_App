import { playlist } from "@/data/MusicData";

export default function Songs() {
  return (
    <section className="text-white">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
        Local catalog
      </p>
      <h1 className="mt-2 text-3xl font-bold">Demo songs</h1>
      <p className="mt-2 text-neutral-400">
        These bundled tracks power the current player. This catalog is display-only.
      </p>

      <div className="mt-6 grid gap-3">
        {playlist.map((track, index) => (
          <article
            key={track.id}
            className="flex items-center gap-4 rounded-xl bg-neutral-900 p-4"
          >
            <span className="w-6 text-right text-sm text-neutral-500">
              {index + 1}
            </span>
            <img
              src={track.cover}
              alt=""
              className="h-12 w-12 rounded-md object-cover"
            />
            <div className="min-w-0">
              <h2 className="truncate font-semibold">{track.title}</h2>
              <p className="truncate text-sm text-neutral-400">{track.artist}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
