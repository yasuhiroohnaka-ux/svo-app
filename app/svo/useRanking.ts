import { useCallback, useEffect, useState } from "react";

import { getRankPosition, getRanking, rankingForCards, saveRanking, type RankEntry } from "@/utils/ranking";

type UseRankingOptions = {
  appKey: string;
  onRegistered?: () => void;
};

export function useRanking({ appKey, onRegistered }: UseRankingOptions) {
  const [showRanking, setShowRanking] = useState(false);
  const [allEntries, setAllEntries] = useState<RankEntry[]>([]);
  /** ランキング表に出す枚数(枚数が違うタイムは比べない) */
  const [rankingCards, setRankingCards] = useState(0);
  const [pendingEntry, setPendingEntry] = useState<RankEntry | null>(null);
  /** クリアしたタイムの順位。ランク外なら null */
  const [pendingRank, setPendingRank] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [resultVisible, setResultVisible] = useState(false);

  useEffect(() => {
    setAllEntries(getRanking(appKey));
  }, [appKey]);

  const promptForRankingEntry = useCallback(
    (entry: RankEntry) => {
      const entries = getRanking(appKey);
      setAllEntries(entries);
      setPendingEntry(entry);
      setPendingRank(getRankPosition(entries, entry.cards, entry.time));
      setRankingCards(entry.cards);
      setPlayerName("");
      setResultVisible(true);
    },
    [appKey],
  );

  const handleRankingRegister = useCallback(() => {
    if (!pendingEntry) return;

    if (pendingRank !== null) {
      saveRanking(appKey, { ...pendingEntry, name: playerName.trim() || "Anonymous" });
      setAllEntries(getRanking(appKey));
      setShowRanking(true);
    }
    setResultVisible(false);
    onRegistered?.();
  }, [appKey, onRegistered, pendingEntry, pendingRank, playerName]);

  const openRanking = useCallback(
    (cards: number) => {
      setAllEntries(getRanking(appKey));
      setRankingCards(cards);
      setShowRanking(true);
    },
    [appKey],
  );

  return {
    handleRankingRegister,
    openRanking,
    pendingEntry,
    pendingRank,
    playerName,
    promptForRankingEntry,
    rankingCards,
    rankingData: rankingForCards(allEntries, rankingCards),
    resultVisible,
    setPlayerName,
    setShowRanking,
    showRanking,
  };
}
