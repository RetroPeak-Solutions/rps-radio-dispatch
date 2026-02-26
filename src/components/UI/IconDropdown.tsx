import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export function AnimatedDropdownWithIcon({
  icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
    dropUp: false,
  });

  /* =========================
     Close on outside click
  ========================== */
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedOutsideContainer =
        containerRef.current &&
        !containerRef.current.contains(target);

      const clickedOutsideDropdown =
        dropdownRef.current &&
        !dropdownRef.current.contains(target);

      if (clickedOutsideContainer && clickedOutsideDropdown) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* =========================
     Escape handling
     - Close dropdown first
     - Prevent dialog from closing
  ========================== */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation(); // prevent dialog escape
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  /* =========================
     Position dropdown
  ========================== */
  useEffect(() => {
    if (containerRef.current && open) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropUp = spaceBelow < 200 && spaceAbove > 200;

      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        dropUp,
      });
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full group">
      <div
        className="relative z-10 flex w-full cursor-pointer items-center rounded-2xl border border-white/15 bg-black/10 pl-12 pr-10 py-3 text-sm text-foreground transition hover:border-white/20"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="absolute left-4">{icon}</span>

        <span
          className={`${
            selected ? "text-foreground" : "text-muted-foreground"
          } truncate`}
        >
          {selected?.label || label}
        </span>

        <ChevronDown
          className={`absolute right-3 h-4 w-4 text-muted-foreground transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown list via portal */}
      {open &&
        createPortal(
          <motion.ul
            ref={dropdownRef}
            initial={{ opacity: 0, y: dropdownPos.dropUp ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/15 bg-[#0F172A] shadow-xl"
            style={{
              top: dropdownPos.dropUp ? undefined : dropdownPos.top,
              bottom: dropdownPos.dropUp
                ? window.innerHeight - dropdownPos.top + 40
                : undefined,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
          >
            {options.length > 0 ? (
              options.map((opt) => (
                <li
                  key={opt.value}
                  className={`cursor-pointer px-4 py-2 text-sm hover:bg-white/10 ${
                    value === opt.value
                      ? "bg-white/10 font-semibold text-white"
                      : "text-gray-200"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent focus loss
                    e.stopPropagation(); // extra safety
                    handleSelect(opt.value);
                  }}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-muted-foreground cursor-not-allowed">
                No options
              </li>
            )}
          </motion.ul>,
          document.body
        )}
    </div>
  );
}