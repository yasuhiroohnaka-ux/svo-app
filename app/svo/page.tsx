"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cancelSpeech, unlockSpeech } from "@/utils/speak";
import { playBuzz, playChime, unlockAudio } from "@/utils/sound";
import { formatTime } from "@/utils/ranking";

import { loadCards, pickRandomIndex, shuffle } from "./data";
import type { Card, ContentLang, Feedback, Mode, TrickSentence, UiLang } from "./types";
import { useGameTimer } from "./useGameTimer";
import { useRanking } from "./useRanking";
import { useSpeech } from "./useSpeech";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useVsMode } from "./useVsMode";

import styles from "./page.module.css";

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
    survivalMode: "Time Trial",
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
    timeTrial: "Time Trial",
    timer: "Time",
    ranking: "Ranking",
    rankingTitle: "Time Trial Ranking",
    enterName: "Enter your name:",
    clearRanking: "Clear Ranking",
    close: "Close",
    rank: "Rank",
    name: "Name",
    time: "Time",
    date: "Date",
    noRecords: "No records yet!",
    newRecord: "New Record!",
    yourTime: "Your time",
  },
  ja: {
    loading: "じゅんびちゅう...",
    cards: "カード",
    score: "スコア",
    streak: "れんぞく",
    mode: "モード",
    flash: "フラッシュ",
    karuta: "かるた",
    choices: "えらぶ数",
    autoSpeak: "自動読み上げ",
    on: "オン",
    off: "オフ",
    deck: "デッキ",
    surprise: "サプライズ",
    survivalMode: "タイムトライアル",
    trickMode: "トリック",
    flashInstruction: "ただしい文をえらんでね",
    chooseOne: "ひとつえらんでね",
    target: "おだい",
    speak: "よむ",
    skip: "スキップ",
    gameCleared: "クリア！",
    uiLang: "表示言語",
    contentLang: "学習言語",
    english: "英語",
    chinese: "中国語",
    japanese: "日本語",
    appTitle: "パズルグラマー",
    voiceMode: "音声",
    articleEasy: "かんたん",
    articleHard: "むずかしい",
    listening: "きいています...",
    sayTheSentence: "文を言ってみよう",
    timeTrial: "タイムトライアル",
    timer: "タイム",
    ranking: "ランキング",
    rankingTitle: "タイムトライアル ランキング",
    enterName: "なまえを入力してね",
    clearRanking: "ランキングを消す",
    close: "とじる",
    rank: "順位",
    name: "名前",
    time: "時間",
    date: "日付",
    noRecords: "まだ記録がありません",
    newRecord: "新記録！",
    yourTime: "あなたのタイム",
  },
  zh: {
    loading: "加载中...",
    cards: "卡片",
    score: "分数",
    streak: "连击",
    mode: "模式",
    flash: "闪卡",
    karuta: "图卡",
    choices: "选项数",
    autoSpeak: "自动朗读",
    on: "开",
    off: "关",
    deck: "牌组",
    surprise: "惊喜",
    survivalMode: "计时挑战",
    trickMode: "陷阱模式",
    flashInstruction: "请选择正确句子",
    chooseOne: "请选择一个",
    target: "目标",
    speak: "朗读",
    skip: "跳过",
    gameCleared: "通关！",
    uiLang: "界面语言",
    contentLang: "学习语言",
    english: "英语",
    chinese: "中文",
    japanese: "日语",
    appTitle: "Puzzle Grammar",
    voiceMode: "语音",
    articleEasy: "简单",
    articleHard: "困难",
    listening: "正在聆听...",
    sayTheSentence: "请说出句子",
    timeTrial: "计时挑战",
    timer: "时间",
    ranking: "排行榜",
    rankingTitle: "计时挑战排行榜",
    enterName: "请输入名字",
    clearRanking: "清空排行榜",
    close: "关闭",
    rank: "排名",
    name: "姓名",
    time: "时间",
    date: "日期",
    noRecords: "暂无记录",
    newRecord: "新纪录！",
    yourTime: "你的时间",
  }
};


