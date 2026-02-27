import type React from "react";

export default function DragCard({
    className,
    children,
    ...rest
}: {
    className?: string;
    children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`flex flex-col gap-2 p-2 pt-3 rounded-md border-2 ${className}`} {...rest}>
            {children}
        </div>
    )
}
