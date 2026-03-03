import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AudioPlayerProps = {
  src: string;
};

const BAR_COUNT = 28;

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const useAnalyserRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [levels, setLevels] = useState<number[]>(
    Array.from({ length: BAR_COUNT }, () => 0.08),
  );

  const frequencyDataRef = useRef<Uint8Array | null>(null);

  const canPlay = useMemo(() => src.trim().length > 0, [src]);
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const progressPct = safeDuration > 0 ? Math.min(100, (currentTime / safeDuration) * 100) : 0;

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const animateFallback = () => {
    const t = performance.now() / 300;
    const nextLevels = Array.from({ length: BAR_COUNT }, (_, i) => {
      const wave = Math.abs(Math.sin(t + i * 0.35));
      return Math.max(0.08, Math.min(1, wave * 0.55 + 0.18));
    });
    setLevels(nextLevels);
    rafRef.current = requestAnimationFrame(animateFallback);
  };

  const animate = () => {
    const analyser = analyserRef.current;
    const frequencyData = frequencyDataRef.current;
    if (!analyser || !frequencyData) return;

    analyser.getByteFrequencyData(frequencyData);
    const bucketSize = Math.max(1, Math.floor(frequencyData.length / BAR_COUNT));
    const nextLevels: number[] = [];

    for (let i = 0; i < BAR_COUNT; i += 1) {
      const start = i * bucketSize;
      const end = Math.min(frequencyData.length, start + bucketSize);
      let sum = 0;
      for (let idx = start; idx < end; idx += 1) {
        sum += frequencyData[idx];
      }
      const avg = end > start ? sum / (end - start) : 0;
      const normalized = Math.max(0.08, Math.min(1, avg / 160));
      nextLevels.push(normalized);
    }

    setLevels(nextLevels);
    rafRef.current = requestAnimationFrame(animate);
  };

  const ensureAudioGraph = async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    const AudioCtx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return false;

    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx();
    }

    if (!analyserRef.current) {
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.82;
      frequencyDataRef.current = new Uint8Array(
        analyserRef.current.frequencyBinCount,
      );
    }

    if (!sourceRef.current) {
      try {
        sourceRef.current = ctxRef.current.createMediaElementSource(audio);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctxRef.current.destination);
      } catch {
        return false;
      }
    }

    if (ctxRef.current.state === "suspended") {
      await ctxRef.current.resume();
    }
    return true;
  };

  const onTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    if (audio.paused) {
      let analyserEnabled = false;
      try {
        analyserEnabled = await ensureAudioGraph();
      } catch {
        analyserEnabled = false;
      }
      try {
        await audio.play();
      } catch {
        return;
      }
      useAnalyserRef.current = analyserEnabled;
      setIsPlaying(true);
      stopAnimation();
      rafRef.current = requestAnimationFrame(
        useAnalyserRef.current ? animate : animateFallback,
      );
      return;
    }

    audio.pause();
    setIsPlaying(false);
    stopAnimation();
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      const next = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(Math.max(0, next));
    };
    const onLoadedMetadata = () => syncDuration();
    const onDurationChange = () => syncDuration();
    const onCanPlay = () => syncDuration();
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      stopAnimation();
      setLevels(Array.from({ length: BAR_COUNT }, () => 0.08));
    };
    const onPause = () => {
      setIsPlaying(false);
      stopAnimation();
    };
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    stopAnimation();
    useAnalyserRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLevels(Array.from({ length: BAR_COUNT }, () => 0.08));
    audio.pause();
    audio.currentTime = 0;
    audio.load();
  }, [src]);

  useEffect(() => {
    return () => {
      stopAnimation();
      try {
        sourceRef.current?.disconnect();
      } catch {}
      try {
        analyserRef.current?.disconnect();
      } catch {}
      if (ctxRef.current) {
        void ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-[#0F172A] p-2">
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#3C83F61A] bg-[#1F2434] text-[#BFD8FF] hover:bg-[#253047] disabled:opacity-60"
          onClick={() => void onTogglePlay()}
          disabled={!canPlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="flex h-9 flex-1 items-end gap-[2px] rounded-md bg-[#0B1220] px-2 py-1">
          {levels.map((level, index) => (
            <div
              key={index}
              className="w-[3px] rounded-sm bg-gradient-to-t from-[#3C83F6] to-[#3cf664] transition-[height] duration-75"
              style={{ height: `${Math.max(8, level * 30)}px` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="w-10 text-[10px] text-gray-400">
          {formatTime(currentTime)}
        </span>
        <div className="relative h-5 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#1E293B]" />
          <div
            className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#3C83F6] to-[#3cf664]"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-[#93C5FD] bg-[#E0F2FE] shadow-[0_0_6px_rgba(59,130,246,0.55)]"
            style={{ left: `calc(${progressPct}% - 6px)` }}
          />
          <input
            type="range"
            min={0}
            max={safeDuration > 0 ? safeDuration : 1}
            step={0.01}
            value={Math.min(currentTime, safeDuration > 0 ? safeDuration : 1)}
            onInput={(event) => {
              const audio = audioRef.current;
              if (!audio) return;
              const nextTime = Number((event.target as HTMLInputElement).value);
              audio.currentTime = Number.isFinite(nextTime) ? nextTime : 0;
              setCurrentTime(audio.currentTime || 0);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={safeDuration <= 0}
          />
        </div>
        <span className="w-10 text-right text-[10px] text-gray-400">
          {formatTime(safeDuration)}
        </span>
      </div>
    </div>
  );
}
