import { useCallback, useEffect, useRef } from "react";

import { cancelSpeech, speak, speakQueue } from "@/utils/speak";

import type { Card, TrickSentence } from "./types";

type UseSpeechOptions = {
  activePoolLength: number;
  current?: Card;
  getLangCode: () => string;
  getObject: (card: Card) => string;
  getSentence: (card: Card) => string;
  getSubject: (card: Card) => string;
  getVerb: (card: Card) => string;
  isTrickActive: boolean;
  trickSentence: TrickSentence | null;
};

export function useSpeech({
  activePoolLength,
  current,
  getLangCode,
  getObject,
  getSentence,
  getSubject,
  getVerb,
  isTrickActive,
  trickSentence,
}: UseSpeechOptions) {
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const scheduleSilenceTimeout = useCallback(
    (callback: () => void, delayMs: number) => {
      clearSilenceTimeout();
      silenceTimeoutRef.current = setTimeout(() => {
        callback();
        silenceTimeoutRef.current = null;
      }, delayMs);
    },
    [clearSilenceTimeout],
  );

  const handleSpeak = useCallback(
    (callback?: () => void) => {
      if (!current) return;

      clearSilenceTimeout();

      const useInterval = activePoolLength <= 4;
      const interval = useInterval ? 300 : 0;

      if (isTrickActive && trickSentence) {
        speakQueue(
          [trickSentence.s, trickSentence.v, trickSentence.o],
          interval,
          getLangCode(),
          callback,
        );
        return;
      }

      if (isTrickActive && useInterval) {
        speakQueue(
          [getSubject(current), getVerb(current), getObject(current)],
          interval,
          getLangCode(),
          callback,
        );
        return;
      }

      speak(getSentence(current), getLangCode(), callback);
    },
    [
      activePoolLength,
      clearSilenceTimeout,
      current,
      getLangCode,
      getObject,
      getSentence,
      getSubject,
      getVerb,
      isTrickActive,
      trickSentence,
    ],
  );

  useEffect(
    () => () => {
      clearSilenceTimeout();
      cancelSpeech();
    },
    [clearSilenceTimeout],
  );

  return {
    clearSilenceTimeout,
    handleSpeak,
    scheduleSilenceTimeout,
  };
}
