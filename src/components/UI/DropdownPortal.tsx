import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function DropdownPortal({
  children,
  containerRef,
  open,
}: {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLElement>;
  open: boolean;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  if (!elRef.current) elRef.current = document.createElement("div");

  useEffect(() => {
    if (!open) return;
    const portalRoot = document.body;
    portalRoot.appendChild(elRef.current!);
    return () => {
      portalRoot.removeChild(elRef.current!);
    };
  }, [open]);

  if (!containerRef.current) return null;

  return createPortal(children, elRef.current!);
}
