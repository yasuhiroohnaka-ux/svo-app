"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SpeedControl from "@/app/components/SpeedControl";
import { cancelSpeech, speak, speakQueue, unlockSpeech } from "@/utils/speak";
import {
  BOOKLET_LABELS,
  poemsByBooklet,
  type Booklet,
  type RhymeCommentary,
  type RhymePoem,
} from "./data";
import styles from "./page.module.css";

/** クリックで開く解説の4セクション */
const SECTIONS: { key: keyof RhymeCommentary; icon: string; label: string }[] = [
  { key: "poem", icon: "📖", label: "詩のかいせつ" },
  { key: "author", icon: "✍️", label: "作者について" },
  { key: "era", icon: "🏛️", label: "時代のはなし" },
  { key: "legacy", icon: "🗣️", label: "語りつがれかた" },
];

export default function YmeymeRhymePage() {
  const [booklet, setBooklet] = useState<Booklet>("orange");
  const [selected, setSelected] = useState<RhymePoem | null>(null);
  /** 読み上げ中の行インデックス(-1 = なし) */
  const [readingLine, setReadingLine] = useState(-1);
  const [isReadingAll, setIsReadingAll] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // ページを離れるときは読み上げを止める
  useEffect(() => cancelSpeech, []);

  const stopReading = () => {
    cancelSpeech();
    setIsReadingAll(false);
    setReadingLine(-1);
  };

  const openPoem = (poem: RhymePoem) => {
    stopReading();
    setOpenSections(new Set());
    setSelected(poem);
  };

  const backToList = () => {
    stopReading();
    setSelected(null);
  };

  const readAll = (poem: RhymePoem) => {
    unlockSpeech();
    setIsReadingAll(true);
    speakQueue(
      poem.lines,
      350,
      "en-US",
      () => {
        setIsReadingAll(false);
        setReadingLine(-1);
      },
      (idx) => setReadingLine(idx),
    );
  };

  const readLine = (line: string, idx: number) => {
    unlockSpeech();
    setIsReadingAll(false);
    setReadingLine(idx);
    speak(line, "en-US", () => setReadingLine(-1));
  };

  const toggleSection = (key: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Ymeyme-Rhyme</h1>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              トップ
            </Link>
          </nav>
        </div>
        <p className={styles.subtitle}>イムイムライム 〜毎月の英語の詩〜</p>
      </header>

      {!selected && (
        <>
          <div className={styles.bookletTabs} role="group" aria-label="冊子をえらぶ">
            {(Object.keys(BOOKLET_LABELS) as Booklet[]).map((key) => (
              <button
                key={key}
                type="button"
                className={booklet === key ? styles.bookletTabActive : styles.bookletTab}
                onClick={() => setBooklet(key)}
              >
                {BOOKLET_LABELS[key]}
              </button>
            ))}
          </div>

          <div className={styles.poemGrid}>
            {poemsByBooklet(booklet).map((poem) => (
              <button
                key={poem.id}
                type="button"
                className={styles.poemCard}
                onClick={() => openPoem(poem)}
              >
                <span className={styles.poemCardMonth}>
                  {poem.month}
                  <small>{poem.monthJa}</small>
                </span>
                <span className={styles.poemCardTitle}>{poem.title}</span>
                <span className={styles.poemCardAuthor}>{poem.authorJa ?? poem.author}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <section className={styles.detail}>
          <button type="button" className={styles.backButton} onClick={backToList}>
            ← いちらんへ
          </button>

          <div className={styles.poemHead}>
            <span className={styles.monthBadge}>
              {selected.month}({selected.monthJa})
            </span>
            <h2 className={styles.poemTitle}>{selected.title}</h2>
            {(selected.author || selected.authorJa) && (
              <p className={styles.poemAuthor}>
                {selected.author}
                {selected.author && selected.authorJa ? " / " : ""}
                {selected.authorJa}
              </p>
            )}
          </div>

          <div className={styles.controls}>
            {!isReadingAll ? (
              <button type="button" className={styles.playButton} onClick={() => readAll(selected)}>
                ▶ ぜんぶ よみあげ
              </button>
            ) : (
              <button type="button" className={styles.stopButton} onClick={stopReading}>
                ⏹ とめる
              </button>
            )}
            <span className={styles.hint}>行をタップすると その行だけ 聞けるよ</span>
            <SpeedControl />
          </div>

          <div className={styles.poemBody}>
            {selected.lines.map((line, idx) => (
              <button
                key={`${selected.id}-${idx}`}
                type="button"
                className={readingLine === idx ? styles.lineActive : styles.line}
                onClick={() => readLine(line, idx)}
              >
                {line}
              </button>
            ))}
          </div>

          <div className={styles.sections}>
            {SECTIONS.map(({ key, icon, label }) => {
              const open = openSections.has(key);
              return (
                <div key={key} className={styles.section}>
                  <button
                    type="button"
                    className={open ? styles.sectionButtonOpen : styles.sectionButton}
                    onClick={() => toggleSection(key)}
                    aria-expanded={open}
                  >
                    <span className={styles.sectionIcon}>{icon}</span>
                    <span className={styles.sectionLabel}>{label}</span>
                    <span className={styles.sectionChevron}>{open ? "▲" : "▼"}</span>
                  </button>
                  {open && <p className={styles.sectionBody}>{selected.commentary[key]}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className={styles.footer}>(c) 2026 Yasuhiro Ohnaka - All rights reserved</footer>
    </main>
  );
}
