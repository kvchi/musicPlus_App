import { NavLink } from "react-router-dom";
import { LiaGlobeAfricaSolid } from "react-icons/lia";
import { Disc, HeadphonesIcon, Home, Music, Search } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/songs", label: "Songs", icon: Music },
  { to: "/albums", label: "Albums", icon: Disc },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const closeOnMobile = () => window.innerWidth < 1024 && onClose();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 bg-black/80 lg:hidden z-30"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full flex flex-col p-6 z-40 bg-black transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-80`}
      >
        <div className="flex items-center gap-3 mb-8 text-white">
          <h1 className="text-xl font-bold">MusicPlus</h1>
          <HeadphonesIcon aria-hidden="true" />
        </div>

        <nav aria-label="Primary navigation" className="space-y-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 ${
                  isActive
                    ? "text-emerald-500 font-semibold"
                    : "text-gray-200 hover:text-white"
                }`
              }
            >
              <Icon size={18} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>

        <section className="mt-10 rounded-xl bg-neutral-900 p-4 text-white">
          <p className="font-semibold">Your Library</p>
          <p className="mt-2 text-sm text-neutral-400">
            Playlist saving is the next feature on the roadmap. For now, explore the demo catalog.
          </p>
        </section>

        <div className="mt-auto text-white">
          <div className="flex items-center gap-2 py-1 px-3 bg-neutral-800 border border-neutral-700 text-sm rounded-lg w-fit">
            <LiaGlobeAfricaSolid aria-hidden="true" />
            <span>English</span>
          </div>
        </div>
      </aside>
    </>
  );
}
