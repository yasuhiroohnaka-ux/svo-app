import rawStories from "./mini-stories.json";
import type { StoryPart, StorySegment, IssueData } from "../storyquiz/types";
import type { PuzzleCard, Pattern } from "../lib/lv2Cards";

type MiniSegment = StorySegment & {
  image: string;
  puzzle: { id: number; subject: string; verb: string; object: string; pattern: Pattern; distractors: { subject: string; verb: string; object: string } };
};
export type MiniStory = Omit<StoryPart, "segments"> & { segments: MiniSegment[] };
// This file adapts one editorial source for the story and sentence-building views.
export const miniStories = rawStories as MiniStory[];
export const miniIssue: IssueData = {
  issue: "mini",
  title: "はじめての おはなし",
  description: "カードの なかまたちと、みじかい おはなしを よもう。1話 3〜5分。",
  parts: miniStories,
};

export function getStoryPuzzleCards(storyId = "all"): PuzzleCard[] {
  return miniStories.filter((story) => storyId === "all" || story.id === storyId)
    .flatMap((story) => story.segments.map(({ puzzle, image }) => ({
      ...puzzle,
      image,
      sentence: `${puzzle.subject} ${puzzle.verb} ${puzzle.object}.`,
      subject_zh: "", verb_zh: "", object_zh: "", sentence_zh: "",
    })));
}
