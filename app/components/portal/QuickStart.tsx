"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { getApp, pickDailyApp } from "@/app/lib/apps";
import { usePersistentStore } from "@/app/lib/persistentStore";
import { lastVisitStore } from "@/app/lib/visits";

import styles from "@/app/portal.module.css";

const noopSubscribe = () => () => {};

function localDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

/** 「つづきから」と「きょうの おすすめ」。どちらもブラウザでしか分からないので、サーバー描画では出さない */
export default function QuickStart() {
  const lastAppId = usePersistentStore(lastVisitStore);
  const dateStamp = useSyncExternalStore(noopSubscribe, localDateStamp, () => "");
  const lastApp = lastAppId ? getApp(lastAppId) : undefined;
  const daily = dateStamp ? pickDailyApp(dateStamp) : undefined;

  if (!lastApp && !daily) return <div className={styles.quickStart} aria-hidden="true" />;

  return (
    <nav className={styles.quickStart} aria-label="すぐに あそぶ">
      {lastApp && (
        <Link href={lastApp.href} className={styles.quickButton} style={{ "--card-accent": lastApp.accent } as React.CSSProperties}>
          <span className={styles.quickLabel}>▶ つづきから</span>
          <span className={styles.quickTitle}>
            {lastApp.icon} {lastApp.title}
          </span>
        </Link>
      )}
      {daily && (
        <Link href={daily.href} className={styles.quickButton} style={{ "--card-accent": daily.accent } as React.CSSProperties}>
          <span className={styles.quickLabel}>🗝️ きょうの おすすめ</span>
          <span className={styles.quickTitle}>
            {daily.icon} {daily.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
