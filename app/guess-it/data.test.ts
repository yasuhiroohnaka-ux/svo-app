import { describe, expect, it } from "vitest";

import { buildQuestionDeck, findGuessItem, NOUNS, QUESTIONS, remainingCandidates, type Clue } from "./data";

describe("Word Detective data", () => {
  it("every secret word can be told apart by the questions", () => {
    const signatures = new Map<string, string[]>();
    for (const noun of NOUNS) {
      const signature = QUESTIONS.map((q) => (noun.facts[q.key] ? "1" : "0")).join("");
      signatures.set(signature, [...(signatures.get(signature) ?? []), noun.word]);
    }
    const clashes = [...signatures.values()].filter((words) => words.length > 1);
    expect(clashes).toEqual([]);
  });

  it("has unique ids", () => {
    expect(new Set(NOUNS.map((n) => n.id)).size).toBe(NOUNS.length);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it("accepts guesses in English, Japanese and romaji", () => {
    expect(findGuessItem("Is it an apple?")?.id).toBe("apple");
    expect(findGuessItem("りんご")?.id).toBe("apple");
    expect(findGuessItem("ringo")?.id).toBe("apple");
    expect(findGuessItem("spaceship")).toBeUndefined();
  });

  it("builds a stable 22-question deck for a seed", () => {
    const deck = buildQuestionDeck(NOUNS[0], 42, "guided");
    expect(deck).toHaveLength(22);
    expect(buildQuestionDeck(NOUNS[0], 42, "guided")).toEqual(deck);
  });

  it("the detective board never removes the secret word", () => {
    for (const target of NOUNS) {
      const clues: Clue[] = QUESTIONS.slice(0, 8).map((q) => ({ key: q.key, answer: target.facts[q.key] === true }));
      const remaining = remainingCandidates(clues);
      expect(remaining.map((n) => n.id)).toContain(target.id);
      expect(remaining.length).toBeLessThan(NOUNS.length);
    }
  });

  it("asking every question leaves only the secret word", () => {
    const target = NOUNS[0];
    const clues: Clue[] = QUESTIONS.map((q) => ({ key: q.key, answer: target.facts[q.key] === true }));
    expect(remainingCandidates(clues).map((n) => n.id)).toEqual([target.id]);
  });
});
