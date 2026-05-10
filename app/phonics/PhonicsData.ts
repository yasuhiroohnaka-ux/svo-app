export type Phonic = {
    id: string;
    symbol: string;
    image: string; // Path to mouth/char image
    audio?: string;
    pronunciation?: string; // Text for TTS (e.g. "k" for "c")
};

export type Word = {
    id: string;
    text: string;
    phonics: string[]; // sequence of phonic IDs
    level: 1 | 2 | 3 | 4;
    image?: string;
};

export type LessonWord = {
    id: string;
    text: string;
    phonics: string[];
    soundParts: string[];
    level: 1 | 2 | 3 | 4;
    levelIds: string[];
    note?: string;
    audio?: string;
    wordAudio?: string;
};

export type PhonicsLevel = {
    id: string;
    label: string;
    description: string;
    targetIds: string[];
    mode?: "practice-first";
};

export const PHONICS_DATA: Phonic[] = [
    { id: "a", symbol: "a", image: "/images/phonics/cards/a.png", audio: "/audio/phonics/a.m4a", pronunciation: "ah" },
    { id: "b", symbol: "b", image: "/images/phonics/cards/b.png", audio: "/audio/phonics/b.m4a", pronunciation: "b" },
    { id: "c", symbol: "c", image: "/images/phonics/cards/c.png", audio: "/audio/phonics/c_k_q.m4a", pronunciation: "k" },
    { id: "d", symbol: "d", image: "/images/phonics/cards/d.png", audio: "/audio/phonics/d.m4a", pronunciation: "d" },
    { id: "e", symbol: "e", image: "/images/phonics/cards/e.png", audio: "/audio/phonics/e.m4a", pronunciation: "e" },
    { id: "f", symbol: "f", image: "/images/phonics/cards/f.png", audio: "/audio/phonics/f.m4a", pronunciation: "f" },
    { id: "g", symbol: "g", image: "/images/phonics/cards/g.png", audio: "/audio/phonics/g.m4a", pronunciation: "g" },
    { id: "h", symbol: "h", image: "/images/phonics/cards/h.png", audio: "/audio/phonics/h.m4a", pronunciation: "h" },
    { id: "i", symbol: "i", image: "/images/phonics/cards/i.png", audio: "/audio/phonics/i.m4a", pronunciation: "i" },
    { id: "j", symbol: "j", image: "/images/phonics/cards/j.png", audio: "/audio/phonics/j.m4a", pronunciation: "j" },
    { id: "k", symbol: "k", image: "/images/phonics/cards/k.png", audio: "/audio/phonics/c_k_q.m4a", pronunciation: "k" },
    { id: "l", symbol: "l", image: "/images/phonics/cards/l.png", audio: "/audio/phonics/l.m4a", pronunciation: "l" },
    { id: "m", symbol: "m", image: "/images/phonics/cards/m.png", audio: "/audio/phonics/m.m4a", pronunciation: "m" },
    { id: "n", symbol: "n", image: "/images/phonics/cards/n.png", audio: "/audio/phonics/n.m4a", pronunciation: "n" },
    { id: "o", symbol: "o", image: "/images/phonics/cards/o.png", audio: "/audio/phonics/o.m4a", pronunciation: "aw" },
    { id: "p", symbol: "p", image: "/images/phonics/cards/p.png", audio: "/audio/phonics/p.m4a", pronunciation: "p" },
    { id: "q", symbol: "q", image: "/images/phonics/cards/q.png", audio: "/audio/phonics/c_k_q.m4a", pronunciation: "k" },
    { id: "r", symbol: "r", image: "/images/phonics/cards/r.png", audio: "/audio/phonics/r.m4a", pronunciation: "r" },
    { id: "s", symbol: "s", image: "/images/phonics/cards/s.png", audio: "/audio/phonics/s.m4a", pronunciation: "s" },
    { id: "t", symbol: "t", image: "/images/phonics/cards/t.png", audio: "/audio/phonics/t.m4a", pronunciation: "t" },
    { id: "u", symbol: "u", image: "/images/phonics/cards/u.png", audio: "/audio/phonics/u.m4a", pronunciation: "uh" },
    { id: "v", symbol: "v", image: "/images/phonics/cards/v.png", audio: "/audio/phonics/v.m4a", pronunciation: "v" },
    { id: "w", symbol: "w", image: "/images/phonics/cards/w.png", audio: "/audio/phonics/w.m4a", pronunciation: "w" },
    { id: "x", symbol: "x", image: "/images/phonics/cards/x.png", audio: "/audio/phonics/x.m4a", pronunciation: "x" },
    { id: "y", symbol: "y", image: "/images/phonics/cards/y.png", audio: "/audio/phonics/y.m4a", pronunciation: "y" },
    { id: "z", symbol: "z", image: "/images/phonics/cards/z.png", audio: "/audio/phonics/z.m4a", pronunciation: "z" },
];

