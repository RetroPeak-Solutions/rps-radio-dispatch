import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import link, { AuthUser } from "@utils/link";
import { useSocket } from "@context/SocketProvider";
import AuthPageWrapper from "@src/Wrappers/Page/AuthPageWrapper";

export type DispatchBanState = {
  code: string;
  message: string;
  reason?: string | null;
  expiresAt?: string | null;
  communityName?: string | null;
};

type BanStateContextValue = {
  globalBan: DispatchBanState | null;
  communityBans: Record<string, DispatchBanState>;
  applyBanPayload: (payload: any) => void;
  applyRealtimeBanEvent: (event: any) => void;
  setCommunityBan: (communityId: string, ban: DispatchBanState | null) => void;
  clearCommunityBan: (communityId: string) => void;
  clearGlobalBan: () => void;
};

export const BanStateContext = createContext<BanStateContextValue>({
  globalBan: null,
  communityBans: {},
  applyBanPayload: () => { },
  applyRealtimeBanEvent: () => { },
  setCommunityBan: () => { },
  clearCommunityBan: () => { },
  clearGlobalBan: () => { },
});

export function useBanState() {
  return useContext(BanStateContext);
}

function BanGate({ children }: { children: ReactNode }) {
  const { globalBan } = useBanState();
  if (!globalBan) return <>{children}</>;

  return (
    <AuthPageWrapper>
      <div className="min-h-screen bg-[#0B1220] text-white font-mono flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-[#1A0F14] p-6 space-y-4">
          <h1 className="text-2xl uppercase tracking-wide text-red-300/80">
            Access Restricted
          </h1>
          <h2 className="text-xl font-bold text-red-200">
            {globalBan.code === "EMAIL_UNVERIFIED"
              ? "Email Verification Required"
              : globalBan.communityName
                ? `${globalBan.communityName} Access Banned`
                : globalBan.code === "SYSTEM_BANNED"
                  ? "System Account Banned"
                  : globalBan.code === "DEVICE_BANNED"
                    ? "Dispatch Device Banned"
                    : "Access Banned"}
          </h2>
          <p className="text-sm text-red-100/90">{globalBan.message}</p>
          {globalBan.code === "EMAIL_UNVERIFIED" ? (
            <p className="text-sm text-red-100/90">
              Verify your email from the verification link, then re-open the app.
            </p>
          ) : null}
          {globalBan.code !== "EMAIL_UNVERIFIED" ? (
            <>
              {globalBan.reason ? (
                <p className="text-sm text-red-100/90">
                  <span className="text-red-300">Reason:</span> {globalBan.reason}
                </p>
              ) : null}
              {globalBan.expiresAt ? (
                <p className="text-sm text-red-100/90">
                  <span className="text-red-300">Expires:</span>{" "}
                  {new Date(globalBan.expiresAt).toLocaleString()}
                </p>
              ) : (
                <p className="text-sm text-red-100/90">
                  <span className="text-red-300">Duration:</span> Permanent
                </p>
              )}
            </>
          ) : null}
          {globalBan.communityName ? (
            <button className="p-2 rounded bg-[#8080801A] border border-[#8080801A] text-[#BFBFBF]">
              Return To Dashboard
            </button>
          ) : null}
        </div>
      </div>
    </AuthPageWrapper>
  );
}

