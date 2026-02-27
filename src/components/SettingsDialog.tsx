import React, { useEffect, useState } from "react";
import { Sun, Cpu, Download, Check, Bell } from "lucide-react";
import { AnimatedDropdownWithIcon } from "./UI/IconDropdown";
import { Dialog } from "./UI/Dialog";
import { SwitchToggle } from "./UI/SwitchToggle";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ================= TYPES ================= */
type Settings = Awaited<ReturnType<typeof window.api.settings.get>>;

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
    notifications: false,
    placements: { channels: [], tones: [], alerts: [] },
    keybinds: { ptt: { global: { key: [] }, communities: [] } },
  });

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    currentVersion: "",
    latestVersion: "",
    releaseNotes: "",
    status: "idle",
    progress: 0,
  });

  const [recordingKeybind, setRecordingKeybind] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);

  /* ================= LOAD SETTINGS ================= */
  useEffect(() => {
    if (!open) return;
    let unsub: (() => void) | undefined;

    window.api?.settings.get().then((s) => {
      if (!s) return;
      setSettings((prev) => ({
        ...prev,
        ...s,
        placements: s.placements ?? prev.placements,
        keybinds: {
          ptt: {
            global: { key: s.keybinds?.ptt?.global?.key ?? [] },
            communities: s.keybinds?.ptt?.communities ?? [],
          },
        },
      }));
    });

    window.api?.updates.getCurrentVersion().then((v) =>
      setUpdateInfo((prev) => ({ ...prev, currentVersion: v }))
    );
    window.api?.updates.getLatestVersion().then((v) =>
      setUpdateInfo((prev) => ({ ...prev, latestVersion: v }))
    );
    window.api?.updates.getReleaseNotes().then((r) =>
      setUpdateInfo((prev) => ({ ...prev, releaseNotes: r }))
    );

    if (window.api?.updates.onStatus) {
      unsub = window.api.updates.onStatus((data) => {
        setUpdateInfo((prev) => ({
          ...prev,
          status: data.status,
          progress: data.percent ?? 0,
        }));
      });
    }

    return () => unsub?.();
  }, [open]);

  /* ================= KEYBIND HELPERS ================= */
  function formatKey(e: KeyboardEvent): string | null {
    const { key, location } = e;
    if (key === "Escape") return null;

    const isLeft = location === 1;
    const isRight = location === 2;
    const side = isLeft ? "L" : isRight ? "R" : "";
    const isMac = navigator.platform.toUpperCase().includes("MAC");

    switch (key) {
      case "Control": return `${side}Ctrl`;
      case "Shift": return `${side}Shift`;
      case "Alt": return isMac ? `${side}Option` : `${side}Alt`;
      case "Meta": return isMac ? `${side}Cmd` : `${side}Win`;
      case " ": return "Space";
    }
    if (key.length === 1) return key.toUpperCase();
    return key;
  }

  function sortCombo(keys: string[]) {
    const order = ["Ctrl", "Shift", "Alt", "Option", "Cmd", "Win"];
    return keys.sort((a, b) => {
      const aBase = a.replace(/^L|^R/, "");
      const bBase = b.replace(/^L|^R/, "");
      const aIndex = order.indexOf(aBase);
      const bIndex = order.indexOf(bBase);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  /* ================= KEYBIND RECORDER ================= */
  useEffect(() => {
    if (!recordingKeybind) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === "Escape") { setRecordingKeybind(false); setPressedKeys([]); return; }
      if (e.key === "Backspace") { setPressedKeys([]); return; }

      const formatted = formatKey(e);
      if (!formatted) return;

      setPressedKeys(prev => [...prev, formatted]);
    };

    const handleKeyUp = () => {
      if (pressedKeys.length > 0) {
        const combo = pressedKeys;
        setSettings(prev => ({
          ...prev,
          keybinds: { ...prev.keybinds, ptt: { ...prev.keybinds.ptt, global: { key: combo } } },
        }));
      }
      setPressedKeys([]);
      setRecordingKeybind(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [recordingKeybind, pressedKeys]);

  /* ================= UPDATE HELPERS ================= */
  const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  const saveSettings = async () => { await window.api?.settings.set(settings); onClose(); };
  const checkUpdates = async () => { setUpdateInfo(prev => ({ ...prev, status: "checking" })); await window.api?.updates?.check(); };
  const downloadUpdate = async () => { await window.api?.updates?.download(); };
  const installUpdate = () => { window.api?.updates?.install(); };

  /* ================= UI ================= */
  return (
    <Dialog open={open} onClose={onClose} title="Settings" showClose closeOnEsc={!recordingKeybind} footer={
      <div className="flex justify-end gap-3">
        <button className="cursor-pointer px-4 py-2 rounded-xl bg-[#f63c3c1a] border border-[#f63c3c1a] text-[#f63c3c] font-medium" onClick={onClose}>Cancel</button>
        <button className="cursor-pointer px-4 py-2 rounded-xl bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6] font-medium" onClick={saveSettings}>Save</button>
      </div>
    }>
      <div className="flex flex-col gap-6">

        {/* Theme */}
        {/* <div className="flex flex-col gap-2">
          <label className="text-gray-200 font-medium">Theme</label>
          <AnimatedDropdownWithIcon
            icon={<Sun className="w-4 h-4 text-yellow-400"/>}
            label="Select theme"
            options={[{label:"System",value:"system"},{label:"Light",value:"light"},{label:"Dark",value:"dark"}]}
            value={settings.theme!}
            onChange={(val:any)=>updateField("theme",val as Settings["theme"])}
          />
        </div> */}

        {/* Auto Updates */}
        <div className="flex items-center justify-between">
          <span className="text-gray-200 font-medium">Auto Updates</span>
          <SwitchToggle size="md" value={settings.autoUpdates} onChange={(val:any)=>updateField("autoUpdates",val)} />
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <span className="text-gray-200 font-medium flex items-center gap-1"><Bell className="w-4 h-4"/> Notifications</span>
          <SwitchToggle size="md" value={settings.notifications} onChange={(val:any)=>updateField("notifications",val)} />
        </div>

        {/* Global PTT Keybind */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
          <label className="text-gray-200 font-medium">Global Push-To-Talk Keybind</label>

          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap max-w-fit bg-white/5 px-3 py-2 rounded-xl min-h-[40px] items-center flex-1">
              {settings.keybinds.ptt.global.key.length===0 && <span className="text-gray-400 text-sm">Not Set</span>}
              {settings.keybinds.ptt.global.key.length>0 && !recordingKeybind && <span className="text-sm text-white">{settings.keybinds.ptt.global.key.join(" + ")}</span>}
              {recordingKeybind && <span className="text-blue-400 text-sm animate-pulse">Press keys...</span>}
            </div>

            <button onClick={()=>{setPressedKeys([]);setRecordingKeybind(true);}} className={`focus:outline-none focus:shadow-none flex-shrink-0 flex items-center gap-2 rounded-lg text-4 py-2 cursor-pointer bg-[#${recordingKeybind ? "f63c3c1a" : '3C83F61A'}] border border-[#${recordingKeybind ? 'f63c3c1a' : '3C83F61A'}] text-[#${recordingKeybind ? 'f63c3c' : '3C83F6'}] px-3 py-1 text-sm font-medium transition`}>
              {recordingKeybind ? "Recording..." : "Record Keybind"}
            </button>
          </div>

          <span className="text-xs text-gray-400">Press keys in order. ESC cancels. Backspace clears.</span>
        </div>

        {/* Update Section */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
          <div className="flex justify-between text-gray-200"><span>Current Version:</span><span>{updateInfo.currentVersion||"-"}</span></div>
          <div className="flex justify-between text-gray-200"><span>Latest Version:</span><span>{updateInfo.latestVersion||"-"}</span></div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-lg bg-[#8080801A] border border-[#8080801A] text-[#BFBFBF] text-sm" onClick={checkUpdates}><Check className="w-4 h-4"/> Check Updates</button>
              <button className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-lg bg-[#8080801A] border border-[#8080801A] text-[#BFBFBF] text-sm" onClick={downloadUpdate} disabled={updateInfo.status!=="available"}><Download className="w-4 h-4"/> Download Update</button>
              <button className="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-lg bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6] text-sm" onClick={installUpdate} disabled={updateInfo.status!=="downloaded"}>Install Update</button>
            </div>

            {updateInfo.status==="downloading" && <div className="w-full bg-white/10 rounded-xl h-2 mt-1"><div className="bg-blue-500 h-2 rounded-xl" style={{width:`${updateInfo.progress.toFixed(2)}%`}}/></div>}
            {updateInfo.status==="available" && <span className="text-sm text-green-400">Update available! You can download it.</span>}
            {updateInfo.status==="not-available" && <span className="text-sm text-gray-400">No updates available.</span>}
          </div>

          {/* Release Notes with Discord Markdown Styling */}
          <div className="mt-2">
            <label className="text-gray-200 font-medium">Release Notes</label>
            <div className="max-h-40 overflow-y-auto p-2 bg-[#2f3136] rounded-lg text-gray-100 text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {updateInfo.releaseNotes || "No release notes loaded."}
              </ReactMarkdown>
            </div>
          </div>

        </div>
      </div>
    </Dialog>
  );
}