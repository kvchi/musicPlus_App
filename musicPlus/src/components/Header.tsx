import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { BiSearch } from "react-icons/bi";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("q") ?? "");
  }, [location.search]);

  const path =
    location.pathname === "/"
      ? "Home"
      : location.pathname.replace("/", "").charAt(0).toUpperCase() +
        location.pathname.replace("/", "").slice(1);

  const updateInput = (value: string) => {
    setSearch(value);
    if (value.trim() || location.pathname !== "/search") return;
    const params = new URLSearchParams(location.search);
    if (!params.has("q")) return;
    params.delete("q");
    const remaining = params.toString();
    navigate({ pathname: location.pathname, search: remaining ? `?${remaining}` : "", hash: location.hash }, { replace: true });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = search.trim();
    navigate(normalizedQuery ? `/search?q=${encodeURIComponent(normalizedQuery)}` : "/search");
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-emerald-600 w-full z-50">
      <button
        type="button"
        aria-label="Open navigation"
        className="lg:hidden text-white text-2xl"
        onClick={onMenuToggle}
      >
        ☰
      </button>

      <div className="hidden md:flex items-center gap-2 text-white text-sm md:text-base">
        <p>Home</p>
        <MdOutlineKeyboardArrowRight />
        {path !== "Home" && <p>{path}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 lg:flex justify-center px-2 hidden">
        <div className="bg-green-800 p-2 rounded-full border-white border-2 flex items-center gap-2 w-full max-w-xs md:max-w-sm lg:max-w-md">
          <input
            ref={inputRef}
            aria-label="Search tracks"
            type="search"
            value={search}
            onChange={(event) => updateInput(event.target.value)}
            placeholder="Search for tracks..."
            className="[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden rounded-full px-3 md:px-6 py-1 w-full bg-transparent text-white outline-none placeholder-white/70 text-sm md:text-base"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              className="text-white text-lg p-1"
              onClick={() => { updateInput(""); inputRef.current?.focus(); }}
            >
              ×
            </button>
          )}
          <button
            type="submit"
            aria-label="Search"
            className="cursor-pointer text-white text-lg"
          >
            <BiSearch />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2 md:gap-4">
        <SignedOut>
          <Link
            to="/sign-in"
            className="border-2 px-2 py-1 rounded-lg text-white text-xs md:text-sm"
          >
            Sign In
          </Link>
          <Link
            to="/sign-up"
            className="border-2 px-2 py-1 rounded-lg text-white text-xs md:text-sm"
          >
            Sign Up
          </Link>
        </SignedOut>

        <SignedIn>
          <Link
            to="/dashboard"
            className="border-2 border-white px-2 py-1 rounded-lg text-white text-xs md:text-sm"
          >
            Dashboard
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
