"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

import styles from "./SettingsSheet.module.css";

type SettingsSheetProps = {
  children: ReactNode;
  title?: string;
  /** ⚙️ ボタンの読み上げ用ラベル */
  label?: string;
};

/**
 * AppHeader の右端に置く ⚙️ ボタンと、押すと開く設定シート。
 * 言語・読み上げ速度などの「たまにしか変えない設定」をここにまとめ、
 * プレイ画面にはゲームに必要な操作だけを残す。
 */
export default function SettingsSheet({ children, title = "せってい", label = "せってい" }: SettingsSheetProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span aria-hidden="true">⚙️</span>
      </button>
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.head}>
              <h2 id={titleId} className={styles.title}>
                ⚙️ {title}
              </h2>
              <button type="button" className={styles.close} onClick={() => setOpen(false)} autoFocus>
                とじる
              </button>
            </div>
            <div className={styles.body}>{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

/** 設定シートの 1 項目(見出し + 操作) */
export function SettingsRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>{label}</div>
      <div className={styles.rowControls}>{children}</div>
    </div>
  );
}

type Option<T extends string | number> = { value: T; label: ReactNode };

/** ボタンを並べて 1 つ選ぶ切り替え(オン/オフ、言語など) */
export function SettingsChoice<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.choice} role="group">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={option.value === value ? styles.choiceActive : styles.choiceButton}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
