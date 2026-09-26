/** ことばダンジョンのアプリ(部屋)と階層の一覧。ポータルと「つづきから」で使う */

export type FloorId = "sound" | "sentence" | "story" | "secret";

export type Floor = {
  id: FloorId;
  badge: string;
  name: string;
  desc: string;
};

export type AppId = "phonics" | "maze" | "puzzle" | "svo" | "quiz" | "story" | "sota" | "rhyme" | "guess";

export type AppInfo = {
  id: AppId;
  href: string;
  title: string;
  icon: string;
  accent: string;
  floor: FloorId;
  desc: string;
  tags: string[];
};

export const FLOORS: Floor[] = [
  { id: "sound", badge: "B1", name: "おとの かい", desc: "おとを きいて、ことばの もとを あつめよう" },
  { id: "sentence", badge: "B2", name: "ぶんの かい", desc: "ことばを つないで、ぶんを つくろう" },
  { id: "story", badge: "B3", name: "おはなしの かい", desc: "おはなしや うたを、よんで きこう" },
  { id: "secret", badge: "??", name: "かくし べや", desc: "なぞを といて、ひみつの ことばを あてよう" },
];

export const APPS: AppInfo[] = [
  {
    id: "phonics",
    href: "/phonics",
    title: "oto-man",
    icon: "🔊",
    accent: "var(--accent-phonics)",
    floor: "sound",
    desc: "おとを きいて、カードを えらんだり、ことばを つくったり。",
    tags: ["おと", "ことば", "カード"],
  },
  {
    id: "maze",
    href: "/phonics-maze",
    title: "フォニックスめいろ",
    icon: "🧭",
    accent: "var(--accent-maze)",
    floor: "sound",
    desc: "おてほんの リズムどおりに、おとを たどって ゴールへ。",
    tags: ["PHONICS", "MAZE"],
  },
  {
    id: "puzzle",
    href: "/puzzle-grammar",
    title: "Puzzle Grammar",
    icon: "🧩",
    accent: "var(--accent-puzzle)",
    floor: "sentence",
    desc: "えに あわせて ピースを はめて、えいごの ぶんを つくろう。",
    tags: ["SVO", "PUZZLE"],
  },
  {
    id: "svo",
    href: "/svo",
    title: "SVOカルタ",
    icon: "🎴",
    accent: "var(--accent-svo)",
    floor: "sentence",
    desc: "よみあげた ぶんに あう えを、すばやく とろう。AI とも たいせん!",
    tags: ["KARUTA", "VS AI", "TIME"],
  },
  {
    id: "quiz",
    href: "/quiz-maker",
    title: "Quiz Maker",
    icon: "🃏",
    accent: "var(--accent-quiz)",
    floor: "sentence",
    desc: "えを みて、あう ぶんを えらぶ カードクイズ。",
    tags: ["FLASH", "KARUTA", "VOICE"],
  },
  {
    id: "story",
    href: "/storyquiz",
    title: "えほんで えいご",
    icon: "📖",
    accent: "var(--accent-story)",
    floor: "story",
    desc: "みじかい おはなしを きいて、クイズに こたえよう。",
    tags: ["STORY", "QUIZ"],
  },
  {
    id: "sota",
    href: "/sota",
    title: "So-ta The Alien",
    icon: "👽",
    accent: "var(--accent-sota)",
    floor: "story",
    desc: "えいぶんを よんで、えに いろを つけよう。16この ばめんで えほんが かんせい!",
    tags: ["STORY", "PICTURE"],
  },
  {
    id: "rhyme",
    href: "/ymeyme-rhyme",
    title: "Ymeyme-Rhyme",
    icon: "📜",
    accent: "var(--accent-rhyme)",
    floor: "story",
    desc: "まいつきの えいごの うたを、よみあげで きこう。",
    tags: ["POEM", "VOICE"],
  },
  {
    id: "guess",
    href: "/guess-it",
    title: "ことばたんてい",
    icon: "🔍",
    accent: "var(--accent-guess)",
    floor: "secret",
    desc: "Yes / No の しつもんで、ひみつの ことばを あてよう。",
    tags: ["YES/NO", "VOICE"],
  },
];

export function getApp(id: string): AppInfo | undefined {
  return APPS.find((app) => app.id === id);
}

/** 日付ごとに 1 つ選ぶ「きょうの おすすめ」。同じ日なら同じ部屋になる */
export function pickDailyApp(dateStamp: string): AppInfo {
  let hash = 0;
  for (const char of dateStamp) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return APPS[hash % APPS.length];
}
