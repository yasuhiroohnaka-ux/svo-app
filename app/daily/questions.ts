import { NOUNS, QUESTIONS } from "@/app/guess-it/data";
import { createRng, pickWithRng, seedFromString, shuffleWithRng } from "@/app/lib/random";
import { PHONICS_DATA } from "@/app/phonics/PhonicsData";
import type { Card as SvoCard } from "@/app/svo/types";

/**
 * きょうのダンジョン: 日付で決まる 5 問(同じ日なら だれでも 同じ問題)。
 * 4 つの部屋のデータを まぜて出題し、「にがて」カードがあれば ふくしゅう問題を まぜる。
 */

export type QuizCard = {
  id: string;
  deck?: string;
  image: string;
  sentences: string[];
  target?: string;
};

type Base = { id: string; review: boolean };

export type DailyQuestion =
  | (Base & { kind: "listen"; cardId: string; sentence: string; choices: { id: string; image: string }[]; answerId: string })
  | (Base & { kind: "read"; cardId: string; image: string; choices: string[]; answer: string })
  | (Base & {
      kind: "yesno";
      noun: { word: string; ja: string; icon: string };
      question: { text: string; ja: string };
      answer: "yes" | "no";
    })
  | (Base & { kind: "sound"; audio: string; choices: { id: string; symbol: string }[]; answerId: string });

export type DailySources = {
  svoCards: SvoCard[];
  quizCards: QuizCard[];
  /** にがて(まちがえた回数が多い順) */
  weakSvo?: string[];
  weakQuiz?: string[];
};

export const DAILY_QUESTION_COUNT = 5;

const quizTarget = (card: QuizCard) => card.target ?? card.sentences[card.sentences.length - 1] ?? "";

function listenQuestion(cards: SvoCard[], rng: () => number, preferId?: string): DailyQuestion | null {
  if (cards.length < 4) return null;
  const answer = cards.find((card) => String(card.id) === preferId) ?? pickWithRng(cards, rng);
  const others = shuffleWithRng(
    cards.filter((card) => card.id !== answer.id && card.sentence !== answer.sentence),
    rng,
  ).slice(0, 3);
  return {
    id: `listen-${answer.id}`,
    kind: "listen",
    review: String(answer.id) === preferId,
    cardId: String(answer.id),
    sentence: answer.sentence,
    choices: shuffleWithRng([answer, ...others], rng).map((card) => ({ id: String(card.id), image: card.image })),
    answerId: String(answer.id),
  };
}

function readQuestion(cards: QuizCard[], rng: () => number, preferId?: string): DailyQuestion | null {
  if (cards.length < 3) return null;
  const answer = cards.find((card) => card.id === preferId) ?? pickWithRng(cards, rng);
  const target = quizTarget(answer);
  // 同じデッキの ほかのカードの文から、正解と ちがう文を えらぶ。
  // 主語が同じ文(The girls are stronger / The girls are younger など)は 絵だけでは
  // 否定できないことがあるので、主語が ちがう文を 優先する
  const subjectOf = (text: string) => text.toLowerCase().split(/\s+/).slice(0, 2).join(" ");
  const pool = cards.filter((card) => card.deck === answer.deck && quizTarget(card) !== target);
  const differentSubject = pool.filter((card) => subjectOf(quizTarget(card)) !== subjectOf(target));
  const ordered = [...shuffleWithRng(differentSubject, rng), ...shuffleWithRng(pool, rng)];
  const distractors = [...new Set(ordered.map(quizTarget))].slice(0, 2);
  if (distractors.length < 2) return null;
  return {
    id: `read-${answer.id}`,
    kind: "read",
    review: answer.id === preferId,
    cardId: answer.id,
    image: answer.image,
    choices: shuffleWithRng([target, ...distractors], rng),
    answer: target,
  };
}

function yesNoQuestion(rng: () => number): DailyQuestion {
  const noun = pickWithRng(NOUNS, rng);
  // yes と no が かたよらないよう、半分の確率で「答えが yes になる しつもん」を えらぶ
  const wantYes = rng() < 0.5;
  const matching = QUESTIONS.filter((question) => (noun.facts[question.key] === true) === wantYes);
  const question = pickWithRng(matching.length > 0 ? matching : QUESTIONS, rng);
  return {
    id: `yesno-${noun.id}-${question.id}`,
    kind: "yesno",
    review: false,
    noun: { word: noun.word, ja: noun.ja, icon: noun.icon },
    question: { text: question.text, ja: question.ja },
    answer: noun.facts[question.key] === true ? "yes" : "no",
  };
}

function soundQuestion(rng: () => number): DailyQuestion | null {
  const withAudio = PHONICS_DATA.filter((phonic) => phonic.audio);
  if (withAudio.length < 3) return null;
  const answer = pickWithRng(withAudio, rng);
  // c/k/q のように 同じ音の カードは まぜない
  const others = shuffleWithRng(
    withAudio.filter((phonic) => phonic.audio !== answer.audio),
    rng,
  ).slice(0, 2);
  return {
    id: `sound-${answer.id}`,
    kind: "sound",
    review: false,
    audio: answer.audio as string,
    choices: shuffleWithRng([answer, ...others], rng).map((phonic) => ({ id: phonic.id, symbol: phonic.symbol })),
    answerId: answer.id,
  };
}

export function buildDailyQuestions(dateStamp: string, sources: DailySources): DailyQuestion[] {
  const rng = createRng(seedFromString(`kotoba-daily|${dateStamp}`));
  // 絵が カラーで そろっている セット1・2 だけを使う(セット3・4 は 下描きのため)
  const quizCards = sources.quizCards.filter((card) => card.deck === "set1" || card.deck === "set2");
  const svoIds = new Set(sources.svoCards.map((card) => String(card.id)));
  const quizIds = new Set(quizCards.map((card) => card.id));
  const weakSvo = (sources.weakSvo ?? []).find((id) => svoIds.has(id));
  const weakQuiz = (sources.weakQuiz ?? []).find((id) => quizIds.has(id));

  const questions = [
    listenQuestion(sources.svoCards, rng),
    readQuestion(quizCards, rng),
    yesNoQuestion(rng),
    soundQuestion(rng),
    // 5 問目は ふくしゅう(にがてが あれば)。なければ ふつうの 聞きとり
    weakQuiz && !weakSvo
      ? readQuestion(quizCards, rng, weakQuiz)
      : listenQuestion(sources.svoCards, rng, weakSvo),
  ].filter((question): question is DailyQuestion => question !== null);

  // 同じカードが 2 回 出ないようにし、足りなければ 聞きとり問題で おぎなう
  const seen = new Set<string>();
  const unique = questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
  for (let attempt = 0; unique.length < DAILY_QUESTION_COUNT && attempt < 20; attempt += 1) {
    const extra = listenQuestion(sources.svoCards, rng);
    if (extra && !seen.has(extra.id)) {
      seen.add(extra.id);
      unique.push(extra);
    }
  }
  return unique;
}
