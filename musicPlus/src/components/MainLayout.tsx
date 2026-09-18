import React, { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header";
import { NowPlayingMini } from "@/components/Home/NowPlayingMini"
import { useLocation} from "react-router-dom";


interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();
  const hideMiniOnRoutes = [
    "/",
  ];

  const hideMini = hideMiniOnRoutes.includes(location.pathname)


  return (
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
              onMenuToggle={() => setSidebarOpen(true)}
            />
          </div>

          <div className="mt-[100px] px-6 pb-28">{children}</div>
        </div>
        {!hideMini && <NowPlayingMini />}
      </div>
  );
}
