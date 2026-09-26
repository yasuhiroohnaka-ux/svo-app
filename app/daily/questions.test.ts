import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeCards } from "@/app/svo/data";

import { buildDailyQuestions, DAILY_QUESTION_COUNT, type QuizCard } from "./questions";

const root = path.resolve(__dirname, "../..");
const readJson = (file: string) => JSON.parse(readFileSync(path.join(root, file), "utf8").replace(/^﻿/, ""));
const svoCards = normalizeCards(readJson("public/data/svo_cards.json"));
const quizCards = readJson("public/data/quiz_data.json") as QuizCard[];

describe("daily dungeon questions", () => {
  it("is the same for the same day and different on another day", () => {
    const a = buildDailyQuestions("2026-09-26", { svoCards, quizCards });
    expect(buildDailyQuestions("2026-09-26", { svoCards, quizCards })).toEqual(a);
    expect(buildDailyQuestions("2026-09-27", { svoCards, quizCards })).not.toEqual(a);
  });

  it("always has five answerable questions over many days", () => {
    for (let day = 1; day <= 60; day += 1) {
      const date = `2026-10-${String(day).padStart(2, "0")}`;
      const questions = buildDailyQuestions(date, { svoCards, quizCards });
      expect(questions, date).toHaveLength(DAILY_QUESTION_COUNT);
      expect(new Set(questions.map((q) => q.id)).size).toBe(DAILY_QUESTION_COUNT);
      for (const q of questions) {
        if (q.kind === "listen") {
          expect(q.choices.map((c) => c.id)).toContain(q.answerId);
          expect(new Set(q.choices.map((c) => c.image)).size).toBe(q.choices.length);
        }
        if (q.kind === "read") {
          expect(q.choices).toContain(q.answer);
          expect(new Set(q.choices).size).toBe(3);
        }
        if (q.kind === "sound") expect(q.choices.map((c) => c.id)).toContain(q.answerId);
      }
    }
  });

  it("uses a weak card as the review question", () => {
    const weak = String(svoCards[7].id);
    const questions = buildDailyQuestions("2026-09-26", { svoCards, quizCards, weakSvo: [weak] });
    const review = questions.find((q) => q.review);
    expect(review?.kind).toBe("listen");
    expect(review && "cardId" in review ? review.cardId : "").toBe(weak);
  });

  it("only uses the colored Quiz Maker sets", () => {
    for (let day = 1; day <= 30; day += 1) {
      const q = buildDailyQuestions(`2026-11-${day}`, { svoCards, quizCards }).find((x) => x.kind === "read");
      if (q && q.kind === "read") expect(Number(q.image.match(/img_(\d+)/)?.[1])).toBeLessThan(32);
    }
  });

  it("prefers distractors whose subject differs from the answer", () => {
    const subject = (t: string) => t.toLowerCase().split(/\s+/).slice(0, 2).join(" ");
    let same = 0;
    for (let day = 1; day <= 60; day += 1) {
      const q = buildDailyQuestions(`2027-01-${day}`, { svoCards, quizCards }).find((x) => x.kind === "read");
      if (q && q.kind === "read") same += q.choices.filter((c) => c !== q.answer && subject(c) === subject(q.answer)).length;
    }
    expect(same).toBe(0);
  });
});
