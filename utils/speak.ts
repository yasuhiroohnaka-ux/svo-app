export function speak(text: string, lang = "en-US") {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.0;
  u.pitch = 1.0;
  synth.speak(u);
}

export function speakQueue(texts: string[], interval = 0, lang = "en-US", onComplete?: () => void) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.cancel();

  texts.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9; // Slightly slower for clarity
    u.pitch = 1.0;

    // Add silence before speaking (except first one if preferred)
    // but utterance events are tricky. 
    // Easier approach: queue empty utterance for silence if API supports it, 
    // but reliable way is just standard queue. 
    // To insert actual time delay, we can use a blank utterance with spaces or special handling.
    // However, simplest "interval" via Web Speech API queue is not direct.
    // We will use a recursive timeout approach or the end event.

    // LET'S USE A RECURSIVE APPROACH for robustness with delays.
  });

  // Actually, let's implement the recursive approach properly below.
  // This replaces the loop above.
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

    u.onend = () => {
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

    synth.speak(u);
  }
  playNext();
}
