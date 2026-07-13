let audioCtx: AudioContext | null = null;

function getAudioContext() {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

type ToneOptions = {
    freq: number;
    start: number;
    duration: number;
    peak: number;
    type?: OscillatorType;
    filterFreq?: number;
};

// 1音を「8msで立ち上げ→指数減衰」のエンベロープ付きで鳴らす。
// ゼロ音量から立ち上げ、減衰し切ってから止めることでクリックノイズを防ぐ。
// exponentialRamp は 0 を扱えないため 0.0001 を実質ゼロとして使う。
function playTone(ctx: AudioContext, { freq, start, duration, peak, type = "sine", filterFreq }: ToneOptions) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    if (filterFreq) {
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(filterFreq, start);
        osc.connect(filter);
        filter.connect(gain);
    } else {
        osc.connect(gain);
    }
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.05);
}

// 不正解音。短い「ブッブッ」2連。
// 矩形波をローパスで丸めて、否定は伝わるが威圧感のない音にする。
export function playBuzz() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") ctx.resume().catch(() => { });

    const t = ctx.currentTime;
    for (const start of [t, t + 0.14]) {
        playTone(ctx, { freq: 115, start, duration: 0.1, peak: 0.18, type: "square", filterFreq: 480 });
    }
}

// 正解音。「ピンポン♪」(E6→C6 の下降)。
// 各音は基音+1オクターブ上の弱い倍音の2オシレータで、鐘らしい響きにする。
export function playChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") ctx.resume().catch(() => { });

    const t = ctx.currentTime;
    const notes = [
        { freq: 1318.5, start: t, duration: 0.3 }, // ピン (E6)
        { freq: 1046.5, start: t + 0.15, duration: 0.65 }, // ポーン (C6)
    ];
    for (const note of notes) {
        playTone(ctx, { ...note, peak: 0.14 });
        playTone(ctx, { freq: note.freq * 2, start: note.start, duration: note.duration * 0.6, peak: 0.04 });
    }
}
