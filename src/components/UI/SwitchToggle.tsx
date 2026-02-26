import React, {
  useState,
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";

type SwitchSize = "sm" | "md" | "lg";

export interface SwitchToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "defaultValue"> {
  value?: boolean;              // Controlled
  defaultValue?: boolean;       // Uncontrolled default
  onChange?: (checked: boolean) => void;
  size?: SwitchSize;
  activeColor?: string;
  inactiveColor?: string;
}

const sizes: Record<
  SwitchSize,
  { track: string; knob: string; translate: string }
> = {
  sm: {
    track: "w-10 h-5",
    knob: "w-4 h-4",
    translate: "translate-x-5",
  },
  md: {
    track: "w-12 h-6",
    knob: "w-5 h-5",
    translate: "translate-x-6",
  },
  lg: {
    track: "w-16 h-8",
    knob: "w-7 h-7",
    translate: "translate-x-8",
  },
};

export const SwitchToggle = forwardRef<
  HTMLButtonElement,
  SwitchToggleProps
>(
  (
    {
      value,
      defaultValue = false,
      onChange,
      size = "md",
      activeColor = "#3C83F6",
      inactiveColor = "#6B7280",
      disabled,
      className = "",
      ...rest
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] =
      useState<boolean>(defaultValue);

    const checked = isControlled ? value : internalValue;

    const toggle = () => {
      if (disabled) return;

      const newValue = !checked;

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);
    };

    const current = sizes[size];

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={toggle}
        className={`
          relative inline-flex items-center
          ${current.track}
          rounded-full
          transition-all duration-300 ease-in-out
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        style={{
          backgroundColor: checked
            ? activeColor
            : inactiveColor,
        }}
        {...rest}
      >
        <span
          className={`
            absolute left-1
            ${current.knob}
            bg-white rounded-full shadow-md
            transform transition-all duration-300 ease-in-out
            ${checked ? current.translate : "translate-x-0"}
          `}
        />
      </button>
    );
  }
);

SwitchToggle.displayName = "SwitchToggle";
