import React, { type JSX } from "react";
import { Route, Routes } from "react-router";

import MainLayouts from "@layouts/MainLayout";
import AuthLayout from "@layouts/Auth/_layout";

import LoginPage from "@pages/Auth/login";
import ForgotPassword from "@pages/Auth/forgot-password";
import DashboardPage from "@pages/Dashboard";
import CommunityConsole from "@pages/community/console";

import { LoadingProvider } from "@context/Loading";
import { AppErrorBoundary } from "@wrappers/Error/AppErrorBoundary";

export default function AppRoutes(): JSX.Element {
    return (
        <AppErrorBoundary>
            <LoadingProvider>
                <Routes>
                    <Route
                        path="/"
                        element={<MainLayouts />}
                    // errorElement={<AppErrorBoundary />}
                    >
                        <Route index element={<DashboardPage />} />
                    </Route>

                    <Route
                        path=":id"
                        element={<AuthLayout />}
                    // errorElement={<AppErrorBoundary />}
                    >
                        <Route path="console" element={<CommunityConsole />} />
                    </Route>

                    <Route
                        path="auth"
                        element={<AuthLayout />}
                    // errorElement={<AppErrorBoundary />}
                    >
                        <Route path="login" element={<LoginPage />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                    </Route>
                </Routes>
            </LoadingProvider>
        </AppErrorBoundary>
    );
}