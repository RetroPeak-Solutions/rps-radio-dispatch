import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { Radio, LayoutDashboard, House, LogOut, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./UI/Button";
import { AuthUser, AuthLogout } from "../utils/link";
import axios from "axios";

export default function Navbar() {
  const location = useLocation();
  const currentPathname = location.pathname;
  const pathSegments = currentPathname.split("/");
  const routePrefix = pathSegments[1];
  const navigate = useNavigate();
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {

        const res = await axios.get(AuthUser(), {
          withCredentials: true,
        });

        if (res.data.ok) return;
        const data = await res.data;
        if (!data.user) {
          navigate("/auth/login");
        }
        if (mounted) {
          setIsSystemAdmin(Boolean(data?.user?.systemAdmin?.isActive));
        }
      } catch {
        // noop
      }
    };
    void loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await axios.post(AuthLogout(), null, {
      withCredentials: true,
    })
    navigate("/auth/login");
  };

  return (
     <header className="select-none fixed left-6 right-6 top-4 z-50 rounded-2xl border border-white/15 bg-[#0C1524]/80 px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-2 text-white">
            <span className="rounded-lg bg-[#3C83F6]/20 p-2 text-[#8DB6FF]">
              <Radio className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">RetroRadio | Dispatch</span>
          </NavLink>

          <nav className="flex items-center gap-2">
            {/* <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isActive ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"
                }`
              }
              end
            >
              <House className="h-4 w-4" /> Home
            </NavLink> */}
            {/* {pathSegments === "/" && (
              <>Test</>
            )} */}
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isActive ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
            {/* <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isActive ? "bg-white/15 text-white" : "text-gray-300 hover:bg-white/10"
                }`
              }
            >
              <UserCog className="h-4 w-4" /> Account
            </NavLink> */}
            <Button onClick={handleLogout} className="flex items-center gap-2 rounded-lg cursor-pointer bg-[#f63c3c1a] border border-[#f63c3c1a] text-[#f63c3c]">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </nav>
        </div>
      </header>
  );
}
