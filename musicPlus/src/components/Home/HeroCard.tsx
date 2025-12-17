import { woman } from "../../assets/images";


export default function HeroCard() {
  return (
    <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-2xl text-white flex items-center justify-between py-4 md:py-0">
      <div className= "px-4 md:px-8">
        <p className="uppercase tracking-widest text-sm opacity-80">Recommendation</p>
        <div>
          <h2 className="text-3xl font-bold mt-3">Enjoy listening music with headphone</h2>
        </div>
        <p className="mt-6 ">Lorem ipsum dolor sit amet consectetur adipisicing elit. Quis tempora quisquam ad modi dolor laudantium magnam cumque nihil mollitia rem.</p>
        <button className="mt-6 bg-white text-black px-6 py-2 rounded-full font-semibold">
          Subscribe Now
        </button>
      </div>

      <img
        src={woman}
        alt="woman with headphone"
        className="w-[200px] rounded-xl hidden md:block self-end px-4"
      />
    </div>
  )
}
