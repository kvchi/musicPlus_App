import { SignedIn, SignedOut } from "@clerk/clerk-react";
import TopArtists from "../Card/TopArtists";
import TopTracks from "../Card/TopTracks";
import TopTags from "../Card/TopTags";

export default function Dashboard() {
  return (
    <section className="bg-black/40 px-0 sm:px-4">
      <SignedIn>
        <h1 className="px-4 text-3xl font-bold text-white">Global discovery</h1>
        <TopArtists />
        <TopTracks />
        <TopTags />
      </SignedIn>

      <SignedOut>
        <div className="rounded-xl bg-neutral-900 p-6 text-center text-white">
          <h1 className="text-2xl font-bold">Sign in to open your dashboard</h1>
          <p className="mt-2 text-neutral-400">
            Explore global artist, track, and tag charts after signing in.
          </p>
        </div>
      </SignedOut>
    </section>
  );
}
