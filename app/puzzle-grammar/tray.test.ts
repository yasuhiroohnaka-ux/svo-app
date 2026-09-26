import { describe, expect, it } from "vitest";

import type { PuzzleCard } from "@/app/lib/lv2Cards";

import { buildTray, correctLabel, pickDummy, ROLES } from "./tray";

const card = (id: number, subject: string, verb: string, object: string, pattern: "svo" | "svc" = "svo"): PuzzleCard => ({
  id,
  subject,
  verb,
  object,
  sentence: `${subject} ${verb} ${object}.`,
  subject_zh: "",
  verb_zh: "",
  object_zh: "",
  sentence_zh: "",
  image: `/images/${id}.png`,
  pattern,
});

const deck = [
  card(1, "A dog", "eats", "an apple"),
  card(2, "A girl", "washes", "a car"),
  card(3, "A boy", "has", "a ball"),
  card(101, "Two cats", "are", "sleepy", "svc"),
  card(102, "A bird", "is", "happy", "svc"),
];

describe("Puzzle Grammar tray", () => {
  it("has one correct and one dummy piece per role", () => {
    for (const current of deck) {
      const tray = buildTray(current, deck, 1);
      expect(tray).toHaveLength(6);
      for (const role of ROLES) {
        const pieces = tray.filter((piece) => piece.role === role);
        expect(pieces).toHaveLength(2);
        expect(pieces.filter((piece) => piece.label === correctLabel(current, role))).toHaveLength(1);
      }
    }
  });

  it("uses the singular/plural verb as the level 2 trap", () => {
    expect(pickDummy(deck[3], deck, "verb", 2)).toBe("is");
    expect(pickDummy(deck[0], deck, "verb", 2)).toBe("eat");
  });

  it("picks complements from SVC cards for the third slot", () => {
    expect(pickDummy(deck[3], deck, "object", 2)).toBe("happy");
  });

  it("prefers reviewed distractors", () => {
    const reviewed = { ...deck[0], distractors: { subject: "A cat", verb: "eat", object: "a lemon" } };
    expect(pickDummy(reviewed, deck, "object", "stories")).toBe("a lemon");
  });
});
