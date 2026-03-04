import type { JSX, ReactNode } from "react";
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import "@src/index.css";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { ThemeProvider } from "flowbite-react";
import { SocketProvider } from "./context/SocketProvider";
import { ToastProvider } from "./context/ToastProvider";
import { useLoading } from "./context/Loading";
import { SocketLink } from "@utils/link";
import AppRoutes from "@routes/routes";
import { useDarkMode } from "@hooks/useDarkMode";
import { AppErrorBoundary } from "@wrappers/Error/AppErrorBoundary";
import { IncomingVoiceProvider } from "@context/IncomingVoice";
import { DispatchAudioProvider } from "@context/DispatchProvider";
import axios from "axios";
import { AuthUser } from "@utils/link";
import AuthPageWrapper from "./Wrappers/Page/AuthPageWrapper";

/* ===========================
   Fonts
=========================== */

export const links = (): { rel: string; href: string; crossOrigin?: string }[] => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href:
      "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

/* ===========================
   Theme Context
=========================== */

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  toggleDarkMode: () => {},
  ready: true,
});

export const useTheme = (): ThemeContextType =>
  useContext(ThemeContext);

/* ===========================
   Layout Component
=========================== */

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { setLoading } = useLoading();

  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [ready] = useState<boolean>(true);

  const toggleDarkMode = (): void => {
    setDarkMode((prev) => !prev);
  };

  useEffect(() => {
    setLoading(true);
  }, [setLoading]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <Meta />
        <Links />
      </head>

      <AppErrorBoundary>
        <ToastProvider>
          <ThemeProvider>
            <ThemeContext.Provider
              value={{ darkMode, toggleDarkMode, ready }}
            >
              <body
                className={`min-h-screen transition-colors duration-300 overflow-x-hidden ${
                  darkMode ? "bg-gray-950" : "bg-white"
                }`}
              >
                {children}
                <ScrollRestoration />
                <Scripts />
              </body>
            </ThemeContext.Provider>
          </ThemeProvider>
        </ToastProvider>
      </AppErrorBoundary>
    </html>
  );
}

function useSocketLink() {
  return SocketLink("prod");
}

/* ===========================
   Loader
=========================== */

export async function loader(): Promise<{ socketUrl: string | null }> {
  const socketUrl = useSocketLink();
  return { socketUrl };
}

/* ===========================
   Root Component
=========================== */

export default function Root(): JSX.Element {
  useDarkMode();
  const [globalBan, setGlobalBan] = useState<{
    code: string;
    message: string;
    reason?: string | null;
    expiresAt?: string | null;
    communityName?: string | null;
  } | null>(null);

  const applyBanPayload = (payload: any) => {
    if (!payload?.code || !String(payload.code).includes("BANNED")) return;
    const ban = payload?.ban ?? {};
    setGlobalBan({
      code: String(payload.code),
      message: String(payload.message ?? "Access to this app is restricted."),
      reason: ban?.reason ?? null,
      expiresAt: ban?.expiresAt ?? null,
      communityName: payload?.community?.name ?? null,
    });
  };

  useEffect(() => {
    let mounted = true;
    const configureDispatchHeaders = async () => {
      try {
        const info = await window.api.device.getInfo();
        if (!mounted) return;
        axios.defaults.headers.common["x-dispatch-device-id"] = info.deviceId;
        if (info.serialNumber) {
          axios.defaults.headers.common["x-dispatch-device-serial"] =
            info.serialNumber;
        }
        axios.defaults.headers.common["x-dispatch-client"] = "1";
      } catch {
        axios.defaults.headers.common["x-dispatch-client"] = "1";
      }
    };
    void configureDispatchHeaders();

    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const payload = error?.response?.data;
        if (status === 403) {
          applyBanPayload(payload);
        }
        return Promise.reject(error);
      },
    );

    void axios
      .get(AuthUser(), { withCredentials: true })
      .then(() => {
        if (mounted) setGlobalBan(null);
      })
      .catch((err) => {
        if (!mounted) return;
        if (err?.response?.status === 403) {
          applyBanPayload(err?.response?.data);
        }
      });

    return () => {
      mounted = false;
      axios.interceptors.response.eject(interceptorId);
    };
  }, []);

  const socketUrl = useSocketLink();

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <SocketProvider url={useSocketLink() ?? socketUrl}>
          <ToastProvider>
            <IncomingVoiceProvider>
              <DispatchAudioProvider>
                {globalBan ? (
                  <AuthPageWrapper>
                    <div className="min-h-screen bg-[#0B1220] text-white font-mono flex items-center justify-center p-6">
                      <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-[#1A0F14] p-6 space-y-4">
                        <h1 className="text-2xl uppercase tracking-wide text-red-300/80">
                          Access Restricted
                        </h1>
                        <h2 className="text-xl font-bold text-red-200">
                          {globalBan.communityName
                            ? `${globalBan.communityName} Access Banned`
                            : globalBan.code === "SYSTEM_BANNED"
                              ? "System Account Banned"
                              : globalBan.code === "DEVICE_BANNED"
                                ? "Dispatch Device Banned"
                                : "Access Banned"}
                        </h2>
                        <p className="text-sm text-red-100/90">
                          {globalBan.message}
                        </p>
                        {globalBan.reason ? (
                          <p className="text-sm text-red-100/90">
                            <span className="text-red-300">Reason:</span>{" "}
                            {globalBan.reason}
                          </p>
                        ) : null}
                        {globalBan.expiresAt ? (
                          <p className="text-sm text-red-100/90">
                            <span className="text-red-300">Expires:</span>{" "}
                            {new Date(globalBan.expiresAt).toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-sm text-red-100/90">
                            <span className="text-red-300">Duration:</span>{" "}
                            Permanent
                          </p>
                        )}
                      </div>
                    </div>
                  </AuthPageWrapper>
                ) : (
                  <AppRoutes />
                )}
              </DispatchAudioProvider>
            </IncomingVoiceProvider>
          </ToastProvider>
        </SocketProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

/* ===========================
   Error Boundary
=========================== */

interface ErrorBoundaryProps {
  error: unknown;
}

export function ErrorBoundary({
  error,
}: ErrorBoundaryProps): JSX.Element {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (
    import.meta.env.DEV &&
    error instanceof Error
  ) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>

      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
