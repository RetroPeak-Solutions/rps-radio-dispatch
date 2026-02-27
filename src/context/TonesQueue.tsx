import React, { createContext, useContext, useState, useRef } from "react";
import playQuickCall2 from "@utils/playQC2Tone";


type ToneQueueItem = {
  id: string;
  toneA: number;
  toneB: number | null;
  durationA?: number;
  durationB?: number;
};

type TonesQueueContextType = {
  queue: ToneQueueItem[];
  isPlaying: boolean;
  addToQueue: (
    id: string,
    toneA: number,
    toneB: number | null,
    durationA?: number,
    durationB?: number
  ) => string;
  removeFromQueueById: (id: string) => void;
  clearQueue: () => void;
  triggerQueue: (onQueueFinished?: () => void) => void;
  isInQueue: (id: string) => boolean; // ✅ check if a tone is in queue
  stopTones: () => void;
};

const TonesQueueContext = createContext<TonesQueueContextType | undefined>(
  undefined
);

export const useTonesQueue = () => {
  const context = useContext(TonesQueueContext);
  if (!context) throw new Error("useTonesQueue must be used within TonesQueueProvider");
  return context;
};

export const TonesQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<ToneQueueItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const queueRef = useRef<ToneQueueItem[]>([]);
  const [toneController, setToneController] = useState<{ cancel: () => void } | null>(null);

  const syncQueueRef = (newQueue: ToneQueueItem[]) => {
    queueRef.current = newQueue;
    setQueue([...newQueue]);
  };

  // ---------- Internal function to play next ----------
  const playNextInQueue = async (
    onQueueFinished?: () => void,
    delayBetweenTones = 750 // delay in ms between each set
  ) => {
    if (queueRef.current.length === 0) {
      setIsPlaying(false);
      onQueueFinished?.();
      return;
    }

    setIsPlaying(true);
    const { toneA, toneB, durationA = 1, durationB = 3 } = queueRef.current.shift()!;
    syncQueueRef(queueRef.current);

    const controller = await playQuickCall2(toneA, toneB, durationA, durationB, () => {
      // Add delay before playing the next set
      setToneController(null);
      setTimeout(() => {
        playNextInQueue(onQueueFinished, delayBetweenTones);
      }, delayBetweenTones);
    });
    setToneController(controller);
  };

  const stopTones = () => {
    clearQueue();
    toneController?.cancel();
  };

  // ---------- Add to queue ----------
  const addToQueue = (
    id: string,
    toneA: number,
    toneB: number | null,
    durationA?: number,
    durationB?: number
  ) => {
    const newItem: ToneQueueItem = { id, toneA, toneB, durationA, durationB };
    const newQueue = [...queueRef.current, newItem];
    syncQueueRef(newQueue);
    return id;
  };

  // ---------- Remove from queue ----------
  const removeFromQueueById = (id: string) => {
    const newQueue = queueRef.current.filter(item => item.id !== id);
    syncQueueRef(newQueue);
  };

  // ---------- Clear queue ----------
  const clearQueue = () => {
    syncQueueRef([]);
  };

  // ---------- Trigger queue ----------
  const triggerQueue = (onQueueFinished?: () => void) => {
    if (!isPlaying && queueRef.current.length > 0) {
      playNextInQueue(onQueueFinished);
    }
  };

  // ---------- Check if a tone ID is in queue ----------
  const isInQueue = (id: string) => {
    return queueRef.current.some(item => item.id === id);
  };

  return (
    <TonesQueueContext.Provider
      value={{
        queue,
        isPlaying,
        addToQueue,
        removeFromQueueById,
        clearQueue,
        triggerQueue,
        isInQueue,
        stopTones,
      }}
    >
      {children}
    </TonesQueueContext.Provider>
  );
};