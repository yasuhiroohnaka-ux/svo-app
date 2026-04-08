import { useCallback, useEffect, useRef, useState } from "react";

import type { AiLevel } from "./types";

export function useVsMode() {
  const [isVsMode, setIsVsMode] = useState(false);
  const [aiLevel, setAiLevel] = useState<AiLevel>("normal");
  const [aiScore, setAiScore] = useState(0);

  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancelAiTurn = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
  }, []);

  const scheduleAiTurn = useCallback(
    (onTakeCard: () => void) => {
      if (!isVsMode) return;

      let delay = 3000;
      if (aiLevel === "easy") delay = 5000 + Math.random() * 3000;
      if (aiLevel === "normal") delay = 3000 + Math.random() * 2000;
      if (aiLevel === "hard") delay = 1500 + Math.random() * 1000;

      cancelAiTurn();
      aiTimeoutRef.current = setTimeout(() => {
        onTakeCard();
        aiTimeoutRef.current = null;
      }, delay);
    },
    [aiLevel, cancelAiTurn, isVsMode],
  );

  const enableVsMode = useCallback(() => {
    setIsVsMode(true);
    setAiScore(0);
  }, []);

  const disableVsMode = useCallback(() => {
    cancelAiTurn();
    setIsVsMode(false);
    setAiScore(0);
  }, [cancelAiTurn]);

  const changeAiLevel = useCallback((level: AiLevel) => {
    setAiLevel(level);
  }, []);

  useEffect(() => () => cancelAiTurn(), [cancelAiTurn]);

  return {
    aiLevel,
    aiScore,
    cancelAiTurn,
    changeAiLevel,
    disableVsMode,
    enableVsMode,
    isVsMode,
    scheduleAiTurn,
    setAiScore,
  };
}
