import Link from "next/link";

import type { RecordResult } from "@/app/lib/rewards";

import StarRating from "./StarRating";
import styles from "./RewardSummary.module.css";

/** 結果画面に出す「⭐ いくつ・ベスト更新・たからもの」 */
export default function RewardSummary({ result }: { result: RecordResult }) {
  return (
    <div className={styles.summary}>
      <StarRating stars={result.stars} size="lg" />
      {result.gained > 0 && result.previousBest > 0 && <p className={styles.best}>ベスト きろく! ⭐ +{result.gained}</p>}
      {result.gained > 0 && result.previousBest === 0 && <p className={styles.best}>⭐ +{result.gained}</p>}
      {result.gained === 0 && result.stars < 3 && <p className={styles.note}>つぎは ⭐{result.stars + 1}を めざそう!</p>}
      {result.newTreasures.length > 0 && (
        <Link href="/treasures" className={styles.treasure}>
          🎁 たからもの ゲット!
          {result.newTreasures.map((treasure) => (
            <span key={treasure.id} className={styles.treasureItem}>
              {treasure.icon} {treasure.name}
            </span>
          ))}
        </Link>
      )}
    </div>
  );
}
