import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type JSX,
} from "react";

export type ToastType = "success" | "error" | "info" | "warning"; // added warning

type ToastOptions = {
  autoClose?: boolean;
  autoCloseTime?: number; // in seconds
  closable?: boolean;
  showProgress?: boolean;
  type?: ToastType;
};

type Toast = {
  id: string;
  message: string;
  options: Required<ToastOptions>;
};

type ToastContextType = {
  toast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

const defaultOptions: Required<ToastOptions> = {
  autoClose: true,
  autoCloseTime: 3,
  closable: true,
  showProgress: true,
  type: "info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(message: string, options?: ToastOptions) {
    const id = crypto.randomUUID();
    setToasts((prev) => [
      ...prev,
      { id, message, options: { ...defaultOptions, ...options } },
    ]);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function getToastColor(type: ToastType) {
  switch (type) {
    case "success":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "error":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"; // warning color
    case "info":
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }
}

const toastIcons: Record<ToastType, JSX.Element> = {
  success: (
    <svg
      className="h-5 w-5 text-green-600 dark:text-green-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  error: (
    <svg
      className="h-5 w-5 text-red-600 dark:text-red-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  info: (
    <svg
      className="h-5 w-5 text-slate-700 dark:text-slate-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01"
      />
    </svg>
  ),
  warning: (
    <svg
      className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
      />
    </svg>
  ),
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const { message, options } = toast;
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const intervalRef = useRef<number | null>(null);
  const tickRef = useRef(0);

  const durationMs = options.autoCloseTime * 1000;
  const totalTicks = 100;
  const intervalMs = durationMs / totalTicks;

  useEffect(() => {
    // enter animation
    requestAnimationFrame(() => setVisible(true));

    if (!options.autoClose) return;

    // create interval for this toast only
    intervalRef.current = window.setInterval(() => {
      tickRef.current += 1;
      setProgress(Math.max(100 - (tickRef.current / totalTicks) * 100, 0));

      if (tickRef.current >= totalTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setVisible(false);
        setTimeout(onClose, 200); // remove after exit animation
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // empty dependency array ensures each toast runs independently
  }, []);

  function getProgressGradient(type: ToastType) {
    switch (type) {
      case "success":
        return "linear-gradient(to right, #4ade80, #16a34a)";
      case "error":
        return "linear-gradient(to right, #f87171, #b91c1c)";
      case "warning":
        return "linear-gradient(to right, #facc15, #b45309)"; // yellow gradient
      case "info":
      default:
        return "linear-gradient(to right, #60a5fa, #2563eb)";
    }
  }

  return (
    <div
      className={`
        relative overflow-hidden
        flex items-center gap-2
        px-4 py-2 pr-8
        rounded-lg text-sm font-medium
        shadow-md backdrop-blur
        transition-all duration-200 ease-out
        ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-1 scale-[0.98]"}
        ${getToastColor(options.type)}
      `}
    >
      {toastIcons[options.type]}
      <span>{message}</span>

      {options.closable && (
        <button
          onClick={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setVisible(false);
            setTimeout(onClose, 200);
          }}
          className="absolute top-1.5 right-1 p-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {options.showProgress && options.autoClose && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-black/10 overflow-hidden rounded">
          <div
            className="h-full rounded"
            style={{
              width: `${progress}%`,
              background: getProgressGradient(options.type),
            }}
          />
        </div>
      )}
    </div>
  );
}
