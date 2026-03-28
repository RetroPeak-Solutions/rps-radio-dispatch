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
import link, { AuthUser } from "@utils/link";
import { BanStateProvider } from "@context/BanState";

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
  const [realtimeDeviceId, setRealtimeDeviceId] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const configureDispatchHeaders = async () => {
      try {
        const info = await window.api.device.system.getInfo();
        if (!mounted) return;
        setRealtimeDeviceId(String(info.deviceId || ""));
        axios.defaults.headers.common["x-dispatch-device-id"] = info.deviceId;
        if (info.serialNumber) {
          axios.defaults.headers.common["x-dispatch-device-serial"] =
            info.serialNumber;
        }
        axios.defaults.headers.common["x-dispatch-client"] = "1";
      } catch {
        if (!mounted) return;
        setRealtimeDeviceId("");
        axios.defaults.headers.common["x-dispatch-client"] = "1";
      }
    };
    void configureDispatchHeaders();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let ended = false;
    let heartbeatTimer: number | null = null;
    const localHeaders: Record<string, string> = {
      "x-dispatch-client": "1",
    };
    let liveSessionId = "";

    const sendSessionEvent = async (
      event: "start" | "heartbeat" | "end",
      sessionId?: string,
      endedReason?: string,
    ) => {
      const res = await axios.post(
        `${link("prod")}/api/dispatch/sessions`,
        {
          event,
          sessionId,
          source: "Dispatch App",
          platform: navigator.platform,
          endedReason,
        },
        {
          withCredentials: true,
          headers: localHeaders,
        },
      );
      return res.data;
    };

    const startAppSession = async () => {
      try {
        const info = await window.api.device.system.getInfo();
        localHeaders["x-dispatch-device-id"] = info.deviceId;
        if (info.serialNumber) {
          localHeaders["x-dispatch-device-serial"] = info.serialNumber;
        }
      } catch {
        // noop
      }

      try {
        const authRes = await axios.get(AuthUser(), {
          withCredentials: true,
          headers: localHeaders,
        });
        if (!authRes?.data?.user?.id) return;
      } catch {
        return;
      }

      try {
        const data = await sendSessionEvent("start");
        liveSessionId = String(data?.sessionId || "");
        if (!liveSessionId) return;
        heartbeatTimer = window.setInterval(() => {
          if (ended || !liveSessionId) return;
          void sendSessionEvent("heartbeat", liveSessionId).catch((err) => {
            console.error("[DispatchSession] heartbeat failed:", err);
          });
        }, 30000);
      } catch (err) {
        console.error("[DispatchSession] start failed:", err);
      }
    };

    void startAppSession();

    return () => {
      ended = true;
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      if (liveSessionId) {
        void sendSessionEvent("end", liveSessionId, "dispatch-app-unmount").catch(
          (err) => {
            console.error("[DispatchSession] end failed:", err);
          },
        );
      }
    };
  }, []);

  const socketUrl = useSocketLink();

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <SocketProvider url={socketUrl}>
          <BanStateProvider deviceId={realtimeDeviceId}>
            <ToastProvider>
              <IncomingVoiceProvider>
                <DispatchAudioProvider>
                  <AppRoutes />
                </DispatchAudioProvider>
              </IncomingVoiceProvider>
            </ToastProvider>
          </BanStateProvider>
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
