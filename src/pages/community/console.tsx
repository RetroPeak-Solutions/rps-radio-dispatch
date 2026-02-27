"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Tab } from "@headlessui/react";
import {
  DndContext,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useLoading } from "@context/Loading";
import { useSocket } from "@context/SocketProvider";
import { useToast } from "@context/ToastProvider";
import axios from "axios";
import link from "@utils/link";
import playQuickCall2 from "@utils/playQC2Tone";
import type { QuickCall2ToneSet, RadioChannel, RadioZone } from "@lib/types";
import DragCard from "@components/UI/DragCard";
import CommunityConsoleSettingsDialog, {
  type CommunityPttBindings,
  type CommunityPttChannels,
  type ConsoleSettingsState,
} from "@components/UI/CommunityConsoleSettingsDialog";
import { useCommunityPttHotkeys } from "@pages/community/pttHotkeys";
import { Settings } from "lucide-react";
import InstantPTT from "@assets/imgs/instantptt.png";
import PageSelect from "@assets/imgs/pageselect.png";
import ChannelMarker from "@assets/imgs/channelmarker.png";
import getSessionUser from "@root/src/utils/getSessionUser";

type Position = { x: string; y: string };

type CommunityData = {
  id: string;
  name: string;
  radioZones: RadioZone[];
  radioChannels: RadioChannel[];
  tones: QuickCall2ToneSet[];
};

type AppSettings = Awaited<ReturnType<typeof window.api.settings.get>>;

type TonePacket = {
  id: string;
  name: string;
  toneAHz: number;
  toneBHz: number;
  durationA: number;
  durationB: number;
};

const CARD_WIDTH = 350;
const CARD_HEIGHT = 150;
const CARD_SPACING = 16;
const SNAP_DISTANCE = 28;

const MIN_CANVAS_HEIGHT = 600;
const MAX_CANVAS_HEIGHT = 2000;

const DEFAULT_CONSOLE_SETTINGS: ConsoleSettingsState = {
  gridSnapping: true,
  inputDeviceId: "",
  outputDeviceId: "",
};
const SHOW_PTT_DEBUG = false;

const EMPTY_SLOT = { id: "", key: [] as string[] };
const DEFAULT_COMMUNITY_PTT_CHANNELS: CommunityPttChannels = {
  ch1: { ...EMPTY_SLOT },
  ch2: { ...EMPTY_SLOT },
  ch3: { ...EMPTY_SLOT },
  ch4: { ...EMPTY_SLOT },
  ch5: { ...EMPTY_SLOT },
};

function parsePosition(pos: Position) {
  return { x: parseFloat(pos.x) || 0, y: parseFloat(pos.y) || 0 };
}

function serializePosition(pos: { x: number; y: number }): Position {
  return { x: pos.x.toString(), y: pos.y.toString() };
}

function normalizeSettings(settings: AppSettings | null): AppSettings {
  return {
    ...(settings ?? {}),
    placements: settings?.placements ?? { channels: [], tones: [], alerts: [] },
    keybinds: settings?.keybinds ?? { ptt: { global: { key: [] }, communities: [] } },
  } as AppSettings;
}

function getCommunityConsoleSettings(settings: AppSettings | null, communityId?: string) {
  if (!communityId) return DEFAULT_CONSOLE_SETTINGS;
  const raw = (settings as any)?.communityConsole?.[communityId] ?? {};
  return {
    ...DEFAULT_CONSOLE_SETTINGS,
    ...raw,
  } as ConsoleSettingsState;
}

function getCommunityPttBindings(settings: AppSettings | null, communityId?: string): CommunityPttBindings {
  const id = communityId ?? "";
  const communities = settings?.keybinds?.ptt?.communities ?? [];
  const found = communities.find((c: any) => c.id === id);
  const channels = found?.channels ?? {};
  const withDefaults: CommunityPttChannels = {
    ch1: { ...EMPTY_SLOT, ...(channels?.ch1 ?? {}) },
    ch2: { ...EMPTY_SLOT, ...(channels?.ch2 ?? {}) },
    ch3: { ...EMPTY_SLOT, ...(channels?.ch3 ?? {}) },
    ch4: { ...EMPTY_SLOT, ...(channels?.ch4 ?? {}) },
    ch5: { ...EMPTY_SLOT, ...(channels?.ch5 ?? {}) },
  };
  return { id, channels: withDefaults };
}

function volumeToDb(volume: number) {
  if (volume <= 0) return -60;
  return 20 * Math.log10(volume / 100);
}

const AUDIO_SFX = {
  talkActive: "/assets/audio/talk_active.mp3",
  talkDenied: "/assets/audio/talk_denied.mp3",
  talkEnd: "/assets/audio/talk_end.mp3",
  hold: "/assets/audio/hold.wav",
  emergency: "/assets/audio/emergency.wav",
  alert1: "/assets/audio/alert1.wav",
  alert2: "/assets/audio/alert2.wav",
  alert3: "/assets/audio/alert3.wav",
} as const;

const playSfx = async (src: string, volume = 0.8, outputDeviceId: any) => {
  const audio = new Audio(src);
  audio.volume = volume;
  const sinkId = outputDeviceId;
  if (sinkId && typeof (audio as any).setSinkId === "function") {
    try {
      await (audio as any).setSinkId(sinkId);
    } catch {
      // ignore
    }
  }

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    audio.play().catch(finish);
    setTimeout(finish, 6000);
  });
};

function resolveToneSfx(tone?: Partial<TonePacket>) {
  const raw = `${tone?.id ?? ""} ${tone?.name ?? ""}`.toLowerCase();
  if (!raw) return null;
  if (raw.includes("emergency") || raw.includes("panic")) return AUDIO_SFX.emergency;
  if (raw.includes("hold")) return AUDIO_SFX.hold;
  if (raw.includes("alert1") || raw.includes("alert 1") || raw.includes("alert_1")) return AUDIO_SFX.alert1;
  if (raw.includes("alert2") || raw.includes("alert 2") || raw.includes("alert_2")) return AUDIO_SFX.alert2;
  if (raw.includes("alert3") || raw.includes("alert 3") || raw.includes("alert_3")) return AUDIO_SFX.alert3;
  return null;
}

