"use client";

import type { AnswerMode, StoryChoice, StorySegment } from "../types";
import styles from "../storyquiz.module.css";

export type AnswerResult = {
  isCorrect: boolean;
  choiceId: string;
};

export type AnswerPanelProps = {
  mode: AnswerMode;
  segment: StorySegment;
  choiceOrderSeed: string;
  /** Wrong picks so far this segment — visually locked, not clickable. */
  wrongChoiceIds: ReadonlySet<string>;
  /** When true (after a correct pick), reveal the correct choice in green and disable all. */
  revealCorrect: boolean;
  onAnswer: (result: AnswerResult) => void;
  disabled?: boolean;
};

const CHOICE_ORDER_SALT = "storyquiz-choice-order-v1|";

function ChoiceLabel({ choice }: { choice: StoryChoice }) {
  return (
    <>
      {choice.emoji && (
        <span className={styles.choiceEmoji} aria-hidden="true">
          {choice.emoji}
        </span>
      )}
      <span className={styles.choiceJa}>{choice.labelJa ?? choice.labelEn}</span>
      <span className={styles.choiceEn}>{choice.labelEn}</span>
    </>
  );
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function orderChoicesForSegment(
  segment: StorySegment,
  choiceOrderSeed: string,
): StoryChoice[] {
  const orderedChoices = [...segment.choices];
  const random = createSeededRandom(
    hashString(`${CHOICE_ORDER_SALT}${choiceOrderSeed}|${segment.id}`),
  );

  for (let index = orderedChoices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [orderedChoices[index], orderedChoices[swapIndex]] = [
      orderedChoices[swapIndex],
      orderedChoices[index],
    ];
  }

  return orderedChoices;
}

function ChoicePanel({
  segment,
  choiceOrderSeed,
  wrongChoiceIds,
  revealCorrect,
  onAnswer,
  disabled,
}: Omit<AnswerPanelProps, "mode">) {
  const orderedChoices = orderChoicesForSegment(segment, choiceOrderSeed);

  function handlePick(choiceId: string) {
    if (disabled || revealCorrect || wrongChoiceIds.has(choiceId)) return;
    onAnswer({
      choiceId,
      isCorrect: choiceId === segment.correctChoiceId,
    });
  }

  return (
    <div className={styles.choiceGrid}>
      {orderedChoices.map((choice) => {
        const isWrong = wrongChoiceIds.has(choice.id);
        const isAnswer = choice.id === segment.correctChoiceId;
        const showCorrect = revealCorrect && isAnswer;
        const className = [
          styles.choiceBtn,
          showCorrect ? styles.choiceCorrect : "",
          isWrong ? styles.choiceWrong : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={choice.id}
            type="button"
            className={className}
            onClick={() => handlePick(choice.id)}
            disabled={disabled || revealCorrect || isWrong}
            aria-pressed={showCorrect || isWrong}
          >
            <ChoiceLabel choice={choice} />
          </button>
        );
      })}
    </div>
  );
}

function NotImplementedPanel({ label }: { label: string }) {
  return (
    <div className={styles.notImpl}>
      <p>{label}は次のバージョンで追加予定です。</p>
      <p>今は「えらぶ」クイズで答えてね。</p>
    </div>
  );
}

export default function AnswerPanel(props: AnswerPanelProps) {
  switch (props.mode) {
    case "choice":
      return <ChoicePanel {...props} />;
    case "typing":
      return <NotImplementedPanel label="書いて答えるモード" />;
    case "speech":
      return <NotImplementedPanel label="声で答えるモード" />;
    default:
      return null;
  }
}
