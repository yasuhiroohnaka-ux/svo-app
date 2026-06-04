"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
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
import { hasFatalFeatureGap, runFeatureCheck, type BootStep } from "@/utils/bootDiagnostics";

type ViewMode = "setup" | "poster" | "challenge" | "soundQuiz";
type FeedbackKind = "idle" | "correct" | "tryAgain" | "empty";
type EntryMode = "direct" | "sound" | "word" | "set";
type CorrectWordsByLevel = Record<string, string[]>;
type WordVisualTone = NonNullable<LessonWord["visual"]>["tone"];

const LOW_WORD_COUNT_HINT = "単語数が少ないときは、別のレベルも確認してください。";
const WORD_AUDIO_GUIDE = "音声を聞いて、発音をまねしてみよう。";
const CORRECT_WORDS_STORAGE_PREFIX = "phonics.correctWords.";
const LEVEL_4_NEW_SOUND_IDS = ["s", "f", "h"];

const WORD_VISUAL_TONE_CLASS: Record<WordVisualTone, string> = {
    aqua: styles.visualAqua,
    sun: styles.visualSun,
    leaf: styles.visualLeaf,
    rose: styles.visualRose,
    sky: styles.visualSky,
    orange: styles.visualOrange,
};

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

const getEntryMode = (entry: string | null): EntryMode => {
    if (entry === "sound" || entry === "word" || entry === "set") {
        return entry;
    }
    return "direct";
};

