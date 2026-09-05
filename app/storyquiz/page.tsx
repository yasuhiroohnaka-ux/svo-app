"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { getIssues } from "./lib/data";
import { useAllProgress } from "./lib/progress";
import type { IssueId, StoryPart } from "./types";
import styles from "./storyquiz.module.css";

function groupPartsByChapter(parts: StoryPart[]) {
  const chapters = new Map<
    number,
    { chapterNo: number; chapterTitle: string; parts: StoryPart[] }
  >();

  parts.forEach((part) => {
    const chapter = chapters.get(part.chapterNo);
    if (chapter) {
      chapter.parts.push(part);
      return;
    }

    chapters.set(part.chapterNo, {
      chapterNo: part.chapterNo,
      chapterTitle: part.chapterTitle,
      parts: [part],
    });
  });

  return Array.from(chapters.values());
}

export default function StoryQuizHome() {
  const issues = getIssues();
  const [activeIssue, setActiveIssue] = useState<IssueId>("mini");
  const progress = useAllProgress();
  const currentIssue = issues.find((issue) => issue.issue === activeIssue) ?? issues[0];
  const chapters = groupPartsByChapter(currentIssue.parts);

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
            {issue.issue === "mini" ? "はじめて" : issue.issue === "no1" ? "no.1" : "no.2"}
          </button>
        ))}
      </nav>

      <section className={styles.episodeGroup}>
        <div className={styles.issueHeader}>
          <h2 className={styles.chapterTitle}>{currentIssue.title}</h2>
          <p className={styles.issueDescription}>{currentIssue.description}</p>
        </div>

        {chapters.length > 0 ? (
          <div className={styles.storyChapterList}>
            {chapters.map((chapter) => (
              <section key={chapter.chapterNo} className={styles.storyChapter}>
                <header className={styles.storyChapterHeader}>
                  <span className={styles.storyNumber}>STORY {chapter.chapterNo}</span>
                  <h3 className={styles.storyTitle}>{chapter.chapterTitle}</h3>
                </header>

                <div className={styles.partGrid}>
                  {chapter.parts.map((part) => {
                    const completed = progress[part.id]?.completed;
                    return (
                      <Link
                        key={part.id}
                        href={`/storyquiz/${part.id}/words`}
                        className={styles.partCard}
                      >
                        {part.segments[0]?.image && <Image unoptimized
                          className={styles.storyThumbnail} src={part.segments[0].image}
                          alt="" width={360} height={240} sizes="(max-width: 700px) 80vw, 320px" />}
                        {completed && <span className={styles.partClearStar}>⭐</span>}
                        <div className={styles.partLabel}>
                          {part.chapterNo}-{part.partNo}
                        </div>
                        <p className={styles.partName}>{part.partTitle}</p>
                        <div className={styles.partMeta}>
                            <span className={styles.partTag}>{part.recommendedGrade}</span>
                            {part.estimatedMinutes && <span className={styles.partTag}>{part.estimatedMinutes}</span>}
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
              </section>
            ))}
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
