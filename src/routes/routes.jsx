// @ts-nocheck
import React from "react";
import { Route, Routes } from "react-router";
import Home from "../pages/Home";
import MainLayouts from "../Layouts/MainLayouts";
import AuthLayout from "../Layouts/Auth/_layout";
import LoginPage from "../pages/Auth/login";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayouts />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}
