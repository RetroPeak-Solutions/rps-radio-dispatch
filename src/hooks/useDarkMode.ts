import { useEffect, useState } from "react";

/* ===========================
   Electron API Typing
=========================== */

declare global {
  interface Window {
    electronAPI?: {
      setNativeTheme: (theme: "light" | "dark") => void;
    };
  }
}

/* ===========================
   Hook
=========================== */

export function useDarkMode(): "light" | "dark" {
  const [theme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove any existing theme classes
    root.classList.remove("light", "dark");

    // Apply selected theme
    root.classList.add(theme);

    // Sync with Electron nativeTheme (if available)
    if (window.electronAPI) {
      window.electronAPI.setNativeTheme(theme);
    }
  }, [theme]);

  return theme;
}