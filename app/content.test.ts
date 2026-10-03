import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeCards } from "./svo/data";
import { getAllParts } from "./storyquiz/lib/data";
import { orderChoicesForSegment } from "./storyquiz/components/AnswerPanel";

// 画像・データの取りこぼしを、デプロイ前に見つけるためのテスト
const root = path.resolve(__dirname, "..");
const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(root, file), "utf8").replace(/^﻿/, ""));
const publicFileExists = (url: string) => existsSync(path.join(root, "public", decodeURI(url)));

describe("content data", () => {
  it("SVO cards all have a sentence and an existing image", () => {
    const cards = normalizeCards(readJson("public/data/svo_cards.json"));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.filter((card) => !publicFileExists(card.image)).map((card) => card.image)).toEqual([]);
    expect(new Set(cards.map((card) => card.id)).size).toBe(cards.length);
  });

  it("level 2 cards that are enabled point to existing images", () => {
    const data = readJson("public/data/puzzle_cards_lv2.json") as { cards?: unknown[] } | unknown[];
    const cards = (Array.isArray(data) ? data : data.cards ?? []) as { enabled?: boolean; imageFile?: string }[];
    const missing = cards
      .filter((card) => card.enabled === true)
      .map((card) => `/images/lv2/${card.imageFile}`)
      .filter((url) => !publicFileExists(url));
    expect(missing).toEqual([]);
  });

  it("Quiz Maker cards have an existing image and a target among their sentences", () => {
    const cards = readJson("public/data/quiz_data.json") as { id: string; image: string; sentences: string[]; target?: string }[];
    expect(cards.filter((card) => !publicFileExists(card.image)).map((card) => card.image)).toEqual([]);
    expect(cards.filter((card) => card.target && !card.sentences.includes(card.target)).map((card) => card.id)).toEqual([]);
  });

  it("Story Quiz segments have exactly one correct choice and existing images", () => {
    for (const part of getAllParts()) {
      for (const segment of part.segments) {
        const ids = segment.choices.map((choice) => choice.id);
        expect(new Set(ids).size, segment.id).toBe(ids.length);
        expect(ids, segment.id).toContain(segment.correctChoiceId);
        if (segment.image) expect(publicFileExists(segment.image), segment.image).toBe(true);
      }
    }
  });

  it("Story Quiz choice order is a stable shuffle of the same choices", () => {
    const segment = getAllParts()[0].segments[0];
    const ordered = orderChoicesForSegment(segment, "seed");
    expect(orderChoicesForSegment(segment, "seed")).toEqual(ordered);
    expect([...ordered].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...segment.choices].sort((a, b) => a.id.localeCompare(b.id)));
  });
});
