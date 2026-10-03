import { createPersistentStore } from "./persistentStore";

/**
 * 「にがて」カードの記録(きょうのダンジョンの ふくしゅう問題に使う)。
 * - svo: SVOカルタ・Puzzle Grammar で まちがえた SVO カード(svo_cards.json の id)
 * - quiz: Quiz Maker で まちがえたカード(quiz_data.json の id)
 * まちがえるたびに +1、ふくしゅうで正解すると -1 して、0 になったら消える。
 */
export type MistakeKind = "svo" | "quiz";

type MistakeMap = Record<string, number>;

const EMPTY: MistakeMap = {};

export const mistakesStore = createPersistentStore<MistakeMap>({
  key: "kotoba.mistakes.v1",
  fallback: EMPTY,
  parse: (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY;
    const result: MistakeMap = {};
    for (const [key, count] of Object.entries(value)) {
      if (typeof count === "number" && count > 0) result[key] = Math.floor(count);
    }
    return result;
  },
});

const keyOf = (kind: MistakeKind, id: string | number) => `${kind}:${id}`;

export function recordMistake(kind: MistakeKind, id: string | number): void {
  mistakesStore.update((current) => ({ ...current, [keyOf(kind, id)]: (current[keyOf(kind, id)] ?? 0) + 1 }));
}

export function resolveMistake(kind: MistakeKind, id: string | number): void {
  mistakesStore.update((current) => {
    const key = keyOf(kind, id);
    if (!current[key]) return current;
    const next = { ...current };
    if (next[key] <= 1) delete next[key];
    else next[key] -= 1;
    return next;
  });
}

/** まちがえた回数が多い順の id */
export function weakIds(map: MistakeMap, kind: MistakeKind): string[] {
  const prefix = `${kind}:`;
  return Object.entries(map)
    .filter(([key]) => key.startsWith(prefix))
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key.slice(prefix.length));
}
