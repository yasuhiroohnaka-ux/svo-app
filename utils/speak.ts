export function speak(text: string, lang = "en-US", onComplete?: () => void) {
  // Use speakQueue for consistency and reliability (callbacks, cancellation)
  speakQueue([text], 0, lang, onComplete);
}

export function speakQueue(texts: string[], interval = 0, lang = "en-US", onComplete?: () => void) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.cancel();

  // Remove dead 'forEach' block

  let idx = 0;
  function playNext() {
    if (idx >= texts.length) {
      if (onComplete) onComplete();
      return;
    }
    const txt = texts[idx];
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = lang;
    u.rate = 0.9;

    const next = () => {
      if (idx < texts.length - 1) {
        setTimeout(() => {
          idx++;
          playNext();
        }, interval);
      } else {
        // Last one finished
        idx++;
        playNext(); // to trigger completion
      }
    };

    u.onend = next;

    // Add error handling to prevent hanging
    u.onerror = (e) => {
      console.error("Speech error:", e);
      // Proceed anyway to avoid hanging the game logic
      next();
    };

    synth.speak(u);
  }
  playNext();
}
