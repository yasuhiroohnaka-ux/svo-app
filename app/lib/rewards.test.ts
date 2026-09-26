import { describe, expect, it } from "vitest";

import { APPS } from "./apps";
import {
  appStars,
  nextDailyRecord,
  applyStars,
  parseRewards,
  starsFromAccuracy,
  starsFromMistakes,
  starsFromTime,
  starsFromVs,
  totalStars,
  TREASURES,
  type RewardsState,
} from "./rewards";

const empty: RewardsState = { stars: {}, treasures: [], daily: { lastDate: "", streak: 0, best: 0 } };

describe("rewards", () => {
  it("keeps only the best stars per stage", () => {
    let state = applyStars(empty, "story", "p1", 2).next;
    const { next, result } = applyStars(state, "story", "p1", 1);
    expect(next.stars["story:p1"]).toBe(2);
    expect(result.gained).toBe(0);
    state = applyStars(next, "story", "p1", 3).next;
    expect(state.stars["story:p1"]).toBe(3);
    expect(totalStars(state)).toBe(3);
  });

  it("reports the stars gained by a new best", () => {
    const first = applyStars(empty, "maze", "basic", 1);
    expect(first.result).toMatchObject({ previousBest: 0, gained: 1 });
    const better = applyStars(first.next, "maze", "basic", 3);
    expect(better.result).toMatchObject({ previousBest: 1, gained: 2 });
  });

  it("unlocks the room treasure at 3 stars and never twice", () => {
    const { next, result } = applyStars(empty, "guess", "apple", 3);
    expect(result.newTreasures.map((t) => t.id)).toEqual(["room-guess"]);
    expect(applyStars(next, "guess", "cat", 3).result.newTreasures.map((t) => t.id)).not.toContain("room-guess");
    expect(appStars(next, "guess")).toBe(3);
  });

  it("unlocks the master key when every room has a star", () => {
    let state = empty;
    let unlocked: string[] = [];
    for (const app of APPS) {
      const { next, result } = applyStars(state, app.id, "s", 1);
      state = next;
      unlocked = unlocked.concat(result.newTreasures.map((t) => t.id));
    }
    expect(unlocked).toContain("all-rooms");
  });

  it("every treasure has a unique id", () => {
    expect(new Set(TREASURES.map((t) => t.id)).size).toBe(TREASURES.length);
  });

  it("ignores broken saved data", () => {
    expect(parseRewards({ stars: { "a:b": 5, "a:c": 2 }, treasures: ["x", 1] })).toEqual({
      stars: { "a:c": 2 },
      treasures: ["x"],
      daily: { lastDate: "", streak: 0, best: 0 },
    });
    expect(parseRewards("nope")).toEqual(empty);
  });

  it("scores results", () => {
    expect(starsFromAccuracy(4, 4)).toBe(3);
    expect(starsFromAccuracy(4, 5)).toBe(2);
    expect(starsFromAccuracy(1, 4)).toBe(1);
    expect(starsFromMistakes(0)).toBe(3);
    expect(starsFromMistakes(2)).toBe(2);
    expect(starsFromMistakes(3)).toBe(1);
    expect(starsFromTime(10, 5)).toBe(3);
    expect(starsFromTime(20, 5)).toBe(2);
    expect(starsFromTime(30, 5)).toBe(1);
    expect(starsFromVs(3, 2)).toBe(3);
    expect(starsFromVs(2, 2)).toBe(2);
    expect(starsFromVs(1, 4)).toBe(1);
  });

  it("counts daily streaks", () => {
    let daily = nextDailyRecord(empty.daily, "2026-09-01", "2026-08-31");
    expect(daily).toEqual({ lastDate: "2026-09-01", streak: 1, best: 1 });
    daily = nextDailyRecord(daily, "2026-09-01", "2026-08-31");
    expect(daily.streak).toBe(1);
    daily = nextDailyRecord(daily, "2026-09-02", "2026-09-01");
    expect(daily.streak).toBe(2);
    daily = nextDailyRecord(daily, "2026-09-05", "2026-09-04");
    expect(daily).toEqual({ lastDate: "2026-09-05", streak: 1, best: 2 });
  });

  it("unlocks the streak treasure from the best streak", () => {
    const state = { ...empty, daily: { lastDate: "x", streak: 3, best: 3 } };
    expect(applyStars(state, "daily", "d", 1).result.newTreasures.map((t) => t.id)).toContain("daily-3");
  });
});
