"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { speak, speakQueue, unlockSpeech, cancelSpeech } from "@/utils/speak";
import { playBuzz, playChime, unlockAudio } from "@/utils/sound";

import styles from "./page.module.css";

type Card = {
    id: string;
    sentences: string[];
    sentences_zh?: string[];
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
        surprise: "Surprise",
        survivalMode: "Survival Mode",
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
    },
    ja: {
        loading: "準備中...",
        cards: "残り",
        score: "得点",
        streak: "連続正解",
        mode: "モード",
        flash: "フラッシュ",
        karuta: "かるた",
        choices: "選択肢",
        autoSpeak: "自動読み上げ",
        on: "オン",
        off: "オフ",
        deck: "枚数",
        surprise: "サプライズ",
        survivalMode: "サバイバル",
        flashInstruction: "フラッシュ：正しい文を選ぼう",
        chooseOne: "1つ選ぼう",
        target: "探してね",
        speak: "聞く",
        skip: "スキップ",
        gameCleared: "クリア！最初に戻るよ",
        uiLang: "表示言語",
        english: "英語",
        chinese: "中国語",
        japanese: "日本語",
        appTitle: "クイズメーカー",
        voiceMode: "音声入力",
        listening: "聞いてるよ...",
        sayTheSentence: "文を言ってね！",
        text: "テキスト",
        contentLang: "内容言語",
        contentEn: "英語",
        contentZh: "中国語",
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
        flashInstruction: "闪卡：选择正确的句子",
        chooseOne: "选择一个",
        target: "目标",
        speak: "朗读",
        skip: "跳过",
        gameCleared: "通关！重新开始...",
        uiLang: "界面语言",
        english: "英语",
        chinese: "中文",
        japanese: "日语",
        appTitle: "测验制作器",
        voiceMode: "语音",
        listening: "正在听...",
        sayTheSentence: "请说句子！",
        text: "文本",
        contentLang: "内容语言",
        contentEn: "英语",
        contentZh: "中文",
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

export default function Page() {
    const [cards, setCards] = useState<Card[]>([]);
    const [mode, setMode] = useState<Mode>("flash");
    const [uiLang, setUiLang] = useState<UiLang>("en");
    const [choiceCount, setChoiceCount] = useState<number>(4);
    const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
    const [visibleSentenceCount, setVisibleSentenceCount] = useState<number>(0);
    const [showText, setShowText] = useState<boolean>(true);

    const [index, setIndex] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);
    const [feedback, setFeedback] = useState<{ value: string; isCorrect: boolean } | null>(null);

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

    const t = translations[uiLang];

    // データ読み込み
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/data/quiz_data.json", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to fetch data");
                const data = await res.json();

                // Validate and normalize
                const arr = Array.isArray(data) ? data : [];
                const normalized: Card[] = arr.map((x: any) => ({
                    id: x.id,
                    image: x.image,
                    sentences: Array.isArray(x.sentences) ? x.sentences : [x.sentence || ""],
                    sentences_zh: Array.isArray(x.sentences_zh) ? x.sentences_zh : undefined,
                })).filter(c => c.image && c.sentences.length > 0);

                setCards(normalized);
                setRemainingCards(normalized);
                setIndex(0);
                setScore(0);
                setStreak(0);
            } catch (e) {
                console.error(e);
                setCards([]);
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
    const activePool = isSurvival ? remainingCards : cards;
    const current = activePool[index];

    // Helper to get text (content-language aware)
    const getSentences = (c: Card) =>
        contentLang === "zh" && c.sentences_zh ? c.sentences_zh : c.sentences;
    const getTargetText = (c: Card) => { const s = getSentences(c); return s[2] || s[0]; };
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
        const total = cards.length;
        if (deckSize === "all") return total;
        return Math.min(Number(deckSize), total);
    }, [mode, deckSize, cards.length, choiceCount, isSurvival, activePool.length]);

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
                const pool = cards.filter((c) => c.id !== current.id);
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
                const pool = cards.filter((c) => c.id !== current.id);
                const n = Math.max(2, effectiveN);
                const others = shuffle(pool).slice(0, n - 1);
                return shuffle([current, ...others]).map((c) => getTargetText(c));
            }
        }
    }, [cards, current, mode, choiceCount, karutaChoiceCount, activePool, isSurvival, survivalChoices, contentLang]);

    // AI Logic for VS Mode
    const onSpeakComplete = useCallback(() => {
        if (isVsMode && current) {
            let delay = 3000;
            if (aiLevel === "easy") delay = 5000 + Math.random() * 3000;
            if (aiLevel === "normal") delay = 3000 + Math.random() * 2000;
            if (aiLevel === "hard") delay = 1500 + Math.random() * 1000;

            if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
            aiTimeoutRef.current = setTimeout(() => {
                handleCorrectAnswer(false, "ai");
            }, delay);
        }
    }, [isVsMode, current, aiLevel]);

    const handleSpeak = useCallback((callback?: () => void) => {
        if (!current) return;
        setVisibleSentenceCount(0);
        const lang = contentLang === "zh" ? "zh-CN" : "en-US";
        const sentences = getSentences(current);

        if (mode === "flash") {
            const target = getTargetText(current);
            speakQueue([target], 1200, lang, callback);
        } else {
            speakQueue(sentences, 1200, lang, callback, (idx) => {
                setVisibleSentenceCount(idx + 1);
            });
        }
    }, [current, mode, contentLang]);

    useEffect(() => {
        if (!autoSpeak || !current || gameState !== "playing") return;
        const timer = setTimeout(() => {
            handleSpeak(onSpeakComplete);
        }, 500);
        return () => clearTimeout(timer);
    }, [current, autoSpeak, mode, handleSpeak, onSpeakComplete, gameState]);

    useEffect(() => {
        if (gameState !== "countdown") return;
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            const timer = setTimeout(() => {
                setGameState("playing");
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [gameState, countdown]);

    const startGame = () => {
        unlockAudio();
        unlockSpeech();
        setCountdown(3);
        setGameState("countdown");
    };

    const togglePause = () => {
        if (gameState === "playing") {
            setGameState("paused");
            cancelSpeech();
            if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
        } else if (gameState === "paused") {
            setGameState("playing");
        }
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
                    let msg = finalPlayerScore > finalAiScore ? "YOU WIN!" : finalPlayerScore < finalAiScore ? "YOU LOSE!" : "DRAW!";
                    playChime();
                    alert(`${msg}\nPlayer: ${finalPlayerScore} - AI: ${finalAiScore}`);
                } else {
                    playChime();
                    alert(t.gameCleared);
                }
                // Reset
                const targetCount = deckSize === "all" ? cards.length : Number(deckSize);
                setRemainingCards(shuffle(cards).slice(0, targetCount));
                setScore(0);
                setAiScore(0);
                setStreak(0);
                setIndex(0);
                setGameState("idle");
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

    if (!current) {
        return (
            <main className={styles.container}>
                <h1 className={styles.header}>{t.appTitle}</h1>
                <p style={{ marginTop: 12 }}>{t.loading}</p>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <h1 className={styles.header}>{t.appTitle}</h1>

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
            </div>

            <div className={styles.controls}>
                <div className={styles.controlGroup}>
                    <button onClick={toggleUiLang} className={styles.button} title={t.uiLang}>
                        {t.uiLang}: {getUiLangLabel()}
                    </button>
                    <button
                        onClick={toggleContentLang}
                        className={`${styles.button} ${contentLang === "zh" ? styles.buttonActive : ""}`}
                        title={t.contentLang}
                    >
                        {t.contentLang}: {contentLang === "en" ? t.contentEn : t.contentZh}
                    </button>
                </div>
                <div className={styles.controlGroup}>
                    <div>{t.mode}</div>
                    <button onClick={() => setMode("flash")} className={`${styles.button} ${mode === "flash" ? styles.buttonActive : ""}`}>
                        {t.flash}
                    </button>
                    <button onClick={() => setMode("karuta")} className={`${styles.button} ${mode === "karuta" ? styles.buttonActive : ""}`}>
                        {t.karuta}
                    </button>
                    {mode === "flash" && (
                        <button
                            onClick={() => {
                                const next = !voiceMode;
                                setVoiceMode(next);
                                setShowText(!next); // Hide text if voice ON
                            }}
                            className={`${styles.button} ${voiceMode ? styles.buttonActive : ""}`}
                            title={t.voiceMode}
                        >
                            🎤
                        </button>
                    )}
                </div>

                <div className={styles.controlGroup}>
                    <div style={{ opacity: 0.7 }}>|</div>
                    <button
                        onClick={() => setAutoSpeak((v) => !v)}
                        className={`${styles.button} ${autoSpeak ? styles.buttonActive : ""}`}
                    >
                        {t.autoSpeak}: {autoSpeak ? t.on : t.off}
                    </button>
                </div>


                <div className={styles.controlGroup}>
                    {gameState === "idle" && (
                        <button
                            onClick={startGame}
                            className={`${styles.button} ${styles.buttonActive}`}
                            style={{ background: "#ff7043", borderColor: "#f4511e" }}
                        >
                            START
                        </button>
                    )}
                    {gameState === "playing" && (
                        <button onClick={togglePause} className={styles.button}>
                            ⏸ PAUSE
                        </button>
                    )}
                    {gameState === "paused" && (
                        <button
                            onClick={togglePause}
                            className={`${styles.button} ${styles.buttonActive}`}
                            style={{ background: "#42a5f5", borderColor: "#1e88e5" }}
                        >
                            ▶ RESUME
                        </button>
                    )}

                    <div style={{ opacity: 0.7 }}>|</div>

                    <div className={styles.controlGroup}>
                        <span style={{ fontSize: 14 }}>{t.deck}:</span>
                        <select
                            value={deckSize}
                            onChange={(e) => setDeckSize(e.target.value === "all" ? "all" : Number(e.target.value))}
                            className={styles.select}
                            disabled={isSurvival}
                        >
                            {[5, 10, 15, 20].filter(n => n <= cards.length).map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                            <option value="all">All ({cards.length})</option>
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            if (isVsMode) return;
                            setIsSurvival(v => !v);
                            setRemainingCards(cards);
                            setScore(0);
                            setGameState("idle");
                        }}
                        className={`${styles.button} ${isSurvival ? styles.buttonSurvival : ""}`}
                    >
                        {t.survivalMode}: {isSurvival ? t.on : t.off}
                    </button>
                </div>

            </div>

            <div className={styles.gameArea}>
                {mode === "flash" ? (
                    <div className={styles.flashGrid}>
                        <div>
                            <div style={{ marginBottom: 10, opacity: 0.8 }}>{t.flashInstruction}</div>
                            <div
                                className={styles.flashImageContainer}
                                onClick={() => {
                                    unlockAudio();
                                    handleSpeak();
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={current.image} alt="card" className={styles.flashImage} />
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
                                        {isListening ? `🔴 ${t.listening}` : "🎤 Speak"}
                                    </button>
                                    {spokenText && (
                                        <div className={styles.spokenResult} style={{ borderColor: feedback?.isCorrect ? "green" : "red" }}>
                                            &quot;{spokenText}&quot;
                                        </div>
                                    )}
                                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                                        <button onClick={() => handleSpeak()} className={styles.button}>🔊 {t.speak}</button>
                                        <button onClick={nextCard} className={styles.button}>{t.skip}</button>
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
                                <button onClick={() => handleSpeak()} className={styles.button} title={t.speak}>
                                    🔊 {t.speak}
                                </button>
                                <button onClick={nextCard} className={styles.button}>
                                    {t.skip}
                                </button>
                            </div>
                        </div>

                        <div className={styles.karutaGrid} style={{ "--card-count": choices.length } as React.CSSProperties}>
                            {choices.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => judgeKaruta(String(img))}
                                    className={styles.karutaCard}
                                    style={{
                                        border: feedback?.value === String(img) ? `2px solid ${feedback.isCorrect ? "green" : "red"}` : "1px solid #222",
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={String(img)} alt={`choice-${i}`} className={styles.karutaImage} />
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
            </div>
            <footer className={styles.copyright}>
                © 2026 Yasuhiro Ohnaka — All rights reserved
            </footer>
        </main >
    );
}
