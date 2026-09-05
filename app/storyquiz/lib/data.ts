import no1 from "../data/no1.json";
import { miniIssue } from "../../content/miniStories";
import type { IssueData, StoryPart } from "../types";

const no1Issue = no1 as IssueData;

const issues: IssueData[] = [
  miniIssue,
  no1Issue,
  {
    issue: "no2",
    title: "Story Quiz orange no.2",
    description: "Coming soon",
    parts: [],
  },
];

export function getAllParts(): StoryPart[] {
  return issues.flatMap((issue) => issue.parts);
}

export function getPartById(id: string): StoryPart | null {
  return getAllParts().find((part) => part.id === id) ?? null;
}

export function getNextPart(currentPartId: string): StoryPart | null {
  const current = getPartById(currentPartId);
  const parts = issues.find((issue) => issue.issue === current?.issue)?.parts ?? [];
  const currentIndex = parts.findIndex((part) => part.id === currentPartId);
  if (currentIndex < 0) return null;
  return parts[currentIndex + 1] ?? null;
}

export function getIssues(): IssueData[] {
  return issues;
}
