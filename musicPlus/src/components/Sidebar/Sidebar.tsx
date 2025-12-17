import { NavLink } from "react-router-dom";
import { LiaGlobeAfricaSolid } from "react-icons/lia";

import {
  Home,
  Search,
  Music,
  Plus,
  Disc,
  ListMusic,
  HeadphonesIcon,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black lg:hidden z-30"
          onClick={onClose}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-full   
           
          flex flex-col p-6 z-40
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0 " : "-translate-x-full"}
          lg:translate-x-0 w-80
        `}
      >
        <div className="flex items-center gap-3 mb-8 text-white">
          <h1>MusicPluz</h1>
          <HeadphonesIcon />
        </div>

        <nav className="space-y-4">
          <NavLink
            to="/"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 ${
                isActive
                  ? "text-emerald-500 font-semibold"
                  : "text-gray-200 hover:text-white"
              }`
            }
          >
            <Home size={18} /> Home
          </NavLink>

          <NavLink
            to="/search"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 ${
                isActive
                  ? "text-emerald-500 font-semibold"
                  : "text-gray-200 hover:text-white"
              }`
            }
          >
            <Search size={18} /> Search
          </NavLink>

          <NavLink
            to="/songs"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 ${
                isActive
                  ? "text-emerald-500 font-semibold"
                  : "text-gray-200 hover:text-white"
              }`
            }
          >
            <Music size={18} /> Songs
          </NavLink>

          <NavLink
            to="/albums"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 ${
                isActive
                  ? "text-emerald-500 font-semibold"
                  : "text-gray-200 hover:text-white"
              }`
            }
          >
            <Disc size={18} /> Albums
          </NavLink>

          <NavLink
            to="/tracks"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={({ isActive }) =>
              `flex items-center gap-3 ${
                isActive
                  ? "text-emerald-500 font-semibold"
                  : "text-gray-200 hover:text-white"
              }`
            }
          >
            <ListMusic size={18} /> Tracks
          </NavLink>
        </nav>

        <div className="mt-10 ">
          <div className="flex items-center justify-between text-gray-400 mb-3 ">
            <span>Your Library</span>
            <Plus size={16} />
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-b  to-green-400 rounded-lg text-white">
              <p className="font-semibold">Midnight Reverie</p>
              <p className="text-xs opacity-80">By Solstice Dreamers</p>
              <button className="mt-3 py-1 px-3 text-sm bg-white text-black rounded-md">
                Edit playlist
              </button>
            </div>

            <div className="p-4 bg-gradient-to-b from-neutral-800 rounded-lg">
              <p className="font-semibold text-white">
                Create your first playlist
              </p>
              <p className="text-xs opacity-60">It’s easy, we’ll help you</p>
              <button className="mt-3 py-1 px-3 text-sm bg-white text-black rounded-md">
                Create playlist
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto text-white">
          <button className="flex items-center gap-2 py-1 px-3 bg-neutral-800 border border-neutral-700 text-sm rounded-lg">
            <LiaGlobeAfricaSolid />
            <p>English</p>
          </button>
        </div>
      </div>
    </>
  );
}