function DraggableItem({
  id,
  children,
  pos,
  drag,
}: {
  id: string;
  children: React.ReactNode;
  pos: { x: number; y: number };
  drag: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...(drag ? listeners : {})}
      {...(drag ? attributes : {})}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        cursor: drag ? (isDragging ? "grabbing" : "grab") : "auto",
        userSelect: "none",
        zIndex: isDragging ? 999 : "auto",
      }}
    >
      {children}
    </div>
  );
}

export default function CommunityConsole() {
  const navigate = useNavigate();
  const params = useParams();
  const communityId = params.id;
  const { setLoading } = useLoading();
  const { socket } = useSocket();
  const { toast } = useToast();

  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [consoleSettings, setConsoleSettings] =
    useState<ConsoleSettingsState>(DEFAULT_CONSOLE_SETTINGS);
  const [communityPttBindings, setCommunityPttBindings] = useState<CommunityPttBindings>({
    id: "",
    channels: DEFAULT_COMMUNITY_PTT_CHANNELS,
  });
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [channelListening, setChannelListening] = useState<Record<string, boolean>>({});
  const [channelPageState, setChannelPageState] = useState<Record<string, boolean>>({});
  const [channelLastSrc, setChannelLastSrc] = useState<Record<string, string>>({});
  const [channelReceiving, setChannelReceiving] = useState<Record<string, boolean>>({});
  const [channelTransmitting, setChannelTransmitting] = useState<Record<string, boolean>>({});
  const [channelToneReceiving, setChannelToneReceiving] = useState<Record<string, boolean>>({});
  const [channelToneTransmitting, setChannelToneTransmitting] = useState<Record<string, boolean>>({});
  const [toneQueue, setToneQueue] = useState<string[]>([]);
  const [canvasHeight, setCanvasHeight] = useState(MIN_CANVAS_HEIGHT);
  const [zuluTime, setZuluTime] = useState("");
  const [localPttActive, setLocalPttActive] = useState(false);
  const [activePttIndicator, setActivePttIndicator] = useState<string | null>(null);
  const [pttDebug, setPttDebug] = useState("");

  const dragStartPos = useRef<Record<string, { x: number; y: number }>>({});
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rxMonitorAudioRef = useRef<HTMLAudioElement | null>(null);
  const activePttChannelsRef = useRef<string[]>([]);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const activeVoiceChannelsRef = useRef<string[]>([]);
  const voiceSequenceRef = useRef(0);
  const incomingVoiceQueueRef = useRef<Array<{ src: string; volume: number }>>([]);
  const incomingVoicePlayingRef = useRef(false);
  const hotCuePendingRef = useRef(false);

  const playPttIndicatorTone = (kind: "start" | "end" | "denied") => {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx: AudioContext = new AudioCtx();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);

    const osc = ctx.createOscillator();
    osc.type = kind === "denied" ? "square" : "sine";
    osc.connect(gain);
    osc.start();

    // if (kind === "start") {

    //   return;
    // }
    // if (kind === "denied") {

    //   return;
    // }

    if (kind === "start") {
      // void playSfx(AUDIO_SFX.talkActive, 0.85, consoleSettings.outputDeviceId);
      // osc.frequency.setValueAtTime(900, ctx.currentTime);
      // osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.07);
      // return;
    } else if (kind === "end") {
      // void playSfx(AUDIO_SFX.talkEnd, 0.85, consoleSettings.outputDeviceId);
      // osc.frequency.setValueAtTime(900, ctx.currentTime);
      // osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.07);
    } else {
      void playSfx(AUDIO_SFX.talkDenied, 0.9, consoleSettings.outputDeviceId);
      // osc.frequency.setValueAtTime(240, ctx.currentTime);
      // osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);
      // return;
    }

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === "denied" ? 0.14 : 0.09));
    osc.stop(ctx.currentTime + (kind === "denied" ? 0.14 : 0.09));
    setTimeout(() => {
      try {
        ctx.close();
      } catch { }
    }, 220);
  };

  const blobToBase64 = async (blob: Blob): Promise<string> => {
    const arr = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < arr.length; i += chunk) {
      binary += String.fromCharCode(...arr.subarray(i, i + chunk));
    }
    return btoa(binary);
  };

  const decodeBase64ToBlob = (base64: string, mimeType: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  };

  const drainIncomingVoiceQueue = () => {
    if (incomingVoicePlayingRef.current) return;
    const next = incomingVoiceQueueRef.current.shift();
    if (!next) return;
    incomingVoicePlayingRef.current = true;
    const audio = new Audio(next.src);
    audio.volume = next.volume;
    const sinkId = consoleSettings.outputDeviceId;
    const play = async () => {
      if (sinkId && typeof (audio as any).setSinkId === "function") {
        try {
          await (audio as any).setSinkId(sinkId);
        } catch {
          // ignore
        }
      }
      await audio.play();
    };
    const finish = () => {
      incomingVoicePlayingRef.current = false;
      URL.revokeObjectURL(next.src);
      drainIncomingVoiceQueue();
    };
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    play().catch(finish);
  };

  const enqueueIncomingVoiceChunk = (
    chunkBase64: string,
    mimeType: string,
    channelIds: string[],
  ) => {
    const listened = channelIds.filter((id) => channelListening[id]);
    if (listened.length === 0) return;
    const perChannelVolumes = listened.map((id) => volumes[id] ?? 50);
    const volume = Math.max(...perChannelVolumes, 50) / 100;
    const blob = decodeBase64ToBlob(chunkBase64, mimeType || "audio/webm;codecs=opus");
    const src = URL.createObjectURL(blob);
    incomingVoiceQueueRef.current.push({ src, volume });
    drainIncomingVoiceQueue();
  };

  const stopVoiceCapture = () => {
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== "inactive") {
      try {
        voiceRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    voiceRecorderRef.current = null;
    activeVoiceChannelsRef.current = [];
  };

  const startVoiceCapture = async (channelIds: string[]) => {
    if (!socket || !communityId || channelIds.length === 0) return;
    activeVoiceChannelsRef.current = channelIds;
    if (voiceRecorderRef.current && voiceRecorderRef.current.state !== "inactive") return;
    const stream = await ensureMicStream();
    if (!stream || typeof MediaRecorder === "undefined") return;

    const mimeCandidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    voiceRecorderRef.current = recorder;
    voiceSequenceRef.current = 0;

    recorder.ondataavailable = async (event) => {
      console.log(`[PTT] Captured voice chunk for channels ${channelIds.join(", ")} (size: ${event.data.size} bytes)`);
      if (!event.data || event.data.size === 0) {
        console.log("[PTT] No data in recorded chunk");
        return;
      };
      if (!socket) {
        console.log("[PTT] Socket not available for recorded chunk");
        return;
      }
      if (channelIds.length === 0) {
        console.log("[PTT] No active channels for recorded chunk");
        return;
      }
      const chunkBase64 = await blobToBase64(event.data);
      socket.emit("dispatch:voice", {
        communityId,
        channelIds: channelIds,
        source: "You",
        mimeType: event.data.type || mimeType || "audio/webm;codecs=opus",
        chunkBase64,
        sequence: voiceSequenceRef.current++,
        timestamp: Date.now(),
      });
    };

    try {
      recorder.start(120);
    } catch (err) {
      console.error("[PTT] Failed to start voice capture", err);
      voiceRecorderRef.current = null;
    }
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const sortedZones = useMemo(
    () => (community ? [...community.radioZones].sort((a, b) => a.codeplugIndex - b.codeplugIndex) : []),
    [community],
  );
  const activeZone = sortedZones[activeZoneIndex];
  const activeZoneItemIds = useMemo(
    () =>
      new Set<string>([
        ...(activeZone?.channels.map((c) => c.id) ?? []),
        ...(activeZone?.toneSets?.map((t) => t.id) ?? []),
      ]),
    [activeZone],
  );
  const listenedChannelIds = useMemo(
    () => Object.entries(channelListening).filter(([, on]) => on).map(([id]) => id),
    [channelListening],
  );
  const channelNameById = useMemo(() => {
    const map: Record<string, string> = {};
    sortedZones.forEach((zone) => {
      zone.channels.forEach((entry) => {
        map[entry.id] = entry.channel?.name ?? entry.channelId ?? entry.id;
        if (entry.channelId) {
          map[entry.channelId] = entry.channel?.name ?? entry.channelId;
        }
      });
    });
    return map;
  }, [sortedZones]);
  const zoneChannelIdByRadioChannelId = useMemo(() => {
    const map: Record<string, string> = {};
    // Prefer active zone mapping first, then fallback to first seen in other zones.
    activeZone?.channels.forEach((entry) => {
      if (entry.channelId) map[entry.channelId] = entry.id;
    });
    sortedZones.forEach((zone) => {
      zone.channels.forEach((entry) => {
        if (entry.channelId && !map[entry.channelId]) map[entry.channelId] = entry.id;
      });
    });
    return map;
  }, [sortedZones, activeZone]);
  const zoneChannelIdsByRadioChannelId = useMemo(() => {
    const map: Record<string, string[]> = {};
    sortedZones.forEach((zone) => {
      zone.channels.forEach((entry) => {
        if (!entry.channelId) return;
        if (!map[entry.channelId]) map[entry.channelId] = [];
        map[entry.channelId].push(entry.id);
      });
    });
    return map;
  }, [sortedZones]);
  const allZoneChannelIds = useMemo(() => {
    const set = new Set<string>();
    sortedZones.forEach((zone) => {
      zone.channels.forEach((entry) => set.add(entry.id));
    });
    return set;
  }, [sortedZones]);
  const radioChannelIdByZoneChannelId = useMemo(() => {
    const map: Record<string, string> = {};
    sortedZones.forEach((zone) => {
      zone.channels.forEach((entry) => {
        if (entry.channelId) map[entry.id] = entry.channelId;
      });
    });
    return map;
  }, [sortedZones]);
  const activeCommunityPtt = useMemo(() => {
    if (communityPttBindings?.id && communityPttBindings.id === (communityId ?? "")) {
      return communityPttBindings;
    }
    return getCommunityPttBindings(settings, communityId);
  }, [communityPttBindings, settings, communityId]);
  const quickPttCombos = useMemo(
    () => {
      const resolveSlotChannelId = (slotId: string) => {
        if (allZoneChannelIds.has(slotId)) return slotId;
        const candidates = zoneChannelIdsByRadioChannelId[slotId] ?? [];
        const listenedCandidate = candidates.find((id) => channelListening[id]);
        if (listenedCandidate) return listenedCandidate;
        return candidates[0] ?? slotId;
      };
      return (
        (Object.entries(activeCommunityPtt.channels) as Array<
          [keyof CommunityPttChannels, CommunityPttChannels[keyof CommunityPttChannels]]
        >)
          .filter(([, slot]) => slot.id && Array.isArray(slot.key) && slot.key.length > 0)
          .map(([slotKey, slot]) => ({
            slotKey,
            channelId: resolveSlotChannelId(slot.id),
            channelName:
              channelNameById[
              resolveSlotChannelId(slot.id)
              ] ?? channelNameById[slot.id] ?? slot.id,
            combo: slot.key.filter(Boolean),
          }))
      );
    },
    [activeCommunityPtt, channelNameById, allZoneChannelIds, zoneChannelIdsByRadioChannelId, channelListening],
  );
  const globalPttCombo = useMemo(
    () => settings?.keybinds?.ptt?.global?.key?.filter(Boolean) ?? [],
    [settings],
  );
  const tonePlaybackBusy = useMemo(
    () =>
      Object.values(channelToneTransmitting).some(Boolean) ||
      Object.values(channelToneReceiving).some(Boolean),
    [channelToneTransmitting, channelToneReceiving],
  );

  const normalizeToZoneChannelId = (channelId: string) => {
    if (allZoneChannelIds.has(channelId)) return channelId;
    const candidates = zoneChannelIdsByRadioChannelId[channelId] ?? [];
    const listenedCandidate = candidates.find((id) => channelListening[id]);
    if (listenedCandidate) return listenedCandidate;
    return candidates[0] ?? zoneChannelIdByRadioChannelId[channelId] ?? channelId;
  };

  const isListeningChannelId = (channelId: string) => {
    const zoneId = normalizeToZoneChannelId(channelId);
    if (channelListening[zoneId]) return true;
    const radioId = radioChannelIdByZoneChannelId[zoneId];
    if (radioId && channelListening[radioId]) return true;
    return false;
  };

  const toggleListening = (channelId: string) => {
    if (editMode || !communityId) return;
    setChannelListening((prev) => {
      const next = !prev[channelId];
      socket?.emit("dispatch:listen", {
        communityId,
        channelId,
        listening: next,
      });
      return { ...prev, [channelId]: next };
    });
  };

  const persistSettings = async (next: AppSettings) => {
    setSettings(next);
    await window.api.settings.set(next as any);
  };

  const updateConsoleSettings = async (nextValue: {
    consoleSettings: ConsoleSettingsState;
    pttBindings: CommunityPttBindings;
  }) => {
    const { consoleSettings: nextConsole, pttBindings } = nextValue;
    setConsoleSettings(nextConsole);
    setCommunityPttBindings(pttBindings);
    if (!communityId) return;
    const base = normalizeSettings(settings);
    const communities = [...(base.keybinds?.ptt?.communities ?? [])];
    const existingIndex = communities.findIndex((entry: any) => entry.id === communityId);
    const normalizedBindings = { ...pttBindings, id: communityId };
    if (existingIndex >= 0) communities[existingIndex] = normalizedBindings as any;
    else communities.push(normalizedBindings as any);

    const next: AppSettings = {
      ...base,
      communityConsole: {
        ...((base as any).communityConsole ?? {}),
        [communityId]: nextConsole,
      },
      keybinds: {
        ...base.keybinds,
        ptt: {
          ...base.keybinds.ptt,
          communities,
        },
      },
    } as AppSettings;
    await persistSettings(next);
  };

  const ensureMicStream = async () => {
    if (micStreamRef.current) return micStreamRef.current;
    try {
      const constraints: MediaStreamConstraints = {
        audio: consoleSettings.inputDeviceId
          ? { deviceId: { exact: consoleSettings.inputDeviceId } }
          : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("[PTT] Failed to initialize input device", err);
      return null;
    }
  };

  const stopMicStream = () => {
    stopVoiceCapture();
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
  };

  const setChannelsState = (ids: string[], key: "tx" | "rx", value: boolean) => {
    const setter = key === "tx" ? setChannelTransmitting : setChannelReceiving;
    setter((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = value;
      });
      return next;
    });
  };

  const setToneChannelsState = (ids: string[], key: "tx" | "rx", value: boolean) => {
    const setter = key === "tx" ? setChannelToneTransmitting : setChannelToneReceiving;
    setter((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = value;
      });
      return next;
    });
  };

  const transmitPtt = useCallback(async (
    active: boolean,
    channelIds = listenedChannelIds,
    indicatorLabel?: string,
    playHotCue = false,
  ) => {
    if (!communityId) {
      console.warn("Cannot transmit PTT - no community ID");
      return;
    }
    if (active && channelIds.length === 0) {
      toast("No channels selected for transmission.", { type: "warning" });
      return;
    }
    // if (!communityId || channelIds.length === 0) return;
    const normalizedChannelIds = Array.from(new Set(channelIds.map((id) => normalizeToZoneChannelId(id))));
    if (active) {
      await ensureMicStream();
      if (playHotCue) {
        playPttIndicatorTone("start");
        hotCuePendingRef.current = true;
      }
    } else {
      stopMicStream();
      hotCuePendingRef.current = false;
    }

    setLocalPttActive(active);
    activePttChannelsRef.current = active ? normalizedChannelIds : [];
    if (!active) {
      setActivePttIndicator(null);
    } else {
      setActivePttIndicator(indicatorLabel ?? (normalizedChannelIds.length === 1 ? normalizedChannelIds[0] : "ACTIVE"));
    }
    setChannelsState(normalizedChannelIds, "tx", active);
    setChannelLastSrc((prev) => {
      const next = { ...prev };
      normalizedChannelIds.forEach((id) => {
        next[id] = active ? "You" : next[id] ?? "You";
      });
      return next;
    });

    socket?.emit("dispatch:ptt", {
      communityId,
      channelIds: normalizedChannelIds,
      active,
      source: "You",
      timestamp: Date.now(),
    });
  }, [communityId, listenedChannelIds, normalizeToZoneChannelId, socket]);

  const playTones = async (
    tones: TonePacket[],
    channelIds: string[],
    onToneFinished?: (tone: TonePacket) => void,
  ) => {
    if (tones.length === 0) return;
    const targetChannel = channelIds.find((id) => channelListening[id]) ?? channelIds[0];
    const volume = volumes[targetChannel] ?? 50;
    const volumeDb = volumeToDb(volume);

    for (let i = 0; i < tones.length; i += 1) {
      const tone = tones[i];
      const mappedSfx = resolveToneSfx(tone);
      if (mappedSfx) {
        await playSfx(mappedSfx, volume / 100);
      } else {
        await new Promise<void>((resolve) => {
          playQuickCall2(
            tone.toneAHz,
            tone.toneBHz,
            tone.durationA,
            tone.durationB,
            () => resolve(),
            volumeDb,
          );
        });
      }
      onToneFinished?.(tone);
      if (i < tones.length - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  const transmitTonePackets = async (tones: TonePacket[]) => {
    if (!communityId || tones.length === 0) return;
    const channels = listenedChannelIds.filter((id) => channelPageState[id] === true);
    if (channels.length === 0) {
      toast("No active page-state channels selected for tone transmit.", { type: "warning" });
      return;
    }

    setToneChannelsState(channels, "tx", true);
    setChannelLastSrc((prev) => {
      const next = { ...prev };
      channels.forEach((id) => {
        next[id] = "You";
      });
      return next;
    });

    await playTones(tones, channels, (finishedTone) => {
      setToneQueue((prev) => prev.filter((id) => id !== finishedTone.id));
    });
    setToneChannelsState(channels, "tx", false);
    setChannelPageState((prev) => {
      const next = { ...prev };
      channels.forEach((id) => {
        next[id] = false;
      });
      return next;
    });

    socket?.emit("dispatch:tone", {
      communityId,
      channelIds: channels,
      source: "You",
      tones,
      timestamp: Date.now(),
    });
  };

  // ---------------- FETCH ----------------
  useEffect(() => {
    if (!communityId || community) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${link("prod")}/api/communities/${communityId}`, {
          withCredentials: true,
        });
        setCommunity(res.data.community);

        const loaded = normalizeSettings((await window.api.settings.get()) ?? null);
        setSettings(loaded);
        setConsoleSettings(getCommunityConsoleSettings(loaded, communityId));
        setCommunityPttBindings(getCommunityPttBindings(loaded, communityId));

        const initial: Record<string, { x: number; y: number }> = {};
        (loaded.placements?.channels ?? []).forEach((c: any) => {
          initial[c.id] = parsePosition(c.pos);
        });
        (loaded.placements?.tones ?? []).forEach((t: any) => {
          initial[t.id] = parsePosition(t.pos);
        });
        setPositions(initial);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityId, community, setLoading]);

  // ---------------- SOCKET JOIN + EVENTS ----------------
  useEffect(() => {
    if (!socket || !communityId) return;

    socket.emit("dispatch:join", { communityId, source: "Dispatch Console" });

    const onPtt = (event: { channelIds: string[]; active: boolean; source?: string; }) => {
      const ids = event.channelIds ?? [];
      if (ids.length === 0) return;
      const normalizedIds = Array.from(new Set(ids.map((id) => normalizeToZoneChannelId(id))));

      setChannelsState(normalizedIds, "rx", event.active);
      setChannelLastSrc((prev) => {
        const next = { ...prev };
        normalizedIds.forEach((id) => {
          next[id] = event.source || "Unknown";
        });
        return next;
      });
    };

    const onTone = async (event: {
      channelIds: string[];
      source?: string;
      tones: TonePacket[];
    }) => {
      const ids = event.channelIds ?? [];
      if (ids.length === 0) return;
      const normalizedIds = Array.from(new Set(ids.map((id) => normalizeToZoneChannelId(id))));

      setChannelLastSrc((prev) => {
        const next = { ...prev };
        normalizedIds.forEach((id) => {
          next[id] = event.source || "Unknown";
        });
        return next;
      });

      const localChannels = normalizedIds.filter((id) => isListeningChannelId(id));
      if (localChannels.length > 0) {
        setToneChannelsState(localChannels, "rx", true);
        await playTones(event.tones ?? [], localChannels);
        setToneChannelsState(localChannels, "rx", false);
      }
    };

    const onLastSrc = (event: { channelId?: string; source?: string }) => {
      if (!event?.channelId) return;
      setChannelLastSrc((prev) => ({ ...prev, [event.channelId as string]: event.source || "Unknown" }));
    };

    const onPttStatus = (event: {
      status?: "granted" | "ended" | "denied";
      channelIds?: string[];
      busyChannelIds?: string[];
      busyBy?: Array<{ channelId: string; source: string }>;
    }) => {
      const ids = event.channelIds ?? [];
      if (event.status === "granted") {
        if (hotCuePendingRef.current) {
          hotCuePendingRef.current = false;
        } else {
          playPttIndicatorTone("start");
        }
        console.log(`[PTT] Transmit granted for channels ${ids.join(", ")}`);
        void startVoiceCapture(ids.length > 0 ? ids : activePttChannelsRef.current);
        return;
      }
      if (event.status === "ended") {
        playPttIndicatorTone("end");
        if (ids.length > 0) setChannelsState(ids.map((id) => normalizeToZoneChannelId(id)), "tx", false);
        stopVoiceCapture();
        return;
      }
      if (event.status === "denied") {
        playPttIndicatorTone("denied");
        setLocalPttActive(false);
        setActivePttIndicator(null);
        stopMicStream();
        stopVoiceCapture();
        const denyIds = ids.length > 0 ? ids : activePttChannelsRef.current;
        if (denyIds.length > 0) setChannelsState(denyIds.map((id) => normalizeToZoneChannelId(id)), "tx", false);
        activePttChannelsRef.current = [];
        const busySummary =
          event.busyBy && event.busyBy.length > 0
            ? event.busyBy.map((b) => `${b.channelId} (${b.source})`).join(", ")
            : (event.busyChannelIds ?? []).join(", ");
        toast(`PTT denied: channel busy${busySummary ? ` - ${busySummary}` : ""}.`, {
          type: "warning",
        });
      }
    };

    const onVoice = (event: {
      channelIds?: string[];
      chunkBase64?: string;
      mimeType?: string;
      socketId?: string;
    }) => {
      if (!event?.chunkBase64 || !Array.isArray(event.channelIds)) return;
      if (event.socketId && event.socketId === socket.id) return;
      const normalizedIds = Array.from(new Set(event.channelIds.map((id) => normalizeToZoneChannelId(id))));
      enqueueIncomingVoiceChunk(
        event.chunkBase64,
        event.mimeType || "audio/webm;codecs=opus",
        normalizedIds,
      );
    };

    socket.on("dispatch:ptt", onPtt);
    socket.on("dispatch:tone", onTone);
    socket.on("dispatch:last-src", onLastSrc);
    socket.on("dispatch:ptt-status", onPttStatus);
    socket.on("dispatch:voice", onVoice);

    return () => {
      stopVoiceCapture();
      socket.off("dispatch:ptt", onPtt);
      socket.off("dispatch:tone", onTone);
      socket.off("dispatch:last-src", onLastSrc);
      socket.off("dispatch:ptt-status", onPttStatus);
      socket.off("dispatch:voice", onVoice);
      socket.emit("dispatch:leave", { communityId });
    };
  }, [
    socket,
    communityId,
    channelListening,
    volumes,
    allZoneChannelIds,
    zoneChannelIdByRadioChannelId,
    radioChannelIdByZoneChannelId,
    consoleSettings.inputDeviceId,
    consoleSettings.outputDeviceId,
  ]);

  useEffect(() => {
    const audioEl = rxMonitorAudioRef.current as any;
    if (!audioEl || !consoleSettings.outputDeviceId) return;
    if (typeof audioEl.setSinkId !== "function") return;
    audioEl.setSinkId(consoleSettings.outputDeviceId).catch((err: unknown) => {
      console.error("[Audio] Failed to set output device", err);
    });
  }, [consoleSettings.outputDeviceId]);

  useCommunityPttHotkeys({
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
    txAudio: {
      playStart: settings?.txAudio?.playStart!,
      playEnd: settings?.txAudio?.playEnd!,
    },
    outputDeviceId: consoleSettings.outputDeviceId,
    debugEnabled: SHOW_PTT_DEBUG,
  });

  // ---------------- AUTO PLACEMENT ----------------
  useEffect(() => {
    if (!community || !canvasRef.current || !activeZone) return;

    setPositions((prev) => {
      const updated = { ...prev };
      const width = Math.max(canvasRef.current!.offsetWidth, CARD_WIDTH + CARD_SPACING * 2);
      const stepX = CARD_WIDTH + CARD_SPACING;
      const stepY = CARD_HEIGHT + CARD_SPACING;
      const columns = Math.max(1, Math.floor((width - CARD_SPACING) / stepX));
      let nextSlotIndex = 0;

      const getNextOpenPos = (id: string) => {
        if (updated[id]) return;

        while (true) {
          const col = nextSlotIndex % columns;
          const row = Math.floor(nextSlotIndex / columns);
          const candidate = { x: CARD_SPACING + col * stepX, y: CARD_SPACING + row * stepY };
          nextSlotIndex += 1;
          const occupied = Object.entries(updated).some(
            ([itemId, p]) => activeZoneItemIds.has(itemId) && p.x === candidate.x && p.y === candidate.y,
          );
          if (!occupied) {
            updated[id] = candidate;
            break;
          }
        }
      };

      activeZone.channels.forEach((c) => getNextOpenPos(c.id));
      activeZone.toneSets?.forEach((t) => getNextOpenPos(t.id));

      const lowest = Math.max(...Object.values(updated).map((p) => p.y + CARD_HEIGHT)) + CARD_SPACING;
      setCanvasHeight(Math.max(lowest, MIN_CANVAS_HEIGHT));

      return updated;
    });
  }, [community, activeZoneIndex, activeZone, activeZoneItemIds]);

  // ---------------- DRAG LOGIC ----------------
  const clampToCanvas = (x: number, y: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x, y };
    return {
      x: Math.max(0, Math.min(x, rect.width - CARD_WIDTH)),
      y: Math.max(0, Math.min(y, MAX_CANVAS_HEIGHT - CARD_HEIGHT)),
    };
  };

  const hasMinGapCollision = (
    candidate: { x: number; y: number },
    movingId: string,
    all: Record<string, { x: number; y: number }>,
  ) => {
    return Object.entries(all).some(([id, p]) => {
      if (id === movingId || !activeZoneItemIds.has(id)) return false;
      return (
        candidate.x < p.x + CARD_WIDTH + CARD_SPACING &&
        candidate.x + CARD_WIDTH + CARD_SPACING > p.x &&
        candidate.y < p.y + CARD_HEIGHT + CARD_SPACING &&
        candidate.y + CARD_HEIGHT + CARD_SPACING > p.y
      );
    });
  };

  const getSnappedPosition = (
    movingId: string,
    candidate: { x: number; y: number },
    all: Record<string, { x: number; y: number }>,
  ) => {
    if (!consoleSettings.gridSnapping) return candidate;

    const snapTargets: { x: number; y: number }[] = [];

    Object.entries(all).forEach(([id, p]) => {
      if (id === movingId || !activeZoneItemIds.has(id)) return;
      snapTargets.push(
        { x: p.x + CARD_WIDTH + CARD_SPACING, y: p.y },
        { x: p.x - CARD_WIDTH - CARD_SPACING, y: p.y },
        { x: p.x, y: p.y + CARD_HEIGHT + CARD_SPACING },
        { x: p.x, y: p.y - CARD_HEIGHT - CARD_SPACING },
      );
    });

    let best: { x: number; y: number } | null = null;
    let bestDistance = Infinity;

    snapTargets.forEach((target) => {
      const clamped = clampToCanvas(target.x, target.y);
      const distance = Math.hypot(candidate.x - clamped.x, candidate.y - clamped.y);
      if (distance > SNAP_DISTANCE) return;
      if (hasMinGapCollision(clamped, movingId, all)) return;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = clamped;
      }
    });

    return best ?? candidate;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    dragStartPos.current[id] = positions[id] ?? { x: 0, y: 0 };
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const id = event.active.id as string;
    const start = dragStartPos.current[id];
    if (!start) return;
    const next = clampToCanvas(start.x + event.delta.x, start.y + event.delta.y);
    setPositions((prev) => {
      const snapped = getSnappedPosition(id, next, prev);
      return { ...prev, [id]: snapped };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const id = event.active.id as string;
    const finalPos = positions[id];
    if (!finalPos) return;

    const base = normalizeSettings(settings);
    const placements = {
      channels: [...(base.placements?.channels ?? [])],
      tones: [...(base.placements?.tones ?? [])],
      alerts: [...(base.placements?.alerts ?? [])],
    };

    const isTone = activeZone?.toneSets?.some((t) => t.id === id);

    if (isTone) {
      const tone = placements.tones.find((t: any) => t.id === id);
      if (!tone) placements.tones.push({ id, pos: serializePosition(finalPos) } as any);
      else tone.pos = serializePosition(finalPos);
    } else {
      const ch = placements.channels.find((c: any) => c.id === id);
      if (!ch) placements.channels.push({ id, pos: serializePosition(finalPos) } as any);
      else ch.pos = serializePosition(finalPos);
    }

    await persistSettings({ ...base, placements } as AppSettings);
    delete dragStartPos.current[id];
  };

  // ---------------- ZULU TIME ----------------
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setZuluTime(now.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      stopMicStream();
    };
  }, []);

  if (!community) return null;

  return (
    <>
      <div className="min-h-screen bg-[#0B1220] text-white font-mono flex flex-col">
        <div className="z-10 fixed w-full flex justify-between p-2 bg-[#0C1524] border-b border-gray-700">
          <h1>{community.name} | Dispatch Console</h1>
          <div className="flex gap-2">
            <div
              className=" text-xl font-bold uppercase tracking-widest font-mono select-none text-[#3C83F6] drop-shadow-[0_0_6px_rgba(60,131,246,0.8)] px-2 py-1 rounded-md"
              style={{ pointerEvents: "none", zIndex: 100 }}
            >
              Zulu: {zuluTime}
            </div>
            <button
              className="p-2 rounded bg-[#8080801A] border border-[#8080801A] text-[#BFBFBF]"
              onClick={() => setSettingsDialogOpen(true)}
              aria-label="Community Console Settings"
              title="Community Console Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              className="px-3 py-1 rounded bg-[#8080801A] border border-[#8080801A] text-[#BFBFBF]"
              onClick={() => navigate("/")}
            >
              Exit Community
            </button>
          </div>
        </div>
        {SHOW_PTT_DEBUG ? (
          <div className="px-2 py-1 border-b border-gray-800 text-[11px] text-[#9CA3AF] truncate">
            PTT Debug: {pttDebug || "idle"}
          </div>
        ) : null}

        <Tab.Group selectedIndex={activeZoneIndex} onChange={setActiveZoneIndex}>
          <Tab.List className="z-10 fixed top-12 w-full flex bg-[#0C1524] border-b border-gray-700">
            {sortedZones.map((zone) => (
              <Tab
                key={zone.id}
                className={({ selected }) =>
                  selected ? "bg-[#3C83F6]/30 px-4 py-2" : "hover:bg-[#3C83F6]/20 px-4 py-2"
                }
              >
                {zone.name}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="fixed top-24 w-full flex-1 h-full">
            {sortedZones.map((zone, zoneIndex) => (
              <Tab.Panel key={zone.id}>
                <div
                  ref={zoneIndex === activeZoneIndex ? canvasRef : null}
                  className="relative w-full h-fit"
                  style={{ height: canvasHeight }}
                >

                  <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                  >
                    {zone.channels.map((ch) => {
                      const pos = positions[ch.id] || { x: 20, y: 20 };
                      const volume = volumes[ch.id] ?? 50;
                      const listening = channelListening[ch.id] ?? false;
                      const channelChildrenEnabled = listening;
                      const pageState = channelPageState[ch.id] ?? false;
                      const tx = channelTransmitting[ch.id] ?? false;
                      const rx = channelReceiving[ch.id] ?? false;
                      const toneTx = channelToneTransmitting[ch.id] ?? false;
                      const toneRx = channelToneReceiving[ch.id] ?? false;
                      const stateClass = tx
                        ? "border-red-400 shadow-[0_0_18px_rgba(248,113,113,0.5)]"
                        : toneTx
                          ? "border-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.5)]"
                          : rx
                            ? "border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                            : toneRx
                              ? "border-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.45)]"
                              : listening
                                ? "border-[#3C83F6] shadow-[0_0_16px_rgba(60,131,246,0.35)]"
                                : "border-[#2A3145]";

                      return (
                        <DraggableItem drag={editMode} key={ch.id} id={ch.id} pos={pos}>
                          <DragCard
                            className={`w-87.5 h-37.5 bg-linear-to-b from-[#1F2434] to-[#151A26] border flex flex-col ${stateClass}`}
                            onClick={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.closest("[data-interactive='true']")) return;
                              toggleListening(ch.id);
                            }}
                          >
                            <div className="flex flex-row gap-3">
                              <button
                                id="instantptt"
                                data-interactive="true"
                                className={`p-2 rounded-lg ${!channelChildrenEnabled
                                    ? "bg-[#4B5563] opacity-60 cursor-not-allowed"
                                    : tx
                                      ? "bg-red-500/80"
                                      : listening
                                        ? "bg-[#3C83F61A] border border-[#3C83F61A]"
                                        : "bg-[#9CA3AF]"
                                  }`}
                                disabled={!channelChildrenEnabled}
                                onPointerDown={(e) => {
                                  if (!channelChildrenEnabled) return;
                                  e.stopPropagation();
                                  void transmitPtt(true, [ch.id], ch.channel.name);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onPointerUp={(e) => {
                                  if (!channelChildrenEnabled) return;
                                  e.stopPropagation();
                                  void transmitPtt(false, [ch.id], ch.channel.name);
                                }}
                                onPointerCancel={(e) => {
                                  if (!channelChildrenEnabled) return;
                                  e.stopPropagation();
                                  void transmitPtt(false, [ch.id], ch.channel.name);
                                }}
                              >
                                <img width={48} height={48} src={InstantPTT} />
                              </button>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-md text-[#D1D5DB]">{ch.channel.name}</span>
                                <span className="text-xs text-[#9CA3AF]">
                                  Last SRC: {channelLastSrc[ch.id] ?? "None"}
                                </span>
                                <span
                                  className={`text-xs ${tx
                                      ? "text-red-400"
                                      : toneTx
                                        ? "text-orange-300"
                                        : rx
                                          ? "text-emerald-400"
                                          : toneRx
                                            ? "text-yellow-300"
                                            : listening
                                              ? "text-[#3C83F6]"
                                              : "text-[#6B7280]"
                                    }`}
                                >
                                  State:{" "}
                                  {tx
                                    ? "Transmitting"
                                    : toneTx
                                      ? "Transmitting"
                                      : rx
                                        ? "Receiving"
                                        : toneRx
                                          ? "Receiving"
                                          : listening
                                            ? "Listening"
                                            : "Not Active"}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-row gap-2">
                              <div
                                data-interactive="true"
                                className={`w-62.5 h-13 rounded-lg flex items-center px-3 ${channelChildrenEnabled ? "bg-[#9CA3AF]" : "bg-[#6B7280]/70"
                                  }`}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  data-interactive="true"
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={volume}
                                  disabled={!channelChildrenEnabled}
                                  onChange={(e) =>
                                    setVolumes((prev) => ({ ...prev, [ch.id]: Number(e.target.value) }))
                                  }
                                  className="w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-[#2A3145] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:bg-[#1F2434] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#2A3145] [&::-webkit-slider-thumb]:-mt-2"
                                />
                              </div>

                              <button
                                data-interactive="true"
                                className={`flex p-2 h-13 min-w-13 rounded-lg justify-center ${!channelChildrenEnabled
                                    ? "bg-[#4B5563] opacity-60 cursor-not-allowed"
                                    : pageState
                                      ? "bg-amber-500/70"
                                      : "bg-[#9CA3AF]"
                                  }`}
                                disabled={!channelChildrenEnabled}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  if (!channelChildrenEnabled) return;
                                  e.stopPropagation();
                                  setChannelPageState((prev) => ({ ...prev, [ch.id]: !prev[ch.id] }));
                                }}
                              >
                                <img width={45} height={45} src={PageSelect} className="mt-1.25" />
                              </button>

                              <button
                                data-interactive="true"
                                className={`flex p-2 h-13 min-w-13 rounded-lg justify-center ${!channelChildrenEnabled
                                    ? "bg-[#4B5563] opacity-60 cursor-not-allowed"
                                    : listening
                                      ? "bg-[#3C83F61A] border border-[#3C83F61A]"
                                      : "bg-[#9CA3AF]"
                                  }`}
                                disabled={!channelChildrenEnabled}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  if (!channelChildrenEnabled) return;
                                  e.stopPropagation();
                                  toggleListening(ch.id);
                                }}
                              >
                                <img width={45} height={45} src={ChannelMarker} />
                              </button>
                            </div>
                          </DragCard>
                        </DraggableItem>
                      );
                    })}

                    {zone.toneSets?.map((t) => {
                      const pos = positions[t.id] || { x: 50, y: 50 };
                      const queued = toneQueue.includes(t.id);

                      return (
                        <DraggableItem key={t.id} id={t.id} pos={pos} drag={editMode}>
                          <DragCard
                            className={`w-87.5 h-37.5 bg-linear-to-b from-[#1F2434] to-[#151A26] border ${queued
                                ? "border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.4)]"
                                : "border-[#2A3145]"
                              }`}
                          >
                            <h1>{t.toneSet.name}</h1>
                            <small className="text-[#9CA3AF]">
                              A: {t.toneSet.toneAFrequencyHz} HZ | B: {t.toneSet.toneBFrequencyHz} HZ
                            </small>
                            <div className="flex flex-row gap-3 py-2 justify-end">
                              <button
                                id="toneplay"
                                disabled={tonePlaybackBusy}
                                className={`p-2 h-12.5 w-12.5 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C83F6] ${tonePlaybackBusy
                                    ? "bg-[#4B5563] opacity-60 cursor-not-allowed"
                                    : "bg-[#2A3145] active:bg-[#3C83F6]/40"
                                  }`}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={async (e) => {
                                  if (tonePlaybackBusy) return;
                                  e.stopPropagation();
                                  const source =
                                    toneQueue.length > 0
                                      ? zone.toneSets?.filter((entry) => toneQueue.includes(entry.id)) ?? []
                                      : [t];
                                  const packets: TonePacket[] = source.map((entry) => ({
                                    id: entry.id,
                                    name: entry.toneSet.name,
                                    toneAHz: Number(entry.toneSet.toneAFrequencyHz),
                                    toneBHz: Number(entry.toneSet.toneBFrequencyHz),
                                    durationA: (entry.toneSet.toneADurationMs ?? 1000) / 1000,
                                    durationB: (entry.toneSet.toneBDurationMs ?? 3000) / 1000,
                                  }));
                                  await transmitTonePackets(packets);
                                }}
                              >
                                <img width={36} height={36} src="/assets/imgs/pager.png" />
                              </button>
                              <button
                                id="toneselect"
                                className={`p-2 h-12.5 w-12.5 rounded-lg transition ${queued
                                    ? "bg-amber-500/70 ring-2 ring-amber-300"
                                    : "bg-[#2A3145] hover:bg-[#38425c]"
                                  }`}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setToneQueue((prev) => (prev.includes(t.id) ? prev : [...prev, t.id]));
                                }}
                              >
                                <img width={36} height={36} src="/assets/imgs/dualpage.png" />
                              </button>
                            </div>
                          </DragCard>
                        </DraggableItem>
                      );
                    })}
                  </DndContext>
                </div>
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

      <CommunityConsoleSettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        value={consoleSettings}
        pttBindings={communityPttBindings}
        txAudio={settings?.txAudio!}
        channelOptions={
          sortedZones.flatMap((zone) =>
            zone.channels.map((ch) => ({
              id: ch.id,
              label: `${zone.name} - ${ch.channel?.name ?? ch.channelId ?? ch.id}`,
            })),
          )
        }
        onTxStartAudioChange={(v) => setSettings((prev) => ({ ...prev!, txAudio: { playStart: v!, playEnd: prev?.txAudio?.playEnd! } }))}
        onTxEndAudioChange={(v) => setSettings((prev) => ({ ...prev!, txAudio: { playStart: prev?.txAudio?.playStart!, playEnd: v! } }))}
        editMode={editMode}
        onEditModeChange={setEditMode}
        onSave={updateConsoleSettings}
      />
      <audio ref={rxMonitorAudioRef} className="hidden" autoPlay />
    </>
  );
}
