import { contextBridge, ipcRenderer } from "electron";

/**
 * Internal listener tracking to prevent stacking
 */
const listeners = {
  updateStatus: new Set(),
  pttHotkeyEvent: new Set(),
};

contextBridge.exposeInMainWorld("api", {
  // =====================================
  // SETTINGS NAMESPACE
  // =====================================
  settings: {
    get: () => ipcRenderer.invoke("settings.get"),
    set: (settings) => ipcRenderer.invoke("settings.set", settings),
  },

  // =====================================
  // UPDATES NAMESPACE
  // =====================================
  updates: {
    getCurrentVersion: () => ipcRenderer.invoke("updates.getCurrentVersion"),
    getLatestVersion: () => ipcRenderer.invoke("updates.getLatestVersion"),
    getReleaseNotes: () => ipcRenderer.invoke("updates.getReleaseNotes"),

    check: () => ipcRenderer.invoke("updates.check"),
    download: () => ipcRenderer.invoke("updates.download"),
    install: () => ipcRenderer.invoke("updates.install"),

    /**
     * Subscribe to update status events
     */
    onStatus: (callback) => {
      const listener = (_, data) => callback(data);
      listeners.updateStatus.add(listener);
      ipcRenderer.on("update-status", listener);

      // Return unsubscribe function for convenience
      return () => {
        ipcRenderer.removeListener("update-status", listener);
        listeners.updateStatus.delete(listener);
      };
    },

    /**
     * Remove all update listeners
     */
    removeStatusListeners: () => {
      listeners.updateStatus.forEach((listener) => {
        ipcRenderer.removeListener("update-status", listener);
      });
      listeners.updateStatus.clear();
    },
  },

  // =====================================
  // THEME NAMESPACE
  // =====================================
  theme: {
    set: (theme) => ipcRenderer.send("set-theme", theme),
  },

  pttHotkeys: {
    configure: (communityId) => ipcRenderer.invoke("ptt.hotkeys.configure", { communityId }),
    onEvent: (callback) => {
      const listener = (_, data) => callback(data);
      listeners.pttHotkeyEvent.add(listener);
      ipcRenderer.on("ptt-hotkey-event", listener);
      return () => {
        ipcRenderer.removeListener("ptt-hotkey-event", listener);
        listeners.pttHotkeyEvent.delete(listener);
      };
    },
    removeListeners: () => {
      listeners.pttHotkeyEvent.forEach((listener) => {
        ipcRenderer.removeListener("ptt-hotkey-event", listener);
      });
      listeners.pttHotkeyEvent.clear();
    },
  },

  device: {
    getId: () => ipcRenderer.invoke("device.getId"),
    system: {
      getInfo: () => ipcRenderer.invoke("device.system.getInfo"),
      getOsInfo: () => ipcRenderer.invoke("device.system.getOsInfo"),
      getTheme: () => ipcRenderer.invoke("device.system.getTheme"),
      getLocale: () => ipcRenderer.invoke("device.system.getLocale"),
      getTimezone: () => ipcRenderer.invoke("device.system.getTimezone"),
      getBattery: () => ipcRenderer.invoke("device.system.getBattery"),
      getMemoryUsage: () => ipcRenderer.invoke("device.system.getMemoryUsage"),
      getNetworkStatus: () => ipcRenderer.invoke("device.system.getNetworkStatus"),
      getUptime: () => ipcRenderer.invoke("device.system.getUptime"),
      getCpuInfo: () => ipcRenderer.invoke("device.system.getCpuInfo"),
      getGpuInfo: () => ipcRenderer.invoke("device.system.getGpuInfo"),
      getDiskInfo: () => ipcRenderer.invoke("device.system.getDiskInfo"),
      getAudioDevices: () => ipcRenderer.invoke("device.system.getAudioDevices"),
    },
  },
});

console.log("[DEBUG] Preload loaded successfully");
