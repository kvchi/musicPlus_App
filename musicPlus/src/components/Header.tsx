import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { BiSearch } from "react-icons/bi";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Menu } from "lucide-react";

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
    <header className="flex items-center gap-3 px-4 md:px-8 py-4 bg-emerald-600 w-full z-50">
      <button
        type="button"
        aria-label="Open navigation"
        className="lg:hidden text-white"
        onClick={onMenuToggle}
      >
        <Menu size={24} />
      </button>

      <div className="hidden xl:flex items-center gap-2 text-white text-sm md:text-base">
        <p>Home</p>
        <MdOutlineKeyboardArrowRight />
        {path !== "Home" && <p>{path}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex justify-center min-w-0">
        <div className="bg-green-800 p-1.5 sm:p-2 rounded-full border-white border flex items-center gap-1 w-full max-w-md">
          <input
            ref={inputRef}
            aria-label="Search tracks"
            type="search"
            value={search}
            onChange={(event) => updateInput(event.target.value)}
            placeholder="Search tracks..."
            className="[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden rounded-full px-2 sm:px-4 py-1 w-full min-w-0 bg-transparent text-white outline-none placeholder-white/70 text-sm md:text-base"
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
            className="cursor-pointer text-white text-lg p-1 disabled:cursor-wait disabled:opacity-60"
          >
            <BiSearch />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <SignedOut>
          <Link
            to="/sign-in"
            className="hidden sm:block border-2 px-2 py-1 rounded-lg text-white text-xs md:text-sm"
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
            className="hidden sm:block border-2 border-white px-2 py-1 rounded-lg text-white text-xs md:text-sm"
          >
            Dashboard
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
