class VoiceTxProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][]): boolean {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;
    const copy = new Float32Array(input);
    this.port.postMessage({
      samples: copy,
      sampleRate,
    });
    return true;
  }
}

registerProcessor("voice-tx-processor", VoiceTxProcessor);

