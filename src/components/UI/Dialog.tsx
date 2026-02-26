import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

/* ================== REUSABLE DIALOG COMPONENT ================== */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  showClose = false,
  closeOnEsc = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: any;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
  closeOnEsc?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeOnEsc, onClose]);

  // Prevent background scrolling
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle outside clicks
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onMouseDown={handleOverlayClick} // closes if click outside
        >
          <motion.div
            ref={panelRef}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-[#111827] rounded-2xl min-w-[320px] max-w-full max-h-[94vh] shadow-2xl border border-white/10 flex flex-col"
          >
            {(title || showClose) && (
              <div className="flex justify-between items-center p-6 pb-4 border-b border-white/10 select-none">
                {title && <h2 className="text-xl font-bold">{title}</h2>}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white text-2xl font-bold"
                  >
                    &times;
                  </button>
                )}
              </div>
            )}
            <div className="p-6 pt-4 overflow-y-auto min-w-fit max-w-full w-auto">
              {children}
            </div>
            {footer && <div className="p-4 border-t border-white/10">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}