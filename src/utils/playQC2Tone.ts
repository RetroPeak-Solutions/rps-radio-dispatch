import * as Tone from "tone";

export default async function playQuickCall2(
  toneA: number,
  toneB: number | null,
  durationA = 1,
  durationB = 3,
  onEnded: () => void,
  volumeDb = -6,
) {
  await Tone.start();

  // Keep track of oscillators
  const oscillators: Tone.Oscillator[] = [];

  // Flag to prevent calling onEnded multiple times
  let ended = false;
  const finish = () => {
    if (!ended) {
      ended = true;
      onEnded();
    }
  };

  const now = Tone.now();

  // ---------- Tone A ----------
  const oscA = new Tone.Oscillator({ type: "sine", volume: volumeDb }).toDestination();
  oscA.frequency.setValueAtTime(toneA, now);
  oscA.start(now);
  oscA.stop(now + durationA);
  oscillators.push(oscA);

  // ---------- Tone B ----------
  const oscB = new Tone.Oscillator({ type: "sine", volume: volumeDb }).toDestination();
  const secondFreq = toneB ?? toneA;
  const startB = now + durationA;
  oscB.frequency.setValueAtTime(secondFreq, startB);
  oscB.start(startB);
  oscB.stop(startB + durationB);
  oscillators.push(oscB);

  // Cleanup when done
  const totalDuration = durationA + durationB;
  const endId = Tone.Transport.scheduleOnce(() => {
    oscillators.forEach(o => o.dispose());
    finish();
  }, `+${totalDuration}`);

  // Start transport if not already started
  if (Tone.getTransport().state !== "started") Tone.getTransport().start();

  // Return a controller for dynamic cancellation
  return {
    cancel: () => {
      // Stop and dispose all oscillators immediately
      oscillators.forEach(o => {
        o.stop();
        o.dispose();
      });

      // Cancel scheduled transport event
      Tone.getTransport().clear(endId);

      finish();
    },
  };
}