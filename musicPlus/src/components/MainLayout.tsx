import { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header";
import { NowPlayingMini } from "@/components/Home/NowPlayingMini";
import { Outlet, useLocation } from "react-router-dom";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const hideMini = location.pathname === "/";

  return (
    <div className="bg-black min-h-screen flex">

        <div className="hidden lg:block w-80 h-screen fixed left-0 top-0 border-r border-neutral-800">
          <Sidebar isOpen={true} onClose={() => {}} />
        </div>

        <div className="lg:hidden ">
          <Sidebar  isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="min-w-0 flex-1 lg:ml-80">
          <div className="fixed top-0 left-0 lg:left-80 right-0 z-50">
            <Header onMenuToggle={() => setSidebarOpen(true)} />
          </div>

          <main className={`min-w-0 mt-[100px] px-4 sm:px-6 ${hideMini ? "pb-28" : "pb-[26rem] sm:pb-80"}`}>
            <Outlet />
          </main>
        </div>
        {!hideMini && <NowPlayingMini />}
      </div>
  );
}
