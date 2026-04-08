export type Card = {
  id: number;
  subject: string;
  verb: string;
  object: string;
  sentence: string;
  subject_zh: string;
  verb_zh: string;
  object_zh: string;
  sentence_zh: string;
  image: string;
};

export type Mode = "flash" | "karuta";
export type ContentLang = "en" | "zh";
export type UiLang = "en" | "ja" | "zh";
export type ArticleMode = "easy" | "hard";
export type AiLevel = "easy" | "normal" | "hard";
export type GameState = "idle" | "countdown" | "playing" | "paused" | "finished";

export type Feedback = {
  value: string;
  isCorrect: boolean;
};

export type TrickSentence = {
  s: string;
  v: string;
  o: string;
  sentence: string;
};
