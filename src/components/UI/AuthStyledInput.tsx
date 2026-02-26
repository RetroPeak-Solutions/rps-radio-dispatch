import { Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type AuthStyledInputProps = {
  id: string;
  label: string;
  value?: string | number;
  onChange?: (value: string) => void;
  icon: LucideIcon;
  type?: "text" | "email" | "password" | "number" | "search" | "date" | "expiry";
  step?: string;
  maskable?: boolean;
  masked?: boolean;
  onToggleMask?: () => void;
  customInput?: ReactNode;
  className?: string;
  htmlFor?: string;
  actionIcon?: any;
};

export default function AuthStyledInput({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  step,
  maskable,
  masked,
  onToggleMask,
  customInput,
  className = "",
  htmlFor = "",
  actionIcon,
}: AuthStyledInputProps) {
  const inputType =
    maskable ? (masked ? "password" : "text") : type === "expiry" ? "text" : type;

  const formatMmYyyy = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6); // MMYYYY
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="relative z-10 bg-[#0C1524]/20 rounded-2xl">
        <div className="left-0.5 rounded-tl-2xl rounded-bl-2xl top-1/2 -translate-y-1/2 bg-[#0C1524] h-11 w-10.5 absolute text-muted-foreground transition group-focus-within:text-[#9CC0FF] ">
          <Icon
            className="left-3.5 top-1/2 -translate-y-1/2 bg-[#0C1524] absolute"
            size={18}
          />
        </div>
        {customInput ? (
          <>
            <div
              id={id}
              className="peer w-full rounded-2xl border border-white/15 bg-black/10 pl-12 pr-10 py-3 text-sm text-foreground outline-none transition focus-within:border-[#7FAEFF99] focus-within:ring-1 focus-within:ring-[#7FAEFF55]"
            >
              {customInput}
            </div>
            <label
              htmlFor={id}
              className="absolute left-12 -top-0.75 bg-transparent px-1 text-xs text-[#9CC0FF]"
            >
              {label}
            </label>
          </>
        ) : (
          <>
            <input
              id={id}
              name={id}
              type={inputType}
              step={step}
              value={String(value ?? "")}
              onChange={(e) =>
                onChange?.(type === "expiry" ? formatMmYyyy(e.target.value) : e.target.value)
              }
              inputMode={type === "expiry" ? "numeric" : undefined}
              pattern={type === "expiry" ? "(0[1-9]|1[0-2])\\/[0-9]{4}" : undefined}
              maxLength={type === "expiry" ? 7 : undefined}
              placeholder=" "
              className="peer w-full rounded-2xl border border-white/15 bg-black/10 pl-12 pr-10 py-3 text-sm text-foreground placeholder-transparent outline-none transition focus:border-[#7FAEFF99] focus:ring-1 focus:ring-[#7FAEFF55]"
            />
            <label
              htmlFor={id}
              className="absolute left-12 top-3 bg-transparent px-1 text-sm text-muted-foreground transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-0.75 peer-focus:text-xs peer-focus:text-[#9CC0FF] peer-[:not(:placeholder-shown)]:-top-0.75 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[#9CC0FF]"
            >
              {label}
            </label>
          </>
        )}
        {maskable && onToggleMask && (
          <button type="button" onClick={onToggleMask} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {masked ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}
        {actionIcon && actionIcon}
      </div>
    </div>
  );
}
