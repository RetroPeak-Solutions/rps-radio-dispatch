import { useRouteError, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ERROR_CODES } from "./errCodes";
import { AppError } from "./AppError";

export default function ErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const codeFromError = (error as any)?.code;

  const isAppError =
    (typeof codeFromError === "string" && ERROR_CODES[codeFromError] !== undefined) ||
    Object.values(ERROR_CODES).some((ec) => ec.description === errorMessage);

  const title = isAppError
    ? (codeFromError && ERROR_CODES[codeFromError]?.title) || "App Error"
    : "Something went wrong";

  const description = isAppError
    ? (codeFromError && ERROR_CODES[codeFromError]?.description) || errorMessage
    : errorMessage;

  const stack =
    error instanceof Error ? error.stack : typeof error === "object" ? JSON.stringify(error, null, 2) : "";

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
            onClick={() => navigate("/")}
            className="flex-1 px-4 py-2 rounded-lg border border-emerald-500 text-emerald-500 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 transition-all shadow-sm hover:shadow-md"
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
            className={`overflow-hidden transition-[max-height,opacity,margin] duration-500 ease-in-out
            ${showDetails ? "ml-4 mr-4 mb-4 max-h-64 opacity-100" : "ml-0 mr-0 mb-0 max-h-0 opacity-0"}`}
          >
            <pre className="p-4 m-0 bg-black/40 text-sm text-gray-300 whitespace-pre-wrap break-words max-h-64 overflow-auto">
              {stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}