import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center text-center text-white">
      <p className="text-emerald-400 font-semibold">404</p>
      <h1 className="text-4xl font-bold mt-2">This track went missing</h1>
      <p className="text-neutral-400 mt-3 max-w-md">
        The page you requested does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-emerald-500 px-5 py-2 font-semibold text-black hover:bg-emerald-400"
      >
        Return home
      </Link>
    </section>
  );
}
