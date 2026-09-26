"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cancelSpeech, unlockSpeech } from "@/utils/speak";
import { playBuzz, playChime, unlockAudio } from "@/utils/sound";
import { clearRanking, formatTime } from "@/utils/ranking";

import { loadCards, pickRandomIndex, shuffle } from "./data";
import { loadLv2Cards } from "@/app/lib/lv2Cards";
import AnswerMark from "@/app/components/AnswerMark";
import AppHeader from "@/app/components/AppHeader";
import { RankingDialog, TimeTrialResultDialog } from "@/app/components/Ranking";
import ResultDialog from "@/app/components/ResultDialog";
import RewardSummary from "@/app/components/RewardSummary";
import PenaltyFlash from "@/app/components/PenaltyFlash";
import { recordMistake } from "@/app/lib/mistakes";
import { recordStars, starsFromTime, starsFromVs, type RecordResult } from "@/app/lib/rewards";
import SettingsSheet, { SettingsChoice, SettingsRow } from "@/app/components/SettingsSheet";
import SpeedControl from "@/app/components/SpeedControl";
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
    appTitle: "SVO Karuta",
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
    level2Cards: "Level 2 cards",
    settings: "Settings",
    speechSpeed: "Reading speed",
    menu: "Menu",
    closeMenu: "Close menu",
    vsAutoSpeakNote: "In VS AI the cards are always read aloud.",
    rankIn: "Rank #{n}!",
    cleared: "Cleared!",
    outOfRank: "Not in the top 10 this time.",
    playAgain: "Play again",
    quit: "Quit",
    cardsUnit: " cards",
    youWin: "YOU WIN!",
    youLose: "YOU LOSE...",
    draw: "DRAW!",
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
    appTitle: "SVOカルタ",
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
    level2Cards: "レベル2カード",
    settings: "せってい",
    speechSpeed: "よみあげの はやさ",
    menu: "メニュー",
    closeMenu: "メニューをとじる",
    vsAutoSpeakNote: "VS AI のときは いつも よみあげます。",
    rankIn: "{n}位に ランクイン!",
    cleared: "クリア!",
    outOfRank: "こんかいは 10位に とどかなかったよ。",
    playAgain: "もういちど",
    quit: "やめる",
    cardsUnit: "まい",
    youWin: "かち!",
    youLose: "まけ...",
    draw: "ひきわけ!",
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
    appTitle: "SVO 图卡",
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
    level2Cards: "第2级卡片",
    settings: "设置",
    speechSpeed: "朗读速度",
    menu: "菜单",
    closeMenu: "关闭菜单",
    vsAutoSpeakNote: "对战 AI 时总是自动朗读。",
    rankIn: "第{n}名！",
    cleared: "通关！",
    outOfRank: "这次没有进入前10名。",
    playAgain: "再玩一次",
    quit: "退出",
    cardsUnit: "张",
    youWin: "你赢了！",
    youLose: "你输了...",
    draw: "平局！",
  }
};


