"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { speak, speakQueue } from "@/utils/speak";
import { playBuzz, playChime } from "@/utils/sound";
import styles from "./page.module.css";

type Card = {
  id: number;
  subject: string;
  verb: string;
  object: string;
  sentence: string;      // 英文
  subject_zh: string;
  verb_zh: string;
  object_zh: string;
  sentence_zh: string;   // 中文
  image: string;         // 画像パス（例: /images/page_0.png）
};

type Mode = "flash" | "karuta";
type ContentLang = "en" | "zh";
type UiLang = "en" | "ja" | "zh";
type ArticleMode = "easy" | "hard";

const translations = {
  en: {
    loading: "loading...",
    cards: "cards",
    score: "score",
    streak: "streak",
    mode: "mode",
    flash: "flash",
    karuta: "karuta",
    choices: "choices",
    autoSpeak: "auto speak",
    on: "on",
    off: "off",
    deck: "Deck",
    surprise: "Surprise",
    survivalMode: "Survival Mode",
    trickMode: "Trick Mode",
    flashInstruction: "flash: pick the correct",
    chooseOne: "choose one",
    target: "target",
    speak: "speak",
    skip: "skip",
    gameCleared: "Game Cleared! Restarting...",
    uiLang: "UI Language",
    contentLang: "Content Language",
    english: "English",
    chinese: "Chinese",
    japanese: "Japanese",
    appTitle: "Puzzle Grammar",
    voiceMode: "voice",
    articleEasy: "easy",
    articleHard: "hard",
    listening: "Listening...",
    sayTheSentence: "Say the sentence!",
  },
  ja: {
    loading: "じゅんびちゅう...",
    cards: "のこり",
    score: "てんすう",
    streak: "れんぞく",
    mode: "モード",
    flash: "フラッシュ",
    karuta: "かるた",
    choices: "かず",
    autoSpeak: "じどうよみあげ",
    on: "オン",
    off: "オフ",
    deck: "まいすう",
    surprise: "サプライズ",
    survivalMode: "サバイバル",
    trickMode: "トリック",
    flashInstruction: "フラッシュ: ただしい文を えらんでね",
    chooseOne: "ひとつ えらぼう",
    target: "さがしてね",
    speak: "きく",
    skip: "スキップ",
    gameCleared: "クリア！ 最初にもどるよ",
    uiLang: "ひょうじ",
    contentLang: "カード",
    english: "えいご",
    chinese: "ちゅうごくご",
    japanese: "にほんご",
    appTitle: "パズルグラマー",
    voiceMode: "おんせい",
    articleEasy: "かんたん",
    articleHard: "むずかしい",
    listening: "きいてるよ...",
    sayTheSentence: "ぶんを いってね！",
  },
  zh: {
    loading: "加载中...",
    cards: "剩余",
    score: "分数",
    streak: "连胜",
    mode: "模式",
    flash: "闪卡",
    karuta: "歌牌",
    choices: "选项",
    autoSpeak: "自动朗读",
    on: "开",
    off: "关",
    deck: "卡片数",
    surprise: "惊喜",
    survivalMode: "生存模式",
    trickMode: "陷阱模式",
    flashInstruction: "闪卡：选择正确的句子",
    chooseOne: "选择一个",
    target: "目标",
    speak: "朗读",
    skip: "跳过",
    gameCleared: "通关！重新开始...",
    uiLang: "界面语言",
    contentLang: "内容语言",
    english: "英语",
    chinese: "中文",
    japanese: "日语",
    appTitle: "拼图语法",
    voiceMode: "语音",
    articleEasy: "简单",
    articleHard: "困难",
    listening: "正在听...",
    sayTheSentence: "请说句子！",
  }
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Normalize for comparison: lowercase, trim, remove trailing punctuation */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[.\s]+$/g, "").trim();
}

/** Remove articles (a, an, the) for easy mode comparison */
function stripArticles(s: string): string {
  return s.replace(/\b(a|an|the)\b/gi, "").replace(/\s+/g, " ").trim();
}

