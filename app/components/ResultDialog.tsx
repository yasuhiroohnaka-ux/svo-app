"use client";

import { useEffect, useId, type ReactNode } from "react";

import HanamaruMark from "./HanamaruMark";
import styles from "./ResultDialog.module.css";

export type ResultAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

type ResultDialogProps = {
  title: ReactNode;
  /** true ではなまるを出す。任意の要素(絵文字など)も渡せる */
  mark?: boolean | ReactNode;
  /** 大きく見せる結果(スコアやタイム) */
  highlight?: ReactNode;
  children?: ReactNode;
  actions: ResultAction[];
  /** Esc キーや背景タップで閉じるときの処理。なければ閉じられない */
  onClose?: () => void;
};

/**
 * ゲーム終了・クリア時に出す共通の結果ダイアログ。
 * alert() の代わりに、はなまる・結果・次の行動ボタンをまとめて見せる。
 */
export default function ResultDialog({ title, mark, highlight, children, actions, onClose }: ResultDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!onClose) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        {mark === true ? (
          <HanamaruMark className={styles.hanamaru} />
        ) : mark ? (
          <div className={styles.mark}>{mark}</div>
        ) : null}
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {highlight !== undefined && <div className={styles.highlight}>{highlight}</div>}
        {children && <div className={styles.body}>{children}</div>}
        <div className={styles.actions}>
          {actions.map((action, index) => (
            <button
              key={action.label}
              type="button"
              className={action.variant === "secondary" ? styles.secondary : styles.primary}
              onClick={action.onClick}
              autoFocus={index === 0 && !children}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
