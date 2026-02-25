import React from "react";
import { Outlet } from "react-router";
import Navbar from "../components/Navbar";

function MainLayouts() {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  );
}

export default MainLayouts;
