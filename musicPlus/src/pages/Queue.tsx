import { UpNextPanel } from "@/components/Home/UpNextPanel";

export default function Queue() {
  return <section className="mx-auto max-w-3xl text-white">
    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Playback queue</p>
    <h1 className="mt-2 text-3xl font-bold">Up Next</h1>
    <UpNextPanel label="Queue page" defaultOpen />
  </section>;
}
