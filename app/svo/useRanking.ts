import { useCallback, useEffect, useState } from "react";

import { getRanking, saveRanking, type RankEntry } from "@/utils/ranking";

type UseRankingOptions = {
  appKey: string;
  onRegistered?: () => void;
};

export function useRanking({ appKey, onRegistered }: UseRankingOptions) {
  const [showRanking, setShowRanking] = useState(false);
  const [rankingData, setRankingData] = useState<RankEntry[]>([]);
  const [pendingEntry, setPendingEntry] = useState<RankEntry | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [nameInputVisible, setNameInputVisible] = useState(false);

  useEffect(() => {
    setRankingData(getRanking(appKey));
  }, [appKey]);

  const promptForRankingEntry = useCallback((entry: RankEntry) => {
    setPendingEntry(entry);
    setPlayerName("");
    setNameInputVisible(true);
  }, []);

  const handleRankingRegister = useCallback(() => {
    if (!pendingEntry) return;

    const entry = { ...pendingEntry, name: playerName || "Anonymous" };
    saveRanking(appKey, entry);
    setNameInputVisible(false);
    setRankingData(getRanking(appKey));
    setShowRanking(true);
    onRegistered?.();
  }, [appKey, onRegistered, pendingEntry, playerName]);

  return {
    handleRankingRegister,
    nameInputVisible,
    pendingEntry,
    playerName,
    promptForRankingEntry,
    rankingData,
    setPlayerName,
    setShowRanking,
    showRanking,
  };
}
