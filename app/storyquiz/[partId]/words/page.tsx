"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import KeywordReview from "../../components/KeywordReview";
import { getPartById } from "../../lib/data";
import styles from "../../storyquiz.module.css";

function createRunSeed() {
  return Array.from(crypto.getRandomValues(new Uint32Array(2)))
    .map((value) => value.toString(36))
    .join("-");
}

export default function WordsPage({ params }: { params: Promise<{ partId: string }> }) {
  const { partId } = use(params);
  const router = useRouter();
  const part = getPartById(partId);

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
          <div className={styles.kicker}>STEP 1 / 3</div>
          <h1 className={styles.title}>
            {part.chapterNo}-{part.partNo} {part.partTitle}
          </h1>
        </div>
        <Link href="/storyquiz" className={styles.backLink}>
          ← 一覧へ
        </Link>
      </header>

      <KeywordReview
        keywords={part.keywords}
        onStart={() => {
          const runSeed = createRunSeed();
          router.push(`/storyquiz/${part.id}/play?run=${runSeed}`);
        }}
      />
    </main>
  );
}
