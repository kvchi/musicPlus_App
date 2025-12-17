type MusicCardProps = {
  image?: string;
  title: string;
  subtitle?: string;
};

export default function MusicCard({ image, title, subtitle }: MusicCardProps) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-3 flex flex-col items-center text-center hover:shadow-lg transition-all">
      <img
        src={image || "https://via.placeholder.com/150"}
        alt={title}
        className="w-24 h-24 rounded-full mb-3 object-cover"
      />
      <h3 className="font-semibold text-lg">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}

