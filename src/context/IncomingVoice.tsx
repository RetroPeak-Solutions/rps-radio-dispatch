import React, { createContext, useContext, useRef, useEffect } from "react";

// -------------------- TYPES --------------------
type IncomingVoiceContextType = {
  enqueueChunk: (chunkBase64: string, mimeType?: string, channelIds?: string[]) => void;
};

const IncomingVoiceContext = createContext<IncomingVoiceContextType | undefined>(undefined);

// -------------------- PROVIDER --------------------
export const IncomingVoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const pendingChunksRef = useRef<ArrayBuffer[]>([]);

  // -------------------- INIT AUDIO --------------------
  useEffect(() => {
    if (audioElementRef.current) return;

    const audio = new Audio();
    audio.autoplay = true;
    audio.muted = true; // muted until user interaction
    audioElementRef.current = audio;

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    audio.src = URL.createObjectURL(mediaSource);

    const handleSourceOpen = () => {
      if (!mediaSourceRef.current) return;

      const sb = mediaSourceRef.current.addSourceBuffer('audio/webm; codecs="opus"');
      sb.mode = "sequence";
      sourceBufferRef.current = sb;

      // append any queued chunks
      pendingChunksRef.current.forEach((chunk) => sb.appendBuffer(new Uint8Array(chunk)));
      pendingChunksRef.current = [];

      const appendNextChunk = () => {
        if (!sourceBufferRef.current || pendingChunksRef.current.length === 0) return;
        if (!sourceBufferRef.current.updating) {
          const next = pendingChunksRef.current.shift()!;
          sourceBufferRef.current.appendBuffer(new Uint8Array(next));
        }
      };

      sb.addEventListener("updateend", () => {
        appendNextChunk();
        if (pendingChunksRef.current.length > 0) {
          appendNextChunk();
        }
      });
    };

    mediaSource.addEventListener("sourceopen", handleSourceOpen);

    // unmute on user interaction
    const unmute = () => {
      audio.muted = false;
      window.removeEventListener("click", unmute);
    };
    window.addEventListener("click", unmute);

    return () => {
      mediaSource.removeEventListener("sourceopen", handleSourceOpen);
      window.removeEventListener("click", unmute);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // -------------------- ENQUEUE CHUNK --------------------
  const enqueueChunk = (chunkBase64: string, mimeType = "audio/webm; codecs=opus", channelIds: string[] = []) => {
    if (!Array.isArray(channelIds)) return;

    // You could filter by listening channels here
    const listened = channelIds.filter((id) => true); // replace with your filter
    if (listened.length === 0) return;

    const binary = atob(chunkBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const safeBuf = new Uint8Array(new ArrayBuffer(bytes.length));
    safeBuf.set(bytes);

    const sb = sourceBufferRef.current;
    if (!sb || sb.updating) {
      pendingChunksRef.current.push(safeBuf.buffer);
      return;
    }

    const appendNextChunk = () => {
      if (!sourceBufferRef.current || pendingChunksRef.current.length === 0) return;
      if (!sourceBufferRef.current.updating) {
        const next = pendingChunksRef.current.shift()!;
        sourceBufferRef.current.appendBuffer(new Uint8Array(next));
      }
    };

    sb.addEventListener("updateend", () => {
      appendNextChunk();
      if (pendingChunksRef.current.length > 0) {
        appendNextChunk();
      }
    }, { once: true });

    appendNextChunk();
  };

  return (
    <IncomingVoiceContext.Provider value={{ enqueueChunk }}>
      {children}
    </IncomingVoiceContext.Provider>
  );
};

// -------------------- HOOK --------------------
export const useIncomingVoice = () => {
  const context = useContext(IncomingVoiceContext);
  if (!context) {
    throw new Error("useIncomingVoice must be used within an IncomingVoiceProvider");
  }
  return context;
};