const HanamaruMark = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <path className={styles.hanamaruLine} d="M60 14 C85 14 106 35 106 60 C106 85 85 106 60 106 C35 106 14 85 14 60 C14 35 35 14 60 14 Z" />
        <path className={styles.hanamaruInnerLine} d="M36 62 L53 78 L86 42" />
        <path className={styles.hanamaruAccentLine} d="M33 25 L43 34" />
        <path className={styles.hanamaruAccentLine} d="M87 86 L97 96" />
    </svg>
);

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
            <div className={`${styles.resultBadge} ${styles.questionBadge}`} aria-label="もう一度考えよう">
                <span>?</span>
                <strong>Retry</strong>
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
    const [feedback, setFeedback] = useState("まずは単語を聞いてみよう。");
    const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>("idle");
    const [notice, setNotice] = useState(WORD_AUDIO_GUIDE);
    const [currentSoundTargetId, setCurrentSoundTargetId] = useState<string | null>(null);
    const [usedSoundTargetIds, setUsedSoundTargetIds] = useState<string[]>([]);
    const [soundQuizAnswered, setSoundQuizAnswered] = useState(false);
    const [soundQuizFeedback, setSoundQuizFeedback] = useState("音を聞いて、対応するカードを選ぼう。");
    const [soundQuizFeedbackKind, setSoundQuizFeedbackKind] = useState<FeedbackKind>("idle");
    const [entryMode, setEntryMode] = useState<EntryMode>("direct");
    const [correctWordsByLevel, setCorrectWordsByLevel] = useState<CorrectWordsByLevel>(() =>
        readCorrectWordsByLevelFromStorage(),
    );

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
        setNotice(nextWord ? "もう一度チャレンジできます。" : "レベルを選び直してください。");
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

        const applyEntryMode = () => {
            const nextEntryMode = getEntryMode(new URLSearchParams(window.location.search).get("entry"));
            const latestCorrectWords = readCorrectWordsByLevelFromStorage();
            setEntryMode(nextEntryMode);

            if (nextEntryMode === "direct") {
                return;
            }

            if (nextEntryMode === "sound") {
                const soundLevel = PHONICS_LEVELS.find((level) => level.id === "level-0") ?? PHONICS_LEVELS[0];
                const firstSoundId = soundLevel.targetIds[0] ?? null;
                setSelectedLevelId(soundLevel.id);
                setSelectedIds(soundLevel.targetIds);
                setCurrentWord(null);
                setUsedWordIds([]);
                setAnswerSlots([]);
                setHintLevel(0);
                setCurrentSoundTargetId(firstSoundId);
                setUsedSoundTargetIds(firstSoundId ? [firstSoundId] : []);
                setSoundQuizAnswered(false);
                setSoundQuizFeedback("音を聞いて、対応するカードを選ぼう。");
                setSoundQuizFeedbackKind("idle");
                setMode("soundQuiz");
                setNotice("再生ボタンで音を確認しよう。");
                return;
            }

            const wordLevel = PHONICS_LEVELS.find((level) => level.id === "level-1") ?? PHONICS_LEVELS[1] ?? PHONICS_LEVELS[0];
            const isWordEntry = nextEntryMode === "word";
            const correctWordIds = latestCorrectWords[wordLevel.id] ?? [];
            const firstWord =
                LESSON_WORDS.find(
                    (word) =>
                        word.levelIds.includes(wordLevel.id) &&
                        word.phonics.every((id) => wordLevel.targetIds.includes(id)) &&
                        !correctWordIds.includes(word.id),
                ) ?? null;
            setSelectedLevelId(wordLevel.id);
            setSelectedIds(wordLevel.targetIds);
            setCurrentWord(isWordEntry ? firstWord : null);
            setUsedWordIds(isWordEntry && firstWord ? [firstWord.id] : []);
            setAnswerSlots(isWordEntry ? makeEmptySlots(firstWord) : []);
            setHintLevel(0);
            setFeedback("まずは単語を聞いてみよう。");
            setFeedbackKind("idle");
            setCurrentSoundTargetId(null);
            setUsedSoundTargetIds([]);
            setSoundQuizAnswered(false);
            setMode(isWordEntry ? "challenge" : "setup");
            setNotice(isWordEntry ? "音声を聞いて、カードを並べよう。" : "Level 1 のカードで始めよう。");
        };

        applyEntryMode();

        const handleUrlChange = () => applyEntryMode();
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;

        const patchedPushState: History["pushState"] = (...args) => {
            originalPushState.apply(window.history, args);
            window.dispatchEvent(new Event("phonics-entry-change"));
        };

        const patchedReplaceState: History["replaceState"] = (...args) => {
            originalReplaceState.apply(window.history, args);
            window.dispatchEvent(new Event("phonics-entry-change"));
        };

        window.history.pushState = patchedPushState;
        window.history.replaceState = patchedReplaceState;
        window.addEventListener("popstate", handleUrlChange);
        window.addEventListener("phonics-entry-change", handleUrlChange);

        return () => {
            window.removeEventListener("popstate", handleUrlChange);
            window.removeEventListener("phonics-entry-change", handleUrlChange);
            if (window.history.pushState === patchedPushState) {
                window.history.pushState = originalPushState;
            }
            if (window.history.replaceState === patchedReplaceState) {
                window.history.replaceState = originalReplaceState;
            }
        };
    }, []);

    const resetAnswerState = (word: LessonWord | null) => {
        setAnswerSlots(makeEmptySlots(word));
        setHintLevel(0);
        setFeedback("まずは単語を聞いてみよう。");
        setFeedbackKind("idle");
    };

    const resetSoundQuizState = () => {
        setCurrentSoundTargetId(null);
        setSoundQuizAnswered(false);
        setSoundQuizFeedback("音を聞いて、対応するカードを選ぼう。");
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
        utterance.rate = rate;
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
            audio.playbackRate = rate;
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
        setNotice("音を聞いて、対応するカードを探そう。");
        playPhonicSound(phonic, 0.76);
    };

    const playWord = (slow = false) => {
        if (!currentWord) return;
        const wordAudio = currentWord.wordAudio ?? currentWord.audio;

        if (wordAudio) {
            const audio = new Audio(wordAudio);
            audio.play().catch(() => {
                setNotice(WORD_AUDIO_GUIDE);
                playSpeech(currentWord.text, slow ? 0.58 : 0.82);
            });
            return;
        }

        setNotice(WORD_AUDIO_GUIDE);
        playSpeech(currentWord.text, slow ? 0.58 : 0.82);
    };

    const playSoundPart = (index: number) => {
        if (!currentWord || hintLevel < 2) return;

        const phonicId = currentWord.phonics[index];
        const phonic = getPhonicById(phonicId);
        if (!phonic) return;

        setFeedback(`${index + 1}番目の音を確認しよう。`);
        setFeedbackKind("idle");

        playPhonicSound(phonic, 0.62);
    };

    const playWordParts = async () => {
        if (!currentWord) return;

        setHintLevel((level) => Math.max(level, 2));
        setNotice("音をひとつずつ分解して確認します。");

        for (const phonicId of currentWord.phonics) {
            const phonic = getPhonicById(phonicId);
            if (phonic) {
                playPhonicSound(phonic, 0.68);
                await new Promise((resolve) => window.setTimeout(resolve, 620));
            }
        }
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
    };

    const chooseNextWord = (keepCurrent = false) => {
        if (keepCurrent && currentWord && !correctWordIdsForLevel.includes(currentWord.id)) {
            resetAnswerState(currentWord);
            setFeedback("もういっかい やってみよう。");
            return;
        }

        const nextWord = pickRandomWord(preferredAvailableWords, usedWordIds);
        setCurrentWord(nextWord);
        resetAnswerState(nextWord);

        if (nextWord) {
            setUsedWordIds((current) => (current.includes(nextWord.id) ? current : [...current, nextWord.id]));
            setNotice("音声を聞いて、カードを並べよう。");
        } else {
            setNotice(
                selectedLevel.mode === "practice-first"
                    ? "まずは Sound Cards で音を確認しよう。"
                    : isLevelCompleteToday
                      ? "今日の Spelling Quiz は完了です。"
                      : `出題できる単語がまだありません。${LOW_WORD_COUNT_HINT}`,
            );
            setFeedback(
                selectedLevel.mode === "practice-first"
                    ? "Level 0 は音と文字の対応確認から始めます。"
                    : isLevelCompleteToday
                      ? "復習する場合はリセットできます。"
                      : "レベルを選び直してください。",
            );
        }
    };

    const startChallenge = () => {
        if (selectedLevel.mode === "practice-first") {
            startSoundQuiz();
            return;
        }

        setMode("challenge");
        chooseNextWord(false);
    };

    const startWordChallenge = (word: LessonWord) => {
        setMode("challenge");
        setCurrentWord(word);
        setUsedWordIds((current) => (current.includes(word.id) ? current : [...current, word.id]));
        setAnswerSlots(makeEmptySlots(word));
        setHintLevel(0);
        setFeedback("画像と音声をヒントに、カードを並べよう。");
        setFeedbackKind("idle");
        setNotice("画像を見て、音を聞いて、スペリングを組み立てよう。");
    };

    const chooseNextSoundTarget = () => {
        const nextTargetId = pickRandomId(selectedIds, usedSoundTargetIds);
        setCurrentSoundTargetId(nextTargetId);
        setSoundQuizAnswered(false);
        setSoundQuizFeedback("音を聞いて、対応するカードを選ぼう。");
        setSoundQuizFeedbackKind("idle");

        if (nextTargetId) {
            setUsedSoundTargetIds((current) => (current.includes(nextTargetId) ? current : [...current, nextTargetId]));
            setNotice("再生ボタンで音を確認しよう。");
        } else {
            setNotice("Sound Cards を選択してください。");
            setSoundQuizFeedback("今日の音を選択してください。");
            setSoundQuizFeedbackKind("empty");
        }
    };

    const startSoundQuiz = () => {
        setMode("soundQuiz");
        chooseNextSoundTarget();
    };

    const checkSoundAnswer = (id: string) => {
        if (!currentSoundTargetId) return;
        setSoundQuizAnswered(true);

        if (id === currentSoundTargetId) {
            setSoundQuizFeedback("Correct");
            setSoundQuizFeedbackKind("correct");
        } else {
            setSoundQuizFeedback("もう一度聞いて確認しよう。");
            setSoundQuizFeedbackKind("tryAgain");
        }
    };

    const chooseLevel = (levelId: string) => {
        const nextLevel = PHONICS_LEVELS.find((level) => level.id === levelId) ?? PHONICS_LEVELS[0];
        setSelectedLevelId(nextLevel.id);
        setSelectedIds(nextLevel.targetIds);
        setCurrentWord(null);
        setUsedWordIds([]);
        setUsedSoundTargetIds([]);
        resetAnswerState(null);
        resetSoundQuizState();
        setMode(nextLevel.mode === "practice-first" ? "poster" : "setup");
        setNotice(`${nextLevel.label}に したよ。`);
    };

    const addCardToNextSlot = (id: string) => {
        if (!currentWord) return;

        const nextEmptyIndex = answerSlots.findIndex((slot) => slot === null);
        if (nextEmptyIndex === -1) {
            setFeedback("スロットがいっぱいです。不要なカードを外してください。");
            setFeedbackKind("empty");
            return;
        }

        setAnswerSlots((current) => {
            const next = [...current];
            next[nextEmptyIndex] = id;
            return next;
        });
        setFeedback("カードを並べよう。");
        setFeedbackKind("idle");
    };

    const placeCardInSlot = (id: string, slotIndex: number) => {
        if (!currentWord) return;

        setAnswerSlots((current) => {
            const next = [...current];
            next[slotIndex] = id;
            return next;
        });
        setFeedback("カードを並べよう。");
        setFeedbackKind("idle");
    };

    const removeSlot = (slotIndex: number) => {
        setAnswerSlots((current) => {
            const next = [...current];
            next[slotIndex] = null;
            return next;
        });
        setFeedback("カードを外しました。もう一度選んでください。");
        setFeedbackKind("idle");
    };

    const resetSlots = () => {
        setAnswerSlots(makeEmptySlots(currentWord));
        setFeedback("からにしたよ。");
        setFeedbackKind("idle");
    };

    const checkAnswer = () => {
        if (!currentWord) return;

        const isIncomplete = answerSlots.length !== currentWord.phonics.length || answerSlots.some((slot) => slot === null);
        if (isIncomplete) {
            setFeedback("まだ あいている ところが あるよ。");
            setFeedbackKind("empty");
            return;
        }

        const isCorrect = currentWord.phonics.every((id, index) => answerSlots[index] === id);
        if (isCorrect) {
            markWordCorrectToday(selectedLevel.id, currentWord.id);
            setFeedback("Correct");
            setFeedbackKind("correct");
        } else {
            setFeedback("もう一度聞いて確認しよう。");
            setFeedbackKind("tryAgain");
        }
    };

    const retryWordAnswer = () => {
        setFeedback("もう一度並べてみよう。");
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
        setNotice("今日出た単語をリセットしました。");
    };

    const hintThreeText = currentWord ? [currentWord.text[0], ...currentWord.text.slice(1).split("").map(() => "?")].join(" ") : "";
    const hintFourText = currentWord ? currentWord.phonics.join(" / ") : "";
    const showWordPrompt = entryMode === "word";
    const hiddenLetters = currentWord
        ? currentWord.text.split("").map((letter, index) => {
              if (showWordPrompt) return letter;
              if (hintLevel >= 3 && index === 0) return letter;
              return "?";
          })
        : [];
    const currentSoundPhonic = currentSoundTargetId ? getPhonicById(currentSoundTargetId) : null;
    const currentWordVisual = currentWord?.visual;

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
                    <p className={styles.kicker}>LISTEN / VISUALIZE / SPELL</p>
                    <h1 className={styles.title}>Spelling Lab</h1>
                </div>
                <nav className={styles.nav}>
                    <Link className={styles.navLink} href="/">
                        トップ
                    </Link>
                    <Link className={styles.navLink} href="/svo">
                        Puzzle Grammar
                    </Link>
                    <Link className={styles.navLink} href="/quiz-maker">
                        Quiz Maker
                    </Link>
                </nav>
            </header>

            <section className={styles.modeTabs} aria-label="学習ステップ">
                <button className={mode === "setup" ? styles.modeActive : styles.modeButton} onClick={() => setMode("setup")}>
                    1. Sound Set
                </button>
                <button className={mode === "poster" ? styles.modeActive : styles.modeButton} onClick={() => setMode("poster")}>
                    2. Sound Cards
                </button>
                <button
                    className={mode === "challenge" || mode === "soundQuiz" ? styles.modeActive : styles.modeButton}
                    onClick={startChallenge}
                    disabled={selectedLevel.mode !== "practice-first" && levelWords.length === 0}
                >
                    {selectedLevel.mode === "practice-first" ? "3. Sound Check" : "3. Spelling Quiz"}
                </button>
            </section>

            {mode === "setup" && (
                <section className={styles.panel}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>音のセットを選ぶ</h2>
                            <p>今日扱うレベルと音カードを選択します。Level 0 は音と文字の対応確認から始めます。</p>
                        </div>
                        <div className={styles.countBadge}>{selectedLevel.label}</div>
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
                                >
                                    <Image src={phonic.image} alt="" width={220} height={140} className={styles.selectorImage} />
                                    <span>{phonic.symbol}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className={styles.summaryBar}>
                        <span>出題できる単語: {levelWords.length}</span>
                        {selectedLevel.mode !== "practice-first" && <span>今日の残り {availableWords.length}問</span>}
                        <span>{availableWords.map((word) => word.text).join(", ") || (isLevelCompleteToday ? "今日のQuizは完了" : "未設定")}</span>
                        {availableWords.length < 3 && !isLevelCompleteToday && <span className={styles.warningText}>{LOW_WORD_COUNT_HINT}</span>}
                    </div>

                    {selectedLevel.mode !== "practice-first" && availableWords.length > 0 && (
                        <div className={styles.wordPreviewGrid} aria-label="今日の単語">
                            {availableWords.slice(0, 12).map((word) => {
                                const visual = word.visual;
                                return (
                                    <button
                                        key={word.id}
                                        className={`${styles.wordPreviewCard} ${visual ? WORD_VISUAL_TONE_CLASS[visual.tone] : styles.visualSky}`}
                                        onClick={() => startWordChallenge(word)}
                                        type="button"
                                    >
                                        <span className={styles.wordPreviewIcon}>{visual?.icon ?? word.text[0]}</span>
                                        <span className={styles.wordPreviewMeta}>
                                            <strong>{visual?.labelJa ?? word.text}</strong>
                                            <small>{word.phonics.join(" / ")}</small>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {mode === "poster" && (
                <section className={styles.panel}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>Sound Cards</h2>
                            <p>カードを押すと音声が再生されます。文字と音の対応を確認してからQuizへ進みます。</p>
                        </div>
                        <button
                            className={styles.primaryButton}
                            onClick={startChallenge}
                            disabled={selectedLevel.mode !== "practice-first" && levelWords.length === 0}
                        >
                            {selectedLevel.mode === "practice-first" ? "Sound Checkへ" : "Quiz Start"}
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
                            <h2>Sound Check</h2>
                            <p>再生された音を聞いて、対応するカードを選びます。</p>
                        </div>
                        <div className={styles.countBadge}>{selectedLevel.label}</div>
                    </div>

                    {currentSoundPhonic ? (
                        <>
                            <div className={styles.soundQuizPanel}>
                                <p className={styles.kicker}>SOUND CHECK</p>
                                <h3>Which sound?</h3>
                                <div className={styles.soundMysterySlot} aria-label="音の問題">
                                    <span>[?]</span>
                                </div>
                                <div className={styles.bigActions}>
                                    <button className={styles.primaryButton} onClick={playCurrentSoundTarget}>
                                        Play sound
                                    </button>
                                    <button className={styles.secondaryButton} onClick={playCurrentSoundTarget}>
                                        Replay
                                    </button>
                                </div>
                                <FeedbackBadge kind={soundQuizFeedbackKind} />
                                <p className={`${styles.feedback} ${styles[soundQuizFeedbackKind]}`}>{soundQuizFeedback}</p>
                            </div>

                            <div className={styles.soundChoiceGrid} aria-label="音あてカード">
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

                            <div className={styles.actions}>
                                <button className={styles.primaryButton} onClick={chooseNextSoundTarget}>
                                    Next
                                </button>
                                <button className={styles.secondaryButton} onClick={() => setMode("poster")}>
                                    Sound Cardsへ
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <h2>Sound Cards を選択してください</h2>
                            <p>レベルを選び直してください。</p>
                            <button className={styles.primaryButton} onClick={() => setMode("setup")}>
                                Sound Setへ
                            </button>
                        </div>
                    )}
                </section>
            )}

            {mode === "challenge" && (
                <section className={styles.challengeLayout}>
                    <aside className={styles.sidePoster}>
                        <h2>Sound Cards</h2>
                        <p className={styles.sideNote}>カードをクリックまたはタップすると、空いているスロットに入ります。</p>
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
                                <p className={styles.kicker}>SPELLING</p>
                                <h2>Spelling Quiz</h2>
                            </div>
                            <div className={styles.countBadge}>
                                残り {availableWords.length}問
                            </div>
                        </div>

                        {currentWord ? (
                            <>
                                <div className={styles.wordQuizStage}>
                                    <div
                                        className={`${styles.wordPicture} ${
                                            currentWordVisual ? WORD_VISUAL_TONE_CLASS[currentWordVisual.tone] : styles.visualSky
                                        }`}
                                        aria-label={currentWordVisual ? `${currentWordVisual.labelJa}の画像ヒント` : "画像ヒント"}
                                    >
                                        <span className={styles.wordPictureIcon}>{currentWordVisual?.icon ?? currentWord.text[0]}</span>
                                        <span className={styles.wordPictureLabel}>{currentWordVisual?.labelJa ?? "画像ヒント"}</span>
                                        <span className={styles.wordPictureClue}>{currentWordVisual?.clueJa ?? "音をよくきこう"}</span>
                                    </div>

                                    <div className={styles.wordSoundBoard}>
                                        <p className={styles.promptLabel}>Picture + Sound → Spelling</p>
                                        <div className={styles.blankWord} aria-label="文字数">
                                            {hiddenLetters.map((letter, index) =>
                                                hintLevel >= 2 ? (
                                                    <button
                                                        key={`${letter}-${index}`}
                                                        className={styles.soundSlot}
                                                        onClick={() => playSoundPart(index)}
                                                        type="button"
                                                        aria-label={`${index + 1}番目の音`}
                                                    >
                                                        {letter === "?" ? "[?]" : letter}
                                                    </button>
                                                ) : (
                                                    <span key={`${letter}-${index}`}>{letter === "?" ? "[?]" : letter}</span>
                                                ),
                                            )}
                                        </div>
                                        {feedbackKind === "correct" && (
                                            <div className={styles.wordReveal} aria-live="polite">
                                                <strong>{currentWord.text}</strong>
                                                <span>{currentWord.phonics.join(" + ")}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.bigActions}>
                                    <button className={styles.primaryButton} onClick={() => playWord(false)}>
                                        Play word
                                    </button>
                                    <button
                                        className={styles.secondaryButton}
                                        onClick={() => {
                                            setHintLevel((level) => Math.max(level, 1));
                                            playWord(false);
                                        }}
                                    >
                                        Replay
                                    </button>
                                    <button className={styles.secondaryButton} onClick={playWordParts}>
                                        Break sounds
                                    </button>
                                    <button
                                        className={styles.secondaryButton}
                                        onClick={() => {
                                            setHintLevel((level) => Math.max(level, 2));
                                        }}
                                    >
                                        Hint
                                    </button>
                                    <button className={styles.secondaryButton} onClick={() => setHintLevel((level) => Math.max(level, 3))}>
                                        First letter
                                    </button>
                                    <button className={styles.secondaryButton} onClick={() => setHintLevel((level) => Math.max(level, 4))}>
                                        Sound list
                                    </button>
                                </div>

                                <section className={styles.slotPanel} aria-label="こたえスロット">
                                    <h3>音カードを並べる</h3>
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
                                            <div className={styles.incorrectSlotBadge} aria-label="もう一度考えよう" role="img">
                                                ?
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.actions}>
                                        <button className={styles.primaryButton} onClick={checkAnswer}>
                                            Check
                                        </button>
                                        <button className={styles.secondaryButton} onClick={resetSlots}>
                                            Clear
                                        </button>
                                    </div>
                                    <p className={`${styles.feedback} ${styles[feedbackKind]}`}>{feedback}</p>
                                    {feedbackKind === "tryAgain" && (
                                        <button
                                            className={`${styles.secondaryButton} ${styles.retryButton}`}
                                            onClick={retryWordAnswer}
                                            type="button"
                                        >
                                            Retry
                                        </button>
                                    )}
                                </section>

                                <div className={styles.hintBox}>
                                    {hintLevel === 0 && <p>画像と音声を手がかりに、音カードでスペルを組み立てよう。</p>}
                                    {hintLevel >= 1 && <p>もう一度聞いて、口でも発音してみよう。</p>}
                                    {hintLevel >= 2 && <p>Hint: 上の [?] を押すと、その位置の音だけ確認できます。</p>}
                                    {hintLevel >= 3 && <p className={styles.phonemeText}>First letter: {hintThreeText}</p>}
                                    {hintLevel >= 4 && <p className={styles.phonemeText}>Sound list: {hintFourText}</p>}
                                </div>

                                <div className={styles.actions}>
                                    <button className={styles.primaryButton} onClick={() => chooseNextWord(false)}>
                                        Next
                                    </button>
                                    <button className={styles.secondaryButton} onClick={() => chooseNextWord(true)}>
                                        Retry word
                                    </button>
                                    <button className={styles.secondaryButton} onClick={resetUsedWords}>
                                        Reset today
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                {isLevelCompleteToday ? (
                                    <>
                                        <h2>今日の Spelling Quiz は完了です</h2>
                                        <p>必要ならリセットして復習できます。</p>
                                        <button className={styles.primaryButton} onClick={resetTodayCorrectWordsForLevel}>
                                            Reset and retry
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h2>出題できる単語がありません</h2>
                                        <p>レベルを選び直してください。</p>
                                        <button className={styles.primaryButton} onClick={() => setMode("setup")}>
                                            Sound Setへ
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </section>
                </section>
            )}

            <p className={styles.notice}>{notice}</p>
            <BootDebugOverlay enabled={debugEnabled} step={bootStep} storageError={debugEnabled ? storageError : null} />
        </main>
    );
}
