import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

interface SocketProviderProps {
  children: ReactNode;
  url?: string; // optional, defaults to localhost
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children, url }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!url) return;

    const normalizedUrl = String(url).trim().replace(/\/+$/, "");

    const socketClient = io(normalizedUrl, {
      path: "/socket.io",
      autoConnect: true,
      withCredentials: true,
      // transports: ["websocket", "polling"],
      transports: ["polling", "websocket"], // try polling first for better compatibility, then upgrade to websocket
    });

    // expose immediately so consumers can bind listeners before first connect/events
    setSocket(socketClient);

    const onConnect = () => {
      setConnected(true);
      console.log('[SocketProvider] Connected Url:', normalizedUrl);
      console.log("[SocketProvider] Connected:", socketClient.id);
    };
    const onDisconnect = () => {
      setConnected(false);
      console.log("[SocketProvider] Disconnected");
    };
    const onConnectError = (error: Error) => {
      console.error("[SocketProvider] Connect error:", error.message, {
        url: normalizedUrl,
        transports: socketClient.io.opts.transports,
      });
    };

    socketClient.on("connect", onConnect);
    socketClient.on("disconnect", onDisconnect);
    socketClient.on("connect_error", onConnectError);

    // Debug: log all events
    socketClient.onAny((event, ...args) => {
      console.log(`[Socket Event] ${event}`, args);
    });

    return () => {
      socketClient.off("connect", onConnect);
      socketClient.off("disconnect", onDisconnect);
      socketClient.off("connect_error", onConnectError);
      socketClient.disconnect();
    };
  }, [url]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook for consuming socket context
export const useSocket = (): SocketContextValue => {
  return useContext(SocketContext);
};
