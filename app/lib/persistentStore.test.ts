import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createPersistentStore } from "./persistentStore";

class FakeWindow extends EventTarget {
  data = new Map<string, string>();
  broken = false;
  localStorage = {
    getItem: (key: string) => {
      if (this.broken) throw new Error("denied");
      return this.data.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (this.broken) throw new Error("denied");
      this.data.set(key, value);
    },
    removeItem: (key: string) => {
      this.data.delete(key);
    },
  };
}

let fakeWindow: FakeWindow;

beforeEach(() => {
  fakeWindow = new FakeWindow();
  (globalThis as { window?: unknown }).window = fakeWindow;
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

const makeStore = () =>
  createPersistentStore<{ count: number }>({
    key: "test.store",
    fallback: { count: 0 },
    parse: (value) =>
      value && typeof value === "object" && typeof (value as { count?: unknown }).count === "number"
        ? { count: (value as { count: number }).count }
        : { count: 0 },
  });

describe("persistentStore", () => {
  it("reads, writes and notifies subscribers", () => {
    const store = makeStore();
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    expect(store.get()).toEqual({ count: 0 });
    store.update((current) => ({ count: current.count + 1 }));
    expect(store.get()).toEqual({ count: 1 });
    expect(fakeWindow.data.get("test.store")).toBe('{"count":1}');
    expect(calls).toBe(1);
    unsubscribe();
  });

  it("returns the same snapshot object until the value changes", () => {
    const store = makeStore();
    store.set({ count: 2 });
    expect(store.get()).toBe(store.get());
  });

  it("falls back on broken JSON or invalid shapes", () => {
    fakeWindow.data.set("test.store", "{not json");
    expect(makeStore().get()).toEqual({ count: 0 });
    fakeWindow.data.set("test.store", '{"count":"x"}');
    expect(makeStore().get()).toEqual({ count: 0 });
  });

  it("keeps working in memory when localStorage is unavailable", () => {
    const store = makeStore();
    fakeWindow.broken = true;
    store.set({ count: 5 });
    expect(store.get()).toEqual({ count: 5 });
  });

  it("supports keys that change over time", () => {
    let day = "a";
    const store = createPersistentStore<number>({ key: () => `daily.${day}`, fallback: 0, parse: (v) => (typeof v === "number" ? v : 0) });
    store.set(3);
    day = "b";
    expect(store.get()).toBe(0);
    day = "a";
    expect(store.get()).toBe(3);
  });
});
