import { useCallback, useState } from "react";

type InfernoOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
};

const getServerUrl = (host: string, port: string | number) => {
  const isIpAddress =
    /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host === "localhost";

  const protocol = isIpAddress ? "http" : "http";

  return `${protocol}://${host}:${port}`;
};

export const useInfernoApi = (selectedServer: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = useCallback(() => {
    return `${getServerUrl(
      selectedServer?.ip!,
      selectedServer?.port!,
    )}/inferno-station-alert`;
  }, [selectedServer]);

  const request = useCallback(
    async (action: string, options: InfernoOptions = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${baseUrl()}/${action}`, {
          method: options.method || "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              selectedServer?.infernoSecret,
            ...options.headers,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Inferno API request failed");
        }

        return await response.json();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, selectedServer],
  );

  return {
    request,
    loading,
    error,
  };
};
