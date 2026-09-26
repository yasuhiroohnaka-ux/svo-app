"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getTreasure, TREASURE_EVENT, type Treasure } from "@/app/lib/rewards";

import styles from "./TreasureToast.module.css";

/** たからものを手に入れたとき、どの画面でも右下にお知らせを出す(root layout に置く) */
export default function TreasureToast() {
  const [items, setItems] = useState<Treasure[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handle = (event: Event) => {
      const ids = (event as CustomEvent<string[]>).detail ?? [];
      const found = ids.map(getTreasure).filter((treasure): treasure is Treasure => Boolean(treasure));
      if (found.length === 0) return;
      setItems(found);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setItems([]), 6000);
    };
    window.addEventListener(TREASURE_EVENT, handle);
    return () => {
      window.removeEventListener(TREASURE_EVENT, handle);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className={styles.toast} role="status">
      <span className={styles.chest} aria-hidden="true">
        🎁
      </span>
      <div>
        <div className={styles.title}>たからもの ゲット!</div>
        {items.map((treasure) => (
          <div key={treasure.id} className={styles.item}>
            {treasure.icon} {treasure.name}
          </div>
        ))}
        <Link href="/treasures" className={styles.link} onClick={() => setItems([])}>
          たからものを みる →
        </Link>
      </div>
    </div>
  );
}
