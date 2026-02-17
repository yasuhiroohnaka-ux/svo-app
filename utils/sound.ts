export function playBuzz() {
    if (typeof window === "undefined") return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime); // Low pitch
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
}

export function playChime() {
    if (typeof window === "undefined") return;

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    // High pitch tone 1
    osc1.frequency.setValueAtTime(880, t); // A5
    osc1.start(t);
    osc1.stop(t + 0.1);

    // High pitch tone 2
    osc2.frequency.setValueAtTime(1760, t + 0.1); // A6
    osc2.start(t + 0.1);
    osc2.stop(t + 0.6);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.00001, t + 0.6);
}
