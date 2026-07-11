"use client";

import { useSyncExternalStore } from "react";
import {
  getDefaultSpeechSpeed,
  getSpeechSpeed,
  setSpeechSpeed,
  SPEECH_SPEED_LEVELS,
  subscribeSpeechSpeed,
} from "@/utils/speak";
import styles from "./SpeedControl.module.css";

/**
 * 読み上げ速度の切り替え(全アプリ共通)。
 * 設定は localStorage 共有なので、どのアプリで変えても全体に効く。
 */
export default function SpeedControl({ className }: { className?: string }) {
  const speed = useSyncExternalStore(subscribeSpeechSpeed, getSpeechSpeed, getDefaultSpeechSpeed);

  return (
    <div className={`${styles.root} ${className ?? ""}`} role="group" aria-label="よみあげスピード">
      <span className={styles.label}>よみあげ</span>
      <div className={styles.buttons}>
        {SPEECH_SPEED_LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            className={speed === level.id ? styles.buttonActive : styles.button}
            onClick={() => setSpeechSpeed(level.id)}
            aria-pressed={speed === level.id}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
}
