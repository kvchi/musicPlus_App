import React, { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header";
import type { Track } from "../types/types";
import { SearchContext } from "@/context/SearchContext";
import { NowPlayingMini } from "@/components/Home/NowPlayingMini"
import { useLocation} from "react-router-dom";


interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [results, setResults] = useState<Track[]>([]);

  const location = useLocation();
  const hideMiniOnRoutes = [
    "/",
  ];

  const hideMini = hideMiniOnRoutes.includes(location.pathname)

  const handleSearch = async (query: string) => {
    const q = encodeURIComponent(query);
    const BASE_URL = import.meta.env.VITE_JAMENDO_API_URL;
    const CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID;

    try {
      const response = await fetch(
        `${BASE_URL}/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=10&search=${q}`
      );
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Error fetching tracks", error);
    }
  };

  return (
    <SearchContext.Provider value={{ results, setResults }}>
      <div className="bg-black min-h-screen flex">

        <div className="hidden lg:block w-80 h-screen fixed left-0 top-0 border-r border-neutral-800">
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>

        <div className="lg:hidden ">
          <Sidebar  isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 lg:ml-80">
          <div className="fixed top-0 left-0 lg:left-80 right-0 z-50">
            <Header
              onSearch={handleSearch}
              onMenuToggle={() => setSidebarOpen(true)}
            />
          </div>

          <div className="mt-[100px] px-6 pb-28">{children}</div>
        </div>
        {!hideMini && <NowPlayingMini />}
      </div>
    </SearchContext.Provider>
  );
}
