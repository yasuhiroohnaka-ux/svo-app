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
    level: 1 | 2 | 3;
    image?: string;
};

// Initial Phonics Set (using placeholders where needed)
export const PHONICS_DATA: Phonic[] = [
    { id: "a", symbol: "a", image: "/images/phonics/media__1771519031745.png", pronunciation: "apple" }, // specific word for short a? or just "a"
    { id: "o", symbol: "o", image: "/images/phonics/media__1771519165248.png", pronunciation: "hot" },
    { id: "u", symbol: "u", image: "/images/phonics/media__1771519175425.png", pronunciation: "up" },
    { id: "c", symbol: "c", image: "/images/phonics/media__1771519186730.png", pronunciation: "k" },
    { id: "t", symbol: "t", image: "/images/phonics/media__1771519186811.png", pronunciation: "t" },
    // Placeholders for expanded vocab
    { id: "b", symbol: "b", image: "/images/phonics/placeholder.png", pronunciation: "b" },
    { id: "d", symbol: "d", image: "/images/phonics/placeholder.png", pronunciation: "d" },
    { id: "g", symbol: "g", image: "/images/phonics/placeholder.png", pronunciation: "g" },
    { id: "e", symbol: "e", image: "/images/phonics/placeholder.png", pronunciation: "e" },
    { id: "i", symbol: "i", image: "/images/phonics/placeholder.png", pronunciation: "i" },
    { id: "k", symbol: "k", image: "/images/phonics/placeholder.png", pronunciation: "k" },
    { id: "n", symbol: "n", image: "/images/phonics/placeholder.png", pronunciation: "n" },
    { id: "p", symbol: "p", image: "/images/phonics/placeholder.png", pronunciation: "p" },
    { id: "l", symbol: "l", image: "/images/phonics/placeholder.png", pronunciation: "l" },
    { id: "r", symbol: "r", image: "/images/phonics/placeholder.png", pronunciation: "r" },
    { id: "m", symbol: "m", image: "/images/phonics/placeholder.png", pronunciation: "m" },
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
