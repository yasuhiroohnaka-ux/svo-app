"use client";

import { useSyncExternalStore } from "react";
import type { PartProgress } from "../types";

const STORAGE_KEY = "storyquiz.progress.v1";
const PROGRESS_EVENT = "storyquiz-progress";

type ProgressMap = Record<string, PartProgress>;

const EMPTY_PROGRESS: ProgressMap = {};
let lastRaw: string | null | undefined;
let lastSnapshot: ProgressMap = EMPTY_PROGRESS;
let memoryFallbackRaw: string | null = null;
let storageUnavailable = false;

function normalizeProgress(partId: string, value: unknown): PartProgress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Partial<PartProgress>;
  const hasCompletion = item.completed === true || typeof item.clearedAt === "string";
  if (!hasCompletion) return null;

  return {
    partId: typeof item.partId === "string" ? item.partId : partId,
    completed: true,
    correctCount: Number.isFinite(item.correctCount) ? Number(item.correctCount) : 0,
    totalQuestions: Number.isFinite(item.totalQuestions) ? Number(item.totalQuestions) : 0,
    clearedAt: typeof item.clearedAt === "string" ? item.clearedAt : "",
  };
}

function parseProgress(raw: string | null): ProgressMap {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return EMPTY_PROGRESS;
    }

    const progress: ProgressMap = {};
    for (const [partId, value] of Object.entries(parsed)) {
      const normalized = normalizeProgress(partId, value);
      if (normalized) progress[partId] = normalized;
    }
    return progress;
  } catch {
    return EMPTY_PROGRESS;
  }
}

function getRawStorage(): string | null {
  if (typeof window === "undefined") return memoryFallbackRaw;
  if (storageUnavailable) return memoryFallbackRaw;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storageUnavailable = true;
    return memoryFallbackRaw;
  }
}

function getProgressSnapshot(): ProgressMap {
  const raw = getRawStorage();
  if (raw === lastRaw) return lastSnapshot;
  lastRaw = raw;
  lastSnapshot = parseProgress(raw);
  return lastSnapshot;
}

function getServerProgressSnapshot(): ProgressMap {
  return EMPTY_PROGRESS;
}

function notifyProgressChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

function subscribeProgress(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handleChange = () => {
    lastRaw = undefined;
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(PROGRESS_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(PROGRESS_EVENT, handleChange);
  };
}

function writeAll(map: ProgressMap): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(map);
  lastRaw = raw;
  lastSnapshot = map;
  memoryFallbackRaw = raw;

  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
    storageUnavailable = false;
  } catch {
    // localStorage can fail in private browsing or quota-limited contexts.
    storageUnavailable = true;
  }
  notifyProgressChange();
}

export function getPartProgress(partId: string): PartProgress | null {
  return getProgressSnapshot()[partId] ?? null;
}

export function savePartProgress(result: Omit<PartProgress, "completed">): void {
  const map = { ...getProgressSnapshot() };
  map[result.partId] = {
    ...result,
    completed: true,
  };
  writeAll(map);
}

export function getAllProgress(): ProgressMap {
  return getProgressSnapshot();
}

export function useAllProgress(): ProgressMap {
  return useSyncExternalStore(
    subscribeProgress,
    getProgressSnapshot,
    getServerProgressSnapshot,
  );
}

export function usePartProgress(partId: string): PartProgress | null {
  return useAllProgress()[partId] ?? null;
}

export function clearAllProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    lastRaw = null;
    lastSnapshot = EMPTY_PROGRESS;
    memoryFallbackRaw = null;
    storageUnavailable = false;
    notifyProgressChange();
  } catch {
    memoryFallbackRaw = null;
    storageUnavailable = true;
    lastRaw = null;
    lastSnapshot = EMPTY_PROGRESS;
    notifyProgressChange();
  }
}
