import { FaMusic, FaPlay, FaRegClock } from "react-icons/fa";
import { CiPlay1 } from "react-icons/ci";
import { IoIosShuffle } from "react-icons/io";
import TopAlbums from "@/components/Card/TopAlbums";

export default function Album() {
  return (
    <section className=" md:px-8">
      
      <div className="mt-10 w-full flex justify-center">
        <div className="bg-gradient-to-tr from-neutral-900 to-green-600/50 w-full max-w-5xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-lg rounded-xl">

          {/* Album Cover */}
          <img
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4"
            alt="Album"
            className="w-40 h-40 md:w-44 md:h-44 object-cover rounded-md"
          />

          {/* Album Info */}
          <div className="flex-1 text-white text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Midnight Reverie
            </h2>

            <p className="text-gray-400 text-sm">By Dave</p>

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-gray-300 text-sm mt-3">
              <span className="flex items-center gap-1">
                <FaMusic /> 10 songs
              </span>

              <div className="flex items-center gap-1">
                <FaRegClock />
                <p>1 hr 30 mins</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-5">
              
              <button className="flex items-center gap-2 bg-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700">
                <CiPlay1 /> Play all
              </button>

              <button className="flex items-center gap-2 bg-emerald-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-neutral-600">
                <IoIosShuffle /> Shuffle
              </button>

              <button className="px-3 py-2 rounded-full border border-gray-500 text-sm hover:bg-neutral-800">
                More
              </button>
            </div>
          </div>

          {/* Play Button */}
          <button
            title="play"
            className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green-300/80 flex justify-center items-center hover:bg-green-600/80"
          >
            <span className="text-black text-lg">
              <FaPlay />
            </span>
          </button>

        </div>
      </div>

      {/* Top Albums Section */}
      <div className="mt-10">
        <TopAlbums artist="wizkid" />
      </div>

    </section>
  );
}