import { headphones } from "@/assets/images";

type MusicCardProps = {
  image?: string;
  title: string;
  subtitle?: string;
  onPlay?: () => void;
};

export default function MusicCard({ image, title, subtitle, onPlay }: MusicCardProps) {
  return (
    <div className="min-w-0 bg-white shadow-md rounded-2xl p-3 flex flex-col items-center text-center">
      <img
        src={image || headphones}
        alt={title}
        className="w-24 h-24 rounded-full mb-3 object-cover"
      />
      <h3 className="max-w-full break-words font-semibold text-lg">{title}</h3>
      {subtitle && <p className="max-w-full break-words text-sm text-gray-600">{subtitle}</p>}
      {onPlay && <button type="button" onClick={onPlay} aria-label={`Play ${title}`}
        className="mt-3 min-h-11 rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">Play mix</button>}
    </div>
  );
}
