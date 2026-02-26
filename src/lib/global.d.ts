export {};

declare global {
  interface Window {
    api: {
      // ==========================
      // SETTINGS NAMESPACE
      // ==========================
      settings: {
        get: () => Promise<{
          theme?: "system" | "light" | "dark";
          autoUpdates?: boolean;
          updateChannel?: "stable" | "beta";
          [key: string]: any;
        }>;
        set: (settings: {
          theme?: "system" | "light" | "dark";
          autoUpdates?: boolean;
          updateChannel?: "stable" | "beta";
          [key: string]: any;
        }) => Promise<boolean>;
      };

      // ==========================
      // UPDATES NAMESPACE
      // ==========================
      updates: {
        getCurrentVersion: () => Promise<string>;
        getLatestVersion: () => Promise<string>;
        getReleaseNotes: () => Promise<string>;
        check: () => Promise<boolean>;
        download: () => Promise<void>;
        install: () => void;

        /**
         * Subscribe to update status events
         */
        onStatus: (callback: (data: {
          status: "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error";
          percent?: number;
          version?: string;
          error?: any;
        }) => void) => () => void;

        /**
         * Remove all update listeners
         */
        removeStatusListeners: () => void;
      };

      // ==========================
      // THEME NAMESPACE
      // ==========================
      theme: {
        set: (theme: "system" | "light" | "dark") => void;
      };
    };
  }
}