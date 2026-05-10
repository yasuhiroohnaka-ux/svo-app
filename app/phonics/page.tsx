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

const LOW_WORD_COUNT_HINT = "ことばが少ないときは、ほかのレベルも 見てみよう。";
const WORD_AUDIO_GUIDE = "きいて、まねして、こえにだしてみよう。";
const CORRECT_WORDS_STORAGE_PREFIX = "phonics.correctWords.";
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

const getEntryMode = (entry: string | null): EntryMode => {
    if (entry === "sound" || entry === "word" || entry === "set") {
        return entry;
    }
    return "direct";
};

const HanamaruMark = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 520 260" aria-hidden="true" focusable="false">
        <path
            className={styles.hanamaruLine}
            d="M260 37 C302 -8 372 12 372 70 C432 58 480 106 438 151 C462 206 385 229 338 195 C313 250 224 240 202 195 C145 224 82 181 116 129 C62 88 119 37 178 61 C190 8 242 -4 260 37 Z"
        />
        <path
            className={styles.hanamaruInnerLine}
            d="M301 86 C233 64 181 118 206 171 C233 228 344 196 344 125 C344 74 255 66 231 127 C213 173 274 192 308 154 C335 124 306 103 273 115"
        />
        <path className={styles.hanamaruAccentLine} d="M118 92 C136 81 153 75 174 72" />
        <path className={styles.hanamaruAccentLine} d="M382 78 C406 80 425 89 440 105" />
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
                setSoundQuizFeedback("きいて、どのカードか さがそう。");
                setSoundQuizFeedbackKind("idle");
                setMode("soundQuiz");
                setNotice("きいてみよう を おしてね。");
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
            setFeedback("まずは ことばを きいてみよう。");
            setFeedbackKind("idle");
            setCurrentSoundTargetId(null);
            setUsedSoundTargetIds([]);
            setSoundQuizAnswered(false);
            setMode(isWordEntry ? "challenge" : "setup");
            setNotice(isWordEntry ? "きいて、カードをならべてみよう。" : "レベル1のカードで はじめよう。");
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
            setNotice("きいて、カードをならべてみよう。");
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
        if (selectedLevel.mode === "practice-first") {
            startSoundQuiz();
            return;
        }

        setMode("challenge");
        chooseNextWord(false);
    };

    const chooseNextSoundTarget = () => {
        const nextTargetId = pickRandomId(selectedIds, usedSoundTargetIds);
        setCurrentSoundTargetId(nextTargetId);
        setSoundQuizAnswered(false);
        setSoundQuizFeedback("きいて、どのカードか さがそう。");
        setSoundQuizFeedbackKind("idle");

        if (nextTargetId) {
            setUsedSoundTargetIds((current) => (current.includes(nextTargetId) ? current : [...current, nextTargetId]));
            setNotice("きいてみよう を おしてね。");
        } else {
            setNotice("おとカードを えらんでみよう。");
            setSoundQuizFeedback("きょうの おとを えらんでね。");
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
            setSoundQuizFeedback("できた！");
            setSoundQuizFeedbackKind("correct");
        } else {
            setSoundQuizFeedback("もういちど きいてみよう。");
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
            setFeedback("いっぱいだよ。いらないカードを タップして はずそう。");
            setFeedbackKind("empty");
            return;
        }

        setAnswerSlots((current) => {
            const next = [...current];
            next[nextEmptyIndex] = id;
            return next;
        });
        setFeedback("ならべてみよう。");
        setFeedbackKind("idle");
    };

    const placeCardInSlot = (id: string, slotIndex: number) => {
        if (!currentWord) return;

        setAnswerSlots((current) => {
            const next = [...current];
            next[slotIndex] = id;
            return next;
        });
        setFeedback("ならべてみよう。");
        setFeedbackKind("idle");
    };

    const removeSlot = (slotIndex: number) => {
        setAnswerSlots((current) => {
            const next = [...current];
            next[slotIndex] = null;
            return next;
        });
        setFeedback("はずしたよ。もういちど えらんでね。");
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
            setFeedback("できた！");
            setFeedbackKind("correct");
        } else {
            setFeedback("もういちど きいてみよう。");
            setFeedbackKind("tryAgain");
        }
    };

    const retryWordAnswer = () => {
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

            <section className={styles.modeTabs} aria-label="あそびのながれ">
                <button className={mode === "setup" ? styles.modeActive : styles.modeButton} onClick={() => setMode("setup")}>
                    1. きょうの おと
                </button>
                <button className={mode === "poster" ? styles.modeActive : styles.modeButton} onClick={() => setMode("poster")}>
                    2. おとカード
                </button>
                <button
                    className={mode === "challenge" || mode === "soundQuiz" ? styles.modeActive : styles.modeButton}
                    onClick={startChallenge}
                    disabled={selectedLevel.mode !== "practice-first" && levelWords.length === 0}
                >
                    {selectedLevel.mode === "practice-first" ? "3. おとを さがそう" : "3. クイズに ちょうせん！"}
                </button>
            </section>

            {mode === "setup" && (
                <section className={styles.panel}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>きょうの おと</h2>
                            <p>レベルをえらんで、おとをたしかめよう。レベル0は、おとカードから はじめるよ。</p>
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
                        <span>つくれる ことば: {levelWords.length}</span>
                        {selectedLevel.mode !== "practice-first" && <span>きょう のこり {availableWords.length}もん</span>}
                        <span>{availableWords.map((word) => word.text).join(", ") || (isLevelCompleteToday ? "きょうは ぜんぶ できた！" : "まだないよ")}</span>
                        {availableWords.length < 3 && !isLevelCompleteToday && <span className={styles.warningText}>{LOW_WORD_COUNT_HINT}</span>}
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
                            {selectedLevel.mode === "practice-first" ? "おとあてへ" : "クイズへ"}
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
                                <div className={styles.bigActions}>
                                    <button className={styles.primaryButton} onClick={playCurrentSoundTarget}>
                                        きいてみよう
                                    </button>
                                    <button className={styles.secondaryButton} onClick={playCurrentSoundTarget}>
                                        もういちど きく
                                    </button>
                                </div>
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

                            <div className={styles.actions}>
                                <button className={styles.primaryButton} onClick={chooseNextSoundTarget}>
                                    つぎへ
                                </button>
                                <button className={styles.secondaryButton} onClick={() => setMode("poster")}>
                                    おとカードへ
                                </button>
                            </div>
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

                                <div className={styles.bigActions}>
                                    <button className={styles.primaryButton} onClick={() => playWord(false)}>
                                        きいてみよう
                                    </button>
                                    <button
                                        className={styles.secondaryButton}
                                        onClick={() => {
                                            setHintLevel((level) => Math.max(level, 1));
                                            playWord(false);
                                        }}
                                    >
                                        もういちど きく
                                    </button>
                                    <button
                                        className={styles.secondaryButton}
                                        onClick={() => {
                                            setHintLevel((level) => Math.max(level, 2));
                                        }}
                                    >
                                        ヒント
                                    </button>
                                    <button className={styles.secondaryButton} onClick={() => setHintLevel((level) => Math.max(level, 3))}>
                                        はじめをみる
                                    </button>
                                    <button className={styles.secondaryButton} onClick={() => setHintLevel((level) => Math.max(level, 4))}>
                                        つかうカード
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
                                    <div className={styles.actions}>
                                        <button className={styles.primaryButton} onClick={checkAnswer}>
                                            あわせてみる
                                        </button>
                                        <button className={styles.secondaryButton} onClick={resetSlots}>
                                            からにする
                                        </button>
                                    </div>
                                    <p className={`${styles.feedback} ${styles[feedbackKind]}`}>{feedback}</p>
                                    {feedbackKind === "tryAgain" && (
                                        <button
                                            className={`${styles.secondaryButton} ${styles.retryButton}`}
                                            onClick={retryWordAnswer}
                                            type="button"
                                        >
                                            さいチャレンジ
                                        </button>
                                    )}
                                </section>

                                <div className={styles.hintBox}>
                                    {hintLevel === 0 && <p>きこえた音を、カードでならべよう。</p>}
                                    {hintLevel >= 1 && <p>もういちど きいて、口でもいってみよう。</p>}
                                    {hintLevel >= 2 && <p>ヒント: 上の [?] をおすと、その場所のおとだけ聞けるよ。</p>}
                                    {hintLevel >= 3 && <p className={styles.phonemeText}>はじめ: {hintThreeText}</p>}
                                    {hintLevel >= 4 && <p className={styles.phonemeText}>つかうカード: {hintFourText}</p>}
                                </div>

                                <div className={styles.actions}>
                                    <button className={styles.primaryButton} onClick={() => chooseNextWord(false)}>
                                        つぎへ
                                    </button>
                                    <button className={styles.secondaryButton} onClick={() => chooseNextWord(true)}>
                                        もういっかい
                                    </button>
                                    <button className={styles.secondaryButton} onClick={resetUsedWords}>
                                        でたことば リセット
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                {isLevelCompleteToday ? (
                                    <>
                                        <h2>きょうの クイズは ぜんぶ できた！</h2>
                                        <p>また あした あそぼう。</p>
                                        <button className={styles.primaryButton} onClick={resetTodayCorrectWordsForLevel}>
                                            もういちど やる
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h2>つくれる ことばが ないよ</h2>
                                        <p>レベルを えらびなおしてみよう。</p>
                                        <button className={styles.primaryButton} onClick={() => setMode("setup")}>
                                            きょうの おとへ
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
