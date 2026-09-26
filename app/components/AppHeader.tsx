import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  title: ReactNode;
  /** アプリのアクセント色(例: "var(--accent-svo)")。タイトルの下線に使う */
  accent?: string;
  backHref?: string;
  backLabel?: string;
  /** 右端に置く操作(設定ボタンなど) */
  right?: ReactNode;
  className?: string;
};

/**
 * 全アプリ共通のヘッダー。左に戻るリンク、中央にアプリ名、右に任意の操作。
 * 各アプリのテーマ(背景)の上に載せても浮かないよう、背景は透明にしている。
 */
export default function AppHeader({
  title,
  accent = "var(--highlight)",
  backHref = "/",
  backLabel = "トップ",
  right,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={`${styles.header} ${className ?? ""}`}
      style={{ "--app-accent": accent } as CSSProperties}
    >
      <Link href={backHref} className={styles.back}>
        <span aria-hidden="true">←</span> {backLabel}
      </Link>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.right}>{right}</div>
    </header>
  );
}
