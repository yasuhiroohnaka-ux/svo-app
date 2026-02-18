let audioCtx: AudioContext | null = null;

function getAudioContext() {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
            audioCtx = new Ctx();
        }
    }
    return audioCtx;
}

export function unlockAudio() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
        ctx.resume();
    }
}

export function playBuzz() {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume if suspended (attempt)
    if (ctx.state === "suspended") ctx.resume().catch(() => { });

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime); // Low pitch
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
}

export function playChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume if suspended (attempt)
    if (ctx.state === "suspended") ctx.resume().catch(() => { });

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
