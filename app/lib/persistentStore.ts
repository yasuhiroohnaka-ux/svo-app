import { useSyncExternalStore } from "react";

/**
 * localStorage に保存する小さな値のストア(全アプリ共通)。
 *
 * - React からは usePersistentStore で読む(useSyncExternalStore)。SSR とハイドレーション中は
 *   fallback を返すので、サーバーとクライアントで初期表示がずれない。
 * - 同じタブ内の別コンポーネント・別タブ(storage イベント)の変更も反映される。
 * - プライベートブラウズなどで localStorage が使えないときは、メモリ上だけで動き続ける。
 */
export type PersistentStore<T> = {
  get: () => T;
  set: (value: T) => void;
  update: (updater: (current: T) => T) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
  getServerSnapshot: () => T;
};

type PersistentStoreOptions<T> = {
  /** 保存キー。日付ごとに分けたいときは関数で渡す */
  key: string | (() => string);
  fallback: T;
  /** JSON.parse 済みの値を検証・正規化する。不正なら fallback を返す */
  parse: (value: unknown) => T;
};

let storeCount = 0;

export function createPersistentStore<T>({ key, fallback, parse }: PersistentStoreOptions<T>): PersistentStore<T> {
  const resolveKey = typeof key === "function" ? key : () => key;
  storeCount += 1;
  const eventName = `persistent-store:${storeCount}`;

  // 同じ raw 文字列なら同じオブジェクトを返す(useSyncExternalStore の無限再描画を防ぐ)
  let lastKey: string | undefined;
  let lastRaw: string | null | undefined;
  let lastSnapshot: T = fallback;
  const memory = new Map<string, string | null>();
  let storageUnavailable = false;

  const readRaw = (storageKey: string): string | null => {
    if (typeof window === "undefined" || storageUnavailable) return memory.get(storageKey) ?? null;
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      storageUnavailable = true;
      return memory.get(storageKey) ?? null;
    }
  };

  const parseRaw = (raw: string | null): T => {
    if (raw === null) return fallback;
    try {
      return parse(JSON.parse(raw) as unknown);
    } catch {
      return fallback;
    }
  };

  const get = (): T => {
    const storageKey = resolveKey();
    const raw = readRaw(storageKey);
    if (storageKey === lastKey && raw === lastRaw) return lastSnapshot;
    lastKey = storageKey;
    lastRaw = raw;
    lastSnapshot = parseRaw(raw);
    return lastSnapshot;
  };

  const writeRaw = (raw: string | null) => {
    if (typeof window === "undefined") return;
    const storageKey = resolveKey();
    memory.set(storageKey, raw);
    try {
      if (raw === null) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, raw);
      storageUnavailable = false;
    } catch {
      // 保存できなくてもセッション内ではメモリの値で動く
      storageUnavailable = true;
    }
    lastKey = undefined;
    window.dispatchEvent(new Event(eventName));
  };

  const set = (value: T) => writeRaw(JSON.stringify(value));

  return {
    get,
    set,
    update: (updater) => set(updater(get())),
    clear: () => writeRaw(null),
    subscribe: (listener) => {
      if (typeof window === "undefined") return () => {};
      const handleChange = () => {
        lastKey = undefined;
        listener();
      };
      window.addEventListener("storage", handleChange);
      window.addEventListener(eventName, handleChange);
      return () => {
        window.removeEventListener("storage", handleChange);
        window.removeEventListener(eventName, handleChange);
      };
    },
    getServerSnapshot: () => fallback,
  };
}

export function usePersistentStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}
