import { useCallback, useEffect, useRef, useState } from "react";

import type { GameState } from "./types";

type UseGameTimerOptions = {
  shouldTrackElapsedOnCountdownFinish: boolean;
};

export function useGameTimer({
  shouldTrackElapsedOnCountdownFinish,
}: UseGameTimerOptions) {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    const startTime = Date.now();
    timerStartRef.current = startTime;
    setElapsedTime(0);
    stopTimer();

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setElapsedTime((now - startTime) / 1000);
    }, 100);
  }, [stopTimer]);

  const pauseTimer = useCallback(() => {
    stopTimer();
  }, [stopTimer]);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    timerStartRef.current = now - elapsedTime * 1000;
    stopTimer();

    timerIntervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      setElapsedTime((currentTime - timerStartRef.current) / 1000);
    }, 100);
  }, [elapsedTime, stopTimer]);

  const resetGameTimer = useCallback(() => {
    stopTimer();
    timerStartRef.current = 0;
    setElapsedTime(0);
    setCountdown(3);
    setGameState("idle");
  }, [stopTimer]);

  const startGame = useCallback(() => {
    stopTimer();
    setElapsedTime(0);
    setCountdown(3);
    setGameState("countdown");
  }, [stopTimer]);

  const togglePause = useCallback(() => {
    if (gameState === "playing") {
      setGameState("paused");
      pauseTimer();
    } else if (gameState === "paused") {
      setGameState("playing");
      resumeTimer();
    }
  }, [gameState, pauseTimer, resumeTimer]);

  useEffect(() => {
    if (gameState !== "countdown") return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((current) => current - 1), 1000);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setGameState("playing");
      if (shouldTrackElapsedOnCountdownFinish) {
        startTimer();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, gameState, shouldTrackElapsedOnCountdownFinish, startTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  return {
    countdown,
    elapsedTime,
    gameState,
    resetGameTimer,
    setGameState,
    startGame,
    startTimer,
    stopTimer,
    togglePause,
  };
}