const LEVEL3_TARGET_IDS = ["a", "e", "i", "o", "u", "p", "n", "t", "b", "d", "g", "c", "k", "m", "l", "r"];
const LEVEL4_TARGET_IDS = [...LEVEL3_TARGET_IDS, "s", "f", "h"];

export const PRIORITY_PHONICS_IDS = LEVEL4_TARGET_IDS;

export const PHONICS_LEVELS: PhonicsLevel[] = [
    {
        id: "level-0",
        label: "レベル0",
        description: "おとを きいて、カードを おぼえよう",
        targetIds: ["a", "e", "o", "p", "n", "t", "b", "d"],
        mode: "practice-first",
    },
    {
        id: "level-1",
        label: "レベル1",
        description: "3もじの クイズに ちょうせん！",
        targetIds: ["a", "e", "o", "p", "n", "t", "b", "d"],
    },
    {
        id: "level-2",
        label: "レベル2",
        description: "にている おとを くらべよう",
        targetIds: ["a", "e", "i", "o", "u", "p", "n", "t", "b", "d", "g", "m"],
    },
    {
        id: "level-3",
        label: "レベル3",
        description: "ことばを ふやそう",
        targetIds: LEVEL3_TARGET_IDS,
    },
    {
        id: "level-4",
        label: "レベル4",
        description: "あたらしい おとで クイズ！",
        targetIds: LEVEL4_TARGET_IDS,
    },
];

export const DEFAULT_LESSON_TARGET_IDS = PHONICS_LEVELS[0].targetIds;

const makeLessonWord = (text: string, phonics: string[], levelIds: string[], level: 1 | 2 | 3 | 4 = 1): LessonWord => ({
    id: text,
    text,
    phonics,
    soundParts: phonics.map((id) => `/${id}/`),
    level,
    levelIds,
});

