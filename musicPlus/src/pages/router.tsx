import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignIn from "@/components/auth/SignIn";
import SignUp from "@/components/auth/SignUp";
import Home from "@/pages/Home";
import Dashboard from "@/components/Dashboard/Dashbaord";
import ForgetPassword from "@/components/auth/ForgetPassword";
import MainLayout from "@/components/MainLayout";
import Album from "@/pages/Album";
import Songs from "./Songs";
import Tracks from "./Tracks";
import Search from "./Search";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Pages that use the main layout */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />

            </MainLayout>
          }
        />

        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />

        <Route
          path="/albums"
          element={
            <MainLayout>
              <Album />
            </MainLayout>
          }
        />
        <Route
          path="/songs"
          element={
            <MainLayout>
              <Songs />
            </MainLayout>
          }
        />
        <Route
          path="/tracks"
          element={
            <MainLayout>
              <Tracks />
            </MainLayout>
          }
        />
        <Route
          path="/search"
          element={
            <MainLayout>
              <Search />
            </MainLayout>
          }
        />

        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/forgetPassword" element={<ForgetPassword />} />

      </Routes>
    </BrowserRouter>
  );
}
