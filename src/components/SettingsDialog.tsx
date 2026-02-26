import React, { useEffect, useState } from "react";
import { Sun, Cpu, Download, Check, Bell } from "lucide-react";
import { AnimatedDropdownWithIcon } from "./UI/IconDropdown";
import { Dialog } from "./UI/Dialog";
import { SwitchToggle } from "./UI/SwitchToggle";

interface Settings {
  theme: "system" | "light" | "dark";
  autoUpdates: boolean;
  updateChannel: "stable" | "beta";
  notifications: boolean;  // NEW field for notifications toggle
}

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  status: UpdateStatus;
  progress: number;
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({
    theme: "system",
    autoUpdates: false,
    updateChannel: "stable",
    notifications: false, // default value
  });

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    currentVersion: "",
    latestVersion: "",
    releaseNotes: "",
    status: "idle",
    progress: 0,
  });

  useEffect(() => {
    if (!open) return;

    let unsub: (() => void) | undefined;

    // Load settings from main process
    window.api?.settings.get().then((s) => {
      if (s) {
        // Ensure all keys exist in case settings file is missing new props
        setSettings((prev) => ({
          ...prev,
          theme: s.theme ?? prev.theme,
          autoUpdates: s.autoUpdates ?? prev.autoUpdates,
          updateChannel: s.updateChannel ?? prev.updateChannel,
          notifications: s.notifications ?? false,
        }));
        console.log("Loaded settings:", s);
      }
    });

    // Load version info
    window.api?.updates.getCurrentVersion().then((v) =>
      setUpdateInfo((prev) => ({ ...prev, currentVersion: v }))
    );
    window.api?.updates.getLatestVersion().then((v) =>
      setUpdateInfo((prev) => ({ ...prev, latestVersion: v }))
    );
    window.api?.updates.getReleaseNotes().then((r) =>
      setUpdateInfo((prev) => ({ ...prev, releaseNotes: r }))
    );

    // Subscribe to update status events
    if (window.api?.updates.onStatus) {
      unsub = window.api.updates.onStatus((data) => {
        setUpdateInfo((prev) => ({
          ...prev,
          status: data.status,
          progress: data.percent ?? 0,
        }));
      });
    }

    // Cleanup subscription on close/unmount
    return () => unsub?.();
  }, [open]);

  const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    if (window.api?.settings?.set) {
      await window.api.settings.set(settings);
    }
    onClose();
  };

  const checkUpdates = async () => {
    if (window.api?.updates?.check) {
      setUpdateInfo((prev) => ({ ...prev, status: "checking" }));
      await window.api.updates.check();
    }
  };

  const downloadUpdate = async () => {
    if (window.api?.updates?.download) await window.api.updates.download();
  };

  const installUpdate = () => {
    window.api?.updates?.install();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Settings"
      showClose={true}
      closeOnEsc={true}
      footer={
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium"
            onClick={saveSettings}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Theme Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-200 font-medium">Theme</label>
          <AnimatedDropdownWithIcon
            icon={<Sun className="w-4 h-4 text-yellow-400" />}
            label="Select theme"
            options={[
              { label: "System", value: "system" },
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ]}
            value={settings.theme}
            onChange={(val: any) => updateField("theme", val as Settings["theme"])}
          />
        </div>

        {/* Auto Updates Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-gray-200 font-medium">Auto Updates</span>
          <SwitchToggle
            size="md"
            value={settings.autoUpdates}
            onChange={(val: any) => updateField("autoUpdates", val)}
          />
        </div>

        {/* Notifications Toggle - NEW */}
        <div className="flex items-center justify-between">
          <span className="text-gray-200 font-medium flex items-center gap-1">
            <Bell className="w-4 h-4" />
            Notifications
          </span>
          <SwitchToggle
            size="md"
            value={settings.notifications}
            onChange={(val: any) => updateField("notifications", val)}
          />
        </div>

        {/* Update Channel Dropdown */}
        <div className="flex flex-col gap-2">
          <label className="text-gray-200 font-medium">Update Channel</label>
          <AnimatedDropdownWithIcon
            icon={<Cpu className="w-4 h-4 text-green-400" />}
            label="Select channel"
            options={[
              { label: "Stable", value: "stable" },
              { label: "Beta", value: "beta" },
            ]}
            value={settings.updateChannel}
            onChange={(val: any) =>
              updateField("updateChannel", val as Settings["updateChannel"])
            }
          />
        </div>

        {/* Update Section */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="flex justify-between items-center text-gray-200">
            <span>Current Version:</span>
            <span>{updateInfo.currentVersion || "-"}</span>
          </div>
          <div className="flex justify-between items-center text-gray-200">
            <span>Latest Version:</span>
            <span>{updateInfo.latestVersion || "-"}</span>
          </div>

          {/* Update Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm"
                onClick={checkUpdates}
              >
                <Check className="w-4 h-4" /> Check Updates
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm"
                onClick={downloadUpdate}
                disabled={updateInfo.status !== "available"}
              >
                <Download className="w-4 h-4" /> Download Update
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm"
                onClick={installUpdate}
                disabled={updateInfo.status !== "downloaded"}
              >
                Install Update
              </button>
            </div>

            {/* Progress Bar */}
            {updateInfo.status === "downloading" && (
              <div className="w-full bg-white/10 rounded-xl h-2 mt-1">
                <div
                  className="bg-blue-500 h-2 rounded-xl"
                  style={{ width: `${updateInfo.progress.toFixed(2)}%` }}
                />
              </div>
            )}
            {updateInfo.status === "available" && (
              <span className="text-sm text-green-400">
                Update available! You can download it.
              </span>
            )}
            {updateInfo.status === "not-available" && (
              <span className="text-sm text-gray-400">No updates available.</span>
            )}
          </div>

          {/* Release Notes */}
          <div className="mt-2">
            <label className="text-gray-200 font-medium">Release Notes</label>
            <div className="max-h-40 overflow-y-auto p-2 bg-white/5 rounded-lg text-gray-100 text-sm whitespace-pre-line">
              {updateInfo.releaseNotes || "No release notes loaded."}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}