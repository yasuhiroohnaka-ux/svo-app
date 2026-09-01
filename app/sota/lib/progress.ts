"use client";

import { useSyncExternalStore } from "react";
import type { SotaProgress } from "../types";

export const SOTA_PROGRESS_STORAGE_KEY = "sota.progress.v1";

const PROGRESS_EVENT = "sota-progress";
const EMPTY_PROGRESS: SotaProgress = { cleared: [] };

let lastRaw: string | null | undefined;
let lastSnapshot: SotaProgress = EMPTY_PROGRESS;
let memoryFallbackRaw: string | null = null;
let storageUnavailable = false;

function normalizeProgress(value: unknown): SotaProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_PROGRESS;
  }

  const cleared = (value as Partial<SotaProgress>).cleared;
  if (!Array.isArray(cleared)) return EMPTY_PROGRESS;

  return {
    cleared: Array.from(
      new Set(cleared.filter((id): id is string => typeof id === "string")),
    ),
  };
}

function parseProgress(raw: string | null): SotaProgress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    return normalizeProgress(JSON.parse(raw) as unknown);
  } catch {
    return EMPTY_PROGRESS;
  }
}

function readRaw(): string | null {
  if (typeof window === "undefined" || storageUnavailable) {
    return memoryFallbackRaw;
  }
  try {
    return window.localStorage.getItem(SOTA_PROGRESS_STORAGE_KEY);
  } catch {
    storageUnavailable = true;
    return memoryFallbackRaw;
  }
}

function getSnapshot(): SotaProgress {
  const raw = readRaw();
  if (raw === lastRaw) return lastSnapshot;
  lastRaw = raw;
  lastSnapshot = parseProgress(raw);
  return lastSnapshot;
}

function getServerSnapshot(): SotaProgress {
  return EMPTY_PROGRESS;
}

function subscribe(onStoreChange: () => void): () => void {
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

function writeProgress(progress: SotaProgress): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeProgress(progress);
  const raw = JSON.stringify(normalized);
  memoryFallbackRaw = raw;
  lastRaw = raw;
  lastSnapshot = normalized;

  try {
    window.localStorage.setItem(SOTA_PROGRESS_STORAGE_KEY, raw);
  } catch {
    storageUnavailable = true;
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function markSotaSpreadCleared(spreadId: string): void {
  const current = getSnapshot();
  if (current.cleared.includes(spreadId)) return;
  writeProgress({ cleared: [...current.cleared, spreadId] });
}

export function useSotaProgress(): SotaProgress {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