export default function Page() {
  // ベースの35枚(レベル1)。lv2 と合成して cards を作る
  const [baseCards, setBaseCards] = useState<Card[]>([]);
  // レベル2追加カード(enabled かつ画像ありのもの。0枚ならトグル自体を出さない)
  const [lv2Cards, setLv2Cards] = useState<Card[]>([]);
  // レベル2カードを混ぜるか。既定オフ(現行と完全同一のデッキ)
  const [level2On, setLevel2On] = useState<boolean>(false);
  // 実際にプレイに使うデッキ(level2On に応じて base か base+lv2)
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

  // 正解後 1 秒の演出中は次の判定を受け付けない(連打による二重加算・AI との同時得点を防ぐ)
  const answerLockRef = useRef(false);
  const correctTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearPendingCorrect = useCallback(() => {
    if (correctTimerRef.current) {
      clearTimeout(correctTimerRef.current);
      correctTimerRef.current = null;
    }
    answerLockRef.current = false;
  }, []);
  useEffect(() => clearPendingCorrect, [clearPendingCorrect]);

  const t = translations[uiLang];

  // データ読み込み(public/data/svo_cards.json を想定)
  // cache: "no-store" might fail on some older Android WebViews / browsers?
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
        // lv2 は内部で空配列フォールバックするので、レベル1の可用性には影響しない
        const [loadedCards, loadedLv2] = await Promise.all([
          loadCards({
            onStep: (nextStep) => {
              if (!cancelled) {
                setStep(nextStep);
              }
            },
          }),
          loadLv2Cards(),
        ]);

        if (cancelled) return;

        setBaseCards(loadedCards);
        setLv2Cards(loadedLv2);
        // 初期はレベル2オフ = ベースのみ(現行と完全同一)
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

    // 偽文の素材はレベル1カード(cardId < 100)だけに限定する。
    // lv2 の複数形主語・形容詞補語が混ざると「Two snakes eats a car」「... eat red」
    // のような文法破綻文ができるため。素材が足りなければ従来どおり null を返す。
    const trickSource = activePool.filter((card) => card.id < 100);
    const subjects = [...new Set(trickSource.map((card) => (contentLang === "zh" ? card.subject_zh : card.subject)))];
    const verbs = [...new Set(trickSource.map((card) => (contentLang === "zh" ? card.verb_zh : card.verb)))];
    const objects = [...new Set(trickSource.map((card) => (contentLang === "zh" ? card.object_zh : card.object)))];

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

  const {
    handleRankingRegister: registerRankingEntry,
    openRanking,
    pendingEntry,
    pendingRank,
    playerName,
    promptForRankingEntry,
    rankingCards,
    rankingData,
    resultVisible,
    setPlayerName,
    setShowRanking,
    showRanking,
  } = useRanking({ appKey: APP_KEY });
  const [vsResult, setVsResult] = useState<{ player: number; ai: number; reward: RecordResult } | null>(null);
  const [trialReward, setTrialReward] = useState<RecordResult | null>(null);
  /** タイムトライアルの お手つき回数(1回ごとに PENALTY_SECONDS 秒たす) */
  const [penaltyCount, setPenaltyCount] = useState(0);
  const PENALTY_SECONDS = 2;
  const trialTime = elapsedTime + penaltyCount * PENALTY_SECONDS;
  const deckCardCount = deckSize === "all" ? cards.length : Math.min(Number(deckSize), cards.length);

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

  function acceptCorrectAnswer(value: string) {
    if (answerLockRef.current) return;
    answerLockRef.current = true;
    cancelAiTurn();
    clearSilenceTimeout();
    setFeedback({ value, isCorrect: true });
    playChime();
    correctTimerRef.current = setTimeout(() => {
      correctTimerRef.current = null;
      answerLockRef.current = false;
      handleCorrectAnswer();
    }, 1000);
  }

  function handleVoiceCorrect(spoken: string) {
    acceptCorrectAnswer(spoken);
  }

  function handleVoiceIncorrect(spoken: string) {
    if (answerLockRef.current) return;
    if (current) recordMistake("svo", current.id);
    setStreak(0);
    setFeedback({ value: spoken, isCorrect: false });
    playBuzz();
  }

  function judgeFlash(selectedSentence: string) {
    if (!current || answerLockRef.current) return;

    unlockAudio();
    unlockSpeech();

    const correctText = getSentence(current);
    const ok = selectedSentence === correctText;

    if (ok) {
      acceptCorrectAnswer(selectedSentence);
    } else {
      recordMistake("svo", current.id);
      setStreak(0);
      setFeedback({ value: selectedSentence, isCorrect: false });
      playBuzz();
    }
  }

  const resetGame = useCallback(() => {
    cancelSpeech();
    setPenaltyCount(0);
    clearPendingCorrect();
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
  }, [cancelAiTurn, cards, clearPendingCorrect, clearSpokenText, clearSilenceTimeout, deckSize, resetGameTimer, setAiScore]);

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

            playChime();
            stopTimer();
            setVsResult({
                player: finalPlayerScore,
                ai: finalAiScore,
                reward: recordStars("svo", `vs-${aiLevel}`, starsFromVs(finalPlayerScore, finalAiScore)),
            });
          } else {
            playChime();
            stopTimer();

            setTrialReward(recordStars("svo", `tt-${deckCardCount}`, starsFromTime(trialTime, deckCardCount)));
            promptForRankingEntry({
              name: "",
              time: trialTime,
              date: new Date().toISOString(),
              cards: deckCardCount,
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
      aiLevel,
      aiScore,
      cancelAiTurn,
      clearSilenceTimeout,
      current,
      deckCardCount,
      trialTime,
      isSurvival,
      isVsMode,
      mode,
      nextCard,
      promptForRankingEntry,
      remainingCards,
      score,
      setAiScore,
      stopTimer,
    ],
  );

  // handleCorrectAnswer はタイマー(elapsedTime)更新のたびに作り直される。
  // 読み上げ・AI の予約がそのたびに張り直されて永遠に発火しなくならないよう、
  // 予約側からは ref 経由で最新版を呼ぶ。
  const handleCorrectAnswerRef = useRef(handleCorrectAnswer);
  useEffect(() => {
    handleCorrectAnswerRef.current = handleCorrectAnswer;
  }, [handleCorrectAnswer]);

  const onSpeakComplete = useCallback(() => {
    if (isTrickActive && trickSentence) {
      scheduleSilenceTimeout(() => {
        if (answerLockRef.current) return;
        handleCorrectAnswerRef.current(true, "player");
      }, 2000);
      return;
    }

    if (isVsMode && current) {
      scheduleAiTurn(() => {
        if (answerLockRef.current) return;
        handleCorrectAnswerRef.current(false, "ai");
      });
    }
  }, [current, isTrickActive, isVsMode, scheduleAiTurn, scheduleSilenceTimeout, trickSentence]);

  // VS AI は読み上げを聞いてから取りに来るので、VS 中は自動読み上げを常にオンにする
  const effectiveAutoSpeak = autoSpeak || isVsMode;

  useEffect(() => {
    if (!effectiveAutoSpeak || !current || mode === "flash" || gameState !== "playing") return;

    const timer = setTimeout(() => {
      handleSpeak(onSpeakComplete);
    }, 500);

    return () => clearTimeout(timer);
  }, [effectiveAutoSpeak, current, gameState, mode, handleSpeak, onSpeakComplete]);

  const handleSkip = () => {
    if (answerLockRef.current) return;
    nextCard();
  };

  const quitSpecialMode = () => {
    cancelSpeech();
    setPenaltyCount(0);
    clearPendingCorrect();
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

  // レベル2カードのオン/オフ。デッキを組み直して全状態を安全にリセットする。
  // フラッシュ・かるた・サバイバル・VS AI のどこから切り替えても壊れないよう、
  // quitSpecialMode / resetGame と同じ後始末(音声・タイマー・特殊モード解除)を行う。
  const handleToggleLevel2 = () => {
    const nextOn = !level2On;
    const nextDeck = nextOn ? [...baseCards, ...lv2Cards] : baseCards;

    // 進行中の副作用をすべて停止
    cancelSpeech();
    setPenaltyCount(0);
    clearPendingCorrect();
    clearSilenceTimeout();
    cancelAiTurn();
    disableVsMode();
    stopTimer();
    resetGameTimer();

    // 特殊モードを解除して通常状態へ戻す
    setIsSurvival(false);
    setTrickMode(false);

    // デッキ差し替え + スコア類リセット
    setLevel2On(nextOn);
    const shuffled = shuffle(nextDeck);
    setCards(shuffled);
    setRemainingCards(shuffled);
    setIndex(pickRandomIndex(shuffled.length));
    setScore(0);
    setAiScore(0);
    setStreak(0);
    setFeedback(null);
    clearSpokenText();
    setGameState("idle");
  };

  const handleRankingRegister = () => {
    if (!pendingEntry) return;
    registerRankingEntry();
    resetGame();
  };

  function judgeKaruta(selectedImage: string) {
    if (!current || answerLockRef.current) return;

    unlockAudio();
    unlockSpeech();
    clearSilenceTimeout();

    const ok = selectedImage === current.image;
    if (ok) {
      acceptCorrectAnswer(selectedImage);
    } else {
      recordMistake("svo", current.id);
      // タイムトライアル中の お手つきは +2 秒(あてずっぽうの れんだで 速くならないように)
      if (isSurvival && !isVsMode && gameState === "playing") setPenaltyCount((count) => count + 1);
      setStreak(0);
      setFeedback({ value: selectedImage, isCorrect: false });
      playBuzz();
    }
  }

  const startRound = () => {
    setPenaltyCount(0);
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
    clearPendingCorrect();

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
    setPenaltyCount(0);
    clearPendingCorrect();
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

  // 結果・ランキングのダイアログ。カードが尽きた後(current なし)でも出す
  const dialogs = (
    <>
      {resultVisible && pendingEntry && (
        <TimeTrialResultDialog
          labels={t}
          time={pendingEntry.time}
          rank={pendingRank}
          playerName={playerName}
          onNameChange={setPlayerName}
          onSubmit={handleRankingRegister}
          reward={trialReward}
        />
      )}

      {showRanking && (
        <RankingDialog
          labels={t}
          cards={rankingCards}
          entries={rankingData}
          highlightDate={pendingEntry?.date}
          onClose={() => setShowRanking(false)}
          onClear={() => {
            clearRanking(APP_KEY);
            openRanking(rankingCards);
          }}
        />
      )}

      {vsResult && (
        <ResultDialog
          title={vsResult.player > vsResult.ai ? t.youWin : vsResult.player < vsResult.ai ? t.youLose : t.draw}
          mark={vsResult.player > vsResult.ai ? true : vsResult.player < vsResult.ai ? "🤖" : "🤝"}
          highlight={`${vsResult.player} - ${vsResult.ai}`}
          actions={[
            {
              label: t.playAgain,
              onClick: () => {
                setVsResult(null);
                resetGame();
              },
            },
            {
              label: t.quit,
              variant: "secondary",
              onClick: () => {
                setVsResult(null);
                quitSpecialMode();
              },
            },
          ]}
        >
          <p style={{ margin: 0 }}>Player {vsResult.player} / AI {vsResult.ai}</p>
          <RewardSummary result={vsResult.reward} />
        </ResultDialog>
      )}
    </>
  );

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
      </div>
    );
  }

  if (!current) {
    const showingResult = resultVisible || showRanking || vsResult !== null;
    return (
      <main className={styles.container}>
        <AppHeader title={t.appTitle} accent="var(--accent-svo)" />
        {!showingResult && <p style={{ marginTop: 12 }}>{t.loading}</p>}
        {dialogs}
      </main>
    );
  }

  const onOff = [
    { value: "on" as const, label: t.on },
    { value: "off" as const, label: t.off },
  ];
  const settings = (
    <SettingsSheet title={t.settings} label={t.settings}>
      <SettingsRow label={t.uiLang}>
        <SettingsChoice
          value={uiLang}
          options={[
            { value: "ja", label: t.japanese },
            { value: "en", label: t.english },
            { value: "zh", label: t.chinese },
          ]}
          onChange={setUiLang}
        />
      </SettingsRow>
      <SettingsRow label={t.contentLang}>
        <SettingsChoice
          value={contentLang}
          options={[
            { value: "en", label: t.english },
            { value: "zh", label: t.chinese },
          ]}
          onChange={setContentLang}
        />
      </SettingsRow>
      <SettingsRow label={t.speechSpeed}>
        <SpeedControl showLabel={false} />
      </SettingsRow>
      <SettingsRow label={t.autoSpeak}>
        <SettingsChoice
          value={effectiveAutoSpeak ? "on" : "off"}
          options={onOff}
          onChange={(value) => setAutoSpeak(value === "on")}
          disabled={isVsMode}
        />
        {isVsMode && <small>{t.vsAutoSpeakNote}</small>}
      </SettingsRow>
      {lv2Cards.length > 0 && (
        <SettingsRow label={t.level2Cards}>
          <SettingsChoice
            value={level2On ? "on" : "off"}
            options={onOff}
            onChange={(value) => {
              if ((value === "on") !== level2On) handleToggleLevel2();
            }}
          />
        </SettingsRow>
      )}
      <SettingsRow label={`${t.flash}: ${t.voiceMode}`}>
        <SettingsChoice
          value={voiceMode ? "on" : "off"}
          options={onOff}
          onChange={(value) => {
            if ((value === "on") !== voiceMode) toggleVoiceMode();
          }}
        />
        {voiceMode && (
          <SettingsChoice
            value={articleMode}
            options={[
              { value: "easy", label: t.articleEasy },
              { value: "hard", label: t.articleHard },
            ]}
            onChange={setArticleMode}
          />
        )}
      </SettingsRow>
      {!voiceMode && (
        <SettingsRow label={`${t.flash}: ${t.choices}`}>
          <SettingsChoice
            value={choiceCount}
            options={[2, 3, 4, 5].map((n) => ({ value: n, label: n }))}
            onChange={setChoiceCount}
          />
        </SettingsRow>
      )}
    </SettingsSheet>
  );

  return (
    <main className={styles.container}>
      <AppHeader title={t.appTitle} accent="var(--accent-svo)" right={settings} />

      {/* Score & Status */}
      <div className={styles.statusRow}>
        {t.cards}: {isSurvival ? activePool.length : cards.length}
        {" / "}
        {isVsMode ? (
          <>
            Player: {score} - AI: {aiScore}
          </>
        ) : (
          <>
            {t.score}: {score} / {t.streak}: {streak}
          </>
        )}
        {mode === "karuta" && isSurvival && (
          <span className={styles.timer}>
            {formatTime(trialTime)}
            <PenaltyFlash count={penaltyCount} seconds={PENALTY_SECONDS} />
          </span>
        )}
      </div>

      <div className={styles.controls}>
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
          {mode === "karuta" && (
            <button
              onClick={() => setShowAdvancedControls((v) => !v)}
              className={`${styles.button} ${styles.tapTarget}`}
              aria-expanded={showAdvancedControls}
            >
              {showAdvancedControls ? t.closeMenu : t.menu}
            </button>
          )}
        </div>

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
                  <button
                    onClick={() => openRanking(deckCardCount)}
                    className={`${styles.button} ${styles.tapTarget}`}
                  >
                    🏆 {t.ranking}
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
                onClick={() => {
                  unlockAudio();
                  unlockSpeech();
                  handleSpeak();
                }}
                style={{ cursor: "pointer" }}
              >
                <Image
                  src={current.image}
                  alt="もんだいの え"
                  className={styles.flashImage}
                  width={544}
                  height={387}
                  sizes="(max-width: 768px) 90vw, 380px"
                  priority
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
                    <button onClick={handleSkip} className={`${styles.button} ${styles.tapTarget}`}>
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
                          position: "relative",
                          paddingRight: 44,
                          border: feedback?.value === String(s)
                              ? `3px solid ${feedback.isCorrect ? "var(--ok)" : "var(--ng)"}`
                              : "1px solid #222",
                        }}
                      >
                        {String(s)}
                        {feedback?.value === String(s) && <AnswerMark correct={feedback.isCorrect} placement="end" />}
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
                  onClick={handleSkip}
                  className={`${styles.button} ${styles.tapTarget}`}
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
                    position: "relative",
                    border: feedback?.value === String(img)
                        ? `3px solid ${feedback.isCorrect ? "var(--ok)" : "var(--ng)"}`
                        : "1px solid #222",
                  }}
                >
                  <Image
                    src={String(img)}
                    alt={`えのカード ${i + 1}`}
                    className={styles.karutaImage}
                    width={544}
                    height={387}
                    sizes="(max-width: 480px) 45vw, (max-width: 1024px) 20vw, 200px"
                  />
                  {feedback?.value === String(img) && <AnswerMark correct={feedback.isCorrect} />}
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
      {dialogs}

      <footer className={styles.copyright}>
        (c) 2026 Yasuhiro Ohnaka - All rights reserved
      </footer>
    </main >
  );
}
