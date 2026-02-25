// @ts-nocheck
import React from "react";
import { Route, Routes } from "react-router";
import Home from "../pages/Home";
import MainLayouts from "../Layouts/MainLayouts";
import AuthLayout from "../Layouts/Auth/_layout";
import LoginPage from "../pages/Auth/login";
import ForgotPassword from "../pages/Auth/forgot-password";
import { LoadingProvider } from "../context/Loading";
import DashboardPage from "../pages/Dashboard";
import SettingsPage from "../pages/Settings";

export default function AppRoutes() {
  return (
    <LoadingProvider>
      <Routes>
        <Route path="/" element={<MainLayouts />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settngs" element={<SettingsPage />} />
        </Route>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Routes>
    </LoadingProvider>
  );
}
