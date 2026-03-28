/* eslint-disable no-undef */
import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import axios from "axios";
import os from "os";
import crypto from "crypto";
import { execSync } from "child_process";

/** @type {"production" | "development"} */
let nodeEnv = 'production';

// this works if npm run build, followed by npm run package-(any of the scripts),
// and then open from executable file
nodeEnv = !app.isPackaged ? 'development' : process.env.NODE_ENV || 'production';

import pkg from "electron-updater";
import { env } from "process";
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
let lastUpdateInfo = null;
let downloadInFlight = false;

// Path to persistent settings
const settingsPath = path.join(app.getPath("userData"), "settings.json");
const defaultSettings = {
  theme: "system",
  autoUpdates: false,
  updateChannel: "stable",
  notifications: true,
  txAudio: {
    playStart: true,
    playEnd: true
  },
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

function readSystemSerialNumber() {
  try {
    if (process.platform === "darwin") {
      const out = execSync("ioreg -l | awk '/IOPlatformSerialNumber/ {print $4}' | tr -d '\"'", { encoding: "utf8" }).trim();
      return out || null;
    }
    if (process.platform === "win32") {
      const out = execSync("powershell -NoProfile -Command \"(Get-CimInstance Win32_BIOS).SerialNumber\"", { encoding: "utf8" }).trim();
      return out || null;
    }
    if (process.platform === "linux") {
      const paths = [
        "/sys/class/dmi/id/product_serial",
        "/sys/class/dmi/id/product_uuid",
      ];
      for (const p of paths) {
        try {
          const out = fs.readFileSync(p, "utf8").trim();
          if (out) return out;
        } catch {
          // try next
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function computeDeviceSystemId(serialNumber = null) {
  try {
    if (serialNumber && String(serialNumber).trim()) {
      return `serial:${String(serialNumber).trim().toLowerCase()}`;
    }
    const nets = os.networkInterfaces();
    const macs = Object.values(nets)
      .flat()
      .filter(Boolean)
      .map((entry) => entry.mac)
      .filter((mac) => mac && mac !== "00:00:00:00:00:00")
      .sort();
    const cpuModel = os.cpus()?.[0]?.model ?? "unknown-cpu";
    const raw = [
      os.platform(),
      os.arch(),
      os.hostname(),
      cpuModel,
      ...macs,
    ].join("|");
    return `rrdev_${crypto.createHash("sha256").update(raw).digest("hex")}`;
  } catch {
    return `rrdev_fallback_${app.getPath("userData")}`;
  }
}

function getDeviceInfo() {
  const serialNumber = readSystemSerialNumber();
  const deviceId = computeDeviceSystemId(serialNumber);
  return {
    deviceId,
    serialNumber: serialNumber ? String(serialNumber).trim().toLowerCase() : null,
  };
}

const GITHUB_OWNER = "RetroPeak-Solutions";
const GITHUB_REPO = "rps-radio-dispatch";

function stripVersionPrefix(versionValue) {
  return String(versionValue || "").trim().replace(/^v/i, "");
}

function githubApiHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": `${app.getName()}/${app.getVersion()}`,
  };
  if (process.env.GH_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  }
  return headers;
}

async function fetchLatestGithubRelease() {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
  const res = await axios.get(url, { headers: githubApiHeaders() });
  return res?.data ?? null;
}

function emitUpdateStatus(payload) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send("update-status", payload);
}

function releaseNotesToString(releaseNotes) {
  if (!releaseNotes) return "";
  if (typeof releaseNotes === "string") return releaseNotes;
  if (Array.isArray(releaseNotes)) {
    return releaseNotes
      .map((note) => {
        if (typeof note === "string") return note;
        if (!note) return "";
        const versionPart = note.version ? `## ${note.version}\n` : "";
        const notePart = note.note ? `${note.note}` : "";
        return `${versionPart}${notePart}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

// -------------------------
// BrowserWindow
// -------------------------
const createWindow = () => {
  console.log("[Main] Creating main window...");
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    allowRunningInsecureContent: true,
    // autoHideMenuBar: false,
    // titleBarStyle: "hidden",
    // ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : { titleBarOverlay: true }),
    
    webPreferences: {
      // sandbox: nodeEnv === "production", // sandbox only in production for security
      sandbox: false,
      webSecurity: nodeEnv === "production", // disable in development for easier testing
      // devTools: true,
      devTools: nodeEnv === "development",
      nodeIntegration: false,
      contextIsolation: true,
      scrollBounce: true,
      preload: path.resolve(__dirname, "preload.js"), // preload script
    },
    icon: path.join(__dirname, "icons/app.ico"),
  });

  // if (nodeEnv === "development") {
  //   const { default: installExtension, REACT_DEVELOPER_TOOLS } = import("electron-devtools-installer");
  //   installExtension(REACT_DEVELOPER_TOOLS)
  //     .then((name) => console.log(`[DevTools] Added Extension:  ${name}`))
  //     .catch((err) => console.error("[DevTools] An error occurred: ", err));

  //   installExtension(REDUX_DEVTOOLS)
  //     .then((name) => console.log(`[DevTools] Added Extension:  ${name}`))
  //     .catch((err) => console.error("[DevTools] An error occurred: ", err));
  // }

    // prevent webpack-dev-server from setting new title
  win.on("page-title-updated", (e) => e.preventDefault());

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

ipcMain.handle("device.getId", async () => {
  return getDeviceInfo().deviceId;
});

ipcMain.handle("device.system.getInfo", async () => {
  return getDeviceInfo();
});

// -------------------------
// AutoUpdater Setup
// -------------------------
autoUpdater.setFeedURL({
  provider: "github",
  ...(process.env.GH_TOKEN ? { token: process.env.GH_TOKEN } : {}),
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
});

autoUpdater.autoDownload = false; // manual control
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.autoRunAppAfterInstall = true;
autoUpdater.forceDevUpdateConfig = !app.isPackaged;
autoUpdater.allowPrerelease = false;
autoUpdater.logger = console;

// Forward download progress to renderer
autoUpdater.on("download-progress", (progressObj) => {
  emitUpdateStatus({
    status: "downloading",
    ...progressObj,
  });
});

autoUpdater.on("update-available", (info) => {
  lastUpdateInfo = info ?? null;
  emitUpdateStatus({
    status: "available",
    version: stripVersionPrefix(info?.version),
  });
});

autoUpdater.on("update-not-available", () => {
  lastUpdateInfo = null;
  emitUpdateStatus({
    status: "not-available",
  });
});

autoUpdater.on("update-downloaded", (info) => {
  downloadInFlight = false;
  lastUpdateInfo = info ?? lastUpdateInfo;
  emitUpdateStatus({
    status: "downloaded",
    version: stripVersionPrefix(info?.version),
  });
});

autoUpdater.on("error", (err) => {
  downloadInFlight = false;
  emitUpdateStatus({
    status: "error",
    error: err?.message || "Unknown updater error",
  });
});

// -------------------------
// IPC Handlers for Updates
// -------------------------
ipcMain.handle("updates.getCurrentVersion", () => app.getVersion());

ipcMain.handle("updates.getLatestVersion", async () => {
  try {
    if (lastUpdateInfo?.version) {
      return stripVersionPrefix(lastUpdateInfo.version);
    }
    const release = await fetchLatestGithubRelease();
    const releaseVersion = stripVersionPrefix(release?.tag_name || release?.name);
    return releaseVersion || app.getVersion();
  } catch (err) {
    console.error("[Updater] Failed to get latest version:", err);
    return app.getVersion();
  }
});

ipcMain.handle("updates.getReleaseNotes", async () => {
  try {
    const fromUpdater = releaseNotesToString(lastUpdateInfo?.releaseNotes);
    if (fromUpdater) return fromUpdater;

    const release = await fetchLatestGithubRelease();
    return release?.body || "- No release notes available.";
  } catch (err) {
    console.error("[Updater] Failed to get release notes:", err);
    return "- Failed to load release notes. \n- Try Again Later";
  }
});

ipcMain.handle("updates.check", async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    const info = result?.updateInfo ?? null;
    const latestVersion = stripVersionPrefix(info?.version);
    const currentVersion = stripVersionPrefix(app.getVersion());
    const available = Boolean(latestVersion && latestVersion !== currentVersion);
    if (info) {
      lastUpdateInfo = info;
    }
    emitUpdateStatus({
      status: available ? "available" : "not-available",
      version: latestVersion || currentVersion,
    });
    return available;
  } catch (err) {
    console.error("[Updater] Error checking updates via autoUpdater:", err);
    try {
      const release = await fetchLatestGithubRelease();
      const latestVersion = stripVersionPrefix(release?.tag_name || release?.name);
      const currentVersion = stripVersionPrefix(app.getVersion());
      const available = Boolean(latestVersion && latestVersion !== currentVersion);
      emitUpdateStatus({
        status: available ? "available" : "not-available",
        version: latestVersion || currentVersion,
      });
      return available;
    } catch (fallbackErr) {
      console.error("[Updater] Fallback GitHub check failed:", fallbackErr);
      emitUpdateStatus({
        status: "error",
        error: fallbackErr?.message || "Failed to check updates",
      });
      return false;
    }
  }
});

ipcMain.handle("updates.download", async () => {
  if (downloadInFlight) {
    return { status: "downloading" };
  }

  try {
    const result = await autoUpdater.checkForUpdates();
    const info = result?.updateInfo ?? null;
    if (!info?.version) {
      emitUpdateStatus({ status: "not-available" });
      return { status: "no-update" };
    }

    const latestVersion = stripVersionPrefix(info.version);
    const currentVersion = stripVersionPrefix(app.getVersion());
    if (latestVersion === currentVersion) {
      emitUpdateStatus({ status: "not-available", version: latestVersion });
      return { status: "no-update" };
    }

    lastUpdateInfo = info;
    downloadInFlight = true;
    emitUpdateStatus({ status: "available", version: latestVersion });
    await autoUpdater.downloadUpdate();
    return { status: "started" };
  } catch (err) {
    downloadInFlight = false;
    console.error("[Updater] Download failed:", err);
    emitUpdateStatus({
      status: "error",
      error: err?.message || "Failed to download update",
    });
    return { status: "error", error: err?.message || "Failed to download update" };
  }
});

ipcMain.handle("updates.install", () => {
  console.log("[Updater] Installing update...");
  try {
    autoUpdater.quitAndInstall(true, true);
    return { ok: true };
  } catch (err) {
    console.error("[Updater] Install failed:", err);
    emitUpdateStatus({
      status: "error",
      error: err?.message || "Failed to install update",
    });
    return { ok: false, error: err?.message || "Failed to install update" };
  }
});
