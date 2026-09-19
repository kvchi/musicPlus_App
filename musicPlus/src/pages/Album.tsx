import TopAlbums from "@/components/Card/TopAlbums";

export default function Album() {
  return (
    <section className="md:px-8">
      <h1 className="text-3xl font-bold text-white">Album previews</h1>
      <p className="mt-2 text-sm text-neutral-300">Album details here are for discovery. No playable audio has been verified for these albums.</p>

      <div className="mt-10 flex w-full justify-center">
        <div className="flex w-full max-w-5xl flex-col items-center gap-6 rounded-xl bg-gradient-to-tr from-neutral-900 to-green-600/50 p-6 shadow-lg md:flex-row md:p-8">
          <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4" alt="Decorative album artwork preview"
            className="h-40 w-40 rounded-md object-cover md:h-44 md:w-44" />
          <div className="min-w-0 flex-1 text-center text-white md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Concept preview</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">Midnight Reverie</h2>
            <p className="mt-2 text-sm text-gray-300">Sample album artwork and title. No track list or playable source is available.</p>
          </div>
        </div>
      </div>

      <div className="mt-10"><TopAlbums artist="wizkid" /></div>
    </section>
  );
}
