"use client";

import Link from "next/link";

import { APPS } from "@/app/lib/apps";
import { usePersistentStore } from "@/app/lib/persistentStore";
import { appStars, rewardsStore, totalStars, TREASURES } from "@/app/lib/rewards";

import styles from "./treasures.module.css";

export default function TreasuresPage() {
  const rewards = usePersistentStore(rewardsStore);
  const owned = new Set(rewards.treasures);

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>
          ← いりぐちへ
        </Link>
        <h1 className={styles.title}>🎁 たからもの</h1>
        <p className={styles.summary}>
          <span>⭐ {totalStars(rewards)}</span>
          <span>
            🎁 {owned.size} / {TREASURES.length}
          </span>
        </p>

        <ul className={styles.grid}>
          {TREASURES.map((treasure) => {
            const has = owned.has(treasure.id);
            return (
              <li key={treasure.id} className={has ? styles.owned : styles.locked}>
                <span className={styles.icon} aria-hidden="true">
                  {has ? treasure.icon : "❓"}
                </span>
                <span className={styles.name}>{has ? treasure.name : "？？？"}</span>
                {!has && <span className={styles.hint}>{treasure.hint}</span>}
              </li>
            );
          })}
        </ul>

        <h2 className={styles.subtitle}>へやごとの ⭐</h2>
        <ul className={styles.rooms}>
          {APPS.map((app) => (
            <li key={app.id}>
              <Link href={app.href} className={styles.room}>
                <span aria-hidden="true">{app.icon}</span>
                <span className={styles.roomName}>{app.title}</span>
                <span className={styles.roomStars}>⭐ {appStars(rewards, app.id)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
