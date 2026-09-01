"use client";

import Image from "next/image";
import Link from "next/link";
import { getSotaImagePath, sotaCoverImagePath, sotaSpreads } from "../lib/book";
import { useSotaProgress } from "../lib/progress";
import styles from "../sota.module.css";

export default function SotaShelf() {
  const progress = useSotaProgress();
  const cleared = new Set(progress.cleared);
  const clearedCount = sotaSpreads.filter((spread) => cleared.has(spread.id)).length;
  const allCleared = clearedCount === sotaSpreads.length;

  return (
    <main className={styles.pageShell}>
      <div className={styles.topBar}>
        <Link className={styles.backLink} href="/">
          ← もどる
        </Link>
        <span className={styles.eyebrow}>A READ-AND-FIND STORY</span>
      </div>

      <section className={styles.shelfHero}>
        <div className={styles.coverFrame}>
          <Image
            src={sotaCoverImagePath}
            alt="So-ta The Alien の ひょうし"
            width={360}
            height={513}
            priority
            sizes="(max-width: 700px) 68vw, 360px"
          />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>よんで、えを みつける</p>
          <h1 className={styles.bookTitle}>
            So-ta The Alien<span>(ソータザエイリアン)</span>
          </h1>
          <p className={styles.heroLead}>
            えいぶんを よんで、ぴったりの えを みつけよう。
            <br />
            16この ばめんを ぜんぶ みつけると、えほんが ひらくよ。
          </p>
          <div className={styles.progressPanel} role="status" aria-live="polite">
            <div className={styles.progressNumbers}>
              <strong>{clearedCount}</strong>
              <span> / {sotaSpreads.length} みつけた</span>
            </div>
            <div className={styles.progressTrack} aria-hidden="true">
              <span style={{ width: `${(clearedCount / sotaSpreads.length) * 100}%` }} />
            </div>
          </div>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/sota/play">
              {allCleared ? "もういちど みる" : "あそぶ"}
            </Link>
            {allCleared ? (
              <Link className={styles.secondaryAction} href="/sota/book">
                よみきかせ
              </Link>
            ) : (
              <div className={styles.lockedAction} aria-disabled="true">
                <span aria-hidden="true">🔒</span> よみきかせ
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.shelfSection} aria-labelledby="sota-scenes-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>MY STORY SHELF</p>
            <h2 id="sota-scenes-title">みつけた ばめん</h2>
          </div>
          <p>みつけた えには ⭐が つくよ。</p>
        </div>
        <div className={styles.sceneGrid}>
          {sotaSpreads.map((spread, index) => {
            const isCleared = cleared.has(spread.id);
            return (
              <article
                key={spread.id}
                className={`${styles.sceneCard} ${isCleared ? styles.sceneCardCleared : ""}`}
              >
                <div className={styles.sceneThumb}>
                  <Image
                    src={getSotaImagePath(spread)}
                    alt={`ばめん ${index + 1} の せんが`}
                    width={240}
                    height={342}
                    sizes="(max-width: 600px) 42vw, (max-width: 1000px) 22vw, 210px"
                  />
                  {isCleared && (
                    <span className={styles.clearedStar} aria-label="みつけた">
                      ⭐
                    </span>
                  )}
                </div>
                <div className={styles.sceneMeta}>
                  <span>ばめん {index + 1}</span>
                  <strong>{isCleared ? "みつけた!" : "これから"}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className={styles.sotaFooter}>
        Text and illustrations © 2016 Yasuhiro Ohnaka
      </footer>
    </main>
  );
}
