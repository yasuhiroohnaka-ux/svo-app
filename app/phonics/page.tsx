"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import {
    DEFAULT_LESSON_TARGET_IDS,
    LESSON_WORDS,
    PHONICS_LEVELS,
    PHONICS_DATA,
    PRIORITY_PHONICS_IDS,
    type LessonWord,
    type Phonic,
} from "./PhonicsData";
import BootDebugOverlay from "@/app/components/BootDebugOverlay";
import HanamaruMark from "@/app/components/HanamaruMark";
import SpeedControl from "@/app/components/SpeedControl";
import { hasFatalFeatureGap, runFeatureCheck, type BootStep } from "@/utils/bootDiagnostics";
import { playBuzz, playChime, unlockAudio } from "@/utils/sound";
import { applySpeechSpeed, unlockSpeech } from "@/utils/speak";

type ViewMode = "setup" | "poster" | "challenge" | "soundQuiz";
type FeedbackKind = "idle" | "correct" | "tryAgain" | "empty";
type CorrectWordsByLevel = Record<string, string[]>;

const LOW_WORD_COUNT_HINT = "ことばが少ないときは、ほかのレベルも 見てみよう。";
const WORD_AUDIO_GUIDE = "きいて、まねして、こえにだしてみよう。";
const CORRECT_WORDS_STORAGE_PREFIX = "phonics.correctWords.";
const AUTO_ADVANCE_STORAGE_KEY = "phonics.autoAdvance";
const LEVEL_4_NEW_SOUND_IDS = ["s", "f", "h"];

const getPhonicById = (id: string): Phonic | undefined => PHONICS_DATA.find((phonic) => phonic.id === id);

const hasLevel4NewSound = (word: LessonWord): boolean => word.phonics.some((id) => LEVEL_4_NEW_SOUND_IDS.includes(id));

const getPreferredWordPool = (levelId: string, words: LessonWord[]): LessonWord[] => {
    if (levelId !== "level-4") return words;

    const level4NewWords = words.filter(hasLevel4NewSound);
    return level4NewWords.length > 0 ? level4NewWords : words;
};

const getLocalDateStamp = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
};

const getCorrectWordsStorageKey = (): string => `${CORRECT_WORDS_STORAGE_PREFIX}${getLocalDateStamp()}`;

const parseCorrectWordsByLevel = (value: string | null): CorrectWordsByLevel => {
    if (!value) return {};

    try {
        const parsed = JSON.parse(value) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

        return Object.fromEntries(
            Object.entries(parsed)
                .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
                .map(([levelId, wordIds]) => [levelId, wordIds.filter((wordId): wordId is string => typeof wordId === "string")]),
        );
    } catch {
        return {};
    }
};

const readCorrectWordsByLevelFromStorage = (): CorrectWordsByLevel => {
    if (typeof window === "undefined") return {};

    try {
        return parseCorrectWordsByLevel(window.localStorage.getItem(getCorrectWordsStorageKey()));
    } catch {
        return {};
    }
};

const pickRandomWord = (words: LessonWord[], usedWordIds: string[]): LessonWord | null => {
    if (words.length === 0) return null;

    const freshWords = words.filter((word) => !usedWordIds.includes(word.id));
    const pool = freshWords.length > 0 ? freshWords : words;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
};

const pickRandomId = (ids: string[], usedIds: string[]): string | null => {
    if (ids.length === 0) return null;

    const freshIds = ids.filter((id) => !usedIds.includes(id));
    const pool = freshIds.length > 0 ? freshIds : ids;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
};

const makeEmptySlots = (word: LessonWord | null): (string | null)[] => (word ? word.phonics.map(() => null) : []);

const FeedbackBadge = ({ kind }: { kind: FeedbackKind }) => {
    if (kind === "correct") {
        return (
            <div className={`${styles.resultBadge} ${styles.hanamaruBadge}`} aria-label="正解">
                <HanamaruMark className={styles.hanamaruStamp} />
            </div>
        );
    }

    if (kind === "tryAgain") {
        return (
            <div className={`${styles.resultBadge} ${styles.questionBadge}`} aria-label="もういちど考えよう">
                <span>?</span>
                <strong>もういちど</strong>
            </div>
        );
    }

    return null;
};

