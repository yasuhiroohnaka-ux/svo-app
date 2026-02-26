import Link from "next/link";
import styles from "./portal.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puzzle Grammar - English Learning Games",
  description: "Fun English learning games for kids. Practice grammar with SVO puzzles and quiz cards!",
};

const apps = [
  {
    href: "/svo",
    className: styles.cardSvo,
    icon: "🧩",
    title: "Puzzle\nGrammar",
    desc: "主語・動詞・目的語のカードを組み合わせて、英語の文を楽しく学びます。",
    tags: ["SVO", "FLASH", "KARUTA"],
    soon: false,
  },
  {
    href: "/quiz-maker",
    className: styles.cardQuiz,
    icon: "🃏",
    title: "Quiz\nMaker",
    desc: "絵を見て英語の文を選ぶ、カード型クイズゲームです。",
    tags: ["FLASH", "KARUTA", "VOICE"],
    soon: true,
  },
  {
    href: "/phonics",
    className: styles.cardPhonics,
    icon: "🔊",
    title: "oto-man",
    desc: "音を聞いて文字を選び、フォニックスを遊びながら学べます。",
    tags: ["SOUND", "PUZZLE", "SPEAK"],
    soon: true,
  },
  {
    href: "#",
    className: styles.cardSoon,
    icon: "✨",
    title: "Coming\nSoon",
    desc: "新しいゲームを準備中です。お楽しみに！",
    tags: ["SOON"],
    soon: true,
  },
];

export default function PortalPage() {
  return (
    <main className={styles.portal}>
      <header className={styles.header}>
        <div className={styles.stars}>★ ★ ★</div>
        <h1 className={styles.logo}>
          PUZZLE<br />GRAMMAR
        </h1>
        <p className={styles.subtitle}>English Learning Games</p>
      </header>

      <div className={styles.grid}>
        {apps.map((app) =>
          app.soon ? (
            <div key={app.href} className={`${styles.card} ${app.className}`}>
              <span className={styles.cardIcon}>{app.icon}</span>
              <div className={styles.cardTitle}>{app.title}</div>
              <p className={styles.cardDesc}>{app.desc}</p>
              <div>
                {app.tags.map((tag) => (
                  <span key={tag} className={styles.cardTag}>{tag}</span>
                ))}
              </div>
            </div>
          ) : (
            <Link key={app.href} href={app.href} className={`${styles.card} ${app.className}`}>
              <span className={styles.cardIcon}>{app.icon}</span>
              <div className={styles.cardTitle}>{app.title}</div>
              <p className={styles.cardDesc}>{app.desc}</p>
              <div>
                {app.tags.map((tag) => (
                  <span key={tag} className={styles.cardTag}>{tag}</span>
                ))}
              </div>
              <span className={styles.cardArrow}>→→</span>
            </Link>
          )
        )}
      </div>

      <footer className={styles.footer}>
        © 2026 Yasuhiro Ohnaka - All rights reserved
      </footer>
    </main>
  );
}
