"use client";

import { applySpeechSpeed } from "@/utils/speak";

const BASE_RATE = 0.76;

let activeSpeechId = 0;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let voiceTimer: ReturnType<typeof setTimeout> | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

function getSynthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

function clearTimers(): void {
  if (voiceTimer) clearTimeout(voiceTimer);
  if (fallbackTimer) clearTimeout(fallbackTimer);
  voiceTimer = null;
  fallbackTimer = null;
}

function pickEnglishVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  const englishVoices = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en"),
  );

  return (
    englishVoices.find((voice) => voice.lang.toLowerCase() === "en-us") ??
    englishVoices.find((voice) => voice.lang.toLowerCase() === "en-gb") ??
    englishVoices[0] ??
    voices.find((voice) =>
      /english|aria|guy|jenny|david|zira|mark|susan/i.test(
        `${voice.name} ${voice.voiceURI}`,
      ),
    ) ??
    null
  );
}

function finishSpeech(speechId: number, onEnd?: () => void): void {
  if (speechId !== activeSpeechId) return;
  clearTimers();
  if (currentUtterance) {
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
  }
  currentUtterance = null;
  onEnd?.();
}

export function speakSota(text: string, onEnd?: () => void): void {
  activeSpeechId += 1;
  const speechId = activeSpeechId;
  const synth = getSynthesis();

  if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
    onEnd?.();
    return;
  }

  clearTimers();
  synth.cancel();

  const start = () => {
    if (speechId !== activeSpeechId) return;
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;
    utterance.lang = "en-US";
    utterance.rate = applySpeechSpeed(BASE_RATE);
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.voice = pickEnglishVoice(synth);
    utterance.onend = () => finishSpeech(speechId, onEnd);
    utterance.onerror = () => finishSpeech(speechId, onEnd);

    fallbackTimer = setTimeout(
      () => finishSpeech(speechId, onEnd),
      Math.max(4000, text.length * 110),
    );

    try {
      synth.speak(utterance);
    } catch {
      finishSpeech(speechId, onEnd);
    }
  };

  if (synth.getVoices().length > 0) {
    start();
  } else {
    synth.getVoices();
    voiceTimer = setTimeout(start, 650);
  }
}

export function cancelSotaSpeech(): void {
  activeSpeechId += 1;
  clearTimers();
  if (currentUtterance) {
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
  }
  currentUtterance = null;
  getSynthesis()?.cancel();
}

export function unlockSotaSpeech(): void {
  const synth = getSynthesis();
  if (!synth) return;
  synth.getVoices();
  if (synth.paused) synth.resume();
}
