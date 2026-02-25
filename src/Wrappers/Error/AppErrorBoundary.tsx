import { type ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouteError, useNavigate } from "react-router";

// -------------------- Toast System --------------------

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export const toastRef: { showToast?: (message: string, type?: ToastType) => void } = {};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  };

  toastRef.showToast = showToast;

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        <AnimatePresence>
          {messages.map(({ id, message, type }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`px-4 py-2 rounded-lg shadow-lg text-white ${
                type === "success"
                  ? "bg-green-500"
                  : type === "error"
                  ? "bg-red-500"
                  : "bg-blue-500"
              }`}
            >
              {message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

// Hook helper
export const useToast = () => {
  if (!toastRef.showToast) throw new Error("useToast must be used within ToastProvider");
  return { showToast: toastRef.showToast };
};

// -------------------- Error Boundary --------------------

interface ErrorFallbackProps {
  children?: ReactNode;
}

export function AppErrorBoundary({ children }: ErrorFallbackProps) {
  return (
    <ToastProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ToastProvider>
  );
}

function ErrorBoundary({ children }: { children?: ReactNode }) {
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : "Unknown error";
      showToast(msg, "error");
    }
  }, [error]);

  if (!error) return <>{children}</>; // no error, render children

  const stack =
    error instanceof Error ? error.stack : typeof error === "object" ? JSON.stringify(error, null, 2) : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
      <div className="w-full max-w-xl bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
        <p className="text-gray-300">{error instanceof Error ? error.message : JSON.stringify(error)}</p>

        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Go Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-700 transition"
          >
            Refresh
          </button>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-700 transition mt-2"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.pre
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-2 p-4 rounded-lg bg-black/40 text-sm text-gray-300 overflow-auto max-h-64"
            >
              {stack}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
