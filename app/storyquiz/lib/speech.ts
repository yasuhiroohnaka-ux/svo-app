"use client";

export type SpeakOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onError?: (event: SpeechSynthesisErrorEvent) => void;
};

let activeSpeechId = 0;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let voiceLoadTimer: ReturnType<typeof setTimeout> | null = null;
let voicesReady = false;

function getSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

function clearFallbackTimer() {
  if (!fallbackTimer) return;
  clearTimeout(fallbackTimer);
  fallbackTimer = null;
}

function clearVoiceLoadTimer() {
  if (!voiceLoadTimer) return;
  clearTimeout(voiceLoadTimer);
  voiceLoadTimer = null;
}

function releaseUtterance() {
  if (!currentUtterance) return;
  currentUtterance.onend = null;
  currentUtterance.onerror = null;
  currentUtterance = null;
}

function warmVoiceList(synth: SpeechSynthesis) {
  if (voicesReady) return;
  const voices = synth.getVoices();
  if (voices.length > 0) {
    voicesReady = true;
    return;
  }

  synth.onvoiceschanged = () => {
    voicesReady = true;
  };
}

function waitForVoices(
  synth: SpeechSynthesis,
  speechId: number,
  onReady: () => void,
) {
  const voices = synth.getVoices();
  if (voices.length > 0) {
    voicesReady = true;
    onReady();
    return;
  }

  clearVoiceLoadTimer();
  const previousHandler = synth.onvoiceschanged;
  synth.onvoiceschanged = (event) => {
    previousHandler?.call(synth, event);
    voicesReady = true;
    clearVoiceLoadTimer();
    if (speechId === activeSpeechId) onReady();
  };

  voiceLoadTimer = setTimeout(() => {
    clearVoiceLoadTimer();
    if (speechId === activeSpeechId) onReady();
  }, 900);
}

function pickVoice(
  synth: SpeechSynthesis,
  lang: string,
): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (voices.length === 0) return null;

  const normalizedLang = lang.toLowerCase();
  const englishVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
  );
  const englishNamedVoices = voices.filter((voice) =>
    /english|united states|united kingdom|us\b|uk\b|aria|guy|jenny|david|zira|mark|susan/i.test(
      `${voice.name} ${voice.voiceURI}`,
    ),
  );

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLang) ??
    englishVoices.find((voice) => voice.lang.toLowerCase() === "en-us") ??
    englishVoices.find((voice) => voice.lang.toLowerCase() === "en-gb") ??
    englishVoices[0] ??
    englishNamedVoices[0] ??
    null
  );
}

function completeSpeech(speechId: number, onEnd?: () => void) {
  if (speechId !== activeSpeechId) return;
  clearFallbackTimer();
  releaseUtterance();
  onEnd?.();
}

export function speak(text: string, options: SpeakOptions = {}) {
  activeSpeechId += 1;
  const speechId = activeSpeechId;
  const synth = getSynthesis();

  if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
    setTimeout(() => completeSpeech(speechId, options.onEnd), 0);
    return;
  }

  clearFallbackTimer();
  clearVoiceLoadTimer();
  synth.cancel();

  waitForVoices(synth, speechId, () => {
    if (speechId !== activeSpeechId) return;

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  utterance.lang = options.lang ?? "en-US";
  utterance.rate = options.rate ?? 0.88;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;
  utterance.voice = pickVoice(synth, utterance.lang);

  utterance.onend = () => completeSpeech(speechId, options.onEnd);
  utterance.onerror = (event) => {
    options.onError?.(event);
    completeSpeech(speechId, options.onEnd);
  };

  const estimatedMs = Math.max(1600, text.length * 90);
  fallbackTimer = setTimeout(() => {
    completeSpeech(speechId, options.onEnd);
  }, estimatedMs + 2500);

  try {
    synth.speak(utterance);
  } catch {
    completeSpeech(speechId, options.onEnd);
  }
  });
}

export function cancelSpeech() {
  activeSpeechId += 1;
  clearFallbackTimer();
  clearVoiceLoadTimer();
  releaseUtterance();
  const synth = getSynthesis();
  synth?.cancel();
}

export function unlockSpeech() {
  const synth = getSynthesis();
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;
  warmVoiceList(synth);
  if (synth.paused) synth.resume();
}
