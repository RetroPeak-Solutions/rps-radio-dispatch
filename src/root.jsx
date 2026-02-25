// import type { Route } from "react-router";
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import "./index.css";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider } from "flowbite-react";
import { SocketProvider } from "./context/SocketProvider";
import { ToastProvider } from "./context/ToastProvider";
import { LoadingProvider, useLoading } from "./context/Loading";
import { SocketLink } from "./utils/link";
import AppRoutes from "./routes/routes.jsx";
import { useDarkMode } from "./hooks/useDarkMode.js";
import { LoadingOverlay } from "./components/UI/LoadingOverlay";

// Fonts
export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// Theme context
// interface ThemeContextType {
//   darkMode: boolean;
//   toggleDarkMode: () => void;
//   ready: boolean; // indicates theme is initialized
// }

const ThemeContext = createContext({
  darkMode: true,
  toggleDarkMode: () => { },
  ready: true,
});

export const useTheme = () => useContext(ThemeContext);

// Theme + Layout component
export function Layout({ children }) {
  const { setLoading, isLoading } = useLoading();
  const [darkMode, setDarkMode] = useState(true);
  const [ready, setReady] = useState(true);
  useEffect(() => {
    setLoading(true);
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <ToastProvider>
        <ThemeProvider>
          <ThemeContext.Provider value={{ darkMode, toggleDarkMode, ready }}>
            <body
              className={`min-h-screen transition-colors duration-300 overflow-x-hidden ${darkMode ? "bg-gray-950" : "bg-white"
                }`}
            >
              {children}
              <ScrollRestoration />
              <Scripts />
            </body>
          </ThemeContext.Provider>
        </ThemeProvider>
      </ToastProvider>
    </html>
  );
}

// Loader for socket URL
export async function loader() {
  const socketUrl = SocketLink();

  return { socketUrl };
}

// Root component with dynamic FlagEngine import
export default function Root() {
  useDarkMode();
  const socketUrl = SocketLink();

  return (
    <ThemeProvider>
      <SocketProvider url={SocketLink('dev') ?? socketUrl}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

// Error boundary
export function ErrorBoundary({ error }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
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
