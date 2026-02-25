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

    const socketClient = io(url, {
      path: "/socket.io", // default Socket.IO path
      // Do NOT force websocket unless you control the server fully
      // host: url,
      autoConnect: true,
      transports: ["polling"], // allow fallback to polling
    });

    // setSocket(socketClient);

    const onConnect = () => {
      setConnected(true);
      setSocket(socketClient);
      // socketClient?.
      console.log('[SocketProvider] Connected Url:', url);
      console.log("[SocketProvider] Connected:", socketClient.id);
    };
    const onDisconnect = () => {
      setConnected(false);
      console.log("[SocketProvider] Disconnected");
    };

    socketClient.on("connect", onConnect);
    socketClient.on("disconnect", onDisconnect);

    // Debug: log all events
    socketClient.onAny((event, ...args) => {
      console.log(`[Socket Event] ${event}`, args);
    });

    return () => {
      socketClient.off("connect", onConnect);
      socketClient.off("disconnect", onDisconnect);
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
