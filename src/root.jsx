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
import { SocketLink } from "./utils/link";
import AppRoutes from "./routes/routes.jsx";
import { useDarkMode } from "./hooks/useDarkMode.js";

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
  const [darkMode, setDarkMode] = useState(true);
  const [ready, setReady] = useState(true);

  // // Initialize theme only on client
  // useEffect(() => {
  //   const saved = localStorage.getItem("theme");
  //   if (saved === "dark") setDarkMode(true);
  //   else if (saved === "light") setDarkMode(false);
  //   else {
  //     const prefersDark = window.matchMedia(
  //       "(prefers-color-scheme: dark)"
  //     ).matches;
  //     setDarkMode(prefersDark);
  //   }
  //   setReady(true);
  // }, []);

  // // Apply dark class
  // useEffect(() => {
  //   if (!ready) return;
  //   const root = document.documentElement;
  //   if (darkMode) {
  //     root.classList.add("dark");
  //     root.style.colorScheme = "dark";
  //     localStorage.setItem("theme", "dark");
  //   } else {
  //     root.classList.remove("dark");
  //     root.style.colorScheme = "light";
  //     localStorage.setItem("theme", "light");
  //   }
  // }, [darkMode, ready]);

  // const toggleDarkMode = () => setDarkMode((prev) => !prev);

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
