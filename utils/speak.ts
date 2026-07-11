const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
let currentUtterance: SpeechSynthesisUtterance | null = null; // Prevent GC
let currentTimeout: NodeJS.Timeout | null = null; // Prevent race conditions
let activeQueueId = 0; // Track active queue generation

/**
 * 読み上げ速度(全アプリ共通・localStorage 永続化)。
 * 倍率方式: 各読み上げ箇所が持つ調整済みレートに factor を掛ける。
 * 「はやい」= 1.0 が従来の速さで、既定値。
 */
export const SPEECH_SPEED_LEVELS = [
  { id: "super", label: "すごくはやい", factor: 1.25 },
  { id: "fast", label: "はやい", factor: 1.0 },
  { id: "normal", label: "ふつう", factor: 0.8 },
  { id: "slow", label: "おそい", factor: 0.65 },
] as const;

export type SpeechSpeedId = (typeof SPEECH_SPEED_LEVELS)[number]["id"];

const SPEECH_SPEED_STORAGE_KEY = "speech.speedLevel";
const DEFAULT_SPEECH_SPEED: SpeechSpeedId = "fast";

function isSpeechSpeedId(value: unknown): value is SpeechSpeedId {
  return SPEECH_SPEED_LEVELS.some((level) => level.id === value);
}

let speechSpeedId: SpeechSpeedId | null = null;
const speechSpeedListeners = new Set<() => void>();

/** 速度変更の購読(useSyncExternalStore 用)。戻り値は解除関数 */
export function subscribeSpeechSpeed(listener: () => void): () => void {
  speechSpeedListeners.add(listener);
  return () => {
    speechSpeedListeners.delete(listener);
  };
}

export function getSpeechSpeed(): SpeechSpeedId {
  if (speechSpeedId) return speechSpeedId;
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(SPEECH_SPEED_STORAGE_KEY);
      if (isSpeechSpeedId(stored)) {
        speechSpeedId = stored;
        return stored;
      }
    } catch {
      // localStorage が使えない環境では既定値のまま
    }
  }
  speechSpeedId = DEFAULT_SPEECH_SPEED;
  return speechSpeedId;
}

export function setSpeechSpeed(id: SpeechSpeedId) {
  speechSpeedId = id;
  try {
    window.localStorage.setItem(SPEECH_SPEED_STORAGE_KEY, id);
  } catch {
    // 保存できなくてもセッション内では有効
  }
  for (const listener of speechSpeedListeners) listener();
}

/** SSR 用スナップショット(サーバーでは常に既定値) */
export function getDefaultSpeechSpeed(): SpeechSpeedId {
  return DEFAULT_SPEECH_SPEED;
}

/** 各読み上げ箇所の基準レートに現在の速度倍率を掛ける */
export function applySpeechSpeed(baseRate: number): number {
  const level = SPEECH_SPEED_LEVELS.find((l) => l.id === getSpeechSpeed());
  const rate = baseRate * (level?.factor ?? 1);
  return Math.min(2, Math.max(0.3, rate));
}

export function speak(text: string, lang = "en-US", onComplete?: () => void) {
  // Use speakQueue for consistency and reliability (callbacks, cancellation)
  speakQueue([text], 0, lang, onComplete);
}

export function speakQueue(texts: string[], interval = 0, lang = "en-US", onComplete?: () => void, onProgress?: (idx: number) => void) {
  activeQueueId++; // Invalidate previous queues
  const myQueueId = activeQueueId;

  if (!synth) {
    if (onComplete) onComplete();
    return;
  }

  synth.cancel();
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }

  let idx = 0;
  function playNext() {
    // Check if this queue is still active
    if (myQueueId !== activeQueueId) return;

    if (idx >= texts.length) {
      if (onComplete) onComplete();
      return;
    }

    if (onProgress) onProgress(idx);
    const txt = texts[idx];
    const u = new SpeechSynthesisUtterance(txt);
    currentUtterance = u; // Keep reference
    u.lang = lang;
    u.rate = applySpeechSpeed(0.9);
    // On iOS, sometimes volume defaults to 0 or 1. Explicitly set it.
    u.volume = 1.0;

    // Safety timeout in case onend never fires
    // Estimate: 100ms per char is generous, min 1 sec.
    const estimatedDuration = Math.max(1000, txt.length * 100);
    const safetyTimer = setTimeout(() => {
      console.warn("Speech timeout, forcing next");
      if (myQueueId === activeQueueId) next();
    }, estimatedDuration + 2000); // +2s buffer

    let finished = false;
    const next = () => {
      if (finished) return;
      finished = true;
      clearTimeout(safetyTimer);
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
      if (currentUtterance === u) {
        currentUtterance = null;
      }

      // Check ID again before scheduling next
      if (myQueueId !== activeQueueId) return;

      if (interval > 0 && idx < texts.length - 1) {
        currentTimeout = setTimeout(() => {
          if (myQueueId === activeQueueId) {
            idx++;
            playNext();
          }
        }, interval);
      } else {
        idx++;
        playNext();
      }
    };

    u.onend = () => {
      next();
    };

    u.onerror = () => {
      next();
    };

    synth?.speak(u);
  }
  playNext();
}



/** Cancel any speech and timeouts */
export function cancelSpeech() {
  // Increment ID to invalidate any running queues
  activeQueueId++;

  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }
  if (synth) {
    synth.cancel();
  }
  currentUtterance = null;
}

export function unlockSpeech() {
  if (!synth) return;
  if (synth.paused) {
    synth.resume();
  }
  // Some browsers need an empty speak to "warm up"
  if (!synth.speaking) {
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    synth.speak(u);
  }
}

