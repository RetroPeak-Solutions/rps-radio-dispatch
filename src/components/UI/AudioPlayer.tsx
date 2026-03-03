import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AudioPlayerProps = {
  src: string;
};

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const canPlay = useMemo(() => src.trim().length > 0, [src]);
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const progressPct =
    safeDuration > 0 ? Math.min(100, (currentTime / safeDuration) * 100) : 0;

  const onTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !canPlay) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        return;
      }
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
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
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
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
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.pause();
    audio.currentTime = 0;
    audio.load();
  }, [src]);

  return (
    <div className="flex flex-row w-full mt-2 gap-2 rounded-lg border border-white/10 bg-[#0F172A] p-2">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#3C83F61A] bg-[#1F2434] text-[#BFD8FF] hover:bg-[#253047] disabled:opacity-60"
          onClick={() => void onTogglePlay()}
          disabled={!canPlay}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="w-full mt-2 flex items-center gap-2">
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
