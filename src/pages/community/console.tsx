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
import type { QuickCall2ToneSet, RadioChannel, RadioZone } from "../../lib/types";
import DragCard from "../../components/UI/DragCard";

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
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                cursor: drag ? isDragging ? "grabbing" : "grab" : "auto",
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

    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
    const [canvasHeight, setCanvasHeight] = useState(MIN_CANVAS_HEIGHT);

    const dragStartPos = useRef<Record<string, { x: number; y: number }>>({});
    const canvasRef = useRef<HTMLDivElement | null>(null);

    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        if (!communityId || community) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${link("dev")}/api/communities/${communityId}`, {
                    withCredentials: true,
                });

                setCommunity(res.data.community);

                const allSettings: CommunitySettings = await window.api.settings.get();
                setSettings(allSettings || { placements: { channels: [], tones: [] } });

                const initialPos: Record<string, { x: number; y: number }> = {};
                (allSettings?.placements.channels || []).forEach((c) => {
                    initialPos[c.id] = parsePosition(c.pos);
                });
                (allSettings?.placements.tones || []).forEach((t) => {
                    initialPos[t.id] = parsePosition(t.pos);
                });

                setPositions(initialPos);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [communityId]);

    const clampToCanvas = (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x, y };

        const rect = canvas.getBoundingClientRect();

        const maxX = rect.width - CARD_WIDTH;
        const maxY = MAX_CANVAS_HEIGHT - CARD_HEIGHT;

        return {
            x: Math.max(0, Math.min(x, maxX)),
            y: Math.max(0, Math.min(y, maxY)),
        };
    };

    const isColliding = (
        id: string,
        x: number,
        y: number,
        all: Record<string, { x: number; y: number }>
    ) => {
        for (const key in all) {
            if (key === id) continue;

            const other = all[key];

            const overlapX =
                x < other.x + CARD_WIDTH &&
                x + CARD_WIDTH > other.x;

            const overlapY =
                y < other.y + CARD_HEIGHT &&
                y + CARD_HEIGHT > other.y;

            if (overlapX && overlapY) return true;
        }
        return false;
    };

    const resolveCollision = (
        id: string,
        x: number,
        y: number,
        all: Record<string, { x: number; y: number }>
    ) => {
        let newY = y;
        while (isColliding(id, x, newY, all)) {
            newY += CARD_HEIGHT + CARD_SPACING;
        }
        return { x, y: newY };
    };

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string;
        dragStartPos.current[id] = positions[id] || { x: 20, y: 20 };
    };

    const handleDragMove = (event: DragMoveEvent) => {
        const id = event.active.id as string;
        const start = dragStartPos.current[id];
        if (!start) return;

        const eventX = event.delta.x;
        const eventY = event.delta.y;

        let newX = start.x + eventX;
        let newY = start.y + eventY;

        const clamped = clampToCanvas(newX, newY);
        const resolved = resolveCollision(id, clamped.x, clamped.y, positions);

        setPositions((prev) => {
            const updated = { ...prev, [id]: resolved };

            const lowestItem = Math.max(
                ...Object.values(updated).map((p) => p.y + CARD_HEIGHT)
            );

            const newHeight = Math.min(
                Math.max(lowestItem + CARD_SPACING, MIN_CANVAS_HEIGHT),
                MAX_CANVAS_HEIGHT
            );

            setCanvasHeight(newHeight);

            return updated;
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const id = event.active.id as string;
        const finalPos = positions[id];
        if (!finalPos || !settings) return;

        const zone = community?.radioZones[activeZoneIndex];
        const isTone = zone?.toneSets.some((t) => t.id === id);

        if (isTone) {
            let tone = settings.placements.tones.find((t) => t.id === id);
            if (!tone) settings.placements.tones.push({ id, pos: serializePosition(finalPos) });
            else tone.pos = serializePosition(finalPos);
        } else {
            let ch = settings.placements.channels.find((c) => c.id === id);
            if (!ch) settings.placements.channels.push({ id, pos: serializePosition(finalPos) });
            else ch.pos = serializePosition(finalPos);
        }

        setSettings({ ...settings });
        await window.api.settings.set(settings as any);

        delete dragStartPos.current[id];
    };

    return (
        <div className="min-h-screen bg-[#0B1220] text-white font-mono flex flex-col">
            <div className="flex justify-between p-2 bg-[#0C1524] border-b border-gray-700 select-none">
                <h1 className="pt-1">{community?.name} | Dispatch Console</h1>
                <div className="flex gap-2">
                    <button
                        className={`px-3 py-1 rounded ${editMode ? "bg-green-600" : "bg-gray-700"}`}
                        onClick={() => setEditMode(!editMode)}
                    >
                        {editMode ? "Editing On" : "Edit Mode"}
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-gray-700"
                        onClick={() => navigate("/")}
                    >
                        Exit Community
                    </button>
                </div>
            </div>

            <Tab.Group selectedIndex={activeZoneIndex} onChange={setActiveZoneIndex}>
                <Tab.List className="flex bg-[#0C1524]  border-b border-gray-700 select-none">
                    {community?.radioZones.map((zone) => (
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
                    {community?.radioZones.map((zone) => (
                        <Tab.Panel key={zone.id} className="h-full overflow-y-auto ">
                            <div
                                ref={canvasRef}
                                className="relative w-full"
                                style={{ height: canvasHeight }}
                            >
                                <DndContext
                                    sensors={sensors}
                                    onDragStart={editMode ? handleDragStart : undefined}
                                    onDragMove={editMode ? handleDragMove : undefined}
                                    onDragEnd={editMode ? handleDragEnd : undefined}
                                >
                                    {zone.channels.map((ch) => {
                                        const pos = positions[ch.id] || { x: 20, y: 20 };
                                        return (
                                            <DraggableItem drag={editMode} key={ch.id} id={ch.id} pos={pos}>
                                                <DragCard className="w-[300px] h-[150px] bg-linear-to-b from-[#1F2434] to-[#151A26] border border-[#2A3145]">
                                                    {ch.channel.name}
                                                </DragCard>
                                            </DraggableItem>
                                        );
                                    })}

                                    {zone.toneSets?.map((t) => {
                                        const pos = positions[t.id] || { x: 50, y: 50 };
                                        return (
                                            <DraggableItem drag={editMode} key={t.id} id={t.id} pos={pos}>
                                                <DragCard className="w-75 h-37.5 bg-linear-to-b from-[#1F2434] to-[#151A26] border border-[#2A3145]">
                                                    <h1>{t.toneSet.name}</h1>
                                                    <small className="text-[#9CA3AF]">A: {t.toneSet.toneAFrequencyHz} HZ | B: {t.toneSet.toneBFrequencyHz} HZ</small>
                                                    <div className="flex flex-row gap-3 py-2 justify-end">
                                                        <button className="p-2 bg-[#2A3145] h-12.5 w-12.5 rounded-lg">
                                                            <img width={36} height={36} src="/assets/imgs/pager.png" />
                                                        </button>
                                                        <button className="p-2 bg-[#2A3145] h-12.5 w-12.5 rounded-lg">
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
    );
}