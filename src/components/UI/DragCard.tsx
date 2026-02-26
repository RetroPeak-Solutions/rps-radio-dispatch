import type React from "react";

export default function DragCard({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <div className={`flex flex-col gap-2 p-2 pt-3 rounded-md border-2 ${className}`}>
            {children}
        </div>
    )
}