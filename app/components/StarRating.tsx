import styles from "./StarRating.module.css";

/** ⭐1〜3 の表示。取れなかった星はうすく出す */
export default function StarRating({ stars, size = "md" }: { stars: number; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`${styles.stars} ${styles[size]}`} role="img" aria-label={`ほし ${stars}こ`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= stars ? styles.on : styles.off} style={{ animationDelay: `${(n - 1) * 0.15}s` }}>
          ★
        </span>
      ))}
    </span>
  );
}
