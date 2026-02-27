import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { ERROR_CODES } from "@wrappers/Error/errCodes";
import "@wrappers/Error/scrollbar.css"

interface ErrorFallbackProps {
  error: unknown;
}

export default function ErrorFallback({ error }: ErrorFallbackProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (!error) return null;

  const err = error as Error & { code?: string };
  const errorMessage = err instanceof Error ? err.message : String(error);
  const codeFromError = err.code;

  const isAppError =
    (typeof codeFromError === "string" &&
      ERROR_CODES[codeFromError] !== undefined) ||
    Object.values(ERROR_CODES).some((ec) => ec.description === errorMessage);

  const title = isAppError
    ? (codeFromError && ERROR_CODES[codeFromError]?.title) || "App Error"
    : "Something went wrong";

  const description = isAppError
    ? (codeFromError && ERROR_CODES[codeFromError]?.description) || errorMessage
    : errorMessage;

  const stack =
    err instanceof Error
      ? err.stack
      : typeof error === "object"
        ? JSON.stringify(error, null, 2)
        : "";

  const copyStackToClipboard = async () => {
    if (!stack) return;
    try {
      // First, try the toast notification
      await navigator.clipboard.writeText(stack);
      setToast("Copied to clipboard!");
      setTimeout(() => setToast(null), 2000);
    } catch {
      // If toast/copy fails, fallback to desktop notification
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Error stack copied!", {
            body: "The error stack has been copied to your clipboard.",
          });
        } else if ("Notification" in window) {
          Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
              new Notification("Error stack copied!", {
                body: "The error stack has been copied to your clipboard.",
              });
            }
          });
        }
      } catch (e) {
        console.error("Failed to show desktop notification:", e);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-transparent p-6 select-none">
      <div
        className={`w-full max-w-xl bg-gray-800 rounded-2xl shadow-lg transform transition-all duration-500
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-12"}`}
      >
        <div className="p-6 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-red-500">{title}</h1>
          <p className="text-gray-300">{description}</p>

          {/* Modern Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2 rounded-lg border border-blue-500 text-blue-500 font-semibold bg-blue-500/10 hover:bg-blue-500/20 transition-all shadow-sm hover:shadow-md"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-500 text-gray-200 font-semibold bg-gray-500/10 hover:bg-gray-500/20 transition-all shadow-sm hover:shadow-md"
            >
              Refresh
            </button>
          </div>

          <button
            onClick={() => {
              navigate("/");
              window.location.reload();
            }}
            className="flex-1 px-4 py-2 rounded-lg border border-emerald-500 text-emerald-500 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 transition-all shadow-sm hover:shadow-md mt-2 sm:mt-0"
          >
            Go Home
          </button>

          {!isAppError && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 px-4 py-2 rounded-lg border border-red-500 text-red-500 font-semibold bg-red-500/10 hover:bg-red-500/20 transition-all shadow-sm hover:shadow-md mt-2 sm:mt-0"
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
          )}
        </div>

        {/* Animated stack container */}
        {!isAppError && (
          <div
            className={`relative overflow-hidden transition-[max-height,opacity,margin] duration-500 ease-in-out
            ${showDetails ? "ml-4 mr-4 mb-4 max-h-64 opacity-100" : "ml-0 mr-0 mb-0 max-h-0 opacity-0"}`}
          >
            {/* Copy Stack Button */}
            {stack && showDetails && (
              <button
                onClick={copyStackToClipboard}
                className="absolute top-2 right-2 p-1 rounded hover:bg-gray-700 transition"
                title="Copy Stack"
              >
                <Copy className="w-4 h-4 text-gray-200" />
              </button>
            )}

            <pre
              className="
                error-stack
              "
            >
              {stack}
            </pre>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
