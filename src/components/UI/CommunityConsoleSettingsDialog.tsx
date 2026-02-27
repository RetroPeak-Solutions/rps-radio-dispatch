import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import { Edit3 } from "lucide-react";
import { SwitchToggle } from "./SwitchToggle";

export type ConsoleSettingsState = {
  gridSnapping: boolean;
  inputDeviceId: string;
  outputDeviceId: string;
};

export type CommunityPttSlot = {
  id: string;
  key: string[];
};

export type CommunityPttChannels = {
  ch1: CommunityPttSlot;
  ch2: CommunityPttSlot;
  ch3: CommunityPttSlot;
  ch4: CommunityPttSlot;
  ch5: CommunityPttSlot;
};

export type CommunityPttBindings = {
  id: string;
  channels: CommunityPttChannels;
};

type AudioOption = { id: string; label: string };
type ChannelOption = { id: string; label: string };
type SlotKey = keyof CommunityPttChannels;

const SLOT_ORDER: SlotKey[] = ["ch1", "ch2", "ch3", "ch4", "ch5"];

function formatKey(e: KeyboardEvent): string | null {
  const { key, code, location } = e;
  if (key === "Escape") return null;
  const isLeft = location === 1;
  const isRight = location === 2;
  const side = isLeft ? "L" : isRight ? "R" : "";
  const isMac = navigator.platform.toUpperCase().includes("MAC");

  switch (key) {
    case "Control":
      return `${side}Ctrl`;
    case "Shift":
      return `${side}Shift`;
    case "Alt":
      return isMac ? `${side}Option` : `${side}Alt`;
    case "Meta":
      return isMac ? `${side}Cmd` : `${side}Win`;
    case " ":
      return "Space";
    default:
      break;
  }

  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad") && /^[0-9]$/.test(code.slice(6))) return code.slice(6);
  if (code.startsWith("Key") && code.length === 4) return code.slice(3).toUpperCase();
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function sortCombo(keys: string[]) {
  const order = ["Ctrl", "Shift", "Alt", "Option", "Cmd", "Win"];
  return [...keys].sort((a, b) => {
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

type Props = {
  open: boolean;
  onClose: () => void;
  value: ConsoleSettingsState;
  pttBindings: CommunityPttBindings;
  channelOptions: ChannelOption[];
  editMode: boolean;
  onEditModeChange: (value: boolean) => void;
  onSave: (next: {
    consoleSettings: ConsoleSettingsState;
    pttBindings: CommunityPttBindings;
  }) => Promise<void> | void;
};

export default function CommunityConsoleSettingsDialog({
  open,
  onClose,
  value,
  pttBindings,
  channelOptions,
  editMode,
  onEditModeChange,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<ConsoleSettingsState>(value);
  const [draftPtt, setDraftPtt] = useState<CommunityPttBindings>(pttBindings);
  const [recordingSlot, setRecordingSlot] = useState<SlotKey | null>(null);
  const [pressedKeys, setPressedKeys] = useState<string[]>([]);
  const [inputDevices, setInputDevices] = useState<AudioOption[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioOption[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setDraftPtt(pttBindings);
  }, [open, value, pttBindings]);

  useEffect(() => {
    if (!open) return;

    const loadDevices = async () => {
      try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        const inputHasLabels = devices.some((d) => d.kind === "audioinput" && !!d.label);
        if (!inputHasLabels) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            devices = await navigator.mediaDevices.enumerateDevices();
          } catch {
            // Permission denied, keep fallback labels.
          }
        }

        const nextInputs = devices
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({ id: d.deviceId, label: d.label || `Input Device ${i + 1}` }));
        const nextOutputs = devices
          .filter((d) => d.kind === "audiooutput")
          .map((d, i) => ({ id: d.deviceId, label: d.label || `Output Device ${i + 1}` }));
        setInputDevices(nextInputs);
        setOutputDevices(nextOutputs);
      } catch {
        setInputDevices([]);
        setOutputDevices([]);
      }
    };

    loadDevices();
  }, [open]);

  useEffect(() => {
    if (!recordingSlot) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === "Escape") {
        setRecordingSlot(null);
        setPressedKeys([]);
        return;
      }
      if (e.key === "Backspace") {
        setPressedKeys([]);
        return;
      }
      const formatted = formatKey(e);
      if (!formatted) return;
      setPressedKeys((prev) => {
        if (prev.includes(formatted)) return prev;
        return sortCombo([...prev, formatted]);
      });
    };

    const handleKeyUp = () => {
      if (pressedKeys.length > 0) {
        setDraftPtt((prev) => ({
          ...prev,
          channels: {
            ...prev.channels,
            [recordingSlot]: {
              ...prev.channels[recordingSlot],
              key: pressedKeys,
            },
          },
        }));
      }
      setPressedKeys([]);
      setRecordingSlot(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [recordingSlot, pressedKeys]);

  const canSave = !recordingSlot;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Console Settings"
      showClose
      closeOnEsc={!recordingSlot}
      footer={
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-[#8080801A] border border-[#8080801A] text-[#BFBFBF] cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6] cursor-pointer disabled:opacity-50"
            disabled={!canSave}
            onClick={async () => {
              await onSave({ consoleSettings: draft, pttBindings: draftPtt });
              onClose();
            }}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="w-[min(92vw,760px)] grid gap-4 text-white">
        <div className="p-3 rounded-lg bg-[#0B1220] border border-white/10">
          <div className="font-semibold flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Mode
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-sm text-[#BFBFBF]">
              Enable drag/reposition mode for channel and tone cards
            </span>
            <SwitchToggle
              size="md"
              value={editMode}
              onChange={onEditModeChange}
              activeColor="#16a34a"
              inactiveColor="#4b5563"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#0B1220] border border-white/10">
          <div className="font-semibold">Grid Snapping</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-sm text-[#BFBFBF]">
              Snap near neighboring cards and enforce gap
            </span>
            <SwitchToggle
              size="md"
              value={draft.gridSnapping}
              onChange={(checked) => setDraft((prev) => ({ ...prev, gridSnapping: checked }))}
              activeColor="#3C83F6"
              inactiveColor="#4b5563"
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#0B1220] border border-white/10">
          <div className="font-semibold">Community PTT Quick Keys (Ch1-Ch5)</div>
          <div className="grid gap-3 mt-3">
            {SLOT_ORDER.map((slot, idx) => {
              const slotValue = draftPtt.channels[slot];
              return (
                <div key={slot} className="grid md:grid-cols-[90px_1fr_1fr_auto_auto] gap-2 items-center">
                  <span className="text-sm text-[#BFBFBF]">CH {idx + 1}</span>
                  <select
                    className="rounded-lg bg-black/30 border border-white/10 px-2 py-2"
                    value={slotValue.id}
                    onChange={(e) =>
                      setDraftPtt((prev) => ({
                        ...prev,
                        channels: {
                          ...prev.channels,
                          [slot]: {
                            ...prev.channels[slot],
                            id: e.target.value,
                          },
                        },
                      }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {channelOptions.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.label}
                      </option>
                    ))}
                  </select>
                  <div className="min-h-10 px-3 py-2 rounded-lg bg-black/30 border border-white/10 flex items-center">
                    {recordingSlot === slot ? (
                      <span className="text-[#3C83F6] text-sm">Press keys...</span>
                    ) : slotValue.key.length > 0 ? (
                      <span className="text-sm">{slotValue.key.join(" + ")}</span>
                    ) : (
                      <span className="text-sm text-[#BFBFBF]">No Keybind</span>
                    )}
                  </div>
                  <button
                    className={`px-3 py-2 rounded-lg border cursor-pointer ${
                      recordingSlot === slot
                        ? "bg-[#f63c3c1a] border-[#f63c3c1a] text-[#f63c3c]"
                        : "bg-[#3C83F61A] border-[#3C83F61A] text-[#3C83F6]"
                    }`}
                    onClick={() => {
                      setPressedKeys([]);
                      setRecordingSlot((prev) => (prev === slot ? null : slot));
                    }}
                  >
                    {recordingSlot === slot ? "Recording..." : "Record"}
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg border bg-[#8080801A] border-[#8080801A] text-[#BFBFBF] cursor-pointer"
                    onClick={() =>
                      setDraftPtt((prev) => ({
                        ...prev,
                        channels: {
                          ...prev.channels,
                          [slot]: {
                            ...prev.channels[slot],
                            key: [],
                          },
                        },
                      }))
                    }
                  >
                    Clear
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#0B1220] border border-white/10">
          <div className="font-semibold">Audio Devices</div>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-[#BFBFBF]">Input Device (TX)</label>
              <select
                className="w-full mt-1 rounded-lg bg-black/30 border border-white/10 px-2 py-2"
                value={draft.inputDeviceId}
                onChange={(e) => setDraft((prev) => ({ ...prev, inputDeviceId: e.target.value }))}
              >
                <option value="">System Default</option>
                {inputDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-[#BFBFBF]">Output Device (RX)</label>
              <select
                className="w-full mt-1 rounded-lg bg-black/30 border border-white/10 px-2 py-2"
                value={draft.outputDeviceId}
                onChange={(e) => setDraft((prev) => ({ ...prev, outputDeviceId: e.target.value }))}
              >
                <option value="">System Default</option>
                {outputDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
