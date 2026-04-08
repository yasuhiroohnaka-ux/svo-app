import { useCallback, useEffect, useRef, useState } from "react";

import type { ArticleMode, Card } from "./types";

type UseSpeechRecognitionOptions = {
  current?: Card;
  getLangCode: () => string;
  getObject: (card: Card) => string;
  getSentence: (card: Card) => string;
  getSubject: (card: Card) => string;
  getVerb: (card: Card) => string;
  onCorrect: (spokenText: string) => void;
  onIncorrect: (spokenText: string) => void;
};

type BrowserSpeechRecognition = {
  abort: () => void;
  end?: () => void;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: null | (() => void);
  onerror: null | (() => void);
  onresult: null | ((event: BrowserSpeechRecognitionResultEvent) => void);
  onstart: null | (() => void);
  start: () => void;
};

type BrowserSpeechRecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type BrowserSpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

function normalize(text: string): string {
  return text.toLowerCase().replace(/[.\s]+$/g, "").trim();
}

function stemVerb(verb: string): string {
  const lower = verb.toLowerCase();

  if (lower.endsWith("shes")) return lower.slice(0, -2);
  if (lower.endsWith("ches")) return lower.slice(0, -2);
  if (lower.endsWith("xes")) return lower.slice(0, -2);
  if (lower.endsWith("ies")) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith("s")) return lower.slice(0, -1);

  return lower;
}

function extractWords(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
}

export function useSpeechRecognition({
  current,
  getLangCode,
  getObject,
  getSentence,
  getSubject,
  getVerb,
  onCorrect,
  onIncorrect,
}: UseSpeechRecognitionOptions) {
  const [voiceMode, setVoiceMode] = useState(false);
  const [articleMode, setArticleMode] = useState<ArticleMode>("easy");
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setIsListening(false);
  }, []);

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((currentValue) => !currentValue);
    stopListening();
  }, [stopListening]);

  const clearSpokenText = useCallback(() => {
    setSpokenText("");
  }, []);

  const judgeVoice = useCallback(
    (spoken: string) => {
      if (!current) return;

      let ok = false;
      let processedSpoken = spoken;
      const correctText = getSentence(current);

      if (correctText.toLowerCase().includes("washes")) {
        processedSpoken = processedSpoken.replace(/\bwatches\b/gi, "washes");
      }

      if (articleMode === "easy") {
        const subjectWords = extractWords(getSubject(current));
        const objectWords = extractWords(getObject(current));
        const verbStemmed = stemVerb(getVerb(current));

        const subjectNoun =
          subjectWords.filter((word) => !["a", "an", "the"].includes(word)).pop() || "";
        const objectNoun =
          objectWords.filter((word) => !["a", "an", "the"].includes(word)).pop() || "";

        const spokenWords = extractWords(processedSpoken);
        const spokenStemmed = spokenWords.map((word) => stemVerb(word));

        const hasSubject =
          spokenWords.includes(subjectNoun) || spokenStemmed.includes(subjectNoun);
        const hasVerb =
          spokenWords.includes(verbStemmed) ||
          spokenStemmed.includes(verbStemmed) ||
          spokenWords.includes(getVerb(current).toLowerCase());
        const hasObject =
          spokenWords.includes(objectNoun) || spokenStemmed.includes(objectNoun);

        let orderOk = true;
        if (hasSubject && hasObject && subjectNoun !== objectNoun) {
          const subjectIndex =
            spokenWords.indexOf(subjectNoun) !== -1
              ? spokenWords.indexOf(subjectNoun)
              : spokenStemmed.indexOf(subjectNoun);
          const objectIndex =
            spokenWords.indexOf(objectNoun) !== -1
              ? spokenWords.indexOf(objectNoun)
              : spokenStemmed.indexOf(objectNoun);

          if (subjectIndex !== -1 && objectIndex !== -1) {
            orderOk = subjectIndex < objectIndex;
          }
        }

        ok = hasSubject && hasVerb && hasObject && orderOk;
      } else {
        ok = normalize(processedSpoken) === normalize(correctText);
      }

      if (ok) {
        onCorrect(spoken);
        return;
      }

      onIncorrect(spoken);
    },
    [
      articleMode,
      current,
      getObject,
      getSentence,
      getSubject,
      getVerb,
      onCorrect,
      onIncorrect,
    ],
  );

  const startListening = useCallback(() => {
    const speechWindow = window as BrowserSpeechRecognitionWindow;
    const SpeechRecognitionClass =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    stopListening();

    const recognition = new SpeechRecognitionClass() as BrowserSpeechRecognition;
    recognition.lang = getLangCode();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setSpokenText("");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpokenText(transcript);
      setIsListening(false);
      judgeVoice(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [getLangCode, judgeVoice, stopListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  return {
    articleMode,
    clearSpokenText,
    isListening,
    setArticleMode,
    spokenText,
    startListening,
    stopListening,
    toggleVoiceMode,
    voiceMode,
  };
}
