import Link from "next/link";
import type { Metadata } from "next";
import styles from "./portal.module.css";

export const metadata: Metadata = {
  title: "Puzzle Grammar - English Learning Games",
  description: "Fun English learning games for kids. Practice grammar with SVO puzzles and quiz cards!",
};

const apps = [
  {
    href: "/puzzle-grammar",
    className: styles.cardPuzzle,
    icon: "🧩",
    title: "Puzzle\nGrammar",
    desc: "絵に合わせて主語・動詞・目的語のピースをつなげて、英語の文を完成させるパズルです。",
    tags: ["SVO", "PUZZLE"],
    soon: false,
  },
  {
    href: "/svo",
    className: styles.cardSvo,
    icon: "🎴",
    title: "SVO\nKaruta",
    desc: "読み上げられた英語の文に合う絵をすばやく取る、かるた形式のゲームです。",
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
    soon: false,
  },
  {
    href: "/guess-it",
    className: styles.cardGuess,
    icon: "🔍",
    title: "Word\nDetective",
    desc: "Yes/No質問をタップして、ひみつのお題を当てる英語ゲームです。",
    tags: ["YES/NO", "VOICE", "AI"],
    soon: false,
  },
  {
    href: "/phonics",
    className: styles.cardPhonics,
    icon: "🔊",
    title: "oto-man",
    desc: "おとを聞いて、カードをえらんだり、ことばを作ったりして遊べます。",
    tags: ["おと", "ことば", "カード"],
    soon: false,
  },
  {
    href: "/phonics-maze",
    className: styles.cardMaze,
    icon: "MZ",
    title: "Phonics\nMaze",
    desc: "フォニックスの音をたどってゴールへ。通ったリズムをぜんぶ聞いてから正解チェックします。",
    tags: ["PHONICS", "MAZE", "VOICE"],
    soon: false,
  },
  {
    href: "/storyquiz",
    className: styles.cardStory,
    icon: "📖",
    title: "Story\nQuiz",
    desc: "短い英語ストーリーを聞いて、日本語クイズに答える読解ゲームです。",
    tags: ["STORY", "VOICE", "QUIZ"],
    soon: false,
  },
  {
    href: "/sota",
    className: styles.cardSota,
    icon: "👽",
    title: "So-ta The Alien(ソータザエイリアン)",
    desc: "えいぶんを よんで、ぴったりの えを みつけよう。ぜんぶ みつけると、えほんが ひらくよ。",
    tags: ["STORY", "VOICE", "PICTURE"],
    soon: false,
  },
  {
    href: "/ymeyme-rhyme",
    className: styles.cardRhyme,
    icon: "📜",
    title: "Ymeyme\nRhyme",
    desc: "毎月の英語の詩を読み上げで聞けます。作者・時代・語りつがれかたの解説つき。",
    tags: ["POEM", "VOICE", "RHYME"],
    soon: false,
  },
];

export default function PortalPage() {
  return (
    <main className={styles.portal}>
      <header className={styles.header}>
        <div className={styles.stars}>☀️ ☁️ ☀️</div>
        <h1 className={styles.logo}>
          PUZZLE
          <br />
          GRAMMAR
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
                  <span key={tag} className={styles.cardTag}>
                    {tag}
                  </span>
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
                  <span key={tag} className={styles.cardTag}>
                    {tag}
                  </span>
                ))}
              </div>
              <span className={styles.cardArrow}>-&gt;</span>
            </Link>
          ),
        )}
      </div>

      <footer className={styles.footer}>(c) 2026 Yasuhiro Ohnaka - All rights reserved</footer>
    </main>
  );
}
