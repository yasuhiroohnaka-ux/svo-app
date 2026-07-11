"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { speak, speakQueue, unlockSpeech, cancelSpeech } from "@/utils/speak";
import { playBuzz, playChime, unlockAudio } from "@/utils/sound";
import { getRanking, saveRanking, clearRanking, formatTime, type RankEntry } from "@/utils/ranking";
import BootDebugOverlay from "@/app/components/BootDebugOverlay";
import { hasFatalFeatureGap, runFeatureCheck, type BootStep } from "@/utils/bootDiagnostics";

import styles from "./page.module.css";

type Card = {
    id: string;
    deck?: string;
    sentences: string[];
    sentences_zh?: string[];
    target?: string;
    target_zh?: string;
    image: string;
};

type ContentLang = "en" | "zh";

type Mode = "flash" | "karuta";
type UiLang = "en" | "ja" | "zh";

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
        deckSize: "Cards",
        allDecks: "All Sets",
        surprise: "Surprise",
        survivalMode: "Time Trial",
        flashInstruction: "flash: pick the correct",
        chooseOne: "choose one",
        target: "target",
        speak: "speak",
        skip: "skip",
        gameCleared: "Game Cleared! Restarting...",
        uiLang: "UI Language",
        english: "English",
        chinese: "Chinese",
        japanese: "Japanese",
        appTitle: "Quiz Maker",
        voiceMode: "voice",
        listening: "Listening...",
        sayTheSentence: "Say the sentences!",
        text: "text",
        contentLang: "Content",
        contentEn: "English",
        contentZh: "Chinese",
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
        vsAi: "VS AI",
        easy: "Easy",
        normal: "Normal",
        hard: "Hard",
        youWin: "YOU WIN!",
        youLose: "YOU LOSE!",
        draw: "DRAW!",
    },
    ja: {
        loading: "準備中...",
        cards: "カード",
        score: "スコア",
        streak: "連続正解",
        mode: "モード",
        flash: "フラッシュ",
        karuta: "かるた",
        choices: "選択肢",
        autoSpeak: "自動読み上げ",
        on: "オン",
        off: "オフ",
        deck: "デッキ",
        deckSize: "枚数",
        allDecks: "すべて",
        surprise: "サプライズ",
        survivalMode: "タイムトライアル",
        flashInstruction: "フラッシュ: 正しい答えを選ぶ",
        chooseOne: "1つ選ぶ",
        target: "ターゲット",
        speak: "読み上げ",
        skip: "スキップ",
        gameCleared: "ゲームクリア！再スタートします...",
        uiLang: "UI言語",
        english: "英語",
        chinese: "中国語",
        japanese: "日本語",
        appTitle: "クイズメーカー",
        voiceMode: "音声",
        listening: "聞き取り中...",
        sayTheSentence: "文章を言ってみよう！",
        text: "テキスト",
        contentLang: "コンテンツ",
        contentEn: "英語",
        contentZh: "中国語",
        timeTrial: "タイムトライアル",
        timer: "タイマー",
        ranking: "ランキング",
        rankingTitle: "タイムトライアル ランキング",
        enterName: "名前を入力してください:",
        clearRanking: "ランキングをクリア",
        close: "閉じる",
        rank: "順位",
        name: "名前",
        time: "時間",
        date: "日付",
        noRecords: "記録はまだありません！",
        newRecord: "新記録！",
        yourTime: "あなたのタイム",
        vsAi: "VS AI",
        easy: "かんたん",
        normal: "ふつう",
        hard: "むずかしい",
        youWin: "あなたの勝ち！",
        youLose: "あなたの負け...",
        draw: "引き分け",
    },
    zh: {
        loading: "准备中...",
        cards: "卡片",
        score: "分数",
        streak: "连胜",
        mode: "模式",
        flash: "闪卡",
        karuta: "歌牌",
        choices: "选项",
        autoSpeak: "自动朗读",
        on: "开",
        off: "关",
        deck: "牌组",
        deckSize: "张数",
        allDecks: "全部",
        surprise: "惊喜",
        survivalMode: "计时挑战",
        flashInstruction: "闪卡：选择正确答案",
        chooseOne: "选择一个",
        target: "目标",
        speak: "朗读",
        skip: "跳过",
        gameCleared: "通关！正在重新开始...",
        uiLang: "界面语言",
        english: "英语",
        chinese: "中文",
        japanese: "日语",
        appTitle: "测验制作器",
        voiceMode: "语音",
        listening: "正在聆听...",
        sayTheSentence: "说出句子！",
        text: "文本",
        contentLang: "内容",
        contentEn: "英语",
        contentZh: "中文",
        timeTrial: "计时挑战",
        timer: "计时器",
        ranking: "排行榜",
        rankingTitle: "计时挑战 排行榜",
        enterName: "请输入姓名：",
        clearRanking: "清空排行榜",
        close: "关闭",
        rank: "排名",
        name: "姓名",
        time: "时间",
        date: "日期",
        noRecords: "还没有记录！",
        newRecord: "新纪录！",
        yourTime: "你的时间",
        vsAi: "对战 AI",
        easy: "简单",
        normal: "普通",
        hard: "困难",
        youWin: "你赢了！",
        youLose: "你输了...",
        draw: "平局",
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

function getDeckLabel(deckId: string, uiLang: UiLang) {
    const match = deckId.match(/^set(\d+)$/);
    if (!match) return deckId;
    if (uiLang === "ja") return `セット${match[1]}`;
    if (uiLang === "zh") return `第${match[1]}组`;
    return `Set ${match[1]}`;
}

export default function Page() {
    const [bootStep, setBootStep] = useState<BootStep>("boot");
    const [fallbackMode, setFallbackMode] = useState(false);
    const [debugEnabled, setDebugEnabled] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setDebugEnabled(params.get("debug") === "1");

        const features = runFeatureCheck();
        if (hasFatalFeatureGap(features)) {
            setFallbackMode(true);
            setBootStep("error");
        }
    }, []);

    const [cards, setCards] = useState<Card[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<string>("set1");
    const [mode, setMode] = useState<Mode>("flash");
    const [uiLang, setUiLang] = useState<UiLang>("ja");
    const [choiceCount, setChoiceCount] = useState<number>(4);
    const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
    const [visibleSentenceCount, setVisibleSentenceCount] = useState<number>(0);
    const [showText, setShowText] = useState<boolean>(true);
    const [showAdvancedControls, setShowAdvancedControls] = useState(false);

    const [index, setIndex] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);
    const [feedback, setFeedback] = useState<{ value: string; isCorrect: boolean } | null>(null);

    const [error, setError] = useState<string | null>(null);

    // Survival Mode State
    const [isSurvival, setIsSurvival] = useState<boolean>(false);
    const [remainingCards, setRemainingCards] = useState<Card[]>([]);
    const [deckSize, setDeckSize] = useState<number | "all">("all");

    // VS Mode State (Simplified: removed complexity for now, can re-enable)
    const [isVsMode, setIsVsMode] = useState(false);
    const [aiLevel, setAiLevel] = useState<"easy" | "normal" | "hard">("normal");
    const [aiScore, setAiScore] = useState(0);

    // Game Flow State
    type GameState = "idle" | "countdown" | "playing" | "paused" | "finished";
    const [gameState, setGameState] = useState<GameState>("idle");
    const [countdown, setCountdown] = useState<number>(3);

    const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);
    const [voiceMode, setVoiceMode] = useState<boolean>(false);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [spokenText, setSpokenText] = useState<string>("");
    const [contentLang, setContentLang] = useState<ContentLang>("en");

    // Time Trial timer
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const timerStartRef = useRef<number>(0);

    // Ranking state
    const [showRanking, setShowRanking] = useState(false);
    const [rankingData, setRankingData] = useState<RankEntry[]>([]);
    const [pendingEntry, setPendingEntry] = useState<RankEntry | null>(null);
    const [playerName, setPlayerName] = useState("");
    const [nameInputVisible, setNameInputVisible] = useState(false);
    const [isNewRecord, setIsNewRecord] = useState(false);

    const APP_KEY = "quiz";

    const t = translations[uiLang];

    const deckOptions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const card of cards) {
            const deck = card.deck || "set1";
            counts.set(deck, (counts.get(deck) || 0) + 1);
        }
        return Array.from(counts.entries())
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }, [cards]);

    const deckCards = useMemo(() => {
        if (selectedDeck === "all") return cards;
        return cards.filter((card) => (card.deck || "set1") === selectedDeck);
    }, [cards, selectedDeck]);

    useEffect(() => {
        if (cards.length === 0) return;
        if (selectedDeck !== "all" && deckCards.length === 0 && deckOptions.length > 0) {
            setSelectedDeck(deckOptions[0].id);
        }
    }, [cards.length, selectedDeck, deckCards.length, deckOptions]);

    useEffect(() => {
        if (deckCards.length === 0) return;
        cancelSpeech();
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setRemainingCards(deckCards);
        setDeckSize((currentSize) => {
            if (currentSize !== "all" && Number(currentSize) > deckCards.length) return "all";
            return currentSize;
        });
        setScore(0);
        setAiScore(0);
        setStreak(0);
        setIndex(0);
        setFeedback(null);
        setSpokenText("");
        setElapsedTime(0);
        setGameState("idle");
    }, [deckCards]);

    // データ読み込み
    useEffect(() => {
        setBootStep("fetch");
        (async () => {
            try {
                // cache: "no-store" might fail on some older Android WebViews / browsers?
                // Using timestamp query param instead for cache busting compatibility.
                const res = await fetch(`/data/quiz_data.json?t=${Date.now()}`);
                if (!res.ok) throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
                const data = await res.json();

                // Validate and normalize
                const arr = Array.isArray(data) ? data : [];
                const normalized: Card[] = arr.map((x: any, i: number) => ({
                    id: x.id,
                    deck: typeof x.deck === "string" ? x.deck : `set${Math.floor(i / 16) + 1}`,
                    image: x.image,
                    sentences: Array.isArray(x.sentences) ? x.sentences : [x.sentence || ""],
                    sentences_zh: Array.isArray(x.sentences_zh) ? x.sentences_zh : undefined,
                    target: typeof x.target === "string" ? x.target : undefined,
                    target_zh: typeof x.target_zh === "string" ? x.target_zh : undefined,
                })).filter(c => c.image && c.sentences.length > 0);

                if (normalized.length === 0) {
                    throw new Error("No valid cards found in data.");
                }

                setCards(normalized);
                setRemainingCards(normalized);
                setIndex(0);
                setScore(0);
                setStreak(0);
                setBootStep("ready");
            } catch (e: any) {
                console.error(e);
                setError(e.message || "Unknown error occurred during loading.");
                setCards([]);
                setBootStep("error");
            }
        })();
    }, []);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            cancelSpeech();
        };
    }, []);

    // Determine current pool based on mode
    const activePool = isSurvival ? remainingCards : deckCards;
    const current = activePool[index];

    // Helper to get text (content-language aware)
    const getSentences = (c: Card) =>
        contentLang === "zh" && c.sentences_zh ? c.sentences_zh : c.sentences;
    const getTargetText = (c: Card) => {
        if (contentLang === "zh" && c.target_zh) return c.target_zh;
        if (c.target) return c.target;
        const s = getSentences(c);
        return s[2] || s[0];
    };
    const getFullText = (c: Card) => getSentences(c).join(" ");

    const toggleUiLang = () => {
        setUiLang((prev) => {
            if (prev === "en") return "ja";
            if (prev === "ja") return "zh";
            return "en";
        });
    };

    const getUiLangLabel = () => {
        if (uiLang === "en") return t.english;
        if (uiLang === "ja") return t.japanese;
        return t.chinese;
    };

    const toggleContentLang = () => setContentLang(prev => prev === "en" ? "zh" : "en");

    useEffect(() => {
        if (index >= activePool.length && activePool.length > 0) {
            setIndex(0);
        }
    }, [activePool.length, index]);

    useEffect(() => {
        setVisibleSentenceCount(0);
    }, [current]);

    const karutaChoiceCount = useMemo(() => {
        if (mode !== "karuta") return choiceCount;
        if (isSurvival) return activePool.length;
        const total = deckCards.length;
        if (deckSize === "all") return total;
        return Math.min(Number(deckSize), total);
    }, [mode, deckSize, deckCards.length, choiceCount, isSurvival, activePool.length]);

    function nextCard() {
        if (activePool.length === 0) return;

        if (!isSurvival) {
            setIndex((i) => (i + 1) % activePool.length);
        } else {
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

    function judgeFlash(selectedText: string) {
        if (!current) return;
        unlockAudio();
        unlockSpeech();

        // Check against target text (3rd sentence)
        const correctText = getTargetText(current);
        const ok = selectedText === correctText;

        if (ok) {
            setFeedback({ value: selectedText, isCorrect: true });
            playChime();
            setTimeout(() => handleCorrectAnswer(), 1000);
        } else {
            setStreak(0);
            setFeedback({ value: selectedText, isCorrect: false });
            playBuzz();
        }
    }

    // Stable shuffled pool for survival mode
    const survivalChoices = useMemo(() => {
        if (!isSurvival) return [];
        return shuffle(activePool).map((c) => c.image);
    }, [activePool, isSurvival]);

    const choices = useMemo(() => {
        if (!current || activePool.length === 0) return [];

        if (mode === "karuta") {
            if (isSurvival) {
                return survivalChoices;
            } else {
                const pool = deckCards.filter((c) => c.id !== current.id);
                const n = Math.max(2, karutaChoiceCount);
                const others = shuffle(pool).slice(0, n - 1);
                return shuffle([current, ...others]).map((c) => c.image);
            }
        } else {
            // Flash mode choices: Target text (3rd sentence)
            const effectiveN = Math.min(5, choiceCount);
            if (isSurvival) {
                const pool = activePool.filter((c) => c.id !== current.id);
                const takeN = Math.min(pool.length, effectiveN - 1);
                const others = shuffle(pool).slice(0, takeN);
                return shuffle([current, ...others]).map((c) => getTargetText(c));
            } else {
                const pool = deckCards.filter((c) => c.id !== current.id);
                const n = Math.max(2, effectiveN);
                const others = shuffle(pool).slice(0, n - 1);
                return shuffle([current, ...others]).map((c) => getTargetText(c));
            }
        }
    }, [deckCards, current, mode, choiceCount, karutaChoiceCount, activePool, isSurvival, survivalChoices, contentLang]);

    // AI Logic for VS Mode (Updated to hook into speech progress)
    const checkAiTrigger = useCallback((idx: number) => {
        if (!isVsMode || !current || gameState !== "playing") return;

        // Clear existing timeout
        if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

        const totalSentences = getSentences(current).length;

        // AI Strategy
        if (aiLevel === "hard") {
            // Hard: Wait for 1st sentence to finish (trigger at start of 2nd sentence or if only 1 sentence)
            // If idx 1 starts, it means S1 finished.
            if (idx === 1 || (totalSentences === 1 && idx === 0)) {
                // Fast reaction after reading S1
                const delay = 400 + Math.random() * 800; // 0.4s - 1.2s delay
                aiTimeoutRef.current = setTimeout(() => {
                    handleCorrectAnswer(false, "ai");
                }, delay);
            }
        } else {
            // Normal/Easy: Trigger at start (idx=0) with long delay
            if (idx === 0) {
                let delay = 3000;
                if (aiLevel === "easy") delay = 5000 + Math.random() * 3000;
                if (aiLevel === "normal") delay = 3500 + Math.random() * 2000;

                aiTimeoutRef.current = setTimeout(() => {
                    handleCorrectAnswer(false, "ai");
                }, delay);
            }
        }
    }, [isVsMode, current, aiLevel, gameState]);

    const handleSpeak = useCallback((callback?: () => void, progressCallback?: (idx: number) => void) => {
        if (!current) return;
        setVisibleSentenceCount(0);
        const lang = contentLang === "zh" ? "zh-CN" : "en-US";
        const sentences = getSentences(current);

        // Progress wrapper
        const onProgress = (idx: number) => {
            setVisibleSentenceCount(idx + 1);
            if (progressCallback) progressCallback(idx);
        };

        if (mode === "flash") {
            if (isSurvival) {
                // Time Trial: Speak all sentences with minimal interval
                speakQueue(sentences, 200, lang, callback, onProgress);
            } else {
                const target = getTargetText(current);
                speakQueue([target], 1200, lang, callback);
            }
        } else {
            speakQueue(sentences, 1200, lang, callback, onProgress);
        }
    }, [current, mode, contentLang, isSurvival]);

    useEffect(() => {
        if (!autoSpeak || !current || gameState !== "playing") return;
        const timer = setTimeout(() => {
            handleSpeak(undefined, checkAiTrigger);
        }, 500);
        return () => clearTimeout(timer);
    }, [current, autoSpeak, mode, handleSpeak, checkAiTrigger, gameState]);

    useEffect(() => {
        if (gameState !== "countdown") return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            const timer = setTimeout(() => {
                setGameState("playing");
                if (isSurvival) {
                    startTimer();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState, countdown]);

    // Timer Effect
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, []);

    const startGame = () => {
        unlockAudio();
        unlockSpeech();
        setCountdown(3);
        setGameState("countdown");

        // Reset Timer
        setElapsedTime(0);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };

    const startTimer = () => {
        const startTime = Date.now();
        timerStartRef.current = startTime;
        setElapsedTime(0);

        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
            const now = Date.now();
            setElapsedTime((now - startTime) / 1000);
        }, 100);
    };

    const togglePause = () => {
        if (gameState === "playing") {
            setGameState("paused");
            cancelSpeech();
            if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
            // Pause Timer
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        } else if (gameState === "paused") {
            setGameState("playing");
            // Resume Timer (simple restart)
            const now = Date.now();
            timerStartRef.current = now - (elapsedTime * 1000);
            timerIntervalRef.current = setInterval(() => {
                const n = Date.now();
                setElapsedTime((n - timerStartRef.current) / 1000);
            }, 100);
        }
    };

    const toggleVsMode = () => {
        setIsVsMode((prev) => {
            const next = !prev;
            if (next) {
                // Determine deck size (if 'all' or specific)
                const targetCount = deckSize === "all" ? deckCards.length : Number(deckSize);
                const shuffled = shuffle(deckCards);
                setRemainingCards(shuffled.slice(0, targetCount));
                setScore(0);
                setAiScore(0);
                setStreak(0);
                setIndex(0);
                setGameState("idle");
                setIsSurvival(true); // VS implies Survival (limited deck)
            } else {
                // Turning OFF VS Mode
                resetGame();
            }
            return next;
        });
    };

    const resetGame = () => {
        const targetCount = deckSize === "all" ? deckCards.length : Number(deckSize);
        setRemainingCards(shuffle(deckCards).slice(0, targetCount));
        setScore(0);
        setAiScore(0);
        setStreak(0);
        setIndex(0);
        setGameState("idle");
        setElapsedTime(0);
    };

    const handleRankingRegister = () => {
        if (!pendingEntry) return;
        const entry = { ...pendingEntry, name: playerName || "Anonymous" };
        saveRanking(APP_KEY, entry);
        setNameInputVisible(false);
        setRankingData(getRanking(APP_KEY));
        setShowRanking(true);
        resetGame();
    };

    // Simplified Voice Recognition (Checks contains)

    // Simplified Voice Recognition (Loose check)
    function judgeVoice(spoken: string) {
        if (!current) return;

        // Target text depends on mode
        let correctText = "";
        if (mode === "flash") {
            correctText = getTargetText(current).toLowerCase().replace(/[^a-z0-9 ]/g, "");
        } else {
            correctText = getFullText(current).toLowerCase().replace(/[^a-z0-9 ]/g, "");
        }

        const spokenClean = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, "");
        const stopWords = ["the", "a", "an", "is", "are", "am", "be", "was", "were"];
        const filterWords = (text: string) =>
            text.split(/\s+/).filter(w => w.length > 0 && !stopWords.includes(w));

        const correctWords = filterWords(correctText);
        const spokenWords = filterWords(spokenClean);

        // Critical Check: Prepositions and Negations change meaning significantly.
        // If these exist in target, they MUST exist in spoken result.
        const criticalWords = ["on", "in", "under", "by", "at", "to", "from", "with", "next", "between", "not", "no", "never"];
        const missingCritical = correctWords.some(w => criticalWords.includes(w) && !spokenWords.includes(w));

        if (missingCritical) {
            setStreak(0);
            setFeedback({ value: spoken, isCorrect: false });
            playBuzz();
            return;
        }

        let matchCount = 0;
        correctWords.forEach(w => {
            if (spokenWords.includes(w)) matchCount++;
        });

        // Loose threshold: 50% match
        const baseLength = correctWords.length > 0 ? correctWords.length : 1;
        const ok = (matchCount / baseLength >= 0.5);

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

    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        if (recognitionRef.current) recognitionRef.current.abort();

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => { setIsListening(true); setSpokenText(""); };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSpokenText(transcript);
            setIsListening(false);
            judgeVoice(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
    }, [current, mode]); // Added mode dependency



    function handleCorrectAnswer(keepCard = false, winner: "player" | "ai" = "player") {
        if (!current) return;
        cancelSpeech(); // Stop any reading immediately

        if (winner === "player") {
            setScore((s) => s + 1);
            setStreak((s) => s + 1);
        } else {
            setAiScore((s) => s + 1);
            setStreak(0);
        }

        if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current);
            aiTimeoutRef.current = null;
        }

        if (mode === "karuta" && isSurvival && !keepCard) {
            const newPool = remainingCards.filter((c) => c.id !== current.id);
            setRemainingCards(newPool);

            if (newPool.length === 0) {
                if (isVsMode) {
                    const finalPlayerScore = winner === "player" ? score + 1 : score;
                    const finalAiScore = winner === "ai" ? aiScore + 1 : aiScore;
                    let msg = finalPlayerScore > finalAiScore ? t.youWin : finalPlayerScore < finalAiScore ? t.youLose : t.draw;
                    playChime();
                    alert(`${msg}\nPlayer: ${finalPlayerScore} - AI: ${finalAiScore}`);
                    resetGame();
                } else {
                    // Time Trial Clear
                    playChime();

                    // Stop Timer
                    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

                    // Show Ranking Input
                    const cardCount = deckSize === "all" ? deckCards.length : Number(deckSize);
                    setPendingEntry({
                        name: "",
                        time: elapsedTime,
                        date: new Date().toISOString(),
                        cards: cardCount
                    });
                    setNameInputVisible(true);
                }
            } else {
                setIndex(Math.floor(Math.random() * newPool.length));
            }
        } else if (mode === "karuta" && isSurvival && keepCard) {
            setIndex(Math.floor(Math.random() * remainingCards.length));
        } else {
            nextCard();
        }
    }

    function judgeKaruta(selectedImage: string) {
        if (!current) return;
        unlockAudio();
        unlockSpeech();

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

    if (fallbackMode) {
        return (
            <main className={styles.container} style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", textAlign: "center", gap: 12 }}>
                <h1 style={{ margin: 0 }}>Lightweight Mode</h1>
                <p style={{ margin: 0 }}>Some features are not available on this device. Starting in lightweight mode.</p>
                <p style={{ margin: 0, color: "#666" }}>Please open this app on a newer browser for full features.</p>
                <button onClick={() => (window.location.href = "/")} style={{ minWidth: 44, minHeight: 44, padding: "10px 20px", borderRadius: 20, border: "none", background: "#333", color: "white", cursor: "pointer" }}>
                    Back to Portal
                </button>
                <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={null} />
            </main>
        );
    }

    if (error) {
        return (
            <main className={styles.container}>
                <h1 className={styles.header}>{t.appTitle}</h1>
                <p style={{ marginTop: 12, color: "red", fontWeight: "bold" }}>Error: {error}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{ minWidth: 44, minHeight: 44, marginTop: 16, padding: "8px 16px", background: "#333", color: "#fff", borderRadius: 4 }}
                >
                    Reload
                </button>
                <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={null} />
            </main>
        );
    }

    if (cards.length === 0) {
        return (
            <main className={styles.container} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5', color: '#333', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'normal' }}>{t.loading || "Preparing cards..."}</h1>
                <p style={{ marginTop: 8, color: "#666" }}>step: {bootStep}</p>
                <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={null} />
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <h1 className={styles.header}>{t.appTitle}</h1>

            {/* Score & Status */}
            <div className={styles.statusRow}>
                {t.cards}: {isSurvival ? activePool.length : deckCards.length}
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
                {isSurvival && (
                    <div className={styles.timer}>
                        {t.timer}: {formatTime(elapsedTime)}
                    </div>
                )}
            </div>

            <div className={styles.controls}>
                <div className={styles.controlGroup}>
                    <button onClick={toggleUiLang} className={`${styles.button} ${styles.tapTarget}`} title={t.uiLang}>
                        {t.uiLang}: {getUiLangLabel()}
                    </button>
                    <button
                        onClick={toggleContentLang}
                        className={`${styles.button} ${styles.tapTarget} ${contentLang === "zh" ? styles.buttonActive : ""}`}
                        title={t.contentLang}
                    >
                        {t.contentLang}: {contentLang === "en" ? t.contentEn : t.contentZh}
                    </button>
                </div>
                <div className={styles.controlGroup}>
                    <span style={{ fontSize: 14 }}>{t.deck}:</span>
                    <select
                        value={selectedDeck}
                        onChange={(e) => {
                            setSelectedDeck(e.target.value);
                            setIsSurvival(false);
                            setIsVsMode(false);
                        }}
                        className={styles.select}
                    >
                        {deckOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {getDeckLabel(option.id, uiLang)} ({option.count})
                            </option>
                        ))}
                        <option value="all">{t.allDecks} ({cards.length})</option>
                    </select>
                </div>
                <div className={styles.controlGroup}>
                    <div>{t.mode}</div>
                    <button onClick={() => setMode("flash")} className={`${styles.button} ${styles.tapTarget} ${mode === "flash" ? styles.buttonActive : ""}`}>
                        {t.flash}
                    </button>
                    <button onClick={() => setMode("karuta")} className={`${styles.button} ${styles.tapTarget} ${mode === "karuta" ? styles.buttonActive : ""}`}>
                        {t.karuta}
                    </button>
                    {showAdvancedControls && mode === "flash" && (
                        <button
                            onClick={() => {
                                const next = !voiceMode;
                                setVoiceMode(next);
                                setShowText(!next); // Hide text if voice ON
                            }}
                            className={`${styles.button} ${styles.tapTarget} ${voiceMode ? styles.buttonActive : ""}`}
                            title={t.voiceMode}
                        >
                            🎤
                        </button>
                    )}
                </div>

                <div className={styles.controlGroup}>
                    <button
                        onClick={() => setShowAdvancedControls((v) => !v)}
                        className={`${styles.button} ${styles.tapTarget}`}
                    >
                        {showAdvancedControls ? "詳細を隠す" : "詳細を表示"}
                    </button>
                </div>

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


                <div className={styles.controlGroup}>
                    {gameState === "idle" && (
                        <button
                            onClick={startGame}
                            className={`${styles.button} ${styles.tapTarget} ${styles.buttonActive}`}
                            style={{ background: "#ff9f43" }}
                        >
                            START
                        </button>
                    )}
                    {gameState === "playing" && (
                        <button onClick={togglePause} className={`${styles.button} ${styles.tapTarget}`}>
                            ⏸ PAUSE
                        </button>
                    )}
                    {gameState === "paused" && (
                        <button
                            onClick={togglePause}
                            className={`${styles.button} ${styles.tapTarget} ${styles.buttonActive}`}
                            style={{ background: "#42a5f5", borderColor: "#1e88e5" }}
                        >
                            笆ｶ RESUME
                        </button>
                    )}
                </div>

                {showAdvancedControls && (
                    <>
                        <div className={styles.controlGroup}>
                            <div style={{ opacity: 0.7 }}>|</div>

                            <div className={styles.controlGroup}>
                                <span style={{ fontSize: 14 }}>{t.deckSize}:</span>
                                <select
                                    value={deckSize}
                                    onChange={(e) => setDeckSize(e.target.value === "all" ? "all" : Number(e.target.value))}
                                    className={styles.select}
                                    disabled={isSurvival}
                                >
                                    {[5, 10, 15, 20].filter(n => n <= deckCards.length).map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                    <option value="all">All ({deckCards.length})</option>
                                </select>
                            </div>

                            <button
                                onClick={() => {
                                    if (isVsMode) return;
                                    setIsSurvival(v => !v);
                                    setRemainingCards(deckCards);
                                    setScore(0);
                                    setGameState("idle");
                                }}
                                className={`${styles.button} ${styles.tapTarget} ${isSurvival ? styles.buttonSurvival : ""}`}
                            >
                                {t.survivalMode}: {isSurvival ? t.on : t.off}
                            </button>
                        </div>

                        <div className={styles.controlGroup}>
                            <div style={{ opacity: 0.7 }}>|</div>
                            <button
                                onClick={toggleVsMode}
                                className={`${styles.button} ${styles.tapTarget} ${isVsMode ? styles.buttonActive : ""}`}
                            >
                                {t.vsAi}: {isVsMode ? t.on : t.off}
                            </button>

                            {isVsMode && (
                                <select
                                    value={aiLevel}
                                    onChange={(e) => setAiLevel(e.target.value as any)}
                                    className={styles.select}
                                    style={{ marginLeft: 4 }}
                                >
                                    <option value="easy">{t.easy}</option>
                                    <option value="normal">{t.normal}</option>
                                    <option value="hard">{t.hard}</option>
                                </select>
                            )}
                        </div>
                    </>
                )}

            </div>

            <div className={styles.gameArea}>
                {!current ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <h2>{t.gameCleared}</h2>
                        <button
                            onClick={resetGame}
                            className={`${styles.button} ${styles.tapTarget} ${styles.buttonActive}`}
                            style={{ marginTop: 20 }}
                        >
                            Restart Game
                        </button>
                    </div>
                ) : (
                    <>
                        {mode === "flash" ? (
                            <div className={styles.flashGrid}>
                                <div>
                                    {isSurvival ? (
                                        <div className={styles.survivalText}>
                                            {getSentences(current).map((s, i) => (
                                                <div key={i}>{s}</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ marginBottom: 10, opacity: 0.8 }}>{t.flashInstruction}</div>
                                    )}
                                    <div
                                        className={styles.flashImageContainer}
                                        onClick={() => {
                                            unlockAudio();
                                            handleSpeak();
                                        }}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <Image
                                            src={current.image}
                                            alt="card"
                                            className={styles.flashImage}
                                            width={545}
                                            height={771}
                                            sizes="(max-width: 768px) 90vw, 380px"
                                            priority
                                        />
                                    </div>
                                </div>

                                <div>
                                    {voiceMode ? (
                                        <div className={styles.voiceArea}>
                                            <div style={{ marginBottom: 10, fontWeight: "bold" }}>{t.sayTheSentence}</div>

                                            {/* Hint Toggle */}
                                            <button
                                                onClick={() => setShowText(!showText)}
                                                className={styles.button}
                                                style={{ marginBottom: 10, fontSize: 12, padding: '2px 8px' }}
                                            >
                                                {t.text}: {showText ? "ON (Hint)" : "OFF"}
                                            </button>

                                            {showText && (
                                                <div style={{ marginBottom: 10, fontSize: 14, color: "#666" }}>
                                                    {getTargetText(current)}
                                                </div>
                                            )}

                                            <button onClick={startListening} className={`${styles.voiceButton} ${isListening ? styles.voiceButtonListening : ""}`} disabled={isListening}>
                                                {isListening ? `🎤 ${t.listening}` : "🎤 Speak"}
                                            </button>
                                            {spokenText && (
                                                <div className={styles.spokenResult} style={{ borderColor: feedback?.isCorrect ? "green" : "red" }}>
                                                    &quot;{spokenText}&quot;
                                                </div>
                                            )}
                                            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                            <button onClick={() => handleSpeak()} className={`${styles.button} ${styles.tapTarget}`}>🔊 {t.speak}</button>
                                            <button onClick={nextCard} className={`${styles.button} ${styles.tapTarget}`}>{t.skip}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: 10 }}>{t.chooseOne}</div>
                                            <div className={styles.sentenceList}>
                                                {choices.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => judgeFlash(String(s))}
                                                        className={styles.sentenceButton}
                                                        style={{
                                                            border: feedback?.value === String(s) ? `2px solid ${feedback.isCorrect ? "green" : "red"}` : "1px solid #222",
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
                                <div className={styles.karutaHeader}>
                                    <div className={styles.controlGroup}>
                                        <div style={{ opacity: 0.8 }}>{t.target}:</div>
                                        <button
                                            onClick={() => setShowText(!showText)}
                                            className={styles.button}
                                            style={{ marginLeft: 8, padding: '2px 8px', fontSize: 12 }}
                                        >
                                            {t.text}: {showText ? t.on : t.off}
                                        </button>
                                    </div>
                                    <div className={styles.targetSentence} style={{ fontSize: 14, minHeight: '4.5em' }}>
                                        {showText && getSentences(current).slice(0, visibleSentenceCount).map((s, i) => <div key={i}>{s}</div>)}
                                    </div>

                                    <div className={styles.controlGroup}>
                                        <button onClick={() => handleSpeak()} className={`${styles.button} ${styles.tapTarget}`} title={t.speak}>
                                            🔊 {t.speak}
                                        </button>
                                        <button onClick={nextCard} className={`${styles.button} ${styles.tapTarget}`}>
                                            {t.skip}
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className={`${styles.karutaGrid} ${choices.length <= 6 ? styles.gridHuge :
                                        choices.length <= 12 ? styles.gridBig : ""
                                        }`}
                                    style={{ "--card-count": choices.length } as React.CSSProperties}
                                >
                                    {choices.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => judgeKaruta(String(img))}
                                            className={styles.karutaCard}
                                            style={{
                                                border: feedback?.value === String(img) ? `2px solid ${feedback.isCorrect ? "green" : "red"}` : "1px solid #222",
                                            }}
                                        >
                                            <Image
                                                src={String(img)}
                                                alt={`choice-${i}`}
                                                className={styles.karutaImage}
                                                width={545}
                                                height={771}
                                                sizes="(max-width: 480px) 30vw, (max-width: 1024px) 20vw, 180px"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {mode === "karuta" && (gameState === "countdown" || gameState === "paused") && (
                            <div className={styles.overlay}>
                                {gameState === "paused" ? (
                                    <>
                                        <div className={styles.overlayText}>PAUSED</div>
                                        <button onClick={togglePause} className={styles.overlaySubText} style={{ cursor: "pointer", border: "2px solid white" }}>
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
                    </>
                )}
            </div>

            {/* Ranking Name Input Modal */}
            {nameInputVisible && (
                <div className={styles.rankingOverlay}>
                    <div className={styles.rankingModal}>
                        <h2>{t.newRecord}</h2>
                        <p>{t.yourTime}: {pendingEntry && formatTime(pendingEntry.time)}</p>
                        <p>{t.enterName}</p>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className={styles.nameInput}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRankingRegister();
                            }}
                        />
                        <div className={styles.modalButtons}>
                            <button onClick={handleRankingRegister} className={styles.button}>OK</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ranking Display Modal */}
            {showRanking && (
                <div className={styles.rankingOverlay}>
                    <div className={styles.rankingModal}>
                        <h2>{t.rankingTitle}</h2>
                        <table className={styles.rankingTable}>
                            <thead>
                                <tr>
                                    <th>{t.rank}</th>
                                    <th>{t.name}</th>
                                    <th>{t.time}</th>
                                    <th>{t.date}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankingData.map((entry, i) => (
                                    <tr key={i} className={isNewRecord && entry.date === pendingEntry?.date ? styles.newRecordRow : ""}>
                                        <td>{i + 1}</td>
                                        <td>{entry.name}</td>
                                        <td>{formatTime(entry.time)}</td>
                                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {rankingData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: "center" }}>{t.noRecords}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div className={styles.modalButtons}>
                            <button onClick={() => {
                                const confirmed = window.confirm("Clear ranking?");
                                if (confirmed) {
                                    clearRanking(APP_KEY);
                                    setRankingData([]);
                                }
                            }} className={styles.button} style={{ background: "#ff8787" }}>
                                {t.clearRanking}
                            </button>
                            <button onClick={() => setShowRanking(false)} className={styles.button}>
                                {t.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className={styles.copyright}>
                (c) 2026 Yasuhiro Ohnaka - All rights reserved
            </footer>
            <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={null} />
        </main >
    );
}
