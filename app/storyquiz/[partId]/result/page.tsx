"use client";

import Link from "next/link";
import { useMemo, use } from "react";
import { getNextPart, getPartById } from "../../lib/data";
import { usePartProgress } from "../../lib/progress";
import styles from "../../storyquiz.module.css";

type SearchParams = Promise<{ c?: string; t?: string }>;

function toSafeCount(value: string | undefined) {
  return Math.max(0, Number(value ?? "0") || 0);
}

export default function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ partId: string }>;
  searchParams: SearchParams;
}) {
  const { partId } = use(params);
  const sp = use(searchParams);
  const part = getPartById(partId);
  const nextPart = part ? getNextPart(part.id) : null;
  const storedProgress = usePartProgress(partId);

  const score = useMemo(() => {
    const queryScore = {
      correct: toSafeCount(sp.c),
      total: toSafeCount(sp.t),
    };
    if (queryScore.total > 0) return queryScore;
    if (!storedProgress) return queryScore;
    return {
      correct: storedProgress.correctCount,
      total: storedProgress.totalQuestions,
    };
  }, [sp.c, sp.t, storedProgress]);

  if (!part) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <p>パートが見つかりません。</p>
          <Link href="/storyquiz" className={styles.backLink}>
            ← もどる
          </Link>
        </div>
      </main>
    );
  }

  const summaryLines = part.segments.map(
    (segment) => segment.summaryJa ?? segment.feedbackCorrectJa,
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.kicker}>STEP 3 / 3</div>
          <h1 className={styles.title}>よめた！</h1>
        </div>
        <Link href="/storyquiz" className={styles.backLink}>
          ← 一覧へ
        </Link>
      </header>

      <div className={styles.resultWrap}>
        <section className={styles.resultCard}>
          <div className={styles.resultBigHeadline}>🎉 よめた！</div>
          <h2 className={styles.resultHeadline}>
            {part.chapterTitle} {part.chapterNo}-{part.partNo}
          </h2>
          <p className={styles.resultPartTitle}>{part.partTitle}</p>

          <div className={styles.resultSummary}>
            <div className={styles.resultSummaryTitle}>
              きょうのおはなしでわかったこと
            </div>
            <ul className={styles.resultSummaryList}>
              {summaryLines.map((line, idx) => (
                <li key={idx} className={styles.resultSummaryItem}>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.resultBadge}>⭐ Story Clear!</div>
          <p className={styles.resultScoreSmall}>
            えらべたクイズ {score.correct} / {score.total}
          </p>
        </section>

        <div className={styles.resultActions}>
          <Link
            href={`/storyquiz/${part.id}/words`}
            className={styles.navBtnSecondary}
          >
            もういちど
          </Link>
          {nextPart ? (
            <Link
              href={`/storyquiz/${nextPart.id}/words`}
              className={styles.navBtnPrimary}
            >
              次のパートへ
            </Link>
          ) : (
            <Link href="/storyquiz" className={styles.navBtnPrimary}>
              一覧へ戻る
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
