"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback } from "react";
import StoryPlayer from "../../components/StoryPlayer";
import { getPartById } from "../../lib/data";
import { savePartProgress } from "../../lib/progress";
import styles from "../../storyquiz.module.css";

export default function PlayPage({ params }: { params: Promise<{ partId: string }> }) {
  const { partId } = use(params);
  const router = useRouter();
  const part = getPartById(partId);

  const handleComplete = useCallback(
    (summary: { correct: number; total: number }) => {
      if (!part) return;
      savePartProgress({
        partId: part.id,
        correctCount: summary.correct,
        totalQuestions: summary.total,
        clearedAt: new Date().toISOString(),
      });
      router.push(
        `/storyquiz/${part.id}/result?c=${summary.correct}&t=${summary.total}`,
      );
    },
    [part, router],
  );

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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.kicker}>STEP 2 / 3</div>
          <h1 className={styles.title}>{part.chapterTitle}</h1>
        </div>
        <Link href="/storyquiz" className={styles.backLink}>
          ← 一覧へ
        </Link>
      </header>

      <StoryPlayer part={part} onComplete={handleComplete} />
    </main>
  );
}
