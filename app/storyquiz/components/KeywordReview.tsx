"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  cancelSpeech,
  speak,
  STORYQUIZ_SPEECH_RATE,
  unlockSpeech,
} from "../lib/speech";
import type { Keyword } from "../types";
import styles from "../storyquiz.module.css";

type Props = {
  keywords: Keyword[];
  onStart: () => void;
};

export default function KeywordReview({ keywords, onStart }: Props) {
  useEffect(() => {
    unlockSpeech();
    return () => cancelSpeech();
  }, []);

  function handleSpeak(keyword: Keyword) {
    speak(keyword.audioText ?? keyword.word, {
      rate: STORYQUIZ_SPEECH_RATE.keyword,
    });
  }

  return (
    <div className={styles.wordsWrap}>
      <section className={styles.wordsIntro}>
        <div className={styles.kicker}>TODAY&apos;S WORDS</div>
        <h2 className={styles.sectionTitle}>きょうの ことば</h2>
      </section>

      <div className={styles.wordGrid}>
        {keywords.map((keyword) => (
          <article key={keyword.id} className={styles.wordCard}>
            <div className={styles.wordImageSlot} aria-hidden="true">
              {keyword.image ? (
                <Image src={keyword.image} alt="" className={styles.wordImage} fill sizes="120px" />
              ) : (
                <span>{keyword.emoji ?? "◻"}</span>
              )}
            </div>
            <div className={styles.wordText}>
              <div className={styles.wordEn}>{keyword.word}</div>
              <div className={styles.wordJa}>{keyword.ja}</div>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => handleSpeak(keyword)}
              aria-label={`${keyword.word} を聞く`}
              title={`${keyword.word} を聞く`}
            >
              🔊
            </button>
          </article>
        ))}
      </div>

      <button type="button" className={styles.startButton} onClick={onStart}>
        スタート
      </button>
    </div>
  );
}
