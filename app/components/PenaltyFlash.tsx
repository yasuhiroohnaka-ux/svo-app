import styles from "./PenaltyFlash.module.css";

/** タイムトライアルの お手つきで 足された秒数を、タイマーの横に一瞬だけ出す */
export default function PenaltyFlash({ count, seconds }: { count: number; seconds: number }) {
  if (count <= 0) return null;
  return (
    <span key={count} className={styles.flash} aria-live="polite">
      +{seconds}びょう
    </span>
  );
}
