"use client";

import Link from "next/link";
import { useState } from "react";
import { getIssues } from "./lib/data";
import { useAllProgress } from "./lib/progress";
import type { IssueId } from "./types";
import styles from "./storyquiz.module.css";

export default function StoryQuizHome() {
  const issues = getIssues();
  const [activeIssue, setActiveIssue] = useState<IssueId>("no1");
  const progress = useAllProgress();
  const currentIssue = issues.find((issue) => issue.issue === activeIssue) ?? issues[0];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.kicker}>STORY QUIZ</div>
          <h1 className={styles.title}>えほんで えいご</h1>
          <p className={styles.lead}>
            短い英語ストーリーを聞いて、日本語クイズに答えよう。
          </p>
        </div>
        <Link href="/" className={styles.backLink}>
          ← ポータルへ
        </Link>
      </header>

      <nav className={styles.issueTabs} aria-label="Story Quiz issues">
        {issues.map((issue) => (
          <button
            key={issue.issue}
            type="button"
            className={`${styles.issueTab} ${
              activeIssue === issue.issue ? styles.issueTabActive : ""
            }`}
            onClick={() => setActiveIssue(issue.issue)}
          >
            {issue.issue === "no1" ? "no.1" : "no.2"}
          </button>
        ))}
      </nav>

      <section className={styles.episodeGroup}>
        <div className={styles.issueHeader}>
          <h2 className={styles.chapterTitle}>{currentIssue.title}</h2>
          <p className={styles.issueDescription}>{currentIssue.description}</p>
        </div>

        {currentIssue.parts.length > 0 ? (
          <div className={styles.partGrid}>
            {currentIssue.parts.map((part) => {
              const completed = progress[part.id]?.completed;
              return (
                <Link
                  key={part.id}
                  href={`/storyquiz/${part.id}/words`}
                  className={styles.partCard}
                >
                  {completed && <span className={styles.partClearStar}>⭐</span>}
                  <div className={styles.partLabel}>
                    {part.chapterNo}-{part.partNo}
                  </div>
                  <p className={styles.partName}>{part.partTitle}</p>
                  <div className={styles.partMeta}>
                    <span className={styles.partTag}>{part.recommendedGrade}</span>
                    <span className={styles.partTag}>
                      WORDS {part.keywords.length}
                    </span>
                    <span className={styles.partTag}>
                      QUIZ {part.segments.length}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={styles.comingSoonPanel}>
            <div className={styles.comingSoonIcon}>✨</div>
            <h3>Coming soon</h3>
            <p>この号のストーリーは準備中です。</p>
          </div>
        )}
      </section>
    </main>
  );
}
