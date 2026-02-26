import { useDraggable } from "@dnd-kit/core";

export default function DraggableItem({
    id,
    children,
    pos,
    draggable,
}: {
    id: string;
    children: React.ReactNode;
    pos: { x: number; y: number };
    draggable: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform,} = useDraggable({ id });
    const style = {
        position: "absolute" as const,
        left: pos.x,
        top: pos.y,
        transform: transform
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
        cursor: "grab",
    };
    return (
        <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
            {children}
        </div>
    );
}