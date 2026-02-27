/* eslint-disable no-undef */
import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import axios from "axios";

import pkg from "electron-updater";
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to preload
const preloadPath = path.resolve(__dirname, "preload.js");
console.log("[DEBUG] Preload absolute path:", preloadPath);

let win = null;
let pttCommunityContext = null;
let pttReleaseTimer = null;
const registeredPttHotkeys = new Map();

// Path to persistent settings
const settingsPath = path.join(app.getPath("userData"), "settings.json");
const defaultSettings = {
  theme: "system",
  autoUpdates: false,
  updateChannel: "stable",
  notifications: true,
  placements: {
    channels: [],
    tones: [],
    alerts: []
  },
  keybinds: {
    ptt: {
      global: {
        key: [""],
      },
      communities: [],
    }
  }
};

// Ensure settings.json exists on app ready (safer)
app.whenReady().then(() => {
  console.log("App Name:", app.getName());
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), "utf-8");
    console.log("[Settings] Created default settings.json at", settingsPath);
  }
});

// -------------------------
// BrowserWindow
// -------------------------
const createWindow = () => {
  console.log("[Main] Creating main window...");
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    // autoHideMenuBar: false,
    // titleBarStyle: "hidden",
    // ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : { titleBarOverlay: true }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, "preload.js"), // preload script
    },
  });
  console.log("[Main] Main window created");
  console.log("[Main] Loading content...");
  console.log("[Main] VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL);
  console.log("[Main] App version:", app.getVersion());

  // Uncomment to open devtools during development
  // win.webContents.openDevTools();

  const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("will-quit", () => {
  try {
    globalShortcut.unregisterAll();
  } catch (err) {
    console.error("[PTT] Failed to unregister global shortcuts:", err);
  }
});

function readSettingsSync() {
  try {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), "utf-8");
    }
    return JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  } catch {
    return defaultSettings;
  }
}

function normalizeKeyToken(rawKey) {
  if (!rawKey) return "";
  const key = String(rawKey).replace(/^L|^R/, "");
  const map = {
    Ctrl: "CommandOrControl",
    Cmd: "Command",
    Win: process.platform === "darwin" ? "Command" : "Super",
    Option: "Alt",
    Alt: "Alt",
    Shift: "Shift",
    Space: "Space",
    Enter: "Enter",
    Escape: "Esc",
    Backspace: "Backspace",
    Delete: "Delete",
    Tab: "Tab",
    Up: "Up",
    Down: "Down",
    Left: "Left",
    Right: "Right",
    Home: "Home",
    End: "End",
    PageUp: "PageUp",
    PageDown: "PageDown",
    Insert: "Insert",
  };
  if (map[key]) return map[key];
  if (/^F([1-9]|1[0-2])$/.test(key)) return key;
  if (/^[A-Z]$/.test(key)) return key;
  if (/^[0-9]$/.test(key)) return key;
  return "";
}

function comboToAccelerator(combo, requireShift = false) {
  if (!Array.isArray(combo) || combo.length === 0) return null;
  const tokens = combo.map(normalizeKeyToken).filter(Boolean);
  if (requireShift && !tokens.includes("Shift")) {
    tokens.unshift("Shift");
  }
  if (tokens.length === 0) return null;
  const modifiers = new Set(["CommandOrControl", "Command", "Super", "Alt", "Shift"]);
  const hasNonModifier = tokens.some((t) => !modifiers.has(t));
  if (!hasNonModifier) return null;
  return Array.from(new Set(tokens)).join("+");
}

function sendPttShortcutEvent(payload) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send("ptt-hotkey-event", payload);
}

function rebuildPttGlobalShortcuts() {
  try {
    globalShortcut.unregisterAll();
  } catch (err) {
    console.error("[PTT] Failed clearing shortcuts:", err);
  }
  registeredPttHotkeys.clear();

  const settings = readSettingsSync();
  const globalCombo = settings?.keybinds?.ptt?.global?.key ?? [];
  const communities = settings?.keybinds?.ptt?.communities ?? [];
  const activeCommunity = communities.find((c) => c.id === pttCommunityContext);
  const specs = [];

  if (Array.isArray(globalCombo) && globalCombo.length > 0) {
    specs.push({
      id: "global",
      combo: globalCombo,
      payload: { scope: "global", slot: null, communityId: pttCommunityContext || null },
    });
  }

  if (activeCommunity?.channels && typeof activeCommunity.channels === "object") {
    ["ch1", "ch2", "ch3", "ch4", "ch5"].forEach((slot) => {
      const combo = activeCommunity.channels?.[slot]?.key ?? [];
      if (!Array.isArray(combo) || combo.length === 0) return;
      specs.push({
        id: `community:${slot}`,
        combo,
        payload: { scope: "community", slot, communityId: pttCommunityContext || null },
      });
    });
  }

  specs.forEach((spec) => {
    // Unfocused/OS-level PTT requires Shift to avoid conflicts with other apps.
    const accelerator = comboToAccelerator(spec.combo, true);
    if (!accelerator) return;
    const ok = globalShortcut.register(accelerator, () => {
      const item = registeredPttHotkeys.get(spec.id);
      if (!item) return;
      const now = Date.now();
      item.lastTriggeredAt = now;
      if (!item.active) {
        item.active = true;
        sendPttShortcutEvent({ ...item.payload, action: "down", timestamp: now });
      }
    });
    if (!ok) {
      console.warn(`[PTT] Failed to register global shortcut: ${accelerator}`);
      return;
    }
    registeredPttHotkeys.set(spec.id, {
      accelerator,
      payload: spec.payload,
      active: false,
      lastTriggeredAt: 0,
    });
  });

  if (pttReleaseTimer) clearInterval(pttReleaseTimer);
  const RELEASE_GRACE_MS = 2000;
  pttReleaseTimer = setInterval(() => {
    const now = Date.now();
    registeredPttHotkeys.forEach((item) => {
      // Key-up emulation based on repeat heartbeat while held.
      if (!item.active) return;
      if (now - item.lastTriggeredAt <= RELEASE_GRACE_MS) return;
      item.active = false;
      sendPttShortcutEvent({ ...item.payload, action: "up", timestamp: now });
    });
  }, 80);
}

