"use client";

import { useEffect, useState, useRef } from "react";
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
import { useLoading } from "../../context/Loading";
import axios from "axios";
import link from "../../utils/link";
import type {
  QuickCall2ToneSet,
  RadioChannel,
  RadioZone,
} from "../../lib/types";
import DragCard from "../../components/UI/DragCard";
import InstantPTT from "../../../public/assets/imgs/instantptt.png";
import PageSelect from "../../../public/assets/imgs/pageselect.png";
import ChannelMarker from "../../../public/assets/imgs/channelmarker.png";

type Position = { x: string; y: string };

type CommunityData = {
  id: string;
  name: string;
  radioZones: RadioZone[];
  radioChannels: RadioChannel[];
  tones: QuickCall2ToneSet[];
};

type CommunitySettings = {
  placements: {
    channels: { id: string; pos: Position }[];
    tones: { id: string; pos: Position }[];
  };
};

const CARD_WIDTH = 300;
const CARD_HEIGHT = 150;
const CARD_SPACING = 16;

const MIN_CANVAS_HEIGHT = 600;
const MAX_CANVAS_HEIGHT = 2000;

function parsePosition(pos: Position) {
  return { x: parseFloat(pos.x) || 0, y: parseFloat(pos.y) || 0 };
}

function serializePosition(pos: { x: number; y: number }): Position {
  return { x: pos.x.toString(), y: pos.y.toString() };
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });

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

  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [settings, setSettings] = useState<CommunitySettings | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeZoneIndex, setActiveZoneIndex] = useState(0);

  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [canvasHeight, setCanvasHeight] = useState(MIN_CANVAS_HEIGHT);

  const dragStartPos = useRef<Record<string, { x: number; y: number }>>({});
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [zuluTime, setZuluTime] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  // ---------------- FETCH ----------------
  useEffect(() => {
    if (!communityId || community) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${link("prod")}/api/communities/${communityId}`,
          { withCredentials: true }
        );

        setCommunity(res.data.community);

        const saved: CommunitySettings =
          (await window.api.settings.get()) || {
            placements: { channels: [], tones: [] },
          };

        setSettings(saved);

        const initial: Record<string, { x: number; y: number }> = {};

        saved.placements.channels.forEach((c) => {
          initial[c.id] = parsePosition(c.pos);
        });

        saved.placements.tones.forEach((t) => {
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
  }, [communityId]);

  // ---------------- AUTO LAYOUT (SAFE) ----------------
  useEffect(() => {
    if (!community || !canvasRef.current) return;

    setPositions((prev) => {
      const updated = { ...prev };
      const used = new Set(Object.keys(updated));

      let x = CARD_SPACING;
      let y = CARD_SPACING;
      const width = canvasRef.current!.offsetWidth;

      const place = (id: string) => {
        if (used.has(id)) return;

        if (x + CARD_WIDTH > width) {
          x = CARD_SPACING;
          y += CARD_HEIGHT + CARD_SPACING;
        }

        updated[id] = { x, y };
        used.add(id);
        x += CARD_WIDTH + CARD_SPACING;
      };

      community.radioZones.forEach((zone) => {
        zone.channels.forEach((c) => place(c.id));
        zone.toneSets?.forEach((t) => place(t.id));
      });

      const lowest =
        Math.max(
          ...Object.values(updated).map((p) => p.y + CARD_HEIGHT)
        ) + CARD_SPACING;

      setCanvasHeight(Math.max(lowest, MIN_CANVAS_HEIGHT));
      return updated;
    });
  }, [community]);

  // ---------------- DRAG LOGIC ----------------
  const clampToCanvas = (x: number, y: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x, y };

    return {
      x: Math.max(0, Math.min(x, rect.width - CARD_WIDTH)),
      y: Math.max(0, Math.min(y, MAX_CANVAS_HEIGHT - CARD_HEIGHT)),
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    dragStartPos.current[id] = positions[id];
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const id = event.active.id as string;
    const start = dragStartPos.current[id];
    if (!start) return;

    const newX = start.x + event.delta.x;
    const newY = start.y + event.delta.y;
    const clamped = clampToCanvas(newX, newY);

    setPositions((prev) => ({
      ...prev,
      [id]: clamped,
    }));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const id = event.active.id as string;
    const finalPos = positions[id];
    if (!finalPos || !settings) return;

    const zone = community?.radioZones[activeZoneIndex];
    const isTone = zone?.toneSets?.some((t) => t.id === id);

    if (isTone) {
      let tone = settings.placements.tones.find((t) => t.id === id);
      if (!tone)
        settings.placements.tones.push({
          id,
          pos: serializePosition(finalPos),
        });
      else tone.pos = serializePosition(finalPos);
    } else {
      let ch = settings.placements.channels.find((c) => c.id === id);
      if (!ch)
        settings.placements.channels.push({
          id,
          pos: serializePosition(finalPos),
        });
      else ch.pos = serializePosition(finalPos);
    }

    setSettings({ ...settings });
    await window.api.settings.set(settings as any);

    delete dragStartPos.current[id];
  };

  useEffect(() => {
    const updateTime = () => {
        const now = new Date();

        const time = now.toLocaleTimeString("en-US", {
            hour12: false,
            timeZone: "UTC",
        });

        setZuluTime(`${time}`);
    };

    updateTime(); // initial
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
    }, []);

  if (!community) return null;

  return (
    <div className="min-h-screen bg-[#0B1220] text-white font-mono flex flex-col">
      <div className="flex justify-between p-2 bg-[#0C1524] border-b border-gray-700">
        <h1>{community.name} | Dispatch Console</h1>

        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${
              editMode ? "bg-green-600" : "bg-[#8080801A] border border-[#8080801A] text-[#BFBFBF]"
            }`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Editing On" : "Edit Mode"}
          </button>

          <button
            className="px-3 py-1 rounded bg-[#8080801A] border border-[#8080801A] text-[#BFBFBF]"
            onClick={() => navigate("/")}
          >
            Exit Community
          </button>
        </div>
      </div>

      <Tab.Group selectedIndex={activeZoneIndex} onChange={setActiveZoneIndex}>
        <Tab.List className="flex bg-[#0C1524] border-b border-gray-700">
          {community?.radioZones
            ?.sort((a, b) => a.codeplugIndex - b.codeplugIndex)
            .map((zone) => (
              <Tab
                key={zone.id}
                className={({ selected }) =>
                  selected
                    ? "bg-[#3C83F6]/30 px-4 py-2"
                    : "hover:bg-[#3C83F6]/20 px-4 py-2"
                }
              >
                {zone.name}
              </Tab>
            ))}
        </Tab.List>

        <Tab.Panels className="flex-1">
          {community.radioZones.map((zone) => (
            <Tab.Panel key={zone.id}>
              <div
                ref={canvasRef}
                className="relative w-full"
                style={{ height: canvasHeight }}
              >
                <div
                    className="absolute top-1.25 right-6 text-xl font-bold uppercase tracking-widest font-mono select-none text-[#3C83F6] drop-shadow-[0_0_6px_rgba(60,131,246,0.8)] px-2 py-1 rounded-md"
                    style={{ pointerEvents: "none", zIndex: 1000 }}
                >
                    Zulu: {zuluTime}
                </div>
                <DndContext
                  sensors={sensors}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                >
                  {zone.channels.map((ch) => {
                    const pos = positions[ch.id] || { x: 20, y: 20 };
                    const volume = volumes[ch.id] ?? 50;

                    return (
                      <DraggableItem
                        drag={editMode}
                        key={ch.id}
                        id={ch.id}
                        pos={pos}
                      >
                        <DragCard className="w-87.5 h-37.5 bg-linear-to-b from-[#1F2434] to-[#151A26] border border-[#2A3145] flex flex-col">
                          <div className="flex flex-row gap-3">
                            <button className="p-2 bg-[#9CA3AF] rounded-lg">
                              <img
                                width={48}
                                height={48}
                                src={InstantPTT}
                              />
                            </button>

                            <div className="flex flex-col gap-0.5">
                              <span className="text-md text-[#9CA3AF]">
                                {ch.channel.name}
                              </span>
                              <span className="text-xs text-[#9CA3AF]">
                                Last SRC: None
                              </span>
                              {/* <span className="text-xs text-[#9CA3AF]">
                                System: Primary
                              </span> */}
                            </div>
                          </div>

                          <div className="flex flex-row gap-2">
                            <div
                              className="w-62.5 h-13 bg-[#9CA3AF] rounded-lg flex items-center px-3"
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={(e) =>
                                  setVolumes((prev) => ({
                                    ...prev,
                                    [ch.id]: Number(e.target.value),
                                  }))
                                }
                                className="w-full appearance-none bg-transparent cursor-pointer
                                [&::-webkit-slider-runnable-track]:h-2
                                [&::-webkit-slider-runnable-track]:bg-[#2A3145]
                                [&::-webkit-slider-runnable-track]:rounded-full
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:h-6
                                [&::-webkit-slider-thumb]:w-6
                                [&::-webkit-slider-thumb]:rounded-md
                                [&::-webkit-slider-thumb]:bg-[#1F2434]
                                [&::-webkit-slider-thumb]:border
                                [&::-webkit-slider-thumb]:border-[#2A3145]
                                [&::-webkit-slider-thumb]:-mt-2"
                              />
                            </div>

                            <button className="flex p-2 bg-[#9CA3AF] h-13 min-w-13 rounded-lg justify-center">
                              <img
                                width={45}
                                height={45}
                                src={PageSelect}
                                className="mt-1.25"
                              />
                            </button>

                            <button className="flex p-2 bg-[#9CA3AF] h-13 min-w-13 rounded-lg justify-center">
                              <img
                                width={45}
                                height={45}
                                src={ChannelMarker}
                              />
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
  );
}