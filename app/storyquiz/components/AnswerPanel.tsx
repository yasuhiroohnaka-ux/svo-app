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
  /** Wrong picks so far this segment — visually locked, not clickable. */
  wrongChoiceIds: ReadonlySet<string>;
  /** When true (after a correct pick), reveal the correct choice in green and disable all. */
  revealCorrect: boolean;
  onAnswer: (result: AnswerResult) => void;
  disabled?: boolean;
};

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

function ChoicePanel({
  segment,
  wrongChoiceIds,
  revealCorrect,
  onAnswer,
  disabled,
}: Omit<AnswerPanelProps, "mode">) {
  function handlePick(choiceId: string) {
    if (disabled || revealCorrect || wrongChoiceIds.has(choiceId)) return;
    onAnswer({
      choiceId,
      isCorrect: choiceId === segment.correctChoiceId,
    });
  }

  return (
    <div className={styles.choiceGrid}>
      {segment.choices.map((choice) => {
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
