import { describe, expect, it } from "vitest";

import { addRankingEntry, formatTime, getRankPosition, MAX_RANKING_ENTRIES, rankingForCards, type RankEntry } from "./ranking";

const entry = (time: number, cards = 5, name = "p"): RankEntry => ({ name, time, cards, date: `d-${time}-${cards}` });

describe("ranking", () => {
  it("compares only times with the same card count", () => {
    const entries = [entry(3, 5), entry(20, 35), entry(8, 5)];
    expect(rankingForCards(entries, 5).map((e) => e.time)).toEqual([3, 8]);
    expect(getRankPosition(entries, 35, 10)).toBe(1);
    expect(getRankPosition(entries, 5, 5)).toBe(2);
  });

  it("returns null when the time is out of the top list", () => {
    const entries = Array.from({ length: MAX_RANKING_ENTRIES }, (_, i) => entry(i + 1));
    expect(getRankPosition(entries, 5, 99)).toBeNull();
    expect(getRankPosition(entries, 5, 0.5)).toBe(1);
  });

  it("keeps the top entries per card count", () => {
    let entries: RankEntry[] = [entry(1, 35)];
    for (let i = 0; i < MAX_RANKING_ENTRIES + 3; i += 1) entries = addRankingEntry(entries, entry(10 + i));
    expect(rankingForCards(entries, 5)).toHaveLength(MAX_RANKING_ENTRIES);
    expect(rankingForCards(entries, 35)).toHaveLength(1);
  });

  it("formats seconds", () => {
    expect(formatTime(6.1)).toBe("06.10s");
    expect(formatTime(75.5)).toBe("1:15.50");
  });
});