// -------------------------
// Settings IPC
// -------------------------
ipcMain.handle("settings.get", async () => {
  try {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), "utf-8");
    }
    const raw = fs.readFileSync(settingsPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[Settings] Failed to read settings:", err);
    return defaultSettings;
  }
});

ipcMain.handle("settings.set", async (event, newSettings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2), "utf-8");
    rebuildPttGlobalShortcuts();
    // console.log("[Settings] Saved settings:", newSettings);
    return true;
  } catch (err) {
    console.error("[Settings] Failed to save settings:", err);
    return false;
  }
});

ipcMain.handle("ptt.hotkeys.configure", async (_event, payload) => {
  console.log("Rebuilding PTT HotKeys");
  pttCommunityContext = payload?.communityId ? String(payload.communityId) : null;
  rebuildPttGlobalShortcuts();
  return true;
});

// -------------------------
// AutoUpdater Setup
// -------------------------
autoUpdater.setFeedURL({
  provider: "github",
  token: process.env.GH_TOKEN,
  owner: "RetroPeak-Solutions",
  repo: "rps-radio-dispatch",
});

autoUpdater.autoDownload = false; // manual control
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.autoRunAppAfterInstall = true;
autoUpdater.forceDevUpdateConfig = true;
autoUpdater.allowPrerelease = false;
autoUpdater.logger = console;

// Forward download progress to renderer
autoUpdater.on("download-progress", (progressObj) => {
  if (win) {
    win.webContents.send("update-status", {
      status: "downloading",
      ...progressObj,
    });
  }
});

// -------------------------
// IPC Handlers for Updates
// -------------------------
ipcMain.handle("updates.getCurrentVersion", () => app.getVersion());

ipcMain.handle("updates.getLatestVersion", async () => {
  try {
    const res = await axios.get(
      "https://api.github.com/repos/RetroPeak-Solutions/rps-radio-dispatch/releases/latest",
      { headers: { Authorization: `Bearer ${process.env.GH_TOKEN}` } }
    );
    return res?.data?.name || app.getVersion();
  } catch (err) {
    console.error("[Updater] Failed to get latest version:", err);
    return app.getVersion();
  }
});

ipcMain.handle("updates.getReleaseNotes", async () => {
  try {
    const res = await axios.get(
      "https://api.github.com/repos/RetroPeak-Solutions/rps-radio-dispatch/releases/latest",
      { headers: { Authorization: `Bearer ${process.env.GH_TOKEN}` } }
    );
    return res?.data?.body || "- No release notes available.";
  } catch (err) {
    console.error("[Updater] Failed to get release notes:", err);
    return "- Failed to load release notes. \n- Try Again Later";
  }
});

ipcMain.handle("updates.check", async () => {
  try {
    const res = await axios.get(
      "https://api.github.com/repos/RetroPeak-Solutions/rps-radio-dispatch/releases/latest",
      { headers: { Authorization: `Bearer ${process.env.GH_TOKEN}` } }
    );
    const latestVersion = res?.data?.name;
    const currentVersion = app.getVersion();
    const available = !!latestVersion && latestVersion !== currentVersion;

    if (win) {
      win.webContents.send("update-status", {
        status: available ? "available" : "not-available",
        version: latestVersion,
      });
    }

    return available;
  } catch (err) {
    console.error("[Updater] Error checking updates:", err);
    return false;
  }
});

ipcMain.handle("updates.download", async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await autoUpdater.checkForUpdates();

      if (!result || !result.updateInfo) {
        console.log("[Updater] No update info returned");
        resolve({ status: "no-update" });
        return;
      }

      const { version } = result.updateInfo;

      if (!version) {
        console.log("[Updater] No update available");
        resolve({ status: "no-update" });
        return;
      }

      console.log("[Updater] Update found:", version);

      // Notify renderer update exists
      if (win) {
        win.webContents.send("update-status", {
          status: "available",
          version,
        });
      }

      autoUpdater.once("update-downloaded", () => {
        console.log("[Updater] Update downloaded");

        if (win) {
          win.webContents.send("update-status", {
            status: "downloaded",
          });
        }

        resolve({ status: "downloaded" });
      });

      autoUpdater.once("error", (err) => {
        console.error("[Updater] Download error:", err);

        if (win) {
          win.webContents.send("update-status", {
            status: "error",
            error: err.message,
          });
        }

        reject(err);
      });

      // ✅ Only download if update exists
      await autoUpdater.downloadUpdate();

    } catch (err) {
      console.error("[Updater] Check failed:", err);
      reject(err);
    }
  });
});

ipcMain.handle("updates.install", () => {
  console.log("[Updater] Installing update...");
  autoUpdater.quitAndInstall(true, true);
});
