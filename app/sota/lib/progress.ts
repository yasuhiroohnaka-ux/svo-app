"use client";

import { createPersistentStore, usePersistentStore } from "@/app/lib/persistentStore";
import type { SotaProgress } from "../types";

export const SOTA_PROGRESS_STORAGE_KEY = "sota.progress.v1";

const EMPTY_PROGRESS: SotaProgress = { cleared: [] };

export function parseSotaProgress(value: unknown): SotaProgress {
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

const progressStore = createPersistentStore<SotaProgress>({
  key: SOTA_PROGRESS_STORAGE_KEY,
  fallback: EMPTY_PROGRESS,
  parse: parseSotaProgress,
});

export function markSotaSpreadCleared(spreadId: string): void {
  const current = progressStore.get();
  if (current.cleared.includes(spreadId)) return;
  progressStore.set({ cleared: [...current.cleared, spreadId] });
}

export function useSotaProgress(): SotaProgress {
  return usePersistentStore(progressStore);
}