/** Strip verb inflection: "washes" -> "wash", "eats" -> "eat" */
function stemVerb(v: string): string {
  const w = v.toLowerCase();
  if (w.endsWith("shes")) return w.slice(0, -2);   // washes -> wash
  if (w.endsWith("ches")) return w.slice(0, -2);   // catches -> catch
  if (w.endsWith("xes")) return w.slice(0, -2);    // fixes -> fix
  if (w.endsWith("ies")) return w.slice(0, -3) + "y"; // carries -> carry
  if (w.endsWith("s")) return w.slice(0, -1);      // eats -> eat
  return w;
}

/** Extract core words from a string, lowercased */
function extractWords(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
}

export default function Page() {
  const [cards, setCards] = useState<Card[]>([]);
  const [mode, setMode] = useState<Mode>("flash");
  const [contentLang, setContentLang] = useState<ContentLang>("en");
  const [uiLang, setUiLang] = useState<UiLang>("en");
  const [choiceCount, setChoiceCount] = useState<number>(4);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  const [index, setIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ value: string; isCorrect: boolean } | null>(null);

  // Survival Mode State
  const [isSurvival, setIsSurvival] = useState<boolean>(false);
  const [remainingCards, setRemainingCards] = useState<Card[]>([]);
  const [trickMode, setTrickMode] = useState<boolean>(false);
  const [deckSize, setDeckSize] = useState<number | "all">("all");

  // Voice Recognition State
  const [voiceMode, setVoiceMode] = useState<boolean>(false);
  const [articleMode, setArticleMode] = useState<ArticleMode>("easy");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  const t = translations[uiLang];

  // データ読み込み（public/data/svo_cards.json を想定）
  useEffect(() => {
    (async () => {
      const res = await fetch("/data/svo_cards.json", { cache: "no-store" });
      const data = await res.json();

      // よくある形に寄せて吸収（配列 or {cards:[...]}）
      const arr: any[] = Array.isArray(data) ? data : data?.cards ?? data?.items ?? [];
      const normalized: Card[] = arr
        .map((x, i) => ({
          id: x.id ?? x.cardId ?? i,
          subject: x.subject ?? "",
          verb: x.verb ?? "",
          object: x.object ?? "",
          sentence: x.sentence ?? x.text ?? "",
          subject_zh: x.subject_zh ?? "",
          verb_zh: x.verb_zh ?? "",
          object_zh: x.object_zh ?? "",
          sentence_zh: x.sentence_zh ?? "",
          image: x.image ?? x.img ?? x.imagePath ?? (x.imageFile ? `/images/${x.imageFile}` : ""),
        }))
        .filter((x) => x.sentence && x.image);

      setCards(normalized);
      setRemainingCards(normalized);
      setIndex(0);
      setScore(0);
      setStreak(0);
    })().catch((e) => {
      console.error(e);
      setCards([]);
    });
  }, []);

  // Determine current pool based on mode
  const activePool = isSurvival ? remainingCards : cards;
  const current = activePool[index];

  // Helper to get text/audio based on contentLang
  const getSentence = (c: Card) => contentLang === "zh" ? c.sentence_zh : c.sentence;
  const getSubject = (c: Card) => contentLang === "zh" ? c.subject_zh : c.subject;
  const getVerb = (c: Card) => contentLang === "zh" ? c.verb_zh : c.verb;
  const getObject = (c: Card) => contentLang === "zh" ? c.object_zh : c.object;
  const getLangCode = () => contentLang === "zh" ? "zh-CN" : "en-US";

  // Cycle UI Language: en -> ja -> zh -> en
  const toggleUiLang = () => {
    setUiLang((prev) => {
      if (prev === "en") return "ja";
      if (prev === "ja") return "zh";
      return "en";
    });
  };

  // Helper for UI lang label
  const getUiLangLabel = () => {
    if (uiLang === "en") return t.english;
    if (uiLang === "ja") return t.japanese;
    return t.chinese;
  };

  // Helper for Content lang label
  const getContentLangLabel = () => {
    if (contentLang === "en") return t.english;
    return t.chinese;
  };

  // Effect to reset index if out of bounds (e.g. after removing a card)
  useEffect(() => {
    if (index >= activePool.length && activePool.length > 0) {
      setIndex(0);
    }
  }, [activePool.length, index]);

  // Karuta: determine how many images to show based on deckSize
  const karutaChoiceCount = useMemo(() => {
    if (mode !== "karuta") return choiceCount;
    if (isSurvival) return activePool.length; // survival uses all remaining
    const total = cards.length;
    if (deckSize === "all") return total;
    return Math.min(Number(deckSize), total);
  }, [mode, deckSize, cards.length, choiceCount, isSurvival, activePool.length]);

  function nextCard() {
    if (activePool.length === 0) return;

    if (!isSurvival) {
      setIndex((i) => (i + 1) % activePool.length);
    } else {
      // If survival, pick random from remaining
      if (activePool.length > 1) {
        const nextIdx = Math.floor(Math.random() * activePool.length);
        setIndex(nextIdx);
      } else {
        setIndex(0);
      }
    }
    setFeedback(null);
    setSpokenText("");
  }



  function judgeFlash(selectedSentence: string) {
    if (!current) return;
    // Check against current sentence (in correct lang)
    const correctText = getSentence(current);
    const ok = selectedSentence === correctText;

    if (ok) {
      setFeedback({ value: selectedSentence, isCorrect: true });
      playChime();
      setTimeout(() => handleCorrectAnswer(), 1000);
    } else {
      setStreak(0);
      setFeedback({ value: selectedSentence, isCorrect: false });
      playBuzz();
    }
  }

  // Trick mode: generate a confusing sentence from remaining cards' S/V/O
  const trickSentence = useMemo(() => {
    if (!trickMode || !current || !isSurvival || activePool.length > 10) return null;

    // 20% chance to trigger trick sentence (1/5)
    // If random > 0.2, return null (80% chance normal)
    if (Math.random() > 0.2) return null;

    // Collect all unique subjects, verbs, objects from remaining cards
    const subjects = [...new Set(activePool.map(c => contentLang === "zh" ? c.subject_zh : c.subject))];
    const verbs = [...new Set(activePool.map(c => contentLang === "zh" ? c.verb_zh : c.verb))];
    const objects = [...new Set(activePool.map(c => contentLang === "zh" ? c.object_zh : c.object))];
    // Pick random S, V, O that don't match any existing card exactly
    for (let attempt = 0; attempt < 20; attempt++) {
      const s = subjects[Math.floor(Math.random() * subjects.length)];
      const v = verbs[Math.floor(Math.random() * verbs.length)];
      const o = objects[Math.floor(Math.random() * objects.length)];

      // Safety filter: prevent "eats" + "boy"/"girl"/"dog"
      if (v.toLowerCase().includes("eats") || v.includes("吃")) {
        const forbidden = ["boy", "girl", "dog", "男孩", "女孩", "狗"];
        if (forbidden.some(word => o.toLowerCase().includes(word))) {
          continue;
        }
      }

      const fake = contentLang === "zh" ? `${s}${v}${o}。` : `${s} ${v} ${o}.`;
      // Make sure this combo doesn't match any actual card
      const matchesReal = activePool.some(c => {
        const real = contentLang === "zh" ? c.sentence_zh : c.sentence;
        return real === fake;
      });
      if (!matchesReal) return { sentence: fake, s, v, o };
    }
    return null; // fallback: use real sentence
  }, [trickMode, current, isSurvival, activePool, contentLang]);

  // The sentence to display/speak (may be trick sentence)
  const isTrickActive = trickMode && isSurvival && activePool.length <= 10;
  const displaySentence = isTrickActive && trickSentence ? trickSentence.sentence : (current ? getSentence(current) : "");

  // Stable shuffled pool for survival mode
  // This memo only re-runs when activePool (remaining cards) changes,
  // NOT when 'current' changes (unlike the logic below).
  const survivalChoices = useMemo(() => {
    if (!isSurvival) return [];
    return shuffle(activePool).map((c) => c.image);
  }, [activePool, isSurvival]);

  // 選択肢生成（flash: 文、karuta: 画像）
  const choices = useMemo(() => {
    if (!current || activePool.length === 0) return [];

    if (mode === "karuta") {
      // Karuta mode: use karutaChoiceCount
      if (isSurvival) {
        // In survival, show all remaining cards as choices (STABLE ORDER)
        return survivalChoices;
      } else {
        // Normal: take karutaChoiceCount cards (including current)
        const pool = cards.filter((c) => c.id !== current.id);
        const n = Math.max(2, karutaChoiceCount);
        const others = shuffle(pool).slice(0, n - 1);
        return shuffle([current, ...others]).map((c) => c.image);
      }
    } else {
      // Flash mode: use choiceCount (max 5)
      const effectiveN = Math.min(5, choiceCount);
      if (isSurvival) {
        const pool = activePool.filter((c) => c.id !== current.id);
        const takeN = Math.min(pool.length, effectiveN - 1);
        const others = shuffle(pool).slice(0, takeN);
        return shuffle([current, ...others]).map((c) => contentLang === "zh" ? c.sentence_zh : c.sentence);
      } else {
        const pool = cards.filter((c) => c.id !== current.id);
        const n = Math.max(2, effectiveN);
        const others = shuffle(pool).slice(0, n - 1);
        return shuffle([current, ...others]).map((c) => contentLang === "zh" ? c.sentence_zh : c.sentence);
      }
    }
  }, [cards, current, mode, choiceCount, karutaChoiceCount, activePool, isSurvival, contentLang, survivalChoices]);

  // Ref for silence timeout in trick mode
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount or card change
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [current]);

  // karuta時に自動で読み上げ
  useEffect(() => {
    if (!current) return;
    if (mode !== "karuta") return;
    if (!autoSpeak) return;

    // Clear any existing silence timer
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    const onSpeakComplete = () => {
      // If trick mode & trick sentence (fake), wait 2s then auto-correct
      if (isTrickActive && trickSentence) {
        silenceTimeoutRef.current = setTimeout(() => {
          // If this fires, user hasn't clicked anything for 2s after reading
          // Pass true to keep the card in the deck (just a "pass")
          handleCorrectAnswer(true);
        }, 2000);
      }
    };

    if (isTrickActive && trickSentence) {
      // Trick mode: speak S -> V -> O with 0.5s intervals
      speakQueue(
        [trickSentence.s, trickSentence.v, trickSentence.o],
        300,
        getLangCode(),
        onSpeakComplete
      );
    } else if (isTrickActive) {
      speakQueue(
        [getSubject(current), getVerb(current), getObject(current)],
        300,
        getLangCode(),
        onSpeakComplete // Also callback here? No, correct answer needs clicking
      );
    } else {
      speak(getSentence(current), getLangCode());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode, autoSpeak, isSurvival, trickMode, activePool.length, contentLang, trickSentence]);

  /** Judge spoken text (voice recognition) */
  function judgeVoice(spoken: string) {
    if (!current) return;

    let ok = false;

    if (articleMode === "easy") {
      // Easy mode: check if the core S, V, O words are present in spoken text
      // Extract the last word from subject/object (the noun), and stem the verb
      const subjectWords = extractWords(getSubject(current));
      const objectWords = extractWords(getObject(current));
      const verbStemmed = stemVerb(getVerb(current));

      // The key noun is usually the last word: "A banana" -> "banana"
      const subjectNoun = subjectWords.filter(w => !["a", "an", "the"].includes(w)).pop() || "";
      const objectNoun = objectWords.filter(w => !["a", "an", "the"].includes(w)).pop() || "";

      const spokenWords = extractWords(spoken);
      // Also stem spoken words to catch "wash" vs "washes" etc.
      const spokenStemmed = spokenWords.map(w => stemVerb(w));

      const hasSubject = spokenWords.includes(subjectNoun) || spokenStemmed.includes(subjectNoun);
      const hasVerb = spokenWords.includes(verbStemmed) || spokenStemmed.includes(verbStemmed)
        || spokenWords.includes(getVerb(current).toLowerCase());
      const hasObject = spokenWords.includes(objectNoun) || spokenStemmed.includes(objectNoun);

      ok = hasSubject && hasVerb && hasObject;
    } else {
      // Hard mode: exact match (after normalization)
      const correctText = getSentence(current);
      ok = normalize(spoken) === normalize(correctText);
    }

    if (ok) {
      setFeedback({ value: spoken, isCorrect: true });
      playChime();
      setTimeout(() => handleCorrectAnswer(), 1000);
    } else {
      setStreak(0);
      setFeedback({ value: spoken, isCorrect: false });
      playBuzz();
    }
  }

  /** Start speech recognition */
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getLangCode();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setSpokenText("");
    };

    recognition.onresult = (event: any) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, articleMode, contentLang]);

  function handleCorrectAnswer(keepCard = false) {
    if (!current) return;
    setScore((s) => s + 1);
    setStreak((s) => s + 1);

    // Stop trick silence timer if any
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (mode === "karuta" && isSurvival && !keepCard) {
      // Remove current card from remaining
      const newPool = remainingCards.filter((c) => c.id !== current.id);
      setRemainingCards(newPool);

      if (newPool.length === 0) {
        playChime();
        alert(t.gameCleared);
        // Reset with respect to deckSize
        const targetCount = deckSize === "all" ? cards.length : Number(deckSize);
        const shuffled = shuffle(cards);
        setRemainingCards(shuffled.slice(0, targetCount));
        setScore(0);
        setStreak(0);
        setIndex(0); // Also reset index to be safe
      } else {
        // Pick random next card
        const nextIdx = Math.floor(Math.random() * newPool.length);
        setIndex(nextIdx);
      }
    } else if (mode === "karuta" && isSurvival && keepCard) {
      // Just pick random next card from CURRENT pool (which hasn't changed)
      const nextIdx = Math.floor(Math.random() * remainingCards.length);
      setIndex(nextIdx);
    } else {
      // Flash mode or normal Karuta
      nextCard();
    }
  }

  function judgeKaruta(selectedImage: string) {
    if (!current) return;

    // User interacted, so clear silence timer
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    const ok = selectedImage === current.image;
    if (ok) {
      setFeedback({ value: selectedImage, isCorrect: true });
      playChime();
      setTimeout(() => handleCorrectAnswer(), 1000);
    } else {
      setStreak(0);
      // In trick mode, if it's a trick sentence (fake), ANY card is wrong.
      // So this logic holds.
      setFeedback({ value: selectedImage, isCorrect: false });
      playBuzz();
    }
  }

  if (!current) {
    return (
      <main className={styles.container}>
        <h1 className={styles.header}>{t.appTitle || "Puzzle Grammar"}</h1>
        <p style={{ marginTop: 12 }}>{t.loading}</p>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.header}>{t.appTitle}</h1>

      {/* 上部コントロール */}
      <div className={styles.controls}>
        <div style={{ whiteSpace: "nowrap" }}>
          {t.cards}: {activePool.length} / {t.score}: {score} / {t.streak}: {streak}
        </div>

        <div className={styles.controlGroup}>
          <button
            onClick={toggleUiLang}
            className={styles.button}
            title={t.uiLang}
          >
            {t.uiLang}: {getUiLangLabel()}
          </button>

          <div style={{ opacity: 0.7 }}>|</div>

          <button
            onClick={() => setContentLang(contentLang === "en" ? "zh" : "en")}
            className={styles.button}
            title={t.contentLang}
          >
            {t.contentLang}: {getContentLangLabel()}
          </button>
        </div>

        <div className={styles.controlGroup}>
          <div>{t.mode}</div>
          <button
            onClick={() => setMode("flash")}
            className={`${styles.button} ${mode === "flash" ? styles.buttonActive : ""}`}
          >
            {t.flash}
          </button>
          <button
            onClick={() => setMode("karuta")}
            className={`${styles.button} ${mode === "karuta" ? styles.buttonActive : ""}`}
          >
            {t.karuta}
          </button>
        </div>

        {/* Flash mode: choices (max 5) */}
        {mode === "flash" && !voiceMode && (
          <div className={styles.controlGroup}>
            <div>{t.choices}</div>
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setChoiceCount(n)}
                className={`${styles.choiceButton} ${choiceCount === n ? styles.choiceButtonActive : ""}`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Flash mode: voice recognition toggle + easy/hard */}
        {mode === "flash" && (
          <div className={styles.controlGroup}>
            <div style={{ opacity: 0.7 }}>|</div>
            <button
              onClick={() => {
                setVoiceMode((v) => !v);
                if (recognitionRef.current) {
                  recognitionRef.current.abort();
                  setIsListening(false);
                }
              }}
              className={`${styles.button} ${voiceMode ? styles.buttonActive : ""}`}
            >
              🎤 {t.voiceMode}: {voiceMode ? t.on : t.off}
            </button>

            {voiceMode && (
              <>
                <button
                  onClick={() => setArticleMode("easy")}
                  className={`${styles.button} ${articleMode === "easy" ? styles.buttonActive : ""}`}
                >
                  {t.articleEasy}
                </button>
                <button
                  onClick={() => setArticleMode("hard")}
                  className={`${styles.button} ${articleMode === "hard" ? styles.buttonActive : ""}`}
                >
                  {t.articleHard}
                </button>
              </>
            )}
          </div>
        )}

        <div className={styles.controlGroup}>
          <div style={{ opacity: 0.7 }}>|</div>
          <button
            onClick={() => setAutoSpeak((v) => !v)}
            className={`${styles.button} ${autoSpeak ? styles.buttonActive : ""}`}
          >
            {t.autoSpeak}: {autoSpeak ? t.on : t.off}
          </button>
        </div>

        {/* Karuta mode: deck selector + survival */}
        {mode === "karuta" && (
          <div className={styles.controlGroup}>
            <div style={{ opacity: 0.7 }}>|</div>

            <div className={styles.controlGroup}>
              <span style={{ fontSize: 14 }}>{t.deck}:</span>
              <select
                value={deckSize}
                onChange={(e) => setDeckSize(e.target.value === "all" ? "all" : Number(e.target.value))}
                className={styles.select}
                disabled={isSurvival}
              >
                {[5, 10, 15, 20, 30, 35].filter(n => n <= cards.length).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value="all">All ({cards.length})</option>
              </select>
            </div>

            <button
              onClick={() => {
                const newVal = !isSurvival;
                setIsSurvival(newVal);
                if (newVal) {
                  const targetCount = deckSize === "all" ? cards.length : Number(deckSize);
                  const shuffled = shuffle(cards);
                  setRemainingCards(shuffled.slice(0, targetCount));
                  setScore(0);
                  setStreak(0);
                  setIndex(0);
                } else {
                  setRemainingCards(cards);
                }
              }}
              className={`${styles.button} ${isSurvival ? styles.buttonSurvival : ""}`}
            >
              {t.survivalMode}: {isSurvival ? t.on : t.off}
            </button>
          </div>
        )}

        {mode === "karuta" && isSurvival && remainingCards.length <= 10 && (
          <div className={styles.controlGroup}>
            <div style={{ opacity: 0.7 }}>|</div>
            <button
              onClick={() => setTrickMode(!trickMode)}
              className={`${styles.button} ${trickMode ? styles.buttonTrick : ""}`}
            >
              {t.trickMode}: {trickMode ? t.on : t.off}
            </button>
          </div>
        )}
      </div>

      {/* 問題エリア */}
      <div className={styles.gameArea}>
        {mode === "flash" ? (
          <div className={styles.flashGrid}>
            {/* 左: 画像 */}
            <div>
              <div style={{ marginBottom: 10, opacity: 0.8 }}>
                {t.flashInstruction} ({contentLang === "en" ? t.english : t.chinese})
              </div>
              <div
                className={styles.flashImageContainer}
                onClick={() => speak(getSentence(current), getLangCode())}
                style={{ cursor: "pointer" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.image}
                  alt="card"
                  className={styles.flashImage}
                />
              </div>
            </div>

            {/* 右: 選択肢 or 音声認識 */}
            <div>
              {voiceMode ? (
                /* Voice recognition mode */
                <div className={styles.voiceArea}>
                  <div style={{ marginBottom: 10, fontWeight: "bold" }}>
                    {t.sayTheSentence}
                  </div>

                  <button
                    onClick={startListening}
                    className={`${styles.voiceButton} ${isListening ? styles.voiceButtonListening : ""}`}
                    disabled={isListening}
                  >
                    {isListening ? `🔴 ${t.listening}` : "🎤"}
                  </button>

                  {spokenText && (
                    <div
                      className={styles.spokenResult}
                      style={{
                        borderColor: feedback?.isCorrect === true ? "green"
                          : feedback?.isCorrect === false ? "red"
                            : "#a5d6a7"
                      }}
                    >
                      &quot;{spokenText}&quot;
                    </div>
                  )}

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <button onClick={() => speak(getSentence(current), getLangCode())} className={styles.button}>
                      🔊 {t.speak}
                    </button>
                    <button onClick={nextCard} className={styles.button}>
                      {t.skip}
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal choice mode */
                <>
                  <div style={{ marginBottom: 10 }}>{t.chooseOne}</div>
                  <div className={styles.sentenceList}>
                    {choices.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => judgeFlash(String(s))}
                        className={styles.sentenceButton}
                        style={{
                          border: feedback?.value === String(s)
                            ? `2px solid ${feedback.isCorrect ? "green" : "red"}`
                            : "1px solid #222",
                        }}
                      >
                        {String(s)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* karuta: ターゲット文を常に表示 + 🔊 */}
            <div className={styles.karutaHeader}>
              <div className={styles.controlGroup}>
                <div style={{ opacity: 0.8 }}>{t.target}:</div>
                <div className={styles.targetSentence}>{displaySentence}</div>
              </div>

              <div className={styles.controlGroup}>
                <button
                  onClick={() => {
                    if (isTrickActive && trickSentence) {
                      speakQueue([trickSentence.s, trickSentence.v, trickSentence.o], 300, getLangCode());
                    } else if (isTrickActive) {
                      speakQueue([getSubject(current), getVerb(current), getObject(current)], 300, getLangCode());
                    } else {
                      speak(getSentence(current), getLangCode());
                    }
                  }}
                  className={styles.button}
                  title={t.speak}
                >
                  🔊 {t.speak}
                </button>
                <button
                  onClick={nextCard}
                  className={styles.button}
                >
                  {t.skip}
                </button>
              </div>
            </div>

            {/* 画像候補 — dynamic sizing via CSS variable */}
            <div
              className={styles.karutaGrid}
              style={{ "--card-count": choices.length } as React.CSSProperties}
            >
              {choices.map((img, i) => (
                <button
                  key={i}
                  onClick={() => judgeKaruta(String(img))}
                  className={styles.karutaCard}
                  style={{
                    border: feedback?.value === String(img)
                      ? `2px solid ${feedback.isCorrect ? "green" : "red"}`
                      : "1px solid #222",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={String(img)}
                    alt={`choice-${i}`}
                    className={styles.karutaImage}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
