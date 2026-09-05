"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SpeedControl from "@/app/components/SpeedControl";
import { unlockAudio } from "@/utils/sound";
import { getSotaImagePath, sotaSpreads } from "../lib/book";
import { useSotaProgress } from "../lib/progress";
import { cancelSotaSpeech, speakSota, unlockSotaSpeech } from "../lib/speech";
import styles from "../sota.module.css";

export default function BookReader() {
  const progress = useSotaProgress();
  const [pageIndex, setPageIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const cleared = new Set(progress.cleared);
  const clearedCount = sotaSpreads.filter((spread) => cleared.has(spread.id)).length;
  const isUnlocked = clearedCount === sotaSpreads.length;
  const spread = sotaSpreads[pageIndex];

  useEffect(() => () => cancelSotaSpeech(), []);

  function readPage(): void {
    if (isReading) {
      cancelSotaSpeech();
      setIsReading(false);
      return;
    }
    unlockAudio();
    unlockSotaSpeech();
    setIsReading(true);
    speakSota(spread.textEn, () => setIsReading(false));
  }

  function goToPage(index: number): void {
    cancelSotaSpeech();
    setIsReading(false);
    setPageIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isUnlocked) {
    return (
      <main className={styles.bookShell}>
        <div className={styles.topBar}>
          <Link className={styles.backLink} href="/sota">
            ← ほんだな
          </Link>
        </div>
        <section className={styles.bookLocked}>
          <div className={styles.lockIcon} aria-hidden="true">🔒</div>
          <p className={styles.kicker}>THE BOOK IS WAITING</p>
          <h1>えほんは もうすこし!</h1>
          <p>
            あと {sotaSpreads.length - clearedCount}この ばめんを みつけると、
            <br />
            さいしょから よめるよ。
          </p>
          <Link className={styles.primaryAction} href="/sota/play">
            つづきで あそぶ
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.bookShell}>
      <header className={styles.readerHeader}>
        <Link className={styles.backLink} href="/sota">
          ← ほんだな
        </Link>
        <div>
          <p className={styles.kicker}>READ-ALOUD BOOK</p>
          <h1>So-ta The Alien</h1>
        </div>
        <span className={styles.readerCount} aria-live="polite">
          {pageIndex + 1} / {sotaSpreads.length}
        </span>
      </header>

      <article className={styles.bookSpread}>
        <div className={styles.bookArt}>
          <Image unoptimized
            src={getSotaImagePath(spread)}
            alt={`ばめん ${pageIndex + 1} の え`}
            width={520}
            height={742}
            priority
            sizes="(max-width: 900px) 86vw, 48vw"
          />
        </div>
        <div className={styles.bookTextPage}>
          <div className={styles.bookPageNumber}>SCENE {pageIndex + 1}</div>
          <p lang="en">{spread.textEn}</p>
          <button className={styles.speakButton} type="button" onClick={readPage} aria-pressed={isReading}>
            <span aria-hidden="true">{isReading ? "⏹" : "🔊"}</span>
            <span>{isReading ? "とめる" : "えいごを きく"}</span>
          </button>
          <SpeedControl className={styles.speedControl} />
        </div>
      </article>

      <nav className={styles.readerNav} aria-label="えほんの ばめん">
        <button
          type="button"
          onClick={() => goToPage(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          ← まえの ばめん
        </button>
        {pageIndex < sotaSpreads.length - 1 ? (
          <button type="button" onClick={() => goToPage(pageIndex + 1)}>
            つぎの ばめん →
          </button>
        ) : (
          <button type="button" onClick={() => goToPage(0)}>
            さいしょに もどる
          </button>
        )}
      </nav>
    </main>
  );
}
