import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SignIn from "@/components/auth/SignIn";
import SignUp from "@/components/auth/SignUp";
import Home from "@/pages/Home";
import Dashboard from "@/components/Dashboard/Dashboard";
import ForgetPassword from "@/components/auth/ForgetPassword";
import MainLayout from "@/components/MainLayout";
import Album from "@/pages/Album";
import Songs from "./Songs";
import Search from "./Search";
import Queue from "./Queue";
import NotFound from "./NotFound";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="albums" element={<Album />} />
          <Route path="songs" element={<Songs />} />
          <Route path="tracks" element={<Navigate to="/songs" replace />} />
          <Route path="search" element={<Search />} />
          <Route path="queue" element={<Queue />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route
          path="/forgetPassword"
          element={<Navigate to="/forgot-password" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
