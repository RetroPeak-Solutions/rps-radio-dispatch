import React, { createContext, useContext, useEffect, useRef } from "react";

// -------------------- CONTEXT --------------------
type DispatchAudioContextType = {
  playVoiceChunk: (chunkBase64: string, mimeType?: string) => void;
};

const DispatchAudioContext = createContext<DispatchAudioContextType | null>(null);

export const useDispatchAudio = () => {
  const ctx = useContext(DispatchAudioContext);
  if (!ctx) throw new Error("useDispatchAudio must be used within DispatchAudioProvider");
  return ctx;
};

// -------------------- PROVIDER --------------------
export const DispatchAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Create a dedicated audio element for channel audio on page load
  useEffect(() => {
    if (!audioElementRef.current) {
      const audio = new Audio();
      audio.autoplay = true;
      audio.muted = true; // initially muted for autoplay policy
      audioElementRef.current = audio;

      // Unmute on first user interaction
      const unmute = () => {
        audio.muted = false;
        window.removeEventListener("click", unmute);
        window.removeEventListener("keydown", unmute);
      };
      window.addEventListener("click", unmute);
      window.addEventListener("keydown", unmute);

      // Append to body so it can play; hidden so it doesn’t show UI
      audio.style.display = "none";
      document.body.appendChild(audio);
    }
  }, []);

  // Play incoming voice chunk specifically on this dedicated audio element
  const playVoiceChunk = (chunkBase64: string, mimeType = "audio/webm; codecs=opus") => {
    const audio = audioElementRef.current;
    if (!audio) return;

    // Convert Base64 -> Blob -> ObjectURL
    const binary = atob(chunkBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Play the chunk
    audio.src = url;
    audio.play().catch(() => {});

    // Cleanup after playback
    audio.onended = () => {
      URL.revokeObjectURL(url);
    };
  };

  return (
    <DispatchAudioContext.Provider value={{ playVoiceChunk }}>
      {children}
    </DispatchAudioContext.Provider>
  );
};