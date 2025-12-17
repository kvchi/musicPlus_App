// Header.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { BiSearch } from "react-icons/bi";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";


interface HeaderProps {
  onSearch: (q: string) => void;
  onMenuToggle?: () => void;
}

export default function Header({ onSearch, onMenuToggle }: HeaderProps) {
  const [search, setSearch] = React.useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const path =
    location.pathname === "/"
      ? "Home"
      : location.pathname.replace("/", "").charAt(0).toUpperCase() +
        location.pathname.replace("/", "").slice(1);

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-emerald-600 w-full z-50">

      <button
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

      <div className="flex-1 lg:flex justify-center px-2 hidden">
        <div className="bg-green-800 p-2 rounded-full border-white border-2 flex items-center gap-2 w-full max-w-xs md:max-w-sm lg:max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for tracks..."
            className="rounded-full px-3 md:px-6 py-1 w-full bg-transparent text-white outline-none placeholder-white/70 text-sm md:text-base"
          />

          <button
            title="submit"
            onClick={() => {
              onSearch(search)
              navigate("/search")
            }}
            
            className="cursor-pointer text-white text-lg"
          >
            <BiSearch />
          </button>
        </div>
      </div>

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
