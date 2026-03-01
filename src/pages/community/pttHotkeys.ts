import { useEffect, useRef, type MutableRefObject } from "react";
import type { CommunityPttChannels } from "@components/UI/CommunityConsoleSettingsDialog";

export type QuickPttCombo = {
  slotKey: keyof CommunityPttChannels;
  channelId: string;
  channelName: string;
  combo: string[];
};

type PttHotkeysOptions = {
  communityId?: string;
  editMode: boolean;
  quickPttCombos: QuickPttCombo[];
  globalPttCombo: string[];
  listenedChannelIds: string[];
  localPttActive: boolean;
  activePttChannelsRef: MutableRefObject<string[]>;
  txAudio: {
    playStart: boolean;
    playEnd: boolean;
  };
  transmitPtt: (
    active: boolean,
    channelIds?: string[],
    indicatorLabel?: string,
    playHotCue?: boolean,
  ) => Promise<void> | void;
  outputDeviceId: any;
  setPttDebug: (value: string) => void;
  toast: (message: string, options?: { type?: "warning" | "success" | "error" | "info" }) => void;
  debugEnabled?: boolean;
};

function formatKeyboardKey(e: KeyboardEvent): string | null {
  const { key, code, location } = e;
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
  return [...new Set(keys.filter(Boolean).map((k) => k.replace(/^L|^R/, "")))].sort((a, b) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

function comboMatches(activeKeys: Set<string>, combo: string[]) {
  const sanitizedCombo = combo.filter(Boolean);
  if (sanitizedCombo.length === 0) return false;
  const active = sortCombo(Array.from(activeKeys));
  const expected = sortCombo(sanitizedCombo);
  if (active.length !== expected.length) return false;
  return expected.every((k, i) => k === active[i]);
}

export function useCommunityPttHotkeys({
  communityId,
  editMode,
  quickPttCombos,
  globalPttCombo,
  listenedChannelIds,
  localPttActive,
  activePttChannelsRef,
  transmitPtt,
  setPttDebug,
  toast,
  txAudio,
  outputDeviceId,
  debugEnabled = false,
}: PttHotkeysOptions) {
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const activeHotkeyComboRef = useRef<string[] | null>(null);
  const warningCooldownRef = useRef<Record<string, number>>({});
  const externalHotkeyActiveRef = useRef<"global" | keyof CommunityPttChannels | null>(null);

  const updateDebug = (message: string) => {
    if (!debugEnabled) return;
    setPttDebug(message);
  };

  useEffect(() => {
    if (!window.api?.pttHotkeys) return;
    window.api.pttHotkeys.configure(communityId).catch(() => {
      // noop
    });
    return () => {
      window.api?.pttHotkeys?.configure(undefined).catch(() => {
        // noop
      });
    };
  }, [communityId, quickPttCombos, globalPttCombo]);

  useEffect(() => {
    if (!window.api?.pttHotkeys) return;

    const unsubscribe = window.api.pttHotkeys.onEvent((event) => {
      // Renderer key handling owns focused mode; global shortcuts are only for unfocused.
      if (document.hasFocus()) return;
      if (editMode) return;
      if (!communityId || event.communityId !== communityId) return;

      if (event.action === "down") {
        if (localPttActive) return;
        if (event.scope === "global") {
          if (listenedChannelIds.length === 0) {
            updateDebug("global external listened=none action=blocked");
            toast("No listening channels selected for global PTT.", { type: "warning" });
            return;
          }
          externalHotkeyActiveRef.current = "global";
          updateDebug(`global external listened=${listenedChannelIds.join(",")} action=activate`);
          void transmitPtt(true, listenedChannelIds, "GLOBAL", true);
          return;
        }

        if (event.scope === "community" && event.slot) {
          const matched = quickPttCombos.find((binding) => binding.slotKey === event.slot);
          if (!matched) return;
          externalHotkeyActiveRef.current = event.slot;
          updateDebug(
            `quick:${matched.slotKey} external resolved=${matched.channelId} action=activate`,
          );
          void transmitPtt(true, [matched.channelId], matched.channelName, true);
        }
        return;
      }

      if (event.action === "up") {
        if (!localPttActive) return;
        if (!externalHotkeyActiveRef.current) return;
        const activeChannels = activePttChannelsRef.current;
        externalHotkeyActiveRef.current = null;
        void transmitPtt(false, activeChannels.length > 0 ? activeChannels : listenedChannelIds);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [
    communityId,
    editMode,
    listenedChannelIds.join("|"),
    localPttActive,
    quickPttCombos,
    toast,
    transmitPtt,
    debugEnabled,
  ]);

  useEffect(() => {
    if ((quickPttCombos.length === 0 && globalPttCombo.length === 0) || editMode) return;

    const warnOnce = (key: string, message: string) => {
      const now = Date.now();
      const last = warningCooldownRef.current[key] ?? 0;
      if (now - last < 1200) return;
      warningCooldownRef.current[key] = now;
      toast(message, { type: "warning" });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = formatKeyboardKey(e);
      if (!key) return;
      pressedKeysRef.current.add(key);
      if (localPttActive) return;

      const matched = quickPttCombos.find((binding) =>
        comboMatches(pressedKeysRef.current, binding.combo),
      );
      if (matched) {
        if (!listenedChannelIds.includes(matched.channelId)) {
          warnOnce("ptt_quick_not_listening", `PTT channel "${matched.channelName}" is not selected/listening.`);
          return;
        }
        updateDebug(
          `quick:${matched.slotKey} combo=[${matched.combo.join("+")}] resolved=${matched.channelId} action=activate`,
        );
        e.preventDefault();
        activeHotkeyComboRef.current = matched.combo;
        void transmitPtt(true, [matched.channelId], matched.channelName, true);
        return;
      }

      if (globalPttCombo.length > 0 && comboMatches(pressedKeysRef.current, globalPttCombo) && listenedChannelIds.length > 0) {
        updateDebug(
          `global combo=[${globalPttCombo.join("+")}] listened=${listenedChannelIds.join(",")} action=activate`,
        );
        e.preventDefault();
        activeHotkeyComboRef.current = globalPttCombo;
        void transmitPtt(true, listenedChannelIds, "GLOBAL", true);
      } else if (globalPttCombo.length > 0 && comboMatches(pressedKeysRef.current, globalPttCombo) && listenedChannelIds.length === 0) {
        updateDebug(
          `global combo=[${globalPttCombo.join("+")}] listened=none action=blocked`,
        );
        warnOnce("ptt_global_no_channels", "No listening channels selected for global PTT.");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = formatKeyboardKey(e);
      if (!key) return;
      pressedKeysRef.current.delete(key);
      if (!localPttActive) return;
      if (!activeHotkeyComboRef.current) return;
      const stillMatching = comboMatches(pressedKeysRef.current, activeHotkeyComboRef.current);
      if (!stillMatching) {
        e.preventDefault();
        const activeChannels = activePttChannelsRef.current;
        void transmitPtt(false, activeChannels.length > 0 ? activeChannels : listenedChannelIds);
      }
    };

    const handleBlur = () => {
      pressedKeysRef.current.clear();
      if (localPttActive) {
        void transmitPtt(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [
    quickPttCombos,
    globalPttCombo,
    localPttActive,
    editMode,
    listenedChannelIds.join("|"),
    transmitPtt,
    toast,
    debugEnabled,
  ]);
}
