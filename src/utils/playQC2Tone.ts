export default async function playQuickCall2(
  toneA: number,
  toneB: number | null,
  durationA = 1,
  durationB = 3,
  onEnded: () => void,
  volumeDb = -6,
  outputDeviceId?: string,
) {
  const AudioCtx =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    onEnded();
    return { cancel: () => {} };
  }

  const ctx: AudioContext = new AudioCtx();
  const destination = ctx.createMediaStreamDestination();
  const master = ctx.createGain();
  master.gain.value = Math.pow(10, volumeDb / 20);
  master.connect(destination);

  const output = new Audio();
  output.autoplay = true;
  output.muted = false;
  output.volume = 1;
  output.srcObject = destination.stream;

  if (outputDeviceId && typeof (output as any).setSinkId === "function") {
    try {
      await (output as any).setSinkId(outputDeviceId);
    } catch {
      // fallback to default output device
    }
  }

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // continue; playback may still work after user gesture
    }
  }
  void output.play().catch(() => {});

  const now = ctx.currentTime;
  const oscA = ctx.createOscillator();
  oscA.type = "sine";
  oscA.frequency.setValueAtTime(toneA, now);
  oscA.connect(master);
  oscA.start(now);
  oscA.stop(now + durationA);

  const oscB = ctx.createOscillator();
  oscB.type = "sine";
  oscB.frequency.setValueAtTime(toneB ?? toneA, now + durationA);
  oscB.connect(master);
  oscB.start(now + durationA);
  oscB.stop(now + durationA + durationB);

  let finished = false;
  const cleanup = () => {
    try {
      oscA.disconnect();
    } catch {}
    try {
      oscB.disconnect();
    } catch {}
    try {
      master.disconnect();
    } catch {}
    try {
      output.pause();
    } catch {}
    try {
      output.srcObject = null;
    } catch {}
    try {
      void ctx.close();
    } catch {}
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    onEnded();
  };

  const timer = window.setTimeout(
    finish,
    Math.max(0, (durationA + durationB) * 1000 + 40),
  );

  return {
    cancel: () => {
      if (finished) return;
      window.clearTimeout(timer);
      try {
        oscA.stop();
      } catch {}
      try {
        oscB.stop();
      } catch {}
      finish();
    },
  };
}