export default function PhonicsPage() {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [bootStep, setBootStep] = useState<BootStep>("boot");
    const [fallbackMode, setFallbackMode] = useState(false);
    const [debugEnabled, setDebugEnabled] = useState(false);
    const [storageError, setStorageError] = useState<string | null>(null);

    const [mode, setMode] = useState<ViewMode>("setup");
    const [selectedLevelId, setSelectedLevelId] = useState(PHONICS_LEVELS[0].id);
    const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_LESSON_TARGET_IDS);
    const [currentWord, setCurrentWord] = useState<LessonWord | null>(null);
    const [usedWordIds, setUsedWordIds] = useState<string[]>([]);
    const [answerSlots, setAnswerSlots] = useState<(string | null)[]>([]);
    const [hintLevel, setHintLevel] = useState(0);
    const [feedback, setFeedback] = useState("まずは ことばを きいてみよう。");
    const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>("idle");
    const [notice, setNotice] = useState(WORD_AUDIO_GUIDE);
    const [currentSoundTargetId, setCurrentSoundTargetId] = useState<string | null>(null);
    const [usedSoundTargetIds, setUsedSoundTargetIds] = useState<string[]>([]);
    const [soundQuizAnswered, setSoundQuizAnswered] = useState(false);
    const [soundQuizFeedback, setSoundQuizFeedback] = useState("きいて、どのカードか さがそう。");
    const [soundQuizFeedbackKind, setSoundQuizFeedbackKind] = useState<FeedbackKind>("idle");
    const [teacherPanelOpen, setTeacherPanelOpen] = useState(false);
    const [autoAdvance, setAutoAdvance] = useState(() => {
        if (typeof window === "undefined") return true;
        try {
            return window.localStorage.getItem(AUTO_ADVANCE_STORAGE_KEY) !== "false";
        } catch {
            return true;
        }
    });
    const [correctWordsByLevel, setCorrectWordsByLevel] = useState<CorrectWordsByLevel>(() =>
        readCorrectWordsByLevelFromStorage(),
    );
    const teacherHoldTimerRef = useRef<number | null>(null);
    const wordAdvanceTimerRef = useRef<number | null>(null);
    const soundAdvanceTimerRef = useRef<number | null>(null);
    const wrongAttemptsRef = useRef(0);

    const selectedPhonics = useMemo(
        () => selectedIds.map((id) => getPhonicById(id)).filter((phonic): phonic is Phonic => Boolean(phonic)),
        [selectedIds],
    );

    const selectedLevel = useMemo(
        () => PHONICS_LEVELS.find((level) => level.id === selectedLevelId) ?? PHONICS_LEVELS[0],
        [selectedLevelId],
    );

    const levelWords = useMemo(
        () =>
            LESSON_WORDS.filter(
                (word) => word.levelIds.includes(selectedLevel.id) && word.phonics.every((id) => selectedIds.includes(id)),
            ),
        [selectedIds, selectedLevel.id],
    );

    const correctWordIdsForLevel = useMemo(
        () => correctWordsByLevel[selectedLevel.id] ?? [],
        [correctWordsByLevel, selectedLevel.id],
    );

    const availableWords = useMemo(
        () => levelWords.filter((word) => !correctWordIdsForLevel.includes(word.id)),
        [correctWordIdsForLevel, levelWords],
    );

    const preferredAvailableWords = useMemo(
        () => getPreferredWordPool(selectedLevel.id, availableWords),
        [availableWords, selectedLevel.id],
    );

    const isLevelCompleteToday = selectedLevel.mode !== "practice-first" && levelWords.length > 0 && availableWords.length === 0;

    const safeGetLocalStorage = (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (err) {
            const message = err instanceof Error ? err.message : "storage_access_failed";
            setStorageError(message);
            return null;
        }
    };

    const safeSetLocalStorage = (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            const message = err instanceof Error ? err.message : "storage_access_failed";
            setStorageError(message);
        }
    };

    const writeCorrectWordsByLevel = (nextCorrectWords: CorrectWordsByLevel): void => {
        safeSetLocalStorage(getCorrectWordsStorageKey(), JSON.stringify(nextCorrectWords));
    };

    const markWordCorrectToday = (levelId: string, wordId: string): void => {
        setCorrectWordsByLevel((current) => {
            const currentLevelWords = current[levelId] ?? [];
            if (currentLevelWords.includes(wordId)) return current;

            const nextCorrectWords = {
                ...current,
                [levelId]: [...currentLevelWords, wordId],
            };
            writeCorrectWordsByLevel(nextCorrectWords);
            return nextCorrectWords;
        });
    };

    const resetTodayCorrectWordsForLevel = (): void => {
        const nextCorrectWords = { ...correctWordsByLevel };
        delete nextCorrectWords[selectedLevel.id];
        writeCorrectWordsByLevel(nextCorrectWords);
        setCorrectWordsByLevel(nextCorrectWords);
        setUsedWordIds([]);

        const nextWord = pickRandomWord(getPreferredWordPool(selectedLevel.id, levelWords), []);
        setCurrentWord(nextWord);
        resetAnswerState(nextWord);
        setNotice(nextWord ? "もういちど やってみよう。" : "レベルを えらびなおしてみよう。");
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        // This boot check reads browser-only state once after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDebugEnabled(params.get("debug") === "1");

        const features = runFeatureCheck();
        if (hasFatalFeatureGap(features)) {
            setFallbackMode(true);
            setBootStep("error");
            setIsAuthorized(false);
            return;
        }

        setBootStep("auth");
        const secret = params.get("p");
        const stored = safeGetLocalStorage("auth_phonics");

        if (secret === "sound" || secret === null || stored === "true") {
            safeSetLocalStorage("auth_phonics", "true");
            setIsAuthorized(true);
            setBootStep("ready");
        } else {
            setIsAuthorized(false);
            setBootStep("ready");
        }
    }, []);

    const resetAnswerState = (word: LessonWord | null) => {
        setAnswerSlots(makeEmptySlots(word));
        setHintLevel(0);
        wrongAttemptsRef.current = 0;
        setFeedback("まずは ことばを きいてみよう。");
        setFeedbackKind("idle");
    };

    const resetSoundQuizState = () => {
        setCurrentSoundTargetId(null);
        setSoundQuizAnswered(false);
        setSoundQuizFeedback("きいて、どのカードか さがそう。");
        setSoundQuizFeedbackKind("idle");
    };

    const playSpeech = (text: string, rate = 0.82) => {
        if (!("speechSynthesis" in window)) {
            setNotice("音が出なかったよ。こえにだしてみよう。");
            return;
        }

        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = applySpeechSpeed(rate);
        speechSynthesis.speak(utterance);
    };

    const playPhonic = (phonic: Phonic) => {
        if (mode !== "setup" && mode !== "poster") {
            return;
        }

        if (phonic.audio) {
            const audio = new Audio(phonic.audio);
            audio.play().catch(() => {
                setNotice("音が出なかったよ。こえにだしてみよう。");
            });
            return;
        }

        playSpeech(phonic.pronunciation || phonic.symbol);
    };

    const playPhonicSound = (phonic: Phonic, rate = 0.82) => {
        if (phonic.audio) {
            const audio = new Audio(phonic.audio);
            audio.play().catch(() => {
                playSpeech(phonic.pronunciation || phonic.symbol, rate);
            });
            return;
        }

        playSpeech(phonic.pronunciation || phonic.symbol, rate);
    };

    const playCurrentSoundTarget = () => {
        if (!currentSoundTargetId) return;
        const phonic = getPhonicById(currentSoundTargetId);
        if (!phonic) return;
        setNotice("おとを きいて、カードを さがそう。");
        playPhonicSound(phonic, 0.76);
    };

    const playWordValue = (word: LessonWord, slow = false) => {
        const wordAudio = word.wordAudio ?? word.audio;

        if (wordAudio) {
            const audio = new Audio(wordAudio);
            audio.play().catch(() => {
                setNotice(WORD_AUDIO_GUIDE);
                playSpeech(word.text, slow ? 0.58 : 0.82);
            });
            return;
        }

        setNotice(WORD_AUDIO_GUIDE);
        playSpeech(word.text, slow ? 0.58 : 0.82);
    };

    const playWord = (slow = false) => {
        if (!currentWord) return;
        playWordValue(currentWord, slow);
    };

    const playSoundPart = (index: number) => {
        if (!currentWord || hintLevel < 2) return;

        const phonicId = currentWord.phonics[index];
        const phonic = getPhonicById(phonicId);
        if (!phonic) return;

        setFeedback(`${index + 1}ばんめの おとを きいてみよう。`);
        setFeedbackKind("idle");

        playPhonicSound(phonic, 0.62);
    };

    const toggleTarget = (id: string) => {
        setSelectedIds((current) => {
            if (current.includes(id)) {
                return current.filter((selectedId) => selectedId !== id);
            }
            return [...current, id];
        });
        setCurrentWord(null);
        setUsedWordIds([]);
        setUsedSoundTargetIds([]);
        resetAnswerState(null);
        resetSoundQuizState();
        setMode("setup");
    };

    const chooseNextWord = (keepCurrent = false, excludedWordIds: string[] = []) => {
        if (wordAdvanceTimerRef.current) {
            clearTimeout(wordAdvanceTimerRef.current);
            wordAdvanceTimerRef.current = null;
        }
        if (keepCurrent && currentWord && !correctWordIdsForLevel.includes(currentWord.id)) {
            resetAnswerState(currentWord);
            setFeedback("もういっかい やってみよう。");
            return;
        }

        const nextWord = pickRandomWord(
            preferredAvailableWords.filter((word) => !excludedWordIds.includes(word.id)),
            usedWordIds,
        );
        setCurrentWord(nextWord);
        resetAnswerState(nextWord);

        if (nextWord) {
            setUsedWordIds((current) => (current.includes(nextWord.id) ? current : [...current, nextWord.id]));
            setNotice("きいて、カードをならべてみよう。");
            playWordValue(nextWord);
        } else {
            setNotice(
                selectedLevel.mode === "practice-first"
                    ? "まずは おとカードで なんども きいてみよう。"
                    : isLevelCompleteToday
                      ? "きょうの クイズは ぜんぶ できた！"
                      : `つくれる ことばが まだないよ。${LOW_WORD_COUNT_HINT}`,
            );
            setFeedback(
                selectedLevel.mode === "practice-first"
                    ? "レベル0は、おとを きくところから はじめよう。"
                    : isLevelCompleteToday
                      ? "また あした あそぼう。"
                      : "レベルを えらびなおしてみよう。",
            );
        }
    };

    const startChallenge = () => {
        unlockAudio();
        unlockSpeech();
        if (selectedLevel.mode === "practice-first") {
            startSoundQuiz();
            return;
        }

        setMode("challenge");
        chooseNextWord(false);
    };

    const chooseNextSoundTarget = (excludedIds: string[] = []) => {
        if (soundAdvanceTimerRef.current) {
            clearTimeout(soundAdvanceTimerRef.current);
            soundAdvanceTimerRef.current = null;
        }
        const unexcludedIds = selectedIds.filter((id) => !excludedIds.includes(id));
        const nextTargetId = pickRandomId(unexcludedIds.length > 0 ? unexcludedIds : selectedIds, usedSoundTargetIds);
        setCurrentSoundTargetId(nextTargetId);
        setSoundQuizAnswered(false);
        setSoundQuizFeedback("きいて、どのカードか さがそう。");
        setSoundQuizFeedbackKind("idle");

        if (nextTargetId) {
            setUsedSoundTargetIds((current) => (current.includes(nextTargetId) ? current : [...current, nextTargetId]));
            setNotice("おとを きいて、カードを さがそう。");
            const phonic = getPhonicById(nextTargetId);
            if (phonic) playPhonicSound(phonic, 0.76);
        } else {
            setNotice("おとカードを えらんでみよう。");
            setSoundQuizFeedback("きょうの おとを えらんでね。");
            setSoundQuizFeedbackKind("empty");
        }
    };

    const startSoundQuiz = () => {
        unlockAudio();
        unlockSpeech();
        setMode("soundQuiz");
        chooseNextSoundTarget();
    };

    const checkSoundAnswer = (id: string) => {
        if (!currentSoundTargetId || soundQuizFeedbackKind === "correct") return;

        if (id === currentSoundTargetId) {
            setSoundQuizAnswered(true);
            setSoundQuizFeedback("できた！");
            setSoundQuizFeedbackKind("correct");
            playChime();
            if (autoAdvance) {
                const answeredId = currentSoundTargetId;
                soundAdvanceTimerRef.current = window.setTimeout(() => chooseNextSoundTarget([answeredId]), 2000);
            }
        } else {
            setSoundQuizAnswered(false);
            setSoundQuizFeedback("もういちど きいてみよう。");
            setSoundQuizFeedbackKind("tryAgain");
            playBuzz();
        }
    };

    const chooseLevel = (levelId: string) => {
        const nextLevel = PHONICS_LEVELS.find((level) => level.id === levelId) ?? PHONICS_LEVELS[0];
        unlockAudio();
        unlockSpeech();
        setSelectedLevelId(nextLevel.id);
        setSelectedIds(nextLevel.targetIds);
        setCurrentWord(null);
        setUsedWordIds([]);
        setUsedSoundTargetIds([]);
        resetAnswerState(null);
        resetSoundQuizState();
        if (nextLevel.mode === "practice-first") {
            setMode("poster");
            setNotice("カードを おして、おとを きいてみよう。");
            return;
        }

        const correctIds = correctWordsByLevel[nextLevel.id] ?? [];
        const nextWords = LESSON_WORDS.filter(
            (word) =>
                word.levelIds.includes(nextLevel.id) &&
                word.phonics.every((id) => nextLevel.targetIds.includes(id)) &&
                !correctIds.includes(word.id),
        );
        const nextWord = pickRandomWord(getPreferredWordPool(nextLevel.id, nextWords), []);
        setMode("challenge");
        setCurrentWord(nextWord);
        resetAnswerState(nextWord);
        setUsedWordIds(nextWord ? [nextWord.id] : []);
        setNotice(nextWord ? "きいて、カードをならべてみよう。" : "きょうの クイズは ぜんぶ できた！");
        if (nextWord) playWordValue(nextWord);
    };

    const addCardToNextSlot = (id: string) => {
        if (!currentWord || feedbackKind === "correct") return;

        const nextEmptyIndex = answerSlots.findIndex((slot) => slot === null);
        if (nextEmptyIndex === -1) {
            setFeedback("いっぱいだよ。いらないカードを タップして はずそう。");
            setFeedbackKind("empty");
            return;
        }

        const next = [...answerSlots];
        next[nextEmptyIndex] = id;
        setAnswerSlots(next);
        setFeedback("ならべてみよう。");
        setFeedbackKind("idle");
        if (next.every((slot) => slot !== null)) {
            window.setTimeout(() => checkAnswer(next), 0);
        }
    };

    const placeCardInSlot = (id: string, slotIndex: number) => {
        if (!currentWord || feedbackKind === "correct") return;

        const next = [...answerSlots];
        next[slotIndex] = id;
        setAnswerSlots(next);
        setFeedback("ならべてみよう。");
        setFeedbackKind("idle");
        if (next.every((slot) => slot !== null)) {
            window.setTimeout(() => checkAnswer(next), 0);
        }
    };

    const removeSlot = (slotIndex: number) => {
        if (feedbackKind === "correct") return;
        setAnswerSlots((current) => {
            const next = [...current];
            next[slotIndex] = null;
            return next;
        });
        setFeedback("はずしたよ。もういちど えらんでね。");
        setFeedbackKind("idle");
    };

    const checkAnswer = (slots: (string | null)[]) => {
        if (!currentWord) return;

        const isCorrect = currentWord.phonics.every((id, index) => slots[index] === id);
        if (isCorrect) {
            markWordCorrectToday(selectedLevel.id, currentWord.id);
            setFeedback("できた！");
            setFeedbackKind("correct");
            playChime();
            playWordValue(currentWord);
            if (autoAdvance) {
                const answeredWordId = currentWord.id;
                wordAdvanceTimerRef.current = window.setTimeout(() => chooseNextWord(false, [answeredWordId]), 2000);
            }
        } else {
            setFeedback("もういちど きいてみよう。");
            setFeedbackKind("tryAgain");
            wrongAttemptsRef.current += 1;
            if (wrongAttemptsRef.current >= 2) setHintLevel((level) => Math.max(level, 1));
            playBuzz();
        }
    };

    const retryWordAnswer = () => {
        setAnswerSlots(makeEmptySlots(currentWord));
        setFeedback("もういちど ならべてみよう。");
        setFeedbackKind("idle");
    };

    const handleDragStart = (event: DragEvent<HTMLButtonElement>, id: string) => {
        event.dataTransfer.setData("text/plain", id);
        event.dataTransfer.effectAllowed = "copy";
    };

    const handleSlotDrop = (event: DragEvent<HTMLButtonElement>, slotIndex: number) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/plain");
        if (id) {
            placeCardInSlot(id, slotIndex);
        }
    };

    const resetUsedWords = () => {
        setUsedWordIds([]);
        setNotice("でた ことばを リセットしたよ。");
    };

    const setAutoAdvancePreference = (enabled: boolean) => {
        setAutoAdvance(enabled);
        safeSetLocalStorage(AUTO_ADVANCE_STORAGE_KEY, String(enabled));
        if (!enabled) {
            if (wordAdvanceTimerRef.current) clearTimeout(wordAdvanceTimerRef.current);
            if (soundAdvanceTimerRef.current) clearTimeout(soundAdvanceTimerRef.current);
            wordAdvanceTimerRef.current = null;
            soundAdvanceTimerRef.current = null;
        }
    };

    const stopTeacherHold = () => {
        if (!teacherHoldTimerRef.current) return;
        clearTimeout(teacherHoldTimerRef.current);
        teacherHoldTimerRef.current = null;
    };

    const startTeacherHold = (event: PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        stopTeacherHold();
        teacherHoldTimerRef.current = window.setTimeout(() => {
            setTeacherPanelOpen(true);
            teacherHoldTimerRef.current = null;
        }, 1000);
    };

    const goBack = () => {
        if (wordAdvanceTimerRef.current) clearTimeout(wordAdvanceTimerRef.current);
        if (soundAdvanceTimerRef.current) clearTimeout(soundAdvanceTimerRef.current);
        wordAdvanceTimerRef.current = null;
        soundAdvanceTimerRef.current = null;
        if (mode === "soundQuiz") {
            setMode("poster");
            setNotice("カードを おして、おとを きいてみよう。");
            return;
        }
        setMode("setup");
        setNotice(WORD_AUDIO_GUIDE);
    };

    const advanceHint = () => {
        setHintLevel((level) => Math.min(4, level + 1));
    };

    useEffect(() => {
        return () => {
            if (teacherHoldTimerRef.current) clearTimeout(teacherHoldTimerRef.current);
            if (wordAdvanceTimerRef.current) clearTimeout(wordAdvanceTimerRef.current);
            if (soundAdvanceTimerRef.current) clearTimeout(soundAdvanceTimerRef.current);
        };
    }, []);

    const hintThreeText = currentWord ? [currentWord.text[0], ...currentWord.text.slice(1).split("").map(() => "?")].join(" ") : "";
    const hintFourText = currentWord ? currentWord.phonics.join(" / ") : "";
    const hiddenLetters = currentWord
        ? currentWord.text.split("").map((letter, index) => (hintLevel >= 3 && index === 0 ? letter : "?"))
        : [];
    const currentSoundPhonic = currentSoundTargetId ? getPhonicById(currentSoundTargetId) : null;
    const showSuccessStep = feedbackKind === "correct" || soundQuizFeedbackKind === "correct";

    if (fallbackMode) {
        return (
            <main className={styles.statusScreen}>
                <h1>Lightweight Mode</h1>
                <p>Some features are not available on this device. Starting in lightweight mode.</p>
                <Link className={styles.navLink} href="/">
                    トップへ
                </Link>
                <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={debugEnabled ? storageError : null} />
            </main>
        );
    }

    if (isAuthorized === null) {
        return (
            <main className={styles.statusScreen}>
                <h1>Checking access...</h1>
                <p>step: {bootStep}</p>
                <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={debugEnabled ? storageError : null} />
            </main>
        );
    }

    if (!isAuthorized) {
        return (
            <main className={styles.statusScreen}>
                <h1>Under Maintenance</h1>
                <p>This page is currently restricted.</p>
                <Link className={styles.navLink} href="/">
                    トップへ
                </Link>
                <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={debugEnabled ? storageError : null} />
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <header className={styles.headerBar}>
                <div>
                    <p className={styles.kicker}>きいて ならべる フォニックス</p>
                    <h1 className={styles.title}>oto-man</h1>
                </div>
                <nav className={styles.nav}>
                    {mode === "setup" ? (
                        <>
                            <Link className={styles.navLink} href="/">
                                トップ
                            </Link>
                            <Link className={styles.navLink} href="/svo">
                                SVOカルタ
                            </Link>
                            <Link className={styles.navLink} href="/quiz-maker">
                                Quiz Maker
                            </Link>
                        </>
                    ) : (
                        <Link className={`${styles.navLink} ${styles.homeLink}`} href="/" aria-label="トップへ">
                            🏠
                        </Link>
                    )}
                </nav>
            </header>

            {mode !== "setup" && (
                <section className={styles.gameToolbar} aria-label="あそびの ながれ">
                    <button className={styles.backButton} onClick={goBack} type="button">
                        ← もどる
                    </button>
                    <div className={styles.progressTrail} aria-label="きく、えらぶ、はなまる">
                        <span className={styles.progressActive}>🔊</span>
                        <i aria-hidden="true">→</i>
                        <span className={mode === "poster" ? styles.progressPending : styles.progressActive}>🃏</span>
                        <i aria-hidden="true">→</i>
                        <span className={showSuccessStep ? styles.progressActive : styles.progressPending}>⭐</span>
                    </div>
                </section>
            )}

            {mode === "setup" && (
                <section className={styles.panel}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>レベルを えらぼう</h2>
                            <p>おおきな カードを ひとつ おしてね。</p>
                        </div>
                    </div>

                    <div className={styles.levelGrid} aria-label="レベル">
                        {PHONICS_LEVELS.map((level) => (
                            <button
                                key={level.id}
                                className={selectedLevel.id === level.id ? styles.levelCardActive : styles.levelCard}
                                onClick={() => chooseLevel(level.id)}
                                type="button"
                            >
                                <strong>{level.label}</strong>
                                <span>{level.description}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {mode === "poster" && (
                <section className={styles.panel}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>おとカード</h2>
                            <p>カードをおすと、おとがなるよ。おぼえたら、つぎへすすもう。</p>
                        </div>
                        <button
                            className={styles.primaryButton}
                            onClick={startChallenge}
                            disabled={selectedLevel.mode !== "practice-first" && levelWords.length === 0}
                        >
                            🃏 {selectedLevel.mode === "practice-first" ? "おとあてへ" : "クイズへ"}
                        </button>
                    </div>

                    <div className={styles.posterGrid}>
                        {selectedPhonics.map((phonic) => (
                            <button key={phonic.id} className={styles.posterCard} onClick={() => playPhonic(phonic)} type="button">
                                <Image src={phonic.image} alt="" width={360} height={260} className={styles.posterImage} />
                                <span>{phonic.symbol}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {mode === "soundQuiz" && (
                <section className={styles.panel}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>おとを さがそう</h2>
                            <p>ひとつの おとを きいて、どのカードか えらぼう。</p>
                        </div>
                        <div className={styles.countBadge}>{selectedLevel.label}</div>
                    </div>

                    {currentSoundPhonic ? (
                        <>
                            <div className={styles.soundQuizPanel}>
                                <p className={styles.kicker}>おとあて</p>
                                <h3>どのカードかな？</h3>
                                <div className={styles.soundMysterySlot} aria-label="おとのもんだい">
                                    <span>[?]</span>
                                </div>
                                <button className={styles.listenButton} onClick={playCurrentSoundTarget} type="button">
                                    <span aria-hidden="true">🔊</span>
                                    <strong>きく</strong>
                                </button>
                                <FeedbackBadge kind={soundQuizFeedbackKind} />
                                <p className={`${styles.feedback} ${styles[soundQuizFeedbackKind]}`}>{soundQuizFeedback}</p>
                            </div>

                            <div className={styles.soundChoiceGrid} aria-label="おとあてカード">
                                {selectedPhonics.map((phonic) => {
                                    const isCorrectAnswer = soundQuizAnswered && phonic.id === currentSoundTargetId && soundQuizFeedbackKind === "correct";
                                    return (
                                        <button
                                            key={phonic.id}
                                            className={isCorrectAnswer ? styles.soundChoiceCardActive : styles.soundChoiceCard}
                                            onClick={() => checkSoundAnswer(phonic.id)}
                                            type="button"
                                        >
                                            <Image src={phonic.image} alt="" width={220} height={150} />
                                            <span>{phonic.symbol}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {soundQuizFeedbackKind === "correct" && (
                                <div className={styles.contextAction}>
                                    <button
                                        className={styles.nextButton}
                                        onClick={() => chooseNextSoundTarget(currentSoundTargetId ? [currentSoundTargetId] : [])}
                                        type="button"
                                    >
                                        ➡️ つぎ
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <h2>おとカードを えらぼう</h2>
                            <p>レベルを えらびなおしてみよう。</p>
                            <button className={styles.primaryButton} onClick={() => setMode("setup")}>
                                きょうの おとへ
                            </button>
                        </div>
                    )}
                </section>
            )}

            {mode === "challenge" && (
                <section className={styles.challengeLayout}>
                    <aside className={styles.sidePoster}>
                        <h2>つかうカード</h2>
                        <p className={styles.sideNote}>カードをタップすると、あいている ところに入るよ。</p>
                        <div className={styles.sideGrid}>
                            {selectedPhonics.map((phonic) => {
                                const usedInAnswer = feedbackKind === "correct" && currentWord?.phonics.includes(phonic.id);
                                return (
                                    <button
                                        key={phonic.id}
                                        className={usedInAnswer ? styles.sideCardActive : styles.sideCard}
                                        draggable
                                        onClick={() => addCardToNextSlot(phonic.id)}
                                        onDragStart={(event) => handleDragStart(event, phonic.id)}
                                        aria-label={`${phonic.symbol}を 入れる`}
                                        type="button"
                                    >
                                        <Image src={phonic.image} alt="" width={160} height={110} />
                                        <span>{phonic.symbol}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <section className={styles.challengePanel}>
                        <div className={styles.challengeTop}>
                            <div>
                                <p className={styles.kicker}>クイズ</p>
                                <h2>クイズに ちょうせん！</h2>
                            </div>
                            <div className={styles.countBadge}>
                                のこり {availableWords.length}もん
                            </div>
                        </div>

                        {currentWord ? (
                            <>
                                <div className={styles.blankWord} aria-label="もじのかず">
                                    {hiddenLetters.map((letter, index) => (
                                        hintLevel >= 2 ? (
                                            <button
                                                key={`${letter}-${index}`}
                                                className={styles.soundSlot}
                                                onClick={() => playSoundPart(index)}
                                                type="button"
                                                aria-label={`${index + 1}ばんめの おと`}
                                            >
                                                {letter === "?" ? "[?]" : letter}
                                            </button>
                                        ) : (
                                            <span key={`${letter}-${index}`}>{letter === "?" ? "[?]" : letter}</span>
                                        )
                                    ))}
                                </div>

                                <div className={styles.challengeControls}>
                                    <button className={styles.listenButton} onClick={() => playWord(false)} type="button">
                                        <span aria-hidden="true">🔊</span>
                                        <strong>きく</strong>
                                    </button>
                                    <button className={styles.hintButton} onClick={advanceHint} type="button" disabled={hintLevel >= 4}>
                                        <span aria-hidden="true">💡</span>
                                        <strong>ヒント</strong>
                                        <small aria-label={`ヒント ${hintLevel} / 4`}>
                                            {Array.from({ length: 4 }, (_, index) => (index < hintLevel ? "●" : "○")).join("")}
                                        </small>
                                    </button>
                                </div>

                                <section className={styles.slotPanel} aria-label="こたえスロット">
                                    <h3>カードをならべよう</h3>
                                    <div className={styles.answerSlotsWrapper}>
                                        <div className={styles.answerSlots}>
                                            {answerSlots.map((slotId, index) => {
                                                const slotPhonic = slotId ? getPhonicById(slotId) : null;
                                                return (
                                                    <button
                                                        key={`${currentWord.id}-slot-${index}`}
                                                        className={slotPhonic ? styles.answerSlotFilled : styles.answerSlot}
                                                        onClick={() => removeSlot(index)}
                                                        onDragOver={(event) => event.preventDefault()}
                                                        onDrop={(event) => handleSlotDrop(event, index)}
                                                        aria-label={
                                                            slotPhonic
                                                                ? `${index + 1}ばんめの ${slotPhonic.symbol}を はずす`
                                                                : "まだ からの スロット"
                                                        }
                                                        type="button"
                                                    >
                                                        {slotPhonic ? (
                                                            <>
                                                                <Image src={slotPhonic.image} alt="" width={130} height={90} />
                                                                <span>{slotPhonic.symbol}</span>
                                                            </>
                                                        ) : (
                                                            <span>[?]</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {feedbackKind === "correct" && (
                                            <div className={styles.correctMarkOverlay} aria-label="正解のしるし" role="img">
                                                <HanamaruMark className={styles.correctMarkSvg} />
                                            </div>
                                        )}
                                        {feedbackKind === "tryAgain" && (
                                            <div className={styles.incorrectSlotBadge} aria-label="もういちど考えよう" role="img">
                                                ?
                                            </div>
                                        )}
                                    </div>
                                    <p className={`${styles.feedback} ${styles[feedbackKind]}`}>{feedback}</p>
                                    {feedbackKind === "tryAgain" && (
                                        <button
                                            className={styles.retryButton}
                                            onClick={retryWordAnswer}
                                            type="button"
                                        >
                                            🔄 さいチャレンジ
                                        </button>
                                    )}
                                    {feedbackKind === "correct" && (
                                        <div className={styles.contextAction}>
                                            <button className={styles.nextButton} onClick={() => chooseNextWord(false)} type="button">
                                                ➡️ つぎ
                                            </button>
                                        </div>
                                    )}
                                </section>

                                <div className={styles.hintBox}>
                                    {hintLevel === 0 && <p>きこえた音を、カードでならべよう。</p>}
                                    {hintLevel >= 1 && <p>もういちど きいて、口でもいってみよう。</p>}
                                    {hintLevel >= 2 && <p>ヒント: 上の [?] をおすと、その場所のおとだけ聞けるよ。</p>}
                                    {hintLevel >= 3 && <p className={styles.phonemeText}>はじめ: {hintThreeText}</p>}
                                    {hintLevel >= 4 && <p className={styles.phonemeText}>つかうカード: {hintFourText}</p>}
                                </div>

                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                {isLevelCompleteToday ? (
                                    <>
                                        <h2>きょうの クイズは ぜんぶ できた！</h2>
                                        <p>また あした あそぼう。</p>
                                    </>
                                ) : (
                                    <>
                                        <h2>つくれる ことばが ないよ</h2>
                                        <p>レベルを えらびなおしてみよう。</p>
                                    </>
                                )}
                            </div>
                        )}
                    </section>
                </section>
            )}

            <button
                className={styles.teacherGear}
                type="button"
                aria-label="せんせいよう。1びょう ながおし"
                title="1びょう ながおし"
                onPointerDown={startTeacherHold}
                onPointerUp={stopTeacherHold}
                onPointerCancel={stopTeacherHold}
                onPointerLeave={stopTeacherHold}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setTeacherPanelOpen(true);
                }}
            >
                ⚙
            </button>

            {teacherPanelOpen && (
                <div className={styles.teacherOverlay} role="presentation">
                    <section className={styles.teacherPanel} role="dialog" aria-modal="true" aria-labelledby="teacher-panel-title">
                        <div className={styles.teacherPanelHeader}>
                            <div>
                                <p className={styles.kicker}>せんせいよう</p>
                                <h2 id="teacher-panel-title">クイズの せってい</h2>
                            </div>
                            <button className={styles.closeTeacherButton} onClick={() => setTeacherPanelOpen(false)} type="button">
                                とじる ✕
                            </button>
                        </div>

                        <div className={styles.summaryBar}>
                            <span>{selectedLevel.label}</span>
                            <span>つくれる ことば: {levelWords.length}</span>
                            {selectedLevel.mode !== "practice-first" && <span>きょう のこり {availableWords.length}もん</span>}
                            <span>
                                {availableWords.map((word) => word.text).join(", ") ||
                                    (isLevelCompleteToday ? "きょうは ぜんぶ できた！" : "まだないよ")}
                            </span>
                            {availableWords.length < 3 && !isLevelCompleteToday && (
                                <span className={styles.warningText}>{LOW_WORD_COUNT_HINT}</span>
                            )}
                        </div>

                        <h3>つかう おと</h3>
                        <div className={styles.selectorGrid}>
                            {PRIORITY_PHONICS_IDS.map((id) => {
                                const phonic = getPhonicById(id);
                                if (!phonic) return null;
                                const selected = selectedIds.includes(id);
                                return (
                                    <button
                                        key={phonic.id}
                                        className={selected ? styles.selectorCardSelected : styles.selectorCard}
                                        onClick={() => toggleTarget(phonic.id)}
                                        type="button"
                                        aria-pressed={selected}
                                    >
                                        <Image src={phonic.image} alt="" width={220} height={140} className={styles.selectorImage} />
                                        <span>{phonic.symbol}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className={styles.teacherSettings}>
                            <SpeedControl />
                            <label className={styles.autoAdvanceSetting}>
                                <input
                                    type="checkbox"
                                    checked={autoAdvance}
                                    onChange={(event) => setAutoAdvancePreference(event.target.checked)}
                                />
                                <span>はなまるの あと じどうで つぎへ</span>
                            </label>
                        </div>

                        <div className={styles.teacherActions}>
                            <button className={styles.secondaryButton} onClick={resetUsedWords} type="button">
                                でた ことばを リセット
                            </button>
                            {selectedLevel.mode !== "practice-first" && (
                                <button className={styles.secondaryButton} onClick={resetTodayCorrectWordsForLevel} type="button">
                                    きょうの ぶんを リセット
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            )}

            <p className={styles.notice}>{notice}</p>
            <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={debugEnabled ? storageError : null} />
        </main>
    );
}
