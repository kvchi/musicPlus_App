import { ForYouSection } from "@/components/Home/ForYouSection";
import HeroCard from "@/components/Home/HeroCard";
import { NowPlaying } from "@/components/Home/NowPlaying";
import { RecentSection } from "@/components/Home/RecentSection";
import { ViralHitsSection } from "@/components/Home/ViralHitsSection";
import { useSearch } from "@/context/SearchContext";


export default function Home() {
  const { results } = useSearch();

  return (
    <>
      <div className="bg-black min-h-screen">
        <div className="flex-1">
          <h1 className="text-4xl text-emerald-600 font-bold py-4 px- text-center">
            Welcome to music plus
          </h1>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <HeroCard />
                  <ForYouSection />
                  <ViralHitsSection tracks={results}/>
                </div>
                <div className="space-y-6">
                  <RecentSection />
                  <NowPlaying />
                </div>
          </section>
          <section>
           
          </section>
        </div>
      </div>
    </>
  );
}
