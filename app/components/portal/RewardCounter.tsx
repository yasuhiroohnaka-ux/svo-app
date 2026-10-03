"use client";

import Link from "next/link";

import { usePersistentStore } from "@/app/lib/persistentStore";
import { rewardsStore, totalStars, TREASURES } from "@/app/lib/rewards";

import styles from "@/app/portal.module.css";

/** ポータル上部の「⭐ いくつ / たからもの いくつ」 */
export default function RewardCounter() {
  const rewards = usePersistentStore(rewardsStore);
  return (
    <Link href="/treasures" className={styles.rewardCounter}>
      <span>⭐ {totalStars(rewards)}</span>
      <span>
        🎁 {rewards.treasures.length} / {TREASURES.length}
      </span>
      <span className={styles.rewardLink}>たからもの →</span>
    </Link>
  );
}
