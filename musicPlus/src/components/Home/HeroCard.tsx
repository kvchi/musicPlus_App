import { woman } from "../../assets/images";
import { Link } from "react-router-dom";


export default function HeroCard() {
  return (
    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-2xl text-white flex items-center justify-between py-4 md:py-0">
      <div className= "px-4 md:px-8">
        <p className="uppercase tracking-widest text-sm opacity-80">Recommendation</p>
        <div>
          <h2 className="text-3xl font-bold mt-3">Enjoy listening music with headphone</h2>
        </div>
        <p className="mt-6 ">Discover independent artists, explore global charts, and keep your music close wherever you listen.</p>
        <Link
          to="/search"
          className="inline-block mt-6 bg-white text-black px-6 py-2 rounded-full font-semibold"
        >
          Explore music
        </Link>
      </div>

      <img
        src={woman}
        alt="woman with headphone"
        className="w-[200px] rounded-xl hidden md:block self-end px-4"
      />
    </div>
  )
}
