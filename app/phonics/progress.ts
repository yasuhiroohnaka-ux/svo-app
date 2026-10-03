import { createPersistentStore } from "@/app/lib/persistentStore";

export type CorrectWordsByLevel = Record<string, string[]>;

const CORRECT_WORDS_STORAGE_PREFIX = "phonics.correctWords.";
const AUTO_ADVANCE_STORAGE_KEY = "phonics.autoAdvance";

const getLocalDateStamp = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
};

const getCorrectWordsStorageKey = (): string => `${CORRECT_WORDS_STORAGE_PREFIX}${getLocalDateStamp()}`;

const EMPTY_CORRECT_WORDS: CorrectWordsByLevel = {};

const parseCorrectWordsByLevel = (value: unknown): CorrectWordsByLevel => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_CORRECT_WORDS;

    return Object.fromEntries(
        Object.entries(value)
            .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
            .map(([levelId, wordIds]) => [levelId, wordIds.filter((wordId): wordId is string => typeof wordId === "string")]),
    );
};

// 「きょう正解したことば」は日付ごとのキーに保存する(日付が変わると自然にリセットされる)
export const correctWordsStore = createPersistentStore<CorrectWordsByLevel>({
    key: getCorrectWordsStorageKey,
    fallback: EMPTY_CORRECT_WORDS,
    parse: parseCorrectWordsByLevel,
});

export const autoAdvanceStore = createPersistentStore<boolean>({
    key: AUTO_ADVANCE_STORAGE_KEY,
    fallback: true,
    parse: (value) => value !== false,
});
