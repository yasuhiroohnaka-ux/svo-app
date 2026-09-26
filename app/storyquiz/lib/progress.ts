"use client";

import { createPersistentStore, usePersistentStore } from "@/app/lib/persistentStore";
import type { PartProgress } from "../types";

type ProgressMap = Record<string, PartProgress>;

const EMPTY_PROGRESS: ProgressMap = {};

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

export function parseProgress(value: unknown): ProgressMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_PROGRESS;

  const progress: ProgressMap = {};
  for (const [partId, item] of Object.entries(value)) {
    const normalized = normalizeProgress(partId, item);
    if (normalized) progress[partId] = normalized;
  }
  return progress;
}

const progressStore = createPersistentStore<ProgressMap>({
  key: "storyquiz.progress.v1",
  fallback: EMPTY_PROGRESS,
  parse: parseProgress,
});

export function getPartProgress(partId: string): PartProgress | null {
  return progressStore.get()[partId] ?? null;
}

export function savePartProgress(result: Omit<PartProgress, "completed">): void {
  progressStore.update((current) => ({
    ...current,
    [result.partId]: { ...result, completed: true },
  }));
}

export function getAllProgress(): ProgressMap {
  return progressStore.get();
}

export function useAllProgress(): ProgressMap {
  return usePersistentStore(progressStore);
}

export function usePartProgress(partId: string): PartProgress | null {
  return useAllProgress()[partId] ?? null;
}

export function clearAllProgress(): void {
  progressStore.clear();
}