export const LESSON_WORDS: LessonWord[] = [
    // Level 1 keeps the first word set concrete and short: a/e/o plus p/n/t/b/d.
    { ...makeLessonWord("pen", ["p", "e", "n"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/pen.m4a" },
    { ...makeLessonWord("pet", ["p", "e", "t"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/pet.m4a" },
    { ...makeLessonWord("ten", ["t", "e", "n"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/ten.m4a" },
    { ...makeLessonWord("net", ["n", "e", "t"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/net.m4a" },
    { ...makeLessonWord("tap", ["t", "a", "p"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/tap.m4a" },
    { ...makeLessonWord("pan", ["p", "a", "n"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/pan.m4a" },
    { ...makeLessonWord("nap", ["n", "a", "p"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/nap.m4a" },
    { ...makeLessonWord("bat", ["b", "a", "t"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/bat.m4a" },
    { ...makeLessonWord("bed", ["b", "e", "d"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/bed.m4a" },
    { ...makeLessonWord("pot", ["p", "o", "t"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/pot.m4a" },
    { ...makeLessonWord("top", ["t", "o", "p"], ["level-1", "level-2", "level-3", "level-4"]), wordAudio: "/audio/phonics/words/level1/top.m4a" },

    // Level 2 adds i/u and g/m while keeping every word in the CVC pattern.
    makeLessonWord("bag", ["b", "a", "g"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("big", ["b", "i", "g"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("dig", ["d", "i", "g"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("dog", ["d", "o", "g"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("mop", ["m", "o", "p"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("map", ["m", "a", "p"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("bug", ["b", "u", "g"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("mug", ["m", "u", "g"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("gum", ["g", "u", "m"], ["level-2", "level-3", "level-4"], 2),
    makeLessonWord("mud", ["m", "u", "d"], ["level-2", "level-3", "level-4"], 2),

    // Level 3 expands into c/k/l/r with familiar CVC words and useful sound contrasts.
    makeLessonWord("cat", ["c", "a", "t"], ["level-3", "level-4"], 3),
    makeLessonWord("cap", ["c", "a", "p"], ["level-3", "level-4"], 3),
    makeLessonWord("cup", ["c", "u", "p"], ["level-3", "level-4"], 3),
    makeLessonWord("cut", ["c", "u", "t"], ["level-3", "level-4"], 3),
    makeLessonWord("kid", ["k", "i", "d"], ["level-3", "level-4"], 3),
    makeLessonWord("kit", ["k", "i", "t"], ["level-3", "level-4"], 3),
    makeLessonWord("leg", ["l", "e", "g"], ["level-3", "level-4"], 3),
    makeLessonWord("lip", ["l", "i", "p"], ["level-3", "level-4"], 3),
    makeLessonWord("log", ["l", "o", "g"], ["level-3", "level-4"], 3),
    makeLessonWord("red", ["r", "e", "d"], ["level-3", "level-4"], 3),
    makeLessonWord("run", ["r", "u", "n"], ["level-3", "level-4"], 3),
    makeLessonWord("rat", ["r", "a", "t"], ["level-3", "level-4"], 3),

    // Level 4 adds s/f/h but stays inside short-vowel CVC words.
    makeLessonWord("sun", ["s", "u", "n"], ["level-4"], 4),
    makeLessonWord("sit", ["s", "i", "t"], ["level-4"], 4),
    makeLessonWord("sad", ["s", "a", "d"], ["level-4"], 4),
    makeLessonWord("sip", ["s", "i", "p"], ["level-4"], 4),
    makeLessonWord("fan", ["f", "a", "n"], ["level-4"], 4),
    makeLessonWord("fin", ["f", "i", "n"], ["level-4"], 4),
    makeLessonWord("fog", ["f", "o", "g"], ["level-4"], 4),
    makeLessonWord("hat", ["h", "a", "t"], ["level-4"], 4),
    makeLessonWord("hen", ["h", "e", "n"], ["level-4"], 4),
    makeLessonWord("hot", ["h", "o", "t"], ["level-4"], 4),
];

export const WORDS_DATA: Word[] = [
    // Level 1: Basic CV / CVC
    { id: "cat", text: "cat", phonics: ["c", "a", "t"], level: 1 },
    { id: "dog", text: "dog", phonics: ["d", "o", "g"], level: 1 },
    { id: "bat", text: "bat", phonics: ["b", "a", "t"], level: 1 },
    { id: "go", text: "go", phonics: ["g", "o"], level: 1 },
    { id: "no", text: "no", phonics: ["n", "o"], level: 1 },

    // Level 2: Magic 'e' (CVCe)
    { id: "cake", text: "cake", phonics: ["c", "a", "k", "e"], level: 2 },
    { id: "kite", text: "kite", phonics: ["k", "i", "t", "e"], level: 2 },
    { id: "cute", text: "cute", phonics: ["c", "u", "t", "e"], level: 2 },

    // Level 3: Double Consonants
    { id: "apple", text: "apple", phonics: ["a", "p", "p", "l", "e"], level: 3 },
    { id: "letter", text: "letter", phonics: ["l", "e", "t", "t", "e", "r"], level: 3 },
    // { id: "rabbit", text: "rabbit", phonics: ["r", "a", "b", "b", "i", "t"], level: 3 },
];
