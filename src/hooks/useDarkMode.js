// src/hooks/useDarkMode.js
import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [theme, setTheme] = useState('dark'); // Default to 'dark' mode

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark'); // Remove existing classes
    root.classList.add(theme); // Add the 'dark' class to force dark mode

    // Optional: Use Electron's nativeTheme module to sync with the OS setting
    if (window.electronAPI) { // Assuming you have an electronAPI exposed via contextBridge
      window.electronAPI.setNativeTheme(theme); 
    }
  }, [theme]);

  // In this case, we always return 'dark' for a forced dark mode
  // If you wanted a toggler, you would return setTheme and the current theme
  return theme; 
}
