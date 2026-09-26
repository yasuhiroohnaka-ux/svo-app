import styles from "./AnswerMark.module.css";

/**
 * 選んだ答えの角に出す ○ / × のしるし。
 * 枠の色(緑・赤)だけに頼らず、形でも正誤が分かるようにする。
 * 親要素に position: relative が必要。
 */
export default function AnswerMark({ correct, placement = "corner" }: { correct: boolean; placement?: "corner" | "end" }) {
  return (
    <span
      className={`${correct ? styles.correct : styles.wrong} ${placement === "end" ? styles.end : ""}`}
      role="img"
      aria-label={correct ? "せいかい" : "ちがうよ"}
    >
      {correct ? "○" : "×"}
    </span>
  );
}
