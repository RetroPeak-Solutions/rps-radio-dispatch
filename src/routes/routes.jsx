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
import ErrorFallback from "../Wrappers/Error/ErrorFallback";
import { AppErrorBoundary } from "../Wrappers/Error/AppErrorBoundary";

export default function AppRoutes() {
  return (
    <LoadingProvider>
      <Routes>
        <Route path="/" element={<MainLayouts />} errorElement={<AppErrorBoundary />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="auth" element={<AuthLayout />} errorElement={<AppErrorBoundary />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>
      </Routes>
    </LoadingProvider>
  );
}