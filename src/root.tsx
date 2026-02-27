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
import { AppErrorBoundary } from "./Wrappers/Error/AppErrorBoundary";

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

  const socketUrl = useSocketLink();

  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <SocketProvider url={useSocketLink() ?? socketUrl}>
          <ToastProvider>
            <AppRoutes />
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