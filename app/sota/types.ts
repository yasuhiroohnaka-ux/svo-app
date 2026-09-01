export type SotaSpread = {
  id: string;
  artPage: number;
  textPage: number;
  artFile: string;
  textEn: string;
  sceneJa: string;
  artNotesJa: string;
  colorNotesJa?: string;
  keywords: string[];
  hintJa: string;
  summaryJa: string;
  distractors: string[];
};

export type SotaBook = {
  bookId: string;
  title: string;
  author: string;
  copyright: string;
  structure: unknown;
  characters: unknown;
  spreads: SotaSpread[];
};

export type SotaImageVariant = "lineart" | "color";

export type SotaProgress = {
  cleared: string[];
};
