export type IssueId = "no1" | "no2";

export type RecommendedGrade = "小1〜2" | "小2〜3" | "小3〜4";

export type AnswerMode = "choice" | "typing" | "speech";

export type Keyword = {
  id: string;
  word: string;
  ja: string;
  image?: string;
  emoji?: string;
  audioText?: string;
};

export type StoryChoice = {
  id: string;
  labelEn: string;
  labelJa?: string;
  emoji?: string;
};

export type StorySegment = {
  id: string;
  text: string;
  questionJa: string;
  choices: StoryChoice[];
  correctChoiceId: string;
  /** Reinforces the story flow after a correct pick. Pattern: "そうだね。〇〇だったね。" */
  feedbackCorrectJa: string;
  /** Gentle scaffold shown when the kid picks wrong. Pattern: "もういちど聞いてみよう。〇〇にヒントがあるよ。" */
  feedbackIncorrectJa: string;
  /** One-line recap used on the result screen ("きょうのおはなしでわかったこと"). Falls back to feedbackCorrectJa if omitted. */
  summaryJa?: string;
};

export type StoryPart = {
  id: string;
  issue: IssueId;
  chapterNo: number;
  chapterTitle: string;
  partNo: number;
  partTitle: string;
  recommendedGrade: RecommendedGrade;
  keywords: Keyword[];
  segments: StorySegment[];
};

export type IssueData = {
  issue: IssueId;
  title: string;
  description: string;
  parts: StoryPart[];
};

export type PartProgress = {
  partId: string;
  completed: boolean;
  correctCount: number;
  totalQuestions: number;
  clearedAt: string;
};