export default function Page() {
  const [cards, setCards] = useState<Card[]>([]);
  const [mode, setMode] = useState<Mode>("flash");
  const [contentLang, setContentLang] = useState<ContentLang>("en");
  const [uiLang, setUiLang] = useState<UiLang>("ja");
  const [choiceCount, setChoiceCount] = useState<number>(4);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  const [index, setIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Survival Mode State
  const [isSurvival, setIsSurvival] = useState<boolean>(false);
  const [remainingCards, setRemainingCards] = useState<Card[]>([]);
  const [trickMode, setTrickMode] = useState<boolean>(false);
  const [deckSize, setDeckSize] = useState<number | "all">("all");

  const APP_KEY = "svo";

  const t = translations[uiLang];

  // 繝・・繧ｿ隱ｭ縺ｿ霎ｼ縺ｿ・・ublic/data/svo_cards.json 繧呈Φ螳夲ｼ・  // cache: "no-store" might fail on some older Android WebViews / browsers?
  // Using timestamp query param instead for cache busting compatibility.
  // Debug State
  const [step, setStep] = useState<string>("boot");
  const [initError, setInitError] = useState<string | null>(null);
  const { aiLevel, aiScore, cancelAiTurn, changeAiLevel, disableVsMode, enableVsMode, isVsMode, scheduleAiTurn, setAiScore } =
    useVsMode();
  const { countdown, elapsedTime, gameState, resetGameTimer, setGameState, startGame, stopTimer, togglePause } =
    useGameTimer({
      shouldTrackElapsedOnCountdownFinish: mode === "karuta" && isSurvival,
    });

  const activePool = isSurvival ? remainingCards : cards;
  const current = activePool[index];

  const getSentence = useCallback(
    (card: Card) => (contentLang === "zh" ? card.sentence_zh : card.sentence),
    [contentLang],
  );
  const getSubject = useCallback(
    (card: Card) => (contentLang === "zh" ? card.subject_zh : card.subject),
    [contentLang],
  );
  const getVerb = useCallback(
    (card: Card) => (contentLang === "zh" ? card.verb_zh : card.verb),
    [contentLang],
  );
  const getObject = useCallback(
    (card: Card) => (contentLang === "zh" ? card.object_zh : card.object),
    [contentLang],
  );
  const getLangCode = useCallback(
    () => (contentLang === "zh" ? "zh-CN" : "en-US"),
    [contentLang],
  );

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      setInitError((prev) => prev ?? "Timeout: Initialization took too long (15s). Check network or device restrictions.");
      setStep("timeout");
    }, 15000);

    const run = async () => {
      try {
        const loadedCards = await loadCards({
          onStep: (nextStep) => {
            if (!cancelled) {
              setStep(nextStep);
            }
          },
        });

        if (cancelled) return;

        setCards(loadedCards);
        setRemainingCards(loadedCards);
        setIndex(pickRandomIndex(loadedCards.length));
        setScore(0);
        setStreak(0);
      } catch (error) {
        if (cancelled) return;
        console.error("Init Error:", error);
        setInitError(error instanceof Error ? error.message : String(error));
        setStep("failed");
      } finally {
        clearTimeout(timer);
      }
    };

    void run();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

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

  const trickSentence = useMemo<TrickSentence | null>(() => {
    if (!trickMode || !current || !isSurvival || activePool.length > 10) return null;

    const threshold = activePool.length <= 4 ? 1 / 3 : 0.2;
    if (Math.random() > threshold) return null;

    const takenCards = cards.filter((card) => !activePool.some((remaining) => remaining.id === card.id));
    const useGhost = takenCards.length > 0 && Math.random() > 0.5;

    if (useGhost) {
      const ghostCard = takenCards[Math.floor(Math.random() * takenCards.length)];
      return {
        s: contentLang === "zh" ? ghostCard.subject_zh : ghostCard.subject,
        v: contentLang === "zh" ? ghostCard.verb_zh : ghostCard.verb,
        o: contentLang === "zh" ? ghostCard.object_zh : ghostCard.object,
        sentence: contentLang === "zh" ? ghostCard.sentence_zh : ghostCard.sentence,
      };
    }

    const subjects = [...new Set(activePool.map((card) => (contentLang === "zh" ? card.subject_zh : card.subject)))];
    const verbs = [...new Set(activePool.map((card) => (contentLang === "zh" ? card.verb_zh : card.verb)))];
    const objects = [...new Set(activePool.map((card) => (contentLang === "zh" ? card.object_zh : card.object)))];

    if (subjects.length === 0 || verbs.length === 0 || objects.length === 0) return null;

    for (let i = 0; i < 50; i += 1) {
      const subject = subjects[Math.floor(Math.random() * subjects.length)];
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      const object = objects[Math.floor(Math.random() * objects.length)];

      if (
        verb.toLowerCase().includes("eats") &&
        ["boy", "girl", "dog"].some((word) => object.toLowerCase().includes(word))
      ) {
        continue;
      }

      const fakeSentence = contentLang === "zh" ? `${subject}${verb}${object}。` : `${subject} ${verb} ${object}.`;
      const matchesReal = activePool.some((card) => {
        const realSentence = contentLang === "zh" ? card.sentence_zh : card.sentence;
        return realSentence === fakeSentence;
      });

      if (!matchesReal) {
        return { s: subject, v: verb, o: object, sentence: fakeSentence };
      }
    }

    return null;
  }, [trickMode, current, isSurvival, activePool, contentLang, cards]);

  const isTrickActive = trickMode && isSurvival && activePool.length <= 10;
  const displaySentence = isTrickActive && trickSentence ? trickSentence.sentence : current ? getSentence(current) : "";

  const { clearSilenceTimeout, handleSpeak, scheduleSilenceTimeout } = useSpeech({
    activePoolLength: activePool.length,
    current,
    getLangCode,
    getObject,
    getSentence,
    getSubject,
    getVerb,
    isTrickActive,
    trickSentence,
  });

  const { handleRankingRegister: registerRankingEntry, nameInputVisible, pendingEntry, playerName, promptForRankingEntry, rankingData, setPlayerName, setShowRanking, showRanking } =
    useRanking({ appKey: APP_KEY });

  const { articleMode, clearSpokenText, isListening, setArticleMode, spokenText, startListening, toggleVoiceMode, voiceMode } =
    useSpeechRecognition({
      current,
      getLangCode,
      getObject,
      getSentence,
      getSubject,
      getVerb,
      onCorrect: handleVoiceCorrect,
      onIncorrect: handleVoiceIncorrect,
    });

  const karutaChoiceCount = useMemo(() => {
    if (mode !== "karuta") return choiceCount;
    if (isSurvival) return activePool.length;

    const total = cards.length;
    if (deckSize === "all") return total;
    return Math.min(Number(deckSize), total);
  }, [mode, deckSize, cards.length, choiceCount, isSurvival, activePool.length]);

  const survivalChoices = useMemo(() => {
    if (!isSurvival) return [];
    return shuffle(activePool).map((card) => card.image);
  }, [activePool, isSurvival]);

  const choices = useMemo(() => {
    if (!current || activePool.length === 0) return [];

    if (mode === "karuta") {
      if (isSurvival) {
        return survivalChoices;
      }

      const pool = cards.filter((card) => card.id !== current.id);
      const count = Math.max(2, karutaChoiceCount);
      const others = shuffle(pool).slice(0, count - 1);
      return shuffle([current, ...others]).map((card) => card.image);
    }

    const effectiveChoiceCount = Math.min(5, choiceCount);
    if (isSurvival) {
      const pool = activePool.filter((card) => card.id !== current.id);
      const takeCount = Math.min(pool.length, effectiveChoiceCount - 1);
      const others = shuffle(pool).slice(0, takeCount);
      return shuffle([current, ...others]).map((card) => (contentLang === "zh" ? card.sentence_zh : card.sentence));
    }

    const pool = cards.filter((card) => card.id !== current.id);
    const count = Math.max(2, effectiveChoiceCount);
    const others = shuffle(pool).slice(0, count - 1);
    return shuffle([current, ...others]).map((card) => (contentLang === "zh" ? card.sentence_zh : card.sentence));
  }, [cards, current, mode, choiceCount, karutaChoiceCount, activePool, isSurvival, contentLang, survivalChoices]);

  function handleVoiceCorrect(spoken: string) {
    setFeedback({ value: spoken, isCorrect: true });
    playChime();
    setTimeout(() => handleCorrectAnswer(), 1000);
  }

  function handleVoiceIncorrect(spoken: string) {
    setStreak(0);
    setFeedback({ value: spoken, isCorrect: false });
    playBuzz();
  }

  function judgeFlash(selectedSentence: string) {
    if (!current) return;

    unlockAudio();
    unlockSpeech();

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

  const resetGame = useCallback(() => {
    cancelSpeech();
    clearSilenceTimeout();
    cancelAiTurn();
    resetGameTimer();

    const targetCount = deckSize === "all" ? cards.length : Number(deckSize);
    const shuffled = shuffle(cards);
    setRemainingCards(shuffled.slice(0, targetCount));
    setScore(0);
    setAiScore(0);
    setStreak(0);
    setIndex(pickRandomIndex(Math.min(targetCount, shuffled.length)));
    setFeedback(null);
    clearSpokenText();
  }, [cancelAiTurn, cards, clearSpokenText, clearSilenceTimeout, deckSize, resetGameTimer, setAiScore]);

  const nextCard = useCallback(() => {
    if (activePool.length === 0) return;

    if (!isSurvival) {
      setIndex((currentIndex) => (currentIndex + 1) % activePool.length);
    } else if (activePool.length > 1) {
      setIndex(Math.floor(Math.random() * activePool.length));
    } else {
      setIndex(0);
    }

    setFeedback(null);
    clearSpokenText();
  }, [activePool.length, clearSpokenText, isSurvival]);

  const handleCorrectAnswer = useCallback(
    (keepCard = false, winner: "player" | "ai" = "player") => {
      if (!current) return;

      if (winner === "player") {
        setScore((currentScore) => currentScore + 1);
        setStreak((currentStreak) => currentStreak + 1);
      } else {
        setAiScore((currentScore) => currentScore + 1);
        setStreak(0);
      }

      clearSilenceTimeout();
      cancelAiTurn();

      if (mode === "karuta" && isSurvival && !keepCard) {
        const newPool = remainingCards.filter((card) => card.id !== current.id);
        setRemainingCards(newPool);

        if (newPool.length === 0) {
          if (isVsMode) {
            const finalPlayerScore = winner === "player" ? score + 1 : score;
            const finalAiScore = winner === "ai" ? aiScore + 1 : aiScore;

            let message = "";
            if (finalPlayerScore > finalAiScore) message = "YOU WIN!";
            else if (finalPlayerScore < finalAiScore) message = "YOU LOSE!";
            else message = "DRAW!";

            playChime();
            alert(`${message}\nPlayer: ${finalPlayerScore} - AI: ${finalAiScore}`);
            resetGame();
          } else {
            playChime();
            stopTimer();

            const cardCount = deckSize === "all" ? cards.length : Number(deckSize);
            promptForRankingEntry({
              name: "",
              time: elapsedTime,
              date: new Date().toISOString(),
              cards: cardCount,
            });
          }
        } else {
          setIndex(Math.floor(Math.random() * newPool.length));
        }

        return;
      }

      if (mode === "karuta" && isSurvival && keepCard) {
        setIndex(Math.floor(Math.random() * remainingCards.length));
        return;
      }

      nextCard();
    },
    [
      aiScore,
      cancelAiTurn,
      cards.length,
      clearSilenceTimeout,
      current,
      deckSize,
      elapsedTime,
      isSurvival,
      isVsMode,
      mode,
      nextCard,
      promptForRankingEntry,
      remainingCards,
      resetGame,
      score,
      setAiScore,
      stopTimer,
    ],
  );

  const onSpeakComplete = useCallback(() => {
    if (isTrickActive && trickSentence) {
      scheduleSilenceTimeout(() => {
        handleCorrectAnswer(true, "player");
      }, 2000);
      return;
    }

    if (isVsMode && current) {
      scheduleAiTurn(() => {
        handleCorrectAnswer(false, "ai");
      });
    }
  }, [current, handleCorrectAnswer, isTrickActive, isVsMode, scheduleAiTurn, scheduleSilenceTimeout, trickSentence]);

  useEffect(() => {
    if (!autoSpeak || !current || mode === "flash" || gameState !== "playing") return;

    const timer = setTimeout(() => {
      handleSpeak(onSpeakComplete);
    }, 500);

    return () => clearTimeout(timer);
  }, [autoSpeak, current, gameState, mode, handleSpeak, onSpeakComplete]);

  const quitSpecialMode = () => {
    cancelSpeech();
    clearSilenceTimeout();
    disableVsMode();
    stopTimer();

    setIsSurvival(false);
    setRemainingCards(cards);
    setScore(0);
    setStreak(0);
    setFeedback(null);
    clearSpokenText();
    setIndex(pickRandomIndex(cards.length));
    setGameState("idle");
  };

  const handleRankingRegister = () => {
    if (!pendingEntry) return;
    registerRankingEntry();
    resetGame();
  };

  function judgeKaruta(selectedImage: string) {
    if (!current) return;

    unlockAudio();
    unlockSpeech();
    clearSilenceTimeout();

    const ok = selectedImage === current.image;
    if (ok) {
      setFeedback({ value: selectedImage, isCorrect: true });
      playChime();
      setTimeout(() => handleCorrectAnswer(), 1000);
    } else {
      setStreak(0);
      setFeedback({ value: selectedImage, isCorrect: false });
      playBuzz();
    }
  }

  const startRound = () => {
    unlockAudio();
    unlockSpeech();
    startGame();
  };

  const handlePauseToggle = () => {
    if (gameState === "playing") {
      cancelSpeech();
      clearSilenceTimeout();
      cancelAiTurn();
    }

    togglePause();
  };

  const handleToggleSurvivalMode = () => {
    if (isVsMode) return;

    const nextValue = !isSurvival;
    setIsSurvival(nextValue);

    if (nextValue) {
      const targetCount = deckSize === "all" ? cards.length : Number(deckSize);
      const shuffled = shuffle(cards);
      setRemainingCards(shuffled.slice(0, targetCount));
      setScore(0);
      setStreak(0);
      setIndex(pickRandomIndex(Math.min(targetCount, shuffled.length)));
      resetGameTimer();
      return;
    }

    cancelAiTurn();
    stopTimer();
    setRemainingCards(cards);
    setGameState("playing");
  };

  const handleToggleVsMode = () => {
    if (isVsMode) {
      disableVsMode();
      setIsSurvival(false);
      setRemainingCards(cards);
      setIndex(pickRandomIndex(cards.length));
    } else {
      enableVsMode();
      setIsSurvival(true);
      const targetCount = deckSize === "all" ? cards.length : Number(deckSize);
      const shuffled = shuffle(cards);
      setRemainingCards(shuffled.slice(0, targetCount));
      setIndex(pickRandomIndex(Math.min(targetCount, shuffled.length)));
    }

    setScore(0);
    setStreak(0);
    setFeedback(null);
    clearSpokenText();
    resetGameTimer();
  };

  if (initError) {
    return (
      <div style={{ padding: 20, color: "red", background: "#ffebee", height: "100vh" }}>
        <h2>Initialization Failed</h2>
        <p><strong>Error:</strong> {initError}</p>
        <p><strong>Last Step:</strong> {step}</p>
        <button onClick={() => window.location.reload()} style={{ minWidth: 44, minHeight: 44, padding: "10px 20px", marginTop: 20 }}>
          Reload Page
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        color: "#333",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✨</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "normal" }}>Connecting pieces...</h2>
        <div style={{ marginTop: "1rem", color: "#666", fontSize: "0.9rem" }}>
          Status: {step}
        </div>
        <div id="boot-probe" style={{ marginTop: "0.5rem", color: "#666", fontSize: "0.8rem" }}>
          BOOT_OK: ...
          {" / "}
          HYDRATED_OK: ...
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var w=window;var el=document.getElementById('boot-probe');if(!el)return;var render=function(){el.textContent='BOOT_OK: '+(w.BOOT_OK===true)+' / HYDRATED_OK: '+(w.HYDRATED_OK===true);};render();setTimeout(render,1500);})();",
          }}
        />
      </div>
    );
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
      <div className={styles.controlGroup} style={{ marginBottom: 8 }}>
        <Link href="/" className={`${styles.button} ${styles.tapTarget}`}>
          トップ
        </Link>
        <Link href="/quiz-maker" className={`${styles.button} ${styles.tapTarget}`}>
          Quiz Maker
        </Link>
        <Link href="/phonics" className={`${styles.button} ${styles.tapTarget}`}>
          oto-man
        </Link>
      </div>

      {/* Score & Status */}
      <div className={styles.statusRow}>
        cards: {isSurvival ? activePool.length : cards.length}
        {" / "}
        {isVsMode ? (
          <>
            Player: {score} - AI: {aiScore}
          </>
        ) : (
          <>
            score: {score} / streak: {streak}
          </>
        )}
        {mode === "karuta" && isSurvival && (
          <span className={styles.timer}>{formatTime(elapsedTime)}</span>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <button
            onClick={toggleUiLang}
            className={`${styles.button} ${styles.tapTarget}`}
            title={t.uiLang}
          >
            {t.uiLang}: {getUiLangLabel()}
          </button>

          <div style={{ opacity: 0.7 }}>|</div>

          <button
            onClick={() => setContentLang(contentLang === "en" ? "zh" : "en")}
            className={`${styles.button} ${styles.tapTarget}`}
            title={t.contentLang}
          >
            {t.contentLang}: {getContentLangLabel()}
          </button>
        </div>

        <div className={styles.controlGroup}>
          <div>{t.mode}</div>
          <button
            onClick={() => setMode("flash")}
            className={`${styles.button} ${styles.tapTarget} ${mode === "flash" ? styles.buttonActive : ""}`}
          >
            {t.flash}
          </button>
          <button
            onClick={() => setMode("karuta")}
            className={`${styles.button} ${styles.tapTarget} ${mode === "karuta" ? styles.buttonActive : ""}`}
          >
            {t.karuta}
          </button>
        </div>

        <div className={styles.controlGroup}>
          <button
            onClick={() => setShowAdvancedControls((v) => !v)}
            className={`${styles.button} ${styles.tapTarget}`}
          >
            {showAdvancedControls ? "メニューをとじる" : "メニュー"}
          </button>
        </div>

        {/* Flash mode: choices (max 5) */}
        {showAdvancedControls && mode === "flash" && !voiceMode && (
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
        {showAdvancedControls && mode === "flash" && (
          <div className={styles.controlGroup}>
            <div style={{ opacity: 0.7 }}>|</div>
            <button
              onClick={toggleVoiceMode}
              className={`${styles.button} ${voiceMode ? styles.buttonActive : ""}`}
            >
              {t.voiceMode}: {voiceMode ? t.on : t.off}
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

        {showAdvancedControls && (
          <div className={styles.controlGroup}>
            <div style={{ opacity: 0.7 }}>|</div>
            <button
              onClick={() => setAutoSpeak((v) => !v)}
              className={`${styles.button} ${styles.tapTarget} ${autoSpeak ? styles.buttonActive : ""}`}
            >
              {t.autoSpeak}: {autoSpeak ? t.on : t.off}
            </button>
          </div>
        )}

        {/* Karuta mode: deck selector + survival */}
        {mode === "karuta" && (
          <>
            <div className={styles.controlGroup}>
              {gameState === "idle" && (
                <button
                  onClick={startRound}
                  className={`${styles.button} ${styles.tapTarget} ${styles.buttonActive}`}
                  style={{ background: "#ff7043", borderColor: "#f4511e" }}
                >
                  START
                </button>
              )}
              {gameState === "playing" && (
                <button onClick={handlePauseToggle} className={`${styles.button} ${styles.tapTarget}`}>
                  PAUSE
                </button>
              )}
              {gameState === "paused" && (
                <button
                  onClick={handlePauseToggle}
                  className={`${styles.button} ${styles.tapTarget} ${styles.buttonActive}`}
                  style={{ background: "#42a5f5", borderColor: "#1e88e5" }}
                >
                  RESUME
                </button>
              )}
              {(isSurvival || isVsMode) && gameState !== "idle" && (
                <>
                  <button onClick={quitSpecialMode} className={`${styles.button} ${styles.tapTarget}`}>
                    やめる
                  </button>
                  <button onClick={resetGame} className={`${styles.button} ${styles.tapTarget}`}>
                    リセット
                  </button>
                </>
              )}
            </div>

            {showAdvancedControls && (
              <>
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
                    onClick={handleToggleSurvivalMode}
                    className={`${styles.button} ${styles.tapTarget} ${isSurvival ? styles.buttonSurvival : ""}`}
                    style={{ opacity: isVsMode ? 0.5 : 1, cursor: isVsMode ? "not-allowed" : "pointer" }}
                  >
                    {t.survivalMode}: {isSurvival ? t.on : t.off}
                  </button>
                </div>

                <div className={styles.controlGroup}>
                  <div style={{ opacity: 0.7 }}>|</div>
                  <button
                    onClick={handleToggleVsMode}
                    className={`${styles.button} ${styles.tapTarget} ${isVsMode ? styles.buttonActive : ""}`}
                  >
                    VS AI: {isVsMode ? t.on : t.off}
                  </button>

                  {isVsMode && (
                    <select
                      value={aiLevel}
                      onChange={(e) => changeAiLevel(e.target.value as typeof aiLevel)}
                      className={styles.select}
                      style={{ marginLeft: 4 }}
                    >
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  )}
                </div>
              </>
            )}
          </>
        )}

	        {showAdvancedControls && mode === "karuta" && isSurvival && remainingCards.length <= 10 && (
          <div className={styles.controlGroup}>
            <div style={{ opacity: 0.7 }}>|</div>
	            <button
	              onClick={() => setTrickMode(!trickMode)}
	              className={`${styles.button} ${styles.tapTarget} ${trickMode ? styles.buttonTrick : ""}`}
	            >
              {t.trickMode}: {trickMode ? t.on : t.off}
            </button>
          </div>
        )}
      </div>

      {/* 蝠城｡後お繝ｪ繧｢ */}
      <div className={styles.gameArea}>
        {mode === "flash" ? (
          <div className={styles.flashGrid}>
            {/* 蟾ｦ: 逕ｻ蜒・*/}
            <div>
              <div style={{ marginBottom: 10, opacity: 0.8 }}>
                {t.flashInstruction} ({contentLang === "en" ? t.english : t.chinese})
              </div>
              <div
                className={styles.flashImageContainer}
                onClick={() => {
                  unlockAudio();
                  unlockSpeech();
                  handleSpeak();
                }}
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

            {/* 蜿ｳ: 驕ｸ謚櫁い or 髻ｳ螢ｰ隱崎ｭ・*/}
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
                    {isListening ? `${t.voiceMode}: ${t.listening}` : `${t.voiceMode}: ${t.speak}`}
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
                    <button
                      onClick={() => {
                        unlockAudio();
                        unlockSpeech();
                        handleSpeak();
                      }}
                      className={`${styles.button} ${styles.tapTarget}`}
                    >
                      {t.speak}
                    </button>
                    <button onClick={nextCard} className={`${styles.button} ${styles.tapTarget}`}>
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
            {/* karuta: show target sentence + speaker icon */}
            <div className={styles.karutaHeader}>
              <div className={styles.controlGroup}>
                <div style={{ opacity: 0.8 }}>{t.target}:</div>
                <div className={styles.targetSentence}>{displaySentence}</div>
              </div>

              <div className={styles.controlGroup}>
                <button
                  onClick={() => {
                    unlockAudio();
                    unlockSpeech();
                    handleSpeak();
                  }}
                  className={`${styles.button} ${styles.tapTarget}`}
                  title={t.speak}
                >
                  {t.speak}
                </button>
                <button
                  onClick={nextCard}
                  className={`${styles.button} ${styles.tapTarget}`}
                >
                  {t.skip}
                </button>
              </div>
            </div>

            {/* 逕ｻ蜒丞呵｣・窶・dynamic sizing via CSS variable */}
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
        {/* Overlay for Countdown/Pause */}
        {mode === "karuta" && (gameState === "countdown" || gameState === "paused") && (
          <div className={styles.overlay}>
            {gameState === "paused" ? (
              <>
                <div className={styles.overlayText}>PAUSED</div>
                <button
                  onClick={handlePauseToggle}
                  className={styles.overlaySubText}
                  style={{ cursor: "pointer", border: "2px solid white" }}
                >
                  RESUME
                </button>
              </>
            ) : (
              <div className={styles.overlayText} key={countdown}>
                {countdown > 0 ? countdown : "GO!"}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Name Input Modal */}
      {nameInputVisible && (
        <div className={styles.rankingOverlay}>
          <div className={styles.rankingModal}>
            <div className={styles.rankingHeader}>{t.rankingTitle}</div>
            <div style={{ marginBottom: 12 }}>{t.newRecord}</div>
            <div style={{ marginBottom: 20, fontSize: 32, fontWeight: "bold", color: "#ffca28" }}>{formatTime(pendingEntry?.time || 0)}</div>
            <div style={{ marginBottom: 8 }}>{t.enterName}</div>
            <input
              type="text"
              className={styles.rankingInput}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Name"
              maxLength={10}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRankingRegister();
              }}
            />
            <button className={styles.rankingButton} onClick={handleRankingRegister}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Ranking List Modal */}
      {showRanking && (
        <div className={styles.rankingOverlay}>
          <div className={styles.rankingModal}>
            <div className={styles.rankingHeader}>{t.ranking}</div>
            <table className={styles.rankingTable}>
              <thead>
                <tr>
                  <th>{t.rank}</th>
                  <th>{t.name}</th>
                  <th>{t.time}</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.length === 0 ? (
                  <tr><td colSpan={3}>{t.noRecords}</td></tr>
                ) : (
                  rankingData.map((d, i) => (
                    <tr key={i} className={pendingEntry && d.date === pendingEntry.date ? styles.rankingRowNew : ""}>
                      <td>{i + 1}</td>
                      <td>{d.name}</td>
                      <td>{formatTime(d.time)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <button
              className={styles.rankingCloseButton}
              onClick={() => setShowRanking(false)}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      <footer className={styles.copyright}>
        (c) 2026 Yasuhiro Ohnaka - All rights reserved
      </footer>
    </main >
  );
}
