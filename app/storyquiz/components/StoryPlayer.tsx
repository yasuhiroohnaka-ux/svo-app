"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelSpeech,
  speak,
  STORYQUIZ_SPEECH_RATE,
  unlockSpeech,
} from "../lib/speech";
import type { StoryPart, StorySegment } from "../types";
import AnswerPanel, { type AnswerResult } from "./AnswerPanel";
import styles from "../storyquiz.module.css";

type Phase = "intro" | "reading" | "question" | "feedback" | "done";

type Props = {
  part: StoryPart;
  onComplete: (summary: { correct: number; total: number }) => void;
};

function getCorrectChoice(segment: StorySegment) {
  return segment.choices.find((choice) => choice.id === segment.correctChoiceId);
}

export default function StoryPlayer({ part, onComplete }: Props) {
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [wrongChoiceIds, setWrongChoiceIds] = useState<ReadonlySet<string>>(new Set());
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const completedRef = useRef(false);

  const segment = part.segments[segmentIndex];
  const totalQuestions = part.segments.length;
  const correctChoice = segment ? getCorrectChoice(segment) : null;
  const showHint = wrongChoiceIds.size > 0 && phase === "question";

  const goToQuestion = useCallback(() => {
    cancelSpeech();
    setPhase("question");
  }, []);

  const goToReading = useCallback(() => {
    cancelSpeech();
    setPhase("reading");
  }, []);

  useEffect(() => {
    unlockSpeech();
    return () => cancelSpeech();
  }, []);

  useEffect(() => {
    if (phase !== "intro") return;
    const timer = setTimeout(() => {
      speak(`${part.chapterTitle}. ${part.chapterNo}-${part.partNo}. ${part.partTitle}.`, {
        lang: "en-US",
        rate: STORYQUIZ_SPEECH_RATE.title,
        onEnd: goToReading,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [goToReading, part, phase]);

  useEffect(() => {
    if (phase !== "reading" || !segment) return;
    const timer = setTimeout(() => {
      speak(segment.text, {
        lang: "en-US",
        rate: STORYQUIZ_SPEECH_RATE.story,
        onEnd: goToQuestion,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [goToQuestion, phase, segment]);

  useEffect(() => {
    if (phase !== "done" || completedRef.current) return;
    completedRef.current = true;
    onComplete({ correct: correctCount, total: totalQuestions });
  }, [correctCount, onComplete, phase, totalQuestions]);

  function handleReplay() {
    if (!segment) return;
    speak(segment.text, {
      lang: "en-US",
      rate: STORYQUIZ_SPEECH_RATE.story,
    });
  }

  function handleAnswer(result: AnswerResult) {
    if (!segment) return;
    if (result.isCorrect) {
      setLastResult(result);
      setCorrectCount((count) => count + 1);
      setPhase("feedback");
      return;
    }
    // Wrong pick: stay in question phase, lock that choice, show hint,
    // and gently re-play the paragraph so the kid can listen again.
    setWrongChoiceIds((prev) => {
      const next = new Set(prev);
      next.add(result.choiceId);
      return next;
    });
    speak(segment.text, {
      lang: "en-US",
      rate: STORYQUIZ_SPEECH_RATE.hint,
    });
  }

  function handleNext() {
    cancelSpeech();
    setWrongChoiceIds(new Set());
    setLastResult(null);
    if (segmentIndex >= part.segments.length - 1) {
      setPhase("done");
      return;
    }

    setSegmentIndex((index) => index + 1);
    setPhase("reading");
  }

  if (!segment) return null;

  return (
    <div className={styles.playWrap}>
      <header className={styles.playHeader}>
        <div className={styles.playChapter}>
          {part.chapterNo}. {part.chapterTitle}
        </div>
        <div className={styles.playPart}>
          {part.chapterNo}-{part.partNo} {part.partTitle}
        </div>
        <div className={styles.playProgress}>
          {segmentIndex + 1} / {part.segments.length}
        </div>
      </header>

      <section className={styles.playPanel}>
        <p className={styles.paragraph}>{segment.text}</p>
        <div className={styles.inlineActions}>
          <button type="button" className={styles.speakBtn} onClick={handleReplay}>
            🔊
            <span>もういちど聞く</span>
          </button>
          {phase === "reading" && (
            <button type="button" className={styles.navBtnSecondary} onClick={goToQuestion}>
              クイズへ
            </button>
          )}
        </div>
      </section>

      {phase === "intro" && (
        <section className={styles.qaPanel}>
          <p className={styles.readingNotice}>タイトルを聞いてね</p>
          <button type="button" className={styles.navBtnSecondary} onClick={goToReading}>
            本文へ
          </button>
        </section>
      )}

      {phase === "reading" && (
        <section className={styles.qaPanel}>
          <p className={styles.readingNotice}>ストーリーを聞いてから、クイズに答えよう</p>
        </section>
      )}

      {(phase === "question" || phase === "feedback") && (
        <section className={styles.qaPanel}>
          <p className={styles.questionPrompt}>{segment.questionJa}</p>

          {showHint && (
            <div className={styles.hintBanner} role="status" aria-live="polite">
              <span className={styles.hintIcon} aria-hidden="true">💡</span>
              <p className={styles.hintText}>{segment.feedbackIncorrectJa}</p>
            </div>
          )}

          <AnswerPanel
            mode="choice"
            segment={segment}
            wrongChoiceIds={wrongChoiceIds}
            revealCorrect={phase === "feedback"}
            onAnswer={handleAnswer}
            disabled={phase === "feedback"}
          />
        </section>
      )}

      {phase === "feedback" && lastResult && (
        <section className={styles.feedbackPanel}>
          <div className={styles.feedbackOk}>そうだね！</div>
          <p className={styles.feedbackText}>{segment.feedbackCorrectJa}</p>
          {correctChoice && (
            <p className={styles.feedbackAnswer}>
              こたえ: <strong>{correctChoice.labelJa ?? correctChoice.labelEn}</strong>
              {correctChoice.labelJa && correctChoice.labelEn && (
                <span className={styles.feedbackAnswerEn}> / {correctChoice.labelEn}</span>
              )}
            </p>
          )}
          <button
            type="button"
            className={styles.navBtnPrimary}
            onClick={handleNext}
          >
            {segmentIndex >= part.segments.length - 1 ? "おはなしクリア！" : "つぎへ"}
          </button>
        </section>
      )}
    </div>
  );
}
