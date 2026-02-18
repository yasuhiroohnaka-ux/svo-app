const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
let currentUtterance: SpeechSynthesisUtterance | null = null; // Prevent GC

export function speak(text: string, lang = "en-US", onComplete?: () => void) {
  // Use speakQueue for consistency and reliability (callbacks, cancellation)
  speakQueue([text], 0, lang, onComplete);
}

export function speakQueue(texts: string[], interval = 0, lang = "en-US", onComplete?: () => void) {
  if (!synth) {
    if (onComplete) onComplete();
    return;
  }

  synth.cancel();

  let idx = 0;
  function playNext() {
    if (idx >= texts.length) {
      if (onComplete) onComplete();
      return;
    }

    const txt = texts[idx];
    const u = new SpeechSynthesisUtterance(txt);
    currentUtterance = u; // Keep reference
    u.lang = lang;
    u.rate = 0.9;
    // On iOS, sometimes volume defaults to 0 or 1. Explicitly set it.
    u.volume = 1.0;

    // Safety timeout in case onend never fires
    // Estimate: 100ms per char is generous, min 1 sec.
    const estimatedDuration = Math.max(1000, txt.length * 100);
    const safetyTimer = setTimeout(() => {
      console.warn("Speech timeout, forcing next");
      next();
    }, estimatedDuration + 2000); // +2s buffer

    let finished = false;
    const next = () => {
      if (finished) return;
      finished = true;
      clearTimeout(safetyTimer);

      if (interval > 0 && idx < texts.length - 1) {
        setTimeout(() => {
          idx++;
          playNext();
        }, interval);
      } else {
        idx++;
        playNext();
      }
    };

    u.onend = () => {
      next();
    };

    u.onerror = (e) => {
      console.error("Speech error", e);
      next();
    };

    synth.speak(u);
  }
  playNext();
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
