"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import HanamaruMark from "@/app/components/HanamaruMark";
import SpeedControl from "@/app/components/SpeedControl";
import { playBuzz, playChime, unlockAudio } from "@/utils/sound";
import { getChoiceSpreads, getSotaImagePath, sotaCoverImagePath, sotaSpreads } from "../lib/book";
import { markSotaSpreadCleared, useSotaProgress } from "../lib/progress";
import { cancelSotaSpeech, speakSota, unlockSotaSpeech } from "../lib/speech";
import type { SotaSpread } from "../types";
import styles from "../sota.module.css";

type PlayPhase = "choosing" | "correct";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({
  text,
  keywords,
  visible,
}: {
  text: string;
  keywords: string[];
  visible: boolean;
}) {
  if (!visible) return text;
  const orderedKeywords = [...keywords].sort((left, right) => right.length - left.length);
  const matcher = new RegExp(`(${orderedKeywords.map(escapeRegExp).join("|")})`, "gi");
  const keywordSet = new Set(keywords.map((keyword) => keyword.toLowerCase()));

  return text.split(matcher).map((part, index) =>
    keywordSet.has(part.toLowerCase()) ? (
      <span className={styles.keyword} key={`${part}-${index}`}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export default function SotaPlayer() {
  const progress = useSotaProgress();
  const [activeSpreadId, setActiveSpreadId] = useState<string | null>(null);
  const [phase, setPhase] = useState<PlayPhase>("choosing");
  const [hintStage, setHintStage] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [nudgeChoiceId, setNudgeChoiceId] = useState<string | null>(null);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    unlockSotaSpeech();
    return () => {
      cancelSotaSpeech();
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    };
  }, []);

  const firstUnclearedIndex = sotaSpreads.findIndex(
    (spread) => !progress.cleared.includes(spread.id),
  );
  const spreadIndex = activeSpreadId
    ? sotaSpreads.findIndex((item) => item.id === activeSpreadId)
    : firstUnclearedIndex;

  const spread = spreadIndex < 0 ? null : sotaSpreads[spreadIndex];
  const choices = spread ? getChoiceSpreads(spread) : [];
  const clearedSet = new Set(progress.cleared);
  const willComplete = spread
    ? sotaSpreads.every((item) => item.id === spread.id || clearedSet.has(item.id))
    : false;

  function playText(): void {
    if (!spread) return;
    unlockAudio();
    unlockSotaSpeech();
    speakSota(spread.textEn);
  }

  function handleChoice(choice: SotaSpread): void {
    if (!spread || phase === "correct") return;
    unlockAudio();
    unlockSotaSpeech();

    if (choice.id === spread.id) {
      cancelSotaSpeech();
      playChime();
      setActiveSpreadId(spread.id);
      markSotaSpreadCleared(spread.id);
      setNudgeChoiceId(null);
      setPhase("correct");
      return;
    }

    playBuzz();
    setWrongAttempts((count) => count + 1);
    setNudgeChoiceId(choice.id);
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => setNudgeChoiceId(null), 520);
  }

  function handleNext(): void {
    if (!spread) return;
    cancelSotaSpeech();
    setActiveSpreadId(null);
    setPhase("choosing");
    setHintStage(0);
    setWrongAttempts(0);
    setNudgeChoiceId(null);
  }

  if (!spread) {
    return (
      <main className={styles.playShell}>
        <section className={styles.completeCard}>
          <Image
            className={styles.completeCover}
            src={sotaCoverImagePath}
            alt="So-ta The Alien の ひょうし"
            width={300}
            height={428}
            priority
          />
          <div>
            <p className={styles.kicker}>ALL 16 SCENES FOUND</p>
            <h1>ぜんぶ みつけた!</h1>
            <p>ソータの おはなしを、さいしょから よんで みよう。</p>
            <div className={styles.completeActions}>
              <Link className={styles.primaryAction} href="/sota/book">
                えほんを よむ
              </Link>
              <Link className={styles.secondaryAction} href="/sota">
                ほんだなへ
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.playShell}>
      <header className={styles.playTopBar}>
        <Link className={styles.backLink} href="/sota">
          ← ほんだな
        </Link>
        <div className={styles.playCounter} aria-live="polite">
          ばめん {spreadIndex + 1} / {sotaSpreads.length}
        </div>
      </header>

      <section className={styles.storyPrompt}>
        <div className={styles.promptHeading}>
          <div>
            <p className={styles.kicker}>READ, LISTEN, AND FIND</p>
            <h1>よんで、えを みつけよう</h1>
          </div>
          <button className={styles.speakButton} type="button" onClick={playText}>
            <span aria-hidden="true">🔊</span>
            <span>えいごを きく</span>
          </button>
        </div>
        <p className={styles.englishText} lang="en">
          <HighlightedText
            text={spread.textEn}
            keywords={spread.keywords}
            visible={hintStage >= 1}
          />
        </p>
        <SpeedControl className={styles.speedControl} />
      </section>

      <section className={styles.choiceSection} aria-labelledby="choice-title">
        <div className={styles.choiceHeading}>
          <h2 id="choice-title">どの えかな?</h2>
          <p>えを タップ してね。</p>
        </div>
        <div className={styles.choiceGrid}>
          {choices.map((choice, index) => {
            const isCorrectChoice = choice.id === spread.id;
            const showCorrect = phase === "correct" && isCorrectChoice;
            return (
              <button
                key={choice.id}
                type="button"
                data-choice-id={choice.id}
                className={`${styles.choiceCard} ${
                  nudgeChoiceId === choice.id ? styles.choiceNudge : ""
                } ${showCorrect ? styles.choiceCorrect : ""}`}
                onClick={() => handleChoice(choice)}
                disabled={phase === "correct"}
                aria-label={`えの こうほ ${index + 1}`}
              >
                <span className={styles.choiceNumber}>{index + 1}</span>
                <Image
                  src={getSotaImagePath(choice)}
                  alt={`えの こうほ ${index + 1}`}
                  width={240}
                  height={342}
                  priority={index === 0}
                  sizes="(max-width: 700px) 29vw, 240px"
                />
                {showCorrect && <HanamaruMark className={styles.choiceHanamaru} />}
              </button>
            );
          })}
        </div>

        {wrongAttempts > 0 && phase === "choosing" && (
          <div className={styles.retryArea} aria-live="polite">
            <p>もういちど きいて、えを よく みてみよう。</p>
            <button
              className={styles.hintButton}
              type="button"
              onClick={() => setHintStage((stage) => Math.min(3, stage + 1))}
              disabled={hintStage >= 3}
            >
              {hintStage === 0 && "💡 ことばの ヒント"}
              {hintStage === 1 && "💡 えの ヒント"}
              {hintStage === 2 && "💡 にほんごの ヒント"}
              {hintStage >= 3 && "💡 ヒントは ぜんぶ でたよ"}
            </button>
          </div>
        )}

        {hintStage >= 2 && phase === "choosing" && (
          <div className={styles.zoomHint} role="status">
            <div className={styles.zoomWindow}>
              <Image
                src={getSotaImagePath(spread)}
                alt="せいかいの えの いちぶ"
                fill
                sizes="260px"
              />
            </div>
            <p>せいかいの えを、すこしだけ おおきく したよ。</p>
          </div>
        )}

        {hintStage >= 3 && phase === "choosing" && (
          <div className={styles.japaneseHint} role="status">
            <span aria-hidden="true">💡</span>
            <p>{spread.hintJa}</p>
          </div>
        )}
      </section>

      {phase === "correct" && (
        <section className={styles.correctPanel} aria-live="polite">
          <p className={styles.correctBurst}>みつけた!</p>
          <div>
            <p className={styles.summaryLabel}>わかったこと</p>
            <p className={styles.summaryText}>{spread.summaryJa}</p>
          </div>
          {willComplete ? (
            <Link className={styles.nextButton} href="/sota/book">
              えほんを ひらく
            </Link>
          ) : (
            <button className={styles.nextButton} type="button" onClick={handleNext}>
              つぎの ばめん →
            </button>
          )}
        </section>
      )}
    </main>
  );
}
