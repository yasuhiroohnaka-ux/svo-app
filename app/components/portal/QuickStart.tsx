"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { getApp } from "@/app/lib/apps";
import { usePersistentStore } from "@/app/lib/persistentStore";
import { localDateStamp } from "@/app/lib/random";
import { rewardsStore } from "@/app/lib/rewards";
import { lastVisitStore } from "@/app/lib/visits";

import styles from "@/app/portal.module.css";

const noopSubscribe = () => () => {};

/**
 * 「つづきから」と「きょうの ダンジョン」。
 * どちらもブラウザの記録と日付で決まるので、サーバー描画では空にしておく。
 */
export default function QuickStart() {
  const lastAppId = usePersistentStore(lastVisitStore);
  const rewards = usePersistentStore(rewardsStore);
  const today = useSyncExternalStore(noopSubscribe, () => localDateStamp(), () => "");
  const lastApp = lastAppId ? getApp(lastAppId) : undefined;

  if (!today) return <div className={styles.quickStart} aria-hidden="true" />;

  const doneToday = rewards.daily.lastDate === today;
  const streakAlive = doneToday || rewards.daily.lastDate === localDateStamp(new Date(), -1);
  const streak = streakAlive ? rewards.daily.streak : 0;

  return (
    <nav className={styles.quickStart} aria-label="すぐに あそぶ">
      <Link href="/daily" className={styles.quickButton} style={{ "--card-accent": "#ffe066" } as React.CSSProperties}>
        <span className={styles.quickLabel}>
          🗝️ きょうの ダンジョン{streak > 0 ? ` ・ 🔥 ${streak}にち れんぞく` : ""}
        </span>
        <span className={styles.quickTitle}>{doneToday ? "クリアずみ! もういちど?" : "5もんに ちょうせん!"}</span>
      </Link>
      {lastApp && (
        <Link href={lastApp.href} className={styles.quickButton} style={{ "--card-accent": lastApp.accent } as React.CSSProperties}>
          <span className={styles.quickLabel}>▶ つづきから</span>
          <span className={styles.quickTitle}>
            {lastApp.icon} {lastApp.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
