"use client";

import { useSyncExternalStore } from "react";

import type { AppId } from "@/app/lib/apps";
import { usePersistentStore } from "@/app/lib/persistentStore";
import { appStars, rewardsStore } from "@/app/lib/rewards";
import { correctWordsStore } from "@/app/phonics/progress";
import { sotaSpreads } from "@/app/sota/lib/book";
import { useSotaProgress } from "@/app/sota/lib/progress";
import { getAllParts } from "@/app/storyquiz/lib/data";
import { useAllProgress } from "@/app/storyquiz/lib/progress";
import { formatTime, getRanking } from "@/utils/ranking";

import styles from "@/app/portal.module.css";

const noopSubscribe = () => () => {};

/** タイムトライアルの自己ベスト(どの枚数でも一番速いもの)。文字列なのでスナップショットが安定する */
function useBestTime(appKey: string): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const best = [...getRanking(appKey)].sort((a, b) => a.time - b.time)[0];
      return best ? `${formatTime(best.time)}(${best.cards}まい)` : "";
    },
    () => "",
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className={styles.roomStatus}>{children}</span>;
}

function StoryStatus() {
  const progress = useAllProgress();
  const parts = getAllParts();
  const cleared = parts.filter((part) => progress[part.id]?.completed).length;
  return cleared > 0 ? <Pill>⭐ {cleared} / {parts.length} クリア</Pill> : null;
}

function SotaStatus() {
  const progress = useSotaProgress();
  const found = sotaSpreads.filter((spread) => progress.cleared.includes(spread.id)).length;
  return found > 0 ? <Pill>🎨 {found} / {sotaSpreads.length} みつけた</Pill> : null;
}

function PhonicsStatus() {
  const correctWords = usePersistentStore(correctWordsStore);
  const count = Object.values(correctWords).reduce((sum, words) => sum + words.length, 0);
  return count > 0 ? <Pill>✨ きょう {count}こ せいかい</Pill> : null;
}

function BestTimeStatus({ appKey }: { appKey: string }) {
  const best = useBestTime(appKey);
  return best ? <Pill>🏆 ベスト {best}</Pill> : null;
}

const STATUS: Partial<Record<AppId, () => React.ReactNode>> = {
  story: () => <StoryStatus />,
  sota: () => <SotaStatus />,
  phonics: () => <PhonicsStatus />,
  svo: () => <BestTimeStatus appKey="svo" />,
  quiz: () => <BestTimeStatus appKey="quiz" />,
};

/** 部屋カードの下に出す、その部屋での進み具合(⭐ と、アプリごとの記録) */
export default function RoomStatus({ appId }: { appId: AppId }) {
  const rewards = usePersistentStore(rewardsStore);
  const stars = appStars(rewards, appId);
  return (
    <>
      {stars > 0 && <Pill>⭐ {stars}</Pill>}
      {STATUS[appId]?.()}
    </>
  );
}
