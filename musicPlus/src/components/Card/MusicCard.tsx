import { headphones } from "@/assets/images";

type MusicCardProps = {
  image?: string;
  title: string;
  subtitle?: string;
};

export default function MusicCard({ image, title, subtitle }: MusicCardProps) {
  return (
    <div className="min-w-0 bg-white shadow-md rounded-2xl p-3 flex flex-col items-center text-center hover:shadow-lg transition-all">
      <img
        src={image || headphones}
        alt={title}
        className="w-24 h-24 rounded-full mb-3 object-cover"
      />
      <h3 className="max-w-full break-words font-semibold text-lg">{title}</h3>
      {subtitle && <p className="max-w-full break-words text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}