export function BanStateProvider({
  children,
  deviceId,
}: {
  children: ReactNode;
  deviceId?: string;
}) {
  const { socket } = useSocket();
  const [globalBan, setGlobalBan] = useState<DispatchBanState | null>(null);
  const [communityBans, setCommunityBans] = useState<Record<string, DispatchBanState>>({});

  const clearGlobalBan = useCallback(() => {
    setGlobalBan(null);
  }, []);

  const setCommunityBan = useCallback((communityId: string, ban: DispatchBanState | null) => {
    if (!communityId) return;
    setCommunityBans((prev) => {
      const next = { ...prev };
      if (!ban) {
        delete next[communityId];
      } else {
        next[communityId] = ban;
      }
      return next;
    });
  }, []);

  const clearCommunityBan = useCallback((communityId: string) => {
    if (!communityId) return;
    setCommunityBans((prev) => {
      if (!prev[communityId]) return prev;
      const next = { ...prev };
      delete next[communityId];
      return next;
    });
  }, []);

  const applyBanPayload = useCallback((payload: any) => {
    const code = String(payload?.code ?? "");
    if (!code) return;
    if (!code.includes("BANNED") && code !== "EMAIL_UNVERIFIED") return;
    const ban = payload?.ban ?? {};
    const parsed: DispatchBanState = {
      code,
      message: String(
        payload.message ??
        (code === "EMAIL_UNVERIFIED"
          ? "Please verify your email before using dispatch features."
          : "Access to this app is restricted."),
      ),
      reason: ban?.reason ?? null,
      expiresAt: ban?.expiresAt ?? null,
      communityName: payload?.community?.name ?? null,
    };
    if (code === "COMMUNITY_BANNED") {
      const communityId = String(payload?.community?.id ?? payload?.communityId ?? "");
      if (communityId) {
        setCommunityBan(communityId, parsed);
      }
      return;
    }
    setGlobalBan(parsed);
  }, [setCommunityBan]);

  const applyRealtimeBanEvent = useCallback((event: any) => {
    const code = String(event?.code ?? "");
    if (!code || !code.includes("BANNED")) return;
    const communityId = String(event?.communityId ?? "");
    const isUnban = event?.action === "unbanned";
    if (isUnban) {
      if (code === "COMMUNITY_BANNED" && communityId) {
        clearCommunityBan(communityId);
      } else {
        clearGlobalBan();
      }
      return;
    }
    const parsed: DispatchBanState = {
      code,
      message:
        code === "SYSTEM_BANNED"
          ? "This account is banned from the system."
          : code === "DEVICE_BANNED"
            ? "This dispatch device is banned."
            : "Access to this app is restricted.",
      reason: event?.reason ?? null,
      expiresAt: event?.expiresAt ?? null,
      communityName: null,
    };
    if (code === "COMMUNITY_BANNED" && communityId) {
      setCommunityBan(communityId, parsed);
      return;
    }
    setGlobalBan(parsed);
  }, [clearCommunityBan, clearGlobalBan, setCommunityBan]);

  const refreshBanState = useCallback(async () => {
    try {
      await axios.get(AuthUser(), { withCredentials: true });
      clearGlobalBan();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        applyBanPayload(err?.response?.data);
      } else if (err?.response?.status === 401) {
        clearGlobalBan();
      }
    }
  }, [applyBanPayload, clearGlobalBan]);

  const refreshCommunityBanState = useCallback(async () => {
    try {
      const authRes = await axios.get(AuthUser(), { withCredentials: true });
      if (!authRes?.data?.user?.id) {
        return;
      }
      const res = await axios.get(`${link("prod")}/api/auth/communities`, {
        withCredentials: true,
      });
      const bansByCommunityId =
        res?.data && typeof res.data.bansByCommunityId === "object"
          ? res.data.bansByCommunityId
          : {};
      const next: Record<string, DispatchBanState> = {};
      Object.entries(bansByCommunityId as Record<string, any>).forEach(
        ([communityId, ban]) => {
          if (!communityId || !ban) return;
          next[communityId] = {
            code: "COMMUNITY_BANNED",
            message: "You are banned from this community console.",
            reason: ban?.reason ?? null,
            expiresAt: ban?.expiresAt ?? null,
          };
        },
      );
      setCommunityBans(next);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return;
      }
      // leave previous snapshot intact on transient failures
    }
  }, []);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 403) {
          applyBanPayload(error?.response?.data);
        }
        return Promise.reject(error);
      },
    );
    void refreshBanState();
    void refreshCommunityBanState();
    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [applyBanPayload, refreshBanState, refreshCommunityBanState]);

  useEffect(() => {
    if (!socket) return;

    const register = () => {
      socket.emit("console:register", { deviceId: deviceId || null });
    };

    const onBanState = (event: {
      action?: "banned" | "unbanned";
      code?: string;
      communityId?: string | null;
      reason?: string | null;
      expiresAt?: string | null;
    }) => {
      if (!event?.code) return;
      applyRealtimeBanEvent({
        ...event,
        action: event.action ?? "banned",
      });
      void refreshBanState();
      void refreshCommunityBanState();
    };

    const onDispatchBan = (event: {
      code?: string;
      communityId?: string | null;
      ban?: { reason?: string | null; expiresAt?: string | null };
    }) => {
      if (!event?.code) return;
      applyRealtimeBanEvent({
        action: "banned",
        code: event.code,
        communityId: event.communityId ?? null,
        reason: event.ban?.reason ?? null,
        expiresAt: event.ban?.expiresAt ?? null,
      });
      void refreshBanState();
      void refreshCommunityBanState();
    };

    const onDispatchBanCleared = (event: {
      code?: string;
      communityId?: string | null;
    }) => {
      const code = String(event?.code ?? "COMMUNITY_BANNED");
      applyRealtimeBanEvent({
        action: "unbanned",
        code,
        communityId: event?.communityId ?? null,
      });
      void refreshBanState();
      void refreshCommunityBanState();
    };

    socket.on("console:ban-state", onBanState);
    socket.on("dispatch:ban-state", onBanState);
    socket.on("dispatch:ban", onDispatchBan);
    socket.on("dispatch:ban-cleared", onDispatchBanCleared);
    socket.on("connect", register);
    register();
    void refreshBanState();
    void refreshCommunityBanState();
    return () => {
      socket.off("console:ban-state", onBanState);
      socket.off("dispatch:ban-state", onBanState);
      socket.off("dispatch:ban", onDispatchBan);
      socket.off("dispatch:ban-cleared", onDispatchBanCleared);
      socket.off("connect", register);
    };
  }, [socket, applyRealtimeBanEvent, refreshBanState, refreshCommunityBanState, deviceId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshBanState();
      void refreshCommunityBanState();
    }, 3000);
    return () => {
      window.clearInterval(timer);
    };
  }, [refreshBanState, refreshCommunityBanState]);

  const value = useMemo(
    () => ({
      globalBan,
      communityBans,
      applyBanPayload,
      applyRealtimeBanEvent,
      setCommunityBan,
      clearCommunityBan,
      clearGlobalBan,
    }),
    [
      globalBan,
      communityBans,
      applyBanPayload,
      applyRealtimeBanEvent,
      setCommunityBan,
      clearCommunityBan,
      clearGlobalBan,
    ],
  );

  return (
    <BanStateContext.Provider value={value}>
      <BanGate>{children}</BanGate>
    </BanStateContext.Provider>
  );
}
