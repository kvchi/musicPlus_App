import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignIn from "@/components/auth/SignIn";
import SignUp from "@/components/auth/SignUp";
import Home from "@/components/Home/Home";
import Dashboard from "@/components/Dashboard/Dashbaord";


export default function Router() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
            </Routes>
           
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} /> 
                </Routes>
            
        </BrowserRouter>
);
}